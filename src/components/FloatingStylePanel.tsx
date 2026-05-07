import { useEffect, useRef } from 'react'
import { ColorPicker } from './ColorPicker'
import type { ArrowHead, DrawingStyle, FillMode, FillPatternName, LineCap, LineJoin, LineStyle } from '../types/drawing'

type FloatingStylePanelProps = {
  style: DrawingStyle
  onStyleChange: (style: DrawingStyle) => void
  onClose: () => void
}

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

export function FloatingStylePanel({ style, onStyleChange, onClose }: FloatingStylePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    // Delay to avoid immediate close from the trigger click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div className="floating-style-overlay">
      <div className="floating-style-panel" ref={panelRef}>
        <div className="floating-style-header">
          <h3>线条样式</h3>
          <button className="compact" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="floating-style-body">
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
              {lineStyles.map((ls) => (
                <option key={ls.value} value={ls.value}>
                  {ls.label}
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
              {lineCaps.map((lc) => (
                <option key={lc.value} value={lc.value}>
                  {lc.label}
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
              {lineJoins.map((lj) => (
                <option key={lj.value} value={lj.value}>
                  {lj.label}
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

          <label>
            填充模式
            <select
              value={style.fillMode}
              onChange={(event) => onStyleChange({ ...style, fillMode: event.target.value as FillMode })}
            >
              <option value="none">无</option>
              <option value="solid">纯色</option>
              <option value="pattern">图案</option>
            </select>
          </label>
          {style.fillMode !== 'none' && (
            <>
              <label>
                填充色
                <ColorPicker color={style.fillColor} onChange={(fillColor) => onStyleChange({ ...style, fillColor })} />
              </label>
              {style.fillMode === 'pattern' && (
                <label>
                  图案
                  <select
                    value={style.fillPattern}
                    onChange={(event) =>
                      onStyleChange({ ...style, fillPattern: event.target.value as FillPatternName })
                    }
                  >
                    <option value="horizontal lines">horizontal lines</option>
                    <option value="vertical lines">vertical lines</option>
                    <option value="north east lines">north east lines</option>
                    <option value="dots">dots</option>
                    <option value="grid">grid</option>
                  </select>
                </label>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
