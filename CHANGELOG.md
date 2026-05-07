# Changelog

All notable changes to TikZ Drawer will be documented in this file.

## Unreleased

### Added

- **样式**：闭合图元支持填充模式（无 / 纯色 / TikZ `patterns` 图案）、填充色与不透明度；多段线可选「闭合」；导出使用 `patterns` 库。
- **工具**：多边形（Esc 闭合）、扇形（圆心 + 弧上两点）、正多边形（圆心 + 顶点 + 边数对话框）、圆锥曲线采样、函数/隐式方程采样曲线、`\\foreach` 代码块（简化画布预览）、填色拾取（点击闭合区域套用当前填充色）。
- **编辑**：Shift+多选直线；「合并为填充区域」（闭合环路检测）；「在交点标记处分割」直线/多段线/圆弧。
- **极坐标**：属性栏「极坐标定点」从原点添加点（度/弧度）；坐标输入偏好切换。
- **几何**：`geometry` 对新图元参与求交；Rust/前端 LaTeX 前言加入 `patterns`。

- **GitHub Actions**：`.github/workflows/ci.yml` 在任意分支 **push**、**pull_request** 或手动 **workflow_dispatch** 时运行；Linux 任务执行 `npm ci`、`build`、`lint` 与 `cargo build --locked`，macOS 任务执行完整 `tauri build`。
- **README**：顶部增加指向上述工作流的 CI 状态徽章与简要说明。

### Changed

- **画布**：闭合图元填充在 SVG 预览中可见（移除 `.shape` 的全局 `fill:none` 覆盖；圆弧路径显式 `fill="none"`）；`.shape` 使用 `pointer-events: painted` 以便点击填充区域即可选中。
- **选择**：选择工具下在画布空白处（背景/网格/坐标轴线）拖拽可进行框选；与包围盒相交的图元入选，`Shift` 为追加并集。
- **画布**：左侧浮动栏在工具栏下方常驻「交点分割」「合并填充」按钮（与属性栏逻辑相同的启用条件）；分割/合并失败时用简短 toast 提示。
- **样式**：新建矩形、圆、椭圆、多边形、正多边形、扇形时默认套用浅色实心填充（保留当前描边等其余样式）。
- **工具栏**：主工具列表按由简到繁重排（选择 → 点 → 直线 → … → Foreach）。
- **ESLint**：`globalIgnores` 排除 `src-tauri/target`（避免扫描 Tauri 构建产物）；为 `App.tsx`、`DrawingCanvas.tsx` 关闭 `react-hooks/refs` 与 `react-hooks/set-state-in-effect`（与原生菜单 ref 同步及 PDF blob 生命周期一致），保证云端 `npm run lint` 稳定通过。

## 0.1.0 - 2026-05-06

首个面向 macOS 的 GitHub Release 构建（需本机安装 LaTeX / `pdflatex` 等，详见 README）。

### 维护者摘要

- **坐标轴**：`axisLine` 单轴 + 旧 `axes` 兼容；画布 X/Y 显隐仅 **View** 菜单两项，文案随状态（隐藏/显示）；合并轴支持 `canvasVisibleX`/`canvasVisibleY`；TikZ 仍输出完整轴。逻辑见 `src/lib/axisCanvas.ts`。
- **菜单**：主窗口 `label: main`；`invoke('update_axis_canvas_menu_items')` 扁平参数同步轴项与属性栏标题；`useLayoutEffect([elements, propertiesOpen])`。属性栏默认收起，菜单占位「展开属性栏」。
- **前端监听**：菜单事件 `Promise.all` + 卸载取消，避免 Strict Mode 下切换类菜单无效。
- **交点**：已确认点写入 `committedIntersectionPairsRef`；0 交点不锁对；`geometry` 椭圆/圆弧折线修正。
- **Rust**：`ViewMenuBarItems` 托管动态菜单项；`src-tauri/src/lib.rs` 菜单 `emit` 至主窗口。

### Added

