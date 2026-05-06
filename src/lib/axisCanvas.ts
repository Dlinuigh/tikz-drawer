import type { DrawingElement } from '../types/drawing'

const EPS = 1e-9

function axesHasSpanX(e: Extract<DrawingElement, { type: 'axes' }>): boolean {
  return Math.abs(e.xMax - e.xMin) > EPS
}

function axesHasSpanY(e: Extract<DrawingElement, { type: 'axes' }>): boolean {
  return Math.abs(e.yMax - e.yMin) > EPS
}

/** 画布上是否存在可显示的该朝向坐标轴图元 */
export function hasAxisOrientation(elements: DrawingElement[], orientation: 'x' | 'y'): boolean {
  for (const e of elements) {
    if (e.type === 'axisLine' && e.orientation === orientation) return true
    if (e.type === 'axes') {
      if (orientation === 'x' && axesHasSpanX(e)) return true
      if (orientation === 'y' && axesHasSpanY(e)) return true
    }
  }
  return false
}

/** 该朝向是否至少有一根轴在画布上为显示状态 */
export function anyAxisOrientationShown(elements: DrawingElement[], orientation: 'x' | 'y'): boolean {
  for (const e of elements) {
    if (e.type === 'axisLine' && e.orientation === orientation) {
      if (e.canvasVisible !== false) return true
    }
    if (e.type === 'axes') {
      const spanOk = orientation === 'x' ? axesHasSpanX(e) : axesHasSpanY(e)
      if (!spanOk) continue
      const shown =
        e.canvasVisible !== false &&
        (orientation === 'x' ? e.canvasVisibleX !== false : e.canvasVisibleY !== false)
      if (shown) return true
    }
  }
  return false
}

function applyOrientationToggle(
  e: DrawingElement,
  orientation: 'x' | 'y',
  nextVisible: boolean,
): DrawingElement {
  if (e.type === 'axisLine' && e.orientation === orientation) {
    return { ...e, canvasVisible: nextVisible }
  }

  if (e.type === 'axes') {
    const hasX = axesHasSpanX(e)
    const hasY = axesHasSpanY(e)
    if (orientation === 'x' && !hasX) return e
    if (orientation === 'y' && !hasY) return e

    const fullyOff = e.canvasVisible === false

    if (nextVisible) {
      if (fullyOff) {
        if (orientation === 'x') {
          return { ...e, canvasVisible: true, canvasVisibleX: true, canvasVisibleY: false }
        }
        return { ...e, canvasVisible: true, canvasVisibleX: false, canvasVisibleY: true }
      }
      if (orientation === 'x') {
        return { ...e, canvasVisible: true, canvasVisibleX: true }
      }
      return { ...e, canvasVisible: true, canvasVisibleY: true }
    }

    const merged: DrawingElement = {
      ...e,
      ...(orientation === 'x' ? { canvasVisibleX: false } : { canvasVisibleY: false }),
    }
    if (merged.type !== 'axes') return e
    const xOn = merged.canvasVisibleX !== false
    const yOn = merged.canvasVisibleY !== false
    return { ...merged, canvasVisible: xOn || yOn }
  }

  return e
}

/** 切换某一朝向在所有相关图元上的画布可见性（该朝向任意一根显示则全部隐藏，否则全部显示） */
export function toggleAxisOrientationVisibility(
  elements: DrawingElement[],
  orientation: 'x' | 'y',
): DrawingElement[] {
  if (!hasAxisOrientation(elements, orientation)) return elements
  const nextVisible = !anyAxisOrientationShown(elements, orientation)
  return elements.map((el) => applyOrientationToggle(el, orientation, nextVisible))
}
