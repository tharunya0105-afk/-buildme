// ─── BuildMe Service Worker ──────────────────────────────────────────────────
// Strategy:
//   • Precache the offline shell + icons on install.
//   • Navigation requests: network-first → cache → offline shell.
//   • Static assets (/_next/static, icons): cache-first (immutable).
//   • API GETs: network-only (live data is the product) with a graceful
//     offline JSON response so the UI can render an honest error state.
//   • Never cache POST/PATCH/DELETE.

const VERSION = "buildme-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      ),
    // Deliberately NOT calling clients.claim(): claiming mid-first-load aborts
    // in-flight fetches (e.g. the next-auth session call), surfacing spurious
    // auth errors. The SW takes control on the next navigation instead — first
    // visits have nothing cached yet, so there is nothing to miss.
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never cache writes

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let CDN/model fetches pass through

  // ── Navigations: network-first, fall back to cache, then offline shell ──
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  // ── Immutable static assets: cache-first ────────────────────────────────
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // ── Same-origin API GETs: network-only, honest offline response ─────────
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({ error: "offline", message: "You are offline — data will refresh when you reconnect." }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
  }
});