- **VSCode-like fixed window layout**: removed the large title header; app now fills the window with no page scrolling; compact left toolbar, flexible canvas area, collapsible right properties panel, and expandable bottom preview drawer.
- **Status bar** at the bottom of the canvas area showing compile status, grid info, and a quick compile button.
- **macOS native menu bar** (File: New Canvas, Export PDF/PNG, Quit; Compile: Compile, Copy TikZ Code, Open PDF) with keyboard shortcuts.
- **Grid customization**: dynamic grid rendering with configurable show/hide, step size, color, line style (solid/dashed/dotted), and line width (`GridConfig` type in drawing types).
- **Expanded color palette**: up to 16 preset colors with `+` button to add new colors, edit mode to adjust/delete presets, and localStorage persistence.
- **Floating style panel**: style controls (arrows, line style, color, width, cap, join, opacity) now appear as a floating popup triggered from the toolbar.
- **Compact toolbar redesign**: drawing tool buttons as a narrow strip (~64px); line subtools and arc angle shown inline; clear button at bottom.
- After compile: **embedded PDF preview** (iframe + `convertFileSrc`), **open PDF in the default system viewer**, **copy TikZ** button, **export PDF / PNG** via save dialog (PNG uses local `pdftocairo`, ImageMagick, or Ghostscript when available).
- LaTeX output goes to a **fixed temp workspace** cleared on each compile (`<temp>/tikz-drawer/workspace`).
- Runtime deps: `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-opener`; Rust `tauri-plugin-dialog`, `tauri-plugin-opener`.
- Plan note: `docs/export_pdf_preview.plan.md`.
- Coordinate axes properties use **tabs** (range & origin · ticks · axis names).
- Coordinate axes manual ticks (`manualTicksX`/`manualTicksY`) support **optional tick labels** (TikZ text; canvas shows verbatim).
- Axis name **TikZ `\\node` placement** (`above`, `below`, `right`, `above left`, …) plus **Δx/Δy** offsets from the positive semi-axis tip; SVG mirrors placement approximately.
- Number inputs accept **rational `a/b`** (e.g. `1/3`) in the axes bounds modal, line–slope modal, and axes property fields; tick labels prefer `n/d` when the value matches a low-denominator fraction.
- Utility `src/lib/parseNumber.ts` for flexible numeric parsing.
- Inkscape-style toolbar: primary tools in the left column; choosing Line shows sub-buttons (two points vs. point + slope) in the right column.
- Line drawing via point and slope: click an anchor, then enter slope and two x-coordinates in a dialog (vertical lines still use two-point mode).
- Coordinate axes: click the origin, then set x/y min and max in a dialog; axes elements store explicit bounds instead of a second corner point.
- Plan note: `docs/session_axes_bounds_line_subtools.plan.md`.
- Added a Markdown archive of the Cursor Canvas roadmap at `docs/CANVAS_ROADMAP.md`.
- Added the feature expansion roadmap at `docs/ROADMAP.md`.
- Added rectangle drawing from two opposite corners.
- Added circle drawing from a center point and radius point.
- Added ellipse drawing from a center point and radius point.
- Added polyline drawing with continuous point placement and explicit completion.
- Added TikZ output for rectangles, circles, ellipses, and polylines.
- **坐标轴（单轴）**：新增 `axisLine` 图元（x 或 y）；创建对话框可勾选只建 x、只建 y 或两根；属性面板 `AxisLineFields` 可编辑范围、刻度、轴名与画布可见性。旧 `axes` 合并图元仍兼容加载。
- **交点工具**：坐标轴类图元（`axes` / `axisLine`）按当前范围展开为轴线段，可与直线、多段线、矩形、圆、椭圆、圆弧等参与同一套求交逻辑。

### Fixed

- **macOS 菜单**：主窗口 `label: "main"` + `event.id.as_ref()` + 向主窗口 `emit`。另：**React Strict Mode** 下菜单监听改为 `Promise.all` 一次性注册并在卸载时取消，避免重复监听导致切换类项（属性面板、栅格、坐标轴显隐等）执行偶数次而看似失效。
- **View 菜单动态文案**：`update_axis_canvas_menu_items` 同步坐标轴项（画布可见→「隐藏 …」，不可见→「显示 …」）与 **属性栏**（展开→「隐藏属性栏」，收起→「展开属性栏」）；托管 `ViewMenuBarItems`（含 `properties_item`）。画布 tab 上 ☰ 按钮 `title` 与菜单一致。属性栏默认收起；原生菜单项占位标题亦为「展开属性栏」。
- **交点工具**：同一对已确认创建交点的图元不再重复计算；求交结果为 **0 个点**时不锁住该对，可再次选取。
- **椭圆–椭圆 / 椭圆–圆弧交点**：`ellipsePolyline` 与 `arcPolyline` 原先把每条Chord写成退化线段 `(pᵢ,pᵢ)`，线段求交永远为空；已改为正常的相邻顶点线段对。Newton-Raphson 精化增加残差判定以避免无效点。

