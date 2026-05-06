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
export type ArcSubtool = 'sweepAngle' | 'centerRadiusAngles'
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
  | 'axes'
  | 'intersection'
  | 'point'

export type ArrowHead = 'none' | 'Latex' | 'Stealth' | 'Triangle'

export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dash dot'

export type LineCap = 'butt' | 'round' | 'rect'

export type LineJoin = 'miter' | 'round' | 'bevel'

export type DrawingStyle = {
  startArrow: ArrowHead
  endArrow: ArrowHead
  lineStyle: LineStyle
  drawColor: string
  lineWidth: number
  lineCap: LineCap
  lineJoin: LineJoin
  opacity: number
}

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
  /** 定义方式：'sweepAngle'（默认，用起点+终点+扫过角）| 'centerRadiusAngles'（圆心+半径+起止角度） */
  definitionMode?: 'sweepAngle' | 'centerRadiusAngles'
  /** 当 definitionMode === 'centerRadiusAngles' 时使用 */
  center?: Point
  startAngle?: number
  endAngle?: number
  radius?: number
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
  style: DrawingStyle
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
  | AxesElement
  | AxisLineElement
  | PointElement
  | IntersectionPointElement

export type DraftElement = {
  type: 'line' | 'arc' | 'rectangle' | 'circle' | 'ellipse' | 'polyline' | 'point'
  start: Point
  end: Point
  points?: Point[]
  sweepAngle?: number
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
