import { useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './App.css'
import { DrawingCanvas } from './components/DrawingCanvas'
import { AxesBoundsModal, LineSlopeModal } from './components/DrawingModals'
import { PreviewPanel, type CompileResult } from './components/PreviewPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { buildTikzPicture } from './lib/tikz'
import { snapTikzPoint } from './lib/geometry'
import type { DraftElement, DrawingElement, DrawingStyle, LineSubtool, Point, Tool } from './types/drawing'
import { defaultAxesOptions, defaultStyle } from './types/drawing'

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
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const selectedElement = elements.find((element) => element.id === selectedId) ?? null
  const tikzCode = useMemo(() => buildTikzPicture(elements), [elements])

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

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>TikZ Drawer</h1>
          <p>用按钮绘制直线和圆弧，自动生成并编译 TikZ。</p>
        </div>
      </header>

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

        <DrawingCanvas
          activeTool={activeTool}
          arcAngle={arcAngle}
          currentStyle={currentStyle}
          draft={draft}
          elements={elements}
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

        <PropertiesPanel
          selectedElement={selectedElement}
          onDelete={(id) => {
            setElements((currentElements) => currentElements.filter((element) => element.id !== id))
            setSelectedId(null)
          }}
          onUpdate={updateElement}
        />
      </div>

      <PreviewPanel
        compileResult={compileResult}
        isCompiling={isCompiling}
        tikzCode={tikzCode}
        onCompile={compileTikz}
      />
    </main>
  )
}

export default App
