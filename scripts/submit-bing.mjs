/**
 * Bing Webmaster Tools — Bulk URL Submission API v2.0
 *
 * Dynamically fetches all URLs from sitemap instead of hardcoded list.
 *
 * Usage: node scripts/submit-bing.mjs YOUR_BING_API_KEY
 * Get key: Bing Webmaster Tools → Settings → API Access → Generate Key
 */

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("Usage: node scripts/submit-bing.mjs YOUR_API_KEY");
  console.error("Get key: Bing Webmaster Tools → Settings → API Access → Generate Key");
  process.exit(1);
}

const HOST = "vedawellapp.com";
const BASE = `https://${HOST}`;
const SITEMAP_URL = `${BASE}/sitemap.xml`;

// Discover URLs from live sitemap
async function discoverUrls() {
  console.log(`\n🔍 Fetching sitemap from ${SITEMAP_URL}...`);
  try {
    const res = await fetch(SITEMAP_URL, {
      headers: { "User-Agent": "VedaWell-BingSubmit/2.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    console.log(`   Found ${urls.length} URLs`);
    return urls;
  } catch (e) {
    console.error(`   ❌ Failed: ${e.message}`);
    process.exit(1);
  }
}

const BING_DAILY_QUOTA = 100;
let ALL_URLS = await discoverUrls();

if (ALL_URLS.length > BING_DAILY_QUOTA) {
  console.log(`   Bing daily quota is ${BING_DAILY_QUOTA} — trimming to highest-priority URLs`);
  // Prioritize: home, main sections, guardian, blog, then tools/games
  const high = ALL_URLS.filter((u) => !u.match(/\/(tools|games|compare)\/[^/]+$/));
  const low = ALL_URLS.filter((u) => u.match(/\/(tools|games|compare)\/[^/]+$/));
  ALL_URLS = [...high, ...low].slice(0, BING_DAILY_QUOTA);
  console.log(`   Submitting ${ALL_URLS.length} URLs (${high.length} priority + ${Math.max(0, BING_DAILY_QUOTA - high.length)} tools/games)`);
}

// Bing allows max 500 URLs per request
const CHUNK_SIZE = 500;
const chunks = [];
for (let i = 0; i < ALL_URLS.length; i += CHUNK_SIZE) {
  chunks.push(ALL_URLS.slice(i, i + CHUNK_SIZE));
}

console.log(`\n🔍 Bing Webmaster — submitting ${ALL_URLS.length} URLs in ${chunks.length} batch(es)...`);

let totalSubmitted = 0;
for (let i = 0; i < chunks.length; i++) {
  try {
    const res = await fetch(
      `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          siteUrl: `${BASE}`,
          urlList: chunks[i],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const text = await res.text();
    if (res.status === 200) {
      totalSubmitted += chunks[i].length;
      console.log(`  ✅ Batch ${i + 1}: ${chunks[i].length} URLs submitted`);
    } else {
      console.log(`  ❌ Batch ${i + 1}: HTTP ${res.status} — ${text}`);
    }
  } catch (e) {
    console.log(`  ❌ Batch ${i + 1}: ${e.message}`);
  }
}

console.log(`\n✅ Bing submission complete! ${totalSubmitted}/${ALL_URLS.length} URLs submitted.`);
console.log(`📊 Check: https://www.bing.com/webmasters/urlsubmission?siteUrl=${BASE}/`);
