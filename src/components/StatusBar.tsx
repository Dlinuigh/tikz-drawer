import type { CompileResult } from './PreviewPanel'
import type { GridConfig } from '../types/drawing'

type StatusBarProps = {
  compileResult: CompileResult | null
  gridConfig: GridConfig
  isCompiling: boolean
  onCompile: () => void
  onGridConfigChange: (config: GridConfig) => void
}

export function StatusBar({ compileResult, gridConfig, isCompiling, onCompile, onGridConfigChange }: StatusBarProps) {
  const compileStatus = isCompiling
    ? '编译中…'
    : compileResult?.success
      ? '编译成功'
      : compileResult
        ? '编译失败'
        : '未编译'

  const compileClass = isCompiling
    ? ''
    : compileResult?.success
      ? 'status-success'
      : compileResult
        ? 'status-error'
        : ''

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className={`status-item ${compileClass}`}>{compileStatus}</span>
        <button
          className="status-compile-btn"
          disabled={isCompiling}
          type="button"
          onClick={onCompile}
        >
          {isCompiling ? '编译中…' : '编译'}
        </button>
      </div>
      <div className="status-bar-center">
        <button
          className="status-item status-grid-btn"
          type="button"
          title="点击切换网格开关"
          onClick={() => onGridConfigChange({ ...gridConfig, showGrid: !gridConfig.showGrid })}
        >
          网格：{gridConfig.showGrid ? `${gridConfig.gridStep}` : '关'}
        </button>
      </div>
      <div className="status-bar-right">
        <span className="status-item">TikZ Drawer</span>
      </div>
    </div>
  )
}
