import { useState } from 'react'
import { parseFlexibleNumber } from '../lib/parseNumber'
import type {
  ConicCurveElement,
  ConicKind,
  FunctionPlotElement,
  HyperbolaBranch,
  PlotCoordinateMode,
  Point,
  TikzForeachElement,
} from '../types/drawing'

export type AxesBoundsPayload = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  createX: boolean
  createY: boolean
}

type AxesBoundsModalProps = {
  open: boolean
  origin: Point | null
  onConfirm: (bounds: AxesBoundsPayload) => void
  onCancel: () => void
}

function AxesBoundsForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: AxesBoundsModalProps['onConfirm']
  onCancel: () => void
}) {
  const [xMin, setXMin] = useState('-3')
  const [xMax, setXMax] = useState('3')
  const [yMin, setYMin] = useState('-3')
  const [yMax, setYMax] = useState('3')
  const [createX, setCreateX] = useState(true)
  const [createY, setCreateY] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!createX && !createY) {
      setError('请至少勾选创建 x 轴或 y 轴之一。')
      return
    }
    const xm = parseFlexibleNumber(xMin)
    const xx = parseFlexibleNumber(xMax)
    const ym = parseFlexibleNumber(yMin)
    const yx = parseFlexibleNumber(yMax)
    if (createX && (Number.isNaN(xm) || Number.isNaN(xx))) {
      setError('请输入有效的数字。')
      return
    }
    if (createY && (Number.isNaN(ym) || Number.isNaN(yx))) {
      setError('请输入有效的数字。')
      return
    }
    if (createX && xm >= xx) {
      setError('要求 x 下限 < x 上限。')
      return
    }
    if (createY && ym >= yx) {
      setError('要求 y 下限 < y 上限。')
      return
    }
    onConfirm({
      xMin: xm,
      xMax: xx,
      yMin: ym,
      yMax: yx,
      createX,
      createY,
    })
  }

  return (
    <div className="modal-panel" role="dialog" aria-labelledby="axes-modal-title" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="axes-modal-title">坐标轴范围</h3>
      <p className="hint">
        原点固定为 (0, 0)（TikZ）。勾选要创建的轴（可仅 x、仅 y 或两根）；上下限可写分数，如 <code>2/3</code>、<code>-1/5</code>。
      </p>
      <label className="checkbox-row">
        <input checked={createX} type="checkbox" onChange={(e) => setCreateX(e.target.checked)} />
        创建 x 轴（水平）
      </label>
      <label className="checkbox-row">
        <input checked={createY} type="checkbox" onChange={(e) => setCreateY(e.target.checked)} />
        创建 y 轴（竖直）
      </label>
      <label>
        x 下限
        <input value={xMin} onChange={(e) => setXMin(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        x 上限
        <input value={xMax} onChange={(e) => setXMax(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        y 下限
        <input value={yMin} onChange={(e) => setYMin(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        y 上限
        <input value={yMax} onChange={(e) => setYMax(e.target.value)} type="text" inputMode="decimal" />
      </label>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="primary" onClick={submit}>
          确定
        </button>
      </div>
    </div>
  )
}

export function AxesBoundsModal({ open, origin, onConfirm, onCancel }: AxesBoundsModalProps) {
  if (!open || !origin) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <AxesBoundsForm key="axes-bounds" onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  )
}

type LineSlopeModalProps = {
  open: boolean
  anchor: Point | null
  onConfirm: (payload: { slope: number; x1: number; x2: number }) => void
  onCancel: () => void
}

function LineSlopeForm({
  anchor,
  onConfirm,
  onCancel,
}: {
  anchor: Point
  onConfirm: LineSlopeModalProps['onConfirm']
  onCancel: () => void
}) {
  const [slope, setSlope] = useState('0')
  const [x1, setX1] = useState('-3')
  const [x2, setX2] = useState('3')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const m = parseFlexibleNumber(slope)
    const xa = parseFlexibleNumber(x1)
    const xb = parseFlexibleNumber(x2)
    if ([m, xa, xb].some((v) => Number.isNaN(v))) {
      setError('请输入有效的数字。')
      return
    }
    if (xa === xb) {
      setError('x 起点与终点不能相同（竖直线请改用「两点」）。')
      return
    }
    onConfirm({ slope: m, x1: xa, x2: xb })
  }

  return (
    <div className="modal-panel" role="dialog" aria-labelledby="line-slope-modal-title" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="line-slope-modal-title">直线（点与斜率）</h3>
      <p className="hint">
        经过点：({anchor.x}, {anchor.y})；直线 y − y₀ = m(x − x₀)，再给定两端 x 坐标。
      </p>
      <label>
        斜率 m
        <input value={slope} onChange={(e) => setSlope(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        线段端点 x₁
        <input value={x1} onChange={(e) => setX1(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        线段端点 x₂
        <input value={x2} onChange={(e) => setX2(e.target.value)} type="text" inputMode="decimal" />
      </label>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="primary" onClick={submit}>
          确定
        </button>
      </div>
    </div>
  )
}

/* ──────────── 圆：圆心 + 半径数值 ──────────── */

type CircleRadiusModalProps = {
  open: boolean
  center: Point | null
  onConfirm: (center: Point, radius: number) => void
  onCancel: () => void
}

function CircleRadiusForm({
  center,
  onConfirm,
  onCancel,
}: {
  center: Point
  onConfirm: CircleRadiusModalProps['onConfirm']
  onCancel: () => void
}) {
  const [radius, setRadius] = useState('2')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const r = parseFlexibleNumber(radius)
    if (Number.isNaN(r) || r <= 0) {
      setError('请输入有效的正数半径。')
      return
    }
    onConfirm(center, r)
  }

  return (
    <div className="modal-panel" role="dialog" aria-labelledby="circle-radius-modal-title" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="circle-radius-modal-title">圆（圆心 + 半径）</h3>
      <p className="hint">
        圆心：({center.x}, {center.y})。输入半径值。
      </p>
      <label>
        半径 r
        <input value={radius} onChange={(e) => setRadius(e.target.value)} type="text" inputMode="decimal" />
      </label>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={onCancel}>取消</button>
        <button type="button" className="primary" onClick={submit}>确定</button>
      </div>
    </div>
  )
}

/* ──────────── 交点命名 ──────────── */

type IntersectionModalProps = {
  open: boolean
  points: Point[]
  onConfirm: (names: string[]) => void
  onCancel: () => void
}

function IntersectionForm({
  points,
  onConfirm,
  onCancel,
}: {
  points: Point[]
  onConfirm: IntersectionModalProps['onConfirm']
  onCancel: () => void
}) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const [names, setNames] = useState<string[]>(() =>
    points.map((_, i) => (i < alphabet.length ? alphabet[i] : `P${i + 1}`)),
  )

  const submit = () => {
    onConfirm(names)
  }

  return (
    <div className="modal-panel" role="dialog" aria-labelledby="intersection-modal-title" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="intersection-modal-title">交点</h3>
      <p className="hint">
        找到 {points.length} 个交点，为每个交点命名（将创建为独立的「交点」图元，可在选中后用属性面板修改标签）。
      </p>
      {points.map((pt, i) => (
        <label key={i}>
          交点 {i + 1} 坐标 ({pt.x.toFixed(2)}, {pt.y.toFixed(2)}) 名称
          <input
            value={names[i]}
            onChange={(e) => {
              const next = [...names]
              next[i] = e.target.value
              setNames(next)
            }}
            type="text"
          />
        </label>
      ))}
      {points.length === 0 && <p className="hint">当前选择的两个图元没有交点。</p>}
      <div className="modal-actions">
        <button type="button" onClick={onCancel}>取消</button>
        {points.length > 0 && (
          <button type="button" className="primary" onClick={submit}>创建交点</button>
        )}
      </div>
    </div>
  )
}

/* ──────────── 圆弧：中心+半径+起止角度 ──────────── */

type ArcCenterRadiusAnglesModalProps = {
  open: boolean
  center: Point | null
  onConfirm: (center: Point, radius: number, startAngle: number, endAngle: number) => void
  onCancel: () => void
}

function ArcCenterRadiusAnglesForm({
  center,
  onConfirm,
  onCancel,
}: {
  center: Point
  onConfirm: ArcCenterRadiusAnglesModalProps['onConfirm']
  onCancel: () => void
}) {
  const [radius, setRadius] = useState('2')
  const [startAngle, setStartAngle] = useState('0')
  const [endAngle, setEndAngle] = useState('90')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const r = parseFlexibleNumber(radius)
    const sa = parseFlexibleNumber(startAngle)
    const ea = parseFlexibleNumber(endAngle)
    if (Number.isNaN(r) || r <= 0) {
      setError('请输入有效的正数半径。')
      return
    }
    if (Number.isNaN(sa) || Number.isNaN(ea)) {
      setError('请输入有效的起止角度（度）。')
      return
    }
    if (sa === ea) {
      setError('起始角和终止角不能相同。')
      return
    }
    onConfirm(center, r, sa, ea)
  }

  return (
    <div className="modal-panel" role="dialog" aria-labelledby="arc-cra-modal-title" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="arc-cra-modal-title">圆弧（圆心 + 半径 + 角度）</h3>
      <p className="hint">
        TikZ 语法：<code>arc[start angle=α, end angle=β, radius=r]</code><br />
        圆心：({center.x}, {center.y})。角度以正 x 轴为 0°，逆时针为正。
      </p>
      <label>
        半径 r<input value={radius} onChange={(e) => setRadius(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        起始角（°）— 圆弧起始方向<input value={startAngle} onChange={(e) => setStartAngle(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        终止角（°）— 圆弧终止方向<input value={endAngle} onChange={(e) => setEndAngle(e.target.value)} type="text" inputMode="decimal" />
      </label>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={onCancel}>取消</button>
        <button type="button" className="primary" onClick={submit}>确定</button>
      </div>
    </div>
  )
}

export function ArcCenterRadiusAnglesModal({ open, center, onConfirm, onCancel }: ArcCenterRadiusAnglesModalProps) {
  if (!open || !center) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <ArcCenterRadiusAnglesForm key={`${center.x},${center.y}`} center={center} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  )
}

export function IntersectionModal({ open, points, onConfirm, onCancel }: IntersectionModalProps) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <IntersectionForm key={points.length} points={points} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  )
}

export function CircleRadiusModal({ open, center, onConfirm, onCancel }: CircleRadiusModalProps) {
  if (!open || !center) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <CircleRadiusForm key={`${center.x},${center.y}`} center={center} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  )
}

/* ──────────── 椭圆：中心 + x/y 半轴数值 ──────────── */

type EllipseRadiiModalProps = {
  open: boolean
  center: Point | null
  onConfirm: (center: Point, xRadius: number, yRadius: number) => void
  onCancel: () => void
}

function EllipseRadiiForm({
  center,
  onConfirm,
  onCancel,
}: {
  center: Point
  onConfirm: EllipseRadiiModalProps['onConfirm']
  onCancel: () => void
}) {
  const [xRadius, setXRadius] = useState('3')
  const [yRadius, setYRadius] = useState('2')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const xr = parseFlexibleNumber(xRadius)
    const yr = parseFlexibleNumber(yRadius)
    if (Number.isNaN(xr) || xr <= 0 || Number.isNaN(yr) || yr <= 0) {
      setError('请输入有效的正数半轴。')
      return
    }
    onConfirm(center, xr, yr)
  }

  return (
    <div className="modal-panel" role="dialog" aria-labelledby="ellipse-radii-modal-title" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="ellipse-radii-modal-title">椭圆（中心 + 两半轴）</h3>
      <p className="hint">
        中心：({center.x}, {center.y})。输入 x/y 半轴长度。
      </p>
      <label>
        x 半轴 a
        <input value={xRadius} onChange={(e) => setXRadius(e.target.value)} type="text" inputMode="decimal" />
      </label>
      <label>
        y 半轴 b
        <input value={yRadius} onChange={(e) => setYRadius(e.target.value)} type="text" inputMode="decimal" />
      </label>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={onCancel}>取消</button>
        <button type="button" className="primary" onClick={submit}>确定</button>
      </div>
    </div>
  )
}

export function EllipseRadiiModal({ open, center, onConfirm, onCancel }: EllipseRadiiModalProps) {
  if (!open || !center) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <EllipseRadiiForm key={`${center.x},${center.y}`} center={center} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  )
}

export function LineSlopeModal({ open, anchor, onConfirm, onCancel }: LineSlopeModalProps) {
  if (!open || !anchor) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <LineSlopeForm key={`${anchor.x},${anchor.y}`} anchor={anchor} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  )
}

type RegularPolygonModalProps = {
  open: boolean
  center: Point | null
  firstVertex: Point | null
  onConfirm: (center: Point, firstVertex: Point, sides: number) => void
  onCancel: () => void
}

export function RegularPolygonModal({ open, center, firstVertex, onConfirm, onCancel }: RegularPolygonModalProps) {
  const [sides, setSides] = useState('6')
  const [error, setError] = useState<string | null>(null)
  if (!open || !center || !firstVertex) return null

  const submit = () => {
    const n = Number.parseInt(sides, 10)
    if (!Number.isFinite(n) || n < 3 || n > 64) {
      setError('边数应为 3–64 的整数')
      return
    }
    onConfirm(center, firstVertex, n)
    setError(null)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-panel" role="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h3>正多边形</h3>
        <p className="hint">
          中心 ({center.x}, {center.y})，第一顶点 ({firstVertex.x}, {firstVertex.y})。
        </p>
        <label>
          边数 n
          <input value={sides} onChange={(e) => setSides(e.target.value)} type="text" inputMode="numeric" />
        </label>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" className="primary" onClick={submit}>确定</button>
        </div>
      </div>
    </div>
  )
}

type ConicPayload = Omit<ConicCurveElement, 'id' | 'style'>

type ConicModalProps = {
  open: boolean
  onConfirm: (partial: ConicPayload) => void
  onCancel: () => void
}

export function ConicModal({ open, onConfirm, onCancel }: ConicModalProps) {
  const [kind, setKind] = useState<ConicKind>('parabola')
  const [semiAxisX, setSemiAxisX] = useState('2')
  const [semiAxisY, setSemiAxisY] = useState('1')
  const [rotationDeg, setRotationDeg] = useState('0')
  const [domainMin, setDomainMin] = useState('-3')
  const [domainMax, setDomainMax] = useState('3')
  const [samples, setSamples] = useState('48')
  const [branch, setBranch] = useState<HyperbolaBranch>('positive')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = () => {
    const sx = parseFlexibleNumber(semiAxisX)
    const sy = parseFlexibleNumber(semiAxisY)
    const rot = parseFlexibleNumber(rotationDeg)
    const d0 = parseFlexibleNumber(domainMin)
    const d1 = parseFlexibleNumber(domainMax)
    const ns = Number.parseInt(samples, 10)
    if ([sx, sy, rot, d0, d1].some(Number.isNaN) || !Number.isFinite(ns) || ns < 8) {
      setError('请输入有效数值')
      return
    }
    if (d0 >= d1) {
      setError('定义域下限须小于上限')
      return
    }
    onConfirm({
      type: 'conicCurve',
      conicKind: kind,
      center: { x: 0, y: 0 },
      semiAxisX: sx,
      semiAxisY: sy,
      rotationDeg: rot,
      domainMin: d0,
      domainMax: d1,
      samples: ns,
      hyperbolaBranch: branch,
    })
    setError(null)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-panel" role="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h3>圆锥曲线（采样）</h3>
        <label>
          类型
          <select value={kind} onChange={(e) => setKind(e.target.value as ConicKind)}>
            <option value="parabola">抛物线（竖直开口，y=x²/(4p)，参数 b 为 4p）</option>
            <option value="ellipse">椭圆（参数域为弧度）</option>
            <option value="hyperbola">双曲线（参数域为双曲角）</option>
          </select>
        </label>
        <label>
          参数 a / p 方向
          <input value={semiAxisX} onChange={(e) => setSemiAxisX(e.target.value)} />
        </label>
        <label>
          参数 b
          <input value={semiAxisY} onChange={(e) => setSemiAxisY(e.target.value)} />
        </label>
        <label>
          旋转（°）
          <input value={rotationDeg} onChange={(e) => setRotationDeg(e.target.value)} />
        </label>
        <label>
          定义域 min
          <input value={domainMin} onChange={(e) => setDomainMin(e.target.value)} />
        </label>
        <label>
          定义域 max
          <input value={domainMax} onChange={(e) => setDomainMax(e.target.value)} />
        </label>
        <label>
          采样点数
          <input value={samples} onChange={(e) => setSamples(e.target.value)} />
        </label>
        {kind === 'hyperbola' && (
          <label>
            分支
            <select value={branch} onChange={(e) => setBranch(e.target.value as HyperbolaBranch)}>
              <option value="positive">右支</option>
              <option value="negative">左支</option>
              <option value="both">两支</option>
            </select>
          </label>
        )}
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" className="primary" onClick={submit}>添加</button>
        </div>
      </div>
    </div>
  )
}

type PlotPayload = Omit<FunctionPlotElement, 'id' | 'style'>

type FunctionPlotModalProps = {
  open: boolean
  onConfirm: (partial: PlotPayload) => void
  onCancel: () => void
}

export function FunctionPlotModal({ open, onConfirm, onCancel }: FunctionPlotModalProps) {
  const [expression, setExpression] = useState('sin(x)')
  const [implicit, setImplicit] = useState('')
  const [mode, setMode] = useState<PlotCoordinateMode>('cartesian')
  const [domainMin, setDomainMin] = useState('-6.28')
  const [domainMax, setDomainMax] = useState('6.28')
  const [samples, setSamples] = useState('120')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = () => {
    const d0 = parseFlexibleNumber(domainMin)
    const d1 = parseFlexibleNumber(domainMax)
    const ns = Number.parseInt(samples, 10)
    if (Number.isNaN(d0) || Number.isNaN(d1) || d0 >= d1 || !Number.isFinite(ns) || ns < 8) {
      setError('定义域或采样无效')
      return
    }
    onConfirm({
      type: 'functionPlot',
      expression: implicit.trim() ? '0' : expression.trim(),
      coordinateMode: mode,
      domainMin: d0,
      domainMax: d1,
      samples: ns,
      implicitEquation: implicit.trim() || null,
    })
    setError(null)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-panel" role="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h3>函数 / 方程图像</h3>
        <p className="hint">显式：笛卡尔用 x 为变量；极坐标用 t 表示角（弧度）。隐式留空则不用。</p>
        <label>
          坐标
          <select value={mode} onChange={(e) => setMode(e.target.value as PlotCoordinateMode)}>
            <option value="cartesian">y = f(x)</option>
            <option value="polar">r = f(t)</option>
          </select>
        </label>
        <label>
          表达式
          <input value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="sin(x) 或 t" />
        </label>
        <label>
          隐式方程 F(x,y)=0（可选）
          <input value={implicit} onChange={(e) => setImplicit(e.target.value)} placeholder="如 x^2+y^2-4" />
        </label>
        <label>
          定义域 min
          <input value={domainMin} onChange={(e) => setDomainMin(e.target.value)} />
        </label>
        <label>
          定义域 max
          <input value={domainMax} onChange={(e) => setDomainMax(e.target.value)} />
        </label>
        <label>
          采样
          <input value={samples} onChange={(e) => setSamples(e.target.value)} />
        </label>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" className="primary" onClick={submit}>添加</button>
        </div>
      </div>
    </div>
  )
}

type ForeachPayload = Omit<TikzForeachElement, 'id' | 'style'>

type ForeachModalProps = {
  open: boolean
  onConfirm: (partial: ForeachPayload) => void
  onCancel: () => void
}

export function ForeachModal({ open, onConfirm, onCancel }: ForeachModalProps) {
  const [iteratorName, setIteratorName] = useState('i')
  const [listExpr, setListExpr] = useState('1,...,5')
  const [bodyTemplate, setBodyTemplate] = useState(String.raw`\draw (0,\i) -- (1,\i);`)
  const [previewLimit, setPreviewLimit] = useState('8')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = () => {
    const pl = Number.parseInt(previewLimit, 10)
    if (!iteratorName.trim()) {
      setError('迭代变量名必填')
      return
    }
    if (!Number.isFinite(pl) || pl < 1 || pl > 200) {
      setError('预览上限 1–200')
      return
    }
    onConfirm({
      type: 'tikzForeach',
      iteratorName: iteratorName.trim(),
      listExpr: listExpr.trim(),
      bodyTemplate,
      previewLimit: pl,
    })
    setError(null)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-panel" role="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h3>TikZ foreach</h3>
        <p className="hint">正文将原样写入导出；画布仅解析简单 <code>{'\\draw (x,y)--(x,y)'}</code> 预览。</p>
        <label>
          变量名（不写反斜杠）
          <input value={iteratorName} onChange={(e) => setIteratorName(e.target.value)} />
        </label>
        <label>
          列表
          <input value={listExpr} onChange={(e) => setListExpr(e.target.value)} />
        </label>
        <label>
          循环体
          <textarea rows={4} value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} />
        </label>
        <label>
          预览展开上限
          <input value={previewLimit} onChange={(e) => setPreviewLimit(e.target.value)} />
        </label>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" className="primary" onClick={submit}>添加</button>
        </div>
      </div>
    </div>
  )
}
