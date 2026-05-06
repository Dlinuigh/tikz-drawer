import type { AxisNameTikzPlacement, AxisTickMark, Point } from '../types/drawing'
import { formatNumber } from './geometry'

const gcdInts = (a: number, b: number): number => {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x === 0 ? 1 : x
}

export type AxisSegment = {
  start: Point
  end: Point
}

export const getAxesSegments = (
  origin: Point,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): { x: AxisSegment; y: AxisSegment } => ({
  x: {
    start: { x: xMin, y: origin.y },
    end: { x: xMax, y: origin.y },
  },
  y: {
    start: { x: origin.x, y: yMin },
    end: { x: origin.x, y: yMax },
  },
})

/** Tick positions in [min, max] by step; includes 0 when it lies in range. Non-positive step yields []. */
export const tickValuesInRange = (min: number, max: number, step: number): number[] => {
  if (step <= 0 || min > max) {
    return []
  }

  const ticks: number[] = []
  const start = Math.ceil(min / step) * step

  for (let v = start; v <= max + 1e-9; v += step) {
    if (v >= min - 1e-9 && v <= max + 1e-9) {
      ticks.push(Math.abs(v) < 1e-9 ? 0 : v)
    }
  }

  return ticks
}

const nearlyZeroTol = 1e-9
const tolDupTick = 1e-7

/** Normalize tiny values toward 0 (axis origin ticks). */
const normNearZero = (v: number): number => (Math.abs(v) <= nearlyZeroTol ? 0 : v)

export const axisValueInTickRange = (v: number, min: number, max: number, allowZeroTick: boolean): boolean => {
  if (v < min - nearlyZeroTol || v > max + nearlyZeroTol) {
    return false
  }
  return Math.abs(v) > nearlyZeroTol || allowZeroTick
}

/**
 * Merge step ticks with manual marks; duplicate positions collapse to one.
 * Manual `label` (non-whitespace) overrides auto formatting for matching values.
 */
export const mergeAxisTickMarks = (
  stepped: readonly number[],
  manual: readonly AxisTickMark[] | undefined,
  min: number,
  max: number,
): Array<{ value: number; label?: string }> => {
  const manualList =
    manual?.map((m) => ({
      value: normNearZero(m.value),
      label: m.label,
    })) ?? []
  const allowZero = manualList.some((m) => Math.abs(m.value) <= nearlyZeroTol)

  const steppedFiltered = stepped
    .map(normNearZero)
    .filter((v) => axisValueInTickRange(v, min, max, true))

  const fromManualPositions = manualList
    .filter((m) => axisValueInTickRange(m.value, min, max, allowZero))
    .map((m) => m.value)

  const all = [...steppedFiltered, ...fromManualPositions].sort((a, b) => a - b)
  const uniq: number[] = []
  for (const v of all) {
    if (uniq.length === 0 || Math.abs(v - uniq[uniq.length - 1]) > tolDupTick) {
      uniq.push(v)
    }
  }

  const labelForValue = (v: number): string | undefined => {
    const m = [...manualList].reverse().find((mk) => Math.abs(mk.value - v) <= tolDupTick)
    if (m?.label === undefined) {
      return undefined
    }
    const t = m.label.trim()
    return t === '' ? undefined : t
  }

  return uniq.map((value) => {
    const la = labelForValue(value)
    return la !== undefined ? { value, label: la } : { value }
  })
}

export const svgNameLabelAttrs = (
  placement: AxisNameTikzPlacement,
): { textAnchor: 'start' | 'middle' | 'end'; dominantBaseline: 'alphabetic' | 'central' | 'hanging' | 'auto' } => {
  switch (placement) {
    case 'right':
      return { textAnchor: 'start', dominantBaseline: 'central' }
    case 'left':
      return { textAnchor: 'end', dominantBaseline: 'central' }
    case 'above':
      return { textAnchor: 'middle', dominantBaseline: 'auto' }
    case 'below':
      return { textAnchor: 'middle', dominantBaseline: 'hanging' }
    case 'above right':
      return { textAnchor: 'start', dominantBaseline: 'auto' }
    case 'above left':
      return { textAnchor: 'end', dominantBaseline: 'auto' }
    case 'below right':
      return { textAnchor: 'start', dominantBaseline: 'hanging' }
    case 'below left':
      return { textAnchor: 'end', dominantBaseline: 'hanging' }
    default:
      return { textAnchor: 'start', dominantBaseline: 'central' }
  }
}

/** Human-friendly tick labels: prefers `n/d` when close to low-denominator rational. */
export const formatTickLabel = (value: number): string => {
  const maxDen = 24
  for (let den = 1; den <= maxDen; den++) {
    const num = Math.round(value * den)
    if (Math.abs(value - num / den) < 1e-5) {
      const g = gcdInts(num, den)
      const n = num / g
      const d = den / g
      if (d === 1) {
        return formatNumber(n)
      }
      const sign = n < 0 ? '-' : ''
      return `${sign}${Math.abs(Math.round(n))}/${Math.round(d)}`
    }
  }
  return formatNumber(value)
}

export const tickMarkDisplayLabel = (tick: { value: number; label?: string }): string =>
  tick.label ?? formatTickLabel(tick.value)

/** Half-length of tick marks and label offset in TikZ units (y-up). */
export const axesTickHalfLength = 0.12
export const axesTickLabelOffset = 0.28

/** Offset past axis tip for $x$ / $y$ axis name nodes (TikZ units). */
export const axesNameLabelOffset = 0.22
