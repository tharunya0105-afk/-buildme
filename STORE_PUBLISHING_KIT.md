# BuildMe — App Store & Play Store Publishing Kit

**Goal:** BuildMe installable from the App Store and Google Play.
**What exists now:** BuildMe is a fully installable **PWA** — Android & desktop users can install it directly from the browser (instant, no store review), and iPhone users get the Add-to-Home-Screen flow. The service worker gives offline shell + static caching.
**What this doc covers:** the exact remaining steps to get native store listings, which wrap the same codebase. Nothing in the app needs to be rewritten.

---

## Part 0 — What you have today (test it first)

| Capability | How to verify |
|---|---|
| Installable on Android | Chrome → app URL → "Install app" banner (or ⋮ → Add to Home screen) |
| Installable on iOS | Safari → Share → Add to Home Screen (in-app banner shows the steps) |
| Offline shell | Airplane mode → reopen installed app → branded offline page |
| App shortcuts | Long-press the installed icon → Sites / Quotation Intel / Evidence |
| Own icon + name | Icons in `public/icons/`, name in `public/manifest.json` |

> **Note:** the service worker registers **in production builds only** (`npm run build && npm start`). Dev-mode HMR intentionally skips it.

---

## Part 1 — Google Play (the fast one): Trusted Web Activity

Play accepts PWAs packaged as **Trusted Web Activities (TWA)** — a thin native shell that opens your website full-screen with no browser UI. Play Store then serves the app using your live site. You keep one codebase; Play review is usually days.

### Prerequisites (all required, no way around them)
1. **Production URL over HTTPS** — deploy BuildMe (Vercel + Postgres/Turso; see infra note below). TWAs cannot point at localhost.
2. **Digital Asset Links** — prove you own the domain: host `https://yourdomain/.well-known/assetlinks.json` with the signing cert SHA-256 of the app. Bubblewrap generates this file for you; you commit it to `public/.well-known/`.
3. **PWA installability checks pass** — manifest valid (done), HTTPS (deployment), SW with fetch handler (done).

### Steps (~1 day of work once deployed)
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://yourdomain/manifest.json
bubblewrap build          # produces app-release-signed.apk + assetlinks.json
```
- Bubblewrap asks for a **keystore** — create one, back it up forever (losing it = losing the app identity).
- Copy the generated `assetlinks.json` → `public/.well-known/assetlinks.json` → redeploy.
- **Play Console** (one-time $25): create app → store listing → upload the AAB → internal testing track first.
- Required listing assets: 512×512 icon (have it), feature graphic 1024×500, 2–8 phone screenshots, privacy policy URL.

### Play listing copy (draft)
- **Title:** BuildMe — Construction Audit Trail
- **Short description:** Quotation audit, cost benchmarks & payment proof for civil engineers.
- **Full description:** reuse the deck's problem/solution slides; mention offline support, GPS-evidence capture, homeowner share-links.

---

## Part 2 — Apple App Store: wrap the PWA

Apple has no TWA equivalent; the standard path is a thin **WebView wrapper** (capacitor) around the same URL. Options in order of effort:

### Option A — Capacitor (recommended)
```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap init BuildMe app.buildme.web --web-dir=public
npx cap add ios
npx cap open ios   # opens Xcode
```
- In Xcode: set signing team (needs **Apple Developer account, $99/yr**), bundle id `app.buildme.web`, icons (use `public/icons/`), splash.
- **WKWebView loads `https://yourdomain`** (set in `capacitor.config.ts`: `server: { url: "https://yourdomain", allowNavigation: ["yourdomain"] }`).
- App Store review requires the app to have *some* native value — BuildMe's GPS camera capture, push notifications and offline shell satisfy this; be ready to demonstrate it in App Review notes.

### Option B — PWABuilder (lowest effort)
pwabuilder.com → enter URL → download iOS package → open in Xcode → submit. Less control, faster.

### iOS review gotchas
- **4.2 Minimum Functionality:** a pure website wrapper can be rejected. Mitigation: implement one native feature first (camera/GPS evidence capture is the natural fit and already core to the product).
- **Account sign-in required feature:** Apple requires a **demo account** in review notes — provide `demo@buildme.app` style credentials in the review notes field.
- **Privacy policy URL + App Privacy labels** are mandatory (data collected: photos, GPS, account).

---

## Part 3 — The infra prerequisite (honest note)

Store listings point at a **production deployment**, and the memo already flags this: SQLite-in-/tmp and `public/uploads` are ephemeral. Before any store submission:

1. **Postgres** (Vercel Postgres / Turso / Neon) — swap `datasource db` in `prisma/schema.prisma`, `prisma db push`, done.
2. **Object storage for uploads** (Cloudflare R2 / S3) — replace `public/uploads` writes with signed-URL uploads; evidence photos must survive deploys.
3. **A domain** — e.g. `buildme.in` — everything above hangs off it.

These are 2–4 days of work and are already the Day-60 gate in the committee memo — the store requirement simply makes them non-optional.

---

## Part 4 — Cost & account checklist

| Item | Cost | Renewal |
|---|---|---|
| Google Play Console | $25 | one-time |
| Apple Developer Program | $99/yr | annual |
| Domain | ~₹800–1,200/yr | annual |
| Hosting (Vercel hobby→pro) | $0→$20/mo | monthly |
| Object storage (R2) | ~free at pilot scale | — |

**Order of operations:** entity registration (memo W10) → deploy + domain → Play/TWA → App Store/Capacitor. Play first: cheaper, faster review, your market is Android-heavy.

---

## Part 5 — What's already in the repo for this

- `public/manifest.json` — store-quality manifest (icons, shortcuts, standalone)
- `public/sw.js` + `public/offline.html` — offline shell, production-registered
- `public/icons/*` — generated via `node scripts/generate-icons.js` (rerun anytime the mark changes)
- `src/components/PwaRegister.tsx` — SW registration (prod only)
- `src/components/InstallPrompt.tsx` — Android one-tap install + iOS instructions banner
- `layout.tsx` — manifest link, apple-web-app meta, icons, viewport-fit cover
