# TikZ Drawer Roadmap

This roadmap tracks planned TikZ drawing features and the recommended implementation order.

## Priority Table


| Area                 | Features                                                        | Priority    | Complexity  | Notes                                        |
| -------------------- | --------------------------------------------------------------- | ----------- | ----------- | -------------------------------------------- |
| Basic shapes         | Rectangle, circle, ellipse, polyline                            | High        | Medium      | Implemented as the first expansion batch.    |
| Path editing         | Drag endpoints, insert/delete polyline points, undo/redo        | High        | Medium-high | Improves daily drawing workflow.             |
| TikZ path options    | Fill, fill opacity, draw opacity, rounded corners, double lines | High        | Medium      | Keeps the UI close to TikZ path design.      |
| Arrow library        | More `arrows.meta` heads and arrow size controls                | High        | Medium      | Builds on existing start/end arrow controls. |
| Node system          | Text, anchor, relative position, shape, fill/draw               | High        | High        | Best handled as a dedicated phase.           |
| Coordinate helpers   | Named coordinates, relative coordinates, polar coordinates      | Medium-high | High        | Useful for TikZ-style precision editing.     |
| Construction helpers | Intersections, perpendicular lines, parallel lines              | Medium      | High        | Adds geometry-assistant behavior.            |
| Decorations          | Braces, snake, zigzag, markings                                 | Medium      | Medium      | Requires more TikZ libraries.                |
| Annotations          | Dimension lines, angle marks, coordinate labels                 | Medium-high | Medium      | Useful for teaching and paper figures.       |
| Layers               | Background/main/foreground, lock, hide, reorder                 | Medium      | Medium      | Needed for complex diagrams.                 |
| Asset library        | Common templates, flowchart presets, style presets              | Medium      | Medium      | Can live in a sidebar panel.                 |
| Import/export        | `.tex`, `.tikz`, PDF, SVG, PNG, copy TikZ                       | High        | Medium      | Completes the drawing workflow.              |


## Phase 1: Basic Shapes

- Rectangle: draw from two opposite corners and output TikZ `rectangle`.
- Circle: draw from a center point and radius point, output `circle[radius=...]`.
- Ellipse: draw from a center point and radius point, output `ellipse[x radius=..., y radius=...]`.
- Polyline: add points continuously and output a multi-segment `--` path.

## Phase 2: Path Editing

- Drag line endpoints and shape handles.
- Insert and delete polyline points.
- Add undo and redo.
- Add box selection, multi-selection, and ordering controls.

## Phase 3: More TikZ Path Options

- Add `fill`, `fill opacity`, and `draw opacity`.
- Add `rounded corners`, `double`, and `double distance`.
- Add `preaction` and `postaction`.
- Add more `arrows.meta` arrowheads and arrow size settings.

## Phase 4: Node System

- Add text nodes.
- Support `anchor`, `above`, `below`, `left`, `right`, and related position options.
- Support `shape`, `inner sep`, `outer sep`, `minimum width`, and `minimum height`.
- Support node fill, draw, and text color.

## Phase 5: Coordinates And Construction

- Add named coordinates.
- Add relative and polar coordinates.
- Add intersection, perpendicular, and parallel helpers.
- Add angle marks, dimension lines, and coordinate labels.

## Phase 6: Import And Export

- Export `.tex` and `.tikz`.
- Export PDF, SVG, and PNG.
- Copy generated TikZ code.
- Save and open project files.