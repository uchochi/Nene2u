# n8n Dataset Download Bridge

A lightweight download bridge for [n8n Dataset TMA](https://github.com/uchochi/n8n-dataset). Telegram Mini Apps cannot trigger file downloads directly in most WebViews — this bridge receives data via URL hash and initiates the download client-side.

## How It Works

1. The main app encodes the dataset content and filename as base64 in a URL hash:

   ```
   https://downloader.vercel.app/#d=<base64-content>&f=<base64-filename>
   ```

2. Opening that URL in a system browser (not TMA) auto-downloads the file.
3. The page also provides **Copy**, **Share** (Web Share API), and **Retry** buttons.


## Local Setup

```bash
npm install
npm run dev
```


Runs at `http://localhost:5173`.

## Deploy to Vercel

### CLI

```bash
npm i -g vercel
vercel --prod
```

### Dashboard

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import this repository — Vite is auto-detected.
4. Deploy.

## Connect to Main App

In the main app (`n8n-dataset`), set the downloader URL in `src/utils/downloadLink.ts`:

```ts
const DOWNLOADER_BASE = 'https://your-deployment.vercel.app'
```

Then rebuild and redeploy the main app.

## Build

```bash
npm run build
```

Output is in `dist/`.
