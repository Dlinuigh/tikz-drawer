import type {
  ArcElement,
  DrawingElement,
  Point,
  SectorElement,
} from '../types/drawing'
import {
  getArcGeometry,
  mirrorPointAcrossLine,
  rotatePointAround,
  translatePoint,
} from './geometry'
import { ellipseArcPoint, ellipseEccentricAngleForPoint } from './ellipseArcGeometry'

const rimAt = (center: { x: number; y: number }, radius: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180
  return { x: center.x + radius * Math.cos(rad), y: center.y + radius * Math.sin(rad) }
}

export const translateElement = (el: DrawingElement, d: Point): DrawingElement => {
  const t = (p: Point) => translatePoint(p, d)
  switch (el.type) {
    case 'line':
      return { ...el, start: t(el.start), end: t(el.end) }
    case 'arc':
      return translateArc(el, d)
    case 'rectangle':
      return { ...el, start: t(el.start), end: t(el.end) }
    case 'circle':
      return { ...el, center: t(el.center), radiusPoint: t(el.radiusPoint) }
    case 'ellipse':
      return { ...el, center: t(el.center), radiusPoint: t(el.radiusPoint) }
    case 'polyline':
      return { ...el, points: el.points.map(t) }
    case 'polygon':
      return { ...el, vertices: el.vertices.map(t) }
    case 'sector':
      return {
        ...el,
        center: t(el.center),
        apex: el.apex ? t(el.apex) : undefined,
      }
    case 'regularPolygon':
      return { ...el, center: t(el.center), firstVertex: t(el.firstVertex) }
    case 'conicCurve':
      return { ...el, center: t(el.center) }
    case 'filledPath':
      return { ...el, vertices: el.vertices.map(t) }
    case 'functionPlot': {
      const ox = el.plotOffset?.x ?? 0
      const oy = el.plotOffset?.y ?? 0
      return { ...el, plotOffset: { x: ox + d.x, y: oy + d.y } }
    }
    case 'tikzForeach': {
      const sx = el.scopeShift?.x ?? 0
      const sy = el.scopeShift?.y ?? 0
      return { ...el, scopeShift: { x: sx + d.x, y: sy + d.y } }
    }
    case 'axes':
      return { ...el, origin: t(el.origin) }
    case 'axisLine':
      return { ...el, origin: t(el.origin) }
    case 'point':
    case 'intersectionPoint':
      return { ...el, center: t(el.center) }
    default:
      return el
  }
}

function translateArc(el: ArcElement, d: Point): ArcElement {
  const t = (p: Point) => translatePoint(p, d)
  if (el.definitionMode === 'ellipseCenterRadiiAngles' && el.center) {
    return {
      ...el,
      center: t(el.center),
      start: t(el.start),
      end: t(el.end),
    }
  }
  if (el.definitionMode === 'centerRadiusAngles' && el.center) {
    return {
      ...el,
      center: t(el.center),
      start: t(el.start),
      end: t(el.end),
    }
  }
  return { ...el, start: t(el.start), end: t(el.end) }
}

export const rotateElementAround = (el: DrawingElement, c: Point, deg: number): DrawingElement => {
  const r = (p: Point) => rotatePointAround(p, c, deg)
  switch (el.type) {
    case 'line':
      return { ...el, start: r(el.start), end: r(el.end) }
    case 'arc':
      return rotateArc(el, c, deg)
    case 'rectangle':
      return { ...el, start: r(el.start), end: r(el.end) }
    case 'circle':
      return { ...el, center: r(el.center), radiusPoint: r(el.radiusPoint) }
    case 'ellipse':
      return { ...el, center: r(el.center), radiusPoint: r(el.radiusPoint) }
    case 'polyline':
      return { ...el, points: el.points.map(r) }
    case 'polygon':
      return { ...el, vertices: el.vertices.map(r) }
    case 'sector':
      return rotateSector(el, c, deg)
    case 'regularPolygon':
      return { ...el, center: r(el.center), firstVertex: r(el.firstVertex) }
    case 'conicCurve':
      return { ...el, center: r(el.center), rotationDeg: el.rotationDeg + deg }
    case 'filledPath':
      return { ...el, vertices: el.vertices.map(r) }
    case 'axes':
      return { ...el, origin: r(el.origin) }
    case 'axisLine':
      return { ...el, origin: r(el.origin) }
    case 'point':
    case 'intersectionPoint':
      return { ...el, center: r(el.center) }
    case 'functionPlot':
    case 'tikzForeach':
      return el
    default:
      return el
  }
}

