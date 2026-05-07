import type { Point } from '../types/drawing'
import type { PolarAngleUnit } from '../types/drawing'

/** TikZ-style: angle from +x axis, CCW, radians in trig. */
export function polarToCartesian(r: number, angleRad: number): Point {
  return { x: r * Math.cos(angleRad), y: r * Math.sin(angleRad) }
}

export function cartesianToPolar(p: Point): { r: number; thetaRad: number } {
  const r = Math.hypot(p.x, p.y)
  const thetaRad = Math.atan2(p.y, p.x)
  return { r, thetaRad }
}

export function polarInputToCartesian(r: number, angle: number, unit: PolarAngleUnit): Point {
  const rad = unit === 'deg' ? (angle * Math.PI) / 180 : angle
  return polarToCartesian(r, rad)
}
