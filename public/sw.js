const CACHE_NAME = "vedawell-v3";
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
    // Skip non-GET and auth requests
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);

    // Skip auth callbacks and Supabase REST API
    if (url.pathname.startsWith("/auth/")) return;

    // Supabase API calls contain private user data — NEVER cache them.
    // Offline support uses IndexedDB (offlineQueue.ts) instead.
    if (url.hostname.includes("supabase.co")) {
        return; // Let the browser handle normally, no caching
    }

    // Skip API routes (mutations, webhooks)
    if (url.pathname.startsWith("/api/")) return;

    // SECURITY: Never cache ANY guardian pages — they contain private project data.
    // This covers dashboard, projects, profile, admin, support, refer, etc.
    // Offline support for guardian uses IndexedDB, not service worker cache.
    if (url.pathname.startsWith("/guardian/")) {
        return;
    }

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
            .catch(() => caches.match(event.request))
    );
});
