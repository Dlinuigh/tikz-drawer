import { distance } from './geometry'
import { ccwDistanceToRay, ccwSweepDegrees } from './sectorAngles'
import type {
  CircleElement,
  DrawingElement,
  EllipseElement,
  FilledPathElement,
  Point,
  PolygonElement,
  PolylineElement,
  RectangleElement,
  RegularPolygonElement,
  SectorElement,
} from '../types/drawing'

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-15) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function regularVerts(center: Point, fv: Point, n: number): Point[] {
  const r = distance(center, fv)
  const a0 = Math.atan2(fv.y - center.y, fv.x - center.x)
  const v: Point[] = []
  for (let i = 0; i < n; i++) {
    const a = a0 + (2 * Math.PI * i) / n
    v.push({ x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) })
  }
  return v
}

/** Top-most hit for applying fill (reverse paint order). */
export function hitClosedShapeAtPoint(
  elements: DrawingElement[],
  pt: Point,
): DrawingElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]
    if (el.type === 'rectangle') {
      const r = el as RectangleElement
      const x1 = Math.min(r.start.x, r.end.x)
      const x2 = Math.max(r.start.x, r.end.x)
      const y1 = Math.min(r.start.y, r.end.y)
      const y2 = Math.max(r.start.y, r.end.y)
      if (pt.x >= x1 && pt.x <= x2 && pt.y >= y1 && pt.y <= y2) return el
    } else if (el.type === 'circle') {
      const c = el as CircleElement
      const rad = distance(c.center, c.radiusPoint)
      if (distance(pt, c.center) <= rad + 1e-9) return el
    } else if (el.type === 'ellipse') {
      const e = el as EllipseElement
      const rx = Math.abs(e.radiusPoint.x - e.center.x)
      const ry = Math.abs(e.radiusPoint.y - e.center.y)
      if (rx < 1e-12 || ry < 1e-12) continue
      const dx = (pt.x - e.center.x) / rx
      const dy = (pt.y - e.center.y) / ry
      if (dx * dx + dy * dy <= 1 + 1e-9) return el
    } else if (el.type === 'polyline') {
      const pl = el as PolylineElement
      if (pl.closed && pl.points.length >= 3 && pointInPolygon(pt, pl.points)) return el
    } else if (el.type === 'polygon') {
      const po = el as PolygonElement
      if (po.vertices.length >= 3 && pointInPolygon(pt, po.vertices)) return el
    } else if (el.type === 'filledPath') {
      const f = el as FilledPathElement
      if (f.vertices.length >= 3 && pointInPolygon(pt, f.vertices)) return el
    } else if (el.type === 'sector') {
      const s = el as SectorElement
      const d = distance(pt, s.center)
      if (d > s.radius + 1e-6) continue
      const a = (Math.atan2(pt.y - s.center.y, pt.x - s.center.x) * 180) / Math.PI
      const δ = ccwSweepDegrees(s.startAngleDeg, s.endAngleDeg)
      const δp = ccwDistanceToRay(s.startAngleDeg, a)
      if (δ >= 360 - 1e-6 || δp <= δ + 1e-6) return el
    } else if (el.type === 'regularPolygon') {
      const rp = el as RegularPolygonElement
      const verts = regularVerts(rp.center, rp.firstVertex, rp.sides)
      if (verts.length >= 3 && pointInPolygon(pt, verts)) return el
    }
  }
  return null
}
