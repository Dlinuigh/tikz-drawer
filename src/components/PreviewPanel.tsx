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
}

export function PreviewPanel({ tikzCode, compileResult, isCompiling, onCompile }: PreviewPanelProps) {
  return (
    <section className="preview-panel">
      <div className="preview-header">
        <h2>TikZ 代码</h2>
        <button type="button" onClick={onCompile} disabled={isCompiling}>
          {isCompiling ? '编译中...' : '调用 LaTeX 编译'}
        </button>
      </div>
      <pre className="code-output">{tikzCode}</pre>

      {compileResult && (
        <div className={compileResult.success ? 'compile-log success' : 'compile-log error'}>
          <strong>{compileResult.success ? '编译成功' : '编译失败'}</strong>
          {compileResult.pdfPath && <p>PDF：{compileResult.pdfPath}</p>}
          <pre>{compileResult.log}</pre>
        </div>
      )}
    </section>
  )
}

export type { CompileResult }
