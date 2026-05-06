# Changelog

All notable changes to TikZ Drawer will be documented in this file.

## Unreleased

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

### Changed

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
