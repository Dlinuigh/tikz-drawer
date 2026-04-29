import type { MouseEvent } from 'react'
import { defaultCoordinateSystem, distance, getArcGeometry, snapTikzPoint, svgToTikz, tikzToSvg } from '../lib/geometry'
import type { DraftElement, DrawingElement, DrawingStyle, Point, Tool } from '../types/drawing'

type DrawingCanvasProps = {
  activeTool: Tool
  elements: DrawingElement[]
  draft: DraftElement | null
  selectedId: string | null
  currentStyle: DrawingStyle
  arcAngle: number
  onCreate: (element: DrawingElement) => void
  onDraftChange: (draft: DraftElement | null) => void
  onSelect: (id: string | null) => void
}

const createId = () => crypto.randomUUID()

const getSvgPoint = (event: MouseEvent<SVGSVGElement>): Point => {
  const rect = event.currentTarget.getBoundingClientRect()
  const scaleX = defaultCoordinateSystem.width / rect.width
  const scaleY = defaultCoordinateSystem.height / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

const arcPath = (start: Point, end: Point, sweepAngle: number): string => {
  const startSvg = tikzToSvg(start)
  const endSvg = tikzToSvg(end)
  const geometry = getArcGeometry(start, end, sweepAngle)

  if (!geometry) {
    return `M ${startSvg.x} ${startSvg.y} L ${endSvg.x} ${endSvg.y}`
  }

  const radius = geometry.radius * defaultCoordinateSystem.pixelsPerUnit
  const largeArcFlag = Math.abs(sweepAngle) > 180 ? 1 : 0
  const sweepFlag = sweepAngle > 0 ? 0 : 1

  return `M ${startSvg.x} ${startSvg.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endSvg.x} ${endSvg.y}`
}

const rectangleBounds = (start: Point, end: Point) => {
  const startSvg = tikzToSvg(start)
  const endSvg = tikzToSvg(end)

  return {
    x: Math.min(startSvg.x, endSvg.x),
    y: Math.min(startSvg.y, endSvg.y),
    width: Math.abs(endSvg.x - startSvg.x),
    height: Math.abs(endSvg.y - startSvg.y),
  }
}

const ellipseRadii = (center: Point, radiusPoint: Point) => ({
  rx: Math.abs(radiusPoint.x - center.x) * defaultCoordinateSystem.pixelsPerUnit,
  ry: Math.abs(radiusPoint.y - center.y) * defaultCoordinateSystem.pixelsPerUnit,
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

const gridLines = () => {
  const { width, height, gridStep, pixelsPerUnit, origin } = defaultCoordinateSystem
  const minX = Math.ceil(-origin.x / pixelsPerUnit / gridStep) * gridStep
  const maxX = Math.floor((width - origin.x) / pixelsPerUnit / gridStep) * gridStep
  const minY = Math.ceil((origin.y - height) / pixelsPerUnit / gridStep) * gridStep
  const maxY = Math.floor(origin.y / pixelsPerUnit / gridStep) * gridStep
  const lines: Array<{ id: string; x1: number; x2: number; y1: number; y2: number }> = []

  for (let x = minX; x <= maxX; x += gridStep) {
    const top = tikzToSvg({ x, y: maxY })
    const bottom = tikzToSvg({ x, y: minY })
    lines.push({ id: `x-${x}`, x1: top.x, x2: bottom.x, y1: top.y, y2: bottom.y })
  }

  for (let y = minY; y <= maxY; y += gridStep) {
    const left = tikzToSvg({ x: minX, y })
    const right = tikzToSvg({ x: maxX, y })
    lines.push({ id: `y-${y}`, x1: left.x, x2: right.x, y1: left.y, y2: right.y })
  }

  return lines
}

const toolHint: Record<Tool, string> = {
  select: '选择：点击图形修改属性',
  line: '直线：点击两点作图',
  arc: '圆弧：点击起点和终点',
  rectangle: '矩形：点击两个对角点',
  circle: '圆：点击圆心和半径点',
  ellipse: '椭圆：点击中心和半径点',
  polyline: '多段线：连续点击添加点',
}

export function DrawingCanvas({
  activeTool,
  elements,
  draft,
  selectedId,
  currentStyle,
  arcAngle,
  onCreate,
  onDraftChange,
  onSelect,
}: DrawingCanvasProps) {
  const handleCanvasClick = (event: MouseEvent<SVGSVGElement>) => {
    const point = snapTikzPoint(svgToTikz(getSvgPoint(event)))

    if (activeTool === 'select') {
      onSelect(null)
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
        type: activeTool,
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
      end: snapTikzPoint(svgToTikz(getSvgPoint(event))),
      sweepAngle: draft.type === 'arc' ? arcAngle : draft.sweepAngle,
    })
  }

  const finishPolyline = () => {
    if (draft?.type !== 'polyline' || !draft.points || draft.points.length < 2) {
      return
    }

    onCreate({ id: createId(), type: 'polyline', points: draft.points, style: draft.style })
    onDraftChange(null)
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
      const start = tikzToSvg(element.start)
      const end = tikzToSvg(element.end)

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
          d={arcPath(element.start, element.end, element.sweepAngle)}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

    if (element.type === 'rectangle') {
      const bounds = rectangleBounds(element.start, element.end)

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
      const center = tikzToSvg(element.center)

      return (
        <circle
          key={element.id}
          {...commonProps}
          cx={center.x}
          cy={center.y}
          fill="none"
          r={distance(element.center, element.radiusPoint) * defaultCoordinateSystem.pixelsPerUnit}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

    if (element.type === 'ellipse') {
      const center = tikzToSvg(element.center)
      const radii = ellipseRadii(element.center, element.radiusPoint)

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

    return (
      <polyline
        key={element.id}
        {...commonProps}
        fill="none"
        points={element.points.map((point) => tikzToSvg(point)).map((point) => `${point.x},${point.y}`).join(' ')}
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
  const origin = tikzToSvg({ x: 0, y: 0 })

  return (
    <div className="canvas-card">
      <div className="canvas-header">
        <div>
          <h2>画布</h2>
          <p>{toolHint[activeTool]}</p>
        </div>
        {draft?.type === 'polyline' && (
          <button type="button" onClick={finishPolyline} disabled={(draft.points?.length ?? 0) < 2}>
            完成多段线
          </button>
        )}
      </div>
      <svg
        className="drawing-canvas"
        height={defaultCoordinateSystem.height}
        viewBox={`0 0 ${defaultCoordinateSystem.width} ${defaultCoordinateSystem.height}`}
        width={defaultCoordinateSystem.width}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      >
        <defs>
          <marker id="arrow-end" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
          </marker>
          <marker id="arrow-start" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="1" refY="4">
            <path d="M 8 0 L 0 4 L 8 8 z" fill="context-stroke" />
          </marker>
        </defs>
        <rect className="canvas-background" height={defaultCoordinateSystem.height} width={defaultCoordinateSystem.width} />
        {gridLines().map((line) => (
          <line key={line.id} className="grid-line" x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} />
        ))}
        <line className="axis" x1="0" x2={defaultCoordinateSystem.width} y1={origin.y} y2={origin.y} />
        <line className="axis" x1={origin.x} x2={origin.x} y1="0" y2={defaultCoordinateSystem.height} />
        {elements.map((element) => renderElement(element))}
        {draftElement && renderElement(draftElement, true)}
      </svg>
    </div>
  )
}
