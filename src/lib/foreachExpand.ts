/** Parse simple TikZ-like lists: `1,...,10`, `{a,b,c}`, `1,2,3` */
export function expandForeachList(listExpr: string, limit: number): string[] {
  const s = listExpr.trim()
  if (!s) return []

  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1).trim()
    const parts = inner.split(',').map((x) => x.trim()).filter(Boolean)
    return parts.slice(0, Math.max(0, limit))
  }

  const dots = /\.\.\./
  if (dots.test(s)) {
    const parts = s.split(/\s*\.\.\.\s*/)
    if (parts.length === 2) {
      const start = Number.parseFloat(parts[0].replace(/,/g, '').trim())
      const end = Number.parseFloat(parts[1].replace(/,/g, '').trim())
      if (!Number.isFinite(start) || !Number.isFinite(end)) return []
      const step = start <= end ? 1 : -1
      const out: string[] = []
      for (let x = start; step > 0 ? x <= end + 1e-9 : x >= end - 1e-9; x += step) {
        out.push(String(Math.round(x * 1e6) / 1e6))
        if (out.length >= limit) break
      }
      return out
    }
  }

  const csv = s.split(',').map((x) => x.trim()).filter(Boolean)
  return csv.slice(0, limit)
}
