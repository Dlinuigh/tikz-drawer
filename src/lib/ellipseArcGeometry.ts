import type { CoordinateSystem } from './geometry'
import { tikzToSvg } from './geometry'
import type { Point } from '../types/drawing'

/** Point on ellipse: eccentric angle θ (deg), axes rotated by rotationDeg CCW from x. */
export function ellipseArcPoint(
  center: Point,
  rx: number,
  ry: number,
  angleDeg: number,
  rotationDeg: number,
): Point {
  const θ = (angleDeg * Math.PI) / 180
  const φ = (rotationDeg * Math.PI) / 180
  const ex = rx * Math.cos(θ)
  const ey = ry * Math.sin(θ)
  return {
    x: center.x + ex * Math.cos(φ) - ey * Math.sin(φ),
    y: center.y + ex * Math.sin(φ) + ey * Math.cos(φ),
  }
}

/** Inverse: eccentric angle for a point known to lie on the ellipse. */
export function ellipseEccentricAngleForPoint(
  center: Point,
  p: Point,
  rx: number,
  ry: number,
  rotationDeg: number,
): number {
  const φ = (-rotationDeg * Math.PI) / 180
  const vx = p.x - center.x
  const vy = p.y - center.y
  const x1 = vx * Math.cos(φ) - vy * Math.sin(φ)
  const y1 = vx * Math.sin(φ) + vy * Math.cos(φ)
  return (Math.atan2(y1 / ry, x1 / rx) * 180) / Math.PI
}

export function ellipseArcPolylineD(
  center: Point,
  rx: number,
  ry: number,
  startDeg: number,
  endDeg: number,
  rotationDeg: number,
  cs: CoordinateSystem,
  segments = 48,
): string {
  const a0 = startDeg
  const a1 = endDeg
  let delta = a1 - a0
  while (delta > 360) delta -= 360
  while (delta < -360) delta += 360
  const n = Math.max(8, Math.min(96, Math.ceil((Math.abs(delta) / 360) * segments)))
  const pts: Point[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const ang = a0 + delta * t
    pts.push(ellipseArcPoint(center, rx, ry, ang, rotationDeg))
  }
  const svg = pts.map((p) => tikzToSvg(p, cs))
  return `M ${svg.map((p) => `${p.x} ${p.y}`).join(' L ')}`
}
