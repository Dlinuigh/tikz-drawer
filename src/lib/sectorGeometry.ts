import type { CoordinateSystem } from './geometry'
import type { Point } from '../types/drawing'
import { tikzToSvg } from './geometry'
import { ccwSweepDegrees } from './sectorAngles'

export { ccwSweepDegrees } from './sectorAngles'
export { ccwDistanceToRay } from './sectorAngles'

/** 与 {@link DrawingCanvas} 中 `arcPath` 一致的 SVG 圆弧标志（含 Y 翻转后的坐标系）。 */
export function sectorSvgArcFlags(deltaDeg: number): { largeArcFlag: 0 | 1; sweepFlag: 0 | 1 } {
  const δ = deltaDeg >= 360 - 1e-9 ? 360 : deltaDeg
  const largeArcFlag: 0 | 1 = δ > 180 ? 1 : 0
  const sweepFlag: 0 | 1 = δ > 0 ? 0 : 1
  return { largeArcFlag, sweepFlag }
}

/** 扇形闭合路径：中心 → 起点 → 沿圆逆时针弧（TikZ 语义）→ 闭合。 */
export function sectorPathD(
  center: Point,
  radius: number,
  startDeg: number,
  endDeg: number,
  cs: CoordinateSystem,
): string {
  const δ = ccwSweepDegrees(startDeg, endDeg)
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
