import type { Point } from '../types/drawing'
import { majorArcSignedSweep, minorArcSignedSweep } from './sectorAngles'
import { rimPointOnCircle } from './sectorGeometry'

const RAD = Math.PI / 180

/** A 关于过 B、C 的直线的镜面反射；B≈C 时退回 A。 */
export function reflectPointAcrossLineThroughPoints(A: Point, B: Point, C: Point): Point {
  const vx = C.x - B.x
  const vy = C.y - B.y
  const len2 = vx * vx + vy * vy
  if (len2 < 1e-24) return { x: A.x, y: A.y }
  const wx = A.x - B.x
  const wy = A.y - B.y
  const t = (wx * vx + wy * vy) / len2
  const px = B.x + t * vx
  const py = B.y + t * vy
  return { x: 2 * px - A.x, y: 2 * py - A.y }
}

/**
 * TikZ「对称弧楔」几何（与画布存储对齐）：
 * - **第一点**：鼠标第一点，即画布存的圆类参考点 `firstClick`（`SectorElement.center`）。
 * - **第二、三点**：在大圆上的弧端 `P2`、`P3`（由相对画布圆心的 `startDeg/endDeg` 与 `radius` 复原）。
 * - **圆心（弧所在圆）**：`firstClick` 关于直线 `P2—P3` 的对称点 `arcCenter`（不是你点的第一点）。
 * - **圆心角（取值）**：第二与第三两端方向间 **较小** 夹角，即 `minorArcMeasureDegrees(phi0, phi1)`（TikZ `delta` 为其相反数，避免 45° 写成 −315°）。
 */
export function majorArcPieTikzMirrorArcCenter(
  firstClick: Point,
  radius: number,
  startDeg: number,
  endDeg: number,
): { arcCenter: Point; phi0: number; phi1: number } {
  const P2 = rimPointOnCircle(firstClick, radius, startDeg)
  const P3 = rimPointOnCircle(firstClick, radius, endDeg)
  const arcCenter = reflectPointAcrossLineThroughPoints(firstClick, P2, P3)
  const phi0 = (Math.atan2(P2.y - arcCenter.y, P2.x - arcCenter.x) * 180) / Math.PI
  const phi1 = (Math.atan2(P3.y - arcCenter.y, P3.x - arcCenter.x) * 180) / Math.PI
  return { arcCenter, phi0, phi1 }
}

/** 第三点只读方向：终点在大圆上距 O 为 r（与第二点半径相同）。 */
export function sectorRimFromThreeClicks(O: Point, P2: Point, P3: Point): {
  radius: number
  startAngleDeg: number
  endAngleDeg: number
} {
  const r = Math.hypot(P2.x - O.x, P2.y - O.y)
  const startRad = Math.atan2(P2.y - O.y, P2.x - O.x)
  const endRad = Math.atan2(P3.y - O.y, P3.x - O.x)
  return {
    radius: r,
    startAngleDeg: (startRad * 180) / Math.PI,
    endAngleDeg: (endRad * 180) / Math.PI,
  }
}

/** 射线 O + t*u (t>=0) 与直线 P + s*v 的交；若无唯一交或 t<0 则 null。 */
export function rayLineIntersect(O: Point, u: Point, P: Point, v: Point): Point | null {
  const ux = u.x
  const uy = u.y
  const vx = v.x
  const vy = v.y
  const px = P.x - O.x
  const py = P.y - O.y
  const det = ux * vy - uy * vx
  if (Math.abs(det) < 1e-14) return null
  const t = (px * vy - py * vx) / det
  if (t < -1e-9) return null
  return { x: O.x + t * ux, y: O.y + t * uy }
}

/**
 * 凹弧 `<(`：大圆圆心 O、半径 r、两半径方位 θ0,θ1。
 * 过起点侧半径端点作大圆垂线，与 ∠θ0–θ1 的角平分线交于凹弧圆心。
 */
