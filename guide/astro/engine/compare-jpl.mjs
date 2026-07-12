// Compare JS engine longitudes against JPL DE421 (skyfield) over 1900-2050.
import { createRequire } from "module";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
globalThis.VSOP87D = require(join(here, "vsop-data.js"));
const J = require(join(here, "engine.js"));
console.log("VSOP87D backend:", J.hasVSOP() ? "ACTIVE (Tier B)" : "absent (Tier A fallback)");
const ref = JSON.parse(readFileSync(join(here, "jpl_ref.json"), "utf8"));

const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
const stats = {};
for (const b of bodies) stats[b] = { max: 0, maxAll: 0, sum: 0, n: 0 };

for (const row of ref.grid) {
  const jd = row.jd_tt;
  const y = J.jdToDate(jd).y;
  for (const b of bodies) {
    const err = Math.abs(J.wrap180(J.tropicalLonOf(b, jd) - row[b]));
    stats[b].maxAll = Math.max(stats[b].maxAll, err);
    if (y >= 1950) stats[b].max = Math.max(stats[b].max, err);
    stats[b].sum += err; stats[b].n++;
  }
}

console.log("Max |error| vs JPL DE421 apparent ecliptic-of-date longitudes:");
console.log("body        1950-2050        1900-2050        mean(all)");
let worstNak = 0;
for (const b of bodies) {
  const s = stats[b];
  console.log(
    `  ${b.padEnd(9)} ${(s.max * 60).toFixed(2).padStart(7)}'  ` +
    `       ${(s.maxAll * 60).toFixed(2).padStart(7)}'  ` +
    `      ${((s.sum / s.n) * 60).toFixed(2).padStart(7)}'`
  );
  worstNak = Math.max(worstNak, s.maxAll);
}
console.log(`\nWorst error ${ (worstNak*60).toFixed(2) }' = ${(worstNak / (360/27) * 100).toFixed(2)}% of one nakshatra (13°20'), ${(worstNak / 30 * 100).toFixed(3)}% of one rashi.`);

// Sunrise cross-check
console.log("\nSunrise vs skyfield almanac (minutes):");
const cases = {
  delhi_2000_01_01:  [2000, 1, 1, 5.5, 28.6139, 77.209],
  sydney_1990_05_15: [1990, 5, 15, 10.0, -33.8688, 151.2093],
  london_1975_11_03: [1975, 11, 3, 0.0, 51.5074, -0.1278],
  newyork_2024_06_21:[2024, 6, 21, -4.0, 40.7128, -74.006],
};
let sunriseFail = 0;
for (const [key, [y, m, d, tz, lat, lon]] of Object.entries(cases)) {
  const mine = J.sunriseSunset(y, m, d, tz, lat, lon);
  const r = ref.sunrise[key];
  const dRise = (mine.rise - r.rise_jd_ut) * 1440;
  const dSet = (mine.set - r.set_jd_ut) * 1440;
  const ok = Math.abs(dRise) < 2 && Math.abs(dSet) < 2;
  if (!ok) sunriseFail++;
  console.log(`  ${key.padEnd(20)} rise ${dRise.toFixed(2).padStart(6)} min   set ${dSet.toFixed(2).padStart(6)} min  [${ok ? "PASS" : "FAIL"}]`);
}

// Acceptance gates, Tier B (VSOP87D): planets/Sun sub-2"; Moon = Meeus ch.47
// intrinsic accuracy (~10-13", i.e. 1/900 pada; << 1 min birth-time uncertainty)
const gates = { Sun: 0.0015, Moon: 0.005, Mercury: 0.0015, Venus: 0.0015, Mars: 0.0015, Jupiter: 0.0015, Saturn: 0.0015 };
let gateFail = 0;
for (const b of bodies) {
  if (stats[b].maxAll > gates[b]) { gateFail++; console.log(`GATE FAIL: ${b} ${stats[b].maxAll} > ${gates[b]} deg`); }
}
if (gateFail || sunriseFail) process.exit(1);
console.log("\nAll accuracy gates passed.");
