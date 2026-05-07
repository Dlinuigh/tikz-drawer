import { evaluateExpression } from './expression'
import type { FunctionPlotElement, Point } from '../types/drawing'

/** Evaluate implicit F(x,y)=0 on a grid; emit segments along grid edges where sign changes (MVP). */
export function sampleImplicit(
  equation: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridN: number,
): Point[] {
  const prep = equation.trim().replace(/\s+/g, '').toLowerCase()
  if (!prep) return []

  const evalF = (x: number, y: number): number => {
    let s = prep
    s = s.replace(/sin\(/g, 'Math.sin(')
    s = s.replace(/cos\(/g, 'Math.cos(')
    s = s.replace(/tan\(/g, 'Math.tan(')
    s = s.replace(/sqrt\(/g, 'Math.sqrt(')
    s = s.replace(/abs\(/g, 'Math.abs(')
    s = s.replace(/exp\(/g, 'Math.exp(')
    s = s.replace(/log\(/g, 'Math.log(')
    s = s.replace(/\^/g, '**')
    s = s.replace(/pi/g, String(Math.PI))
    s = s.replace(/\be\b/g, String(Math.E))
    const fn = new Function('x', 'y', `"use strict"; return (${s});`)
    return Number(fn(x, y))
  }

  const nx = Math.max(8, Math.min(80, gridN))
  const ny = nx
  const dx = (xMax - xMin) / nx
  const dy = (yMax - yMin) / ny
  const pts: Point[] = []

  const interp = (x1: number, y1: number, x2: number, y2: number, v1: number, v2: number) => {
    const t = Math.abs(v1) / (Math.abs(v1) + Math.abs(v2) + 1e-15)
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) }
  }

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const x1 = xMin + i * dx
      const y1 = yMin + j * dy
      const x2 = x1 + dx
      const y2 = y1 + dy
      const v00 = evalF(x1, y1)
      const v10 = evalF(x2, y1)
      const v01 = evalF(x1, y2)
      const v11 = evalF(x2, y2)
      if (![v00, v10, v01, v11].every(Number.isFinite)) continue

      if (v00 * v10 <= 0) pts.push(interp(x1, y1, x2, y1, v00, v10))
      if (v01 * v11 <= 0) pts.push(interp(x1, y2, x2, y2, v01, v11))
      if (v00 * v01 <= 0) pts.push(interp(x1, y1, x1, y2, v00, v01))
      if (v10 * v11 <= 0) pts.push(interp(x2, y1, x2, y2, v10, v11))
    }
  }

  return pts
}

export function sampleFunctionPlot(el: FunctionPlotElement): Point[] {
  const n = Math.max(8, Math.min(500, Math.floor(el.samples)))
  const pts: Point[] = []
  const ox = el.plotOffset?.x ?? 0
  const oy = el.plotOffset?.y ?? 0

  if (el.implicitEquation?.trim()) {
    return sampleImplicit(el.implicitEquation, el.domainMin, el.domainMax, el.domainMin, el.domainMax, Math.floor(Math.sqrt(n))).map(
      (p) => ({ x: p.x + ox, y: p.y + oy }),
    )
  }

  const mode = el.coordinateMode

  for (let i = 0; i <= n; i++) {
    const u = el.domainMin + ((el.domainMax - el.domainMin) * i) / n
    try {
      if (mode === 'cartesian') {
        const x = u
        const y = evaluateExpression(el.expression, 'cartesian', x)
        if (Number.isFinite(y)) pts.push({ x: x + ox, y: y + oy })
      } else {
        const theta = u
        const r = evaluateExpression(el.expression, 'polar', theta)
        if (Number.isFinite(r)) pts.push({ x: r * Math.cos(theta) + ox, y: r * Math.sin(theta) + oy })
      }
    } catch {
      /* skip sample */
    }
  }
  return pts
}
