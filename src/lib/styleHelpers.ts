import type { DrawingStyle, FillPatternName } from '../types/drawing'

export function patternSvgId(kind: FillPatternName): string {
  return `pat-${kind.replace(/\s+/g, '-')}`
}

/** SVG preview: pattern defs id stable per kind (not per-element). */
export function svgFillStrokePreview(
  style: DrawingStyle,
): { fill: string; fillOpacity: number; strokeOpacity: number } {
  const strokeOp = style.opacity
  if (style.fillMode === 'none') {
    return { fill: 'none', fillOpacity: 1, strokeOpacity: strokeOp }
  }
  if (style.fillMode === 'solid') {
    return {
      fill: style.fillColor,
      fillOpacity: style.fillOpacity * strokeOp,
      strokeOpacity: strokeOp,
    }
  }
  const id = patternSvgId(style.fillPattern)
  return {
    fill: `url(#${id})`,
    fillOpacity: Math.min(1, style.fillOpacity * strokeOp),
    strokeOpacity: strokeOp,
  }
}

export function anyFillPatternUsed(elements: Array<{ style: DrawingStyle }>): boolean {
  return elements.some((e) => e.style.fillMode === 'pattern')
}
