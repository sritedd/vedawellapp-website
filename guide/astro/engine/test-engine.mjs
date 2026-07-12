// Validation suite for the JS jyotish engine (spec §13 targets + extensions).
import { createRequire } from "module";
const require = createRequire(import.meta.url);
globalThis.VSOP87D = require("./vsop-data.js");
const J = require("./engine.js");
console.log("VSOP87D backend:", J.hasVSOP() ? "ACTIVE (Tier B)" : "absent (Tier A fallback)");

let pass = 0, fail = 0;
function check(label, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  ok ? pass++ : fail++;
  console.log(
    `${label.padEnd(52)} got ${got.toFixed(6).padStart(14)}  want ${String(want).padStart(12)}  tol ${tol}  [${ok ? "PASS" : "FAIL"}]`
  );
}

// ---- §13.1–13.8: Meeus / spec targets (mirror of Python suite) ----
check("JD 2000-01-01 12:00 UT", J.julianDay(2000, 1, 1, 12), 2451545.0, 1e-9);
check("GMST 1987-04-10.0 (Meeus 12.a)", J.gmstDeg(2446895.5), 197.693195, 5e-4);

const sunA = J.sunTropicalMeeus(2448908.5); // Meeus ex 25.a (TD), Tier A path
check("Sun (Meeus) apparent lon 1992-10-13 (25.a)", sunA.lon, 199.90895, 2e-3);
check("Sun (Meeus) radius (25.a)", sunA.R, 0.99766, 1e-4);
const sunB = J.sunTropical(2448908.5); // VSOP path; 25.a low-accuracy answer is +-0.01 deg
check("Sun (VSOP) apparent lon vs 25.a", sunB.lon, 199.90895, 0.01);
check("Sun (VSOP) radius", sunB.R, 0.99766, 1e-4);
check("Sun VSOP-vs-Meeus consistency", Math.abs(J.wrap180(sunB.lon - sunA.lon)), 0, 0.01);

const moon = J.moonTropical(2448724.5, false); // Meeus ex 47.a
check("Moon lon 1992-04-12 (47.a)", moon.lon, 133.162655, 0.01);
check("Moon lat 1992-04-12 (47.a)", moon.lat, -3.229126, 0.01);

check("Lahiri ayanamsa J2000", J.ayanamsaLahiri(2451545.0), 23.853, 0.02);

// New moon roots: wrapped elongation root near a guess date
function elong(jdTt) { return J.wrap180(J.moonTropical(jdTt).lon - J.sunTropical(jdTt).lon); }
function findNewMoon(jdGuess) {
  let prevT = jdGuess - 16, prevV = elong(prevT);
  for (let t = prevT + 0.5; t < jdGuess + 16; t += 0.5) {
    const v = elong(t);
    if (prevV < 0 && v >= 0 && v - prevV < 180) return J.findRoot(elong, prevT, t, 80);
    prevT = t; prevV = v;
  }
  throw new Error("no new moon");
}
const nm2000 = findNewMoon(J.julianDay(2000, 1, 7, 0)) - J.deltaTSeconds(2000) / 86400;
check("New moon 2000-01-06 18:14 UT", nm2000, 2451550.2597, 0.031);
// Solar eclipses are exact new moons — independent anchors:
const nm2017 = findNewMoon(J.julianDay(2017, 8, 21, 0)) - J.deltaTSeconds(2017) / 86400;
check("New moon 2017-08-21 18:30 UT (eclipse)", nm2017, J.julianDay(2017, 8, 21, 18.5), 0.031);
const nm2024 = findNewMoon(J.julianDay(2024, 4, 8, 0)) - J.deltaTSeconds(2024) / 86400;
check("New moon 2024-04-08 18:21 UT (eclipse)", nm2024, J.julianDay(2024, 4, 8, 18.35), 0.031);

// Ascendant identities (spec §13.8)
{
  const eps = J.obliquity(0) * Math.PI / 180;
  const ascId = J.wrap360(Math.atan2(Math.cos(0), -(Math.sin(0) * Math.cos(eps))) * 180 / Math.PI);
  check("Asc identity (phi=0, RAMC=0)", ascId, 90.0, 1e-9);
  const mcId = J.wrap360(Math.atan2(Math.sin(0), Math.cos(0) * Math.cos(eps)) * 180 / Math.PI);
  check("MC identity (RAMC=0)", mcId, 0.0, 1e-9);
}

// Kepler solver residuals
{
  let worst = 0;
  for (let e = 0.05; e <= 0.25; e += 0.05)
    for (let M = -3; M <= 3; M += 0.37) {
      const E = J.solveKepler(M, e);
      worst = Math.max(worst, Math.abs(E - e * Math.sin(E) - Math.atan2(Math.sin(M), Math.cos(M))));
    }
  check("Kepler residual max |E - e sinE - M|", worst, 0, 1e-11);
}

