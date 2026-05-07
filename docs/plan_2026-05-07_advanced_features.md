# 计划归档：高级绘图功能（2026-05-07）

对应会话中确认的 TikZ Drawer 扩展：填充与子选项、极坐标定点、扇形/正多边形/多边形/圆锥曲线/函数图/foreach、交点分割、多选直线合并填充、填色拾取。

## 实现摘要

- 类型：`DrawingStyle` 增加 `fillMode` / `fillColor` / `fillOpacity` / `fillPattern`；新增图元 `sector`、`regularPolygon`、`polygon`、`conicCurve`、`filledPath`、`functionPlot`、`tikzForeach`；`polyline.closed`。
- 导出：`tikz.ts` 闭合路径 `fill`/`pattern`，`plot coordinates`，`foreach` 原样输出；颜色收集包含填充色；`patterns` 库写入 standalone 与 Tauri `latex_document`。
- 画布：`DrawingCanvas` SVG 填充与图案 defs；新工具交互；多选 `selectedIds` + Shift。
- 逻辑：`splitGeometry`、`regionCycle`、`hitTest`、`expression`、`plotSamples`、`conicSamples`、`foreachExpand`、`polar`。

## 已知限制

- 隐式曲线为粗网格 MVP；`foreach` 画布仅解析简单 `\draw (,)--(,)`；圆锥曲线参数与注释一致（抛物线竖直开口）；填色拾取依赖内置闭合命中测试。

## 2026-05-07 后续小迭代（会话）

- 画布浮动栏增加「交点分割」「合并填充」，避免依赖默认收起的属性栏。
- 闭合原生图元创建时默认浅色实心填充（`withClosedShapeDefaultFillIfApplicable`）。
- 左侧 `primaryTools` 顺序调整为简→繁。
