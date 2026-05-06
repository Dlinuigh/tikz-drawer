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

export type Tool =
  | 'select'
  | 'line'
  | 'arc'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'polyline'
  | 'axes'

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
}

export type DrawingElement =
  | LineElement
  | ArcElement
  | RectangleElement
  | CircleElement
  | EllipseElement
  | PolylineElement
  | AxesElement

export type DraftElement = {
  type: 'line' | 'arc' | 'rectangle' | 'circle' | 'ellipse' | 'polyline'
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
}
