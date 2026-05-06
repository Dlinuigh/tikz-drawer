import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { formatNumber } from '../lib/geometry'
import { parseFlexibleNumber } from '../lib/parseNumber'
import type {
  AxisNameTikzPlacement,
  AxisTickMark,
  AxesElement,
  ArrowHead,
  DrawingElement,
  DrawingStyle,
  LineCap,
  LineJoin,
  LineStyle,
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
  selectedElement: DrawingElement | null
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
}

export function PropertiesPanel({ selectedElement, onUpdate, onDelete }: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <aside className="properties-panel">
        <h2>属性</h2>
        <p className="hint">用选择工具点击图形后，可以在这里修改箭头、线型、颜色和圆弧角度。</p>
      </aside>
    )
  }

  return (
    <aside className="properties-panel">
      <h2>属性</h2>
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
    </aside>
  )
}
