import type { CompileResult } from './PreviewPanel'
import type { GridConfig } from '../types/drawing'

type StatusBarProps = {
  compileResult: CompileResult | null
  gridConfig: GridConfig
  isCompiling: boolean
  onCompile: () => void
}

export function StatusBar({ compileResult, gridConfig, isCompiling, onCompile }: StatusBarProps) {
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
        <span className="status-item" title="使用菜单栏 Grid 子菜单可详细设置">
          编辑栅格 {gridConfig.showGrid ? `步长 ${gridConfig.gridStep}` : '关'}
        </span>
        <span className="status-item">导出栅格 {gridConfig.showGridInExport ? '开' : '关'}</span>
        <span className="status-item">Alt/中键 拖移画布</span>
      </div>
      <div className="status-bar-right">
        <span className="status-item">TikZ Drawer</span>
      </div>
    </div>
  )
}
