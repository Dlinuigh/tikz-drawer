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

/* ──────────── 精确求交：椭圆、圆弧 ──────────── */

/** 椭圆（轴对齐）与线段的交点，精确二次方程求解。 */
export const ellipseLineIntersections = (
  lineStart: Point, lineEnd: Point,
  center: Point, xRadius: number, yRadius: number,
): Point[] => {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const px = lineStart.x - center.x
  const py = lineStart.y - center.y

  const A = (dx * dx) / (xRadius * xRadius) + (dy * dy) / (yRadius * yRadius)
  const B = 2 * ((px * dx) / (xRadius * xRadius) + (py * dy) / (yRadius * yRadius))
  const C = (px * px) / (xRadius * xRadius) + (py * py) / (yRadius * yRadius) - 1

  let d = B * B - 4 * A * C
  if (d < 0) return []
  if (d < 1e-12) d = 0

  const t1 = (-B + Math.sqrt(d)) / (2 * A)
  const t2 = (-B - Math.sqrt(d)) / (2 * A)
  const results: Point[] = []
  const add = (t: number) => { if (t >= 0 && t <= 1) results.push({ x: lineStart.x + t * dx, y: lineStart.y + t * dy }) }
  if (d === 0) { add(t1) } else { add(t1); add(t2) }
  return results
}

/** 归一化角度到 [0, 360)。 */
const normalizeAngle = (a: number): number => ((a % 360) + 360) % 360

/** 判断点是否在圆弧的扫过角度范围内。 */
const isPointOnArc = (point: Point, geo: ArcGeometry): boolean => {
  const angle = Math.atan2(point.y - geo.center.y, point.x - geo.center.x) * 180 / Math.PI
  const a = normalizeAngle(angle)
  const s = normalizeAngle(geo.startAngle)
  const e = normalizeAngle(geo.endAngle)
  return s <= e ? (a >= s && a <= e) : (a >= s || a <= e)
}

/** 圆弧与线段的交点：先用 lineCircleIntersections，再按角度过滤。 */
export const arcLineIntersections = (
  lineStart: Point, lineEnd: Point,
  arcStart: Point, arcEnd: Point, sweepAngle: number,
): Point[] => {
  const geo = getArcGeometry(arcStart, arcEnd, sweepAngle)
  if (!geo) return []
  const circlePts = lineCircleIntersections(lineStart, lineEnd, geo.center, geo.radius)
  return circlePts.filter((pt) => isPointOnArc(pt, geo))
}

/** 圆弧与圆的交点：先用 circleCircleIntersections，再按角度过滤。 */
export const arcCircleIntersections = (
  arcStart: Point, arcEnd: Point, sweepAngle: number,
  circleCenter: Point, circleRadius: number,
): Point[] => {
  const geo = getArcGeometry(arcStart, arcEnd, sweepAngle)
  if (!geo) return []
  const circlePts = circleCircleIntersections(geo.center, geo.radius, circleCenter, circleRadius)
  return circlePts.filter((pt) => isPointOnArc(pt, geo))
}

/**
 * 将矩形展开为 4 条边线（顶点按顺时针：start → (end.x,start.y) → end → (start.x,end.y)）。
 */
const rectangleEdges = (el: RectangleElement): Point[] => {
  const { start, end } = el
  const right = end.x, left = start.x, top = Math.max(start.y, end.y), bottom = Math.min(start.y, end.y)
  // Return segments as pairs: [p0, p1, p1, p2, p2, p3, p3, p0]
  return [
    { x: left, y: bottom }, { x: right, y: bottom },
    { x: right, y: bottom }, { x: right, y: top },
    { x: right, y: top }, { x: left, y: top },
    { x: left, y: top }, { x: left, y: bottom },
  ]
}

/**
 * 将圆弧近似为多段线（N 段），返回线段端点配对数组。
 */
