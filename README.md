# ATS.CV — AI Resume Optimizer

Convert any CV (PDF, DOCX, TXT) into an ATS-optimized resume using Claude AI.

---

## Project Structure

```
ats-cv-app/
├── api/
│   └── convert.js        ← Vercel serverless function (your API key lives here)
├── src/
│   ├── App.jsx           ← Main React frontend
│   └── main.jsx          ← React entry point
├── index.html
├── vite.config.js
├── package.json
├── .env.example          ← Copy this to .env.local and add your key
└── .gitignore            ← Keeps your secrets safe
```

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API key
```bash
cp .env.example .env.local
# Open .env.local and replace "your_api_key_here" with your real key
# Get your key at: https://console.anthropic.com
```

### 3. Run locally
```bash
npm run dev
```

Visit http://localhost:5173

> Note: The `/api/convert` serverless function won't run locally with just `npm run dev`.
> To test the full stack locally, install Vercel CLI:
> ```bash
> npm install -g vercel
> vercel dev
> ```
> This runs both the frontend AND the API function locally.

---

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ats-cv-app.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Select your `ats-cv-app` repository
4. Click **Deploy** (Vercel auto-detects Vite — no config needed)

### Step 3 — Add your API key as an Environment Variable
This is the most important step. Never put your API key in code.

1. In your Vercel project, go to **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your actual key from https://console.anthropic.com
   - **Environment:** Production, Preview, Development (check all three)
3. Click **Save**
4. Go to **Deployments** and click **Redeploy** so it picks up the new variable

### Step 4 — Done! 🎉
Your site is live at `https://your-project-name.vercel.app`

---

## How the Security Works

```
Browser (user)
     │
     │  POST /api/convert  { cvText, jobTitle }
     ▼
Vercel Serverless Function  ← API key stored here as env variable
     │
     │  POST https://api.anthropic.com/v1/messages
     │  x-api-key: process.env.ANTHROPIC_API_KEY  ✅ Never sent to browser
     ▼
Claude AI
     │
     ▼
Vercel Function returns result to browser
```

The API key **never touches the browser**. Users can't see it in Network tab, source code, or anywhere.

---

## Custom Domain

1. Buy a domain (e.g. atscv.io) on Namecheap
2. In Vercel: **Settings → Domains → Add**
3. Copy the DNS records Vercel gives you into Namecheap
4. Wait 10–30 minutes → live!

---

## Updates

Every time you push to GitHub, Vercel auto-deploys:
```bash
git add .
git commit -m "your changes"
git push
```
