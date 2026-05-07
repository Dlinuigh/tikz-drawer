export type Point = {
  x: number
  y: number
}

export type GridConfig = {
  showGrid: boolean
  gridStep: number
  gridColor: string
  gridLineStyle: 'solid' | 'dashed' | 'dotted'
  gridLineWidth: number
  /** When true, compiled TikZ includes a background grid in the output */
  showGridInExport: boolean
  /** TikZ grid bounds (TikZ coordinates) when exporting grid */
  gridExportXMin: number
  gridExportXMax: number
  gridExportYMin: number
  gridExportYMax: number
}

export const defaultGridConfig: GridConfig = {
  showGrid: true,
  gridStep: 1,
  gridColor: '#e5e7eb',
  gridLineStyle: 'solid',
  gridLineWidth: 1,
  showGridInExport: false,
  gridExportXMin: -10,
  gridExportXMax: 10,
  gridExportYMin: -8,
  gridExportYMax: 8,
}

export type LineSubtool = 'twoPoints' | 'pointSlope'
export type ArcSubtool = 'sweepAngle' | 'centerRadiusAngles' | 'ellipseCenterRadiiAngles'
export type CircleSubtool = 'centerRadius' | 'centerRadiusValue'
export type EllipseSubtool = 'centerRadii' | 'centerRadiiValue'

export type Tool =
  | 'select'
  | 'line'
  | 'arc'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'polyline'
  | 'polygon'
  | 'sector'
  | 'regularPolygon'
  | 'conic'
  | 'plot'
  | 'foreach'
  | 'fillPick'
  | 'axes'
  | 'intersection'
  | 'point'

export type ArrowHead = 'none' | 'Latex' | 'Stealth' | 'Triangle'

export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dash dot'

export type LineCap = 'butt' | 'round' | 'rect'

export type LineJoin = 'miter' | 'round' | 'bevel'

export type FillMode = 'none' | 'solid' | 'pattern'

/** TikZ `patterns` library names (subset). */
export type FillPatternName =
  | 'horizontal lines'
  | 'vertical lines'
  | 'north east lines'
  | 'dots'
  | 'grid'

export type DrawingStyle = {
  startArrow: ArrowHead
  endArrow: ArrowHead
  lineStyle: LineStyle
  drawColor: string
  lineWidth: number
  lineCap: LineCap
  lineJoin: LineJoin
  opacity: number
  fillMode: FillMode
  fillColor: string
  fillOpacity: number
  fillPattern: FillPatternName
}

export type CoordinateInputMode = 'cartesian' | 'polar'

export type PolarAngleUnit = 'deg' | 'rad'

export type PlotCoordinateMode = 'cartesian' | 'polar'

export type ConicKind = 'parabola' | 'ellipse' | 'hyperbola'

export type HyperbolaBranch = 'positive' | 'negative' | 'both'

export type LineElement = {
  id: string
  type: 'line'
  start: Point
  end: Point
  style: DrawingStyle
}

export type ArcElement = {
  id: string
  type: 'arc'
  start: Point
  end: Point
  sweepAngle: number
  style: DrawingStyle
  /** 定义方式：'sweepAngle'（默认，用起点+终点+扫过角）| 'centerRadiusAngles'（圆心+半径+起止角度）| 'ellipseCenterRadiiAngles'（椭圆弧） */
  definitionMode?: 'sweepAngle' | 'centerRadiusAngles' | 'ellipseCenterRadiiAngles'
  /** 当 definitionMode === 'centerRadiusAngles' 时使用 */
  center?: Point
  startAngle?: number
  endAngle?: number
  radius?: number
  /** definitionMode === 'ellipseCenterRadiiAngles'：x/y 半轴（TikZ 坐标单位） */
  radiusX?: number
  radiusY?: number
  /** 椭圆主轴相对 x 轴逆时针角度（度），默认 0 */
  ellipseRotationDeg?: number
}

