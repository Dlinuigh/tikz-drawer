import { distance, getArcGeometry } from './geometry'
import type { ArcElement, DrawingElement, LineElement, Point, PolylineElement } from '../types/drawing'

const EPS = 1e-3

function onSegment(p: Point, a: Point, b: Point): boolean {
  const d = distance(a, b)
  if (d < EPS) return distance(p, a) < EPS
  const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (d * d)
  return t >= -EPS && t <= 1 + EPS && distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }) < EPS * 10
}

function segmentParameter(p: Point, a: Point, b: Point): number | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const L2 = dx * dx + dy * dy
  if (L2 < EPS * EPS) return distance(p, a) < EPS ? 0 : null
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2
  if (t < -EPS || t > 1 + EPS) return null
  const proj = { x: a.x + t * dx, y: a.y + t * dy }
  return distance(p, proj) < EPS * 15 ? t : null
}

/** Intersection points near this element (from committed intersection nodes). */
export function intersectionMarkersNear(element: DrawingElement, markers: Point[]): Point[] {
  if (element.type === 'line') {
    return markers.filter((p) => onSegment(p, element.start, element.end))
  }
  if (element.type === 'polyline') {
    const pts = element.points
    const out: Point[] = []
    for (const p of markers) {
      for (let i = 0; i < pts.length - 1; i++) {
        if (onSegment(p, pts[i], pts[i + 1])) {
          out.push(p)
          break
        }
      }
    }
    return dedupe(out)
  }
  if (element.type === 'arc') {
    const g = getArcGeometry(element.start, element.end, element.sweepAngle)
    if (!g) return []
    const { center, radius, startAngle } = g
    const angBetween = (t: number) => {
      let a = t - startAngle
      while (a <= -180) a += 360
      while (a > 180) a -= 360
      const sweep = element.sweepAngle
      return sweep >= 0 ? a >= -EPS && a <= sweep + EPS : a <= EPS && a >= sweep - EPS
    }
    return markers.filter((p) => {
      const dx = p.x - center.x
      const dy = p.y - center.y
      if (Math.abs(Math.hypot(dx, dy) - radius) > EPS * 30) return false
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI
      return angBetween(deg)
    })
  }
  return []
}

function dedupe(pts: Point[]): Point[] {
  const out: Point[] = []
  for (const p of pts) {
    if (!out.some((q) => distance(p, q) < EPS)) out.push(p)
  }
  return out
}

export function splitLineAtPoints(line: LineElement, points: Point[]): LineElement[] {
  if (points.length === 0) return [line]
  const cuts = points
    .map((p) => ({ p, t: segmentParameter(p, line.start, line.end) }))
    .filter((x): x is { p: Point; t: number } => x.t !== null)
    .sort((a, b) => a.t - b.t)
  if (cuts.length === 0) return [line]
  const ends = [line.start, ...cuts.map((c) => c.p), line.end]
  const segs: LineElement[] = []
  for (let i = 0; i < ends.length - 1; i++) {
    if (distance(ends[i], ends[i + 1]) < EPS) continue
    segs.push({
      ...line,
      id: `${line.id}-${i}`,
      start: ends[i],
      end: ends[i + 1],
    })
  }
  return segs.length > 0 ? segs : [line]
}

/** Split polyline into multiple straight segments (lines) at cut points. */
export function splitPolylineIntoLines(poly: PolylineElement, points: Point[]): LineElement[] {
  const markers = dedupe(points)
  const out: LineElement[] = []
  const pts = poly.points
  let piece = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const cuts = markers
      .map((p) => ({ p, t: segmentParameter(p, a, b) }))
      .filter((x): x is { p: Point; t: number } => x.t !== null && x.t > EPS && x.t < 1 - EPS)
      .sort((x, y) => x.t - y.t)
    const seq = [a, ...cuts.map((c) => c.p), b]
    for (let j = 0; j < seq.length - 1; j++) {
      if (distance(seq[j], seq[j + 1]) < EPS) continue
      out.push({
        id: `${poly.id}-s${piece++}`,
        type: 'line',
        start: seq[j],
        end: seq[j + 1],
        style: poly.style,
      })
    }
  }
  return out.length > 0 ? out : []
}

export function splitArcAtPoints(arc: ArcElement, points: Point[]): ArcElement[] {
  const g = getArcGeometry(arc.start, arc.end, arc.sweepAngle)
  if (!g || points.length === 0) return [arc]
  const { center, radius, startAngle } = g
  const angleOf = (p: Point) => (Math.atan2(p.y - center.y, p.x - center.x) * 180) / Math.PI

  const angs = points
    .map((p) => angleOf(p))
    .filter((ang) => {
      let rel = ang - startAngle
      while (rel <= -180) rel += 360
      while (rel > 180) rel -= 360
      const sweep = arc.sweepAngle
      return sweep >= 0 ? rel > EPS && rel < sweep - EPS : rel < -EPS && rel > sweep + EPS
    })
    .sort((a, b) => {
      const norm = (t: number) => {
        let rel = t - startAngle
        while (rel <= -180) rel += 360
        while (rel > 180) rel -= 360
        return rel
      }
      return norm(a) - norm(b)
    })

  if (angs.length === 0) return [arc]

  const toPoint = (deg: number) => ({
    x: center.x + radius * Math.cos((deg * Math.PI) / 180),
    y: center.y + radius * Math.sin((deg * Math.PI) / 180),
  })

  const cuts = [startAngle, ...angs, startAngle + arc.sweepAngle]
  const out: ArcElement[] = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const sa = cuts[i]
    const ea = cuts[i + 1]
    const s = toPoint(sa)
    const e = toPoint(ea)
    const sweep = ea - sa
    out.push({
      ...arc,
      id: `${arc.id}-${i}`,
      start: s,
      end: e,
      sweepAngle: sweep,
      definitionMode: undefined,
      center: undefined,
      startAngle: undefined,
      endAngle: undefined,
      radius: undefined,
    })
  }
  return out
}

export function splitElementAtIntersectionMarkers(element: DrawingElement, markers: Point[]): DrawingElement[] | null {
  const cutPts = intersectionMarkersNear(element, markers)
  if (cutPts.length === 0) return null
  if (element.type === 'line') return splitLineAtPoints(element, cutPts)
  if (element.type === 'polyline') {
    const lines = splitPolylineIntoLines(element, cutPts)
    return lines.length > 0 ? lines : null
  }
  if (element.type === 'arc') return splitArcAtPoints(element, cutPts)
  return null
}
