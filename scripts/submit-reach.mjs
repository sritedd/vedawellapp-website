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
const INDEXNOW_KEY = "vedawell2026indexnow";

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
async function pingSitemaps() {
  console.log("\n🔔 Pinging search engines with sitemap...");

  const sitemapEnc = encodeURIComponent(SITEMAP_URL);
  const pings = [
    `https://www.google.com/ping?sitemap=${sitemapEnc}`,
    `https://www.bing.com/ping?sitemap=${sitemapEnc}`,
  ];

  for (const url of pings) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "VedaWell-Reach/2.0" },
        signal: AbortSignal.timeout(10000),
      });
      console.log(`  ✅ ${new URL(url).hostname} → HTTP ${res.status}`);
    } catch (e) {
      console.log(`  ⚠️  ${new URL(url).hostname} → ${e.message}`);
    }
    await sleep(300);
  }
}

// ─── 3. WAYBACK MACHINE ────────────────────────────────────────────────────
async function submitWayback(urls) {
  // Only archive high-priority pages (not every tool/game)
  const priority = urls.filter(
    (u) =>
      u === `${BASE}/` ||
      u.match(/\/(tools|games|blog|guardian|compare|about|privacy)$/) ||
      u.includes("/blog/") ||
      u.includes("/guardian/") ||
      u.includes("/compare/")
  );

  console.log(`\n🏛️  Wayback Machine — archiving ${priority.length} priority pages (of ${urls.length} total)...`);
  let ok = 0,
    fail = 0;

  for (const url of priority) {
    try {
      const res = await fetch(`https://web.archive.org/save/${url}`, {
        method: "GET",
        headers: { "User-Agent": "VedaWell-Archiver/2.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
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
    await sleep(1500); // archive.org rate limit
  }
  console.log(`\n  ✅ Archived: ${ok}  ❌ Failed: ${fail}`);
}

// ─── 4. GOOGLE SEARCH CONSOLE PING ─────────────────────────────────────────
async function pingGoogleSearchConsole() {
  console.log("\n🔎 Requesting Google re-crawl via Search Console ping...");
  try {
    const res = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    console.log(`  ✅ Google ping → HTTP ${res.status}`);
  } catch (e) {
    console.log(`  ⚠️  Google ping → ${e.message}`);
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
await pingSitemaps();
await pingGoogleSearchConsole();
await submitWayback(urls);

console.log("\n" + "=".repeat(60));
console.log("✅ All submissions complete!");
console.log("=".repeat(60));
console.log(`\n📊 Check results:`);
console.log(`   Bing: https://www.bing.com/webmasters/indexnow?siteUrl=https://${HOST}/`);
console.log(`   Google: https://search.google.com/search-console?resource_id=https://${HOST}/`);
console.log(`   Wayback: https://web.archive.org/web/*/${HOST}/*`);
