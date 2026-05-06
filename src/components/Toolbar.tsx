import { useState } from 'react'
import { FloatingStylePanel } from './FloatingStylePanel'
import type { DrawingStyle, LineSubtool, Tool } from '../types/drawing'

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
  { value: 'pointSlope', label: '点斜' },
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
  const [showStylePanel, setShowStylePanel] = useState(false)

  return (
    <aside className="toolbar">
      <div className="toolbar-tools">
        {primaryTools.map((tool) => (
          <button
            key={tool.value}
            className={`tool-btn ${activeTool === tool.value ? 'active' : ''}`}
            type="button"
            title={tool.label}
            onClick={() => onToolChange(tool.value)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {activeTool === 'line' && (
        <div className="toolbar-subtools">
          {lineSubtools.map((sub) => (
            <button
              key={sub.value}
              className={`tool-btn sub ${lineSubtool === sub.value ? 'active' : ''}`}
              type="button"
              onClick={() => onLineSubtoolChange(sub.value)}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      <div className="toolbar-actions">
        <button
          className={`tool-btn ${showStylePanel ? 'active' : ''}`}
          type="button"
          title="线条样式"
          onClick={() => setShowStylePanel(!showStylePanel)}
        >
          样式
        </button>

        {activeTool === 'arc' && (
          <div className="toolbar-arc-angle">
            <input
              className="arc-angle-input"
              max="300"
              min="-300"
              step="5"
              type="number"
              title="圆弧角度"
              value={arcAngle}
              onChange={(event) => onArcAngleChange(Number(event.target.value))}
            />
            <span className="arc-angle-unit">°</span>
          </div>
        )}

        <button
          className="tool-btn danger"
          type="button"
          title="清空画布"
          onClick={onClear}
        >
          清空
        </button>
      </div>

      {showStylePanel && (
        <FloatingStylePanel
          style={style}
          onStyleChange={onStyleChange}
          onClose={() => setShowStylePanel(false)}
        />
      )}
    </aside>
  )
}
