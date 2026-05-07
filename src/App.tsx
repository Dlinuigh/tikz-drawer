import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import './App.css'
import { DrawingCanvas } from './components/DrawingCanvas'
import { GridSettingsModal } from './components/GridSettingsModal'
import {
  ArcCenterRadiusAnglesModal,
  AxesBoundsModal,
  CircleRadiusModal,
  ConicModal,
  EllipseArcAnglesModal,
  EllipseRadiiModal,
  ForeachModal,
  FunctionPlotModal,
  IntersectionModal,
  LineSlopeModal,
  RegularPolygonModal,
  RotateSelectionModal,
} from './components/DrawingModals'
import type { CompileResult } from './components/PreviewPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import {
  anyAxisOrientationShown,
  hasAxisOrientation,
  toggleAxisOrientationVisibility,
} from './lib/axisCanvas'
import { tikzCenterOfElement } from './lib/elementCenter'
import { buildTikzPicture } from './lib/tikz'
import { cycleFromSelectedLines } from './lib/regionCycle'
import { hitClosedShapeAtPoint } from './lib/hitTest'
import {
  computeIntersections,
  coordinateSystemWithOrigin,
  defaultCoordinateSystem,
  defaultViewOrigin,
  snapTikzDelta,
  snapTikzPoint,
} from './lib/geometry'
import { ellipseArcPoint } from './lib/ellipseArcGeometry'
import { computeFunctionPlotMarkers } from './lib/functionPlotMarkers'
import {
  cloneElementWithNewId,
  mirrorElementsAcrossLine,
  rotateElementsAround,
  selectionBoundsCenterTikz,
  translateElement,
} from './lib/elementTransform'
import { polarInputToCartesian } from './lib/polar'
import { splitElementAtIntersectionMarkers } from './lib/splitGeometry'
import type {
  ArcSubtool,
  CircleSubtool,
  ClosedShapeFillSubtool,
  CoordinateInputMode,
  DraftElement,
  DrawingElement,
  DrawingStyle,
  EllipseSubtool,
  FunctionPlotElement,
  GridConfig,
  LineSubtool,
  PolarAngleUnit,
  Point,
  SectorShapeSubtool,
  Tool,
} from './types/drawing'
import {
  defaultAxisLineOptionsFor,
  defaultGridConfig,
  defaultStyle,
  normalizeDrawingStyle,
  withClosedShapeDefaultFillIfApplicable,
} from './types/drawing'

