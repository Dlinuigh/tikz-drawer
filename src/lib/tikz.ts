import type {
  ArcElement,
  AxesElement,
  AxisLineElement,
  CircleElement,
  DrawingElement,
  DrawingStyle,
  EllipseElement,
  GridConfig,
  IntersectionPointElement,
  Point,
  PointElement,
} from '../types/drawing'
import { defaultGridConfig } from '../types/drawing'
import {
  axesNameLabelOffset,
  axesTickHalfLength,
  formatTickLabel,
  getAxesSegments,
  mergeAxisTickMarks,
  tickValuesInRange,
} from './axes'
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

const strokeStyleToTikzOptions = (style: DrawingStyle): string => {
  const options = [
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
  if (element.definitionMode === 'centerRadiusAngles' && element.center && element.startAngle !== undefined && element.endAngle !== undefined && element.radius !== undefined) {
    // mode 2: 中心+半径+起止角度
    const startAngle = element.startAngle
    const endAngle = element.endAngle
    // 计算起止点用于输出渲染
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const computedStart: Point = {
      x: element.center.x + element.radius * Math.cos(toRad(startAngle)),
      y: element.center.y + element.radius * Math.sin(toRad(startAngle)),
    }
    return [
      `% arc: 中心 (${formatNumber(element.center.x)}, ${formatNumber(element.center.y)}), 半径 ${formatNumber(element.radius)}`,
      `%       起始角 ${formatNumber(startAngle)}°, 终止角 ${formatNumber(endAngle)}°`,
      `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(computedStart)}`,
      `arc[start angle=${formatNumber(startAngle)}, end angle=${formatNumber(endAngle)}, radius=${formatNumber(element.radius)}];`,
    ].join('\n')
  }

  // mode 1 (默认): 起点+终点+扫过角
  const geometry = getArcGeometry(element.start, element.end, element.sweepAngle)
  if (!geometry) {
    return `% skipped invalid arc ${element.id}`
  }

  return [
    `% arc: 起点 → 终点, 扫过 ${formatNumber(element.sweepAngle)}°`,
    `%       圆心 (${formatNumber(geometry.center.x)}, ${formatNumber(geometry.center.y)}), 半径 ${formatNumber(geometry.radius)}`,
    `%       起始角 ${formatNumber(geometry.startAngle)}°, 终止角 ${formatNumber(geometry.endAngle)}°`,
    `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.start)}`,
    `arc[start angle=${formatNumber(geometry.startAngle)}, end angle=${formatNumber(geometry.endAngle)}, radius=${formatNumber(geometry.radius)}];`,
  ].join('\n')
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

const pointToTikzElement = (element: PointElement | IntersectionPointElement): string =>
  `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.center)} node[circle, fill, inner sep=1.5pt, label={${element.label}}]{};`

const polylineToTikz = (element: DrawingElement): string => {
  if (element.type !== 'polyline') {
    return ''
  }

  const points = element.points.map(pointToTikz).join(' -- ')
  return `\\draw${styleToTikzOptions(element.style)} ${points};`
}

const tickMarkBodyTikz = (tick: { value: number; label?: string }): string => {
  const custom = tick.label?.trim()
  if (custom) {
    return custom
  }
  return `$${formatTickLabel(tick.value)}$`
}

const axesToTikz = (element: AxesElement): string => {
  const { x, y } = getAxesSegments(element.origin, element.xMin, element.xMax, element.yMin, element.yMax)
  const ox = element.origin.x
  const oy = element.origin.y
  const δ = axesTickHalfLength
  const axisStyle: DrawingStyle = { ...element.style, startArrow: 'none' }
  const axisOpts = styleToTikzOptions(axisStyle)
  const tickOpts = strokeStyleToTikzOptions(element.style)
  const parts: string[] = []

  const xSpan = Math.abs(x.end.x - x.start.x)
  const ySpan = Math.abs(y.end.y - y.start.y)

  if (xSpan > 1e-9) {
    parts.push(`\\draw${axisOpts} ${pointToTikz(x.start)} -- ${pointToTikz(x.end)};`)
  }
  if (ySpan > 1e-9) {
    parts.push(`\\draw${axisOpts} ${pointToTikz(y.start)} -- ${pointToTikz(y.end)};`)
  }

  if (element.showTicks && xSpan > 1e-9) {
    const xMin = Math.min(x.start.x, x.end.x)
    const xMax = Math.max(x.start.x, x.end.x)
    const steppedX = element.tickStepX > 0 ? tickValuesInRange(xMin, xMax, element.tickStepX) : []
    const ticksX = mergeAxisTickMarks(steppedX, element.manualTicksX, xMin, xMax)
    for (const tick of ticksX) {
      const tx = tick.value
      parts.push(
        `\\draw${tickOpts} (${formatNumber(tx)},${formatNumber(oy + δ)}) -- (${formatNumber(tx)},${formatNumber(oy - δ)});`,
      )
      if (element.showTickLabels) {
        parts.push(
          `\\node[font=\\small,below] at (${formatNumber(tx)},${formatNumber(oy - δ)}) {${tickMarkBodyTikz(tick)}};`,
        )
      }
    }
  }

  if (element.showTicks && ySpan > 1e-9) {
    const yMin = Math.min(y.start.y, y.end.y)
    const yMax = Math.max(y.start.y, y.end.y)
    const steppedY = element.tickStepY > 0 ? tickValuesInRange(yMin, yMax, element.tickStepY) : []
    const ticksY = mergeAxisTickMarks(steppedY, element.manualTicksY, yMin, yMax)
    for (const tick of ticksY) {
      const ty = tick.value
      parts.push(
        `\\draw${tickOpts} (${formatNumber(ox - δ)},${formatNumber(ty)}) -- (${formatNumber(ox + δ)},${formatNumber(ty)});`,
      )
      if (element.showTickLabels) {
        parts.push(
          `\\node[font=\\small,left] at (${formatNumber(ox - δ)},${formatNumber(ty)}) {${tickMarkBodyTikz(tick)}};`,
        )
      }
    }
  }

  if (element.labelX.trim() && xSpan > 1e-9) {
    const px = x.end.x + axesNameLabelOffset + element.labelXDx
    const py = oy + element.labelXDy
    const posX = element.labelXPlacement
    parts.push(
      `\\node[font=\\small,${posX}] at (${formatNumber(px)},${formatNumber(py)}) {${element.labelX}};`,
    )
  }
  if (element.labelY.trim() && ySpan > 1e-9) {
    const px = ox + element.labelYDx
    const py = y.end.y + axesNameLabelOffset + element.labelYDy
    const posY = element.labelYPlacement
    parts.push(`\\node[font=\\small,${posY}] at (${formatNumber(px)},${formatNumber(py)}) {${element.labelY}};`)
  }

  return parts.join('\n')
}

const axisLineToTikz = (element: AxisLineElement): string => {
  const ox = element.origin.x
  const oy = element.origin.y
  const δ = axesTickHalfLength
  const axisStyle: DrawingStyle = { ...element.style, startArrow: 'none' }
  const axisOpts = styleToTikzOptions(axisStyle)
  const tickOpts = strokeStyleToTikzOptions(element.style)
  const parts: string[] = []

  if (element.orientation === 'x') {
    const x1 = Math.min(element.min, element.max)
    const x2 = Math.max(element.min, element.max)
    const span = Math.abs(x2 - x1)
    if (span > 1e-9) {
      parts.push(
        `\\draw${axisOpts} (${formatNumber(x1)},${formatNumber(oy)}) -- (${formatNumber(x2)},${formatNumber(oy)});`,
      )
    }
    if (element.showTicks && span > 1e-9) {
      const stepped = element.tickStep > 0 ? tickValuesInRange(x1, x2, element.tickStep) : []
      const ticks = mergeAxisTickMarks(stepped, element.manualTicks, x1, x2)
      for (const tick of ticks) {
        const tx = tick.value
        parts.push(
          `\\draw${tickOpts} (${formatNumber(tx)},${formatNumber(oy + δ)}) -- (${formatNumber(tx)},${formatNumber(oy - δ)});`,
        )
        if (element.showTickLabels) {
          parts.push(
            `\\node[font=\\small,below] at (${formatNumber(tx)},${formatNumber(oy - δ)}) {${tickMarkBodyTikz(tick)}};`,
          )
        }
      }
    }
    if (element.label.trim() && span > 1e-9) {
      const px = x2 + axesNameLabelOffset + element.labelDx
      const py = oy + element.labelDy
      const pos = element.labelPlacement
      parts.push(`\\node[font=\\small,${pos}] at (${formatNumber(px)},${formatNumber(py)}) {${element.label}};`)
    }
  } else {
    const y1 = Math.min(element.min, element.max)
    const y2 = Math.max(element.min, element.max)
    const span = Math.abs(y2 - y1)
    if (span > 1e-9) {
      parts.push(
        `\\draw${axisOpts} (${formatNumber(ox)},${formatNumber(y1)}) -- (${formatNumber(ox)},${formatNumber(y2)});`,
      )
    }
    if (element.showTicks && span > 1e-9) {
      const stepped = element.tickStep > 0 ? tickValuesInRange(y1, y2, element.tickStep) : []
      const ticks = mergeAxisTickMarks(stepped, element.manualTicks, y1, y2)
      for (const tick of ticks) {
        const ty = tick.value
        parts.push(
          `\\draw${tickOpts} (${formatNumber(ox - δ)},${formatNumber(ty)}) -- (${formatNumber(ox + δ)},${formatNumber(ty)});`,
        )
        if (element.showTickLabels) {
          parts.push(
            `\\node[font=\\small,left] at (${formatNumber(ox - δ)},${formatNumber(ty)}) {${tickMarkBodyTikz(tick)}};`,
          )
        }
      }
    }
    if (element.label.trim() && span > 1e-9) {
      const px = ox + element.labelDx
      const py = y2 + axesNameLabelOffset + element.labelDy
      const pos = element.labelPlacement
      parts.push(`\\node[font=\\small,${pos}] at (${formatNumber(px)},${formatNumber(py)}) {${element.label}};`)
    }
  }

  return parts.join('\n')
}

export const elementToTikz = (element: DrawingElement): string => {
  if (element.type === 'line') return lineToTikz(element)
  if (element.type === 'rectangle') return rectangleToTikz(element)
  if (element.type === 'circle') return circleToTikz(element)
  if (element.type === 'ellipse') return ellipseToTikz(element)
  if (element.type === 'polyline') return polylineToTikz(element)
  if (element.type === 'axisLine') return axisLineToTikz(element)
  if (element.type === 'axes') return axesToTikz(element)
  if (element.type === 'point' || element.type === 'intersectionPoint') return pointToTikzElement(element)
  return arcToTikz(element)
}

const gridToTikz = (gc: GridConfig): string => {
  const x0 = formatNumber(Math.min(gc.gridExportXMin, gc.gridExportXMax))
  const x1 = formatNumber(Math.max(gc.gridExportXMin, gc.gridExportXMax))
  const y0 = formatNumber(Math.min(gc.gridExportYMin, gc.gridExportYMax))
  const y1 = formatNumber(Math.max(gc.gridExportYMin, gc.gridExportYMax))
  const step = formatNumber(gc.gridStep)
  const lw = formatNumber(gc.gridLineWidth)
  const dashStyle =
    gc.gridLineStyle === 'dashed' ? ', dashed' : gc.gridLineStyle === 'dotted' ? ', dotted' : ''
  const c = colorName(gc.gridColor)
  return `\\draw[help lines, step=${step}, color=${c}, line width=${lw}pt${dashStyle}] (${x0},${y0}) grid (${x1},${y1});`
}

export const buildTikzPicture = (elements: DrawingElement[], gridConfig: GridConfig = defaultGridConfig): string => {
  const body = elements.length > 0 ? elements.map(elementToTikz).join('\n') : '% Draw with the toolbar to generate TikZ paths.'
  const colorSet = new Set(elements.map((element) => element.style.drawColor))
  if (gridConfig.showGridInExport) {
    colorSet.add(gridConfig.gridColor)
  }
  const colorDefinitions = [...colorSet]
    .map((hex) => `\\definecolor{${colorName(hex)}}{HTML}{${normalizeHex(hex)}}`)
    .join('\n')
  const prefix = colorDefinitions ? `${colorDefinitions}\n\n` : ''
  const gridLine = gridConfig.showGridInExport ? `${gridToTikz(gridConfig)}\n` : ''

  return `${prefix}\\begin{tikzpicture}\n${gridLine}${body}\n\\end{tikzpicture}`
}

export const buildLatexDocument = (tikzPicture: string): string => `\\documentclass[tikz,border=6pt]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,calc,decorations.pathreplacing,positioning}

\\begin{document}
${tikzPicture}
\\end{document}
`
