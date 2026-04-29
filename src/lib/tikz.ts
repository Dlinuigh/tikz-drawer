import type { ArcElement, DrawingElement, DrawingStyle } from '../types/drawing'
import { canvasToTikz, formatNumber, getArcGeometry, pointToTikz } from './geometry'

const arrowOptions: Record<DrawingStyle['arrow'], string | null> = {
  none: null,
  end: '-{Latex}',
  start: '{Latex}-',
  both: '{Latex}-{Latex}',
}

const lineStyleOptions: Record<DrawingStyle['lineStyle'], string | null> = {
  solid: null,
  dashed: 'dashed',
  dotted: 'dotted',
}

const styleToTikzOptions = (style: DrawingStyle): string => {
  const options = [
    arrowOptions[style.arrow],
    style.strokeColor,
    lineStyleOptions[style.lineStyle],
    `line width=${formatNumber(style.strokeWidth / 2)}pt`,
  ].filter(Boolean)

  return `[${options.join(', ')}]`
}

const lineToTikz = (element: DrawingElement): string => {
  if (element.type !== 'line') {
    return ''
  }

  const start = canvasToTikz(element.start)
  const end = canvasToTikz(element.end)

  return `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(start)} -- ${pointToTikz(end)};`
}

const arcToTikz = (element: ArcElement): string => {
  const start = canvasToTikz(element.start)
  const end = canvasToTikz(element.end)
  const geometry = getArcGeometry(start, end, element.sweepAngle)

  if (!geometry) {
    return `% skipped invalid arc ${element.id}`
  }

  return [
    `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(start)}`,
    `arc[start angle=${formatNumber(geometry.startAngle)}, end angle=${formatNumber(geometry.endAngle)}, radius=${formatNumber(geometry.radius)}];`,
  ].join(' ')
}

export const elementToTikz = (element: DrawingElement): string => {
  if (element.type === 'line') {
    return lineToTikz(element)
  }

  return arcToTikz(element)
}

export const buildTikzPicture = (elements: DrawingElement[]): string => {
  const body = elements.length > 0 ? elements.map(elementToTikz).join('\n') : '% Draw with the toolbar to generate TikZ paths.'
  return `\\begin{tikzpicture}\n${body}\n\\end{tikzpicture}`
}

export const buildLatexDocument = (tikzPicture: string): string => `\\documentclass[tikz,border=6pt]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,calc,decorations.pathreplacing,positioning}

\\begin{document}
${tikzPicture}
\\end{document}
`
