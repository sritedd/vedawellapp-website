/**
 * VedaWell Reach Submission Script — Next Gen
 *
 * Dynamically discovers ALL URLs from the sitemap (tools, games, blog,
 * compare pages, guardian learn pages) instead of a hardcoded list.
 *
 * Submits to:
 *  1. IndexNow (Bing, Yandex, Naver, Seznam)
 *  2. Google & Bing sitemap pings
 *  3. Wayback Machine (archive.org) — builds .org backlinks
 */

const HOST = "vedawellapp.com";
const BASE = `https://${HOST}`;
const SITEMAP_URL = `${BASE}/sitemap.xml`;
const INDEXNOW_KEY = "8864cefde0394cbca72cf32430d9c5d8";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── URL DISCOVERY ──────────────────────────────────────────────────────────
async function discoverUrls() {
  console.log(`\n🔍 Fetching sitemap from ${SITEMAP_URL}...`);
  try {
    const res = await fetch(SITEMAP_URL, {
      headers: { "User-Agent": "VedaWell-Reach/2.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    // Extract all <loc>...</loc> URLs from sitemap XML
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    console.log(`   Found ${urls.length} URLs in sitemap`);
    return urls;
  } catch (e) {
    console.error(`   ❌ Failed to fetch sitemap: ${e.message}`);
    console.log("   Falling back to static URL list...");
    return getFallbackUrls();
  }
}

function getFallbackUrls() {
  return [
    `${BASE}/`,
    `${BASE}/tools`,
    `${BASE}/games`,
    `${BASE}/blog`,
    `${BASE}/guardian`,
    `${BASE}/guardian/pricing`,
    `${BASE}/guardian/faq`,
    `${BASE}/guardian/journey`,
    `${BASE}/guardian/resources`,
    `${BASE}/about`,
  ];
}

// ─── 1. INDEXNOW ────────────────────────────────────────────────────────────
async function submitIndexNow(urls) {
  console.log(`\n📡 IndexNow — submitting ${urls.length} URLs to Bing, Yandex, Naver, Seznam...`);

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];

  // IndexNow accepts max 10,000 URLs per request
  const CHUNK = 10000;
  for (let i = 0; i < urls.length; i += CHUNK) {
    const chunk = urls.slice(i, i + CHUNK);
    const body = JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
      urlList: chunk,
    });

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body,
          signal: AbortSignal.timeout(15000),
        });
        console.log(`  ✅ ${new URL(endpoint).hostname} → HTTP ${res.status} (${chunk.length} URLs)`);
      } catch (e) {
        console.log(`  ❌ ${new URL(endpoint).hostname} → ${e.message}`);
      }
      await sleep(500);
    }
  }
}

// ─── 2. SITEMAP PINGS ───────────────────────────────────────────────────────
// Note: Google deprecated /ping?sitemap (returns 404) and Bing deprecated
// theirs (returns 410) in favor of IndexNow. We keep only IndexNow above.
// Sitemap discovery happens via robots.txt and Search Console / Bing Webmaster.

// ─── 3. WAYBACK MACHINE ────────────────────────────────────────────────────
async function submitWayback(urls) {
  // Archive just the homepage + a few key pages — archive.org is very slow
  const priority = [
    `${BASE}/`,
    `${BASE}/tools`,
    `${BASE}/games`,
    `${BASE}/blog`,
    `${BASE}/guardian`,
  ];

  console.log(`\n🏛️  Wayback Machine — archiving ${priority.length} key pages...`);
  let ok = 0,
    fail = 0;

  for (const url of priority) {
    try {
      const res = await fetch(`https://web.archive.org/save/${url}`, {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; VedaWell/2.0)" },
        redirect: "follow",
        signal: AbortSignal.timeout(30000),
      });
      if (res.status < 400) {
        ok++;
        process.stdout.write(".");
      } else {
        fail++;
        process.stdout.write("x");
      }
    } catch {
      fail++;
      process.stdout.write("x");
    }
    await sleep(3000); // archive.org needs generous delays
  }
  console.log(`\n  ✅ Archived: ${ok}  ❌ Failed: ${fail}`);
  if (fail > 0) {
    console.log("  ℹ️  Wayback failures are common — archive.org rate-limits automated saves");
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
const urls = await discoverUrls();

console.log("=".repeat(60));
console.log("🚀 VedaWell Reach Submission v2.0");
console.log(`   ${urls.length} URLs discovered from sitemap`);
console.log(`   Host: ${HOST}`);
console.log("=".repeat(60));

await submitIndexNow(urls);
await submitWayback(urls);

console.log("\n" + "=".repeat(60));
console.log("✅ All submissions complete!");
console.log("=".repeat(60));
console.log(`\n📊 Check results:`);
console.log(`   Bing: https://www.bing.com/webmasters/indexnow?siteUrl=https://${HOST}/`);
console.log(`   Google: https://search.google.com/search-console?resource_id=https://${HOST}/`);
console.log(`   Wayback: https://web.archive.org/web/*/${HOST}/*`);
