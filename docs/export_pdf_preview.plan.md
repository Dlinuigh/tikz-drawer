# 计划：PDF 预览、临时目录与导出（2026-05-06）

## 行为

- 编译目录固定为 OS 临时路径下的 `tikz-drawer/workspace`，每次编译前清空，避免 aux/log/pdf 堆积。
- 预览：`convertFileSrc` 内嵌 iframe；备用「系统打开 PDF」（`tauri-plugin-opener`）。
- 前端：复制 TikZ；导出 PDF/PNG（`tauri-plugin-dialog` 另存为 + `copy_path`）；PNG 由后端调用 `pdftocairo` / ImageMagick / Ghostscript 之一栅格化首页。

## ACL

- `open_path` 需在 capability 里为 `opener:allow-open-path` 配置 **scope**：例如 `{ "path": "$TEMP/tikz-drawer/**" }`，否则仅有权限标识而无路径范围仍会拒绝临时目录下的 PDF。

## 依赖

- npm：`@tauri-apps/plugin-dialog`、`@tauri-apps/plugin-opener`
- Cargo：`tauri-plugin-dialog`、`tauri-plugin-opener`
- 可选 CLI（PNG）：Poppler `pdftocairo`、`magick`/`convert`、`gs`
