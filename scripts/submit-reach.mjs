/**
 * VedaWell Reach Submission Script
 * Submits all tool URLs to:
 *  1. IndexNow (Bing, Yandex, Naver, Seznam, Baidu)
 *  2. Wayback Machine (archive.org) — builds .org backlinks
 *  3. Ping services — notifies 20+ web directories
 */

const HOST = "vedawell.tools";
const INDEXNOW_KEY = "8864cefde0394cbca72cf32430d9c5d8"; // Bing-issued key

const TOOL_SLUGS = [
  "age-calculator", "aspect-ratio-calculator", "background-remover",
  "batch-image-compressor", "bmi-calculator", "border-radius-preview",
  "box-shadow-generator", "breathing-exercise", "case-converter",
  "character-counter", "coin-flip", "color-converter",
  "color-palette-generator", "color-picker-from-image", "compound-interest-calculator",
  "countdown-timer", "crontab", "css-grid-generator", "csv-to-json",
  "date-calculator", "dice-roller", "drawing-canvas", "emoji-picker",
  "exif-reader", "expense-splitter", "favicon-generator", "flashcard-app",
  "flexbox-generator", "focus-timer", "gradient-generator", "habit-tracker",
  "hash-generator", "html-cleaner", "image-compressor", "image-cropper",
  "image-filters", "image-format-converter", "image-resizer", "image-to-pdf",
  "image-watermarker", "invoice-generator", "json-formatter", "jwt-decoder",
  "keycode-info", "keyword-density-checker", "loan-calculator",
  "lorem-ipsum-generator", "markdown-editor", "meeting-cost-calculator",
  "meme-generator", "meta-tag-generator", "metronome", "mortgage-calculator",
  "notes-app", "number-base-converter", "open-graph-generator",
  "paraphrasing-tool", "password-generator", "pdf-compress", "pdf-merge",
  "pdf-split", "pdf-to-image", "pdf-to-word", "percentage-calculator",
  "plain-text-paster", "pomodoro-timer", "qr-code-generator",
  "random-generator", "readability-checker", "regex-tester",
  "robots-txt-generator", "schema-markup-generator", "scientific-calculator",
  "screen-recorder", "serp-preview", "social-media-image-resizer",
  "speed-reader", "stopwatch-timer", "string-encoder", "tax-calculator",
  "text-diff", "text-repeater", "text-summarizer", "text-to-speech",
  "timezone-converter", "tip-calculator", "todo-list", "typing-speed-test",
  "unit-converter", "unit-price-calculator", "unix-timestamp-converter",
  "url-encoder", "uuid-generator", "white-noise-generator",
  "whitespace-remover", "word-counter", "youtube-thumbnail-downloader",
];

const STATIC_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/tools`,
  `https://${HOST}/guardian`,
  `https://${HOST}/guardian/pricing`,
];

const ALL_URLS = [
  ...STATIC_URLS,
  ...TOOL_SLUGS.map(slug => `https://${HOST}/tools/${slug}`),
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── 1. INDEXNOW ─────────────────────────────────────────────────────────────
async function submitIndexNow() {
  console.log("\n📡 IndexNow — submitting to Bing, Yandex, Naver, Seznam...");
  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];

  const body = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: ALL_URLS,
  });

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
      });
      console.log(`  ✅ ${endpoint} → HTTP ${res.status}`);
    } catch (e) {
      console.log(`  ❌ ${endpoint} → ${e.message}`);
    }
    await sleep(500);
  }
}

// ─── 2. WAYBACK MACHINE ──────────────────────────────────────────────────────
async function submitWayback() {
  console.log(`\n🏛️  Wayback Machine — archiving ${ALL_URLS.length} pages...`);
  let ok = 0, fail = 0;

  for (const url of ALL_URLS) {
    try {
      const res = await fetch(`https://web.archive.org/save/${url}`, {
        method: "GET",
        headers: { "User-Agent": "VedaWell-Archiver/1.0" },
        redirect: "follow",
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
    await sleep(1200); // archive.org rate limit
  }
  console.log(`\n  ✅ Archived: ${ok}  ❌ Failed: ${fail}`);
}

// ─── 3. PING SERVICES ────────────────────────────────────────────────────────
async function pingServices() {
  console.log("\n🔔 Pinging web directories and search services...");

  const sitemapUrl = encodeURIComponent(`https://${HOST}/sitemap.xml`);
  const homeUrl = encodeURIComponent(`https://${HOST}/`);

  const pingUrls = [
    // Search engine sitemap pings
    `https://www.google.com/ping?sitemap=${sitemapUrl}`,
    `https://www.bing.com/ping?sitemap=${sitemapUrl}`,
    // RSS / blog ping services
    `https://rpc.pingomatic.com/RPC2`,
    `http://blogsearch.google.com/ping?name=VedaWell+Tools&url=${homeUrl}&changesURL=${sitemapUrl}`,
    `https://ping.blogs.yam.com/RPC2`,
    `http://api.moreover.com/ping?u=${homeUrl}`,
    `http://ping.feedburner.com/`,
    `http://www.bloglines.com/ping?Title=VedaWell+Tools&URL=${homeUrl}`,
  ];

  for (const url of pingUrls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "VedaWell/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      console.log(`  ✅ ${new URL(url).hostname} → ${res.status}`);
    } catch (e) {
      console.log(`  ⚠️  ${url.split("?")[0].replace(/https?:\/\//, "")} → ${e.message}`);
    }
    await sleep(300);
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log("🚀 VedaWell Reach Submission");
console.log(`   ${ALL_URLS.length} URLs across ${TOOL_SLUGS.length} tools`);
console.log("=".repeat(60));

await submitIndexNow();
await pingServices();
await submitWayback();

console.log("\n✅ All submissions complete!");
console.log(`\n📋 Next step — Bing Webmaster bulk submit:`);
console.log(`   1. Go to: https://www.bing.com/webmasters/api.aspx`);
console.log(`   2. Get your API key`);
console.log(`   3. Run: node scripts/submit-bing.mjs YOUR_API_KEY`);
