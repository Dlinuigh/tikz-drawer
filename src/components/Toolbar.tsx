import { ColorPicker } from './ColorPicker'
import type { ArrowHead, DrawingStyle, LineCap, LineJoin, LineStyle, LineSubtool, Tool } from '../types/drawing'

type ToolbarProps = {
  activeTool: Tool
  lineSubtool: LineSubtool
  style: DrawingStyle
  arcAngle: number
  onToolChange: (tool: Tool) => void
  onLineSubtoolChange: (sub: LineSubtool) => void
  onStyleChange: (style: DrawingStyle) => void
  onArcAngleChange: (angle: number) => void
  onClear: () => void
}

const primaryTools: Array<{ value: Tool; label: string }> = [
  { value: 'select', label: '选择' },
  { value: 'line', label: '直线' },
  { value: 'arc', label: '圆弧' },
  { value: 'rectangle', label: '矩形' },
  { value: 'circle', label: '圆' },
  { value: 'ellipse', label: '椭圆' },
  { value: 'polyline', label: '多段线' },
  { value: 'axes', label: '坐标轴' },
]

const lineSubtools: Array<{ value: LineSubtool; label: string }> = [
  { value: 'twoPoints', label: '两点' },
  { value: 'pointSlope', label: '点与斜率' },
]

const arrows: Array<{ value: ArrowHead; label: string }> = [
  { value: 'none', label: '无' },
  { value: 'Latex', label: 'Latex' },
  { value: 'Stealth', label: 'Stealth' },
  { value: 'Triangle', label: 'Triangle' },
]

const lineStyles: Array<{ value: LineStyle; label: string }> = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
  { value: 'dash dot', label: '点划线' },
]

const lineCaps: Array<{ value: LineCap; label: string }> = [
  { value: 'butt', label: 'butt' },
  { value: 'round', label: 'round' },
  { value: 'rect', label: 'rect' },
]

const lineJoins: Array<{ value: LineJoin; label: string }> = [
  { value: 'miter', label: 'miter' },
  { value: 'round', label: 'round' },
  { value: 'bevel', label: 'bevel' },
]

export function Toolbar({
  activeTool,
  lineSubtool,
  style,
  arcAngle,
  onToolChange,
  onLineSubtoolChange,
  onStyleChange,
  onArcAngleChange,
  onClear,
}: ToolbarProps) {
  return (
    <aside className="toolbar">
      <section>
        <h2>绘图工具</h2>
        <div className="toolbar-tool-columns">
          <div className="toolbar-primary-col">
            {primaryTools.map((tool) => (
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
          {activeTool === 'line' && (
            <div className="toolbar-secondary-col" aria-label="直线方式">
              {lineSubtools.map((sub) => (
                <button
                  key={sub.value}
                  className={lineSubtool === sub.value ? 'active' : ''}
                  type="button"
                  onClick={() => onLineSubtoolChange(sub.value)}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2>线条样式</h2>
        <label>
          起点箭头
          <select
            value={style.startArrow}
            onChange={(event) => onStyleChange({ ...style, startArrow: event.target.value as ArrowHead })}
          >
            {arrows.map((arrow) => (
              <option key={arrow.value} value={arrow.value}>
                {arrow.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          终点箭头
          <select
            value={style.endArrow}
            onChange={(event) => onStyleChange({ ...style, endArrow: event.target.value as ArrowHead })}
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
          <ColorPicker color={style.drawColor} onChange={(drawColor) => onStyleChange({ ...style, drawColor })} />
        </label>

        <label>
          线宽：{style.lineWidth}pt
          <input
            max="6"
            min="0.2"
            step="0.1"
            type="range"
            value={style.lineWidth}
            onChange={(event) => onStyleChange({ ...style, lineWidth: Number(event.target.value) })}
          />
        </label>

        <label>
          line cap
          <select
            value={style.lineCap}
            onChange={(event) => onStyleChange({ ...style, lineCap: event.target.value as LineCap })}
          >
            {lineCaps.map((lineCap) => (
              <option key={lineCap.value} value={lineCap.value}>
                {lineCap.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          line join
          <select
            value={style.lineJoin}
            onChange={(event) => onStyleChange({ ...style, lineJoin: event.target.value as LineJoin })}
          >
            {lineJoins.map((lineJoin) => (
              <option key={lineJoin.value} value={lineJoin.value}>
                {lineJoin.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          opacity：{style.opacity}
          <input
            max="1"
            min="0.1"
            step="0.05"
            type="range"
            value={style.opacity}
            onChange={(event) => onStyleChange({ ...style, opacity: Number(event.target.value) })}
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
