# Canvas Roadmap Snapshot

This document archives the feature roadmap that was also created as a Cursor Canvas.

## Summary

- Total feature areas: 12
- High-priority areas: 5
- Recommended second-phase areas: 3

## Recommended Priority

- Basic shapes
- Path editing
- TikZ path styles
- Import and export
- Node system

## Feature Table

| Category | Possible Features | Priority | Complexity | Notes |
| --- | --- | --- | --- | --- |
| 基础图元 | 矩形、圆、椭圆、多段线、折线、贝塞尔曲线 | 高 | 中 | 扩展工具栏和 `DrawingElement` 类型 |
| 路径编辑 | 拖动端点、插入/删除控制点、吸附网格、撤销重做 | 高 | 中高 | 提升绘图软件可用性 |
| TikZ 样式 | `fill`、`draw`、`opacity`、`rounded corners`、`double`、`preaction`、`postaction` | 高 | 中 | 继续贴近 TikZ path options |
| 箭头库 | `Latex`、`Stealth`、`Triangle`、`Circle`、`Bar`、`Hooks` 和箭头尺寸 | 高 | 中 | 依赖 `arrows.meta` |
| 节点 Node | 文字、`anchor`、`above`、`below`、`left`、`right`、`shape`、`inner sep`、`fill`、`draw` | 高 | 高 | 第二阶段核心能力 |
| 坐标辅助 | 命名坐标、相对坐标、极坐标、交点、垂线/平行线辅助 | 中高 | 高 | 更接近 TikZ/几何作图 |
| 变换 | `rotate`、`scale`、`shift`、`xscale`、`yscale`、局部 `scope` | 中高 | 中高 | 需要属性模型支持 `scope` |
| 装饰 | `brace`、`snake`、`zigzag`、`markings`、`path morphing` | 中 | 中 | 依赖 decorations 库 |
| 标注 | 尺寸线、角度标注、文本标签、坐标标签 | 中高 | 中 | 适合教学/论文图 |
| 图层 | `background`、`main`、`foreground`、锁定、隐藏、排序 | 中 | 中 | 改善复杂图管理 |
| 素材库 | 常用 TikZ 模板、箭头样式预设、流程图组件 | 中 | 中 | 可做侧栏素材面板 |
| 导入导出 | `.tex`、`.tikz` 导出、PDF/SVG/PNG 输出、复制 TikZ 代码 | 高 | 中 | 直接提升完整工作流 |

## Next Recommendation

下一步建议优先实现基础图元和路径编辑：矩形、圆、椭圆、多段线、拖动端点、撤销重做。这些能最大化提升绘图体验，同时不会过早引入 node/scope 的复杂度。
