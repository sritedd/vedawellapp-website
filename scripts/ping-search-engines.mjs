#!/usr/bin/env node
/**
 * Ping search engines to re-crawl the sitemap.
 * Run after every deploy: node scripts/ping-search-engines.mjs
 */

const SITEMAP_URL = "https://vedawellapp.com/sitemap.xml";
const SITE_URL = "https://vedawellapp.com";

const PINGS = [
    // Google — sitemap ping (deprecated but still works)
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    // Bing / Yandex — sitemap ping
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    // IndexNow — instant indexing for Bing, Yandex, Seznam, Naver
    // (requires key file at /indexnow-key.txt — we'll create that)
];

// IndexNow submission for all new/changed URLs
async function submitIndexNow(urls) {
    const key = "vedawell2026indexnow";
    const payload = {
        host: "vedawellapp.com",
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: urls,
    };

    try {
        const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(payload),
        });
        console.log(`IndexNow: ${res.status} ${res.statusText}`);
    } catch (e) {
        console.error("IndexNow error:", e.message);
    }
}

async function main() {
    console.log("=== Search Engine Ping Script ===\n");

    // Ping Google & Bing sitemaps
    for (const url of PINGS) {
        try {
            const res = await fetch(url);
            const engine = url.includes("google") ? "Google" : "Bing";
            console.log(`${engine} sitemap ping: ${res.status} ${res.statusText}`);
        } catch (e) {
            console.error(`Ping failed: ${e.message}`);
        }
    }

    // Fetch sitemap and submit all URLs to IndexNow
    console.log("\nFetching sitemap for IndexNow submission...");
    try {
        const sitemapRes = await fetch(SITEMAP_URL);
        const xml = await sitemapRes.text();
        const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
        console.log(`Found ${urls.length} URLs in sitemap`);

        // IndexNow accepts max 10,000 URLs per request
        const batchSize = 10000;
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            await submitIndexNow(batch);
        }
    } catch (e) {
        console.error("Sitemap fetch failed:", e.message);
    }

    console.log("\n=== Done ===");
}

main();
