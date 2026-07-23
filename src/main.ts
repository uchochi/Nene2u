import './style.css'

/* ------------------------------------------------------------------ */
/*  Base64 decode (UTF-8 safe)                                         */
/* ------------------------------------------------------------------ */

function decodeBase64(raw: string): string {
  try {
    return decodeURIComponent(escape(atob(raw)))
  } catch {
    return ''
  }
}

/* ------------------------------------------------------------------ */
/*  Hash parser                                                        */
/* ------------------------------------------------------------------ */

interface DownloadPayload {
  content: string
  filename: string
}

function parseHash(): DownloadPayload | null {
  const raw = location.hash.slice(1)
  if (!raw) return null

  const params = new URLSearchParams(raw)
  const data = params.get('d')
  const file = params.get('f')
  if (!data || !file) return null

  const content = decodeBase64(data)
  const filename = decodeBase64(file)
  if (!content || !filename) return null

  return { content, filename }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function escapeHtml(str: string): string {
  const el = document.createElement('span')
  el.textContent = str
  return el.innerHTML
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/* ------------------------------------------------------------------ */
/*  Download engine                                                    */
/* ------------------------------------------------------------------ */

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.hidden = true
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/*  Render: empty state                                                */
/* ------------------------------------------------------------------ */

function renderEmpty(root: HTMLElement): void {
  root.innerHTML = `
    <div class="card card--enter">
      <div class="empty-badge">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <h1>Nothing to download</h1>
      <p class="muted">
        This page receives files from the
        <strong class="brand">ooguy</strong> app.
      </p>
      <div class="hint">
        Open the app, run a workflow, and tap <strong>Export</strong> —
        your download will appear here automatically.
      </div>
    </div>
  `
}

/* ------------------------------------------------------------------ */
/*  Render: download state                                             */
/* ------------------------------------------------------------------ */

function renderDownload(root: HTMLElement, payload: DownloadPayload): void {
  const bytes = new Blob([payload.content]).size
  const url = location.href

  root.innerHTML = `
    <div class="card card--enter">
      <img src="/logo.png" alt="ooguy" class="logo" />

      <h1>Ready to Download</h1>
      <p class="muted">Your file has been prepared. Tap below to save it.</p>

      <div class="file-meta">
        <div class="file-name">${escapeHtml(payload.filename)}</div>
        <div class="file-size">${fileSize(bytes)}</div>
      </div>

      <div class="progress" id="progress">
        <div class="progress-bar"></div>
      </div>
      <div class="status" id="status">
        <span class="dot dot--pending"></span> Preparing download&hellip;
      </div>

      <div class="url-box" id="url-box">${escapeHtml(url)}</div>

      <div class="actions">
        <button class="btn btn--primary" id="btn-dl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
        <button class="btn btn--secondary" id="btn-copy">Copy Link</button>
        <button class="btn btn--secondary" id="btn-share">Share</button>
      </div>
    </div>
  `

  const $status = document.getElementById('status')!
  const $progress = document.getElementById('progress')!

  /* button wiring */
  document.getElementById('btn-dl')!.addEventListener('click', () => {
    triggerDownload(payload.content, payload.filename)
    flashStatus($status, 'Download started', 'ok')
  })

  document.getElementById('btn-copy')!.addEventListener('click', () => {
    navigator.clipboard.writeText(url).catch(() => {})
    const btn = document.getElementById('btn-copy')!
    btn.textContent = '✓ Copied'
    setTimeout(() => { btn.textContent = 'Copy Link' }, 2000)
  })

  document.getElementById('btn-share')!.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
      flashStatus($status, 'Link copied to clipboard', 'ok')
    }
  })

  /* auto-download sequence */
  setTimeout(() => {
    triggerDownload(payload.content, payload.filename)
    flashStatus($status, '✓ Download started', 'ok')
    $progress.classList.add('progress--done')

    setTimeout(() => { location.href = 'about:blank' }, 1200)
  }, 600)
}

function flashStatus(el: HTMLElement, msg: string, kind: 'ok' | 'err'): void {
  el.innerHTML = `<span class="dot dot--${kind}"></span> ${msg}`
}

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */

const root = document.getElementById('app')!
const payload = parseHash()

if (payload) {
  renderDownload(root, payload)
} else {
  renderEmpty(root)
}
