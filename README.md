# ooguy Download Bridge

A zero-dependency download bridge for the [ooguy](https://github.com/uchochi/Nene) Telegram Mini App.

Telegram Mini Apps cannot trigger file downloads directly in most WebViews. This bridge solves that by receiving file data via URL hash parameters and initiating a real browser download on the user's device.

## How It Works

```
┌──────────────┐    openSystemBrowser(url)    ┌──────────────────┐
│  ooguy TMA   │ ──────────────────────────▶  │  Download Bridge  │
│  (WebView)   │                              │  (System Browser) │
└──────────────┘                              └────────┬─────────┘
                                                       │
                                          ┌────────────▼────────────┐
                                          │ 1. Parse URL hash        │
                                          │ 2. Decode base64 data    │
                                          │ 3. Trigger file download │
                                          │ 4. Redirect to blank     │
                                          └─────────────────────────┘
```

### URL Format

```
https://your-deployment.vercel.app/#d=<base64-content>&f=<base64-filename>
```

| Param | Description |
|-------|-------------|
| `d` | Base64-encoded file content (UTF-8 safe) |
| `f` | Base64-encoded filename |

Both values are encoded with `btoa(unescape(encodeURIComponent(str)))` and URI-component-safe in the hash.

### User Flow

1. User taps **Export** in the ooguy TMA
2. The TMA opens the system browser with the encoded URL
3. The bridge decodes the data and auto-downloads the file
4. After download starts, the page redirects to `about:blank`
5. The user returns to the TMA — the file is in their downloads

### Fallback UI

If the page is opened without hash data, it displays an instructions page explaining how to use the ooguy app.

---

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

To test with data, manually construct a URL:

```
http://localhost:5173/#d=<base64>&f=<base64>
```

---

## Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### Option B: GitHub Integration

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository — Vite is auto-detected
4. Deploy

### Option C: Dashboard Redeploy

If the build fails on Vercel, go to **Deployments** → click the latest → **Redeploy** (without cache).

---

## Integration with ooguy

### Step 1: Set the environment variable

In the main app's `.env`:

```bash
VITE_DOWNLOADER_URL=https://your-deployment.vercel.app
```

### Step 2: The download utility

The main app uses `src/utils/downloadLink.ts` to generate URLs:

```ts
const DOWNLOADER_BASE = import.meta.env.VITE_DOWNLOADER_URL || 'https://nene2u.vercel.app'

function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

export function encodeDownloadData(content: string, filename: string): string {
  const d = encodeBase64(content)
  const f = encodeBase64(filename)
  return `${DOWNLOADER_BASE}/#d=${encodeURIComponent(d)}&f=${encodeURIComponent(f)}`
}
```

### Step 3: Opening the bridge

The main app opens the generated URL using Telegram's `openLink`:

```ts
const url = encodeDownloadData(jsonContent, 'dataset.json')
const telegram = window.Telegram?.WebApp
if (telegram?.openLink) {
  telegram.openLink(url)
} else {
  window.open(url, '_blank')
}
```

### Step 4: Redeploy

Rebuild and redeploy the main app after updating `VITE_DOWNLOADER_URL`.

---

## Build

```bash
npm run build
```

Output is in `dist/`.

---

## Tech Stack

- **Runtime:** Vanilla TypeScript (no frameworks)
- **Bundler:** Vite 6
- **Styling:** Custom CSS with CSS variables, animations
- **Dependencies:** Zero (only Vite as a dev dependency)

---

## License

Private — part of the ooguy project.
