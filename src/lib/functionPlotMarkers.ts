import { evaluateExpression } from './expression'
import type { FunctionPlotElement, Point } from '../types/drawing'

const EPS = 1e-8

/** Zeros and local extrema for Cartesian explicit y=f(x) only. */
export function computeFunctionPlotMarkers(el: FunctionPlotElement): {
  zeros: Point[]
  maxima: Point[]
  minima: Point[]
} {
  const zeros: Point[] = []
  const maxima: Point[] = []
  const minima: Point[] = []

  if (el.implicitEquation?.trim() || el.coordinateMode !== 'cartesian') {
    return { zeros, maxima, minima }
  }

  const n = Math.max(64, Math.min(800, Math.floor(el.samples * 2)))
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i <= n; i++) {
    const x = el.domainMin + ((el.domainMax - el.domainMin) * i) / n
    try {
      const y = evaluateExpression(el.expression, 'cartesian', x)
      if (Number.isFinite(y)) {
        xs.push(x)
        ys.push(y)
      }
    } catch {
      /* skip */
    }
  }

  if (xs.length < 3) return { zeros, maxima, minima }

  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i]
    const x1 = xs[i + 1]
    const y0 = ys[i]
    const y1 = ys[i + 1]
    if (y0 * y1 <= 0 && y0 !== 0 && y1 !== 0) {
      const t = Math.abs(y0) / (Math.abs(y0) + Math.abs(y1))
      const xr = x0 + t * (x1 - x0)
      zeros.push({ x: xr, y: 0 })
    } else if (Math.abs(y0) < EPS) {
      const dup = zeros.some((z) => Math.abs(z.x - x0) < EPS * 10)
      if (!dup) zeros.push({ x: x0, y: 0 })
    }
  }

  for (let i = 1; i < xs.length - 1; i++) {
    const yPrev = ys[i - 1]
    const yMid = ys[i]
    const yNext = ys[i + 1]
    if (![yPrev, yMid, yNext].every(Number.isFinite)) continue
    if (yMid > yPrev && yMid > yNext) {
      maxima.push({ x: xs[i], y: yMid })
    } else if (yMid < yPrev && yMid < yNext) {
      minima.push({ x: xs[i], y: yMid })
    }
  }

  const dedupe = (pts: Point[]) => {
    const out: Point[] = []
    for (const p of pts) {
      if (!out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < EPS * 50)) out.push(p)
    }
    return out
  }

  return {
    zeros: dedupe(zeros),
    maxima: dedupe(maxima),
    minima: dedupe(minima),
  }
}
