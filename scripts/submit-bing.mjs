/**
 * Bing Webmaster Tools — Bulk URL Submission API
 * Usage: node scripts/submit-bing.mjs YOUR_BING_API_KEY
 *
 * Get your key: https://www.bing.com/webmasters/api.aspx
 * (Bing Webmaster Tools → Settings → API Access → Generate Key)
 */

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("Usage: node scripts/submit-bing.mjs YOUR_API_KEY");
  console.error("Get key at: https://www.bing.com/webmasters/api.aspx");
  process.exit(1);
}

const HOST = "vedawell.tools";
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

const ALL_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/tools`,
  `https://${HOST}/guardian`,
  `https://${HOST}/guardian/pricing`,
  ...TOOL_SLUGS.map(slug => `https://${HOST}/tools/${slug}`),
];

// Bing allows max 500 URLs per request
const CHUNK_SIZE = 500;
const chunks = [];
for (let i = 0; i < ALL_URLS.length; i += CHUNK_SIZE) {
  chunks.push(ALL_URLS.slice(i, i + CHUNK_SIZE));
}

console.log(`\n🔍 Bing Webmaster — submitting ${ALL_URLS.length} URLs in ${chunks.length} batch(es)...`);

for (let i = 0; i < chunks.length; i++) {
  try {
    const res = await fetch(
      `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ siteUrl: `https://${HOST}`, urlList: chunks[i] }),
      }
    );
    const text = await res.text();
    if (res.status === 200) {
      console.log(`  ✅ Batch ${i + 1}: ${chunks[i].length} URLs submitted`);
    } else {
      console.log(`  ❌ Batch ${i + 1}: HTTP ${res.status} — ${text}`);
    }
  } catch (e) {
    console.log(`  ❌ Batch ${i + 1}: ${e.message}`);
  }
}

console.log("\n✅ Bing submission complete!");