export type RectangleElement = {
  id: string
  type: 'rectangle'
  start: Point
  end: Point
  style: DrawingStyle
}

export type CircleElement = {
  id: string
  type: 'circle'
  center: Point
  radiusPoint: Point
  style: DrawingStyle
}

export type EllipseElement = {
  id: string
  type: 'ellipse'
  center: Point
  radiusPoint: Point
  style: DrawingStyle
}

export type PolylineElement = {
  id: string
  type: 'polyline'
  points: Point[]
  /** When true, TikZ ends with `-- cycle` and SVG fills closed region if fill set */
  closed?: boolean
  style: DrawingStyle
}

/**
 * 圆心类扇形：`convexPie` / `convexSegment` / `majorArcPie`（对称弧楔：同外凸三击，第一点即圆心；边界弧用 `majorArcSignedSweep`）；第三点定弧向。
 * `concaveBracket`：`<(` 凹弧。`iceCream`：顶点→母线→顶角；`center` 为凹弧圆心，`apex` 为顶点。
 * 存档旧值 `tangentConcave` → `majorArcPie`。另有旧值 `pie`/`segment`。
 */
export type SectorShapeMode =
  | 'convexPie'
  | 'convexSegment'
  | 'majorArcPie'
  | 'concaveBracket'
  | 'iceCream'

/**
 * Circular sector: `center` 对圆心类画法为 **鼠标第一点**；对称弧楔 TikZ 导出时再由此算真正的弧圆心（镜面点）。
 * 半径与 `startAngleDeg`/`endAngleDeg`：第二点在大圆上，第三点定弧向（CCW，度）。
 */
export type SectorElement = {
  id: string
  type: 'sector'
  center: Point
  radius: number
  startAngleDeg: number
  endAngleDeg: number
  sectorShape?: SectorShapeMode | 'pie' | 'segment' | 'tangentConcave'
  /** 冰激凌：甜筒顶点。 */
  apex?: Point
  /** 冰激凌：凹弧相对凹弧圆心的扫角（优弧）。 */
  iceArcSweepDeg?: number
  /** @deprecated 旧版「反扇形」；读取时映射为弓形 convexSegment */
  inverseArc?: boolean
  style: DrawingStyle
}

/** 新建封闭图元时工具栏「填充」子选项：默认无填充。 */
export type ClosedShapeFillSubtool = 'none' | 'solid'

/** 扇形工具子模式（与 {@link SectorShapeMode} 一致，不含旧别名）。 */
export type SectorShapeSubtool = SectorShapeMode

/** Regular n-gon inscribed in circle through first vertex. */
export type RegularPolygonElement = {
  id: string
  type: 'regularPolygon'
  center: Point
  /** Any vertex; radius = distance(center, firstVertex) */
  firstVertex: Point
  sides: number
  style: DrawingStyle
}

/** Closed polygon (distinct from open polyline). */
export type PolygonElement = {
  id: string
  type: 'polygon'
  vertices: Point[]
  style: DrawingStyle
}

/** Sampled conic in standard orientation then rotated around center. */
export type ConicCurveElement = {
  id: string
  type: 'conicCurve'
  conicKind: ConicKind
  center: Point
  semiAxisX: number
  semiAxisY: number
  rotationDeg: number
  domainMin: number
  domainMax: number
  samples: number
  hyperbolaBranch: HyperbolaBranch
  style: DrawingStyle
}

/** Ordered vertices of a filled region (from edge merge or click tool). */
export type FilledPathElement = {
  id: string
  type: 'filledPath'
  vertices: Point[]
  style: DrawingStyle
}

export type FunctionPlotElement = {
  id: string
  type: 'functionPlot'
  /** Explicit y=f(x) or r=f(θ); use `coordinateMode` */
  expression: string
  coordinateMode: PlotCoordinateMode
  domainMin: number
  domainMax: number
  samples: number
  /** Optional implicit F(x,y)=0 (very small MVP contour); when set, explicit fields ignored for sampling */
  implicitEquation: string | null
  style: DrawingStyle
  /** 平移/变换时在采样结果上叠加（TikZ 坐标） */
  plotOffset?: Point
}

