---
name: ui-overhaul-vscode-layout
overview: "Comprehensive UI overhaul: VSCode-like fixed layout, grid customization, expanded color palette with edit mode, floating style panels, and macOS native menu bar integration."
todos:
  - id: grid-types-state
    content: Add GridConfig type to drawing.ts and grid state management in App.tsx
    status: completed
  - id: color-palette-expand
    content: Expand ColorPicker to 16-color palette with edit mode and + button, persist in localStorage
    status: completed
  - id: floating-style-panel
    content: Create FloatingStylePanel component for style controls as popup
    status: completed
  - id: compact-toolbar
    content: Redesign Toolbar as compact tool strip with style trigger button
    status: completed
  - id: vscode-layout
    content: Overhaul App.css and App.tsx to VSCode-like fixed window layout
    status: completed
  - id: status-bar
    content: Create StatusBar component with compile status, grid info, coordinates
    status: completed
  - id: collapsible-panels
    content: Make PropertiesPanel and PreviewPanel collapsible
    status: completed
  - id: grid-dynamic-render
    content: Modify DrawingCanvas gridLines to use dynamic GridConfig
    status: completed
  - id: macos-menu
    content: Integrate macOS native menu bar with File and Compile menus in lib.rs
    status: completed
  - id: remove-scroll
    content: Set overflow:hidden on body/root, finalize window config
    status: completed
isProject: false
---

# UI Overhaul Plan

## Overall Architecture

Transform the current web-page layout into a fixed-window VSCode-like application with:
- **Compact left toolbar** (always visible draw tool buttons)
- **Center canvas area** (scrollable/zoomable)
- **Right properties panel** (collapsible)
- **Bottom preview drawer** (collapsible)
- **Bottom status bar** (compilation status, coordinates, grid info)
- **macOS native menu bar** (File, Compile actions)
- **Floating popups** for style controls and grid settings

## Implementation Steps

### Step 1: Add GridConfig type and state management

- Add `GridConfig` type to `src/types/drawing.ts`
  - `showGrid: boolean`
  - `gridStep: number`
  - `gridColor: string`
  - `gridLineStyle: 'solid' | 'dashed' | 'dotted'`
  - `gridLineWidth: number`
- Add `gridConfig` state and relevant `useState` in `App.tsx`
- Pass grid config to `DrawingCanvas` as props
- Modify `gridLines()` in `DrawingCanvas.tsx` and `grid-line` CSS to use dynamic config

### Step 2: Expand ColorPicker with 16-color palette and edit mode

- Refactor `src/components/ColorPicker.tsx`
  - Change preset colors from fixed array to state-managed list (max 16)
  - Add `+` button to append new colors via color picker
  - Add "edit" toggle button beside the color section label
  - Edit mode: clicking a preset opens its own color picker for adjustment
  - Support direct hex code input (already exists from react-colorful)
  - Persist custom presets in localStorage

### Step 3: Create floating style panel

- New file `src/components/FloatingStylePanel.tsx`
  - Contains all style controls: arrows, line style, color picker, line width, cap, join, opacity
  - Renders as a floating popup near the trigger button
  - Auto-closes on click outside or escape
  - Use React ref + `useEffect` for click-outside detection

### Step 4: Redesign Toolbar as compact tool strip

- Refactor `src/components/Toolbar.tsx`
  - Keep only primary tool buttons (select, line, arc, rectangle, circle, ellipse, polyline, axes) as compact icon/text buttons
  - Add a "Style" trigger button that opens `FloatingStylePanel`
  - Add subtool indicators (e.g., for line: twoPoints/pointSlope shown as small toggle beside the line button)
  - Add "Clear" button at bottom
  - Narrow width (~56-64px)

### Step 5: Complete layout overhaul to VSCode-like fixed window

- Remove `.app-header` section entirely from `App.tsx`
- Rewrite `src/App.css` layout:
  - `.app-shell`: `height: 100vh`, `overflow: hidden`, flex layout
  - Three-column layout with fixed left/right and flexible center
  - Bottom area split between status bar and collapsible preview drawer
  - Canvas area fills available space, scrollable internally
- Update `tauri.conf.json` window config: set appropriate initial size and resizable behavior

### Step 6: Add bottom status bar

- New file `src/components/StatusBar.tsx`
  - Shows compile status, grid info (step, on/off), current coordinates, tool hint
  - Fixed at bottom, compact height (~28-32px)

### Step 7: Make right panel and bottom preview collapsible

- Refactor `src/components/PropertiesPanel.tsx`
  - Add collapse/expand toggle button in header
  - When collapsed, show only slim handle bar
- Refactor `src/components/PreviewPanel.tsx`
  - Convert to bottom drawer style
  - Collapse/expand with a tab/handle at top
  - When collapsed, show only a thin bar with compile status

### Step 8: macOS native menu bar integration

- Modify `src-tauri/src/lib.rs`:
  - Use `tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder}` to create native menus
  - File menu: New (clear canvas), Export PDF, Export PNG, separator, Quit
  - Compile menu: Compile, Copy TikZ Code, Open PDF
  - Handle menu events via `app.on_menu_event()`, emit events to frontend
- Add frontend listener in `App.tsx` using `listen()` from `@tauri-apps/api/event`
- Remove compile/copy/export buttons from `PreviewPanel.tsx` (now in menu bar)

### Step 9: Remove page scrolling and set fixed window behavior

- Set `body` and `#root` to `height: 100vh; overflow: hidden` in `src/index.css`
- Add `decorations: true` and fix the window size in `tauri.conf.json`
- Ensure canvas SVG fills available space with internal scroll/zoom

## Files to Create
- `src/components/FloatingStylePanel.tsx`
- `src/components/StatusBar.tsx`
- `src/components/GridSettingsPanel.tsx` (floating popup for grid config)

## Files to Modify
- `src/App.tsx` -- New layout, grid state, menu event listeners, remove header
- `src/App.css` -- Complete layout rewrite
- `src/index.css` -- Fix body overflow
- `src/types/drawing.ts` -- Add GridConfig type, expand presetColors handling
- `src/components/Toolbar.tsx` -- Simplify to compact tool strip
- `src/components/ColorPicker.tsx` -- 16-color palette, edit mode, + button
- `src/components/DrawingCanvas.tsx` -- Dynamic grid rendering from config
- `src/components/PropertiesPanel.tsx` -- Collapsible sidebar
- `src/components/PreviewPanel.tsx` -- Collapsible bottom drawer, remove UI buttons
- `src/lib/geometry.ts` -- Accept grid config in gridLines
- `src-tauri/src/lib.rs` -- macOS menu bar setup
- `src-tauri/tauri.conf.json` -- Window size/config
- `src-tauri/Cargo.toml` -- May need menu dependency (check Tauri 2.x requirements)

## Files to Remove
- None (the app-header is in App.tsx, just remove the element)