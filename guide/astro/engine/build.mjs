// Assemble the self-contained tool in two flavors:
//   jyotish.html            — Claude-artifact body (no doctype; font as data URI)
//   jyotish-standalone.html — full document for the VedaWell app (public/jyotish.html;
//                             font served from /fonts/ because CSP font-src is 'self')
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const here = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(here, f), "utf8");

const font = readFileSync(join(here, "rozha-latin.woff2")).toString("base64");
const body = read("template.html");

let tail = "";
const scripts = ["vsop-data.js", "engine.js", "cities.js", "ui.js"];
for (const s of scripts) {
  const src = read(s);
  if (src.includes("</script>")) throw new Error(`${s} contains </script>`);
  tail += `\n<script>\n${src}\n</script>\n`;
}

// artifact flavor: data-URI font, body-only markup
const artifact = body.replace("%%FONT%%", font) + tail;
writeFileSync(join(here, "jyotish.html"), artifact);

// standalone flavor for public/: real <head>, file-served font, back links
let standalone = body
  .replace("url(data:font/woff2;base64,%%FONT%%)", "url(/fonts/rozha-jyotish.woff2)")
  .replace(
    "Built from the VedaWell jyotish math specification.",
    'Built from the VedaWell jyotish math specification. <a href="/tools/vedic-birth-chart" style="color:var(--gold)">About this tool</a> · <a href="/tools" style="color:var(--gold)">More VedaWell tools</a>'
  );
const bodyStart = standalone.indexOf('<div class="wrap">');
if (bodyStart < 0) throw new Error("template marker not found");
standalone =
  '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/>\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1"/>\n' +
  '<meta name="description" content="Free Vedic birth chart (kundli) calculator: planetary positions, lagna, panchanga, Vimshottari dasha and ashtakavarga computed from real astronomy, validated against the JPL ephemeris."/>\n' +
  '<link rel="canonical" href="https://vedawellapp.com/tools/vedic-birth-chart"/>\n' +
  '<link rel="icon" href="/icon-192.png"/>\n' +
  standalone.slice(0, bodyStart) +
  "</head>\n<body>\n" +
  standalone.slice(bodyStart) + tail +
  "\n</body>\n</html>\n";
writeFileSync(join(here, "jyotish-standalone.html"), standalone);
console.log(`jyotish.html: ${(artifact.length / 1024) | 0} KB · jyotish-standalone.html: ${(standalone.length / 1024) | 0} KB`);
console.log("Deploy standalone: copy jyotish-standalone.html -> public/jyotish.html and rozha-latin.woff2 -> public/fonts/rozha-jyotish.woff2");