function rotateSector(el: SectorElement, c: Point, deg: number): SectorElement {
  const nc = rotatePointAround(el.center, c, deg)
  const p0 = rimAt(el.center, el.radius, el.startAngleDeg)
  const p1 = rimAt(el.center, el.radius, el.endAngleDeg)
  const np0 = rotatePointAround(p0, c, deg)
  const np1 = rotatePointAround(p1, c, deg)
  const s0 = (Math.atan2(np0.y - nc.y, np0.x - nc.x) * 180) / Math.PI
  const s1 = (Math.atan2(np1.y - nc.y, np1.x - nc.x) * 180) / Math.PI
  return {
    ...el,
    center: nc,
    startAngleDeg: s0,
    endAngleDeg: s1,
    apex: el.apex ? rotatePointAround(el.apex, c, deg) : undefined,
  }
}

function rotateArc(el: ArcElement, c: Point, deg: number): ArcElement {
  const r = (p: Point) => rotatePointAround(p, c, deg)
  if (el.definitionMode === 'ellipseCenterRadiiAngles' && el.center && el.radiusX !== undefined && el.radiusY !== undefined) {
    const nc = r(el.center)
    const rot = (el.ellipseRotationDeg ?? 0) + deg
    const rx = el.radiusX
    const ry = el.radiusY
    const ns = r(el.start)
    const ne = r(el.end)
    const sa = ellipseEccentricAngleForPoint(nc, ns, rx, ry, rot)
    const ea = ellipseEccentricAngleForPoint(nc, ne, rx, ry, rot)
    return {
      ...el,
      center: nc,
      ellipseRotationDeg: rot,
      start: ns,
      end: ne,
      startAngle: sa,
      endAngle: ea,
      sweepAngle: ea - sa,
    }
  }
  if (el.definitionMode === 'centerRadiusAngles' && el.center !== undefined && el.startAngle !== undefined && el.endAngle !== undefined && el.radius !== undefined) {
    const nc = r(el.center)
    const rad = el.radius
    const p0 = rimAt(el.center, rad, el.startAngle)
    const p1 = rimAt(el.center, rad, el.endAngle)
    const np0 = r(p0)
    const np1 = r(p1)
    const sa = (Math.atan2(np0.y - nc.y, np0.x - nc.x) * 180) / Math.PI
    const ea = (Math.atan2(np1.y - nc.y, np1.x - nc.x) * 180) / Math.PI
    return {
      ...el,
      center: nc,
      start: np0,
      end: np1,
      startAngle: sa,
      endAngle: ea,
      sweepAngle: ea - sa,
    }
  }
  const ns = r(el.start)
  const ne = r(el.end)
  const g0 = getArcGeometry(el.start, el.end, el.sweepAngle)
  if (!g0) return { ...el, start: ns, end: ne }
  return {
    ...el,
    start: ns,
    end: ne,
    sweepAngle: el.sweepAngle,
  }
}