export function concaveBracketArcParams(O: Point, rMain: number, startDeg: number, endDeg: number): {
  arcCenter: Point
  arcRadius: number
  P0: Point
  P1: Point
  arcSweepDeg: number
} | null {
  const t0 = startDeg * RAD
  const t1 = endDeg * RAD
  const P0 = rimPointOnCircle(O, rMain, startDeg)
  const P1 = rimPointOnCircle(O, rMain, endDeg)
  const u0 = { x: Math.cos(t0), y: Math.sin(t0) }
  const u1 = { x: Math.cos(t1), y: Math.sin(t1) }
  let bx = u0.x + u1.x
  let by = u0.y + u1.y
  const bl = Math.hypot(bx, by)
  if (bl < 1e-12) return null
  bx /= bl
  by /= bl
  const n0 = { x: -Math.sin(t0), y: Math.cos(t0) }
  const C = rayLineIntersect(O, { x: bx, y: by }, P0, n0)
  if (!C) return null
  const arcRadius = Math.hypot(P0.x - C.x, P0.y - C.y)
  if (arcRadius < 1e-12) return null
  const phi0 = (Math.atan2(P0.y - C.y, P0.x - C.x) * 180) / Math.PI
  const phi1 = (Math.atan2(P1.y - C.y, P1.x - C.x) * 180) / Math.PI
  const minor = minorArcSignedSweep(phi0, phi1)
  const major = majorArcSignedSweep(phi0, phi1)
  const midMinor = phi0 + minor / 2
  const midPtMinor = {
    x: C.x + arcRadius * Math.cos(midMinor * RAD),
    y: C.y + arcRadius * Math.sin(midMinor * RAD),
  }
  const dOM = Math.hypot(midPtMinor.x - O.x, midPtMinor.y - O.y)
  const useMinor = dOM < rMain - 1e-6
  const arcSweepDeg = useMinor ? minor : major
  return { arcCenter: C, arcRadius, P0, P1, arcSweepDeg }
}

/** 冰激凌：顶点 A，母线上 B，第三点 C 与 A 确定顶角。凹弧圆心 = 顶角平分线 ∩ 过 B 垂直于母线；弧取优弧（与凹弧 `<(` 互补）。 */
export function iceCreamArcParams(A: Point, B: Point, C: Point): {
  arcCenter: Point
  arcRadius: number
  P0: Point
  P1: Point
  arcSweepDeg: number
} | null {
  const v1x = B.x - A.x
  const v1y = B.y - A.y
  const v2x = C.x - A.x
  const v2y = C.y - A.y
  const l1 = Math.hypot(v1x, v1y)
  const l2 = Math.hypot(v2x, v2y)
  if (l1 < 1e-12 || l2 < 1e-12) return null
  const u1 = { x: v1x / l1, y: v1y / l1 }
  const u2 = { x: v2x / l2, y: v2y / l2 }
  let bx = u1.x + u2.x
  let by = u1.y + u2.y
  const bl = Math.hypot(bx, by)
  if (bl < 1e-12) return null
  bx /= bl
  by /= bl
  const nB = { x: -u1.y, y: u1.x }
  const dotNB = nB.x * bx + nB.y * by
  const n = dotNB >= 0 ? nB : { x: -nB.x, y: -nB.y }
  const Carc = rayLineIntersect(A, { x: bx, y: by }, B, n)
  if (!Carc) return null
  const rArc = Math.hypot(B.x - Carc.x, B.y - Carc.y)
  if (rArc < 1e-12) return null
  const cross = u1.x * u2.y - u1.y * u2.x
  const u2Ray = cross >= 0 ? u2 : { x: -u2.x, y: -u2.y }
  const w = { x: A.x - Carc.x, y: A.y - Carc.y }
  const dotWu = w.x * u2Ray.x + w.y * u2Ray.y
  const bq = 2 * dotWu
  const cq = w.x * w.x + w.y * w.y - rArc * rArc
  const disc = bq * bq - 4 * cq
  if (disc < 0) return null
  const rdisc = Math.sqrt(disc)
  const lam1 = (-bq - rdisc) / 2
  const lam2 = (-bq + rdisc) / 2
  const lam = Math.max(lam1, lam2, 0)
  if (lam < 1e-9) return null
  const P0 = B
  const P1 = { x: A.x + lam * u2Ray.x, y: A.y + lam * u2Ray.y }
  const phi0 = (Math.atan2(P0.y - Carc.y, P0.x - Carc.x) * 180) / Math.PI
  const phi1 = (Math.atan2(P1.y - Carc.y, P1.x - Carc.x) * 180) / Math.PI
  const arcSweepDeg = majorArcSignedSweep(phi0, phi1)
  return { arcCenter: Carc, arcRadius: rArc, P0, P1, arcSweepDeg }
}
