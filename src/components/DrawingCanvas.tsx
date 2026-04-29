import type { DraftElement, DrawingElement, DrawingStyle, Point, Tool } from '../types/drawing'
import { colorMap } from '../types/drawing'

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

const getPoint = (event: React.MouseEvent<SVGSVGElement>): Point => {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

const arcPath = (start: Point, end: Point, sweepAngle: number): string => {
  const chord = Math.hypot(end.x - start.x, end.y - start.y)
  const theta = (Math.abs(sweepAngle) * Math.PI) / 180
  const radius = chord / (2 * Math.sin(theta / 2))
  const largeArcFlag = Math.abs(sweepAngle) > 180 ? 1 : 0
  const sweepFlag = sweepAngle > 0 ? 0 : 1

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`
}

const lineDash = (style: DrawingStyle): string | undefined => {
  if (style.lineStyle === 'dashed') {
    return '10 7'
  }
  if (style.lineStyle === 'dotted') {
    return '2 7'
  }
  return undefined
}

const markerEnd = (style: DrawingStyle): string | undefined =>
  style.arrow === 'end' || style.arrow === 'both' ? 'url(#arrow-end)' : undefined

const markerStart = (style: DrawingStyle): string | undefined =>
  style.arrow === 'start' || style.arrow === 'both' ? 'url(#arrow-start)' : undefined

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
  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const point = getPoint(event)

    if (activeTool === 'select') {
      onSelect(null)
      return
    }

    if (!draft) {
      onDraftChange({
        type: activeTool,
        start: point,
        end: point,
        sweepAngle: activeTool === 'arc' ? arcAngle : undefined,
        style: currentStyle,
      })
      return
    }

    if (draft.type === 'line') {
      onCreate({
        id: createId(),
        type: 'line',
        start: draft.start,
        end: point,
        style: draft.style,
      })
    } else {
      onCreate({
        id: createId(),
        type: 'arc',
        start: draft.start,
        end: point,
        sweepAngle: arcAngle,
        style: draft.style,
      })
    }

    onDraftChange(null)
  }

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!draft) {
      return
    }

    onDraftChange({
      ...draft,
      end: getPoint(event),
      sweepAngle: draft.type === 'arc' ? arcAngle : draft.sweepAngle,
    })
  }

  const renderElement = (element: DrawingElement, isDraft = false) => {
    const selected = !isDraft && selectedId === element.id
    const commonProps = {
      className: selected ? 'shape selected' : 'shape',
      stroke: colorMap[element.style.strokeColor],
      strokeWidth: element.style.strokeWidth,
      strokeDasharray: lineDash(element.style),
      markerEnd: markerEnd(element.style),
      markerStart: markerStart(element.style),
    }

    if (element.type === 'line') {
      return (
        <line
          key={element.id}
          {...commonProps}
          x1={element.start.x}
          x2={element.end.x}
          y1={element.start.y}
          y2={element.end.y}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(element.id)
          }}
        />
      )
    }

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

  const draftElement: DrawingElement | null = draft
    ? {
        id: 'draft',
        type: draft.type,
        start: draft.start,
        end: draft.end,
        sweepAngle: draft.sweepAngle ?? arcAngle,
        style: draft.style,
      } as DrawingElement
    : null

  return (
    <div className="canvas-card">
      <div className="canvas-header">
        <h2>画布</h2>
        <p>{activeTool === 'line' ? '直线：点击两点作图' : activeTool === 'arc' ? '圆弧：点击起点和终点' : '选择：点击图形修改属性'}</p>
      </div>
      <svg
        className="drawing-canvas"
        height="600"
        viewBox="0 0 800 600"
        width="800"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      >
        <defs>
          <pattern id="grid" height="50" patternUnits="userSpaceOnUse" width="50">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" />
          </pattern>
          <marker id="arrow-end" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#111827" />
          </marker>
          <marker id="arrow-start" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="1" refY="4">
            <path d="M 8 0 L 0 4 L 8 8 z" fill="#111827" />
          </marker>
        </defs>
        <rect fill="url(#grid)" height="600" width="800" />
        <line className="axis" x1="0" x2="800" y1="300" y2="300" />
        <line className="axis" x1="400" x2="400" y1="0" y2="600" />
        {elements.map((element) => renderElement(element))}
        {draftElement && renderElement(draftElement, true)}
      </svg>
    </div>
  )
}