export type TikzForeachElement = {
  id: string
  type: 'tikzForeach'
  /** Iterator macro without backslash, e.g. `i` → `\\i` in export */
  iteratorName: string
  /** TikZ list expression: `1,...,10` or `{a,b,c}` */
  listExpr: string
  /** Body inside braces in export; use `#1` as iterator placeholder for simple previews */
  bodyTemplate: string
  previewLimit: number
  style: DrawingStyle
  /** 画布/导出整体平移（TikZ 坐标） */
  scopeShift?: Point
}

export type PointElement = {
  id: string
  type: 'point'
  center: Point
  label: string
  style: DrawingStyle
}

/** 由「交点」工具计算生成，可与手绘「点」区分并在属性中单独编辑标签 */
export type IntersectionPointElement = {
  id: string
  type: 'intersectionPoint'
  center: Point
  label: string
  style: DrawingStyle
}

/** TikZ-style `\\node[...]` placement keywords (subset). */
export type AxisNameTikzPlacement =
  | 'above'
  | 'below'
  | 'left'
  | 'right'
  | 'above left'
  | 'above right'
  | 'below left'
  | 'below right'

/** Manual tick: `value` in axis coordinates; optional `label` as LaTeX/math for TikZ (plain text ok for canvas). */
export type AxisTickMark = {
  value: number
  label?: string
}

export type AxesElement = {
  id: string
  type: 'axes'
  origin: Point
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  style: DrawingStyle
  tickStepX: number
  tickStepY: number
  /** Merged with step-based ticks; optional `label` overrides number shown at this position */
  manualTicksX: AxisTickMark[]
  manualTicksY: AxisTickMark[]
  showTicks: boolean
  showTickLabels: boolean
  labelX: string
  labelY: string
  /** TikZ node placement for the x-axis name */
  labelXPlacement: AxisNameTikzPlacement
  /** TikZ node placement for the y-axis name */
  labelYPlacement: AxisNameTikzPlacement
  /** Extra offset (TikZ units) for x-axis name after default tip offset */
  labelXDx: number
  labelXDy: number
  /** Extra offset (TikZ units) for y-axis name after default tip offset */
  labelYDx: number
  labelYDy: number
  /** false：画布中不绘制坐标轴；TikZ 导出仍包含。缺省视为显示 */
  canvasVisible?: boolean
  /** 画布中是否绘制 x 轴半轴（刻度与名称跟随）；缺省 true；需 canvasVisible 不为 false */
  canvasVisibleX?: boolean
  /** 画布中是否绘制 y 轴半轴 */
  canvasVisibleY?: boolean
}

/** 单条坐标轴（x 或 y），可独立参与求交与属性编辑 */
export type AxisLineElement = {
  id: string
  type: 'axisLine'
  orientation: 'x' | 'y'
  origin: Point
  min: number
  max: number
  style: DrawingStyle
  tickStep: number
  manualTicks: AxisTickMark[]
  showTicks: boolean
  showTickLabels: boolean
  label: string
  labelPlacement: AxisNameTikzPlacement
  labelDx: number
  labelDy: number
  canvasVisible?: boolean
}

export type DrawingElement =
  | LineElement
  | ArcElement
  | RectangleElement
  | CircleElement
  | EllipseElement
  | PolylineElement
  | PolygonElement
  | SectorElement
  | RegularPolygonElement
  | ConicCurveElement
  | FilledPathElement
  | FunctionPlotElement
  | TikzForeachElement
  | AxesElement
  | AxisLineElement
  | PointElement
  | IntersectionPointElement

