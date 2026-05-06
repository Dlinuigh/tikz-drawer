import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { openPath } from '@tauri-apps/plugin-opener'
import { useEffect, useMemo, useState } from 'react'

type CompileResult = {
  success: boolean
  log: string
  pdfPath?: string
}

type PreviewPanelProps = {
  tikzCode: string
  compileResult: CompileResult | null
  isCompiling: boolean
  onCompile: () => void
  onClose: () => void
}

export function PreviewPanel({ tikzCode, compileResult, isCompiling, onCompile, onClose }: PreviewPanelProps) {
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const [statusHint, setStatusHint] = useState<string | null>(null)

  const pdfSrc = useMemo(() => {
    if (!compileResult?.success || !compileResult.pdfPath) {
      return null
    }
    return convertFileSrc(compileResult.pdfPath)
  }, [compileResult])

  useEffect(() => {
    if (!statusHint) {
      return
    }
    const t = window.setTimeout(() => setStatusHint(null), 3200)
    return () => window.clearTimeout(t)
  }, [statusHint])

  const copyTikz = async () => {
    try {
      await navigator.clipboard.writeText(tikzCode)
      setCopyHint('已复制')
      window.setTimeout(() => setCopyHint(null), 2000)
    } catch {
      setStatusHint('复制失败（请检查剪贴板权限）')
    }
  }

  const openSystemPdf = async () => {
    const p = compileResult?.pdfPath
    if (!p) {
      return
    }
    try {
      await openPath(p)
    } catch (e) {
      setStatusHint(e instanceof Error ? e.message : String(e))
    }
  }

  const exportPdf = async () => {
    const src = compileResult?.pdfPath
    if (!src) {
      return
    }
    const dest = await save({
      defaultPath: 'tikz-drawer.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (!dest) {
      return
    }
    try {
      await invoke('copy_path', { source: src, destination: dest })
      setStatusHint('PDF 已保存')
    } catch (e) {
      setStatusHint(e instanceof Error ? e.message : String(e))
    }
  }

  const exportPng = async () => {
    const pdfPath = compileResult?.pdfPath
    if (!pdfPath) {
      return
    }
    try {
      const pngPath = await invoke<string>('rasterize_pdf_first_page', { pdfPath })
      const dest = await save({
        defaultPath: 'tikz-drawer.png',
        filters: [{ name: 'PNG', extensions: ['png'] }],
      })
      if (!dest) {
        return
      }
      await invoke('copy_path', { source: pngPath, destination: dest })
      setStatusHint('PNG 已保存')
    } catch (e) {
      setStatusHint(e instanceof Error ? e.message : String(e))
    }
  }

  const canUsePdf = Boolean(compileResult?.success && compileResult.pdfPath)

  return (
    <section className="preview-panel">
      <div className="preview-header">
        <h2>TikZ 与预览</h2>
        <div className="preview-actions">
          <button type="button" onClick={onCompile} disabled={isCompiling}>
            {isCompiling ? '编译中…' : '编译'}
          </button>
          <button type="button" onClick={copyTikz}>
            复制代码
          </button>
          <button disabled={!canUsePdf} type="button" onClick={openSystemPdf}>
            打开 PDF
          </button>
          <button disabled={!canUsePdf} type="button" onClick={exportPdf}>
            导出 PDF
          </button>
          <button disabled={!canUsePdf} type="button" onClick={exportPng}>
            导出 PNG
          </button>
          <button className="compact" type="button" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      {copyHint && <p className="preview-inline-hint">{copyHint}</p>}
      {statusHint && <p className="preview-inline-hint">{statusHint}</p>}

      <pre className="code-output">{tikzCode}</pre>

      {pdfSrc && (
        <div className="pdf-preview-wrap">
          <p className="hint">内嵌预览（若空白请点「系统打开 PDF」）。编译产物在临时目录，每次编译会清空工作区。</p>
          <iframe className="pdf-preview-frame" src={pdfSrc} title="PDF 预览" />
        </div>
      )}

      {compileResult && (
        <div className={compileResult.success ? 'compile-log success' : 'compile-log error'}>
          <strong>{compileResult.success ? '编译成功' : '编译失败'}</strong>
          {compileResult.pdfPath && <p className="pdf-path-line">临时 PDF：{compileResult.pdfPath}</p>}
          <div className="compile-log-scroll">
            <pre>{compileResult.log}</pre>
          </div>
        </div>
      )}
    </section>
  )
}

export type { CompileResult }
