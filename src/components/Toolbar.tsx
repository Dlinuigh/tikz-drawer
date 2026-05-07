import { useEffect, useRef, useState } from 'react'
import type { ArcSubtool, CircleSubtool, EllipseSubtool, LineSubtool, Tool } from '../types/drawing'

type ToolbarProps = {
  activeTool: Tool
  lineSubtool: LineSubtool
  circleSubtool: CircleSubtool
  ellipseSubtool: EllipseSubtool
  arcSubtool: ArcSubtool
  onToolChange: (tool: Tool) => void
  onLineSubtoolChange: (sub: LineSubtool) => void
  onCircleSubtoolChange: (sub: CircleSubtool) => void
  onEllipseSubtoolChange: (sub: EllipseSubtool) => void
  onArcSubtoolChange: (sub: ArcSubtool) => void
}

const primaryTools: Array<{ value: Tool; label: string; submenu?: 'line' | 'arc' | 'circle' | 'ellipse' }> = [
  { value: 'select', label: '选择' },
  { value: 'line', label: '直线', submenu: 'line' },
  { value: 'arc', label: '圆弧', submenu: 'arc' },
  { value: 'rectangle', label: '矩形' },
  { value: 'circle', label: '圆', submenu: 'circle' },
  { value: 'ellipse', label: '椭圆', submenu: 'ellipse' },
  { value: 'polyline', label: '多段线' },
  { value: 'polygon', label: '多边形' },
  { value: 'sector', label: '扇形' },
  { value: 'regularPolygon', label: '正多边形' },
  { value: 'conic', label: '圆锥曲线' },
  { value: 'plot', label: '函数图' },
  { value: 'foreach', label: 'Foreach' },
  { value: 'fillPick', label: '填色' },
  { value: 'axes', label: '坐标轴' },
  { value: 'point', label: '点' },
  { value: 'intersection', label: '交点' },
]

const lineSubtools: Array<{ value: LineSubtool; label: string }> = [
  { value: 'twoPoints', label: '两点' },
  { value: 'pointSlope', label: '点斜' },
]

const circleSubtools: Array<{ value: CircleSubtool; label: string }> = [
  { value: 'centerRadius', label: '圆心+圆周点' },
  { value: 'centerRadiusValue', label: '圆心+半径数值' },
]

const ellipseSubtools: Array<{ value: EllipseSubtool; label: string }> = [
  { value: 'centerRadii', label: '中心+圆周点' },
  { value: 'centerRadiiValue', label: '中心+半轴数值' },
]

const arcSubtools: Array<{ value: ArcSubtool; label: string }> = [
  { value: 'sweepAngle', label: '两点+扫过角' },
  { value: 'centerRadiusAngles', label: '圆心+半径+角度' },
]

export function Toolbar({
  activeTool,
  lineSubtool,
  circleSubtool,
  ellipseSubtool,
  arcSubtool,
  onToolChange,
  onLineSubtoolChange,
  onCircleSubtoolChange,
  onEllipseSubtoolChange,
  onArcSubtoolChange,
}: ToolbarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<'line' | 'arc' | 'circle' | 'ellipse' | null>(null)
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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handlePrimaryClick = (tool: Tool, submenu?: 'line' | 'arc' | 'circle' | 'ellipse') => {
    if (submenu === 'line' || submenu === 'arc' || submenu === 'circle' || submenu === 'ellipse') {
      onToolChange(tool)
      setOpenSubmenu((prev) => (prev === submenu ? null : submenu))
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

      {openSubmenu === 'circle' && (
        <div className="toolbar-floating-menu toolbar-floating-menu-circle" role="menu">
          {circleSubtools.map((sub) => (
            <button
              key={sub.value}
              className={`tool-menu-item ${circleSubtool === sub.value ? 'active' : ''}`}
              type="button"
              onClick={() => {
                onCircleSubtoolChange(sub.value)
                setOpenSubmenu(null)
              }}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {openSubmenu === 'ellipse' && (
        <div className="toolbar-floating-menu toolbar-floating-menu-ellipse" role="menu">
          {ellipseSubtools.map((sub) => (
            <button
              key={sub.value}
              className={`tool-menu-item ${ellipseSubtool === sub.value ? 'active' : ''}`}
              type="button"
              onClick={() => {
                onEllipseSubtoolChange(sub.value)
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
          {arcSubtools.map((sub) => (
            <button
              key={sub.value}
              className={`tool-menu-item ${arcSubtool === sub.value ? 'active' : ''}`}
              type="button"
              onClick={() => {
                onArcSubtoolChange(sub.value)
                setOpenSubmenu(null)
              }}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* 清空已移至菜单栏 File > New Canvas */}
    </aside>
  )
}
