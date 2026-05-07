# TikZ Drawer

[![CI](https://github.com/Dlinuigh/tikz-drawer/actions/workflows/ci.yml/badge.svg)](https://github.com/Dlinuigh/tikz-drawer/actions/workflows/ci.yml)

TikZ Drawer 是一个 Tauri 桌面绘图软件，用按钮和表单绘制 TikZ 图形，并调用本机 LaTeX 编译预览。

徽章表示**默认分支**上 **[CI](https://github.com/Dlinuigh/tikz-drawer/actions/workflows/ci.yml)** 工作流最近一次运行是否成功（Linux：`npm build` / `lint` + `cargo build`；macOS：`tauri build`）。任意分支的推送与 PR 也会运行同一工作流；详情请点击徽章进入 Actions。

## 功能

- **图形**：直线（两点 / 点斜）、圆弧、矩形、圆、椭圆、多段线（可选闭合）、多边形、扇形、正多边形、圆锥曲线（采样）、函数/隐式曲线（采样）、`\\foreach` 代码块、点；**填色拾取**对闭合区域套用填充；**坐标轴**（`axisLine` 单轴或旧版合并 `axes`）；**交点工具**与在交点处**分割**线/多段线/弧；**多选直线**可**合并为填充区域**（闭合环路）。
- **画布**：平移视图（Alt / 中键拖拽）、网格与导出网格可配置；坐标轴在画布上的 X/Y 显隐由 **macOS View 菜单** 分别控制（文案随状态切换）。
- **界面**：右侧属性栏默认收起（☰ / 菜单「展开属性栏」）；紧凑工具栏、浮动样式面板、源码 / 画布 tab、编译与 PNG/PDF 导出。
- **样式**：箭头、线型、颜色（预设）、线宽、端点/连接、不透明度；闭合图元另有**填充**（纯色 / TikZ `patterns`）。**极坐标**：属性栏可从原点按极径与角添加点。
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

## GitHub Release（macOS）

本地打包 DMG / `.app`：

```sh
npm install
npm run tauri build
```

产物通常在 `src-tauri/target/release/bundle/dmg/`（`.dmg`）与 `src-tauri/target/release/bundle/macos/`（`.app`）。

创建标签并推送后，在 GitHub 网页 **Releases → Draft a new release**：

1. **Choose a tag**：新建 `v0.1.0`（或与 `package.json` / `tauri.conf.json` 中版本一致）。
2. Target 选默认分支；标题例如 `v0.1.0`。
3. 说明可从 [`CHANGELOG.md`](CHANGELOG.md) 中 **0.1.0** 一节摘录。
4. 将构建好的 **`.dmg`** 作为附件上传（可选同时上传 `.app.zip`）。

命令行示例（需已 [安装 GitHub CLI](https://cli.github.com/) 且已登录）：

```sh
git add -A && git commit -m "chore: release v0.1.0"
git tag -a v0.1.0 -m "TikZ Drawer v0.1.0"
git push origin HEAD
git push origin v0.1.0
gh release create v0.1.0 --title "TikZ Drawer v0.1.0" --notes "首个 macOS 发行构建；变更见仓库内 CHANGELOG.md § 0.1.0。" ./src-tauri/target/release/bundle/dmg/*.dmg
```

（若不用 `gh`，只执行 `git push` 与 `git push origin v0.1.0`，再在网页上传附件即可。）

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
