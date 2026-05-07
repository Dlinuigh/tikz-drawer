# 计划归档：画布编辑、变换与函数辅助点（2026-05-07）

## 已完成范围

- Ctrl 临时关闭网格吸附（`maybeSnapTikzPoint`）；状态栏提示。
- Delete/Backspace 批量删除选中。
- `elementTransform`：平移、绕点旋转、轴对称；`functionPlot`/`tikzForeach` 的偏移与 scope。
- 侧栏按钮：移动 / 拷贝 / 旋转 / 对称及交互状态。
- 函数图向导：可选零点与极值点（`functionPlotMarkers`）。
- 椭圆弧图元与 TikZ 导出、画布采样路径。
- Foreach 向导：算术列表填入、正文预设、辅助文案。
- Toolbar 主按钮与子菜单悬浮 hint。

## 关键文件

- `src/lib/elementTransform.ts`、`src/lib/ellipseArcGeometry.ts`、`src/lib/functionPlotMarkers.ts`
- `src/lib/geometry.ts`（`maybeSnapTikzPoint`、`snapTikzDelta`、镜像/旋转点）
- `src/App.tsx`（编辑状态、快捷键、模态）
- `src/components/DrawingCanvas.tsx`（吸附、移动拖拽、对称拾取、椭圆弧绘制）
- `src/components/DrawingModals.tsx`（椭圆弧、旋转、函数图、Foreach）
- `src/components/Toolbar.tsx`、`src/components/StatusBar.tsx`
