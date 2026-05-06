import { useCallback, useEffect, useRef, useState } from 'react'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { presetColors } from '../types/drawing'

const STORAGE_KEY = 'tikz-drawer-preset-colors'
const MAX_PRESETS = 16

function loadPresets(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, MAX_PRESETS)
      }
    }
  } catch {
    // fall through to defaults
  }
  return [...presetColors]
}

function savePresets(colors: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {
    // ignore storage errors
  }
}

type ColorPickerProps = {
  color: string
  onChange: (color: string) => void
  /** full = wheel + presets (toolbar); presets = swatches + hex + edit only */
  variant?: 'full' | 'presets'
}

export function ColorPicker({ color, onChange, variant = 'full' }: ColorPickerProps) {
  const [presets, setPresets] = useState<string[]>(loadPresets)
  const [editing, setEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Persist presets on change
  useEffect(() => {
    savePresets(presets)
  }, [presets])

  const handleChange = useCallback(
    (nextColor: string) => {
      onChange(nextColor.startsWith('#') ? nextColor : `#${nextColor}`)
    },
    [onChange],
  )

  const handleSelectPreset = (presetColor: string) => {
    handleChange(presetColor)
  }

  const handleEditPreset = (index: number) => {
    setEditingIndex(index)
  }

  const handlePresetColorChange = (nextColor: string) => {
    const fixed = nextColor.startsWith('#') ? nextColor : `#${nextColor}`
    if (editingIndex !== null) {
      setPresets((prev) => {
        const next = [...prev]
        next[editingIndex] = fixed
        return next
      })
    }
  }

  const handleAddColor = (nextColor: string) => {
    const fixed = nextColor.startsWith('#') ? nextColor : `#${nextColor}`
    setPresets((prev) => {
      if (prev.length >= MAX_PRESETS) return prev
      return [...prev, fixed]
    })
    setAdding(false)
    handleChange(fixed)
  }

  const handleRemovePreset = (index: number) => {
    setPresets((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(null)
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex((prev) => prev! - 1)
    }
  }

  // Click outside handler for add/edit popovers
  useEffect(() => {
    if (!adding && editingIndex === null) return

    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAdding(false)
        setEditingIndex(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [adding, editingIndex])

  return (
    <div className={`color-picker ${variant === 'presets' ? 'color-picker-presets-only' : ''}`}>
      {variant === 'full' && <HexColorPicker color={color} onChange={handleChange} />}
      <HexColorInput prefixed alpha={false} color={color} onChange={handleChange} />

      <div className="preset-header">
        <span className="preset-label">预置颜色</span>
        <button
          className={`compact preset-edit-btn ${editing ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setEditing(!editing)
            setEditingIndex(null)
            setAdding(false)
          }}
        >
          {editing ? '完成' : '编辑'}
        </button>
      </div>

      <div className="preset-colors">
        {presets.map((presetColor, index) => (
          <button
            key={`${presetColor}-${index}`}
            aria-label={`选择颜色 ${presetColor}`}
            className={
              !editing && presetColor.toLowerCase() === color.toLowerCase()
                ? 'color-swatch active'
                : 'color-swatch'
            }
            style={{ backgroundColor: presetColor }}
            type="button"
            onClick={() => {
              if (editing) {
                handleEditPreset(index)
              } else {
                handleSelectPreset(presetColor)
              }
            }}
          />
        ))}
        {presets.length < MAX_PRESETS && (
          <button
            className="color-swatch color-add-btn"
            type="button"
            aria-label="添加颜色"
            onClick={() => {
              setAdding(true)
              setEditingIndex(null)
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Edit popover */}
      {editing && editingIndex !== null && (
        <div className="color-edit-popover" ref={popoverRef}>
          <HexColorPicker
            color={presets[editingIndex] ?? '#000000'}
            onChange={handlePresetColorChange}
          />
          <HexColorInput
            prefixed
            alpha={false}
            color={presets[editingIndex] ?? '#000000'}
            onChange={handlePresetColorChange}
          />
          <button
            className="compact danger"
            type="button"
            onClick={() => handleRemovePreset(editingIndex!)}
          >
            删除此颜色
          </button>
        </div>
      )}

      {/* Add popover */}
      {adding && (
        <div className="color-edit-popover" ref={popoverRef}>
          <HexColorPicker color="#000000" onChange={handleAddColor} />
          <HexColorInput prefixed alpha={false} color="#000000" onChange={handleAddColor} />
          <button
            className="compact"
            type="button"
            onClick={() => setAdding(false)}
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}
