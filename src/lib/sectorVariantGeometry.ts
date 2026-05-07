import type { CoordinateSystem } from './geometry'
import { tikzToSvg } from './geometry'
import type { Point } from '../types/drawing'
import { ccwSweepDegrees } from './sectorAngles'
import { concaveBracketArcParams, iceCreamArcParams } from './sectorBracketMath'
import { rimPointOnCircle, sectorSvgArcFlagsSignedSweep } from './sectorGeometry'

export { sectorRimFromThreeClicks } from './sectorBracketMath'
export { majorArcSectorPathD } from './sectorGeometry'

function sectorPathFallbackPie(
  O: Point,
  r: number,
  startDeg: number,
  endDeg: number,
  cs: CoordinateSystem,
): string {
  const δ = ccwSweepDegrees(startDeg, endDeg)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const p0 = { x: O.x + r * Math.cos(toRad(startDeg)), y: O.y + r * Math.sin(toRad(startDeg)) }
  const p1 = { x: O.x + r * Math.cos(toRad(endDeg)), y: O.y + r * Math.sin(toRad(endDeg)) }
  const svg0 = tikzToSvg(p0, cs)
  const svg1 = tikzToSvg(p1, cs)
  const c = tikzToSvg(O, cs)
  const rpx = r * cs.pixelsPerUnit
  const { largeArcFlag, sweepFlag } = sectorSvgArcFlagsSignedSweep(δ)
  return `M ${c.x} ${c.y} L ${svg0.x} ${svg0.y} A ${rpx} ${rpx} 0 ${largeArcFlag} ${sweepFlag} ${svg1.x} ${svg1.y} Z`
}

export function concaveBracketPathD(
  O: Point,
  rMain: number,
  startDeg: number,
  endDeg: number,
  cs: CoordinateSystem,
): string {
  const g = concaveBracketArcParams(O, rMain, startDeg, endDeg)
  if (!g) {
    return sectorPathFallbackPie(O, rMain, startDeg, endDeg, cs)
  }
  const { arcRadius, P0, P1, arcSweepDeg } = g
  const svgO = tikzToSvg(O, cs)
  const svg0 = tikzToSvg(P0, cs)
  const svg1 = tikzToSvg(P1, cs)
  const rpx = arcRadius * cs.pixelsPerUnit
  const δ = arcSweepDeg >= 360 - 1e-9 ? 360 : arcSweepDeg
  const { largeArcFlag, sweepFlag } = sectorSvgArcFlagsSignedSweep(δ)
  return `M ${svgO.x} ${svgO.y} L ${svg0.x} ${svg0.y} A ${rpx} ${rpx} 0 ${largeArcFlag} ${sweepFlag} ${svg1.x} ${svg1.y} Z`
}

export function iceCreamPathD(A: Point, B: Point, C: Point, cs: CoordinateSystem): string {
  const g = iceCreamArcParams(A, B, C)
  if (!g) return ''
  const { arcRadius, P0, P1, arcSweepDeg } = g
  const svgA = tikzToSvg(A, cs)
  const svg0 = tikzToSvg(P0, cs)
  const svg1 = tikzToSvg(P1, cs)
  const rpx = arcRadius * cs.pixelsPerUnit
  const δ = arcSweepDeg >= 360 - 1e-9 ? 360 : arcSweepDeg
  const { largeArcFlag, sweepFlag } = sectorSvgArcFlagsSignedSweep(δ)
  return `M ${svgA.x} ${svgA.y} L ${svg0.x} ${svg0.y} A ${rpx} ${rpx} 0 ${largeArcFlag} ${sweepFlag} ${svg1.x} ${svg1.y} Z`
}

/** 持久化后的冰激凌（center=凹弧圆心，radius=凹弧半径，角度相对凹弧圆心）。 */
export function iceCreamPathFromStored(
  apex: Point,
  arcCenter: Point,
  arcRadius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  arcSweepDeg: number,
  cs: CoordinateSystem,
): string {
  const P0 = rimPointOnCircle(arcCenter, arcRadius, startAngleDeg)
  const P1 = rimPointOnCircle(arcCenter, arcRadius, endAngleDeg)
  const svgA = tikzToSvg(apex, cs)
  const svg0 = tikzToSvg(P0, cs)
  const svg1 = tikzToSvg(P1, cs)
  const rpx = arcRadius * cs.pixelsPerUnit
  const δ = arcSweepDeg >= 360 - 1e-9 ? 360 : arcSweepDeg
  const { largeArcFlag, sweepFlag } = sectorSvgArcFlagsSignedSweep(δ)
  return `M ${svgA.x} ${svgA.y} L ${svg0.x} ${svg0.y} A ${rpx} ${rpx} 0 ${largeArcFlag} ${sweepFlag} ${svg1.x} ${svg1.y} Z`
}
