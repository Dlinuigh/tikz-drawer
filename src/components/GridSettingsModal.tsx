import type { GridConfig } from '../types/drawing'

type GridSettingsModalProps = {
  open: boolean
  gridConfig: GridConfig
  onClose: () => void
  onSave: (next: GridConfig) => void
}

export function GridSettingsModal({ open, gridConfig, onClose, onSave }: GridSettingsModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal-panel grid-settings-modal"
        role="dialog"
        aria-labelledby="grid-settings-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id="grid-settings-title">网格与导出</h3>
        <p className="hint">编辑器网格与编译进 TikZ 的网格可独立控制（菜单栏可快捷切换）。</p>

        <label>
          网格步长（TikZ 单位）
          <input
            inputMode="decimal"
            min={0.01}
            step={0.1}
            type="number"
            value={gridConfig.gridStep}
            onChange={(e) => onSave({ ...gridConfig, gridStep: Number(e.target.value) || 1 })}
          />
        </label>

        <label>
          网格颜色（HTML #）
          <input
            type="text"
            value={gridConfig.gridColor}
            onChange={(e) => onSave({ ...gridConfig, gridColor: e.target.value })}
          />
        </label>

        <label>
          线型
          <select
            value={gridConfig.gridLineStyle}
            onChange={(e) =>
              onSave({
                ...gridConfig,
                gridLineStyle: e.target.value as GridConfig['gridLineStyle'],
              })
            }
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </select>
        </label>

        <label>
          线宽（pt）
          <input
            min={0.1}
            step={0.1}
            type="number"
            value={gridConfig.gridLineWidth}
            onChange={(e) => onSave({ ...gridConfig, gridLineWidth: Number(e.target.value) || 1 })}
          />
        </label>

        <p className="field-group-title">导出网格范围（TikZ 坐标）</p>
        <label>
          x 最小
          <input
            inputMode="decimal"
            type="number"
            value={gridConfig.gridExportXMin}
            onChange={(e) => onSave({ ...gridConfig, gridExportXMin: Number(e.target.value) })}
          />
        </label>
        <label>
          x 最大
          <input
            inputMode="decimal"
            type="number"
            value={gridConfig.gridExportXMax}
            onChange={(e) => onSave({ ...gridConfig, gridExportXMax: Number(e.target.value) })}
          />
        </label>
        <label>
          y 最小
          <input
            inputMode="decimal"
            type="number"
            value={gridConfig.gridExportYMin}
            onChange={(e) => onSave({ ...gridConfig, gridExportYMin: Number(e.target.value) })}
          />
        </label>
        <label>
          y 最大
          <input
            inputMode="decimal"
            type="number"
            value={gridConfig.gridExportYMax}
            onChange={(e) => onSave({ ...gridConfig, gridExportYMax: Number(e.target.value) })}
          />
        </label>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
