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

const primaryTools: Array<{ value: Tool; label: string; hint: string; submenu?: SubmenuKey }> = [
  { value: 'select', label: '选择', hint: '点选图元，Shift 加选；空白拖拽框选。' },
  { value: 'point', label: '点', hint: '放置坐标点。画布点击时按住 Ctrl 可不吸附网格。' },
  { value: 'line', label: '直线', hint: '两点画线；子菜单可选点斜式。Ctrl：取原始坐标。', submenu: 'line' },
  { value: 'rectangle', label: '矩形', hint: '对角两点；子菜单设新建时填充。Ctrl：不吸附。', submenu: 'closedFill' },
  { value: 'circle', label: '圆', hint: '圆心+圆周点或圆心+半径数值。Ctrl：不吸附。', submenu: 'circle' },
  { value: 'ellipse', label: '椭圆', hint: '中心+形状点或中心+半轴数值。Ctrl：不吸附。', submenu: 'ellipse' },
  { value: 'polyline', label: '多段线', hint: '逐点添加，Esc 结束。Ctrl：各点不吸附。' },
  { value: 'polygon', label: '多边形', hint: '逐点围成封闭多边形。Ctrl：不吸附。', submenu: 'closedFill' },
  { value: 'arc', label: '圆弧', hint: '圆/椭圆弧子菜单；扫角或圆心模式。Ctrl：不吸附。', submenu: 'arc' },
  { value: 'sector', label: '扇形', hint: '依子模式多次点击。Ctrl：不吸附。', submenu: 'sector' },
  { value: 'regularPolygon', label: '正多边形', hint: '中心与第一个顶点，再在对话框设边数。', submenu: 'closedFill' },
  { value: 'axes', label: '坐标轴', hint: '首次创建时弹出范围；原点为 (0,0)。' },
  { value: 'intersection', label: '交点', hint: '依次点击两个图元计算交点并命名。' },
  { value: 'fillPick', label: '填色', hint: '点击封闭区域填充当前样式。' },
  { value: 'conic', label: '圆锥曲线', hint: '在对话框中参数化圆锥曲线。' },
  { value: 'plot', label: '函数图', hint: '显式/隐式采样绘图；可选生成零点与极值点。' },
  { value: 'foreach', label: 'Foreach', hint: '写入 TikZ \\foreach；画布仅简单预览。' },
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

const arcSubtools: Array<{ value: ArcSubtool; label: string; title: string }> = [
  { value: 'sweepAngle', label: '两点+扫过角', title: '起点、终点，扫过角由属性栏/选中圆弧调节。' },
  { value: 'centerRadiusAngles', label: '圆心+半径+角度', title: '先点圆心，再在对话框输入半径与起止角（度）。' },
  {
    value: 'ellipseCenterRadiiAngles',
    label: '椭圆弧',
    title: '先点椭圆弧所在椭圆的中心，再输入 x/y 半轴与起止角、轴旋转。',
  },
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
            title={tool.hint}
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
              title={sub.title}
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
