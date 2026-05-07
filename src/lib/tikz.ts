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
import { sampleConicCurve } from './conicSamples'
import { ellipseArcPoint } from './ellipseArcGeometry'
import { distance, formatNumber, getArcGeometry, pointToTikz, regularPolygonVertices } from './geometry'
import { sampleFunctionPlot } from './plotSamples'
import { concaveBracketArcParams, majorArcPieTikzMirrorArcCenter } from './sectorBracketMath'
import { majorArcSignedSweep, minorArcMeasureDegrees, minorArcSignedSweep } from './sectorAngles'
import { rimPointOnCircle } from './sectorGeometry'
import { sectorEffectiveShape } from '../types/drawing'

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

/** Stroke + optional fill / pattern for closed paths */
const closedShapeOptions = (style: DrawingStyle): string => {
  const parts = [
    arrowToTikz(style),
    `draw=${colorName(style.drawColor)}`,
    lineStyleOptions[style.lineStyle],
    `line width=${formatNumber(style.lineWidth)}pt`,
    `line cap=${style.lineCap}`,
    `line join=${style.lineJoin}`,
  ].filter(Boolean)
  if (style.fillMode === 'solid') {
    parts.push(`fill=${colorName(style.fillColor)}`)
    if (style.fillOpacity < 1) parts.push(`fill opacity=${formatNumber(style.fillOpacity)}`)
  } else if (style.fillMode === 'pattern') {
    parts.push(`pattern=${style.fillPattern}`)
    parts.push(`pattern color=${colorName(style.fillColor)}`)
    if (style.fillOpacity < 1) parts.push(`fill opacity=${formatNumber(style.fillOpacity)}`)
  }
  if (style.opacity < 1) parts.push(`opacity=${formatNumber(style.opacity)}`)
  return `[${parts.join(', ')}]`
}

const closedOrDrawOpts = (style: DrawingStyle): string =>
  style.fillMode === 'none' ? styleToTikzOptions(style) : closedShapeOptions(style)

const plotCoordinatesLine = (pts: Point[]): string =>
  pts.map((p) => `(${formatNumber(p.x)},${formatNumber(p.y)})`).join(' ')

const foreachMacro = (name: string): string => {
  const n = name.trim().replace(/^\\/, '')
  return n ? `\\${n}` : '\\i'
}

const lineToTikz = (element: DrawingElement): string => {
  if (element.type !== 'line') {
    return ''
  }

  return `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.start)} -- ${pointToTikz(element.end)};`
}

const arcToTikz = (element: ArcElement): string => {
  if (
    element.definitionMode === 'ellipseCenterRadiiAngles' &&
    element.center &&
    element.radiusX !== undefined &&
    element.radiusY !== undefined &&
    element.startAngle !== undefined &&
    element.endAngle !== undefined
  ) {
    const sa = element.startAngle
    const ea = element.endAngle
    const rx = element.radiusX
    const ry = element.radiusY
    const rot = element.ellipseRotationDeg ?? 0
    const computedStart = ellipseArcPoint(element.center, rx, ry, sa, rot)
    const rotOpt = Math.abs(rot) > 1e-9 ? `, rotate=${formatNumber(rot)}` : ''
    return [
      `% arc (ellipse): center (${formatNumber(element.center.x)}, ${formatNumber(element.center.y)}), rx=${formatNumber(rx)}, ry=${formatNumber(ry)}`,
      `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(computedStart)}`,
      `arc[start angle=${formatNumber(sa)}, end angle=${formatNumber(ea)}, x radius=${formatNumber(rx)}, y radius=${formatNumber(ry)}${rotOpt}];`,
    ].join('\n')
  }

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

  const cmd = element.style.fillMode === 'none' ? '\\draw' : '\\path'
  return `${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(element.start)} rectangle ${pointToTikz(element.end)};`
}

const circleToTikz = (element: CircleElement): string => {
  const cmd = element.style.fillMode === 'none' ? '\\draw' : '\\path'
  return `${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(element.center)} circle[radius=${formatNumber(distance(element.center, element.radiusPoint))}];`
}

const ellipseToTikz = (element: EllipseElement): string => {
  const xRadius = Math.abs(element.radiusPoint.x - element.center.x)
  const yRadius = Math.abs(element.radiusPoint.y - element.center.y)
  const cmd = element.style.fillMode === 'none' ? '\\draw' : '\\path'

  return `${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(element.center)} ellipse[x radius=${formatNumber(xRadius)}, y radius=${formatNumber(yRadius)}];`
}

