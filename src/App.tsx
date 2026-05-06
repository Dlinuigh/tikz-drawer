import { useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import './App.css'
import { DrawingCanvas } from './components/DrawingCanvas'
import { GridSettingsModal } from './components/GridSettingsModal'
import { ArcCenterRadiusAnglesModal, AxesBoundsModal, CircleRadiusModal, EllipseRadiiModal, IntersectionModal, LineSlopeModal } from './components/DrawingModals'
import type { CompileResult } from './components/PreviewPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { tikzCenterOfElement } from './lib/elementCenter'
import { buildTikzPicture } from './lib/tikz'
import { computeIntersections, coordinateSystemWithOrigin, defaultCoordinateSystem, defaultViewOrigin, snapTikzPoint } from './lib/geometry'
import type { ArcSubtool, CircleSubtool, DraftElement, DrawingElement, DrawingStyle, EllipseSubtool, GridConfig, LineSubtool, Point, Tool } from './types/drawing'
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
  const [circleSubtool, setCircleSubtool] = useState<CircleSubtool>('centerRadius')
  const [ellipseSubtool, setEllipseSubtool] = useState<EllipseSubtool>('centerRadii')
  const [arcSubtool, setArcSubtool] = useState<ArcSubtool>('sweepAngle')
  const [circleRadiusCenter, setCircleRadiusCenter] = useState<Point | null>(null)
  const [ellipseRadiiCenter, setEllipseRadiiCenter] = useState<Point | null>(null)
  const [arcCenterAnglesCenter, setArcCenterAnglesCenter] = useState<Point | null>(null)
  const [intersectionPickIds, setIntersectionPickIds] = useState<string[]>([])
  const [intersectionPoints, setIntersectionPoints] = useState<Point[]>([])
  const [gridConfig, setGridConfig] = useState<GridConfig>(defaultGridConfig)
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [compileOutputOpen, setCompileOutputOpen] = useState(false)
  const [centralTab, setCentralTab] = useState<'canvas' | 'preview'>('canvas')
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [viewOrigin, setViewOrigin] = useState<Point>(() => defaultViewOrigin())
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false)

  const coordinateSystem = useMemo(() => coordinateSystemWithOrigin(viewOrigin), [viewOrigin])

  const [manualCode, setManualCode] = useState('')
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  // Rasterize PDF to PNG, then load as blob URL (bypasses asset: protocol scope issues)
  useEffect(() => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl)
      setPdfBlobUrl(null)
    }
    if (!compileResult?.success || !compileResult.pdfPath) return

    let cancelled = false

    const loadPng = async () => {
      try {
        const pngPath = await invoke<string>('rasterize_pdf_first_page', { pdfPath: compileResult.pdfPath! })
        if (cancelled) return
        const data = await invoke<number[]>('read_file_binary', { filePath: pngPath })
        if (cancelled) return
        const blob = new Blob([new Uint8Array(data)], { type: 'image/png' })
        setPdfBlobUrl(URL.createObjectURL(blob))
      } catch {
        // rasterizer not available
      }
    }

    loadPng()
    return () => { cancelled = true }
  }, [compileResult])

  const selectedElement = elements.find((element) => element.id === selectedId) ?? null
  const tikzCode = useMemo(() => buildTikzPicture(elements, gridConfig), [elements, gridConfig])

  // Refs for menu event handlers to avoid stale closures
  const elementsRef = useRef(elements)
  elementsRef.current = elements
  const compileResultRef = useRef(compileResult)
  compileResultRef.current = compileResult
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const gridConfigRef = useRef(gridConfig)
  gridConfigRef.current = gridConfig

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

  const compileManualCode = async (code: string) => {
    setIsCompiling(true)
    setCompileResult(null)
    try {
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
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(manualCode)
      setCopyHint('✓ 已复制')
      window.setTimeout(() => setCopyHint(null), 2000)
    } catch {
      setCopyHint('复制失败')
      window.setTimeout(() => setCopyHint(null), 2000)
    }
  }

  const downloadPng = async () => {
    const pdfPath = compileResult?.pdfPath
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
      setCopyHint('✓ PNG 已保存')
      window.setTimeout(() => setCopyHint(null), 2000)
    } catch { /* ignore */ }
  }

  const downloadPdf = async () => {
    const pdfPath = compileResult?.pdfPath
    if (!pdfPath) return
    try {
      const { save } = await import('@tauri-apps/plugin-dialog')
      const dest = await save({
        defaultPath: 'tikz-drawer.pdf',
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      })
      if (!dest) return
      await invoke('copy_path', { source: pdfPath, destination: dest })
      setCopyHint('✓ PDF 已保存')
      window.setTimeout(() => setCopyHint(null), 2000)
    } catch { /* ignore */ }
  }

  // Close download menu on outside click
  useEffect(() => {
    if (!downloadMenuOpen) return
    const handler = () => setDownloadMenuOpen(false)
    // delay so the click that opened it doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => { clearTimeout(id); document.removeEventListener('click', handler) }
  }, [downloadMenuOpen])

  // Suppress native right-click context menu throughout the app
  useEffect(() => {
    const handler = (e: MouseEvent) => { e.preventDefault() }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [])

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
        setCircleRadiusCenter(null)
        setEllipseRadiiCenter(null)
        setArcCenterAnglesCenter(null)
        setIntersectionPickIds([])
        setViewOrigin(defaultViewOrigin())
      })
      unlisteners.push(ul1)

      const ulCenter = await listen('menu-center-on-selection', () => {
        const id = selectedIdRef.current
        const el = elementsRef.current.find((e) => e.id === id)
        if (!el) return
        const c = tikzCenterOfElement(el)
        if (!c) return
        const w = defaultCoordinateSystem.width
        const h = defaultCoordinateSystem.height
        const ppu = defaultCoordinateSystem.pixelsPerUnit
        setViewOrigin({ x: w / 2 - c.x * ppu, y: h / 2 + c.y * ppu })
      })
      unlisteners.push(ulCenter)

      const ulReset = await listen('menu-reset-view', () => {
        setViewOrigin(defaultViewOrigin())
      })
      unlisteners.push(ulReset)

      const ulGridCanvas = await listen('menu-grid-toggle-canvas', () => {
        setGridConfig((gc) => ({ ...gc, showGrid: !gc.showGrid }))
      })
      unlisteners.push(ulGridCanvas)

      const ulGridExport = await listen('menu-grid-toggle-export', () => {
        setGridConfig((gc) => ({ ...gc, showGridInExport: !gc.showGridInExport }))
      })
      unlisteners.push(ulGridExport)

      const ulGridSettings = await listen('menu-grid-settings', () => {
        setGridSettingsOpen(true)
      })
      unlisteners.push(ulGridSettings)

      const ulSettings = await listen('menu-settings', () => {
        setGridSettingsOpen(true)
      })
      unlisteners.push(ulSettings)

      const ul2 = await listen('menu-compile', async () => {
        setIsCompiling(true)
        setCompileResult(null)
        try {
          const code = buildTikzPicture(elementsRef.current, gridConfigRef.current)
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
          await navigator.clipboard.writeText(buildTikzPicture(elementsRef.current, gridConfigRef.current))
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

      const ulToggleProp = await listen('menu-toggle-properties', () => {
        setPropertiesOpen((p) => !p)
      })
      unlisteners.push(ulToggleProp)

      const ulToggleTikz = await listen('menu-toggle-tikz', () => {
        setCentralTab('preview')
      })
      unlisteners.push(ulToggleTikz)

      const ulTogglePdf = await listen('menu-toggle-pdf', () => {
        setCentralTab('preview')
      })
      unlisteners.push(ulTogglePdf)

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

      <IntersectionModal
        open={intersectionPoints.length > 0}
        points={intersectionPoints}
        onCancel={() => { setIntersectionPoints([]); setIntersectionPickIds([]) }}
        onConfirm={(names) => {
          const newElements: DrawingElement[] = intersectionPoints.map((pt, i) => ({
            id: createId(),
            type: 'point',
            center: pt,
            label: names[i] ?? '',
            style: currentStyle,
          }))
          setElements((curr) => [...curr, ...newElements])
          setIntersectionPoints([])
          setIntersectionPickIds([])
        }}
      />

      <ArcCenterRadiusAnglesModal
        open={arcCenterAnglesCenter !== null}
        center={arcCenterAnglesCenter}
        onCancel={() => setArcCenterAnglesCenter(null)}
        onConfirm={(center, radius, startAngle, endAngle) => {
          const toRad = (deg: number) => (deg * Math.PI) / 180
          const computedStart: Point = {
            x: center.x + radius * Math.cos(toRad(startAngle)),
            y: center.y + radius * Math.sin(toRad(startAngle)),
          }
          const computedEnd: Point = {
            x: center.x + radius * Math.cos(toRad(endAngle)),
            y: center.y + radius * Math.sin(toRad(endAngle)),
          }
          const element: DrawingElement = {
            id: createId(),
            type: 'arc',
            start: snapTikzPoint(computedStart, undefined, gridConfig.gridStep),
            end: snapTikzPoint(computedEnd, undefined, gridConfig.gridStep),
            sweepAngle: endAngle - startAngle,
            style: currentStyle,
            definitionMode: 'centerRadiusAngles',
            center,
            startAngle,
            endAngle,
            radius,
          }
          setElements((currentElements) => [...currentElements, element])
          setSelectedId(element.id)
          setArcCenterAnglesCenter(null)
        }}
      />

      <CircleRadiusModal
        open={circleRadiusCenter !== null}
        center={circleRadiusCenter}
        onCancel={() => setCircleRadiusCenter(null)}
        onConfirm={(center, radius) => {
          const element: DrawingElement = {
            id: createId(),
            type: 'circle',
            center,
            radiusPoint: { x: center.x + radius, y: center.y },
            style: currentStyle,
          }
          setElements((currentElements) => [...currentElements, element])
          setSelectedId(element.id)
          setCircleRadiusCenter(null)
        }}
      />

      <EllipseRadiiModal
        open={ellipseRadiiCenter !== null}
        center={ellipseRadiiCenter}
        onCancel={() => setEllipseRadiiCenter(null)}
        onConfirm={(center, xRadius, yRadius) => {
          const element: DrawingElement = {
            id: createId(),
            type: 'ellipse',
            center,
            radiusPoint: { x: center.x + xRadius, y: center.y + yRadius },
            style: currentStyle,
          }
          setElements((currentElements) => [...currentElements, element])
          setSelectedId(element.id)
          setEllipseRadiiCenter(null)
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
            start: snapTikzPoint(rawStart, undefined, gridConfig.gridStep),
            end: snapTikzPoint(rawEnd, undefined, gridConfig.gridStep),
            style: currentStyle,
          }
          setElements((currentElements) => [...currentElements, element])
          setSelectedId(element.id)
          setLineSlopeAnchor(null)
        }}
      />

      <div className="workspace">
        <div className="center-column">
          {/* 标签栏 */}
          <div className="center-tab-bar">
            {/* 左侧操作（仅源码页） */}
            <div className="tab-bar-actions tab-bar-actions-left">
              {centralTab === 'preview' && (
                <>
                  <button className="tab-bar-action-btn" type="button" onClick={copyCode}>复制</button>
                  <button
                    className="tab-bar-action-btn"
                    type="button"
                    onClick={() => compileManualCode(manualCode)}
                    disabled={isCompiling}
                  >{isCompiling ? '…' : '编译'}</button>
                </>
              )}
            </div>
            <div className="center-tabs-wrapper">
              <button
                className={`center-tab ${centralTab === 'canvas' ? 'active' : ''}`}
                type="button"
                onClick={() => setCentralTab('canvas')}
              >画布</button>
              <button
                className={`center-tab ${centralTab === 'preview' ? 'active' : ''}`}
                type="button"
                onClick={() => { setManualCode(tikzCode); setCentralTab('preview'); setPropertiesOpen(false); compileManualCode(tikzCode) }}
              >源码</button>
            </div>
            {/* 右侧操作 */}
            <div className="tab-bar-actions tab-bar-actions-right">
              {centralTab === 'canvas' ? (
                <button
                  className={`tab-bar-action-btn${propertiesOpen ? ' open' : ''}`}
                  type="button"
                  onClick={() => setPropertiesOpen((p) => !p)}
                  title={propertiesOpen ? '关闭属性面板' : '打开属性面板'}
                >☰</button>
              ) : (
                <div className="download-btn-group">
                  <button
                    className="tab-bar-action-btn"
                    type="button"
                    onClick={downloadPng}
                    disabled={!compileResult?.success}
                  >下载</button>
                  <button
                    className="tab-bar-action-btn dropdown-arrow"
                    type="button"
                    onClick={() => setDownloadMenuOpen((o) => !o)}
                  >▾</button>
                  {downloadMenuOpen && (
                    <div className="download-menu">
                      <button type="button" onClick={downloadPdf}>PDF</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 标签内容 */}
          {centralTab === 'canvas' && (
            <div className="canvas-area">
              <div className="floating-toolbar">
                <Toolbar
                  activeTool={activeTool}
                  lineSubtool={lineSubtool}
                  circleSubtool={circleSubtool}
                  ellipseSubtool={ellipseSubtool}
                  arcSubtool={arcSubtool}
                  onLineSubtoolChange={setLineSubtool}
                  onCircleSubtoolChange={setCircleSubtool}
                  onEllipseSubtoolChange={setEllipseSubtool}
                  onArcSubtoolChange={setArcSubtool}
                  onToolChange={(tool) => {
                    setActiveTool(tool)
                    setDraft(null)
                    setAxesModalOrigin(null)
                    setLineSlopeAnchor(null)
                    setCircleRadiusCenter(null)
                    setEllipseRadiiCenter(null)
                    setArcCenterAnglesCenter(null)
                    setIntersectionPickIds([])
                  }}
                />
              </div>
              <DrawingCanvas
                activeTool={activeTool}
                arcAngle={arcAngle}
                arcSubtool={arcSubtool}
                circleSubtool={circleSubtool}
                ellipseSubtool={ellipseSubtool}
                coordinateSystem={coordinateSystem}
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
                onCircleRadiusCenterPick={(center) => setCircleRadiusCenter(center)}
                onEllipseRadiiCenterPick={(center) => setEllipseRadiiCenter(center)}
                onArcCenterAnglesCenterPick={(center) => setArcCenterAnglesCenter(center)}
                onIntersectionElementPick={(id) => {
                  setIntersectionPickIds((prev) => {
                    if (prev.includes(id)) return prev
                    const next = [...prev, id]
                    if (next.length === 2) {
                      const elA = elementsRef.current.find((e) => e.id === next[0])
                      const elB = elementsRef.current.find((e) => e.id === next[1])
                      if (elA && elB) {
                        setIntersectionPoints(computeIntersections(elA, elB))
                      }
                      return []
                    }
                    return next
                  })
                }}
                intersectionPickIds={intersectionPickIds}
                onSelect={setSelectedId}
                onViewOriginChange={setViewOrigin}
              />
            </div>
          )}

          {centralTab === 'preview' && (
            <div className="preview-split-layout">
              {/* 分栏区域 */}
              <div className="preview-split-body-area">
                <div className="preview-split-left">
                  <textarea
                    className="code-textarea"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    spellCheck={false}
                  />
                </div>
                <div className="preview-split-right">
                  <div className="preview-split-body pdf">
                    {pdfBlobUrl ? (
                      <img
                        className="pdf-raster-img"
                        src={pdfBlobUrl}
                        alt="PDF 预览"
                      />
                    ) : (
                      <p className="hint" style={{ padding: 16, color: 'var(--text)' }}>
                        请先编译以生成 PDF 预览。
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* 底部：编译输出 */}
              {compileResult && (
                <div className="preview-compile-output">
                  <strong className={compileResult.success ? 'status-success' : 'status-error'}>
                    {compileResult.success ? '编译成功' : '编译失败'}
                  </strong>
                  {compileResult.pdfPath && (
                    <p className="pdf-path-line">PDF：{compileResult.pdfPath}</p>
                  )}
                  <div className="compile-log-scroll">
                    <pre>{compileResult.log}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 编译输出（底部折叠区，仅画布页） */}
          {centralTab === 'canvas' && (
          <div className={`compile-output ${compileOutputOpen ? 'open' : ''}`}>
            <button
              className="compile-output-toggle"
              type="button"
              onClick={() => setCompileOutputOpen((o) => !o)}
            >
              编译日志 {compileOutputOpen ? '▼' : '▲'}
            </button>
            {compileOutputOpen && compileResult && (
              <div className={compileResult.success ? 'compile-log success' : 'compile-log error'}>
                <strong>{compileResult.success ? '编译成功' : '编译失败'}</strong>
                {compileResult.pdfPath && <p className="pdf-path-line">PDF：{compileResult.pdfPath}</p>}
                <div className="compile-log-scroll">
                  <pre>{compileResult.log}</pre>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        <div className={`properties-wrapper ${propertiesOpen ? 'open' : ''}`}>
          <PropertiesPanel
            activeTool={activeTool}
            lineSubtool={lineSubtool}
            circleSubtool={circleSubtool}
            ellipseSubtool={ellipseSubtool}
            arcSubtool={arcSubtool}
            arcAngle={arcAngle}
            currentStyle={currentStyle}
            selectedElement={selectedElement}
            onLineSubtoolChange={setLineSubtool}
            onCircleSubtoolChange={setCircleSubtool}
            onEllipseSubtoolChange={setEllipseSubtool}
            onArcSubtoolChange={setArcSubtool}
            onArcAngleChange={updateArcAngle}
            onStyleChange={updateStyle}
            onDelete={(id) => {
              setElements((currentElements) => currentElements.filter((element) => element.id !== id))
              setSelectedId(null)
            }}
            onUpdate={updateElement}
          />
        </div>
      </div>

      {/* 浮动通知 */}
      {copyHint && <div className="toast-notification">{copyHint}</div>}

      <StatusBar
        gridConfig={gridConfig}
      />

      <GridSettingsModal
        gridConfig={gridConfig}
        open={gridSettingsOpen}
        onClose={() => setGridSettingsOpen(false)}
        onSave={setGridConfig}
      />
    </main>
  )
}

export default App
