import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { formatNumber } from '../lib/geometry'
import { parseFlexibleNumber } from '../lib/parseNumber'
import type {
  ArcSubtool,
  AxisNameTikzPlacement,
  AxisTickMark,
  AxesElement,
  ArrowHead,
  CircleSubtool,
  DrawingElement,
  DrawingStyle,
  EllipseSubtool,
  LineCap,
  LineJoin,
  LineStyle,
  LineSubtool,
  Tool,
} from '../types/drawing'

const AXIS_NAME_PLACEMENT_OPTIONS: Array<{ value: AxisNameTikzPlacement; label: string }> = [
  { value: 'above', label: '上 above' },
  { value: 'below', label: '下 below' },
  { value: 'left', label: '左 left' },
  { value: 'right', label: '右 right' },
  { value: 'above left', label: '左上 above left' },
  { value: 'above right', label: '右上 above right' },
  { value: 'below left', label: '左下 below left' },
  { value: 'below right', label: '右下 below right' },
]

type AxesPropTab = 'range' | 'ticks' | 'names'

function FractionalField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: number
  onCommit: (next: number) => void
}) {
  const [text, setText] = useState(() => formatNumber(value))

  const commit = () => {
    const n = parseFlexibleNumber(text.trim())
    if (!Number.isNaN(n)) {
      onCommit(n)
      setText(formatNumber(n))
    } else {
      setText(formatNumber(value))
    }
  }

  return (
    <label>
      {label}
      <input
        inputMode="decimal"
        type="text"
        value={text}
        onBlur={commit}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
    </label>
  )
}

function ManualTickMarksEditor({
  elementId,
  marks,
  onChange,
  title,
}: {
  elementId: string
  marks: AxisTickMark[]
  title: string
  onChange: (next: AxisTickMark[]) => void
}) {
  const commitMark = (index: number, patch: Partial<AxisTickMark>) => {
    const base = marks[index]
    const nextMark: AxisTickMark = { ...base, ...patch }
    const nextMarks = [...marks]
    nextMarks[index] = nextMark
    onChange(nextMarks)
  }

  return (
    <div className="manual-ticks-block">
      <p className="field-group-title">{title}</p>
      <p className="hint">与步长刻度合并；同一坐标上手动条目覆盖步长刻度；标记可写 TikZ/LaTeX，留空则按数值自动生成。</p>
      {marks.map((mark, index) => (
        <div className="manual-tick-row" key={`${elementId}-tick-${index}`}>
          <label>
            位置
            <input
              key={`${elementId}-pv-${index}-${mark.value}`}
              defaultValue={formatNumber(mark.value)}
              type="text"
              onBlur={(e) => {
                const v = parseFlexibleNumber(e.target.value.trim())
                if (!Number.isNaN(v)) {
                  commitMark(index, { value: v })
                }
              }}
            />
          </label>
          <label>
            标记名
            <input
              key={`${elementId}-lb-${index}-${mark.label ?? ''}`}
              defaultValue={mark.label ?? ''}
              placeholder="可选，如 $π$ 或 α"
              type="text"
              onBlur={(e) => {
                const t = e.target.value.trim()
                commitMark(index, { label: t === '' ? undefined : e.target.value })
              }}
            />
          </label>
          <button
            className="compact"
            type="button"
            onClick={() => onChange(marks.filter((_, j) => j !== index))}
          >
            删
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...marks, { value: 0 }])}
      >
        添加刻度
      </button>
    </div>
  )
}

