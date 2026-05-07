import { useEffect, useRef, useState } from 'react'
import type {
  ArcSubtool,
  CircleSubtool,
  ClosedShapeFillSubtool,
  EllipseSubtool,
  LineSubtool,
  SectorShapeSubtool,
  Tool,
} from '../types/drawing'

type ToolbarProps = {
  activeTool: Tool
  lineSubtool: LineSubtool
  circleSubtool: CircleSubtool
  ellipseSubtool: EllipseSubtool
  arcSubtool: ArcSubtool
  closedShapeFillSubtool: ClosedShapeFillSubtool
  sectorShapeSubtool: SectorShapeSubtool
  onToolChange: (tool: Tool) => void
  onLineSubtoolChange: (sub: LineSubtool) => void
  onCircleSubtoolChange: (sub: CircleSubtool) => void
  onEllipseSubtoolChange: (sub: EllipseSubtool) => void
  onArcSubtoolChange: (sub: ArcSubtool) => void
  onClosedShapeFillSubtoolChange: (sub: ClosedShapeFillSubtool) => void
  onSectorShapeSubtoolChange: (sub: SectorShapeSubtool) => void
}

type SubmenuKey = 'line' | 'arc' | 'circle' | 'ellipse' | 'closedFill' | 'sector'

const primaryTools: Array<{ value: Tool; label: string; submenu?: SubmenuKey }> = [
  { value: 'select', label: '选择' },
  { value: 'point', label: '点' },
  { value: 'line', label: '直线', submenu: 'line' },
  { value: 'rectangle', label: '矩形', submenu: 'closedFill' },
  { value: 'circle', label: '圆', submenu: 'circle' },
  { value: 'ellipse', label: '椭圆', submenu: 'ellipse' },
  { value: 'polyline', label: '多段线' },
  { value: 'polygon', label: '多边形', submenu: 'closedFill' },
  { value: 'arc', label: '圆弧', submenu: 'arc' },
  { value: 'sector', label: '扇形', submenu: 'sector' },
  { value: 'regularPolygon', label: '正多边形', submenu: 'closedFill' },
  { value: 'axes', label: '坐标轴' },
  { value: 'intersection', label: '交点' },
  { value: 'fillPick', label: '填色' },
  { value: 'conic', label: '圆锥曲线' },
  { value: 'plot', label: '函数图' },
  { value: 'foreach', label: 'Foreach' },
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

function ClosedFillButtons({
  closedShapeFillSubtool,
  onClosedShapeFillSubtoolChange,
}: {
  closedShapeFillSubtool: ClosedShapeFillSubtool
  onClosedShapeFillSubtoolChange: (sub: ClosedShapeFillSubtool) => void
}) {
  return (
    <>
      <div className="toolbar-menu-section-title">新建时填充</div>
      <button
        className={`tool-menu-item ${closedShapeFillSubtool === 'none' ? 'active' : ''}`}
        type="button"
        onClick={() => onClosedShapeFillSubtoolChange('none')}
      >
        无填充
      </button>
      <button
        className={`tool-menu-item ${closedShapeFillSubtool === 'solid' ? 'active' : ''}`}
        type="button"
        onClick={() => onClosedShapeFillSubtoolChange('solid')}
      >
        浅色实心填充
      </button>
    </>
  )
}

export function Toolbar({
  activeTool,
  lineSubtool,
  circleSubtool,
  ellipseSubtool,
  arcSubtool,
  closedShapeFillSubtool,
  sectorShapeSubtool,
  onToolChange,
  onLineSubtoolChange,
  onCircleSubtoolChange,
  onEllipseSubtoolChange,
  onArcSubtoolChange,
  onClosedShapeFillSubtoolChange,
  onSectorShapeSubtoolChange,
}: ToolbarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<SubmenuKey | null>(null)
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

  const handlePrimaryClick = (tool: Tool, submenu?: SubmenuKey) => {
    if (
      submenu === 'line' ||
      submenu === 'arc' ||
      submenu === 'circle' ||
      submenu === 'ellipse' ||
      submenu === 'closedFill' ||
      submenu === 'sector'
    ) {
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
        <div className="toolbar-floating-menu toolbar-floating-menu-circle toolbar-floating-menu-wide" role="menu">
          <div className="toolbar-menu-section-title">画法</div>
          {circleSubtools.map((sub) => (
            <button
              key={sub.value}
              className={`tool-menu-item ${circleSubtool === sub.value ? 'active' : ''}`}
              type="button"
              onClick={() => {
                onCircleSubtoolChange(sub.value)
              }}
            >
              {sub.label}
            </button>
          ))}
          <ClosedFillButtons
            closedShapeFillSubtool={closedShapeFillSubtool}
            onClosedShapeFillSubtoolChange={onClosedShapeFillSubtoolChange}
          />
        </div>
      )}

      {openSubmenu === 'ellipse' && (
        <div className="toolbar-floating-menu toolbar-floating-menu-ellipse toolbar-floating-menu-wide" role="menu">
          <div className="toolbar-menu-section-title">画法</div>
          {ellipseSubtools.map((sub) => (
            <button
              key={sub.value}
              className={`tool-menu-item ${ellipseSubtool === sub.value ? 'active' : ''}`}
              type="button"
              onClick={() => {
                onEllipseSubtoolChange(sub.value)
              }}
            >
              {sub.label}
            </button>
          ))}
          <ClosedFillButtons
            closedShapeFillSubtool={closedShapeFillSubtool}
            onClosedShapeFillSubtoolChange={onClosedShapeFillSubtoolChange}
          />
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

      {openSubmenu === 'closedFill' && (
        <div
          className={`toolbar-floating-menu toolbar-floating-menu-wide ${
            activeTool === 'rectangle'
              ? 'toolbar-floating-menu-rectangle'
              : activeTool === 'polygon'
                ? 'toolbar-floating-menu-polygon'
                : 'toolbar-floating-menu-regularPolygon'
          }`}
          role="menu"
        >
          <div className="toolbar-menu-section-title">画法</div>
          <div className="toolbar-menu-hint">
            {activeTool === 'rectangle' && '对角两点拖出轴对齐矩形。'}
            {activeTool === 'polygon' && '逐点点击，Esc 完成闭合。'}
            {activeTool === 'regularPolygon' && '先圆心再顶点定半径，边数在弹窗中设置。'}
          </div>
          <ClosedFillButtons
            closedShapeFillSubtool={closedShapeFillSubtool}
            onClosedShapeFillSubtoolChange={onClosedShapeFillSubtoolChange}
          />
        </div>
      )}

      {openSubmenu === 'sector' && (
        <div
          className="toolbar-floating-menu toolbar-floating-menu-sector toolbar-floating-menu-wide"
          role="menu"
        >
          <div className="toolbar-menu-section-title">形状</div>
          <button
            className={`tool-menu-item ${sectorShapeSubtool === 'convexPie' ? 'active' : ''}`}
            type="button"
            onClick={() => onSectorShapeSubtoolChange('convexPie')}
          >
            外凸扇形（两半径+弧）
          </button>
          <button
            className={`tool-menu-item ${sectorShapeSubtool === 'convexSegment' ? 'active' : ''}`}
            type="button"
            onClick={() => onSectorShapeSubtoolChange('convexSegment')}
          >
            外凸弓形（弦+较小弧）
          </button>
          <button
            className={`tool-menu-item ${sectorShapeSubtool === 'concaveBracket' ? 'active' : ''}`}
            type="button"
            onClick={() => onSectorShapeSubtoolChange('concaveBracket')}
          >
            凹弧 ⟨（圆心侧）
          </button>
          <button
            className={`tool-menu-item ${sectorShapeSubtool === 'majorArcPie' ? 'active' : ''}`}
            type="button"
            onClick={() => onSectorShapeSubtoolChange('majorArcPie')}
          >
            对称弧楔（相对凹弧）
          </button>
          <button
            className={`tool-menu-item ${sectorShapeSubtool === 'iceCream' ? 'active' : ''}`}
            type="button"
            onClick={() => onSectorShapeSubtoolChange('iceCream')}
          >
            冰激凌（顶点→母线→顶角）
          </button>
          <ClosedFillButtons
            closedShapeFillSubtool={closedShapeFillSubtool}
            onClosedShapeFillSubtoolChange={onClosedShapeFillSubtoolChange}
          />
        </div>
      )}
    </aside>
  )
}
