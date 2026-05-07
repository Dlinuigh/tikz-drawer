import type { DrawingElement, LineElement, Point } from '../types/drawing'

const rk = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

function snapEndpoints(lines: LineElement[]): Map<string, Point> {
  const canon = new Map<string, Point>()
  for (const ln of lines) {
    for (const p of [ln.start, ln.end]) {
      const k = rk(p)
      if (!canon.has(k)) canon.set(k, p)
    }
  }
  return canon
}

function snap(p: Point, canon: Map<string, Point>): Point {
  return canon.get(rk(p)) ?? p
}

/**
 * If selected `line` elements form one simple cycle (each vertex degree 2 in union),
 * return vertices in traversal order.
 */
export function cycleFromSelectedLines(elements: DrawingElement[]): Point[] | null {
  const lines = elements.filter((e): e is LineElement => e.type === 'line')
  if (lines.length < 3) return null

  const canon = snapEndpoints(lines)
  type Edge = { u: string; v: string; a: Point; b: Point; ei: number }
  const edges: Edge[] = []
  for (const ln of lines) {
    const a = snap(ln.start, canon)
    const b = snap(ln.end, canon)
    const u = rk(a)
    const v = rk(b)
    if (u !== v) edges.push({ u, v, a, b, ei: edges.length })
  }

  const adj = new Map<string, Edge[]>()
  for (const e of edges) {
    if (!adj.has(e.u)) adj.set(e.u, [])
    if (!adj.has(e.v)) adj.set(e.v, [])
    adj.get(e.u)!.push(e)
    adj.get(e.v)!.push(e)
  }

  for (const [, inc] of adj) {
    if (inc.length !== 2) return null
  }

  const used = new Set<number>()
  const verts: Point[] = []

  let curKey = edges[0].u
  let prevKey = ''
  let guard = 0

  while (guard++ <= edges.length + 5) {
    const inc = adj.get(curKey) ?? []
    const nextEdge = inc.find((e) => {
      const other = e.u === curKey ? e.v : e.u
      return other !== prevKey && !used.has(e.ei)
    })
    if (!nextEdge) return null

    const here = nextEdge.u === curKey ? nextEdge.a : nextEdge.b
    const nextKey = nextEdge.u === curKey ? nextEdge.v : nextEdge.u

    verts.push(here)
    used.add(nextEdge.ei)
    prevKey = curKey
    curKey = nextKey

    if (used.size === edges.length && curKey === edges[0].u) {
      return verts
    }
  }

  return null
}
