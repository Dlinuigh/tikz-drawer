import type { DrawingElement, Point } from '../types/drawing'

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
    case 'axes':
      return { ...e.origin }
    default:
      return null
  }
}