### Changed

- **坐标轴**：尚无坐标轴时，选中坐标轴工具**立即**打开范围对话框（不再依赖画布点击）；已有坐标轴时选中该工具不再弹出设置。画布可见性按 **X 轴 / Y 轴** 在 macOS **View** 菜单分别切换（文案随状态同步；无该朝向轴时对应项禁用）。合并型 `axes` 支持 `canvasVisibleX` / `canvasVisibleY`。TikZ 仍始终输出坐标轴。原点固定 TikZ `(0,0)`；属性面板已移除原点坐标编辑。
- **交点工具**：选取坐标轴作为图元之一时，轴线与刻度线套用与其它图形一致的 `intersection-pick` 加粗描边。
- **交点图元**：选中「交点」结果点时加粗描边与阴影（专用 `.intersection-point-marker`，避免 `.shape` 的 `fill: none` 破坏实心圆）。
- **交点工具**：确认的交点创建为独立图元类型 `intersectionPoint`（与手绘 `point` 区分）；属性面板为「点」与「交点」提供「标签」编辑。
- **交点工具**：切换到交点模式时清除画布选中态，避免 `.shape.selected` 仍把最后绘制的线条显示为加粗；与绘制下一条时选中转移到新图元、旧线变细的行为一致。
- **Axes ticks**: step-based ticks now include **0** when it lies in range (previously skipped).
- **View / coordinates**: TikZ origin stays at `(0,0)`; **Alt+drag** or **middle-mouse drag** pans the canvas by changing the view origin. **View** menu: *Center on Selection*, *Reset Canvas View*. **Grid** menu: toggle editor grid (`⌘G`), toggle grid in PDF export, *Grid Settings…* (bounds, step, color, line style). Export grid is independent from the editor grid (`showGridInExport`).
- **Toolbar**: line mode (**两点 / 点斜**) and arc angle open as **floating menus** to the right of the toolbar; click the tool again, click outside, or **Esc** to close.
- **Properties panel**: scrollable body; color section uses **preset-only** picker (no large color wheel).
- **Polyline**: **Escape** finishes the polyline (≥2 points) or cancels if fewer than 2 points.
- **UI overhaul**: complete layout refactoring to VSCode-like fixed window; removed `.app-header`; `App.css` rewritten for `height: 100vh; overflow: hidden` layout.
- Toolbar simplified to compact tool strip; style controls moved to `FloatingStylePanel` popup.
- `ColorPicker` refactored with state-managed presets, add/edit/delete modes, localStorage persistence.
- `DrawingCanvas` grid rendering uses dynamic `GridConfig` props instead of hardcoded styles.
- `PropertiesPanel` and `PreviewPanel` now accept `onClose` prop for collapsible behavior.
- `src/lib.rs` adds native menu bar setup with event forwarding to frontend.
- `tauri.conf.json` window defaults increased to 1200x800 with 900x600 minimum.
- `index.css` body/root set to `height: 100vh; overflow: hidden` to prevent page scrolling.

- Tauri capabilities: configure `opener:allow-open-path` with scope `{ "path": "$TEMP/tikz-drawer/**" }` so LaTeX PDFs under the temp workspace can be opened (string-only permission is not enough).
- Updated `docs/PLAN.md` for compile workspace, preview/export commands, and prior interaction notes (line modes, axes, fraction input).
- Updated README documentation links to point to the docs roadmap and Canvas roadmap archive.
- **文档**：新增 [`docs/README.md`](docs/README.md)、[`docs/plan_handoff_next_version.md`](docs/plan_handoff_next_version.md)；根 [`README.md`](README.md) 功能列表与文档链接对齐；[`docs/PLAN.md`](docs/PLAN.md) 增加交接索引。
- **发行**：`package.json` 版本 **0.1.0**；`identifier` 设为 `io.github.dlinuigh.tikz-drawer`（便于与 `com.tauri.dev` 区分）。

## 0.0.0 - 2026-04-29

### Added

- Created the initial Tauri, React, and TypeScript desktop app.
- Added an interactive SVG drawing canvas.
- Added two-point line drawing.
- Added arc drawing from start point, end point, and sweep angle.
- Added toolbar controls for arrows, line styles, colors, and stroke width.
- Added a properties panel for editing selected shapes.
- Added TikZ code generation for lines and arcs.
- Added local `pdflatex` compilation through a Tauri command.
- Added project documentation under `docs/`.
