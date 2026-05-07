import type { CoordinateSystem } from './geometry'
import { getArcGeometry, tikzToSvg } from './geometry'
import type { Point } from '../types/drawing'
import { majorArcSignedSweep, minorArcSignedSweep, sectorPieSweepDeg } from './sectorAngles'

export { ccwDistanceToRay } from './sectorAngles'
export { ccwSweepDegrees } from './sectorAngles'
export { majorArcSignedSweep, minorArcMeasureDegrees, minorArcSignedSweep, sectorPieSweepDeg } from './sectorAngles'

/** 与 {@link DrawingCanvas} 中饼楔、对称弧楔主圆路径一致：饼楔用 {@link sectorPieSweepDeg}；对称弧楔用 {@link majorArcSignedSweep}。 */
export function sectorSvgArcFlags(deltaDeg: number): { largeArcFlag: 0 | 1; sweepFlag: 0 | 1 } {
  const δ = deltaDeg >= 360 - 1e-9 ? 360 : deltaDeg
  const largeArcFlag: 0 | 1 = δ > 180 ? 1 : 0
  const sweepFlag: 0 | 1 = δ > 0 ? 0 : 1
  return { largeArcFlag, sweepFlag }
}

/**
 * 凹弧 / 冰激凌等有符号扫角：`deltaDeg` 可为负；须用 **|δ|** 判断 large-arc。
 */
export function sectorSvgArcFlagsSignedSweep(deltaDeg: number): { largeArcFlag: 0 | 1; sweepFlag: 0 | 1 } {
  let mag = Math.abs(deltaDeg)
  if (mag >= 360 - 1e-9) mag = 360
  const largeArcFlag: 0 | 1 = mag > 180 ? 1 : 0
  const sweepFlag: 0 | 1 = deltaDeg > 0 ? 0 : 1
  return { largeArcFlag, sweepFlag }
}

/** 扇形（饼楔）：中心 → 第一条半径端点 → CCW 弧至第二条半径端点 → 闭合。 */
export function sectorPathD(
  center: Point,
  radius: number,
  startDeg: number,
  endDeg: number,
  cs: CoordinateSystem,
): string {
  const δ = sectorPieSweepDeg(startDeg, endDeg)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const p0 = {
    x: center.x + radius * Math.cos(toRad(startDeg)),
    y: center.y + radius * Math.sin(toRad(startDeg)),
  }
  const p1 = {
    x: center.x + radius * Math.cos(toRad(endDeg)),
    y: center.y + radius * Math.sin(toRad(endDeg)),
  }
  const svg0 = tikzToSvg(p0, cs)
  const svg1 = tikzToSvg(p1, cs)
  const c = tikzToSvg(center, cs)
  const rpx = radius * cs.pixelsPerUnit
  const { largeArcFlag, sweepFlag } = sectorSvgArcFlags(δ)
  return `M ${c.x} ${c.y} L ${svg0.x} ${svg0.y} A ${rpx} ${rpx} 0 ${largeArcFlag} ${sweepFlag} ${svg1.x} ${svg1.y} Z`
}

/** 弓形：弦（两端点）+ 两端的较小圆弧，与饼楔共弦、较小弧圆心角相同。 */
export function circularSegmentPathD(
  center: Point,
  radius: number,
  startDeg: number,
  endDeg: number,
  cs: CoordinateSystem,
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const A = {
    x: center.x + radius * Math.cos(toRad(startDeg)),
    y: center.y + radius * Math.sin(toRad(startDeg)),
  }
  const B = {
    x: center.x + radius * Math.cos(toRad(endDeg)),
    y: center.y + radius * Math.sin(toRad(endDeg)),
  }
  const svgA = tikzToSvg(A, cs)
  const svgB = tikzToSvg(B, cs)
  const sweepBA = minorArcSignedSweep(endDeg, startDeg)
  const rpx = radius * cs.pixelsPerUnit
  const geo = getArcGeometry(B, A, sweepBA)
  if (!geo) {
    return `M ${svgA.x} ${svgA.y} L ${svgB.x} ${svgB.y} Z`
  }
  const largeArcFlag = Math.abs(sweepBA) > 180 ? 1 : 0
  const sweepFlag = sweepBA > 0 ? 0 : 1
  return `M ${svgA.x} ${svgA.y} L ${svgB.x} ${svgB.y} A ${rpx} ${rpx} 0 ${largeArcFlag} ${sweepFlag} ${svgA.x} ${svgA.y} Z`
}

export function rimPointOnCircle(center: Point, radius: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180
  return { x: center.x + radius * Math.cos(rad), y: center.y + radius * Math.sin(rad) }
}

export { inferTangentApexFromRim, resolveTangentApex } from './geometry'

/**
 * 对称弧楔（`majorArcPie`）：圆心→第一条半径→弧→第二条半径；边界弧取 {@link majorArcSignedSweep}（与饼楔互补）。
 */
export function majorArcSectorPathD(
  center: Point,
  radius: number,
  startDeg: number,
  endDeg: number,
  cs: CoordinateSystem,
): string {
  const δ = majorArcSignedSweep(startDeg, endDeg)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const p0 = {
    x: center.x + radius * Math.cos(toRad(startDeg)),
    y: center.y + radius * Math.sin(toRad(startDeg)),
  }
  const p1 = {
    x: center.x + radius * Math.cos(toRad(endDeg)),
    y: center.y + radius * Math.sin(toRad(endDeg)),
  }
  const svg0 = tikzToSvg(p0, cs)
  const svg1 = tikzToSvg(p1, cs)
  const c = tikzToSvg(center, cs)
  const rpx = radius * cs.pixelsPerUnit
  const { largeArcFlag, sweepFlag } = sectorSvgArcFlags(δ)
  return `M ${c.x} ${c.y} L ${svg0.x} ${svg0.y} A ${rpx} ${rpx} 0 ${largeArcFlag} ${sweepFlag} ${svg1.x} ${svg1.y} Z`
}
