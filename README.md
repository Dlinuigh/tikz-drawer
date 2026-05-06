# TikZ Drawer

TikZ Drawer 是一个 Tauri 桌面绘图软件，用按钮和表单绘制 TikZ 图形，并调用本机 LaTeX 编译预览。

## 功能

- **图形**：直线（两点 / 点斜）、圆弧、矩形、圆、椭圆、多段线、点；**坐标轴**（`axisLine` 单轴或旧版合并 `axes`，对话框可选只建 x/y）；**交点工具**生成 `intersectionPoint` 图元。
- **画布**：平移视图（Alt / 中键拖拽）、网格与导出网格可配置；坐标轴在画布上的 X/Y 显隐由 **macOS View 菜单** 分别控制（文案随状态切换）。
- **界面**：右侧属性栏默认收起（☰ / 菜单「展开属性栏」）；紧凑工具栏、浮动样式面板、源码 / 画布 tab、编译与 PNG/PDF 导出。
- **样式**：箭头、线型、颜色（预设）、线宽、端点/连接、不透明度等。
- **输出**：实时 TikZ；本机 **`pdflatex`** 编译、日志与 PDF；可选栅格导出至 PDF。
- **菜单**：macOS 原生菜单栏与快捷键；菜单事件经 Tauri 转发至前端（主窗口 `main`）。

## 开发运行

```sh
npm install
npm run tauri dev
```

## 验证

```sh
npm run build
npm run lint
cd src-tauri && cargo check
```

## 依赖

- Node.js 和 npm
- Rust 工具链
- 本机 LaTeX 发行版，需提供 `pdflatex`

## 文档

- 文档索引与交接：[`docs/README.md`](docs/README.md)、[`docs/plan_handoff_next_version.md`](docs/plan_handoff_next_version.md)
- 实现计划：[`docs/PLAN.md`](docs/PLAN.md)
- 路线图：[`docs/ROADMAP.md`](docs/ROADMAP.md)
- Canvas 路线图归档：[`docs/CANVAS_ROADMAP.md`](docs/CANVAS_ROADMAP.md)
- 变更记录：[`CHANGELOG.md`](CHANGELOG.md)