const pointToTikzElement = (element: PointElement | IntersectionPointElement): string =>
  `\\draw${styleToTikzOptions(element.style)} ${pointToTikz(element.center)} node[circle, fill, inner sep=1.5pt, label={${element.label}}]{};`

const polylineToTikz = (element: DrawingElement): string => {
  if (element.type !== 'polyline') {
    return ''
  }

  const points = element.points.map(pointToTikz).join(' -- ')
  const suffix = element.closed ? ' -- cycle' : ''
  const cmd =
    element.closed && element.style.fillMode !== 'none' ? '\\path' : '\\draw'
  const opts =
    element.closed && element.style.fillMode !== 'none'
      ? closedOrDrawOpts(element.style)
      : styleToTikzOptions(element.style)
  return `${cmd}${opts} ${points}${suffix};`
}

const polygonToTikz = (element: DrawingElement): string => {
  if (element.type !== 'polygon') return ''
  const pts = element.vertices.map(pointToTikz).join(' -- ')
  const cmd = element.style.fillMode === 'none' ? '\\draw' : '\\path'
  return `${cmd}${closedOrDrawOpts(element.style)} ${pts} -- cycle;`
}

const filledPathToTikz = (element: DrawingElement): string => {
  if (element.type !== 'filledPath') return ''
  const pts = element.vertices.map(pointToTikz).join(' -- ')
  const cmd = element.style.fillMode === 'none' ? '\\draw' : '\\path'
  return `${cmd}${closedOrDrawOpts(element.style)} ${pts} -- cycle;`
}

/** 扇形：饼楔；弓形：弦 + 与饼楔相同的较小圆弧。 */
const sectorToTikz = (element: DrawingElement): string => {
  if (element.type !== 'sector') return ''
  const { center, radius, startAngleDeg, endAngleDeg } = element
  const toRad = (d: number) => (d * Math.PI) / 180
  const p0: Point = {
    x: center.x + radius * Math.cos(toRad(startAngleDeg)),
    y: center.y + radius * Math.sin(toRad(startAngleDeg)),
  }
  const p1: Point = {
    x: center.x + radius * Math.cos(toRad(endAngleDeg)),
    y: center.y + radius * Math.sin(toRad(endAngleDeg)),
  }
  const cmd = element.style.fillMode === 'none' ? '\\draw' : '\\path'
  const shape = sectorEffectiveShape(element)
  if (shape === 'convexSegment') {
    const sweep = minorArcSignedSweep(endAngleDeg, startAngleDeg)
    return [
      `${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(p0)} -- ${pointToTikz(p1)}`,
      `arc[start angle=${formatNumber(endAngleDeg)}, delta angle=${formatNumber(sweep)}, radius=${formatNumber(radius)}] -- cycle;`,
    ].join('\n')
  }
  if (shape === 'iceCream' && element.apex) {
    const A = element.apex
    const C = center
    const rc = radius
    const sweepIc = element.iceArcSweepDeg ?? majorArcSignedSweep(startAngleDeg, endAngleDeg)
    const Q0 = rimPointOnCircle(C, rc, startAngleDeg)
    const phi0 = (Math.atan2(Q0.y - C.y, Q0.x - C.x) * 180) / Math.PI
    return `${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(A)} -- ${pointToTikz(Q0)} arc[start angle=${formatNumber(phi0)}, delta angle=${formatNumber(sweepIc)}, radius=${formatNumber(rc)}] -- cycle;`
  }
  if (shape === 'majorArcPie') {
    // 鼠标第一点 center：线段 center—第二端点、弧终点—center；弧心在 arcCenter（镜面），delta = −(第二与第三间较小圆心角)
    const { arcCenter, phi0, phi1 } = majorArcPieTikzMirrorArcCenter(
      center,
      radius,
      startAngleDeg,
      endAngleDeg,
    )
    const P2 = rimPointOnCircle(arcCenter, radius, phi0)
    const minorDeg = minorArcMeasureDegrees(phi0, phi1)
    const sweep = minorDeg >= 360 - 1e-9 ? -360 : -minorDeg
    return `${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(center)} -- ${pointToTikz(P2)} arc[start angle=${formatNumber(phi0)}, delta angle=${formatNumber(sweep)}, radius=${formatNumber(radius)}] -- ${pointToTikz(center)};`
  }
  if (shape === 'concaveBracket') {
    const g = concaveBracketArcParams(center, radius, startAngleDeg, endAngleDeg)
    if (!g) {
      const arcOpts = `arc[start angle=${formatNumber(startAngleDeg)}, end angle=${formatNumber(endAngleDeg)}, radius=${formatNumber(radius)}]`
      return [`${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(center)} -- ${pointToTikz(p0)}`, `${arcOpts} -- cycle;`].join('\n')
    }
    const phi0 = (Math.atan2(g.P0.y - g.arcCenter.y, g.P0.x - g.arcCenter.x) * 180) / Math.PI
    return `${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(center)} -- ${pointToTikz(g.P0)} arc[start angle=${formatNumber(phi0)}, delta angle=${formatNumber(g.arcSweepDeg)}, radius=${formatNumber(g.arcRadius)}] -- cycle;`
  }
  const arcOpts = `arc[start angle=${formatNumber(startAngleDeg)}, end angle=${formatNumber(endAngleDeg)}, radius=${formatNumber(radius)}]`
  return [`${cmd}${closedOrDrawOpts(element.style)} ${pointToTikz(center)} -- ${pointToTikz(p0)}`, `${arcOpts} -- cycle;`].join('\n')
}

