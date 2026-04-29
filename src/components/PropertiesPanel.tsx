import { ColorPicker } from './ColorPicker'
import type { ArrowHead, DrawingElement, DrawingStyle, LineCap, LineJoin, LineStyle } from '../types/drawing'

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

      <button className="danger" type="button" onClick={() => onDelete(selectedElement.id)}>
        删除图形
      </button>
    </aside>
  )
}
