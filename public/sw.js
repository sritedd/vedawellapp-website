const CACHE_NAME = "vedawell-v4";
const PRECACHE_URLS = [
    "/",
    "/tools",
    "/games",
    "/guardian",
    "/manifest.json",
];

// Install: precache key pages
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first with cache fallback (public pages only)
self.addEventListener("fetch", (event) => {
    // Skip non-GET requests
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Only handle same-origin HTTP(S) requests — skip extensions, third-party, etc.
    if (url.origin !== self.location.origin) return;

    // Skip auth callbacks
    if (url.pathname.startsWith("/auth/")) return;

    // Skip API routes (mutations, webhooks, streaming)
    if (url.pathname.startsWith("/api/")) return;

    // SECURITY: Never cache guardian pages — private project data.
    // Offline support uses IndexedDB, not service worker cache.
    if (url.pathname.startsWith("/guardian/")) return;

    // Default: network-first with cache fallback (public pages only)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok && response.type === "basic") {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then((cached) =>
                    cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" })
                )
            )
    );
});
