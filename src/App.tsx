import { useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './App.css'
import { DrawingCanvas } from './components/DrawingCanvas'
import { PreviewPanel, type CompileResult } from './components/PreviewPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { buildTikzPicture } from './lib/tikz'
import type { DraftElement, DrawingElement, DrawingStyle, Tool } from './types/drawing'
import { defaultStyle } from './types/drawing'

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('line')
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [draft, setDraft] = useState<DraftElement | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentStyle, setCurrentStyle] = useState<DrawingStyle>(defaultStyle)
  const [arcAngle, setArcAngle] = useState(90)
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

      <div className="workspace">
        <Toolbar
          activeTool={activeTool}
          arcAngle={arcAngle}
          style={currentStyle}
          onArcAngleChange={updateArcAngle}
          onClear={() => {
            setElements([])
            setDraft(null)
            setSelectedId(null)
          }}
          onStyleChange={updateStyle}
          onToolChange={(tool) => {
            setActiveTool(tool)
            setDraft(null)
          }}
        />

        <DrawingCanvas
          activeTool={activeTool}
          arcAngle={arcAngle}
          currentStyle={currentStyle}
          draft={draft}
          elements={elements}
          selectedId={selectedId}
          onCreate={(element) => {
            setElements((currentElements) => [...currentElements, element])
            setSelectedId(element.id)
          }}
          onDraftChange={setDraft}
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
