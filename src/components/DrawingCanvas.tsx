import type { MouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import type { CoordinateSystem } from '../lib/geometry'
import { distance, getArcGeometry, snapTikzPoint, svgToTikz, tikzToSvg } from '../lib/geometry'
import {
  axesNameLabelOffset,
  axesTickHalfLength,
  axesTickLabelOffset,
  getAxesSegments,
  mergeAxisTickMarks,
  svgNameLabelAttrs,
  tickMarkDisplayLabel,
  tickValuesInRange,
} from '../lib/axes'
import type { DraftElement, DrawingElement, DrawingStyle, GridConfig, LineSubtool, Point, Tool } from '../types/drawing'
type DrawingCanvasProps = {
  activeTool: Tool
  lineSubtool: LineSubtool
  elements: DrawingElement[]
  draft: DraftElement | null
  selectedId: string | null
  currentStyle: DrawingStyle
  arcAngle: number
  gridConfig: GridConfig
  coordinateSystem: CoordinateSystem
  onViewOriginChange: (origin: Point) => void
  onCreate: (element: DrawingElement) => void
  onDraftChange: (draft: DraftElement | null) => void
  onSelect: (id: string | null) => void
  onAxesOriginPick: (origin: Point) => void
  onLineSlopeAnchorPick: (anchor: Point) => void
}

const createId = () => crypto.randomUUID()

const getSvgPoint = (event: MouseEvent<SVGSVGElement>, cs: CoordinateSystem): Point => {
  const rect = event.currentTarget.getBoundingClientRect()
  const scaleX = cs.width / rect.width
  const scaleY = cs.height / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

const arcPath = (start: Point, end: Point, sweepAngle: number, cs: CoordinateSystem): string => {
  const startSvg = tikzToSvg(start, cs)
  const endSvg = tikzToSvg(end, cs)
  const geometry = getArcGeometry(start, end, sweepAngle)

  if (!geometry) {
    return `M ${startSvg.x} ${startSvg.y} L ${endSvg.x} ${endSvg.y}`
  }

  const radius = geometry.radius * cs.pixelsPerUnit
  const largeArcFlag = Math.abs(sweepAngle) > 180 ? 1 : 0
  const sweepFlag = sweepAngle > 0 ? 0 : 1

  return `M ${startSvg.x} ${startSvg.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endSvg.x} ${endSvg.y}`
}

const rectangleBounds = (start: Point, end: Point, cs: CoordinateSystem) => {
  const startSvg = tikzToSvg(start, cs)
  const endSvg = tikzToSvg(end, cs)

  return {
    x: Math.min(startSvg.x, endSvg.x),
    y: Math.min(startSvg.y, endSvg.y),
    width: Math.abs(endSvg.x - startSvg.x),
    height: Math.abs(endSvg.y - startSvg.y),
  }
}

const ellipseRadii = (center: Point, radiusPoint: Point, cs: CoordinateSystem) => ({
  rx: Math.abs(radiusPoint.x - center.x) * cs.pixelsPerUnit,
  ry: Math.abs(radiusPoint.y - center.y) * cs.pixelsPerUnit,
})

const lineDash = (style: DrawingStyle): string | undefined => {
  if (style.lineStyle === 'dashed') {
    return '10 7'
  }
  if (style.lineStyle === 'dotted') {
    return '2 7'
  }
  if (style.lineStyle === 'dash dot') {
    return '10 6 2 6'
  }
  return undefined
}

const markerEnd = (style: DrawingStyle): string | undefined =>
  style.endArrow !== 'none' ? 'url(#arrow-end)' : undefined

const markerStart = (style: DrawingStyle): string | undefined =>
  style.startArrow !== 'none' ? 'url(#arrow-start)' : undefined

const svgLineCap: Record<DrawingStyle['lineCap'], 'butt' | 'round' | 'square'> = {
  butt: 'butt',
  round: 'round',
  rect: 'square',
}

const gridLines = (gridConfig: GridConfig, cs: CoordinateSystem) => {
  const { width, height, pixelsPerUnit, origin } = cs
  const { gridStep } = gridConfig
  if (!gridConfig.showGrid) {
    return []
  }
  const minX = Math.ceil(-origin.x / pixelsPerUnit / gridStep) * gridStep
  const maxX = Math.floor((width - origin.x) / pixelsPerUnit / gridStep) * gridStep
  const minY = Math.ceil((origin.y - height) / pixelsPerUnit / gridStep) * gridStep
  const maxY = Math.floor(origin.y / pixelsPerUnit / gridStep) * gridStep
  const lines: Array<{ id: string; x1: number; x2: number; y1: number; y2: number }> = []

  for (let x = minX; x <= maxX; x += gridStep) {
    const top = tikzToSvg({ x, y: maxY }, cs)
    const bottom = tikzToSvg({ x, y: minY }, cs)
    lines.push({ id: `x-${x}`, x1: top.x, x2: bottom.x, y1: top.y, y2: bottom.y })
  }

  for (let y = minY; y <= maxY; y += gridStep) {
    const left = tikzToSvg({ x: minX, y }, cs)
    const right = tikzToSvg({ x: maxX, y }, cs)
    lines.push({ id: `y-${y}`, x1: left.x, x2: right.x, y1: left.y, y2: right.y })
  }

  return lines
}

const gridLineDash = (gridConfig: GridConfig): string | undefined => {
  if (gridConfig.gridLineStyle === 'dashed') {
    return '8 6'
  }
  if (gridConfig.gridLineStyle === 'dotted') {
    return '2 4'
  }
  return undefined
}

const axesEpsilon = 1e-9

export function DrawingCanvas({
  activeTool,
  lineSubtool,
  elements,
  draft,
  selectedId,
  currentStyle,
  arcAngle,
  gridConfig,
  coordinateSystem: cs,
  onViewOriginChange,
  onCreate,
  onDraftChange,
  onSelect,
  onAxesOriginPick,
  onLineSlopeAnchorPick,
}: DrawingCanvasProps) {
  const panLast = useRef<{ x: number; y: number } | null>(null)
  const skipNextClick = useRef(false)
  const draftRef = useRef(draft)
  draftRef.current = draft

  const finishPolyline = useCallback(() => {
    const d = draftRef.current
    if (d?.type !== 'polyline' || !d.points || d.points.length < 2) {
      return
    }

    onCreate({ id: createId(), type: 'polyline', points: d.points, style: d.style })
    onDraftChange(null)
  }, [onCreate, onDraftChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const d = draftRef.current
      if (d?.type !== 'polyline') return
      e.preventDefault()
      if ((d.points?.length ?? 0) >= 2) {
        finishPolyline()
      } else {
        onDraftChange(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finishPolyline, onDraftChange])

  const handleCanvasClick = (event: MouseEvent<SVGSVGElement>) => {
    if (skipNextClick.current) {
      skipNextClick.current = false
      return
    }
    const point = snapTikzPoint(svgToTikz(getSvgPoint(event, cs), cs), cs)

    if (activeTool === 'select') {
      onSelect(null)
      return
    }

    if (activeTool === 'axes') {
      onAxesOriginPick(point)
      return
    }

    if (activeTool === 'line' && lineSubtool === 'pointSlope') {
      onLineSlopeAnchorPick(point)
      return
    }

    if (activeTool === 'polyline' && draft?.type === 'polyline') {
      onDraftChange({
        ...draft,
        end: point,
        points: [...(draft.points ?? [draft.start]), point],
      })
      return
    }

    if (!draft) {
      onDraftChange({
        type: activeTool as DraftElement['type'],
        start: point,
        end: point,
        points: activeTool === 'polyline' ? [point] : undefined,
        sweepAngle: activeTool === 'arc' ? arcAngle : undefined,
        style: currentStyle,
      })
      return
    }

    if (draft.type === 'line') {
      onCreate({ id: createId(), type: 'line', start: draft.start, end: point, style: draft.style })
    } else if (draft.type === 'arc') {
      onCreate({ id: createId(), type: 'arc', start: draft.start, end: point, sweepAngle: arcAngle, style: draft.style })
    } else if (draft.type === 'rectangle') {
      onCreate({ id: createId(), type: 'rectangle', start: draft.start, end: point, style: draft.style })
    } else if (draft.type === 'circle') {
      onCreate({ id: createId(), type: 'circle', center: draft.start, radiusPoint: point, style: draft.style })
    } else if (draft.type === 'ellipse') {
      onCreate({ id: createId(), type: 'ellipse', center: draft.start, radiusPoint: point, style: draft.style })
    }

    onDraftChange(null)
  }

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!draft) {
      return
    }

    onDraftChange({
      ...draft,
      end: snapTikzPoint(svgToTikz(getSvgPoint(event, cs), cs), cs),
      sweepAngle: draft.type === 'arc' ? arcAngle : draft.sweepAngle,
    })
  }

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!event.altKey && event.button !== 1) return
    event.preventDefault()
    panLast.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!panLast.current) return
    const dx = event.clientX - panLast.current.x
    const dy = event.clientY - panLast.current.y
    if (dx !== 0 || dy !== 0) {
      skipNextClick.current = true
    }
    panLast.current = { x: event.clientX, y: event.clientY }
    onViewOriginChange({ x: cs.origin.x + dx, y: cs.origin.y + dy })
  }

  const handlePointerUp = () => {
    panLast.current = null
  }

  const renderElement = (element: DrawingElement, isDraft = false) => {
    const selected = !isDraft && selectedId === element.id
    const commonProps = {
      className: selected ? 'shape selected' : 'shape',
      opacity: element.style.opacity,
      stroke: element.style.drawColor,
      strokeLinecap: svgLineCap[element.style.lineCap],
      strokeLinejoin: element.style.lineJoin,
      strokeWidth: element.style.lineWidth * 2,
      strokeDasharray: lineDash(element.style),
      markerEnd: markerEnd(element.style),
      markerStart: markerStart(element.style),
    }

    if (element.type === 'line') {
      const start = tikzToSvg(element.start, cs)
      const end = tikzToSvg(element.end, cs)

      return (
        <line
          key={element.id}
          {...commonProps}
          x1={start.x}
          x2={end.x}
          y1={start.y}
          y2={end.y}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

    if (element.type === 'arc') {
      return (
        <path
          key={element.id}
          {...commonProps}
          d={arcPath(element.start, element.end, element.sweepAngle, cs)}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

    if (element.type === 'rectangle') {
      const bounds = rectangleBounds(element.start, element.end, cs)

      return (
        <rect
          key={element.id}
          {...commonProps}
          fill="none"
          height={bounds.height}
          width={bounds.width}
          x={bounds.x}
          y={bounds.y}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

    if (element.type === 'circle') {
      const center = tikzToSvg(element.center, cs)

      return (
        <circle
          key={element.id}
          {...commonProps}
          cx={center.x}
          cy={center.y}
          fill="none"
          r={distance(element.center, element.radiusPoint) * cs.pixelsPerUnit}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

    if (element.type === 'ellipse') {
      const center = tikzToSvg(element.center, cs)
      const radii = ellipseRadii(element.center, element.radiusPoint, cs)

      return (
        <ellipse
          key={element.id}
          {...commonProps}
          cx={center.x}
          cy={center.y}
          fill="none"
          rx={radii.rx}
          ry={radii.ry}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

    if (element.type === 'axes') {
      const { x, y } = getAxesSegments(element.origin, element.xMin, element.xMax, element.yMin, element.yMax)
      const ox = element.origin.x
      const oy = element.origin.y
      const δ = axesTickHalfLength
      const axisStrokeProps = {
        className: selected ? 'shape selected' : 'shape',
        opacity: element.style.opacity,
        stroke: element.style.drawColor,
        strokeLinecap: svgLineCap[element.style.lineCap],
        strokeLinejoin: element.style.lineJoin,
        strokeWidth: element.style.lineWidth * 2,
        strokeDasharray: lineDash(element.style),
        markerEnd: markerEnd(element.style),
      }

      const tickStrokeProps = {
        className: selected ? 'shape selected' : 'shape',
        opacity: element.style.opacity,
        stroke: element.style.drawColor,
        strokeLinecap: svgLineCap[element.style.lineCap],
        strokeLinejoin: element.style.lineJoin,
        strokeWidth: element.style.lineWidth * 2,
        strokeDasharray: lineDash(element.style),
      }

      const xSpan = Math.abs(x.end.x - x.start.x)
      const ySpan = Math.abs(y.end.y - y.start.y)
      const xStartSvg = tikzToSvg(x.start, cs)
      const xEndSvg = tikzToSvg(x.end, cs)
      const yStartSvg = tikzToSvg(y.start, cs)
      const yEndSvg = tikzToSvg(y.end, cs)

      const tickLabelProps = {
        className: selected ? 'axes-tick-label selected' : 'axes-tick-label',
        fill: element.style.drawColor,
        opacity: element.style.opacity,
        fontSize: 11,
      }

      const nameLabelProps = {
        className: selected ? 'axes-name-label selected' : 'axes-name-label',
        fill: element.style.drawColor,
        opacity: element.style.opacity,
        fontSize: 13,
      }

      const handleSelectAxes = (event: MouseEvent) => {
        event.stopPropagation()
        onSelect(element.id)
      }

      const nodes: ReactNode[] = []

      if (xSpan > axesEpsilon) {
        nodes.push(
          <line
            key={`${element.id}-x-axis`}
            {...axisStrokeProps}
            x1={xStartSvg.x}
            x2={xEndSvg.x}
            y1={xStartSvg.y}
            y2={xEndSvg.y}
            onClick={handleSelectAxes}
          />,
        )
      }

      if (ySpan > axesEpsilon) {
        nodes.push(
          <line
            key={`${element.id}-y-axis`}
            {...axisStrokeProps}
            x1={yStartSvg.x}
            x2={yEndSvg.x}
            y1={yStartSvg.y}
            y2={yEndSvg.y}
            onClick={handleSelectAxes}
          />,
        )
      }

      if (element.showTicks && xSpan > axesEpsilon) {
        const xMin = Math.min(x.start.x, x.end.x)
        const xMax = Math.max(x.start.x, x.end.x)
        const steppedX =
          element.tickStepX > 0 ? tickValuesInRange(xMin, xMax, element.tickStepX) : []
        const ticksX = mergeAxisTickMarks(steppedX, element.manualTicksX, xMin, xMax)
        for (let i = 0; i < ticksX.length; i++) {
          const tick = ticksX[i]
          const tx = tick.value
          const hi = tikzToSvg({ x: tx, y: oy + δ }, cs)
          const lo = tikzToSvg({ x: tx, y: oy - δ }, cs)
          nodes.push(
            <line
              key={`${element.id}-xt-${i}-${tx}`}
              {...tickStrokeProps}
              x1={hi.x}
              x2={lo.x}
              y1={hi.y}
              y2={lo.y}
              onClick={handleSelectAxes}
            />,
          )
          if (element.showTickLabels) {
            const labelPos = tikzToSvg({ x: tx, y: oy - δ - axesTickLabelOffset * 0.45 }, cs)
            nodes.push(
              <text
                key={`${element.id}-xtl-${i}-${tx}`}
                {...tickLabelProps}
                textAnchor="middle"
                x={labelPos.x}
                y={labelPos.y}
                onClick={handleSelectAxes}
              >
                {tickMarkDisplayLabel(tick)}
              </text>,
            )
          }
        }
      }

      if (element.showTicks && ySpan > axesEpsilon) {
        const yMin = Math.min(y.start.y, y.end.y)
        const yMax = Math.max(y.start.y, y.end.y)
        const steppedY =
          element.tickStepY > 0 ? tickValuesInRange(yMin, yMax, element.tickStepY) : []
        const ticksY = mergeAxisTickMarks(steppedY, element.manualTicksY, yMin, yMax)
        for (let i = 0; i < ticksY.length; i++) {
          const tick = ticksY[i]
          const ty = tick.value
          const left = tikzToSvg({ x: ox - δ, y: ty }, cs)
          const right = tikzToSvg({ x: ox + δ, y: ty }, cs)
          nodes.push(
            <line
              key={`${element.id}-yt-${i}-${ty}`}
              {...tickStrokeProps}
              x1={left.x}
              x2={right.x}
              y1={left.y}
              y2={right.y}
              onClick={handleSelectAxes}
            />,
          )
          if (element.showTickLabels) {
            const labelPos = tikzToSvg({ x: ox - δ - axesTickLabelOffset * 0.45, y: ty }, cs)
            nodes.push(
              <text
                key={`${element.id}-ytl-${i}-${ty}`}
                {...tickLabelProps}
                dominantBaseline="middle"
                textAnchor="end"
                x={labelPos.x}
                y={labelPos.y}
                onClick={handleSelectAxes}
              >
                {tickMarkDisplayLabel(tick)}
              </text>,
            )
          }
        }
      }

      if (element.labelX.trim() && xSpan > axesEpsilon) {
        const p = tikzToSvg(
          {
            x: x.end.x + axesNameLabelOffset + element.labelXDx,
            y: oy + element.labelXDy,
          },
          cs,
        )
        const xLay = svgNameLabelAttrs(element.labelXPlacement)
        nodes.push(
          <text
            key={`${element.id}-lx`}
            {...nameLabelProps}
            textAnchor={xLay.textAnchor}
            x={p.x}
            y={p.y}
            dominantBaseline={xLay.dominantBaseline}
            onClick={handleSelectAxes}
          >
            {element.labelX}
          </text>,
        )
      }

      if (element.labelY.trim() && ySpan > axesEpsilon) {
        const p = tikzToSvg(
          {
            x: ox + element.labelYDx,
            y: y.end.y + axesNameLabelOffset + element.labelYDy,
          },
          cs,
        )
        const yLay = svgNameLabelAttrs(element.labelYPlacement)
        nodes.push(
          <text
            key={`${element.id}-ly`}
            {...nameLabelProps}
            textAnchor={yLay.textAnchor}
            x={p.x}
            y={p.y}
            dominantBaseline={yLay.dominantBaseline}
            onClick={handleSelectAxes}
          >
            {element.labelY}
          </text>,
        )
      }

      return (
        <g key={element.id}>
          {nodes}
        </g>
      )
    }

    return (
      <polyline
        key={element.id}
        {...commonProps}
        fill="none"
        points={element.points.map((point) => tikzToSvg(point, cs)).map((point) => `${point.x},${point.y}`).join(' ')}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(element.id)
        }}
      />
    )
  }

  const draftElement: DrawingElement | null = draft
    ? draft.type === 'line'
      ? { id: 'draft', type: 'line', start: draft.start, end: draft.end, style: draft.style }
      : draft.type === 'arc'
        ? { id: 'draft', type: 'arc', start: draft.start, end: draft.end, sweepAngle: draft.sweepAngle ?? arcAngle, style: draft.style }
        : draft.type === 'rectangle'
          ? { id: 'draft', type: 'rectangle', start: draft.start, end: draft.end, style: draft.style }
          : draft.type === 'circle'
            ? { id: 'draft', type: 'circle', center: draft.start, radiusPoint: draft.end, style: draft.style }
            : draft.type === 'ellipse'
              ? { id: 'draft', type: 'ellipse', center: draft.start, radiusPoint: draft.end, style: draft.style }
              : { id: 'draft', type: 'polyline', points: [...(draft.points ?? [draft.start]), draft.end], style: draft.style }
    : null
  const origin = tikzToSvg({ x: 0, y: 0 }, cs)

  return (
    <div className="canvas-card">
      {draft?.type === 'polyline' && (
        <div className="canvas-header">
          <button type="button" onClick={finishPolyline} disabled={(draft.points?.length ?? 0) < 2}>
            完成多段线
          </button>
        </div>
      )}
      <svg
        className="drawing-canvas"
        height={cs.height}
        role="application"
        tabIndex={0}
        viewBox={`0 0 ${cs.width} ${cs.height}`}
        width={cs.width}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <marker id="arrow-end" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
          </marker>
          <marker id="arrow-start" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="1" refY="4">
            <path d="M 8 0 L 0 4 L 8 8 z" fill="context-stroke" />
          </marker>
        </defs>
        <rect className="canvas-background" height={cs.height} width={cs.width} />
        {gridLines(gridConfig, cs).map((line) => (
          <line
            key={line.id}
            className="grid-line"
            stroke={gridConfig.gridColor}
            strokeWidth={gridConfig.gridLineWidth}
            strokeDasharray={gridLineDash(gridConfig)}
            x1={line.x1}
            x2={line.x2}
            y1={line.y1}
            y2={line.y2}
          />
        ))}
        <line className="axis" x1="0" x2={cs.width} y1={origin.y} y2={origin.y} />
        <line className="axis" x1={origin.x} x2={origin.x} y1="0" y2={cs.height} />
        {elements.map((element) => renderElement(element))}
        {draftElement && renderElement(draftElement, true)}
      </svg>
    </div>
  )
}
