import type { DrawingElement, Point } from '../types/drawing'
import { sampleConicCurve } from './conicSamples'
import { sampleFunctionPlot } from './plotSamples'
/** Approximate center in TikZ coordinates (for framing the view). */
export const tikzCenterOfElement = (e: DrawingElement): Point | null => {
  switch (e.type) {
    case 'line':
    case 'arc':
      return { x: (e.start.x + e.end.x) / 2, y: (e.start.y + e.end.y) / 2 }
    case 'rectangle':
      return { x: (e.start.x + e.end.x) / 2, y: (e.start.y + e.end.y) / 2 }
    case 'circle':
    case 'ellipse':
      return { ...e.center }
    case 'polyline': {
      const pts = e.points
      if (pts.length === 0) return null
      const sx = pts.reduce((a, p) => a + p.x, 0) / pts.length
      const sy = pts.reduce((a, p) => a + p.y, 0) / pts.length
      return { x: sx, y: sy }
    }
    case 'polygon':
    case 'filledPath': {
      const pts = e.vertices
      if (pts.length === 0) return null
      const sx = pts.reduce((a, p) => a + p.x, 0) / pts.length
      const sy = pts.reduce((a, p) => a + p.y, 0) / pts.length
      return { x: sx, y: sy }
    }
    case 'sector':
      return { ...e.center }
    case 'regularPolygon':
      return { ...e.center }
    case 'conicCurve': {
      const pts = sampleConicCurve(e)
      if (!pts.length) return { ...e.center }
      const sx = pts.reduce((a, p) => a + p.x, 0) / pts.length
      const sy = pts.reduce((a, p) => a + p.y, 0) / pts.length
      return { x: sx, y: sy }
    }
    case 'functionPlot': {
      const pts = sampleFunctionPlot(e)
      if (!pts.length) return { x: e.domainMin, y: 0 }
      const sx = pts.reduce((a, p) => a + p.x, 0) / pts.length
      const sy = pts.reduce((a, p) => a + p.y, 0) / pts.length
      return { x: sx, y: sy }
    }
    case 'tikzForeach':
      return { x: 0, y: 0 }
    case 'axes':
      return { ...e.origin }
    case 'axisLine': {
      const ox = e.origin.x
      const oy = e.origin.y
      const lo = Math.min(e.min, e.max)
      const hi = Math.max(e.min, e.max)
      return e.orientation === 'x' ? { x: (lo + hi) / 2, y: oy } : { x: ox, y: (lo + hi) / 2 }
    }
    case 'point':
    case 'intersectionPoint':
      return { ...e.center }
    default:
      return null
  }
}
