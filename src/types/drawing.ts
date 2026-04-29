export type Point = {
  x: number
  y: number
}

export type Tool = 'select' | 'line' | 'arc' | 'rectangle' | 'circle' | 'ellipse' | 'polyline'

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

export type DrawingElement =
  | LineElement
  | ArcElement
  | RectangleElement
  | CircleElement
  | EllipseElement
  | PolylineElement

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