const ARC_SEGMENTS = 24
const arcPolyline = (start: Point, end: Point, sweepAngle: number): Point[] => {
  const geo = getArcGeometry(start, end, sweepAngle)
  if (!geo) return []
  const { center, radius, startAngle, endAngle } = geo
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const steps = Math.max(4, Math.round(ARC_SEGMENTS * Math.abs(sweepAngle) / 360))
  const pts: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps)
    const rad = toRad(angle)
    const p = { x: center.x + radius * Math.cos(rad), y: center.y + radius * Math.sin(rad) }
    if (i > 0) {
      pts.push(pts[pts.length - 1], p) // pair each segment
    } else {
      pts.push(p) // first point alone
    }
  }
  // Remove the trailing lone point (it was added as the first point of the next pair)
  if (pts.length > 2) pts.pop()
  return pts
}

/**
 * 将椭圆近似为多段线（N 段），返回线段端点配对数组。
 */
const ELLIPSE_SEGMENTS = 36
const ellipsePolyline = (center: Point, xRadius: number, yRadius: number): Point[] => {
  const pts: Point[] = []
  for (let i = 0; i <= ELLIPSE_SEGMENTS; i++) {
    const angle = (2 * Math.PI * i) / ELLIPSE_SEGMENTS
    const p = { x: center.x + xRadius * Math.cos(angle), y: center.y + yRadius * Math.sin(angle) }
    if (i > 0) {
      pts.push(pts[pts.length - 1], p)
    } else {
      pts.push(p)
    }
  }
  if (pts.length > 2) pts.pop()
  return pts
}

/** 求交用的结构化信息：线段 + 圆信息 + 椭圆信息 + 圆弧信息。 */
type IntersectInfo = {
  segs: Point[]
  circles: { center: Point; radius: number }[]
  ellipses: { center: Point; xRadius: number; yRadius: number }[]
  arcs: { start: Point; end: Point; sweepAngle: number }[]
}

