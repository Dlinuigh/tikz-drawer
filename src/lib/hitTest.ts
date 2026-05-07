import { distance } from './geometry'
import { concaveBracketArcParams } from './sectorBracketMath'
import { rimPointOnCircle } from './sectorGeometry'
import { ccwDistanceToRay, ccwSweepDegrees, majorArcSignedSweep, minorArcSignedSweep } from './sectorAngles'
import { sectorEffectiveShape } from '../types/drawing'
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

/** 弓形（弦+较小弧）：用弧上采样点与弦闭合的多边形近似。 */
function pointInCircularSegment(center: Point, r: number, startDeg: number, endDeg: number, pt: Point): boolean {
  const sweep = minorArcSignedSweep(startDeg, endDeg)
  const n = Math.max(16, Math.ceil(Math.abs(sweep) / 10))
  const poly: Point[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const ang = startDeg + sweep * t
    const rad = (ang * Math.PI) / 180
    poly.push({
      x: center.x + r * Math.cos(rad),
      y: center.y + r * Math.sin(rad),
    })
  }
  return pointInPolygon(pt, poly)
}

function pointInConcaveBracketRegion(O: Point, r: number, startDeg: number, endDeg: number, pt: Point): boolean {
  const g = concaveBracketArcParams(O, r, startDeg, endDeg)
  if (!g) {
    const sweep = minorArcSignedSweep(startDeg, endDeg)
    const n = Math.max(16, Math.ceil(Math.abs(sweep) / 10))
    const poly: Point[] = [O]
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const ang = startDeg + sweep * t
      const rad = (ang * Math.PI) / 180
      poly.push({
        x: O.x + r * Math.cos(rad),
        y: O.y + r * Math.sin(rad),
      })
    }
    return pointInPolygon(pt, poly)
  }
  const sweep = g.arcSweepDeg
  const n = Math.max(20, Math.ceil(Math.abs(sweep) / 8))
  const phi0 = (Math.atan2(g.P0.y - g.arcCenter.y, g.P0.x - g.arcCenter.x) * 180) / Math.PI
  const poly: Point[] = [O, g.P0]
  for (let i = 1; i < n; i++) {
    const t = i / n
    const ang = phi0 + sweep * t
    const rad = (ang * Math.PI) / 180
    poly.push({
      x: g.arcCenter.x + g.arcRadius * Math.cos(rad),
      y: g.arcCenter.y + g.arcRadius * Math.sin(rad),
    })
  }
  poly.push(g.P1)
  return pointInPolygon(pt, poly)
}

function pointInIceCreamRegion(s: SectorElement, pt: Point): boolean {
  const A = s.apex
  if (!A) return false
  const C = s.center
  const rc = s.radius
  const sweep = s.iceArcSweepDeg ?? majorArcSignedSweep(s.startAngleDeg, s.endAngleDeg)
  const P0 = rimPointOnCircle(C, rc, s.startAngleDeg)
  const P1 = rimPointOnCircle(C, rc, s.endAngleDeg)
  const phi0 = (Math.atan2(P0.y - C.y, P0.x - C.x) * 180) / Math.PI
  const n = Math.max(20, Math.ceil(Math.abs(sweep) / 8))
  const poly: Point[] = [A, P0]
  for (let i = 1; i < n; i++) {
    const t = i / n
    const ang = phi0 + sweep * t
    const rad = (ang * Math.PI) / 180
    poly.push({
      x: C.x + rc * Math.cos(rad),
      y: C.y + rc * Math.sin(rad),
    })
  }
  poly.push(P1)
  return pointInPolygon(pt, poly)
}

/** 对称弧楔 majorArcPie（{@link majorArcSignedSweep}）。 */
function pointInMajorArcSector(center: Point, r: number, startDeg: number, endDeg: number, pt: Point): boolean {
  const sweep = majorArcSignedSweep(startDeg, endDeg)
  const n = Math.max(20, Math.ceil(Math.abs(sweep) / 8))
  const poly: Point[] = [center]
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const ang = startDeg + sweep * t
    const rad = (ang * Math.PI) / 180
    poly.push({
      x: center.x + r * Math.cos(rad),
      y: center.y + r * Math.sin(rad),
    })
  }
  return pointInPolygon(pt, poly)
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
      const sh = sectorEffectiveShape(s)
      if (sh === 'iceCream') {
        if (pointInIceCreamRegion(s, pt)) return el
        continue
      }
      if (sh === 'majorArcPie') {
        if (pointInMajorArcSector(s.center, s.radius, s.startAngleDeg, s.endAngleDeg, pt)) return el
        continue
      }
      if (sh === 'concaveBracket') {
        if (pointInConcaveBracketRegion(s.center, s.radius, s.startAngleDeg, s.endAngleDeg, pt)) return el
        continue
      }
      const d = distance(pt, s.center)
      if (d > s.radius + 1e-6) continue
      if (sh === 'convexSegment') {
        if (pointInCircularSegment(s.center, s.radius, s.startAngleDeg, s.endAngleDeg, pt)) return el
      } else {
        const a = (Math.atan2(pt.y - s.center.y, pt.x - s.center.x) * 180) / Math.PI
        const δ = ccwSweepDegrees(s.startAngleDeg, s.endAngleDeg)
        const δp = ccwDistanceToRay(s.startAngleDeg, a)
        if (δ >= 360 - 1e-6 || δp <= δ + 1e-6) return el
      }
    } else if (el.type === 'regularPolygon') {
      const rp = el as RegularPolygonElement
      const verts = regularVerts(rp.center, rp.firstVertex, rp.sides)
      if (verts.length >= 3 && pointInPolygon(pt, verts)) return el
    }
  }
  return null
}
