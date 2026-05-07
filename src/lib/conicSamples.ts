import type { ConicCurveElement, Point } from '../types/drawing'

function rotate(p: Point, center: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180
  const dx = p.x - center.x
  const dy = p.y - center.y
  const c = Math.cos(r)
  const s = Math.sin(r)
  return { x: center.x + dx * c - dy * s, y: center.y + dx * s + dy * c }
}

/** Local frame samples around origin, then rotated+translated. */
export function sampleConicCurve(el: ConicCurveElement): Point[] {
  const { center, semiAxisX: a, semiAxisY: b, rotationDeg, domainMin, domainMax, samples, conicKind, hyperbolaBranch } = el
  const n = Math.max(8, Math.min(400, Math.floor(samples)))
  const pts: Point[] = []

  if (conicKind === 'parabola') {
    const p = Math.max(1e-6, b)
    for (let i = 0; i <= n; i++) {
      const u = domainMin + ((domainMax - domainMin) * i) / n
      const x = u
      const y = (x * x) / (4 * p)
      pts.push(rotate({ x, y }, { x: 0, y: 0 }, rotationDeg))
    }
  } else if (conicKind === 'ellipse') {
    const aa = Math.max(1e-6, a)
    const bb = Math.max(1e-6, b)
    for (let i = 0; i <= n; i++) {
      const ang = domainMin + ((domainMax - domainMin) * i) / n
      const x = aa * Math.cos(ang)
      const y = bb * Math.sin(ang)
      pts.push(rotate({ x, y }, { x: 0, y: 0 }, rotationDeg))
    }
  } else {
    const aa = Math.max(1e-6, a)
    const bb = Math.max(1e-6, b)
    const pushBranch = (sign: 1 | -1) => {
      for (let i = 0; i <= n; i++) {
        const u = domainMin + ((domainMax - domainMin) * i) / n
        const x = sign * aa * Math.cosh(u)
        const y = bb * Math.sinh(u)
        pts.push(rotate({ x, y }, { x: 0, y: 0 }, rotationDeg))
      }
    }
    if (hyperbolaBranch === 'both') {
      pushBranch(1)
      pushBranch(-1)
    } else if (hyperbolaBranch === 'positive') {
      pushBranch(1)
    } else {
      pushBranch(-1)
    }
  }

  return pts.map((p) => ({ x: p.x + center.x, y: p.y + center.y }))
}