export type DraftElement = {
  type:
    | 'line'
    | 'arc'
    | 'rectangle'
    | 'circle'
    | 'ellipse'
    | 'polyline'
    | 'polygon'
    | 'sector'
    | 'regularPolygon'
    | 'point'
  start: Point
  end: Point
  points?: Point[]
  sweepAngle?: number
  /** sector / regularPolygon draft steps */
  phase?: 'center' | 'radius' | 'secondAngle'
  /** regular polygon: sides from modal */
  regularSides?: number
  style: DrawingStyle
}

export const defaultStyle: DrawingStyle = {
  startArrow: 'none',
  endArrow: 'none',
  lineStyle: 'solid',
  drawColor: '#111827',
  lineWidth: 1,
  lineCap: 'round',
  lineJoin: 'round',
  opacity: 1,
  fillMode: 'none',
  fillColor: '#93c5fd',
  fillOpacity: 1,
  fillPattern: 'north east lines',
}

/** Merge partial style from older saved data or patches. */
export function normalizeDrawingStyle(s: Partial<DrawingStyle>): DrawingStyle {
  return { ...defaultStyle, ...s }
}

/** 原生闭合图元创建时使用浅色实心填充（保留描边等其余样式字段）。 */
export function withClosedShapeDefaultFill(style: DrawingStyle): DrawingStyle {
  return {
    ...style,
    fillMode: 'solid',
    fillOpacity: 1,
    fillColor: defaultStyle.fillColor,
  }
}

export function withClosedShapeDefaultFillIfApplicable(el: DrawingElement): DrawingElement {
  switch (el.type) {
    case 'rectangle':
    case 'circle':
    case 'ellipse':
    case 'polygon':
    case 'regularPolygon':
    case 'sector':
      return { ...el, style: withClosedShapeDefaultFill(el.style) }
    default:
      return el
  }
}

export function sectorEffectiveShape(el: SectorElement): SectorShapeMode {
  const s = el.sectorShape
  if (s === 'tangentConcave') return 'majorArcPie'
  if (s === 'majorArcPie') return 'majorArcPie'
  if (s === 'concaveBracket') return 'concaveBracket'
  if (s === 'iceCream') return 'iceCream'
  if (s === 'convexSegment' || s === 'segment') return 'convexSegment'
  if (el.inverseArc) return 'convexSegment'
  if (s === 'convexPie' || s === 'pie' || s === undefined) return 'convexPie'
  return 'convexPie'
}

export const presetColors = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#ea580c', '#7c3aed']

export const defaultAxesOptions: Pick<
  AxesElement,
  | 'tickStepX'
  | 'tickStepY'
  | 'showTicks'
  | 'showTickLabels'
  | 'labelX'
  | 'labelY'
  | 'labelXPlacement'
  | 'labelYPlacement'
  | 'labelXDx'
  | 'labelXDy'
  | 'labelYDx'
  | 'labelYDy'
  | 'canvasVisible'
> = {
  tickStepX: 1,
  tickStepY: 1,
  showTicks: true,
  showTickLabels: true,
  labelX: '$x$',
  labelY: '$y$',
  labelXPlacement: 'right',
  labelYPlacement: 'above',
  labelXDx: 0,
  labelXDy: 0,
  labelYDx: 0,
  labelYDy: 0,
  canvasVisible: true,
}

export function defaultAxisLineOptionsFor(
  orientation: 'x' | 'y',
): Pick<
  AxisLineElement,
  | 'tickStep'
  | 'manualTicks'
  | 'showTicks'
  | 'showTickLabels'
  | 'label'
  | 'labelPlacement'
  | 'labelDx'
  | 'labelDy'
  | 'canvasVisible'
> {
  return {
    tickStep: 1,
    manualTicks: [],
    showTicks: true,
    showTickLabels: true,
    label: orientation === 'x' ? '$x$' : '$y$',
    labelPlacement: orientation === 'x' ? 'right' : 'above',
    labelDx: 0,
    labelDy: 0,
    canvasVisible: true,
  }
}