function AxesTabs({
  element,
  onUpdate,
}: {
  element: AxesElement
  onUpdate: (element: DrawingElement) => void
}) {
  const [tab, setTab] = useState<AxesPropTab>('range')

  return (
    <div className="axes-prop-tabs">
      <div aria-label="坐标轴分组" className="tab-strip" role="tablist">
        <button
          className={`tab-chip ${tab === 'range' ? 'active' : ''}`}
          role="tab"
          type="button"
          aria-selected={tab === 'range'}
          onClick={() => setTab('range')}
        >
          范围·原点
        </button>
        <button
          className={`tab-chip ${tab === 'ticks' ? 'active' : ''}`}
          role="tab"
          type="button"
          aria-selected={tab === 'ticks'}
          onClick={() => setTab('ticks')}
        >
          刻度
        </button>
        <button
          className={`tab-chip ${tab === 'names' ? 'active' : ''}`}
          role="tab"
          type="button"
          aria-selected={tab === 'names'}
          onClick={() => setTab('names')}
        >
          轴名·位置
        </button>
      </div>

      {tab === 'range' && (
        <div className="tab-panel" role="tabpanel">
          <FractionalField
            key={`${element.id}-axes-ox-${element.origin.x}`}
            label="原点 x（支持 1/3）"
            value={element.origin.x}
            onCommit={(originX) => onUpdate({ ...element, origin: { ...element.origin, x: originX } })}
          />
          <FractionalField
            key={`${element.id}-axes-oy-${element.origin.y}`}
            label="原点 y"
            value={element.origin.y}
            onCommit={(originY) => onUpdate({ ...element, origin: { ...element.origin, y: originY } })}
          />
          <FractionalField
            key={`${element.id}-axes-xMin-${element.xMin}`}
            label="x 下限"
            value={element.xMin}
            onCommit={(xMin) => onUpdate({ ...element, xMin })}
          />
          <FractionalField
            key={`${element.id}-axes-xMax-${element.xMax}`}
            label="x 上限"
            value={element.xMax}
            onCommit={(xMax) => onUpdate({ ...element, xMax })}
          />
          <FractionalField
            key={`${element.id}-axes-yMin-${element.yMin}`}
            label="y 下限"
            value={element.yMin}
            onCommit={(yMin) => onUpdate({ ...element, yMin })}
          />
          <FractionalField
            key={`${element.id}-axes-yMax-${element.yMax}`}
            label="y 上限"
            value={element.yMax}
            onCommit={(yMax) => onUpdate({ ...element, yMax })}
          />
        </div>
      )}

      {tab === 'ticks' && (
        <div className="tab-panel" role="tabpanel">
          <FractionalField
            key={`${element.id}-axes-tickStepX-${element.tickStepX}`}
            label="x 刻度步长（≤0 仅手动刻度）"
            value={element.tickStepX}
            onCommit={(tickStepX) => onUpdate({ ...element, tickStepX })}
          />
          <FractionalField
            key={`${element.id}-axes-tickStepY-${element.tickStepY}`}
            label="y 刻度步长（≤0 仅手动刻度）"
            value={element.tickStepY}
            onCommit={(tickStepY) => onUpdate({ ...element, tickStepY })}
          />
          <label>
            <input
              checked={element.showTicks}
              type="checkbox"
              onChange={(event) => onUpdate({ ...element, showTicks: event.target.checked })}
            />{' '}
            显示刻度线
          </label>
          <label>
            <input
              checked={element.showTickLabels}
              type="checkbox"
              onChange={(event) => onUpdate({ ...element, showTickLabels: event.target.checked })}
            />{' '}
            显示刻度标记
          </label>
          <ManualTickMarksEditor
            elementId={element.id}
            marks={element.manualTicksX}
            title="手动 x 刻度"
            onChange={(manualTicksX) => onUpdate({ ...element, manualTicksX })}
          />
          <ManualTickMarksEditor
            elementId={element.id}
            marks={element.manualTicksY}
            title="手动 y 刻度"
            onChange={(manualTicksY) => onUpdate({ ...element, manualTicksY })}
          />
        </div>
      )}

      {tab === 'names' && (
        <div className="tab-panel" role="tabpanel">
          <label>
            x 轴名称（原样写入 TikZ，常用如美元符号包裹的公式）
            <input
              type="text"
              value={element.labelX}
              onChange={(event) => onUpdate({ ...element, labelX: event.target.value })}
            />
          </label>
          <label>
            x 轴名相对正半轴尖端的 TikZ node 方位
            <select
              value={element.labelXPlacement}
              onChange={(e) =>
                onUpdate({
                  ...element,
                  labelXPlacement: e.target.value as AxisNameTikzPlacement,
                })
              }
            >
              {AXIS_NAME_PLACEMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <FractionalField
            key={`${element.id}-axes-xname-dx-${element.labelXDx}`}
            label="x 轴名 附加偏移 Δx（TikZ）"
            value={element.labelXDx}
            onCommit={(labelXDx) => onUpdate({ ...element, labelXDx })}
          />
          <FractionalField
            key={`${element.id}-axes-xname-dy-${element.labelXDy}`}
            label="x 轴名 附加偏移 Δy（TikZ）"
            value={element.labelXDy}
            onCommit={(labelXDy) => onUpdate({ ...element, labelXDy })}
          />

          <label>
            y 轴名称
            <input
              type="text"
              value={element.labelY}
              onChange={(event) => onUpdate({ ...element, labelY: event.target.value })}
            />
          </label>
          <label>
            y 轴名相对正半轴尖端的 TikZ node 方位
            <select
              value={element.labelYPlacement}
              onChange={(e) =>
                onUpdate({
                  ...element,
                  labelYPlacement: e.target.value as AxisNameTikzPlacement,
                })
              }
            >
              {AXIS_NAME_PLACEMENT_OPTIONS.map((o) => (
                <option key={`y-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <FractionalField
            key={`${element.id}-axes-yname-dx-${element.labelYDx}`}
            label="y 轴名 附加偏移 Δx（TikZ）"
            value={element.labelYDx}
            onCommit={(labelYDx) => onUpdate({ ...element, labelYDx })}
          />
          <FractionalField
            key={`${element.id}-axes-yname-dy-${element.labelYDy}`}
            label="y 轴名 附加偏移 Δy（TikZ）"
            value={element.labelYDy}
            onCommit={(labelYDy) => onUpdate({ ...element, labelYDy })}
          />
        </div>
      )}
    </div>
  )
}

type PropertiesPanelProps = {
  activeTool: Tool
  lineSubtool: LineSubtool
  circleSubtool: CircleSubtool
  ellipseSubtool: EllipseSubtool
  arcSubtool: ArcSubtool
  arcAngle: number
  currentStyle: DrawingStyle
  selectedElement: DrawingElement | null
  onLineSubtoolChange: (sub: LineSubtool) => void
  onCircleSubtoolChange: (sub: CircleSubtool) => void
  onEllipseSubtoolChange: (sub: EllipseSubtool) => void
  onArcSubtoolChange: (sub: ArcSubtool) => void
  onArcAngleChange: (angle: number) => void
  onStyleChange: (style: DrawingStyle) => void
  onUpdate: (element: DrawingElement) => void
  onDelete: (id: string) => void
}

const updateStyle = (element: DrawingElement, style: Partial<DrawingStyle>): DrawingElement => ({
  ...element,
  style: {
    ...element.style,
    ...style,
  },
})

const elementTypeLabel: Record<DrawingElement['type'], string> = {
  line: '直线',
  arc: '圆弧',
  rectangle: '矩形',
  circle: '圆',
  ellipse: '椭圆',
  polyline: '多段线',
  axes: '坐标轴',
  point: '点',
}

const toolLabels: Record<Tool, string> = {
  select: '选择',
  line: '直线',
  arc: '圆弧',
  rectangle: '矩形',
  circle: '圆',
  ellipse: '椭圆',
  polyline: '多段线',
  axes: '坐标轴',
  point: '点',
  intersection: '交点',
}



export function PropertiesPanel({
  activeTool,
  lineSubtool,
  circleSubtool,
  ellipseSubtool,
  arcSubtool,
  arcAngle,
  currentStyle,
  selectedElement,
  onLineSubtoolChange,
  onCircleSubtoolChange,
  onEllipseSubtoolChange,
  onArcSubtoolChange,
  onArcAngleChange,
  onStyleChange,
  onUpdate,
  onDelete,
}: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <aside className="properties-panel">
        <div className="properties-header">
          <h2>{toolLabels[activeTool]} 设置</h2>
        </div>
        <div className="properties-panel-scroll">
          {activeTool === 'line' && (
            <label>
              绘制方式
              <select
                value={lineSubtool}
                onChange={(e) => onLineSubtoolChange(e.target.value as LineSubtool)}
              >
                <option value="twoPoints">两点</option>
                <option value="pointSlope">点斜</option>
              </select>
            </label>
          )}

          {activeTool === 'circle' && (
            <label>
              绘制方式
              <select
                value={circleSubtool}
                onChange={(e) => onCircleSubtoolChange(e.target.value as CircleSubtool)}
              >
                <option value="centerRadius">圆心+圆周点</option>
                <option value="centerRadiusValue">圆心+半径数值</option>
              </select>
            </label>
          )}

          {activeTool === 'ellipse' && (
            <label>
              绘制方式
              <select
                value={ellipseSubtool}
                onChange={(e) => onEllipseSubtoolChange(e.target.value as EllipseSubtool)}
              >
                <option value="centerRadii">中心+圆周点</option>
                <option value="centerRadiiValue">中心+半轴数值</option>
              </select>
            </label>
          )}

          {activeTool === 'arc' && (
            <>
              <label>
                绘制方式
                <select
                  value={arcSubtool}
                  onChange={(e) => onArcSubtoolChange(e.target.value as ArcSubtool)}
                >
                  <option value="sweepAngle">两点+扫过角</option>
                  <option value="centerRadiusAngles">圆心+半径+角度</option>
                </select>
              </label>
              {arcSubtool === 'sweepAngle' && (
                <label>
                  圆弧角度（°）— 从起点到终点的扫过角
                  <input
                    type="number"
                    min={-300}
                    max={300}
                    step={5}
                    value={arcAngle}
                    onChange={(e) => onArcAngleChange(Number(e.target.value))}
                  />
                </label>
              )}
              {arcSubtool === 'centerRadiusAngles' && (
                <div className="hint">
                  <p>点击画布设置圆心，然后在对话框中输入半径 r、起始角 α、终止角 β。</p>
                  <p className="hint">TikZ 语法：<code>arc[start angle=α, end angle=β, radius=r]</code></p>
                </div>
              )}
            </>
          )}

          {activeTool === 'select' && (
            <p className="hint">点击画布上的图形可选中并编辑属性。</p>
          )}

          {activeTool === 'intersection' && (
            <p className="hint">依次点击两个图元，系统将计算它们的交点并弹出命名对话框。</p>
          )}

          <hr />

          <p className="field-group-title">默认线条样式</p>

          <label>
            起点箭头
            <select
              value={currentStyle.startArrow}
              onChange={(e) => onStyleChange({ ...currentStyle, startArrow: e.target.value as ArrowHead })}
            >
              <option value="none">无</option>
              <option value="Latex">Latex</option>
              <option value="Stealth">Stealth</option>
              <option value="Triangle">Triangle</option>
            </select>
          </label>

          <label>
            终点箭头
            <select
              value={currentStyle.endArrow}
              onChange={(e) => onStyleChange({ ...currentStyle, endArrow: e.target.value as ArrowHead })}
            >
              <option value="none">无</option>
              <option value="Latex">Latex</option>
              <option value="Stealth">Stealth</option>
              <option value="Triangle">Triangle</option>
            </select>
          </label>

          <label>
            线型
            <select
              value={currentStyle.lineStyle}
              onChange={(e) => onStyleChange({ ...currentStyle, lineStyle: e.target.value as LineStyle })}
            >
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
              <option value="dash dot">点划线</option>
            </select>
          </label>

          <label>
            颜色
            <ColorPicker
              color={currentStyle.drawColor}
              variant="presets"
              onChange={(drawColor) => onStyleChange({ ...currentStyle, drawColor })}
            />
          </label>

          <label>
            线宽：{currentStyle.lineWidth}pt
            <input
              type="range"
              min={0.2}
              max={6}
              step={0.1}
              value={currentStyle.lineWidth}
              onChange={(e) => onStyleChange({ ...currentStyle, lineWidth: Number(e.target.value) })}
            />
          </label>

          <label>
            line cap
            <select
              value={currentStyle.lineCap}
              onChange={(e) => onStyleChange({ ...currentStyle, lineCap: e.target.value as LineCap })}
            >
              <option value="butt">butt</option>
              <option value="round">round</option>
              <option value="rect">rect</option>
            </select>
          </label>

          <label>
            line join
            <select
              value={currentStyle.lineJoin}
              onChange={(e) => onStyleChange({ ...currentStyle, lineJoin: e.target.value as LineJoin })}
            >
              <option value="miter">miter</option>
              <option value="round">round</option>
              <option value="bevel">bevel</option>
            </select>
          </label>

          <label>
            opacity：{currentStyle.opacity}
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={currentStyle.opacity}
              onChange={(e) => onStyleChange({ ...currentStyle, opacity: Number(e.target.value) })}
            />
          </label>
        </div>
      </aside>
    )
  }

  return (
    <aside className="properties-panel">
      <div className="properties-header">
        <h2>属性</h2>
      </div>
      <div className="properties-panel-scroll">
      <p className="element-id">{elementTypeLabel[selectedElement.type]} · {selectedElement.id}</p>

      <label>
        起点箭头
        <select
          value={selectedElement.style.startArrow}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { startArrow: event.target.value as ArrowHead }))}
        >
          <option value="none">无</option>
          <option value="Latex">Latex</option>
          <option value="Stealth">Stealth</option>
          <option value="Triangle">Triangle</option>
        </select>
      </label>

      <label>
        终点箭头
        <select
          value={selectedElement.style.endArrow}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { endArrow: event.target.value as ArrowHead }))}
        >
          <option value="none">无</option>
          <option value="Latex">Latex</option>
          <option value="Stealth">Stealth</option>
          <option value="Triangle">Triangle</option>
        </select>
      </label>

      <label>
        线型
        <select
          value={selectedElement.style.lineStyle}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { lineStyle: event.target.value as LineStyle }))}
        >
          <option value="solid">实线</option>
          <option value="dashed">虚线</option>
          <option value="dotted">点线</option>
          <option value="dash dot">点划线</option>
        </select>
      </label>

      <label>
        颜色
        <ColorPicker
          color={selectedElement.style.drawColor}
          variant="presets"
          onChange={(drawColor) => onUpdate(updateStyle(selectedElement, { drawColor }))}
        />
      </label>

      <label>
        线宽：{selectedElement.style.lineWidth}pt
        <input
          max="6"
          min="0.2"
          step="0.1"
          type="range"
          value={selectedElement.style.lineWidth}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { lineWidth: Number(event.target.value) }))}
        />
      </label>

      <label>
        line cap
        <select
          value={selectedElement.style.lineCap}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { lineCap: event.target.value as LineCap }))}
        >
          <option value="butt">butt</option>
          <option value="round">round</option>
          <option value="rect">rect</option>
        </select>
      </label>

      <label>
        line join
        <select
          value={selectedElement.style.lineJoin}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { lineJoin: event.target.value as LineJoin }))}
        >
          <option value="miter">miter</option>
          <option value="round">round</option>
          <option value="bevel">bevel</option>
        </select>
      </label>

      <label>
        opacity：{selectedElement.style.opacity}
        <input
          max="1"
          min="0.1"
          step="0.05"
          type="range"
          value={selectedElement.style.opacity}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { opacity: Number(event.target.value) }))}
        />
      </label>

      {selectedElement.type === 'arc' && (
        <label>
          圆弧角度
          <input
            max="300"
            min="-300"
            step="5"
            type="number"
            value={selectedElement.sweepAngle}
            onChange={(event) => onUpdate({ ...selectedElement, sweepAngle: Number(event.target.value) })}
          />
        </label>
      )}

      {selectedElement.type === 'axes' && (
        <AxesTabs key={selectedElement.id} element={selectedElement} onUpdate={onUpdate} />
      )}

      <button className="danger" type="button" onClick={() => onDelete(selectedElement.id)}>
        删除图形
      </button>
      </div>
    </aside>
  )
}
