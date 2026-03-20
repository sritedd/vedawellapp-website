const CACHE_NAME = "vedawell-v2";
const PRECACHE_URLS = [
    "/",
    "/tools",
    "/games",
    "/guardian",
    "/manifest.json",
];

// Guardian pages to cache after first visit (for offline site visits)
const GUARDIAN_CACHE_PATTERNS = [
    /^\/guardian\/projects\/[^/]+$/,
    /^\/guardian\/dashboard$/,
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

// Fetch: network-first with cache fallback
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

    // Skip other API routes (mutations, webhooks)
    if (url.pathname.startsWith("/api/")) return;

    // Guardian project pages: cache aggressively for offline site visits
    const isGuardianPage = GUARDIAN_CACHE_PATTERNS.some((p) => p.test(url.pathname));

    if (isGuardianPage) {
        // Network-first, cache on success, serve from cache if offline
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(event.request).then((cached) => {
                        if (cached) return cached;
                        // Return offline fallback page
                        return caches.match("/guardian");
                    })
                )
        );
        return;
    }

    // Default: network-first with cache fallback
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
