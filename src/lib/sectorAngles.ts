/**
 * TikZ `arc[start angle=α, end angle=β]`：从 α 逆时针走到 β 的有向角（度），落在 (0, 360]。
 */
export function ccwSweepDegrees(startDeg: number, endDeg: number): number {
  let d = endDeg - startDeg
  d = ((d % 360) + 360) % 360
  return d < 1e-9 ? 360 : d
}

/** CCW 角距 [0,360)，与起始射线重合时为 0。 */
export function ccwDistanceToRay(startDeg: number, angleDeg: number): number {
  let d = angleDeg - startDeg
  d = ((d % 360) + 360) % 360
  return d < 1e-9 ? 0 : d
}

/** 扇形饼楔边界弧（两半径间 CCW）的扫角，即 `ccwSweepDegrees`。 */
export function sectorPieSweepDeg(startDeg: number, endDeg: number): number {
  return ccwSweepDegrees(startDeg, endDeg)
}

/**
 * 弦 AB 所对的较小圆弧圆心角（度），(0,180]，整圆退化为 360。
 */
export function minorArcMeasureDegrees(startDeg: number, endDeg: number): number {
  const δ = ccwSweepDegrees(startDeg, endDeg)
  if (δ >= 360 - 1e-9) return 360
  return Math.min(δ, 360 - δ)
}

/**
 * 沿较短圆弧从「起始方位」走到「终止方位」的扫角（带符号），用于 `getArcGeometry(A,B,sweep)`。
 * δ≤180 时为 +δ；δ>180 时为 δ−360（负值表示顺时针走向较短弧）。
 */
export function minorArcSignedSweep(startDeg: number, endDeg: number): number {
  const δ = ccwSweepDegrees(startDeg, endDeg)
  if (δ >= 360 - 1e-9) return 360
  return δ <= 180 ? δ : δ - 360
}

/** 沿圆弧从 start 到 end 取「较长」圆弧的有向扫角（与 {@link minorArcSignedSweep} 互补）。 */
export function majorArcSignedSweep(startDeg: number, endDeg: number): number {
  const m = minorArcSignedSweep(startDeg, endDeg)
  if (m >= 360 - 1e-9) return 360
  if (m >= 0) return m - 360
  return m + 360
}
