import type { GridConfig } from '../types/drawing'

type StatusBarProps = {
  gridConfig: GridConfig
}

export function StatusBar({ gridConfig }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-item">TikZ Drawer</span>
      </div>
      <div className="status-bar-center">
        <span className="status-item" title="使用菜单栏 Grid 子菜单可详细设置">
          编辑栅格 {gridConfig.showGrid ? `步长 ${gridConfig.gridStep}` : '关'}
        </span>
        <span className="status-item">导出栅格 {gridConfig.showGridInExport ? '开' : '关'}</span>
        <span className="status-item">Alt/中键 拖移画布</span>
      </div>
      <div className="status-bar-right" />
    </div>
  )
}