const createId = () => crypto.randomUUID()

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('line')
  const [lineSubtool, setLineSubtool] = useState<LineSubtool>('twoPoints')
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [draft, setDraft] = useState<DraftElement | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [polylineClosed, setPolylineClosed] = useState(false)
  const [coordinateInputMode, setCoordinateInputMode] = useState<CoordinateInputMode>('cartesian')
  const [polarAngleUnit, setPolarAngleUnit] = useState<PolarAngleUnit>('deg')
  const [currentStyle, setCurrentStyle] = useState<DrawingStyle>(defaultStyle)
  const [regularPolygonCorners, setRegularPolygonCorners] = useState<{ center: Point; firstVertex: Point } | null>(
    null,
  )
  const [conicModalOpen, setConicModalOpen] = useState(false)
  const [plotModalOpen, setPlotModalOpen] = useState(false)
  const [foreachModalOpen, setForeachModalOpen] = useState(false)
  const [arcAngle, setArcAngle] = useState(90)
  const [axesModalOrigin, setAxesModalOrigin] = useState<Point | null>(null)
  const [lineSlopeAnchor, setLineSlopeAnchor] = useState<Point | null>(null)
  const [circleSubtool, setCircleSubtool] = useState<CircleSubtool>('centerRadius')
  const [ellipseSubtool, setEllipseSubtool] = useState<EllipseSubtool>('centerRadii')
  const [arcSubtool, setArcSubtool] = useState<ArcSubtool>('sweepAngle')
  const [closedShapeFillSubtool, setClosedShapeFillSubtool] = useState<ClosedShapeFillSubtool>('none')
  const [sectorShapeSubtool, setSectorShapeSubtool] = useState<SectorShapeSubtool>('convexPie')
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

  const [moveToolActive, setMoveToolActive] = useState(false)
  const [mirrorToolActive, setMirrorToolActive] = useState(false)
  const [mirrorFirstPoint, setMirrorFirstPoint] = useState<Point | null>(null)
  const [rotateModalOpen, setRotateModalOpen] = useState(false)
  const [ellipseArcCenter, setEllipseArcCenter] = useState<Point | null>(null)

  const moveSnapshotRef = useRef<Map<string, DrawingElement>>(new Map())
  const moveStartRef = useRef<Point | null>(null)

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

  const selectedId = selectedIds[0] ?? null
  const selectedElement = elements.find((element) => element.id === selectedId) ?? null

  const selectCanvas = useCallback((id: string | null, additive?: boolean) => {
    if (id === null) {
      setSelectedIds([])
      return
    }
    if (additive) {
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    } else {
      setSelectedIds([id])
    }
  }, [])

  const boxSelectCanvas = useCallback((ids: string[], additive: boolean) => {
    if (additive) {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])])
    } else {
      setSelectedIds(ids)
    }
  }, [])
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

  const committedIntersectionPairsRef = useRef<Set<string>>(new Set())
  const lastIntersectionPairKeyRef = useRef<string | null>(null)

  const purgeIntersectionPairsForId = useCallback((id: string) => {
    const sep = '\u0000'
    committedIntersectionPairsRef.current = new Set(
      [...committedIntersectionPairsRef.current].filter((k) => {
        const parts = k.split(sep)
        return !parts.includes(id)
      }),
    )
  }, [])

  /** 退出绘图过程中的草稿/拾取，并切回选择工具（编辑侧栏与部分工具共用） */
  const exitDrawingToSelect = useCallback(() => {
    setActiveTool('select')
    setDraft(null)
    setLineSlopeAnchor(null)
    setCircleRadiusCenter(null)
    setEllipseRadiiCenter(null)
    setArcCenterAnglesCenter(null)
    setEllipseArcCenter(null)
    setRegularPolygonCorners(null)
    setAxesModalOrigin(null)
    setIntersectionPickIds([])
  }, [])

  const splitAtIntersectionMarkers = useCallback(() => {
    exitDrawingToSelect()
    const id = selectedIds[0]
    if (!id) return
    const target = elements.find((e) => e.id === id)
    if (!target || (target.type !== 'line' && target.type !== 'polyline' && target.type !== 'arc')) return
    const markers = elements.filter((e) => e.type === 'intersectionPoint').map((e) => e.center)
    const parts = splitElementAtIntersectionMarkers(target, markers)
    if (!parts?.length) {
      setCopyHint('无可分割：请确保画布上有交点标记且落在该图元上')
      window.setTimeout(() => setCopyHint(null), 2800)
      return
    }
    purgeIntersectionPairsForId(id)
    setElements((els) => [...els.filter((e) => e.id !== id), ...parts])
    setSelectedIds(parts.map((p) => p.id))
  }, [elements, selectedIds, exitDrawingToSelect, purgeIntersectionPairsForId])

  const mergeCycleToFilledPath = useCallback(() => {
    exitDrawingToSelect()
    const sel = selectedIds
      .map((i) => elements.find((e) => e.id === i))
      .filter(Boolean) as DrawingElement[]
    const ring = cycleFromSelectedLines(sel)
    if (!ring) {
      setCopyHint('无法合并：请 Shift 多选至少 3 条直线且构成单一闭合回路')
      window.setTimeout(() => setCopyHint(null), 2800)
      return
    }
    const el: DrawingElement = {
      id: createId(),
      type: 'filledPath',
      vertices: ring,
      style: currentStyle,
    }
    setElements((els) => [...els, el])
    setSelectedIds([el.id])
  }, [selectedIds, elements, currentStyle, exitDrawingToSelect])

  const commitNewElement = useCallback(
    (element: DrawingElement) => {
      const useFill =
        closedShapeFillSubtool === 'solid' &&
        (element.type === 'rectangle' ||
          element.type === 'circle' ||
          element.type === 'ellipse' ||
          element.type === 'polygon' ||
          element.type === 'regularPolygon' ||
          element.type === 'sector')
      const patched = useFill ? withClosedShapeDefaultFillIfApplicable(element) : element
      setElements((currentElements) => [...currentElements, patched])
      setSelectedIds([patched.id])
    },
    [closedShapeFillSubtool],
  )

  const canSplitAtIntersection = useMemo(() => {
    if (selectedIds.length !== 1 || !selectedElement) return false
    const t = selectedElement.type
    return t === 'line' || t === 'polyline' || t === 'arc'
  }, [selectedIds.length, selectedElement])

  const canMergeCycleToFill = useMemo(() => {
    if (selectedIds.length < 3) return false
    return selectedIds.every((id) => elements.find((e) => e.id === id)?.type === 'line')
  }, [selectedIds, elements])

  const toggleAxisCanvasOrientation = useCallback((orientation: 'x' | 'y') => {
    setElements((els) => toggleAxisOrientationVisibility(els, orientation))
  }, [])

  const updateElement = (updatedElement: DrawingElement) => {
    purgeIntersectionPairsForId(updatedElement.id)
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

  const deleteSelectedIds = useCallback(() => {
    if (selectedIds.length === 0) return
    for (const id of selectedIds) {
      purgeIntersectionPairsForId(id)
    }
    setElements((els) => els.filter((e) => !selectedIds.includes(e.id)))
    setSelectedIds([])
  }, [selectedIds, purgeIntersectionPairsForId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      e.preventDefault()
      deleteSelectedIds()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteSelectedIds])

  const copySelectionOffset = useCallback(() => {
    if (selectedIds.length === 0) return
    exitDrawingToSelect()
    const s = gridConfig.gridStep
    const d: Point = { x: s, y: -s }
    const newIds: string[] = []
    setElements((els) => {
      const next = [...els]
      for (const id of selectedIds) {
        const el = els.find((e) => e.id === id)
        if (!el) continue
        const nid = createId()
        newIds.push(nid)
        next.push(cloneElementWithNewId(translateElement(el, d), nid))
      }
      return next
    })
    if (newIds.length) setSelectedIds(newIds)
  }, [exitDrawingToSelect, gridConfig.gridStep, selectedIds])

  const openRotateModal = useCallback(() => {
    if (selectedIds.length === 0) return
    exitDrawingToSelect()
    setRotateModalOpen(true)
  }, [selectedIds.length, exitDrawingToSelect])

  const applyRotation = useCallback(
    (deg: number, centerOverride: Point | null) => {
      const c = centerOverride ?? selectionBoundsCenterTikz(elements, selectedIds)
      if (!c) return
      const idSet = new Set(selectedIds)
      setElements((els) => rotateElementsAround(els, idSet, c, deg))
      setRotateModalOpen(false)
    },
    [elements, selectedIds],
  )

  const startMirrorTool = useCallback(() => {
    if (selectedIds.length === 0) {
      setCopyHint('请先选中图元')
      window.setTimeout(() => setCopyHint(null), 2000)
      return
    }
    exitDrawingToSelect()
    setMirrorToolActive(true)
    setMirrorFirstPoint(null)
    setMoveToolActive(false)
  }, [selectedIds.length, exitDrawingToSelect])

  const applyMirrorAxis = useCallback(
    (a: Point, b: Point) => {
      const dx = b.x - a.x
      const dy = b.y - a.y
      if (dx * dx + dy * dy < 1e-12) {
        setCopyHint('对称轴两点不能重合')
        window.setTimeout(() => setCopyHint(null), 2500)
        return
      }
      const idSet = new Set(selectedIds)
      setElements((els) => mirrorElementsAcrossLine(els, idSet, a, b))
      setMirrorToolActive(false)
      setMirrorFirstPoint(null)
    },
    [selectedIds],
  )

  const onMirrorCanvasPoint = useCallback(
    (p: Point) => {
      if (!mirrorFirstPoint) {
        setMirrorFirstPoint(p)
        return
      }
      applyMirrorAxis(mirrorFirstPoint, p)
    },
    [mirrorFirstPoint, applyMirrorAxis],
  )

  const onMirrorAxisLinePick = useCallback(
    (lineId: string) => {
      const line = elements.find((e) => e.id === lineId)
      if (!line || line.type !== 'line') return
      applyMirrorAxis(line.start, line.end)
    },
    [elements, applyMirrorAxis],
  )

  const onMoveDragStart = useCallback(
    (p: Point) => {
      moveStartRef.current = p
      const m = new Map<string, DrawingElement>()
      for (const id of selectedIds) {
        const el = elements.find((e) => e.id === id)
        if (el) m.set(id, el)
      }
      moveSnapshotRef.current = m
    },
    [elements, selectedIds],
  )

  const onMoveDragMove = useCallback(
    (p: Point, ctrlKey: boolean) => {
      const start = moveStartRef.current
      if (!start) return
      let dx = p.x - start.x
      let dy = p.y - start.y
      if (!ctrlKey) {
        const s = snapTikzDelta(dx, dy, coordinateSystem, gridConfig.gridStep)
        dx = s.dx
        dy = s.dy
      }
      const d: Point = { x: dx, y: dy }
      const snap = moveSnapshotRef.current
      const idSet = new Set(selectedIds)
      setElements((els) =>
        els.map((e) => {
          const orig = snap.get(e.id)
          return orig && idSet.has(e.id) ? translateElement(orig, d) : e
        }),
      )
    },
    [coordinateSystem, gridConfig.gridStep, selectedIds],
  )

  const onMoveDragEnd = useCallback(() => {
    moveStartRef.current = null
    moveSnapshotRef.current = new Map()
  }, [])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (moveToolActive) setMoveToolActive(false)
      if (mirrorToolActive) {
        setMirrorToolActive(false)
        setMirrorFirstPoint(null)
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [moveToolActive, mirrorToolActive])

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

  // macOS View 菜单：坐标轴与属性栏文案均表示「下一步操作」（扁平 IPC 参数与 #[command(rename_all)] 对齐）
  useLayoutEffect(() => {
    const hasX = hasAxisOrientation(elements, 'x')
    const hasY = hasAxisOrientation(elements, 'y')
    const xShown = anyAxisOrientationShown(elements, 'x')
    const yShown = anyAxisOrientationShown(elements, 'y')
    void (async () => {
      try {
        await invoke('update_axis_canvas_menu_items', {
          xLabel: hasX ? (xShown ? '隐藏 X 轴' : '显示 X 轴') : '（无 X 轴）',
          yLabel: hasY ? (yShown ? '隐藏 Y 轴' : '显示 Y 轴') : '（无 Y 轴）',
          xEnabled: hasX,
          yEnabled: hasY,
          propertiesLabel: propertiesOpen ? '隐藏属性栏' : '展开属性栏',
        })
      } catch {
        /* Web 或非 Tauri */
      }
    })()
  }, [elements, propertiesOpen])

  // macOS 菜单事件：用 Promise.all 一次性注册，避免 Strict Mode 下异步逐个 listen 导致重复注册（切换类菜单会执行偶数次而表现为无效）。
  useEffect(() => {
    let cancelled = false
    let registered: Array<() => void> = []

    ;(async () => {
      try {
        const unls = await Promise.all([
          listen('menu-new-canvas', () => {
            setElements([])
            setDraft(null)
            setSelectedIds([])
            setPolylineClosed(false)
            setRegularPolygonCorners(null)
            setConicModalOpen(false)
            setPlotModalOpen(false)
            setForeachModalOpen(false)
            setAxesModalOrigin(null)
            setLineSlopeAnchor(null)
            setCircleRadiusCenter(null)
            setEllipseRadiiCenter(null)
            setArcCenterAnglesCenter(null)
            setIntersectionPickIds([])
            committedIntersectionPairsRef.current.clear()
            lastIntersectionPairKeyRef.current = null
            setViewOrigin(defaultViewOrigin())
          }),
          listen('menu-center-on-selection', () => {
            const id = selectedIdRef.current
            const el = elementsRef.current.find((e) => e.id === id)
            if (!el) return
            const c = tikzCenterOfElement(el)
            if (!c) return
            const w = defaultCoordinateSystem.width
            const h = defaultCoordinateSystem.height
            const ppu = defaultCoordinateSystem.pixelsPerUnit
            setViewOrigin({ x: w / 2 - c.x * ppu, y: h / 2 + c.y * ppu })
          }),
          listen('menu-reset-view', () => {
            setViewOrigin(defaultViewOrigin())
          }),
          listen('menu-grid-toggle-canvas', () => {
            setGridConfig((gc) => ({ ...gc, showGrid: !gc.showGrid }))
          }),
          listen('menu-grid-toggle-export', () => {
            setGridConfig((gc) => ({ ...gc, showGridInExport: !gc.showGridInExport }))
          }),
          listen('menu-grid-settings', () => {
            setGridSettingsOpen(true)
          }),
          listen('menu-toggle-axes-x-canvas', () => {
            toggleAxisCanvasOrientation('x')
          }),
          listen('menu-toggle-axes-y-canvas', () => {
            toggleAxisCanvasOrientation('y')
          }),
          listen('menu-settings', () => {
            setGridSettingsOpen(true)
          }),
          listen('menu-compile', async () => {
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
          }),
          listen('menu-copy-code', async () => {
            try {
              await navigator.clipboard.writeText(buildTikzPicture(elementsRef.current, gridConfigRef.current))
            } catch {
              // ignore
            }
          }),
          listen('menu-open-pdf', async () => {
            const p = compileResultRef.current?.pdfPath
            if (p) {
              try {
                const { openPath } = await import('@tauri-apps/plugin-opener')
                await openPath(p)
              } catch {
                // ignore
              }
            }
          }),
          listen('menu-export-pdf', async () => {
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
          }),
          listen('menu-toggle-properties', () => {
            setPropertiesOpen((p) => !p)
          }),
          listen('menu-toggle-tikz', () => {
            setCentralTab('preview')
          }),
          listen('menu-toggle-pdf', () => {
            setCentralTab('preview')
          }),
          listen('menu-export-png', async () => {
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
          }),
        ])
        if (cancelled) {
          unls.forEach((u) => u())
          return
        }
        registered = unls
      } catch {
        /* 浏览器等非 Tauri 环境 */
      }
    })()

    return () => {
      cancelled = true
      registered.forEach((fn) => fn())
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
          const origin = { x: 0, y: 0 }
          const created: DrawingElement[] = []
          if (bounds.createX) {
            created.push({
              id: createId(),
              type: 'axisLine',
              orientation: 'x',
              origin,
              min: bounds.xMin,
              max: bounds.xMax,
              style: currentStyle,
              ...defaultAxisLineOptionsFor('x'),
            })
          }
          if (bounds.createY) {
            created.push({
              id: createId(),
              type: 'axisLine',
              orientation: 'y',
              origin,
              min: bounds.yMin,
              max: bounds.yMax,
              style: currentStyle,
              ...defaultAxisLineOptionsFor('y'),
            })
          }
          setElements((currentElements) => [...currentElements, ...created])
          setSelectedIds(created[created.length - 1]?.id ? [created[created.length - 1]!.id] : [])
          setAxesModalOrigin(null)
        }}
      />

      <IntersectionModal
        open={intersectionPoints.length > 0}
        points={intersectionPoints}
        onCancel={() => {
          setIntersectionPoints([])
          setIntersectionPickIds([])
          lastIntersectionPairKeyRef.current = null
        }}
        onConfirm={(names) => {
          if (intersectionPoints.length > 0 && lastIntersectionPairKeyRef.current) {
            committedIntersectionPairsRef.current.add(lastIntersectionPairKeyRef.current)
          }
          lastIntersectionPairKeyRef.current = null
          const newElements: DrawingElement[] = intersectionPoints.map((pt, i) => ({
            id: createId(),
            type: 'intersectionPoint',
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
          setSelectedIds([element.id])
          setArcCenterAnglesCenter(null)
        }}
      />

      <EllipseArcAnglesModal
        open={ellipseArcCenter !== null}
        center={ellipseArcCenter}
        onCancel={() => setEllipseArcCenter(null)}
        onConfirm={(center, radiusX, radiusY, startAngle, endAngle, ellipseRotationDeg) => {
          const rot = ellipseRotationDeg
          const computedStart = ellipseArcPoint(center, radiusX, radiusY, startAngle, rot)
          const computedEnd = ellipseArcPoint(center, radiusX, radiusY, endAngle, rot)
          const element: DrawingElement = {
            id: createId(),
            type: 'arc',
            start: snapTikzPoint(computedStart, undefined, gridConfig.gridStep),
            end: snapTikzPoint(computedEnd, undefined, gridConfig.gridStep),
            sweepAngle: endAngle - startAngle,
            style: currentStyle,
            definitionMode: 'ellipseCenterRadiiAngles',
            center,
            radiusX,
            radiusY,
            startAngle,
            endAngle,
            ellipseRotationDeg: rot,
          }
          setElements((currentElements) => [...currentElements, element])
          setSelectedIds([element.id])
          setEllipseArcCenter(null)
        }}
      />

      <RotateSelectionModal
        open={rotateModalOpen}
        onCancel={() => setRotateModalOpen(false)}
        onConfirm={(deg, center) => applyRotation(deg, center)}
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
          commitNewElement(element)
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
          commitNewElement(element)
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
          setSelectedIds([element.id])
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
                  title={propertiesOpen ? '隐藏属性栏' : '展开属性栏'}
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
                  arcSubtool={arcSubtool}
                  circleSubtool={circleSubtool}
                  closedShapeFillSubtool={closedShapeFillSubtool}
                  ellipseSubtool={ellipseSubtool}
                  lineSubtool={lineSubtool}
                  sectorShapeSubtool={sectorShapeSubtool}
                  onArcSubtoolChange={setArcSubtool}
                  onCircleSubtoolChange={setCircleSubtool}
                  onClosedShapeFillSubtoolChange={setClosedShapeFillSubtool}
                  onEllipseSubtoolChange={setEllipseSubtool}
                  onLineSubtoolChange={setLineSubtool}
                  onSectorShapeSubtoolChange={setSectorShapeSubtool}
                  onToolChange={(tool) => {
                    if (tool === 'conic') {
                      setConicModalOpen(true)
                      setActiveTool('select')
                      setDraft(null)
                      setRegularPolygonCorners(null)
                      setMoveToolActive(false)
                      setMirrorToolActive(false)
                      setMirrorFirstPoint(null)
                      return
                    }
                    if (tool === 'plot') {
                      setPlotModalOpen(true)
                      setActiveTool('select')
                      setDraft(null)
                      setRegularPolygonCorners(null)
                      setMoveToolActive(false)
                      setMirrorToolActive(false)
                      setMirrorFirstPoint(null)
                      return
                    }
                    if (tool === 'foreach') {
                      setForeachModalOpen(true)
                      setActiveTool('select')
                      setDraft(null)
                      setRegularPolygonCorners(null)
                      setMoveToolActive(false)
                      setMirrorToolActive(false)
                      setMirrorFirstPoint(null)
                      return
                    }
                    setActiveTool(tool)
                    setDraft(null)
                    setLineSlopeAnchor(null)
                    setCircleRadiusCenter(null)
                    setEllipseRadiiCenter(null)
                    setArcCenterAnglesCenter(null)
                    setEllipseArcCenter(null)
                    setRegularPolygonCorners(null)
                    setIntersectionPickIds([])
                    setMoveToolActive(false)
                    setMirrorToolActive(false)
                    setMirrorFirstPoint(null)
                    if (tool === 'intersection') {
                      setSelectedIds([])
                    }
                    if (tool === 'axes') {
                      const hasAxes = elementsRef.current.some((e) => e.type === 'axes' || e.type === 'axisLine')
                      setAxesModalOrigin(hasAxes ? null : { x: 0, y: 0 })
                    } else {
                      setAxesModalOrigin(null)
                    }
                  }}
                />
                <div className="canvas-toolbar-actions">
                  <button
                    className="canvas-toolbar-action-btn"
                    disabled={!canSplitAtIntersection}
                    title="选中一条直线、多段线或圆弧；需先有落在其上的交点标记"
                    type="button"
                    onClick={() => splitAtIntersectionMarkers()}
                  >
                    交点分割
                  </button>
                  <button
                    className="canvas-toolbar-action-btn"
                    disabled={!canMergeCycleToFill}
                    title="Shift 多选至少 3 条直线构成单一闭合回路后合并为填充区域（可先交点分割）"
                    type="button"
                    onClick={() => mergeCycleToFilledPath()}
                  >
                    合并填充
                  </button>
                  <button
                    className={`canvas-toolbar-action-btn${moveToolActive ? ' active' : ''}`}
                    disabled={selectedIds.length === 0}
                    title="平移选中图元：开启后在画布上拖拽；默认吸附网格，按住 Ctrl 自由移动。再点一次关闭。"
                    type="button"
                    onClick={() => {
                      exitDrawingToSelect()
                      setMirrorToolActive(false)
                      setMirrorFirstPoint(null)
                      setMoveToolActive((m) => !m)
                    }}
                  >
                    移动
                  </button>
                  <button
                    className="canvas-toolbar-action-btn"
                    disabled={selectedIds.length === 0}
                    title={`复制选中图元，向右下 45° 偏移 ${gridConfig.gridStep}（当前网格步长）`}
                    type="button"
                    onClick={() => copySelectionOffset()}
                  >
                    拷贝
                  </button>
                  <button
                    className="canvas-toolbar-action-btn"
                    disabled={selectedIds.length === 0}
                    title="绕选中包围盒中心旋转；逆时针为正，可在对话框输入负值顺时针。"
                    type="button"
                    onClick={() => openRotateModal()}
                  >
                    旋转
                  </button>
                  <button
                    className={`canvas-toolbar-action-btn${mirrorToolActive ? ' active' : ''}`}
                    disabled={selectedIds.length === 0}
                    title="对称：点击一条直线图元作为轴，或在画布上点击两点定义轴。Esc 取消。"
                    type="button"
                    onClick={() => {
                      if (mirrorToolActive) {
                        setMirrorToolActive(false)
                        setMirrorFirstPoint(null)
                      } else {
                        startMirrorTool()
                      }
                    }}
                  >
                    对称
                  </button>
                </div>
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
                onCreate={commitNewElement}
                onDraftChange={setDraft}
                onLineSlopeAnchorPick={(anchor) => setLineSlopeAnchor(anchor)}
                onCircleRadiusCenterPick={(center) => setCircleRadiusCenter(center)}
                onEllipseRadiiCenterPick={(center) => setEllipseRadiiCenter(center)}
                onArcCenterAnglesCenterPick={(center) => setArcCenterAnglesCenter(center)}
                onEllipseArcCenterPick={(center) => setEllipseArcCenter(center)}
                moveToolActive={moveToolActive}
                mirrorToolActive={mirrorToolActive}
                onMirrorAxisLinePick={onMirrorAxisLinePick}
                onMirrorCanvasPoint={onMirrorCanvasPoint}
                onMoveDragEnd={onMoveDragEnd}
                onMoveDragMove={onMoveDragMove}
                onMoveDragStart={onMoveDragStart}
                onIntersectionElementPick={(id) => {
                  const picks = intersectionPickIds
                  if (picks.includes(id)) return
                  if (picks.length === 0) {
                    setIntersectionPickIds([id])
                    return
                  }
                  // Step 1: clear picks → triggers render with thin lines
                  setIntersectionPickIds([])
                  // Step 2: defer computation to next microtask, after React has committed the clear
                  const a = picks[0], b = id
                  queueMicrotask(() => {
                    const elA = elementsRef.current.find((e) => e.id === a)
                    const elB = elementsRef.current.find((e) => e.id === b)
                    if (!elA || !elB) return
                    const pairKey = [a, b].sort().join('\u0000')
                    if (committedIntersectionPairsRef.current.has(pairKey)) {
                      setIntersectionPickIds([])
                      return
                    }
                    const pts = computeIntersections(elA, elB)
                    lastIntersectionPairKeyRef.current = pts.length > 0 ? pairKey : null
                    setIntersectionPoints(pts)
                  })
                }}
                intersectionPickIds={intersectionPickIds}
                sectorShapeSubtool={sectorShapeSubtool}
                onSelect={selectCanvas}
                onBoxSelect={boxSelectCanvas}
                onFillPick={(pt) => {
                  const hit = hitClosedShapeAtPoint(elements, pt)
                  if (!hit) return
                  updateElement({
                    ...hit,
                    style: normalizeDrawingStyle({
                      ...hit.style,
                      fillMode: 'solid',
                      fillColor: currentStyle.fillColor,
                      fillOpacity: currentStyle.fillOpacity,
                    }),
                  })
                }}
                onRegularPolygonTwoPoints={(center, firstVertex) => {
                  setRegularPolygonCorners({ center, firstVertex })
                }}
                polylineClosed={polylineClosed}
                selectedIds={selectedIds}
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
            arcAngle={arcAngle}
            arcSubtool={arcSubtool}
            circleSubtool={circleSubtool}
            coordinateInputMode={coordinateInputMode}
            currentStyle={currentStyle}
            ellipseSubtool={ellipseSubtool}
            lineSubtool={lineSubtool}
            polarAngleUnit={polarAngleUnit}
            polylineClosed={polylineClosed}
            selectedElement={selectedElement}
            selectedIds={selectedIds}
            onArcAngleChange={updateArcAngle}
            onArcSubtoolChange={setArcSubtool}
            onCircleSubtoolChange={setCircleSubtool}
            onCoordinateInputModeChange={setCoordinateInputMode}
            onDelete={(id) => {
              purgeIntersectionPairsForId(id)
              setElements((currentElements) => currentElements.filter((element) => element.id !== id))
              setSelectedIds([])
            }}
            onEllipseSubtoolChange={setEllipseSubtool}
            onLineSubtoolChange={setLineSubtool}
            onMergeCycleToFill={mergeCycleToFilledPath}
            onPolarAngleUnitChange={setPolarAngleUnit}
            onPolarPoint={(r, ang) => {
              const p = polarInputToCartesian(r, ang, polarAngleUnit)
              const el: DrawingElement = {
                id: createId(),
                type: 'point',
                center: p,
                label: '',
                style: currentStyle,
              }
              setElements((els) => [...els, el])
              setSelectedIds([el.id])
            }}
            onPolylineClosedChange={setPolylineClosed}
            onSplitAtIntersections={splitAtIntersectionMarkers}
            onStyleChange={updateStyle}
            onUpdate={updateElement}
          />
        </div>
      </div>

      {/* 浮动通知 */}
      {copyHint && <div className="toast-notification">{copyHint}</div>}

      <StatusBar gridConfig={gridConfig} />

      <GridSettingsModal
        gridConfig={gridConfig}
        open={gridSettingsOpen}
        onClose={() => setGridSettingsOpen(false)}
        onSave={setGridConfig}
      />

      <RegularPolygonModal
        center={regularPolygonCorners?.center ?? null}
        firstVertex={regularPolygonCorners?.firstVertex ?? null}
        open={regularPolygonCorners !== null}
        onCancel={() => setRegularPolygonCorners(null)}
        onConfirm={(center, firstVertex, sides) => {
          const el: DrawingElement = {
            id: createId(),
            type: 'regularPolygon',
            center,
            firstVertex,
            sides,
            style: currentStyle,
          }
          commitNewElement(el)
          setRegularPolygonCorners(null)
        }}
      />

      <ConicModal
        open={conicModalOpen}
        onCancel={() => setConicModalOpen(false)}
        onConfirm={(p) => {
          const el: DrawingElement = { ...p, id: createId(), style: currentStyle }
          setElements((els) => [...els, el])
          setSelectedIds([el.id])
          setConicModalOpen(false)
        }}
      />

      <FunctionPlotModal
        open={plotModalOpen}
        onCancel={() => setPlotModalOpen(false)}
        onConfirm={(p, { addMarkers }) => {
          const el: DrawingElement = { ...p, id: createId(), style: currentStyle }
          const plotEl = el as FunctionPlotElement
          const markers: DrawingElement[] = []
          if (addMarkers) {
            const { zeros, maxima, minima } = computeFunctionPlotMarkers(plotEl)
            for (const z of zeros) {
              markers.push({ id: createId(), type: 'point', center: z, label: '零点', style: currentStyle })
            }
            for (const pt of maxima) {
              markers.push({ id: createId(), type: 'point', center: pt, label: '极大', style: currentStyle })
            }
            for (const pt of minima) {
              markers.push({ id: createId(), type: 'point', center: pt, label: '极小', style: currentStyle })
            }
          }
          setElements((els) => [...els, el, ...markers])
          setSelectedIds([el.id])
          setPlotModalOpen(false)
        }}
      />

      <ForeachModal
        open={foreachModalOpen}
        onCancel={() => setForeachModalOpen(false)}
        onConfirm={(p) => {
          const el: DrawingElement = { ...p, id: createId(), style: currentStyle }
          setElements((els) => [...els, el])
          setSelectedIds([el.id])
          setForeachModalOpen(false)
        }}
      />
    </main>
  )
}

export default App
