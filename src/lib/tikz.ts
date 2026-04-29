import type { ArcElement, CircleElement, DrawingElement, DrawingStyle, EllipseElement } from '../types/drawing'
import { distance, formatNumber, getArcGeometry, pointToTikz } from './geometry'

const arrowHeadOptions: Record<DrawingStyle['startArrow'], string | null> = {
  none: null,
  Latex: 'Latex',
  Stealth: 'Stealth',
  Triangle: 'Triangle',
}

const lineStyleOptions: Record<DrawingStyle['lineStyle'], string | null> = {
  solid: null,
  dashed: 'dashed',
  dotted: 'dotted',
  'dash dot': 'dash dot',
}

const normalizeHex = (hex: string): string => hex.replace('#', '').toUpperCase()

const colorName = (hex: string): string => `tikzColor${normalizeHex(hex)}`

const arrowToTikz = (style: DrawingStyle): string | null => {
  const startArrow = arrowHeadOptions[style.startArrow]
  const endArrow = arrowHeadOptions[style.endArrow]

  if (!startArrow && !endArrow) {
    return null
  }

  return `${startArrow ? `{${startArrow}}` : ''}-${endArrow ? `{${endArrow}}` : ''}`
}

const styleToTikzOptions = (style: DrawingStyle): string => {
  const options = [
    arrowToTikz(style),
    `draw=${colorName(style.drawColor)}`,
    lineStyleOptions[style.lineStyle],
    `line width=${formatNumber(style.lineWidth)}pt`,
    `line cap=${style.lineCap}`,
    `line join=${style.lineJoin}`,
    style.opacity < 1 ? `opacity=${formatNumber(style.opacity)}` : null,
  ].filter(Boolean)

  return `[${options.join(', ')}]`
}

const lineToTikz = (element: DrawingElement): string => {
  if (element.type !== 'line') {
    return ''
  }

  return `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.start)} -- ${pointToTikz(element.end)};`
}

const arcToTikz = (element: ArcElement): string => {
  const geometry = getArcGeometry(element.start, element.end, element.sweepAngle)

  if (!geometry) {
    return `% skipped invalid arc ${element.id}`
  }

  return [
    `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.start)}`,
    `arc[start angle=${formatNumber(geometry.startAngle)}, end angle=${formatNumber(geometry.endAngle)}, radius=${formatNumber(geometry.radius)}];`,
  ].join(' ')
}

const rectangleToTikz = (element: DrawingElement): string => {
  if (element.type !== 'rectangle') {
    return ''
  }

  return `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.start)} rectangle ${pointToTikz(element.end)};`
}

const circleToTikz = (element: CircleElement): string =>
  `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.center)} circle[radius=${formatNumber(distance(element.center, element.radiusPoint))}];`

const ellipseToTikz = (element: EllipseElement): string => {
  const xRadius = Math.abs(element.radiusPoint.x - element.center.x)
  const yRadius = Math.abs(element.radiusPoint.y - element.center.y)

  return `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.center)} ellipse[x radius=${formatNumber(xRadius)}, y radius=${formatNumber(yRadius)}];`
}

const polylineToTikz = (element: DrawingElement): string => {
  if (element.type !== 'polyline') {
    return ''
  }

  const points = element.points.map(pointToTikz).join(' -- ')
  return `\\draw${styleToTikzOptions(element.style)} ${points};`
}

export const elementToTikz = (element: DrawingElement): string => {
  if (element.type === 'line') {
    return lineToTikz(element)
  }
  if (element.type === 'rectangle') {
    return rectangleToTikz(element)
  }
  if (element.type === 'circle') {
    return circleToTikz(element)
  }
  if (element.type === 'ellipse') {
    return ellipseToTikz(element)
  }
  if (element.type === 'polyline') {
    return polylineToTikz(element)
  }

  return arcToTikz(element)
}

export const buildTikzPicture = (elements: DrawingElement[]): string => {
  const body = elements.length > 0 ? elements.map(elementToTikz).join('\n') : '% Draw with the toolbar to generate TikZ paths.'
  const colorDefinitions = [...new Set(elements.map((element) => element.style.drawColor))]
    .map((hex) => `\\definecolor{${colorName(hex)}}{HTML}{${normalizeHex(hex)}}`)
    .join('\n')
  const prefix = colorDefinitions ? `${colorDefinitions}\n\n` : ''

  return `${prefix}\\begin{tikzpicture}\n${body}\n\\end{tikzpicture}`
}

export const buildLatexDocument = (tikzPicture: string): string => `\\documentclass[tikz,border=6pt]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,calc,decorations.pathreplacing,positioning}

\\begin{document}
${tikzPicture}
\\end{document}
`
