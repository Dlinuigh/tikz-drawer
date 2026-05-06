import type { Point } from '../types/drawing'

export type CoordinateSystem = {
  width: number
  height: number
  origin: Point
  pixelsPerUnit: number
  gridStep: number
  snapToGrid: boolean
}

export const defaultCoordinateSystem: CoordinateSystem = {
  width: 800,
  height: 600,
  origin: { x: 400, y: 300 },
  pixelsPerUnit: 50,
  gridStep: 1,
  snapToGrid: true,
}

/** SVG pixel position of TikZ (0,0); panning only changes this. */
export const defaultViewOrigin = (): Point => ({ ...defaultCoordinateSystem.origin })

export const coordinateSystemWithOrigin = (origin: Point): CoordinateSystem => ({
  ...defaultCoordinateSystem,
  origin: { ...origin },
})

export const svgToTikz = (point: Point, coordinateSystem = defaultCoordinateSystem): Point => ({
  x: (point.x - coordinateSystem.origin.x) / coordinateSystem.pixelsPerUnit,
  y: (coordinateSystem.origin.y - point.y) / coordinateSystem.pixelsPerUnit,
})

export const tikzToSvg = (point: Point, coordinateSystem = defaultCoordinateSystem): Point => ({
  x: point.x * coordinateSystem.pixelsPerUnit + coordinateSystem.origin.x,
  y: coordinateSystem.origin.y - point.y * coordinateSystem.pixelsPerUnit,
})

export const snapTikzPoint = (point: Point, coordinateSystem = defaultCoordinateSystem): Point => {
  if (!coordinateSystem.snapToGrid) {
    return point
  }

  return {
    x: Math.round(point.x / coordinateSystem.gridStep) * coordinateSystem.gridStep,
    y: Math.round(point.y / coordinateSystem.gridStep) * coordinateSystem.gridStep,
  }
}

export const formatNumber = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y)

export type ArcGeometry = {
  center: Point
  radius: number
  startAngle: number
  endAngle: number
}

export const getArcGeometry = (start: Point, end: Point, sweepAngle: number): ArcGeometry | null => {
  const chord = distance(start, end)
  const theta = (sweepAngle * Math.PI) / 180

  if (chord === 0 || Math.abs(Math.sin(theta / 2)) < 0.0001) {
    return null
  }

  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  }
  const normal = {
    x: -(end.y - start.y) / chord,
    y: (end.x - start.x) / chord,
  }
  const offset = chord / (2 * Math.tan(theta / 2))
  const center = {
    x: midpoint.x + normal.x * offset,
    y: midpoint.y + normal.y * offset,
  }
  const radius = distance(center, start)
  const startAngle = (Math.atan2(start.y - center.y, start.x - center.x) * 180) / Math.PI

  return {
    center,
    radius,
    startAngle,
    endAngle: startAngle + sweepAngle,
  }
}

export const pointToTikz = (point: Point): string => `(${formatNumber(point.x)},${formatNumber(point.y)})`
