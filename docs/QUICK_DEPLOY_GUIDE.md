# BuildMe — Quick Deploy Guide for CEDI Demo

## Option 1: Vercel (Recommended — Free, 2 minutes)

### Steps:
1. Push your code to GitHub (if not already):
   ```bash
   cd buildme
   git init
   git add .
   git commit -m "BuildMe v2.0 - CEDI ready"
   git remote add origin https://github.com/YOUR_USERNAME/buildme.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Sign up with GitHub
4. Click "New Project" → Import your `buildme` repo
5. Vercel auto-detects Next.js → Click "Deploy"
6. Wait ~60 seconds → You get a live URL like `https://buildme-xxx.vercel.app`

### Important:
- The SQLite database is embedded, so demo data is included
- Vercel free tier is sufficient for a demo
- Demo credentials work on the live URL

---

## Option 2: Record a Video (No deployment needed)

### Steps:
1. Start the dev server: `npm run dev` in the `buildme` folder
2. Open `http://localhost:57338` in Chrome
3. Record your screen using:
   - **Windows:** Win+G (Game Bar) → Start Recording
   - **Mac:** QuickTime → New Screen Recording
   - **Free:** [OBS Studio](https://obsproject.com) or [Loom](https://loom.com) (browser extension)
4. Follow the walkthrough script in `CEDI_DEMO_WALKTHROUGH_SCRIPT.md`
5. Upload to YouTube (unlisted) or Loom
6. Paste the link in the GENESIS application form

---

## Option 3: Local Demo (During Interview)

If CEDI interviews are in-person or video call:
1. Keep `npm run dev` running
2. Share your screen during the call
3. Walk through the app live
4. This is actually the BEST option if available

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Engineer | engineer@buildme.demo | demo1234 |
| Homeowner | rkumar@buildme.demo | demo1234 |

---

## What to Show in 3 Minutes

| Time | Page | What to say |
|------|------|-------------|
| 0:00 | Landing | "Construction intelligence for civil engineers" |
| 0:15 | Login | "Demo credentials — working auth" |
| 0:30 | Dashboard | "6 projects, attention queue, real data" |
| 1:00 | Project Truth | "Complete financial story — every change explained" |
| 1:45 | Cost Intelligence | "Government benchmark data — transparent methodology" |
| 2:15 | Design-to-Cost | "Simulate design changes before committing" |
| 2:45 | Quotation Intel | "Compare contractor scope, not just price" |
| 3:00 | Closing | "Working prototype, honest about what's proven vs future" |
