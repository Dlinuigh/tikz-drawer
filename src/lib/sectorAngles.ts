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
