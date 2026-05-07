import { useEffect, useState } from 'react'
import type { GridConfig } from '../types/drawing'

type StatusBarProps = {
  gridConfig: GridConfig
}

export function StatusBar({ gridConfig }: StatusBarProps) {
  const [ctrlHeld, setCtrlHeld] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Control') setCtrlHeld(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Control') setCtrlHeld(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

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
        {ctrlHeld && <span className="status-item status-emphasis">Ctrl：点取坐标不吸附网格</span>}
      </div>
      <div className="status-bar-right" />
    </div>
  )
}
