/**
 * Tiny math evaluator for plot expressions (explicit mode).
 * Allowed: numbers, + - * / ^, (), pi, e, sin cos tan sqrt abs exp log
 * Variable is always one of x | t | theta (passed in).
 */

type Tok =
  | { k: 'num'; v: number }
  | { k: 'var' }
  | { k: 'op'; op: string }
  | { k: 'fun'; name: string }
  | { k: 'lp' }
  | { k: 'rp' }

const FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: (x) => Math.sqrt(Math.max(0, x)),
  abs: Math.abs,
  exp: Math.exp,
  log: (x) => Math.log(Math.max(1e-300, x)),
}

function tokenize(raw: string, varLetter: string): Tok[] {
  const s = raw.replace(/\s+/g, '').toLowerCase().replace(/theta/g, varLetter)
  const out: Tok[] = []
  let i = 0

  const atUnaryMinus = () =>
    i === 0 || '+-*/(^'.includes(s[i - 1])

  while (i < s.length) {
    const c = s[i]

    if ((c >= '0' && c <= '9') || c === '.' || (c === '-' && i + 1 < s.length && /[\d.]/.test(s[i + 1]) && atUnaryMinus())) {
      let j = i
      if (s[j] === '-') j++
      while (j < s.length && ((s[j] >= '0' && s[j] <= '9') || s[j] === '.')) j++
      const num = Number.parseFloat(s.slice(i, j))
      if (Number.isNaN(num)) throw new Error('bad number')
      out.push({ k: 'num', v: num })
      i = j
      continue
    }

    if (c === varLetter) {
      out.push({ k: 'var' })
      i++
      continue
    }

    if (c === 'p' && s.slice(i, i + 2) === 'pi') {
      out.push({ k: 'num', v: Math.PI })
      i += 2
      continue
    }

    if (c === 'e' && (i === s.length - 1 || !/[a-z]/.test(s[i + 1]))) {
      out.push({ k: 'num', v: Math.E })
      i++
      continue
    }

    const names = ['sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'log'] as const
    let hit = false
    for (const name of names) {
      if (s.startsWith(name, i) && (i + name.length >= s.length || s[i + name.length] === '(')) {
        out.push({ k: 'fun', name })
        i += name.length
        hit = true
        break
      }
    }
    if (hit) continue

    if ('+-*/^'.includes(c)) {
      out.push({ k: 'op', op: c })
      i++
      continue
    }
    if (c === '(') {
      out.push({ k: 'lp' })
      i++
      continue
    }
    if (c === ')') {
      out.push({ k: 'rp' })
      i++
      continue
    }

    throw new Error(`unexpected '${c}'`)
  }
  return out
}

function parseExpr(tokens: Tok[], pos: { i: number }, varValue: number): number {
  const parseAtom = (): number => {
    const t = tokens[pos.i]
    if (!t) throw new Error('unexpected end')
    if (t.k === 'num') {
      pos.i++
      return t.v
    }
    if (t.k === 'var') {
      pos.i++
      return varValue
    }
    if (t.k === 'fun') {
      pos.i++
      const lp = tokens[pos.i]
      if (!lp || lp.k !== 'lp') throw new Error('expected (')
      pos.i++
      const arg = parseExpr(tokens, pos, varValue)
      const rp = tokens[pos.i]
      if (!rp || rp.k !== 'rp') throw new Error('expected )')
      pos.i++
      const fn = FUNCS[t.name]
      return fn(arg)
    }
    if (t.k === 'lp') {
      pos.i++
      const inner = parseExpr(tokens, pos, varValue)
      const rp = tokens[pos.i]
      if (!rp || rp.k !== 'rp') throw new Error('expected )')
      pos.i++
      return inner
    }
    if (t.k === 'op' && t.op === '-') {
      pos.i++
      return -parseAtom()
    }
    throw new Error('bad atom')
  }

  const parsePow = (): number => {
    let left = parseAtom()
    while (pos.i < tokens.length) {
      const t = tokens[pos.i]
      if (t.k === 'op' && t.op === '^') {
        pos.i++
        const right = parseAtom()
        left = Math.sign(left) * Math.abs(left) ** right
      } else break
    }
    return left
  }

  const parseMul = (): number => {
    let left = parsePow()
    while (pos.i < tokens.length) {
      const t = tokens[pos.i]
      if (t.k === 'op' && (t.op === '*' || t.op === '/')) {
        pos.i++
        const right = parsePow()
        left = t.op === '*' ? left * right : left / right
      } else break
    }
    return left
  }

  const parseAdd = (): number => {
    let left = parseMul()
    while (pos.i < tokens.length) {
      const t = tokens[pos.i]
      if (t.k === 'op' && (t.op === '+' || t.op === '-')) {
        pos.i++
        const right = parseMul()
        left = t.op === '+' ? left + right : left - right
      } else break
    }
    return left
  }

  return parseAdd()
}

export function evaluateExpression(expr: string, mode: 'cartesian' | 'polar', value: number): number {
  const varLetter = mode === 'polar' ? 't' : 'x'
  const prep = expr.trim()
  if (!prep) throw new Error('empty')
  const toks = tokenize(prep, varLetter)
  const pos = { i: 0 }
  const v = parseExpr(toks, pos, value)
  if (pos.i !== toks.length) throw new Error('trailing junk')
  return v
}
