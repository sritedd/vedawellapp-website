// Parse VSOP87D files -> truncated Poisson series -> vsop-data.js
// Truncation: per variable, drop smallest terms (weighted by tau_max^power)
// while cumulative dropped contribution stays under the error budget.
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const here = dirname(fileURLToPath(import.meta.url));

const FILES = {
  Mercury: "VSOP87D.mer", Venus: "VSOP87D.ven", Earth: "VSOP87D.ear",
  Mars: "VSOP87D.mar", Jupiter: "VSOP87D.jup", Saturn: "VSOP87D.sat"
};
const TAU_MAX = 0.016; // |tau| for ~1860-2160 (millennia from J2000)
// Per-planet budgets targeting <=0.3" worst-case GEOCENTRIC error: heliocentric
// errors amplify by ~max(R_planet,R_earth)/Delta_min near conjunction/opposition
// (Venus 2.8x, Mars 4.5x, Earth-as-observer 3.85x). L,B in rad; R in AU.
const EPS_BY_PLANET = {
  Mercury: { 1: 1.5e-6, 2: 1.5e-6, 3: 8e-7 },
  Venus:   { 1: 5e-7,   2: 5e-7,   3: 3e-7 },
  Earth:   { 1: 4e-7,   2: 4e-7,   3: 3e-7 },
  Mars:    { 1: 3.5e-7, 2: 3.5e-7, 3: 3e-7 },
  Jupiter: { 1: 1.1e-6, 2: 1.1e-6, 3: 4e-6 },
  Saturn:  { 1: 1.2e-6, 2: 1.2e-6, 3: 8e-6 }
};

const out = {};
let totalKept = 0, totalAll = 0;

for (const [planet, fname] of Object.entries(FILES)) {
  const lines = readFileSync(join(here, fname), "latin1").split("\n");
  // varIdx (1=L,2=B,3=R) -> power -> [terms]
  const series = { 1: [], 2: [], 3: [] };
  let cur = null, expect = 0, got = 0;
  for (const line of lines) {
    if (line.startsWith(" VSOP87")) {
      if (cur && got !== expect) throw new Error(`${fname}: expected ${expect} terms, got ${got}`);
      const m = line.match(/VARIABLE (\d).*?\*T\*\*(\d)\s+(\d+) TERMS/);
      if (!m) throw new Error(`${fname}: bad header: ${line}`);
      cur = { v: +m[1], p: +m[2], terms: [] };
      expect = +m[3]; got = 0;
      series[cur.v][cur.p] = cur.terms;
    } else if (line.trim() && cur) {
      // last three floats on the line are A, B, C
      const parts = line.trim().split(/\s+/);
      const C = +parts[parts.length - 1], B = +parts[parts.length - 2], A = +parts[parts.length - 3];
      if (!isFinite(A) || !isFinite(B) || !isFinite(C)) throw new Error(`${fname}: bad line: ${line}`);
      cur.terms.push([A, B, C]);
      got++;
    }
  }
  if (cur && got !== expect) throw new Error(`${fname}: last block expected ${expect}, got ${got}`);

  out[planet] = { L: [], B: [], R: [] };
  const KEYS = { 1: "L", 2: "B", 3: "R" };
  for (const v of [1, 2, 3]) {
    // flatten with weights, decide kept set under global budget for this variable
    const all = [];
    series[v].forEach((terms, p) => {
      if (terms) terms.forEach((t, i) => all.push({ p, i, w: t[0] * Math.pow(TAU_MAX, p), t }));
    });
    all.sort((a, b) => a.w - b.w);
    let dropped = 0;
    const keep = new Set();
    for (const item of all) totalAll++;
    // walk from smallest: drop while budget holds
    let cum = 0;
    const eps = EPS_BY_PLANET[planet][v];
    for (const item of all) {
      if (cum + item.w <= eps) { cum += item.w; dropped++; }
      else keep.add(item);
    }
    for (let p = 0; p < series[v].length; p++) {
      const terms = series[v][p] || [];
      const keptTerms = [];
      all.forEach(item => {
        if (item.p === p && keep.has(item)) keptTerms.push(item.t);
      });
      // keep original order not needed; sort by A desc for numerical niceness
      keptTerms.sort((a, b) => b[0] - a[0]);
      out[planet][KEYS[v]][p] = keptTerms.map(([A, B, C]) => [
        +A.toPrecision(12), +B.toFixed(8), +C.toFixed(8)
      ]);
      totalKept += keptTerms.length;
    }
    // strip trailing empty powers
    while (out[planet][KEYS[v]].length && out[planet][KEYS[v]][out[planet][KEYS[v]].length - 1].length === 0)
      out[planet][KEYS[v]].pop();
  }
}

let js = "/* VSOP87D truncated Poisson series (Bretagnon & Francou 1988).\n";
js += ` * Heliocentric spherical, ecliptic of date. tau = (JD_TT - 2451545)/365250.\n`;
js += ` * Truncated for |tau| <= ${TAU_MAX} (approx 1860-2160) with error budgets\n`;
js += ` * L,B <= 0.05 arcsec, R <= 5e-7 AU. Generated from IMCCE/CDS VSOP87D files. */\n`;
js += "(function (global) {\n  \"use strict\";\n  var VSOP87D = " +
  JSON.stringify(out) + ";\n" +
  "  if (typeof module !== \"undefined\" && module.exports) module.exports = VSOP87D;\n" +
  "  else global.VSOP87D = VSOP87D;\n" +
  "})(typeof window !== \"undefined\" ? window : globalThis);\n";
writeFileSync(join(here, "vsop-data.js"), js);

let kept = 0;
for (const p of Object.keys(out)) for (const v of ["L", "B", "R"]) for (const s of out[p][v]) kept += s.length;
console.log(`Kept ${kept} terms (of ${totalAll} in full VSOP87D). vsop-data.js = ${(js.length / 1024).toFixed(0)} KB`);
for (const p of Object.keys(out)) {
  const counts = ["L", "B", "R"].map(v => out[p][v].map(s => s.length).join("+")).join("  ");
  console.log(`  ${p.padEnd(8)} ${counts}`);
}
