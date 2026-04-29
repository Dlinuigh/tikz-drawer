export type Point = {
  x: number
  y: number
}

export type Tool = 'select' | 'line' | 'arc'

export type ArrowStyle = 'none' | 'end' | 'start' | 'both'

export type LineStyle = 'solid' | 'dashed' | 'dotted'

export type StrokeColor = 'black' | 'red' | 'blue' | 'green' | 'orange' | 'purple'

export type DrawingStyle = {
  arrow: ArrowStyle
  lineStyle: LineStyle
  strokeColor: StrokeColor
  strokeWidth: number
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

export type DrawingElement = LineElement | ArcElement

export type DraftElement = {
  type: 'line' | 'arc'
  start: Point
  end: Point
  sweepAngle?: number
  style: DrawingStyle
}

export const defaultStyle: DrawingStyle = {
  arrow: 'none',
  lineStyle: 'solid',
  strokeColor: 'black',
  strokeWidth: 2,
}

export const colorMap: Record<StrokeColor, string> = {
  black: '#111827',
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  purple: '#7c3aed',
}