export const computeIntersections = (a: DrawingElement, b: DrawingElement): Point[] => {
  const extractInfo = (el: DrawingElement): IntersectInfo => {
    const info: IntersectInfo = { segs: [], circles: [], ellipses: [], arcs: [] }

    if (el.type === 'line') {
      info.segs = [el.start, el.end]
    } else if (el.type === 'polyline') {
      for (let i = 0; i < el.points.length - 1; i++) info.segs.push(el.points[i], el.points[i + 1])
    } else if (el.type === 'rectangle') {
      info.segs = rectangleEdges(el)
    } else if (el.type === 'circle') {
      info.circles.push({ center: el.center, radius: distance(el.center, el.radiusPoint) })
    } else if (el.type === 'ellipse') {
      info.ellipses.push({ center: el.center, xRadius: Math.abs(el.radiusPoint.x - el.center.x), yRadius: Math.abs(el.radiusPoint.y - el.center.y) })
    } else if (el.type === 'arc') {
      info.arcs.push({ start: el.start, end: el.end, sweepAngle: el.sweepAngle })
    }

    return info
  }

  const infA = extractInfo(a)
  const infB = extractInfo(b)
  const results: Point[] = []

  const addUnique = (pt: Point) => {
    if (!results.some((p) => distance(p, pt) < 0.01)) results.push(pt)
  }

  // --- 2. Segment-segment (line/polyline/rectangle vs same) ---
  for (let i = 0; i + 1 < infA.segs.length; i += 2) {
    for (let j = 0; j + 1 < infB.segs.length; j += 2) {
      const pt = segmentSegmentIntersection(infA.segs[i], infA.segs[i + 1], infB.segs[j], infB.segs[j + 1])
      if (pt) addUnique(pt)
    }
  }

  // --- 3. Segment-circle (any segs vs circle) ---
  const segsCircle = (segs: Point[], center: Point, radius: number) => {
    for (let i = 0; i + 1 < segs.length; i += 2) {
      for (const pt of lineCircleIntersections(segs[i], segs[i + 1], center, radius)) addUnique(pt)
    }
  }
  if (infA.segs.length >= 2) {
    for (const c of infB.circles) segsCircle(infA.segs, c.center, c.radius)
  }
  if (infB.segs.length >= 2) {
    for (const c of infA.circles) segsCircle(infB.segs, c.center, c.radius)
  }

  // --- 4. Segment-ellipse (any segs vs ellipse, exact math) ---
  const segsEllipse = (segs: Point[], center: Point, xr: number, yr: number) => {
    for (let i = 0; i + 1 < segs.length; i += 2) {
      for (const pt of ellipseLineIntersections(segs[i], segs[i + 1], center, xr, yr)) addUnique(pt)
    }
  }
  if (infA.segs.length >= 2) {
    for (const e of infB.ellipses) segsEllipse(infA.segs, e.center, e.xRadius, e.yRadius)
  }
  if (infB.segs.length >= 2) {
    for (const e of infA.ellipses) segsEllipse(infB.segs, e.center, e.xRadius, e.yRadius)
  }

  // --- 5. Segment-arc (any segs vs arc, exact circle + angle filter) ---
  const segsArc = (segs: Point[], start: Point, end: Point, sweep: number) => {
    for (let i = 0; i + 1 < segs.length; i += 2) {
      for (const pt of arcLineIntersections(segs[i], segs[i + 1], start, end, sweep)) addUnique(pt)
    }
  }
  if (infA.segs.length >= 2) {
    for (const a of infB.arcs) segsArc(infA.segs, a.start, a.end, a.sweepAngle)
  }
  if (infB.segs.length >= 2) {
    for (const a of infA.arcs) segsArc(infB.segs, a.start, a.end, a.sweepAngle)
  }

  // --- 6. Circle-circle ---
  for (const cA of infA.circles) {
    for (const cB of infB.circles) {
      for (const pt of circleCircleIntersections(cA.center, cA.radius, cB.center, cB.radius)) addUnique(pt)
    }
  }

  // --- 7. Circle-ellipse ---
  // Use ellipse polyline segments for circle-ellipse (practical approximation)
  const ellipsesToSegs = (ellipses: IntersectInfo['ellipses']): Point[] => {
    const segs: Point[] = []
    for (const e of ellipses) segs.push(...ellipsePolyline(e.center, e.xRadius, e.yRadius))
    return segs
  }

  if (infA.circles.length > 0 && infB.ellipses.length > 0) {
    const segs = ellipsesToSegs(infB.ellipses)
    for (const c of infA.circles) segsCircle(segs, c.center, c.radius)
  }
  if (infB.circles.length > 0 && infA.ellipses.length > 0) {
    const segs = ellipsesToSegs(infA.ellipses)
    for (const c of infB.circles) segsCircle(segs, c.center, c.radius)
  }

  // --- 8. Circle-arc (exact circle-circle + angle filter) ---
  for (const a of infA.arcs) {
    for (const c of infB.circles) {
      for (const pt of arcCircleIntersections(a.start, a.end, a.sweepAngle, c.center, c.radius)) addUnique(pt)
    }
  }
  for (const a of infB.arcs) {
    for (const c of infA.circles) {
      for (const pt of arcCircleIntersections(a.start, a.end, a.sweepAngle, c.center, c.radius)) addUnique(pt)
    }
  }

  // --- 9. Ellipse-arc / Ellipse-ellipse / Arc-arc ---
  // Approximate using ellipse/arc polyline segments since exact math would need quartics.
  const approxSegs: Point[] = []
  for (const e of infA.ellipses) approxSegs.push(...ellipsePolyline(e.center, e.xRadius, e.yRadius))
  for (const a of infA.arcs) approxSegs.push(...arcPolyline(a.start, a.end, a.sweepAngle))

  const approxSegsB: Point[] = []
  for (const e of infB.ellipses) approxSegsB.push(...ellipsePolyline(e.center, e.xRadius, e.yRadius))
  for (const a of infB.arcs) approxSegsB.push(...arcPolyline(a.start, a.end, a.sweepAngle))

  if (approxSegs.length >= 2 && approxSegsB.length >= 2) {
    for (let i = 0; i + 1 < approxSegs.length; i += 2) {
      for (let j = 0; j + 1 < approxSegsB.length; j += 2) {
        const pt = segmentSegmentIntersection(approxSegs[i], approxSegs[i + 1], approxSegsB[j], approxSegsB[j + 1])
        if (pt) addUnique(pt)
      }
    }
  }

  // Also connect ellipse/arc segs with existing circles
  if (approxSegs.length >= 2) {
    for (const c of infB.circles) segsCircle(approxSegs, c.center, c.radius)
  }
  if (approxSegsB.length >= 2) {
    for (const c of infA.circles) segsCircle(approxSegsB, c.center, c.radius)
  }

  return results
}


