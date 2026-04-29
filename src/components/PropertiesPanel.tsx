import type { ArrowStyle, DrawingElement, DrawingStyle, LineStyle, StrokeColor } from '../types/drawing'

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
      <p className="element-id">{selectedElement.type === 'line' ? '直线' : '圆弧'} · {selectedElement.id}</p>

      <label>
        箭头
        <select
          value={selectedElement.style.arrow}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { arrow: event.target.value as ArrowStyle }))}
        >
          <option value="none">无箭头</option>
          <option value="end">末端箭头</option>
          <option value="start">起点箭头</option>
          <option value="both">双向箭头</option>
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
        </select>
      </label>

      <label>
        颜色
        <select
          value={selectedElement.style.strokeColor}
          onChange={(event) =>
            onUpdate(updateStyle(selectedElement, { strokeColor: event.target.value as StrokeColor }))
          }
        >
          <option value="black">黑</option>
          <option value="red">红</option>
          <option value="blue">蓝</option>
          <option value="green">绿</option>
          <option value="orange">橙</option>
          <option value="purple">紫</option>
        </select>
      </label>

      <label>
        线宽
        <input
          max="8"
          min="1"
          type="range"
          value={selectedElement.style.strokeWidth}
          onChange={(event) => onUpdate(updateStyle(selectedElement, { strokeWidth: Number(event.target.value) }))}
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
