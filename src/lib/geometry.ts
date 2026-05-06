import type { DrawingElement, Point } from '../types/drawing'

export type CoordinateSystem = {
  width: number
  height: number
  origin: Point
  pixelsPerUnit: number
  gridStep: number
  snapToGrid: boolean
}

export const defaultCoordinateSystem: CoordinateSystem = {
  width: 800,
  height: 600,
  origin: { x: 400, y: 300 },
  pixelsPerUnit: 50,
  gridStep: 1,
  snapToGrid: true,
}

/** SVG pixel position of TikZ (0,0); panning only changes this. */
export const defaultViewOrigin = (): Point => ({ ...defaultCoordinateSystem.origin })

export const coordinateSystemWithOrigin = (origin: Point): CoordinateSystem => ({
  ...defaultCoordinateSystem,
  origin: { ...origin },
})

export const svgToTikz = (point: Point, coordinateSystem = defaultCoordinateSystem): Point => ({
  x: (point.x - coordinateSystem.origin.x) / coordinateSystem.pixelsPerUnit,
  y: (coordinateSystem.origin.y - point.y) / coordinateSystem.pixelsPerUnit,
})

export const tikzToSvg = (point: Point, coordinateSystem = defaultCoordinateSystem): Point => ({
  x: point.x * coordinateSystem.pixelsPerUnit + coordinateSystem.origin.x,
  y: coordinateSystem.origin.y - point.y * coordinateSystem.pixelsPerUnit,
})

export const snapTikzPoint = (point: Point, coordinateSystem = defaultCoordinateSystem, gridStep?: number): Point => {
  const step = gridStep ?? coordinateSystem.gridStep
  if (!coordinateSystem.snapToGrid) {
    return point
  }

  return {
    x: Math.round(point.x / step) * step,
    y: Math.round(point.y / step) * step,
  }
}

export const formatNumber = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y)

export type ArcGeometry = {
  center: Point
  radius: number
  startAngle: number
  endAngle: number
}

export const getArcGeometry = (start: Point, end: Point, sweepAngle: number): ArcGeometry | null => {
  const chord = distance(start, end)
  const theta = (sweepAngle * Math.PI) / 180

  if (chord === 0 || Math.abs(Math.sin(theta / 2)) < 0.0001) {
    return null
  }

  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  }
  const normal = {
    x: -(end.y - start.y) / chord,
    y: (end.x - start.x) / chord,
  }
  const offset = chord / (2 * Math.tan(theta / 2))
  const center = {
    x: midpoint.x + normal.x * offset,
    y: midpoint.y + normal.y * offset,
  }
  const radius = distance(center, start)
  const startAngle = (Math.atan2(start.y - center.y, start.x - center.x) * 180) / Math.PI

  return {
    center,
    radius,
    startAngle,
    endAngle: startAngle + sweepAngle,
  }
}

export const pointToTikz = (point: Point): string => `(${formatNumber(point.x)},${formatNumber(point.y)})`

/* ──────────── 求交点 ──────────── */

/** 两条直线（无限延长）的交点。返回交点或 null（平行不重合）。 */
export const lineLineIntersection = (
  a1: Point, a2: Point,
  b1: Point, b2: Point,
): Point | null => {
  const denom = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x)
  if (Math.abs(denom) < 1e-12) return null
  const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / denom
  return {
    x: a1.x + t * (a2.x - a1.x),
    y: a1.y + t * (a2.y - a1.y),
  }
}

/** 线段与线段的交点（在两条线段范围内）。 */
export const segmentSegmentIntersection = (
  a1: Point, a2: Point,
  b1: Point, b2: Point,
): Point | null => {
  const denom = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x)
  if (Math.abs(denom) < 1e-12) return null
  const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / denom
  const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / denom
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return {
    x: a1.x + t * (a2.x - a1.x),
    y: a1.y + t * (a2.y - a1.y),
  }
}

/** 直线与圆的交点。返回 0/1/2 个交点。 */
export const lineCircleIntersections = (
  lineStart: Point, lineEnd: Point,
  center: Point, radius: number,
): Point[] => {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const fx = lineStart.x - center.x
  const fy = lineStart.y - center.y
  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - radius * radius
  let discriminant = b * b - 4 * a * c
  if (discriminant < 0) return []
  if (discriminant < 1e-12) discriminant = 0
  const t1 = (-b + Math.sqrt(discriminant)) / (2 * a)
  const t2 = (-b - Math.sqrt(discriminant)) / (2 * a)
  const results: Point[] = []
  const addIfInRange = (t: number) => {
    if (t >= 0 && t <= 1) {
      results.push({ x: lineStart.x + t * dx, y: lineStart.y + t * dy })
    }
  }
  if (discriminant === 0) {
    addIfInRange(t1)
  } else {
    addIfInRange(t1)
    addIfInRange(t2)
  }
  return results
}

