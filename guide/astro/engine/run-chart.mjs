// One-off full reading dump for a given birth.
// Usage: node run-chart.mjs [YYYY-MM-DD] [HH:MM] [lat] [lonEast] [tzHours] [name]
// e.g.   node run-chart.mjs 1990-09-08 10:15 13.08 80.27 5.5 Ananya
import { createRequire } from "module";
const require = createRequire(import.meta.url);
globalThis.VSOP87D = require("./vsop-data.js");
const J = require("./engine.js");

const a = process.argv.slice(2);
const [Y, M, D] = (a[0] || "1990-09-08").split("-").map(Number);
const [hh, mm] = (a[1] || "10:15").split(":").map(Number);
const input = {
  year: Y, month: M, day: D, hour: hh, minute: mm, second: 0,
  lat: parseFloat(a[2] ?? "13.08"), lon: parseFloat(a[3] ?? "80.27"),
  tzHours: parseFloat(a[4] ?? "5.5"), name: a[5] || "",
};
const chart = J.computeChart(input);
const tz = input.tzHours;

const p2 = n => (n < 10 ? "0" : "") + n;
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fdt = jd => { const d = J.jdToDate(jd + tz / 24); return `${p2(d.d)} ${MON[d.m-1]} ${d.y}`; };
const ftm = jd => { const d = J.jdToDate(jd + tz / 24); let h = Math.floor(d.h), m = Math.round((d.h-h)*60); if (m===60){m=0;h++;} return `${p2(h)}:${p2(m)}`; };
const dms = x => { const d = Math.floor(x), m = Math.floor((x-d)*60), s = Math.round(((x-d)*60-m)*60); return `${d}°${p2(m)}'${p2(s)}"`; };

console.log(`=== ${input.name || "Chart"} — ${a[0] || "1990-09-08"} ${a[1] || "10:15"} local (UTC${tz >= 0 ? "+" : ""}${tz}) @ ${input.lat}N ${input.lon}E ===`);
console.log(`Ayanamsa ${dms(chart.ayanamsa)} · JD(UT) ${chart.jdUt.toFixed(5)} · dT ${chart.deltaT.toFixed(1)}s`);
console.log(`Sunrise ${ftm(chart.sunrise)} · Sunset ${ftm(chart.sunset)}\n`);
console.log(`LAGNA: ${J.RASHI[chart.lagna.rashi]} ${dms(chart.lagna.degInSign)} — ${J.NAK[chart.lagna.nakshatra]} pada ${chart.lagna.pada}`);
for (const b of chart.bodies) {
  console.log(`  ${b.name.padEnd(8)} ${J.RASHI[b.rashi].padEnd(10)} ${dms(b.degInSign).padStart(10)}  ${(J.NAK[b.nakshatra]+"-"+b.pada).padEnd(22)} H${String(b.house).padEnd(2)} ${b.retro?"R":" "} ${b.dignity||""}${b.combust?" combust":""}`);
}
const pan = chart.panchanga, e = pan.ends;
console.log(`\nPANCHANGA: ${pan.tithi.paksha} ${pan.tithi.name} (until ${ftm(e.tithi)}) · ${pan.vara.name}`);
console.log(`  Nakshatra ${J.NAK[pan.moonNakshatra.n]} p${pan.moonNakshatra.pada} (until ${ftm(e.nakshatra)} ${fdt(e.nakshatra)}) · Yoga ${pan.yoga.name} · Karana ${pan.karana.name}`);
console.log(`  Janma syllables (${J.NAK[pan.moonNakshatra.n]}): ${J.NAK_SYLLABLES[pan.moonNakshatra.n].join(" ")} — pada ${pan.moonNakshatra.pada} => "${J.NAK_SYLLABLES[pan.moonNakshatra.n][pan.moonNakshatra.pada-1]}"`);
if (input.name) console.log(`  Name check: ${JSON.stringify(chart.nameMatch)}`);

console.log(`\nVIMSHOTTARI (balance at birth: ${chart.dasha.mds[0].lord} ${chart.dasha.balanceYears.toFixed(2)}y):`);
for (const m of chart.dasha.mds) console.log(`  ${m.lord.padEnd(8)} ${fdt(m.start)} -> ${fdt(m.end)}`);
const cur = chart.dasha.current;
if (cur) console.log(`  NOW: ${cur.md.lord} MD / ${cur.ad.lord} AD (until ${fdt(cur.ad.end)}) / ${cur.pd ? cur.pd.lord + " PD" : ""}`);

const life = J.lifeTimeline(chart, 90);
console.log(`\nLIFE MAP (${life.mahadashas.reduce((a2, m) => a2 + m.bhuktis.length, 0)} bhuktis):`);
for (const m of life.mahadashas) {
  console.log(`\n== ${m.lord} MD age ${m.ageStart.toFixed(1)}-${m.ageEnd.toFixed(1)} [${m.grade.label} ${m.score}]`);
  console.log(`   ${m.summary}`);
  for (const b of m.bhuktis) {
    console.log(`   ${b.adLord.padEnd(8)} ${b.ageStart.toFixed(1).padStart(5)}-${b.ageEnd.toFixed(1).padStart(5)}  [${b.grade.label.padEnd(9)} ${String(b.score).padStart(2)}] ${fdt(b.startJd)} -> ${fdt(b.endJd)}`);
  }
}
const o = life.overview;
if (o.current) console.log(`\nNow (age ${o.ageNow.toFixed(1)}): ${o.current.mdLord}-${o.current.adLord} [${o.current.grade.label} ${o.current.score}]`);
console.log(`Peaks: ${o.best.map(b => `${b.mdLord}-${b.adLord} age ${b.ageStart.toFixed(1)}-${b.ageEnd.toFixed(1)} (${b.score})`).join(" | ")}`);
console.log(`Care:  ${o.toughest.map(b => `${b.mdLord}-${b.adLord} age ${b.ageStart.toFixed(1)}-${b.ageEnd.toFixed(1)} (${b.score})`).join(" | ")}`);
if (o.current) console.log(`\nCurrent bhukti: ${o.current.text}`);
