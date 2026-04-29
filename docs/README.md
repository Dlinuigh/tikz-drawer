# TikZ Drawer

TikZ Drawer 是一个 Tauri 桌面绘图软件，用按钮和表单完成常见 TikZ 图形绘制，不需要直接手写 TikZ 代码。

## 功能

- 绘制直线：点击起点和终点完成两点作图。
- 绘制圆弧：点击起点和终点，并使用给定角度生成圆弧。
- 绘制基础图元：矩形、圆、椭圆和多段线。
- 修改样式：通过固定按钮或属性面板修改箭头、线型、颜色和线宽。
- 生成 TikZ：根据画布图元实时生成 TikZ 代码。
- 本机编译：通过 Tauri 调用本机 `pdflatex` 编译 TikZ，返回编译日志和 PDF 路径。

## 运行

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

## 相关文档

- 实现计划：[`PLAN.md`](PLAN.md)
- 功能路线图：[`ROADMAP.md`](ROADMAP.md)
- Canvas 路线图归档：[`CANVAS_ROADMAP.md`](CANVAS_ROADMAP.md)
- 变更记录：[`../CHANGELOG.md`](../CHANGELOG.md)
