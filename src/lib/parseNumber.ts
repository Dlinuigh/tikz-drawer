/**
 * Parse decimals / integers or integer rationals `"a/b"` (optional spaces). Returns NaN if invalid.
 */
export function parseFlexibleNumber(raw: string): number {
  const s = raw.trim()
  if (!s || s === '-') {
    return NaN
  }

  const frac = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/)
  if (frac) {
    const a = parseInt(frac[1], 10)
    const b = parseInt(frac[2], 10)
    if (b === 0) {
      return NaN
    }
    return a / b
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

/** Split on ASCII or Chinese comma and parse each token; skip blanks and NaN tokens. */
export function parseCommaSeparatedNumbers(raw: string): number[] {
  const parts = raw.split(/[,，]/).map((p) => p.trim())
  const out: number[] = []
  for (const p of parts) {
    if (!p) {
      continue
    }
    const v = parseFlexibleNumber(p)
    if (!Number.isNaN(v)) {
      out.push(v)
    }
  }
  return out
}
