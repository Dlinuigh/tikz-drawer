import { HexColorInput, HexColorPicker } from 'react-colorful'
import { presetColors } from '../types/drawing'

type ColorPickerProps = {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const handleChange = (nextColor: string) => {
    onChange(nextColor.startsWith('#') ? nextColor : `#${nextColor}`)
  }

  return (
    <div className="color-picker">
      <HexColorPicker color={color} onChange={handleChange} />
      <HexColorInput prefixed alpha={false} color={color} onChange={handleChange} />
      <div className="preset-colors">
        {presetColors.map((presetColor) => (
          <button
            key={presetColor}
            aria-label={`选择颜色 ${presetColor}`}
            className={presetColor.toLowerCase() === color.toLowerCase() ? 'color-swatch active' : 'color-swatch'}
            style={{ backgroundColor: presetColor }}
            type="button"
            onClick={() => onChange(presetColor)}
          />
        ))}
      </div>
    </div>
  )
}