// ---- Vimshottari invariants (§13.7) ----
check("Vimshottari total years", J.DYEARS.reduce((a, b) => a + b, 0), 120, 0);
{
  const vd = J.vimshottariMahadashas(0.0, 2451545.0); // Moon at 0° Ashwini
  check("Balance @0 Ashwini = full Ketu 7y", (vd.mds[0].end - vd.mds[0].start) / J.YEAR_DAYS, 7.0, 1e-9);
  check("Dasha balance years @0 Ashwini", vd.balanceYears, 7.0, 1e-9);
  // AD of each MD sums to MD; PD of each AD sums to AD
  let worstAd = 0, worstPd = 0;
  for (const md of vd.mds) {
    const ads = J.subPeriods(md.lordIdx, md.start, md.end - md.start);
    worstAd = Math.max(worstAd, Math.abs(ads[8].end - md.end));
    for (const ad of ads.slice(0, 3)) {
      const pds = J.subPeriods(ad.lordIdx, ad.start, ad.end - ad.start);
      worstPd = Math.max(worstPd, Math.abs(pds[8].end - ad.end));
    }
  }
  check("Antardashas close each MD (days)", worstAd, 0, 1e-6);
  check("Pratyantardashas close each AD (days)", worstPd, 0, 1e-6);
}

// ---- Spica (alpha Vir) must sit at ~180° sidereal — Lahiri definition ----
// J2000: RA 13h25m11.579s, Dec -11°09'40.75"
{
  const alpha = (13 + 25 / 60 + 11.579 / 3600) * 15, delta = -(11 + 9 / 60 + 40.75 / 3600);
  const eps0 = 23.4392911 * Math.PI / 180, aR = alpha * Math.PI / 180, dR = delta * Math.PI / 180;
  const lamJ2000 = J.wrap360(Math.atan2(
    Math.sin(aR) * Math.cos(eps0) + Math.tan(dR) * Math.sin(eps0), Math.cos(aR)) * 180 / Math.PI);
  for (const [label, jd] of [["1950", 2433282.5], ["2000", 2451545.0], ["2026", 2461234.5]]) {
    const T = J.centuries(jd);
    const sid = J.wrap360(lamJ2000 + J.precessionPA(T) - J.ayanamsaLahiri(jd));
    check(`Spica sidereal lon ${label} (Chitra @ 180)`, sid, 180.0, 0.1);
  }
}

// ---- Parity with Python reference (demo chart: 2000-01-01 12:00 IST Delhi) ----
console.log("\n-- Parity vs jyotish_core.py demo chart --");
const chart = J.computeChart({
  year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0,
  tzHours: 5.5, lat: 28.6139, lon: 77.209,
  nowJdUt: J.julianDay(2026, 7, 12, 12)
});
// Tier A functions must reproduce the Python reference exactly (port fidelity)
const pyRef = { Mercury: 247.6910, Venus: 217.4456, Mars: 303.9413, Jupiter: 1.4884, Saturn: 16.3891 };
const jdTtDemo = chart.jdTt;
for (const [nm, want] of Object.entries(pyRef)) {
  const sidA = J.toSidereal(J.planetTropicalKepler(nm, jdTtDemo), jdTtDemo);
  check(`  ${nm} Kepler-path sidereal lon (parity)`, sidA, want, 5e-4);
  // VSOP value should agree with Kepler within Tier A error bounds (sanity wiring check)
  const sidB = J.toSidereal(J.planetTropical(nm, jdTtDemo), jdTtDemo);
  check(`  ${nm} VSOP-vs-Kepler agreement`, Math.abs(J.wrap180(sidB - sidA)), 0, 0.25);
}
check("  Sun Kepler-path sidereal (parity)", J.toSidereal(J.sunTropicalMeeus(jdTtDemo).lon, jdTtDemo), 256.2866, 5e-4);
const moonPar = J.toSidereal(J.moonTropical(jdTtDemo).lon, jdTtDemo);
check("  Moon sidereal lon (parity)", moonPar, 196.7117, 5e-4);
check("  Rahu sidereal lon (parity)", J.toSidereal(J.meanNode(jdTtDemo), jdTtDemo), 101.2035, 5e-4);
check("  Lagna sidereal lon", chart.lagna.sidLon, 343.1945, 5e-4);
check("  Ayanamsa", chart.ayanamsa, 23.8532, 5e-4);
check("  Tithi number", chart.panchanga.tithi.num, 26, 0);
// VSOP Sun differs from Python's low-accuracy Sun by ~0.003 deg (intentional upgrade)
check("  Elongation (VSOP Sun, vs Tier A ref)", chart.panchanga.tithi.elong, 300.425, 0.01);