/** 两个圆的交点。 */
export const circleCircleIntersections = (
  c1: Point, r1: number,
  c2: Point, r2: number,
): Point[] => {
  const d = distance(c1, c2)
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return []
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(r1 * r1 - a * a)
  const mx = c1.x + a * (c2.x - c1.x) / d
  const my = c1.y + a * (c2.y - c1.y) / d
  const results: Point[] = []
  if (h === 0) {
    results.push({ x: mx, y: my })
  } else {
    results.push({
      x: mx + h * (c2.y - c1.y) / d,
      y: my - h * (c2.x - c1.x) / d,
    })
    results.push({
      x: mx - h * (c2.y - c1.y) / d,
      y: my + h * (c2.x - c1.x) / d,
    })
  }
  return results
}

/** 求两个图元的交点（支持 line/segment、circle、ellipse 的近似）。 */
export type ElementIntersectionInput = {
  type: DrawingElement['type']
  points: Point[]
  center?: Point
  radius?: number
  xRadius?: number
  yRadius?: number
}

export const computeIntersections = (a: DrawingElement, b: DrawingElement): Point[] => {
  const extractInfo = (el: DrawingElement): ElementIntersectionInput => {
    if (el.type === 'line') return { type: 'line', points: [el.start, el.end] }
    if (el.type === 'polyline') {
      const pts: Point[] = []
      for (let i = 0; i < el.points.length - 1; i++) {
        pts.push(el.points[i], el.points[i + 1])
      }
      return { type: 'polyline', points: pts }
    }
    if (el.type === 'circle') {
      const r = distance(el.center, el.radiusPoint)
      return { type: 'circle', points: [], center: el.center, radius: r }
    }
    if (el.type === 'ellipse') {
      return {
        type: 'ellipse',
        points: [],
        center: el.center,
        xRadius: Math.abs(el.radiusPoint.x - el.center.x),
        yRadius: Math.abs(el.radiusPoint.y - el.center.y),
      }
    }
    if (el.type === 'rectangle') {
      return { type: 'rectangle', points: [el.start, el.end] }
    }
    if (el.type === 'arc') {
      return { type: 'arc', points: [el.start, el.end], center: getArcGeometry(el.start, el.end, el.sweepAngle)?.center }
    }
    return { type: 'line', points: [] }
  }

  const infA = extractInfo(a)
  const infB = extractInfo(b)
  const results: Point[] = []

  // line-line
  if (infA.points.length >= 2 && infB.points.length >= 2 &&
      ['line', 'polyline', 'rectangle', 'arc'].includes(infA.type) &&
      ['line', 'polyline', 'rectangle', 'arc'].includes(infB.type)) {
    for (let i = 0; i < infA.points.length - 1; i += 2) {
      for (let j = 0; j < infB.points.length - 1; j += 2) {
        const pt = segmentSegmentIntersection(
          infA.points[i], infA.points[i + 1],
          infB.points[j], infB.points[j + 1],
        )
        if (pt && !results.some((p) => distance(p, pt) < 0.01)) results.push(pt)
      }
    }
  }

  // line-circle
  const tryLineCircle = (linePts: Point[], center: Point, radius: number) => {
    for (let i = 0; i < linePts.length - 1; i += 2) {
      for (const pt of lineCircleIntersections(linePts[i], linePts[i + 1], center, radius)) {
        if (!results.some((p) => distance(p, pt) < 0.01)) results.push(pt)
      }
    }
  }

  if (infA.points.length >= 2 && infB.type === 'circle' && infB.center && infB.radius !== undefined) {
    tryLineCircle(infA.points, infB.center, infB.radius)
  }
  if (infB.points.length >= 2 && infA.type === 'circle' && infA.center && infA.radius !== undefined) {
    tryLineCircle(infB.points, infA.center, infA.radius)
  }

  // circle-circle
  if (infA.type === 'circle' && infB.type === 'circle' &&
      infA.center && infA.radius !== undefined && infB.center && infB.radius !== undefined) {
    for (const pt of circleCircleIntersections(infA.center, infA.radius, infB.center, infB.radius)) {
      if (!results.some((p) => distance(p, pt) < 0.01)) results.push(pt)
    }
  }

  return results
}


