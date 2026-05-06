# 会话计划：坐标轴范围对话框与工具栏子选单（2026-05-06）

## 目标

1. **坐标轴**：点击画布确定 TikZ 原点，再通过弹框输入 `xMin/xMax`、`yMin/yMax`，支持负半轴；数据模型由 `origin + extent` 改为显式上下限。
2. **直线子功能**：Inkscape 式布局——左侧主工具一列竖排按钮，选中「直线」时在右侧显示「两点」「点与斜率」；点与斜率流程为点击锚点后弹框输入斜率 `m` 与两端 `x`，线段端点由 \(y = y_0 + m(x-x_0)\) 计算。

## 涉及文件

- `src/types/drawing.ts`：`AxesElement` 字段；`LineSubtool`；`DraftElement` 去掉 `axes`。
- `src/lib/axes.ts`、`src/lib/tikz.ts`：`getAxesSegments(origin, xMin, xMax, yMin, yMax)`。
- `src/components/DrawingCanvas.tsx`：坐标轴与点与斜率点击分流；移除坐标轴两点草稿。
- `src/components/DrawingModals.tsx`：坐标轴范围、直线斜率弹框。
- `src/components/Toolbar.tsx`：双列工具布局与直线子按钮。
- `src/App.tsx`：弹框状态与创建图元。
- `src/components/PropertiesPanel.tsx`：坐标轴编辑上下限。
- `src/App.css`：工具栏列、弹层样式。
- `CHANGELOG.md`：记录变更。

## 备注

- 竖直线（无穷斜率）当前提示改用「两点」模式；后续可单独加子模式。

## 2026-05-06 增补

- 坐标轴：手动刻度（现为 `manualTicksX` / `manualTicksY`）与步长刻度合并；刻度步长 ≤0 时可仅用手动刻度。
- `parseFlexibleNumber`、`parseCommaSeparatedNumbers`：`a/b` 与逗号枚举；画布与 TikZ 刻度标签在低分母下显示为 `n/d`。

## 2026-05-06 增补（第二批）

- 手动刻度：`manualTicksX` / `manualTicksY`（`{ value, label? }[]`），`label` 原样写入 TikZ 刻度节点。
- 轴名：`labelXPlacement` / `labelYPlacement`（TikZ node 关键字）及 `label*Dx`、`label*Dy` 微调位置；画布上用近似对齐。
- 属性面板选定坐标轴时，几何相关项归入「范围·原点 / 刻度 / 轴名·位置」三组选项卡；线型颜色等仍在通用面板。
