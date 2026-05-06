import { useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import './App.css'
import { DrawingCanvas } from './components/DrawingCanvas'
import { AxesBoundsModal, LineSlopeModal } from './components/DrawingModals'
import { PreviewPanel, type CompileResult } from './components/PreviewPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { buildTikzPicture } from './lib/tikz'
import { snapTikzPoint } from './lib/geometry'
import type { DraftElement, DrawingElement, DrawingStyle, GridConfig, LineSubtool, Point, Tool } from './types/drawing'
import { defaultAxesOptions, defaultGridConfig, defaultStyle } from './types/drawing'

const createId = () => crypto.randomUUID()

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('line')
  const [lineSubtool, setLineSubtool] = useState<LineSubtool>('twoPoints')
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [draft, setDraft] = useState<DraftElement | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentStyle, setCurrentStyle] = useState<DrawingStyle>(defaultStyle)
  const [arcAngle, setArcAngle] = useState(90)
  const [axesModalOrigin, setAxesModalOrigin] = useState<Point | null>(null)
  const [lineSlopeAnchor, setLineSlopeAnchor] = useState<Point | null>(null)
  const [gridConfig, setGridConfig] = useState<GridConfig>(defaultGridConfig)
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const selectedElement = elements.find((element) => element.id === selectedId) ?? null
  const tikzCode = useMemo(() => buildTikzPicture(elements), [elements])

  // Refs for menu event handlers to avoid stale closures
  const elementsRef = useRef(elements)
  elementsRef.current = elements
  const compileResultRef = useRef(compileResult)
  compileResultRef.current = compileResult

  const updateElement = (updatedElement: DrawingElement) => {
    setElements((currentElements) =>
      currentElements.map((element) => (element.id === updatedElement.id ? updatedElement : element)),
    )
  }

  const updateStyle = (style: DrawingStyle) => {
    setCurrentStyle(style)
    if (selectedElement) {
      updateElement({ ...selectedElement, style })
    }
  }

  const updateArcAngle = (angle: number) => {
    setArcAngle(angle)
    if (selectedElement?.type === 'arc') {
      updateElement({ ...selectedElement, sweepAngle: angle })
    }
  }

  const compileTikz = async () => {
    setIsCompiling(true)
    setCompileResult(null)

    try {
      const result = await invoke<CompileResult>('compile_tikz', { tikzCode })
      setCompileResult(result)
    } catch (error) {
      setCompileResult({
        success: false,
        log: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsCompiling(false)
    }
  }

  // macOS menu bar event listeners
  useEffect(() => {
    const unlisteners: Array<() => void> = []

    const setupListeners = async () => {
      const ul1 = await listen('menu-new-canvas', () => {
        setElements([])
        setDraft(null)
        setSelectedId(null)
        setAxesModalOrigin(null)
        setLineSlopeAnchor(null)
      })
      unlisteners.push(ul1)

      const ul2 = await listen('menu-compile', async () => {
        setIsCompiling(true)
        setCompileResult(null)
        try {
          const code = buildTikzPicture(elementsRef.current)
          const result = await invoke<CompileResult>('compile_tikz', { tikzCode: code })
          setCompileResult(result)
        } catch (error) {
          setCompileResult({
            success: false,
            log: error instanceof Error ? error.message : String(error),
          })
        } finally {
          setIsCompiling(false)
        }
      })
      unlisteners.push(ul2)

      const ul3 = await listen('menu-copy-code', async () => {
        try {
          await navigator.clipboard.writeText(buildTikzPicture(elementsRef.current))
        } catch {
          // ignore
        }
      })
      unlisteners.push(ul3)

      const ul4 = await listen('menu-open-pdf', async () => {
        const p = compileResultRef.current?.pdfPath
        if (p) {
          try {
            const { openPath } = await import('@tauri-apps/plugin-opener')
            await openPath(p)
          } catch {
            // ignore
          }
        }
      })
      unlisteners.push(ul4)

      const ul5 = await listen('menu-export-pdf', async () => {
        const src = compileResultRef.current?.pdfPath
        if (!src) return
        try {
          const { save } = await import('@tauri-apps/plugin-dialog')
          const dest = await save({
            defaultPath: 'tikz-drawer.pdf',
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
          })
          if (!dest) return
          await invoke('copy_path', { source: src, destination: dest })
        } catch {
          // ignore
        }
      })
      unlisteners.push(ul5)

      const ul6 = await listen('menu-export-png', async () => {
        const pdfPath = compileResultRef.current?.pdfPath
        if (!pdfPath) return
        try {
          const pngPath = await invoke<string>('rasterize_pdf_first_page', { pdfPath })
          const { save } = await import('@tauri-apps/plugin-dialog')
          const dest = await save({
            defaultPath: 'tikz-drawer.png',
            filters: [{ name: 'PNG', extensions: ['png'] }],
          })
          if (!dest) return
          await invoke('copy_path', { source: pngPath, destination: dest })
        } catch {
          // ignore
        }
      })
      unlisteners.push(ul6)
    }

    setupListeners()

    return () => {
      unlisteners.forEach((fn) => fn())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="app-shell">
      <AxesBoundsModal
        open={axesModalOrigin !== null}
        origin={axesModalOrigin}
        onCancel={() => setAxesModalOrigin(null)}
        onConfirm={(bounds) => {
          if (!axesModalOrigin) {
            return
          }
          const element: DrawingElement = {
            id: createId(),
            type: 'axes',
            origin: axesModalOrigin,
            xMin: bounds.xMin,
            xMax: bounds.xMax,
            yMin: bounds.yMin,
            yMax: bounds.yMax,
            style: currentStyle,
            ...defaultAxesOptions,
            manualTicksX: [],
            manualTicksY: [],
          }
          setElements((currentElements) => [...currentElements, element])
          setSelectedId(element.id)
          setAxesModalOrigin(null)
        }}
      />

      <LineSlopeModal
        open={lineSlopeAnchor !== null}
        anchor={lineSlopeAnchor}
        onCancel={() => setLineSlopeAnchor(null)}
        onConfirm={({ slope, x1, x2 }) => {
          if (!lineSlopeAnchor) {
            return
          }
          const { x: Px, y: Py } = lineSlopeAnchor
          const rawStart: Point = { x: x1, y: Py + slope * (x1 - Px) }
          const rawEnd: Point = { x: x2, y: Py + slope * (x2 - Px) }
          const element: DrawingElement = {
            id: createId(),
            type: 'line',
            start: snapTikzPoint(rawStart),
            end: snapTikzPoint(rawEnd),
            style: currentStyle,
          }
          setElements((currentElements) => [...currentElements, element])
          setSelectedId(element.id)
          setLineSlopeAnchor(null)
        }}
      />

      <div className="workspace">
        <Toolbar
          activeTool={activeTool}
          lineSubtool={lineSubtool}
          arcAngle={arcAngle}
          style={currentStyle}
          onArcAngleChange={updateArcAngle}
          onClear={() => {
            setElements([])
            setDraft(null)
            setSelectedId(null)
            setAxesModalOrigin(null)
            setLineSlopeAnchor(null)
          }}
          onLineSubtoolChange={setLineSubtool}
          onStyleChange={updateStyle}
          onToolChange={(tool) => {
            setActiveTool(tool)
            setDraft(null)
            setAxesModalOrigin(null)
            setLineSlopeAnchor(null)
          }}
        />

        <div className="canvas-area">
          <DrawingCanvas
            activeTool={activeTool}
            arcAngle={arcAngle}
            currentStyle={currentStyle}
            draft={draft}
            elements={elements}
            gridConfig={gridConfig}
            lineSubtool={lineSubtool}
            selectedId={selectedId}
            onAxesOriginPick={(origin) => setAxesModalOrigin(origin)}
            onCreate={(element) => {
              setElements((currentElements) => [...currentElements, element])
              setSelectedId(element.id)
            }}
            onDraftChange={setDraft}
            onLineSlopeAnchorPick={(anchor) => setLineSlopeAnchor(anchor)}
            onSelect={setSelectedId}
          />
          <StatusBar
            compileResult={compileResult}
            gridConfig={gridConfig}
            isCompiling={isCompiling}
            onCompile={compileTikz}
            onGridConfigChange={setGridConfig}
          />
        </div>

        <div className={`properties-wrapper ${propertiesOpen ? 'open' : ''}`}>
          <PropertiesPanel
            selectedElement={selectedElement}
            onDelete={(id) => {
              setElements((currentElements) => currentElements.filter((element) => element.id !== id))
              setSelectedId(null)
            }}
            onUpdate={updateElement}
            onClose={() => setPropertiesOpen(false)}
          />
        </div>
      </div>

      <div className={`preview-wrapper ${previewOpen ? 'open' : ''}`}>
        <PreviewPanel
          compileResult={compileResult}
          isCompiling={isCompiling}
          tikzCode={tikzCode}
          onCompile={compileTikz}
          onClose={() => setPreviewOpen(false)}
        />
      </div>

      {/* Collapse/expand handles */}
      {!propertiesOpen && selectedElement && (
        <button
          className="panel-toggle right-toggle"
          type="button"
          onClick={() => setPropertiesOpen(true)}
        >
          属性
        </button>
      )}
      {!previewOpen && (
        <button
          className="panel-toggle bottom-toggle"
          type="button"
          onClick={() => setPreviewOpen(true)}
        >
          TikZ 预览
        </button>
      )}
    </main>
  )
}

export default App