export const mirrorElementAcrossLine = (el: DrawingElement, a: Point, b: Point): DrawingElement => {
  const m = (p: Point) => mirrorPointAcrossLine(p, a, b)
  switch (el.type) {
    case 'line':
      return { ...el, start: m(el.start), end: m(el.end) }
    case 'arc':
      return mirrorArc(el, a, b)
    case 'rectangle':
      return { ...el, start: m(el.start), end: m(el.end) }
    case 'circle':
      return { ...el, center: m(el.center), radiusPoint: m(el.radiusPoint) }
    case 'ellipse':
      return { ...el, center: m(el.center), radiusPoint: m(el.radiusPoint) }
    case 'polyline':
      return { ...el, points: el.points.map(m) }
    case 'polygon':
      return { ...el, vertices: el.vertices.map(m) }
    case 'sector':
      return mirrorSector(el, a, b)
    case 'regularPolygon':
      return { ...el, center: m(el.center), firstVertex: m(el.firstVertex) }
    case 'conicCurve': {
      const θ = (el.rotationDeg * Math.PI) / 180
      const majorTip = {
        x: el.center.x + el.semiAxisX * Math.cos(θ),
        y: el.center.y + el.semiAxisX * Math.sin(θ),
      }
      const nc = m(el.center)
      const mt = m(majorTip)
      const newRot = (Math.atan2(mt.y - nc.y, mt.x - nc.x) * 180) / Math.PI
      return { ...el, center: nc, rotationDeg: newRot }
    }
    case 'filledPath':
      return { ...el, vertices: el.vertices.map(m) }
    case 'functionPlot':
    case 'tikzForeach':
      return el
    case 'axes':
      return { ...el, origin: m(el.origin) }
    case 'axisLine':
      return { ...el, origin: m(el.origin) }
    case 'point':
    case 'intersectionPoint':
      return { ...el, center: m(el.center) }
    default:
      return el
  }
}

function mirrorSector(el: SectorElement, a: Point, b: Point): SectorElement {
  const m = (p: Point) => mirrorPointAcrossLine(p, a, b)
  const nc = m(el.center)
  const p0 = rimAt(el.center, el.radius, el.startAngleDeg)
  const p1 = rimAt(el.center, el.radius, el.endAngleDeg)
  const np0 = m(p0)
  const np1 = m(p1)
  const s0 = (Math.atan2(np0.y - nc.y, np0.x - nc.x) * 180) / Math.PI
  const s1 = (Math.atan2(np1.y - nc.y, np1.x - nc.x) * 180) / Math.PI
  return {
    ...el,
    center: nc,
    startAngleDeg: s0,
    endAngleDeg: s1,
    apex: el.apex ? m(el.apex) : undefined,
  }
}

/** Reflect direction angle (deg) across line through a–b. */
function mirrorRotationDegAcrossLine(rotationDeg: number, a: Point, b: Point): number {
  const φ = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
  return 2 * φ - rotationDeg
}

function mirrorArc(el: ArcElement, a: Point, b: Point): ArcElement {
  const m = (p: Point) => mirrorPointAcrossLine(p, a, b)
  if (el.definitionMode === 'ellipseCenterRadiiAngles' && el.center && el.radiusX !== undefined && el.radiusY !== undefined) {
    const nc = m(el.center)
    const rot = mirrorRotationDegAcrossLine(el.ellipseRotationDeg ?? 0, a, b)
    const rx = el.radiusX
    const ry = el.radiusY
    const ns = m(el.start)
    const ne = m(el.end)
    const sa = ellipseEccentricAngleForPoint(nc, ns, rx, ry, rot)
    const ea = ellipseEccentricAngleForPoint(nc, ne, rx, ry, rot)
    return {
      ...el,
      center: nc,
      ellipseRotationDeg: rot,
      start: ns,
      end: ne,
      startAngle: sa,
      endAngle: ea,
      sweepAngle: ea - sa,
    }
  }
  if (el.definitionMode === 'centerRadiusAngles' && el.center !== undefined && el.radius !== undefined && el.startAngle !== undefined && el.endAngle !== undefined) {
    const nc = m(el.center)
    const rad = el.radius
    const p0 = rimAt(el.center, rad, el.startAngle)
    const p1 = rimAt(el.center, rad, el.endAngle)
    const np0 = m(p0)
    const np1 = m(p1)
    const sa = (Math.atan2(np0.y - nc.y, np0.x - nc.x) * 180) / Math.PI
    const ea = (Math.atan2(np1.y - nc.y, np1.x - nc.x) * 180) / Math.PI
    return {
      ...el,
      center: nc,
      start: np0,
      end: np1,
      startAngle: sa,
      endAngle: ea,
      sweepAngle: ea - sa,
    }
  }
  return {
    ...el,
    start: m(el.start),
    end: m(el.end),
    sweepAngle: -el.sweepAngle,
  }
}

