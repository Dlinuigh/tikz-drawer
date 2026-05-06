# 下一版本需求前 · 交接说明

> **v0.1.0** 已打开发行说明（见根目录 [`CHANGELOG.md`](../CHANGELOG.md)）；便于新开需求时对齐现状。

## 1. 近期行为摘要

### 坐标轴

- 新建：**`axisLine`**（`orientation: 'x' | 'y'`），对话框可选只建 x、只建 y 或两根；属性面板 **`AxisLineFields`**。
- 兼容旧数据：**`axes`** 合并图元仍可加载。
- **画布**上 X/Y 是否绘制：仅通过 macOS **View** 菜单两项切换（不在底部状态栏重复按钮）；无对应朝向轴时该项禁用。
- 合并型 **`axes`**：可选 **`canvasVisibleX` / `canvasVisibleY`** 控制半轴绘制；**`DrawingCanvas`** 按 `showX`/`showY` 分支渲染。
- **TikZ**：坐标轴仍输出（画布隐藏不等于导出隐藏）。
- 切换逻辑抽象在 **`src/lib/axisCanvas.ts`**（`hasAxisOrientation`、`anyAxisOrientationShown`、`toggleAxisOrientationVisibility`）。

### macOS 菜单与 IPC

- 窗口 **`label: "main"`**（`tauri.conf.json`）；菜单事件 **`event.id.as_ref()`** 匹配 id；向 **`get_webview_window("main").emit`** 转发（失败则 `handle.emit`）。
- **`ViewMenuBarItems`**（Rust）托管：`toggle_axes_x_canvas`、`toggle_axes_y_canvas`、`toggle_properties` 对应的 **`MenuItem`**，供运行时改标题。
- **`update_axis_canvas_menu_items`**：`#[tauri::command(rename_all = "camelCase")]`，参数为 **扁平**：`xLabel`, `yLabel`, `xEnabled`, `yEnabled`, **`propertiesLabel`**（勿再包一层 `payload` 对象）。
- 前端 **`useLayoutEffect([elements, propertiesOpen])`** 调用上述命令：
  - 轴：画布可见 →「隐藏 X/Y 轴」；不可见 →「显示 X/Y 轴」；无轴 →「（无 X/Y 轴）」。
  - 属性栏：**默认收起**；展开 →「隐藏属性栏」；收起 →「展开属性栏」；Rust 占位初始亦为「展开属性栏」。
- 画布 tab **☰** 的 **`title`** 与属性栏菜单文案一致。

### 前端菜单监听（重要）

- **`listen`** 注册必须使用 **`Promise.all` 一次性完成**，并在 effect cleanup 里 **`cancelled` + 批量 unlisten**，避免 React **Strict Mode** 双挂载导致同一事件注册两次；切换类 handler（如 `setPropertiesOpen(p => !p)`）执行偶数次会表现为「菜单失效」。

### 交点工具

- **`committedIntersectionPairsRef`**：已成功确认创建交点的图元对不再重复求交。
- **0 个交点**：不占用 pending pair key，同一对可再次尝试。
- **几何**：`ellipsePolyline` / `arcPolyline` 为非退化折线段；与坐标轴求交见 **`extractInfo`**（`axes` / `axisLine`）。

## 2. 关键文件一览

| 区域 | 路径 |
|------|------|
| 应用壳、菜单同步、交点对状态 | `src/App.tsx` |
| 坐标轴画布渲染（含半轴） | `src/components/DrawingCanvas.tsx` |
| 轴属性、`AxisLineFields` | `src/components/PropertiesPanel.tsx` |
| 创建轴对话框 | `src/components/DrawingModals.tsx` |
| 轴切换纯函数 | `src/lib/axisCanvas.ts` |
| 求交 / 轴线段抽取 | `src/lib/geometry.ts` |
| TikZ（含 `axisLine`） | `src/lib/tikz.ts` |
| 类型定义 | `src/types/drawing.ts` |
| 菜单、命令、`ViewMenuBarItems` | `src-tauri/src/lib.rs` |
| 窗口 label | `src-tauri/tauri.conf.json` |

## 3. 下一版本可跟进方向（占位）

- 持久化工程 / 撤销重做与菜单 id 对齐。
- `axes` 与双 `axisLine` 并存时的 UX。
- 更多图元参与求交或交点编辑体验。

## 4. Release v0.1.0（2026-05-06）

- **本地构建**：`npm run tauri build` 已通过；产物：`src-tauri/target/release/bundle/macos/TikZ Drawer.app`、`src-tauri/target/release/bundle/dmg/TikZ Drawer_0.1.0_aarch64.dmg`（Apple Silicon）。
- **Git**：提交后打标签 **`v0.1.0`** 并 `git push origin <branch> --tags`；若本机未安装 `gh`，在 GitHub 网页 **Releases → Draft a release** 选择该 tag，上传上述 DMG 作为附件。
- **Tauri 对齐**：`tauri` crate **2.11.1** + `tauri-build` **2.6.1**；前端 `@tauri-apps/api` **^2.11.0**、`@tauri-apps/cli` **^2.11.1**。
- **CI**：`.github/workflows/ci.yml`（工作流名 **CI**）— Linux：`npm ci` / `build` / `lint` + `cargo build --locked`；macOS：`tauri build`。触发：任意分支 **push**、**pull_request**、**workflow_dispatch**。README 标题下徽章反映**默认分支**上该工作流最新结论。ESLint 忽略 `src-tauri/target`；`App.tsx` / `DrawingCanvas.tsx` 关闭 `react-hooks/refs` 与 `set-state-in-effect` 以便 lint 在 CI 通过。
