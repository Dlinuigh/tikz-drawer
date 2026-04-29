import type { ArrowStyle, DrawingStyle, LineStyle, StrokeColor, Tool } from '../types/drawing'

type ToolbarProps = {
  activeTool: Tool
  style: DrawingStyle
  arcAngle: number
  onToolChange: (tool: Tool) => void
  onStyleChange: (style: DrawingStyle) => void
  onArcAngleChange: (angle: number) => void
  onClear: () => void
}

const tools: Array<{ value: Tool; label: string }> = [
  { value: 'select', label: '选择' },
  { value: 'line', label: '直线' },
  { value: 'arc', label: '圆弧' },
]

const arrows: Array<{ value: ArrowStyle; label: string }> = [
  { value: 'none', label: '无箭头' },
  { value: 'end', label: '末端箭头' },
  { value: 'start', label: '起点箭头' },
  { value: 'both', label: '双向箭头' },
]

const lineStyles: Array<{ value: LineStyle; label: string }> = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
]

const colors: Array<{ value: StrokeColor; label: string }> = [
  { value: 'black', label: '黑' },
  { value: 'red', label: '红' },
  { value: 'blue', label: '蓝' },
  { value: 'green', label: '绿' },
  { value: 'orange', label: '橙' },
  { value: 'purple', label: '紫' },
]

export function Toolbar({
  activeTool,
  style,
  arcAngle,
  onToolChange,
  onStyleChange,
  onArcAngleChange,
  onClear,
}: ToolbarProps) {
  return (
    <aside className="toolbar">
      <section>
        <h2>绘图工具</h2>
        <div className="button-grid">
          {tools.map((tool) => (
            <button
              key={tool.value}
              className={activeTool === tool.value ? 'active' : ''}
              type="button"
              onClick={() => onToolChange(tool.value)}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>线条样式</h2>
        <label>
          箭头
          <select
            value={style.arrow}
            onChange={(event) => onStyleChange({ ...style, arrow: event.target.value as ArrowStyle })}
          >
            {arrows.map((arrow) => (
              <option key={arrow.value} value={arrow.value}>
                {arrow.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          线型
          <select
            value={style.lineStyle}
            onChange={(event) => onStyleChange({ ...style, lineStyle: event.target.value as LineStyle })}
          >
            {lineStyles.map((lineStyle) => (
              <option key={lineStyle.value} value={lineStyle.value}>
                {lineStyle.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          颜色
          <select
            value={style.strokeColor}
            onChange={(event) => onStyleChange({ ...style, strokeColor: event.target.value as StrokeColor })}
          >
            {colors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          线宽
          <input
            max="8"
            min="1"
            type="range"
            value={style.strokeWidth}
            onChange={(event) => onStyleChange({ ...style, strokeWidth: Number(event.target.value) })}
          />
        </label>
      </section>

      <section>
        <h2>圆弧</h2>
        <label>
          给定角度
          <input
            max="300"
            min="-300"
            step="5"
            type="number"
            value={arcAngle}
            onChange={(event) => onArcAngleChange(Number(event.target.value))}
          />
        </label>
        <p className="hint">选择圆弧后，点击起点和终点即可按该角度生成。</p>
      </section>

      <button className="danger" type="button" onClick={onClear}>
        清空画布
      </button>
    </aside>
  )
}
