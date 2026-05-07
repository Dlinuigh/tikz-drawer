# 封闭图形菜单统一与扇形三模式 — 实施记录

**日期**：2026-05-07  

## 已完成

- **工具栏**：矩形 / 多边形 / 正多边形 `closedFill` 浮层与圆一致：分区标题「画法」+ 静态说明 + `ClosedFillButtons`；按当前 `activeTool` 使用 `toolbar-floating-menu-rectangle|polygon|regularPolygon` 定位。
- **扇形**：三种 `tool-menu-item`（`convexPie` / `convexSegment` / `tangentConcave`）+ 填充两段；默认子工具 `convexPie`。
- **类型**：`SectorShapeMode` 三值；`SectorElement` 可选 `apex?`（遗留）；`sectorEffectiveShape` 迁移旧 `pie`/`segment`/`inverseArc`。
- **几何**：`tangentConcave`＝与外凸相同画法（圆心→两弧端），边界弧为**优弧**（`majorArcSectorPathD` / `majorArcSignedSweep`）；求交 `appendSector`、hit、bounds、TikZ 已对齐。
- **画布**：三种扇形均为同一三击草稿；`tangentConcave` 预览为优弧楔。
- **属性栏**：形状下拉三选项；切至内凹时用两切点角反推 `apex`。
- **文档**：`CHANGELOG.md`、`README.md` 本节。

## 校验

- `npm run build`、`npm run lint`（既有 `App.tsx` hooks 警告保留）。

## 后续补充（五种扇形 · TikZ · 构建）

- **`sectorToTikz`**：`concaveBracket` / `iceCream` 使用 `arc[…]`（两半径 + 一弧）；**对称弧楔 `majorArcPie`**：`第一点--P2 arc[delta=-minor(phi0,phi1)]--第一点`。
- **清理**：`DrawingCanvas` 未使用的 `iceCreamPathD` 导入；`sectorVariantGeometry` 去掉与 `export { sectorRimFromThreeClicks }` 重复的本地 import。
- **校验**：`npm run build` 通过（2026-05-07）。
