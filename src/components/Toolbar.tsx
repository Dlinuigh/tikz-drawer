import { useEffect, useRef, useState } from 'react'
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

const primaryTools: Array<{ value: Tool; label: string; submenu?: 'line' | 'arc' }> = [
  { value: 'select', label: '选择' },
  { value: 'line', label: '直线', submenu: 'line' },
  { value: 'arc', label: '圆弧', submenu: 'arc' },
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
  const [openSubmenu, setOpenSubmenu] = useState<'line' | 'arc' | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) {
        setOpenSubmenu(null)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenSubmenu(null)
        setShowStylePanel(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handlePrimaryClick = (tool: Tool, submenu?: 'line' | 'arc') => {
    if (submenu === 'line') {
      onToolChange('line')
      setOpenSubmenu((prev) => (prev === 'line' ? null : 'line'))
      return
    }
    if (submenu === 'arc') {
      onToolChange('arc')
      setOpenSubmenu((prev) => (prev === 'arc' ? null : 'arc'))
      return
    }
    setOpenSubmenu(null)
    onToolChange(tool)
  }

  return (
    <aside className="toolbar" ref={toolbarRef}>
      <div className="toolbar-tools">
        {primaryTools.map((tool) => (
          <button
            key={tool.value}
            className={`tool-btn ${activeTool === tool.value ? 'active' : ''}`}
            type="button"
            title={tool.label}
            onClick={() => handlePrimaryClick(tool.value, tool.submenu)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {openSubmenu === 'line' && (
        <div className="toolbar-floating-menu toolbar-floating-menu-line" role="menu">
          {lineSubtools.map((sub) => (
            <button
              key={sub.value}
              className={`tool-menu-item ${lineSubtool === sub.value ? 'active' : ''}`}
              type="button"
              onClick={() => {
                onLineSubtoolChange(sub.value)
                setOpenSubmenu(null)
              }}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {openSubmenu === 'arc' && (
        <div className="toolbar-floating-menu toolbar-floating-menu-arc toolbar-floating-menu-wide" role="menu">
          <label className="toolbar-arc-menu-label">
            圆弧角度（°）
            <input
              className="arc-angle-input"
              max="300"
              min="-300"
              step="5"
              type="number"
              value={arcAngle}
              onChange={(event) => onArcAngleChange(Number(event.target.value))}
            />
          </label>
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

        <button className="tool-btn danger" type="button" title="清空画布" onClick={onClear}>
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