export const translateElements = (elements: DrawingElement[], ids: Set<string>, d: Point): DrawingElement[] =>
  elements.map((e) => (ids.has(e.id) ? translateElement(e, d) : e))

export const rotateElementsAround = (
  elements: DrawingElement[],
  ids: Set<string>,
  c: Point,
  deg: number,
): DrawingElement[] => elements.map((e) => (ids.has(e.id) ? rotateElementAround(e, c, deg) : e))

export const mirrorElementsAcrossLine = (
  elements: DrawingElement[],
  ids: Set<string>,
  a: Point,
  b: Point,
): DrawingElement[] => elements.map((e) => (ids.has(e.id) ? mirrorElementAcrossLine(e, a, b) : e))

/** Bounding box center in TikZ coords from control points of selected elements. */
export function selectionBoundsCenterTikz(
  elements: DrawingElement[],
  selectedIds: string[],
): Point | null {
  const pts: Point[] = []
  for (const id of selectedIds) {
    const el = elements.find((e) => e.id === id)
    if (!el) continue
    pts.push(...controlPointsForElement(el))
  }
  if (pts.length === 0) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

export function controlPointsForElement(el: DrawingElement): Point[] {
  switch (el.type) {
    case 'line':
      return [el.start, el.end]
    case 'arc':
      if (el.definitionMode === 'ellipseCenterRadiiAngles' && el.center && el.radiusX !== undefined && el.radiusY !== undefined) {
        const rot = el.ellipseRotationDeg ?? 0
        return [el.center, el.start, el.end, ellipseArcPoint(el.center, el.radiusX, el.radiusY, el.startAngle ?? 0, rot)]
      }
      return [el.start, el.end]
    case 'rectangle':
      return [el.start, el.end]
    case 'circle':
      return [el.center, el.radiusPoint]
    case 'ellipse':
      return [el.center, el.radiusPoint]
    case 'polyline':
      return [...el.points]
    case 'polygon':
    case 'filledPath':
      return [...el.vertices]
    case 'sector':
      return [el.center, rimAt(el.center, el.radius, el.startAngleDeg), rimAt(el.center, el.radius, el.endAngleDeg)]
    case 'regularPolygon':
      return [el.center, el.firstVertex]
    case 'conicCurve':
      return [el.center]
    case 'functionPlot':
      return [el.plotOffset ? { x: el.plotOffset.x, y: el.plotOffset.y } : { x: 0, y: 0 }]
    case 'tikzForeach':
      return [el.scopeShift ?? { x: 0, y: 0 }]
    case 'axes':
      return [el.origin, { x: el.origin.x + el.xMax, y: el.origin.y }, { x: el.origin.x, y: el.origin.y + el.yMax }]
    case 'axisLine': {
      const o = el.origin
      if (el.orientation === 'x') return [o, { x: o.x + el.max, y: o.y }]
      return [o, { x: o.x, y: o.y + el.max }]
    }
    case 'point':
    case 'intersectionPoint':
      return [el.center]
    default:
      return []
  }
}

export function cloneElementWithNewId(el: DrawingElement, newId: string): DrawingElement {
  return { ...el, id: newId }
}
