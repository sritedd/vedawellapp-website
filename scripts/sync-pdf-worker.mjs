/**
 * Copy the pdf.js worker from node_modules into public/ so it is served from
 * our own origin.
 *
 * Why this exists: the parsers used to load the worker from
 * cdnjs.cloudflare.com, which our CSP (`script-src 'self' …`) blocks — so PDF
 * contract and inspection-report import failed 100% of the time in production
 * with "Setting up fake worker failed". Serving it from /public satisfies
 * 'self'.
 *
 * Run as part of `npm run build` so the vendored copy can never drift from the
 * installed pdfjs-dist version (a version mismatch between the API and the
 * worker makes pdf.js throw).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const dest = path.join(root, "public", "pdf.worker.min.mjs");

if (!fs.existsSync(src)) {
    console.error(`[sync-pdf-worker] Source not found: ${src}\n  Is pdfjs-dist installed?`);
    process.exit(1);
}

const srcBuf = fs.readFileSync(src);
const changed = !fs.existsSync(dest) || !fs.readFileSync(dest).equals(srcBuf);

if (changed) {
    fs.writeFileSync(dest, srcBuf);
    console.log(`[sync-pdf-worker] Updated public/pdf.worker.min.mjs (${srcBuf.length} bytes)`);
} else {
    console.log("[sync-pdf-worker] public/pdf.worker.min.mjs already up to date");
}
