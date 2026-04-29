# TikZ Drawer

TikZ Drawer 是一个 Tauri 桌面绘图软件，用按钮和表单绘制 TikZ 图形，并调用本机 LaTeX 编译预览。

## 功能

- 通过两点作图绘制直线。
- 通过起点、终点和给定角度绘制圆弧。
- 通过两点或多点绘制矩形、圆、椭圆和多段线。
- 通过界面控件修改箭头、线型、颜色和线宽。
- 实时生成 TikZ 代码。
- 调用本机 `pdflatex` 编译 TikZ，并显示编译日志和 PDF 路径。

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

- 详细说明：[`docs/README.md`](docs/README.md)
- 实现计划：[`docs/PLAN.md`](docs/PLAN.md)
- 路线图：[`docs/ROADMAP.md`](docs/ROADMAP.md)
- Canvas 路线图归档：[`docs/CANVAS_ROADMAP.md`](docs/CANVAS_ROADMAP.md)
- 变更记录：[`CHANGELOG.md`](CHANGELOG.md)