const regularPolygonToTikz = (element: DrawingElement): string => {
  if (element.type !== 'regularPolygon') return ''
  const verts = regularPolygonVertices(element)
  const pts = verts.map(pointToTikz).join(' -- ')
  const cmd = element.style.fillMode === 'none' ? '\\draw' : '\\path'
  return `${cmd}${closedOrDrawOpts(element.style)} ${pts} -- cycle;`
}

const conicToTikz = (element: DrawingElement): string => {
  if (element.type !== 'conicCurve') return ''
  const pts = sampleConicCurve(element)
  if (pts.length < 2) return `% skipped empty conic ${element.id}`
  return `\\draw${styleToTikzOptions(element.style)} plot coordinates { ${plotCoordinatesLine(pts)} };`
}

const functionPlotToTikz = (element: DrawingElement): string => {
  if (element.type !== 'functionPlot') return ''
  const ox = element.plotOffset?.x ?? 0
  const oy = element.plotOffset?.y ?? 0
  const pts = sampleFunctionPlot({ ...element, plotOffset: { x: 0, y: 0 } })
  if (pts.length < 2) return `% skipped empty plot ${element.id}`
  const draw = `\\draw${styleToTikzOptions(element.style)} plot coordinates { ${plotCoordinatesLine(pts)} };`
  if (Math.abs(ox) > 1e-12 || Math.abs(oy) > 1e-12) {
    return `\\begin{scope}[shift={(${formatNumber(ox)},${formatNumber(oy)})}]\n${draw}\n\\end{scope}`
  }
  return draw
}

const tikzForeachToTikz = (element: DrawingElement): string => {
  if (element.type !== 'tikzForeach') return ''
  const macro = foreachMacro(element.iteratorName)
  const inner = `\\foreach ${macro} in {${element.listExpr}} {\n${element.bodyTemplate}\n}`
  const sx = element.scopeShift?.x ?? 0
  const sy = element.scopeShift?.y ?? 0
  if (Math.abs(sx) > 1e-12 || Math.abs(sy) > 1e-12) {
    return `% foreach ${element.id}\n\\begin{scope}[shift={(${formatNumber(sx)},${formatNumber(sy)})}]\n${inner}\\end{scope}`
  }
  return `% foreach ${element.id}\n${inner}`
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
  if (element.type === 'polygon') return polygonToTikz(element)
  if (element.type === 'filledPath') return filledPathToTikz(element)
  if (element.type === 'sector') return sectorToTikz(element)
  if (element.type === 'regularPolygon') return regularPolygonToTikz(element)
  if (element.type === 'conicCurve') return conicToTikz(element)
  if (element.type === 'functionPlot') return functionPlotToTikz(element)
  if (element.type === 'tikzForeach') return tikzForeachToTikz(element)
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
  const colorSet = new Set<string>()
  for (const element of elements) {
    colorSet.add(element.style.drawColor)
    if (element.style.fillMode !== 'none') colorSet.add(element.style.fillColor)
  }
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
\\usetikzlibrary{arrows.meta,calc,decorations.pathreplacing,positioning,patterns}

\\begin{document}
${tikzPicture}
\\end{document}
`