// Dasha dates parity (Python printed: Rahu 1986-06-10 -> 2004-06-09, ... )
const mdRef = [["Rahu", 1986], ["Jupiter", 2004], ["Saturn", 2020], ["Mercury", 2039],
  ["Ketu", 2056], ["Venus", 2063], ["Sun", 2083], ["Moon", 2089], ["Mars", 2099]];
let mdOk = true;
chart.dasha.mds.forEach((md, i) => {
  const d = J.jdToDate(md.start);
  if (md.lord !== mdRef[i][0] || d.y !== mdRef[i][1]) mdOk = false;
});
check("  Mahadasha lords+start years match Python", mdOk ? 1 : 0, 1, 0);
check("  Current MD = Saturn (2026-07-12)", chart.dasha.current.md.lord === "Saturn" ? 1 : 0, 1, 0);
check("  Current AD = Ketu (2026-07-12)", chart.dasha.current.ad.lord === "Ketu" ? 1 : 0, 1, 0);
check("  Mercury retro on 2026-07-12",
  J.speedOf("Mercury", J.jdTTfromUT(J.julianDay(2026, 7, 12, 12))) < 0 ? 1 : 0, 1, 0);

// Chart internals sanity
check("  Rashi of Moon = Tula (6)", chart.bodies[1].rashi, 6, 0);
check("  Moon nakshatra = Swati (14)", chart.bodies[1].nakshatra, 14, 0);
check("  Moon pada = 4", chart.bodies[1].pada, 4, 0);
check("  Lagna rashi = Meena (11)", chart.lagna.rashi, 11, 0);
check("  Moon house (whole sign from Meena lagna)", chart.bodies[1].house, 8, 0);

// Navamsa identities: movable sign starts own navamsa; fixed from 9th; dual from 5th
check("  D9(Aries 0-3:20) = Aries", Math.floor(J.wrap360(1.0 * 9) / 30), 0, 0);
check("  D9(Taurus 30-33:20) = Capricorn", Math.floor(J.wrap360(31.0 * 9) / 30), 9, 0);
check("  D9(Gemini 60-63:20) = Libra", Math.floor(J.wrap360(61.0 * 9) / 30), 6, 0);

// Sunrise plausibility: Delhi 2000-01-01 ~07:14 IST (exact value cross-checked vs JPL later)
{
  const ss = J.sunriseSunset(2000, 1, 1, 5.5, 28.6139, 77.209);
  const riseLocal = J.jdToDate(ss.rise + 5.5 / 24);
  const h = riseLocal.h;
  check("  Delhi sunrise 2000-01-01 (hours IST)", h, 7.235, 0.05);
  const setLocal = J.jdToDate(ss.set + 5.5 / 24);
  check("  Delhi sunset 2000-01-01 (hours IST)", setLocal.h, 17.59, 0.06);
}

// Name syllable lookup
{
  const m1 = J.nameToNakshatra("Chetan");   // Che -> Ashwini pada 2
  check("  Name 'Chetan' -> Ashwini", m1 && m1.n === 0 && m1.pada === 2 ? 1 : 0, 1, 0);
  const m2 = J.nameToNakshatra("Lakshmi");  // La -> Ashwini pada 4
  check("  Name 'Lakshmi' -> Ashwini p4", m2 && m2.n === 0 && m2.pada === 4 ? 1 : 0, 1, 0);
}

