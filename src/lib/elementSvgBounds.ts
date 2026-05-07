import type { CoordinateSystem } from './geometry'
import { distance, getArcGeometry, regularPolygonVertices, tikzToSvg } from './geometry'
import type { DrawingElement, Point } from '../types/drawing'
import { tikzCenterOfElement } from './elementCenter'
import { sampleConicCurve } from './conicSamples'
import { sampleFunctionPlot } from './plotSamples'

export type SvgAabb = { minX: number; minY: number; maxX: number; maxY: number }

export function svgAabbIntersects(a: SvgAabb, b: SvgAabb): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
}

function expandAabb(b: SvgAabb, pad: number): SvgAabb {
  return {
    minX: b.minX - pad,
    minY: b.minY - pad,
    maxX: b.maxX + pad,
    maxY: b.maxY + pad,
  }
}

function boundsFromTikzPoints(pts: Point[], cs: CoordinateSystem): SvgAabb | null {
  if (pts.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    const s = tikzToSvg(p, cs)
    minX = Math.min(minX, s.x)
    maxX = Math.max(maxX, s.x)
    minY = Math.min(minY, s.y)
    maxY = Math.max(maxY, s.y)
  }
  return { minX, minY, maxX, maxY }
}

/** 用于框选：图元在画布 SVG 坐标下的轴对齐包围盒（近似）。 */
export function elementSvgBounds(element: DrawingElement, cs: CoordinateSystem): SvgAabb | null {
  const pad = element.style.lineWidth * 2 + 6

  switch (element.type) {
    case 'line':
      return expandAabb(boundsFromTikzPoints([element.start, element.end], cs)!, pad)
    case 'rectangle':
      return expandAabb(boundsFromTikzPoints([element.start, element.end], cs)!, pad)
    case 'circle': {
      const r = distance(element.center, element.radiusPoint) * cs.pixelsPerUnit
      const c = tikzToSvg(element.center, cs)
      return { minX: c.x - r - pad, minY: c.y - r - pad, maxX: c.x + r + pad, maxY: c.y + r + pad }
    }
    case 'ellipse': {
      const rx = Math.abs(element.radiusPoint.x - element.center.x) * cs.pixelsPerUnit
      const ry = Math.abs(element.radiusPoint.y - element.center.y) * cs.pixelsPerUnit
      const c = tikzToSvg(element.center, cs)
      return { minX: c.x - rx - pad, minY: c.y - ry - pad, maxX: c.x + rx + pad, maxY: c.y + ry + pad }
    }
    case 'arc': {
      const pts: Point[] = [element.start, element.end]
      const g = getArcGeometry(element.start, element.end, element.sweepAngle)
      if (g) {
        const n = 20
        for (let i = 0; i <= n; i++) {
          const deg = g.startAngle + (element.sweepAngle * i) / n
          const rad = (deg * Math.PI) / 180
          pts.push({
            x: g.center.x + g.radius * Math.cos(rad),
            y: g.center.y + g.radius * Math.sin(rad),
          })
        }
      }
      return expandAabb(boundsFromTikzPoints(pts, cs)!, pad)
    }
    case 'polyline': {
      const pb = boundsFromTikzPoints(element.points, cs)
      return pb ? expandAabb(pb, pad) : null
    }
    case 'polygon':
    case 'filledPath':
      return expandAabb(boundsFromTikzPoints(element.vertices, cs)!, pad)
    case 'sector': {
      const pts: Point[] = [
        element.center,
        {
          x: element.center.x + element.radius * Math.cos((element.startAngleDeg * Math.PI) / 180),
          y: element.center.y + element.radius * Math.sin((element.startAngleDeg * Math.PI) / 180),
        },
        {
          x: element.center.x + element.radius * Math.cos((element.endAngleDeg * Math.PI) / 180),
          y: element.center.y + element.radius * Math.sin((element.endAngleDeg * Math.PI) / 180),
        },
      ]
      return expandAabb(boundsFromTikzPoints(pts, cs)!, pad)
    }
    case 'regularPolygon':
      return expandAabb(boundsFromTikzPoints(regularPolygonVertices(element), cs)!, pad)
    case 'conicCurve': {
      const cb = boundsFromTikzPoints(sampleConicCurve(element), cs)
      return cb ? expandAabb(cb, pad) : null
    }
    case 'functionPlot': {
      const fb = boundsFromTikzPoints(sampleFunctionPlot(element), cs)
      return fb ? expandAabb(fb, pad) : null
    }
    case 'point':
    case 'intersectionPoint': {
      const c = tikzToSvg(element.center, cs)
      const r = 14
      return { minX: c.x - r, minY: c.y - r, maxX: c.x + r, maxY: c.y + r }
    }
    case 'axes': {
      if (element.canvasVisible === false) return null
      const b = boundsFromTikzPoints(
        [
          { x: element.xMin, y: element.yMin },
          { x: element.xMax, y: element.yMax },
        ],
        cs,
      )
      return b ? expandAabb(b, pad + 20) : null
    }
    case 'axisLine': {
      if (element.canvasVisible === false) return null
      const ox = element.origin.x
      const oy = element.origin.y
      const lo = Math.min(element.min, element.max)
      const hi = Math.max(element.min, element.max)
      const pts =
        element.orientation === 'x'
          ? [
              { x: lo, y: oy },
              { x: hi, y: oy },
            ]
          : [
              { x: ox, y: lo },
              { x: ox, y: hi },
            ]
      return expandAabb(boundsFromTikzPoints(pts, cs)!, pad + 8)
    }
    case 'tikzForeach': {
      const ctr = tikzCenterOfElement(element)
      const c = tikzToSvg(ctr ?? { x: 0, y: 0 }, cs)
      const box = 56
      return { minX: c.x - box, minY: c.y - box, maxX: c.x + box, maxY: c.y + box }
    }
    default:
      return null
  }
}
