import { useState } from 'react'
import { parseFlexibleNumber } from '../lib/parseNumber'
import type { Point } from '../types/drawing'

type AxesBoundsModalProps = {
  open: boolean
  origin: Point | null
  onConfirm: (bounds: { xMin: number; xMax: number; yMin: number; yMax: number }) => void
  onCancel: () => void
}

function AxesBoundsForm({
  origin,
  onConfirm,
  onCancel,
}: {
  origin: Point
  onConfirm: AxesBoundsModalProps['onConfirm']
  onCancel: () => void
}) {
  const [xMin, setXMin] = useState('-3')
  const [xMax, setXMax] = useState('3')
  const [yMin, setYMin] = useState('-3')
  const [yMax, setYMax] = useState('3')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const xm = parseFlexibleNumber(xMin)
    const xx = parseFlexibleNumber(xMax)
    const ym = parseFlexibleNumber(yMin)
    const yx = parseFlexibleNumber(yMax)
    if ([xm, xx, ym, yx].some((v) => Number.isNaN(v))) {
      setError('请输入有效的数字。')
      return
    }
    if (xm >= xx || ym >= yx) {
      setError('要求 x 下限 < x 上限，y 下限 < y 上限。')
      return
    }
    onConfirm({ xMin: xm, xMax: xx, yMin: ym, yMax: yx })
  }

  return (
    <div className="modal-panel" role="dialog" aria-labelledby="axes-modal-title" onMouseDown={(e) => e.stopPropagation()}>
      <h3 id="axes-modal-title">坐标轴范围</h3>
      <p className="hint">
        原点：({origin.x}, {origin.y})（TikZ 坐标）。上下限可写分数，如 <code>2/3</code>、<code>-1/5</code>。
      </p>
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
      <AxesBoundsForm key={`${origin.x},${origin.y}`} origin={origin} onConfirm={onConfirm} onCancel={onCancel} />
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
