import './style.css'

/* ------------------------------------------------------------------ */
/*  Base64 helpers (UTF-8 safe)                                        */
/* ------------------------------------------------------------------ */

function decodeB64(s: string): string {
  try {
    return decodeURIComponent(escape(atob(s)))
  } catch {
    return ''
  }
}

/* ------------------------------------------------------------------ */
/*  URL hash parsing                                                   */
/* ------------------------------------------------------------------ */

function parseHash(): { data: string; filename: string } | null {
  const hash = location.hash.replace(/^#/, '')
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const d = params.get('d')
  const f = params.get('f')
  if (!d || !f) return null

  const data = decodeB64(d)
  const filename = decodeB64(f)
  if (!data || !filename) return null

  return { data, filename }
}

/* ------------------------------------------------------------------ */
/*  Render                                                             */
/* ------------------------------------------------------------------ */

const app = document.getElementById('app')!

function renderEmpty(): void {
  app.innerHTML = `
    <div class="card">
      <div class="empty-icon">📂</div>
      <h1>Nothing to download</h1>
      <p>
        This page receives files from the
        <strong style="color:var(--orange)">n8n Dataset</strong> app.
        <br /><br />
        Open the app, run a workflow, and click <strong>Export</strong> —
        a download link will appear here.
      </p>
    </div>
  `
}

function renderDownload(data: string, filename: string): void {
  const sizeKB = ((new Blob([data]).size) / 1024).toFixed(1)
  const fullUrl = location.href

  function doDownload(): void {
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function doCopy(): void {
    navigator.clipboard.writeText(fullUrl).catch(() => {})
    const btn = document.getElementById('copy-btn') as HTMLButtonElement
    if (btn) { btn.textContent = '✓ Copied'; setTimeout(() => { btn.textContent = 'Copy Link' }, 2000) }
  }

  function doShare(): void {
    if (navigator.share) {
      navigator.share({ url: fullUrl }).catch(() => {})
    } else {
      doCopy()
    }
  }

  app.innerHTML = `
    <div class="card">
      <img src="/logo.png" alt="n8n Dataset" class="logo" />
      <h1>Ready to Download</h1>
      <p>Your file has been loaded. Click below to save it.</p>

      <div class="file-info">
        <div class="name">${escapeHtml(filename)}</div>
        <div class="size">${sizeKB} KB</div>
      </div>

      <div class="status ok">● Auto-download started…</div>

      <div class="url-box">${escapeHtml(fullUrl)}</div>

      <div class="actions">
        <button id="dl-btn" class="btn btn-primary">⬇ Download</button>
        <button id="copy-btn" class="btn btn-secondary">Copy Link</button>
        <button id="share-btn" class="btn btn-secondary">↗ Share</button>
      </div>
    </div>
  `

  document.getElementById('dl-btn')!.onclick = doDownload
  document.getElementById('copy-btn')!.onclick = doCopy
  document.getElementById('share-btn')!.onclick = doShare

  /* auto-download on page load, then redirect to about:blank */
  setTimeout(() => {
    doDownload()
    document.querySelector('.status')!.textContent = '✓ Download started'
    setTimeout(() => { location.href = 'about:blank' }, 1000)
  }, 500)
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */

const info = parseHash()
if (info) {
  renderDownload(info.data, info.filename)
} else {
  renderEmpty()
}