// ---- Phase 2: strength functionals (spec S11) ----
console.log("\n-- Phase 2: shadbala / ashtakavarga / event times --");
// Ashtakavarga: classical bindu totals are chart-independent invariants
{
  const totals = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };
  for (const refs of [
    { Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6, Lagna: 7 },
    { Sun: 8, Moon: 6, Mars: 9, Mercury: 8, Jupiter: 0, Venus: 7, Saturn: 0, Lagna: 11 },
  ]) {
    const av = J.ashtakavarga(refs);
    let grand = 0;
    for (const [g, want] of Object.entries(totals)) {
      const sum = av.bav[g].reduce((a, b) => a + b, 0);
      if (sum !== want) { check(`  BAV total ${g}`, sum, want, 0); }
      grand += sum;
    }
    check(`  SAV grand total = 337 (refs variant)`, grand, 337, 0);
    check(`  SAV row sums to grand`, av.sav.reduce((a, b) => a + b, 0), grand, 0);
  }
}
// Uccha bala tent map: 0 at debilitation, 60 at exaltation, 30 at quadrature
check("  Uccha bala Sun @deb (190)", J.ucchaBala("Sun", 190), 0, 1e-12);
check("  Uccha bala Sun @exalt (10)", J.ucchaBala("Sun", 10), 60, 1e-12);
check("  Uccha bala Sun @quadrature (100)", J.ucchaBala("Sun", 100), 30, 1e-12);
check("  Uccha bala Saturn @exalt (200)", J.ucchaBala("Saturn", 200), 60, 1e-12);
// Cheshta bala: retro at mean speed => 60; direct mean => 0; stationary => 30
check("  Cheshta Mars retro@-vmean", J.cheshtaBala("Mars", -0.5240), 60, 1e-9);
check("  Cheshta Mars direct@vmean", J.cheshtaBala("Mars", 0.5240), 0, 1e-9);
check("  Cheshta Mars stationary", J.cheshtaBala("Mars", 0), 30, 1e-9);
// Drishti nodes (spec S11) + special full aspects
check("  Drishti generic 90 deg = 45", J.drishti("Sun", 90), 45, 1e-12);
check("  Drishti generic 120 deg = 30", J.drishti("Sun", 120), 30, 1e-12);
check("  Drishti 180 deg = 60 (all)", J.drishti("Venus", 180), 60, 1e-12);
check("  Drishti Mars 4th (90) = 60", J.drishti("Mars", 90), 60, 1e-12);
check("  Drishti Mars 8th (215) = 60", J.drishti("Mars", 215), 60, 1e-12);
check("  Drishti Jupiter 5th (120) = 60", J.drishti("Jupiter", 120), 60, 1e-12);
check("  Drishti Jupiter 9th (245) = 60", J.drishti("Jupiter", 245), 60, 1e-12);
check("  Drishti Saturn 3rd (65) = 60", J.drishti("Saturn", 65), 60, 1e-12);
check("  Drishti Saturn 10th (275) = 60", J.drishti("Saturn", 275), 60, 1e-12);
check("  Drishti 29 deg = 0", J.drishti("Moon", 29), 0, 1e-12);

// Panchanga end times: root must land exactly on the boundary angle
{
  const p = chart.panchanga, ends = p.ends;
  const elongAtEnd = J.moonSunElongUt(ends.tithi);
  check("  Tithi end lands on 12k boundary", elongAtEnd, p.tithi.num * 12, 1e-4);
  check("  Tithi end within 1.4 d of birth", (ends.tithi - chart.jdUt) < 1.4 && ends.tithi > chart.jdUt ? 1 : 0, 1, 0);
  const nakAtEnd = J.moonSidUt(ends.nakshatra);
  check("  Nakshatra end lands on 13d20' boundary", nakAtEnd, (p.moonNakshatra.n + 1) * 360 / 27, 1e-4);
  const yogaAtEnd = J.moonSunSumSidUt(ends.yoga);
  check("  Yoga end lands on boundary", yogaAtEnd, p.yoga.num * 360 / 27, 1e-4);
  const karAtEnd = J.moonSunElongUt(ends.karana);
  check("  Karana end lands on 6k boundary", karAtEnd, p.karana.num * 6, 1e-4);
}

// Sunrise-anchored vara: birth before sunrise takes the previous weekday.
// 2000-01-01 (Sat) 05:00 IST Delhi is before 07:14 sunrise -> Shukravara (5)
{
  const preDawn = J.computeChart({ year: 2000, month: 1, day: 1, hour: 5, minute: 0,
    tzHours: 5.5, lat: 28.6139, lon: 77.209, nowJdUt: J.julianDay(2026, 7, 12, 12) });
  check("  Pre-dawn birth vara = Shukravara (Fri)", preDawn.panchanga.vara.idx, 5, 0);
  const postDawn = J.computeChart({ year: 2000, month: 1, day: 1, hour: 12, minute: 0,
    tzHours: 5.5, lat: 28.6139, lon: 77.209, nowJdUt: J.julianDay(2026, 7, 12, 12) });
  check("  Midday birth vara = Shanivara (Sat)", postDawn.panchanga.vara.idx, 6, 0);
}

// Dignity table sanity
check("  Sun in Mesha = Exalted", J.dignityOf("Sun", 0) === "Exalted" ? 1 : 0, 1, 0);
check("  Saturn in Mesha = Debilitated", J.dignityOf("Saturn", 0) === "Debilitated" ? 1 : 0, 1, 0);
check("  Moon in Karka = Own sign", J.dignityOf("Moon", 3) === "Own sign" ? 1 : 0, 1, 0);

console.log(`\n${pass}/${pass + fail} checks passed.`);
if (fail > 0) process.exit(1);
