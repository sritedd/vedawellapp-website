/* ============================================================================
 * Jyotish Computation Engine — JavaScript port of jyotish_core.py (v1)
 * Spec: vedawell-next/guide/astro/jyotish_math_spec.md
 * First-principles: Kepler's equation (Newton–Raphson), truncated perturbation
 * series for Sun/Moon (Meeus ch.25/47), spherical trig for lagna, precession
 * ayanamsa (Lahiri), root-finding for events, derivatives for retrogrades,
 * Vimshottari proportional-measure operator.
 * ========================================================================== */
(function (global) {
  "use strict";

  var D2R = Math.PI / 180.0;
  var R2D = 180.0 / Math.PI;
  var YEAR_DAYS = 365.25; // dasha year convention

  // ------------------------------------------------------------- utilities
  function wrap360(x) { return ((x % 360) + 360) % 360; }
  function wrap180(x) { return wrap360(x + 180) - 180; }

  // Meeus ch.7, Gregorian. d may be fractional.
  function julianDay(y, m, d, utHours) {
    d = d + (utHours || 0) / 24.0;
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100);
    var b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }

  function jdToDate(jd) {
    jd += 0.5;
    var z = Math.floor(jd), f = jd - z;
    var a;
    if (z >= 2299161) {
      var alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    } else { a = z; }
    var b = a + 1524;
    var c = Math.floor((b - 122.1) / 365.25);
    var d = Math.floor(365.25 * c);
    var e = Math.floor((b - d) / 30.6001);
    var day = b - d - Math.floor(30.6001 * e) + f;
    var month = (e < 14) ? e - 1 : e - 13;
    var year = (month > 2) ? c - 4716 : c - 4715;
    var hrs = (day - Math.floor(day)) * 24;
    return { y: year, m: month, d: Math.floor(day), h: hrs };
  }

  // Espenak–Meeus ΔT piecewise polynomials, extended 1800–2150.
  function deltaTSeconds(year) {
    var t, u;
    if (year < 1860) {
      t = year - 1800;
      return 13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * t * t * t
        - 0.00037436 * Math.pow(t, 4) + 0.0000121272 * Math.pow(t, 5)
        - 0.0000001699 * Math.pow(t, 6) + 0.000000000875 * Math.pow(t, 7);
    }
    if (year < 1900) {
      t = year - 1860;
      return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t
        - 0.0004473624 * Math.pow(t, 4) + Math.pow(t, 5) / 233174;
    }
    if (year < 1920) {
      t = year - 1900;
      return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t * t * t - 0.000197 * Math.pow(t, 4);
    }
    if (year < 1941) {
      t = year - 1920;
      return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t * t * t;
    }
    if (year < 1961) {
      t = year - 1950;
      return 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547;
    }
    if (year < 1986) {
      t = year - 1975;
      return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718;
    }
    if (year < 2005) {
      t = year - 2000;
      return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t
        + 0.000651814 * Math.pow(t, 4) + 0.00002373599 * Math.pow(t, 5);
    }
    if (year < 2050) {
      t = year - 2000;
      return 62.92 + 0.32217 * t + 0.005589 * t * t;
    }
    u = (year - 1820) / 100;
    return -20 + 32 * u * u - 0.5628 * (2150 - year);
  }

  function jdTTfromUT(jdUt) {
    var dt = jdToDate(jdUt);
    return jdUt + deltaTSeconds(dt.y + (dt.m - 0.5) / 12.0) / 86400.0;
  }

  function centuries(jdTt) { return (jdTt - 2451545.0) / 36525.0; }

  // ----------------------------------------- VSOP87D backend (Tier B)
  // Heliocentric spherical (L,B rad; R AU), ecliptic of date. Loaded from
  // the optional VSOP87D data script; engine falls back to Tier A without it.
  function getVSOP() {
    if (typeof VSOP87D !== "undefined") return VSOP87D;
    return global.VSOP87D || null;
  }

  function vsopSeries(seriesByPower, tau) {
    var v = 0, tp = 1;
    for (var k = 0; k < seriesByPower.length; k++) {
      var s = seriesByPower[k], acc = 0;
      for (var i = 0; i < s.length; i++) {
        acc += s[i][0] * Math.cos(s[i][1] + s[i][2] * tau);
      }
      v += acc * tp;
      tp *= tau;
    }
    return v;
  }

  function vsopHelio(name, jdTt) {
    var data = getVSOP()[name];
    var tau = (jdTt - 2451545.0) / 365250.0;
    return {
      L: vsopSeries(data.L, tau),
      B: vsopSeries(data.B, tau),
      R: vsopSeries(data.R, tau)
    };
  }

  function vsopRect(name, jdTt) {
    var s = vsopHelio(name, jdTt);
    var cb = Math.cos(s.B);
    return { x: s.R * cb * Math.cos(s.L), y: s.R * cb * Math.sin(s.L), z: s.R * Math.sin(s.B), L: s.L, B: s.B, R: s.R };
  }

  var ABERR_K = 20.49552 / 3600.0; // constant of aberration, deg

  // ------------------------------------------------------- Sun (Meeus 25)
  // Tier A closed-form series; kept as fallback and validation reference.
  function sunTropicalMeeus(jdTt, apparent) {
    if (apparent === undefined) apparent = true;
    var T = centuries(jdTt);
    var L0 = wrap360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    var M = wrap360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    var e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    var Mr = M * D2R;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
      + 0.000289 * Math.sin(3 * Mr);
    var theta = L0 + C;
    var nu = (M + C) * D2R;
    var R = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(nu));
    if (apparent) {
      var omega = (125.04 - 1934.136 * T) * D2R;
      theta = theta - 0.00569 - 0.00478 * Math.sin(omega); // nutation + aberration
    }
    return { lon: wrap360(theta), R: R };
  }

  // Sun via VSOP87D Earth (geometric geocentric = heliocentric Earth + 180deg),
  // apparent: + nutation - aberration(R).
  function sunTropical(jdTt, apparent) {
    if (apparent === undefined) apparent = true;
    if (!getVSOP()) return sunTropicalMeeus(jdTt, apparent);
    var e = vsopHelio("Earth", jdTt);
    var lam = wrap360(e.L * R2D + 180.0);
    if (apparent) {
      lam = wrap360(lam + nutationDpsi(centuries(jdTt)) - (20.4898 / 3600.0) / e.R);
    }
    return { lon: lam, R: e.R };
  }

  // ------------------------------------------------------ Moon (Meeus 47)
  // (D, M, M', F, coeff of sin, unit 1e-6 deg)
  var LTERMS = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],
    [0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],
    [2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
    [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],
    [4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
    [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],
    [2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],
    [0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
    [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
    [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],
    [2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],
    [4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,-381],
    [1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],[2,-1,2,0,327],
    [0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294]
  ];
  var BTERMS = [
    [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],
    [2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],
    [2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
    [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],
    [2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],
    [0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],
    [0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],
    [4,0,0,-1,1021],[4,0,-1,1,833]
  ];

  function moonArgs(T) {
    var T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    return {
      Lp: wrap360(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000),
      D:  wrap360(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000),
      M:  wrap360(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000),
      Mp: wrap360(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000),
      F:  wrap360(93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000)
    };
  }

  function moonTropical(jdTt, apparent) {
    if (apparent === undefined) apparent = true;
    var T = centuries(jdTt);
    var a = moonArgs(T);
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var A1 = wrap360(119.75 + 131.849 * T);
    var A2 = wrap360(53.09 + 479264.290 * T);
    var A3 = wrap360(313.45 + 481266.484 * T);
    var sl = 0.0, sb = 0.0, i, t, arg, ecc;
    for (i = 0; i < LTERMS.length; i++) {
      t = LTERMS[i];
      arg = (t[0] * a.D + t[1] * a.M + t[2] * a.Mp + t[3] * a.F) * D2R;
      ecc = Math.pow(E, Math.abs(t[1]));
      sl += t[4] * ecc * Math.sin(arg);
    }
    sl += 3958 * Math.sin(A1 * D2R) + 1962 * Math.sin((a.Lp - a.F) * D2R) + 318 * Math.sin(A2 * D2R);
    for (i = 0; i < BTERMS.length; i++) {
      t = BTERMS[i];
      arg = (t[0] * a.D + t[1] * a.M + t[2] * a.Mp + t[3] * a.F) * D2R;
      ecc = Math.pow(E, Math.abs(t[1]));
      sb += t[4] * ecc * Math.sin(arg);
    }
    sb += -2235 * Math.sin(a.Lp * D2R) + 382 * Math.sin(A3 * D2R)
      + 175 * Math.sin((A1 - a.F) * D2R) + 175 * Math.sin((A1 + a.F) * D2R)
      + 127 * Math.sin((a.Lp - a.Mp) * D2R) - 115 * Math.sin((a.Lp + a.Mp) * D2R);
    var lam = wrap360(a.Lp + sl * 1e-6);
    var beta = sb * 1e-6;
    if (apparent) lam = wrap360(lam + nutationDpsi(T));
    return { lon: lam, lat: beta };
  }

  // --------------------------------------- nutation, obliquity, mean node
  function nutationDpsi(T) {
    var Om = (125.04452 - 1934.136261 * T) * D2R;
    var Ls = (280.4665 + 36000.7698 * T) * D2R;
    var Lm = (218.3165 + 481267.8813 * T) * D2R;
    return (-17.20 * Math.sin(Om) - 1.32 * Math.sin(2 * Ls)
      - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * Om)) / 3600.0;
  }

  function obliquity(T) {
    return 23.43929111 - 0.01300417 * T - 1.639e-7 * T * T + 5.036e-7 * T * T * T;
  }

  function meanNode(jdTt) { // Rahu (mean); Ketu = +180
    var T = centuries(jdTt);
    return wrap360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
  }

  // ------------------------------------------------------------- ayanamsa
  var AYAN_J2000 = 23.85316; // Lahiri (Chitra-paksha) at J2000, deg

  function precessionPA(T) { return (5028.796195 * T + 1.1054348 * T * T) / 3600.0; }
  function ayanamsaLahiri(jdTt) { return AYAN_J2000 + precessionPA(centuries(jdTt)); }
  function toSidereal(lamTropical, jdTt) { return wrap360(lamTropical - ayanamsaLahiri(jdTt)); }

  // ----------------------------- planets: Kepler + Standish 1800–2050 fit
  // a, a', e, e', i, i', L, L', varpi, varpi', Omega, Omega' (per Julian century)
  var ELEM = {
    Mercury: [0.38709927,0.00000037,0.20563593,0.00001906,7.00497902,-0.00594749,
              252.25032350,149472.67411175,77.45779628,0.16047689,48.33076593,-0.12534081],
    Venus:   [0.72333566,0.00000390,0.00677672,-0.00004107,3.39467605,-0.00078890,
              181.97909950,58517.81538729,131.60246718,0.00268329,76.67984255,-0.27769418],
    Earth:   [1.00000261,0.00000562,0.01671123,-0.00004392,-0.00001531,-0.01294668,
              100.46457166,35999.37244981,102.93768193,0.32327364,0.0,0.0],
    Mars:    [1.52371034,0.00001847,0.09339410,0.00007882,1.84969142,-0.00813131,
              -4.55343205,19140.30268499,-23.94362959,0.44441088,49.55953891,-0.29257343],
    Jupiter: [5.20288700,-0.00011607,0.04838624,-0.00013253,1.30439695,-0.00183714,
              34.39644051,3034.74612775,14.72847983,0.21252668,100.47390909,0.20469106],
    Saturn:  [9.53667594,-0.00125060,0.05386179,-0.00050991,2.48599187,0.00193609,
              49.95424423,1222.49362201,92.59887831,-0.41897216,113.66242448,-0.28867794]
  };

  // Newton–Raphson on f(E) = E - e sinE - M. Quadratic convergence.
  function solveKepler(Mrad, e) {
    Mrad = Math.atan2(Math.sin(Mrad), Math.cos(Mrad)); // wrap to (-pi, pi]
    var E = Mrad + e * Math.sin(Mrad);
    for (var i = 0; i < 30; i++) {
      var dE = (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-12) break;
    }
    return E;
  }

  function helioXYZ(name, T) {
    var el = ELEM[name];
    var a = el[0] + el[1] * T, e = el[2] + el[3] * T;
    var i = (el[4] + el[5] * T) * D2R;
    var L = wrap360(el[6] + el[7] * T);
    var varpi = el[8] + el[9] * T;
    var Om = (el[10] + el[11] * T) * D2R;
    var M = wrap360(L - varpi) * D2R;
    var w = (varpi - Om * R2D) * D2R;
    var E = solveKepler(M, e);
    var nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    var r = a * (1 - e * Math.cos(E));
    var u = w + nu;
    return {
      x: r * (Math.cos(Om) * Math.cos(u) - Math.sin(Om) * Math.sin(u) * Math.cos(i)),
      y: r * (Math.sin(Om) * Math.cos(u) + Math.cos(Om) * Math.sin(u) * Math.cos(i)),
      z: r * Math.sin(u) * Math.sin(i)
    };
  }

  // Geocentric of-date apparent ecliptic longitude (deg): VSOP87D positions,
  // light-time iteration, annual aberration (Meeus 23.2), nutation.
  function planetTropical(name, jdTt) {
    if (!getVSOP()) return planetTropicalKepler(name, jdTt);
    var e = vsopRect("Earth", jdTt);
    var p = vsopRect(name, jdTt);
    for (var k = 0; k < 2; k++) { // light-time iteration
      var dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var tauLt = dist * 499.004784 / 86400.0; // days
      p = vsopRect(name, jdTt - tauLt);
    }
    var gx = p.x - e.x, gy = p.y - e.y, gz = p.z - e.z;
    var lam = Math.atan2(gy, gx);
    var beta = Math.atan2(gz, Math.sqrt(gx * gx + gy * gy));
    var sunLon = e.L + Math.PI; // geometric solar longitude, rad
    lam -= (ABERR_K * D2R) * Math.cos(sunLon - lam) / Math.cos(beta); // annual aberration
    return wrap360(lam * R2D + nutationDpsi(centuries(jdTt)));
  }

  // Tier A fallback: Keplerian elements + light-time (kept for validation).
  function planetTropicalKepler(name, jdTt) {
    var T = centuries(jdTt);
    var earth = helioXYZ("Earth", T);
    var p = helioXYZ(name, T);
    for (var k = 0; k < 2; k++) { // light-time iteration
      var dx = p.x - earth.x, dy = p.y - earth.y, dz = p.z - earth.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var tau = dist * 499.004784 / 86400.0;
      p = helioXYZ(name, T - tau / 36525.0);
    }
    var lamJ2000 = Math.atan2(p.y - earth.y, p.x - earth.x) * R2D;
    return wrap360(lamJ2000 + precessionPA(T)); // J2000 -> of-date
  }

  // ------------------------------------- sidereal time, lagna, midheaven
  function gmstDeg(jdUt) {
    var Tu = (jdUt - 2451545.0) / 36525.0;
    return wrap360(280.46061837 + 360.98564736629 * (jdUt - 2451545.0)
      + 0.000387933 * Tu * Tu - Tu * Tu * Tu / 38710000.0);
  }

  function ascMc(jdUt, latDeg, lonEastDeg) {
    var jdTt = jdTTfromUT(jdUt);
    var T = centuries(jdTt);
    var eps = obliquity(T) * D2R;
    var theta = wrap360(gmstDeg(jdUt) + lonEastDeg) * D2R; // RAMC
    var phi = latDeg * D2R;
    var mc = wrap360(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) * R2D);
    var asc = wrap360(Math.atan2(Math.cos(theta),
      -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * R2D);
    return { asc: asc, mc: mc };
  }

  // ------------------------------------------ nakshatra / rashi / names
  var NAK = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu",
    "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati",
    "Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana",
    "Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  var RASHI = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula",
    "Vrischika","Dhanu","Makara","Kumbha","Meena"];
  var RASHI_EN = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra",
    "Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  var RASHI_LORD = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus",
    "Mars","Jupiter","Saturn","Saturn","Jupiter"];
  var NAK_DEITY = ["Ashwini Kumaras","Yama","Agni","Brahma","Soma","Rudra","Aditi",
    "Brihaspati","Nagas","Pitris","Bhaga","Aryaman","Savitar","Tvashtar","Vayu",
    "Indra-Agni","Mitra","Indra","Nirriti","Apas","Vishvedevas","Vishnu",
    "Ashta Vasus","Varuna","Ajaikapada","Ahirbudhnya","Pushan"];
  var NAK_SYMBOL = ["Horse's head","Yoni","Razor / flame","Ox-cart","Deer's head","Teardrop","Bow & quiver",
    "Cow's udder","Coiled serpent","Royal throne","Front of a cot","Back of a cot","Hand","Bright jewel","Young sprout",
    "Triumphal arch","Lotus","Earring / umbrella","Bunch of roots","Winnowing fan","Elephant tusk","Three footprints",
    "Drum (mridanga)","Empty circle","Sword / two front legs of a cot","Twins / two back legs of a cot","Fish / drum"];

  // 108 pada name-syllables (Avakahada chakra)
  var NAK_SYLLABLES = [
    ["Chu","Che","Cho","La"],["Li","Lu","Le","Lo"],["A","I","U","E"],["O","Va","Vi","Vu"],
    ["Ve","Vo","Ka","Ki"],["Ku","Gha","Nga","Chha"],["Ke","Ko","Ha","Hi"],["Hu","He","Ho","Da"],
    ["Di","Du","De","Do"],["Ma","Mi","Mu","Me"],["Mo","Ta","Ti","Tu"],["Te","To","Pa","Pi"],
    ["Pu","Sha","Na","Tha"],["Pe","Po","Ra","Ri"],["Ru","Re","Ro","Ta"],["Ti","Tu","Te","To"],
    ["Na","Ni","Nu","Ne"],["No","Ya","Yi","Yu"],["Ye","Yo","Bha","Bhi"],["Bhu","Dha","Pha","Dha"],
    ["Bhe","Bho","Ja","Ji"],["Ju","Je","Jo","Gha"],["Ga","Gi","Gu","Ge"],["Go","Sa","Si","Su"],
    ["Se","So","Da","Di"],["Du","Tha","Jha","Yna"],["De","Do","Cha","Chi"]
  ];

  function nakshatraOf(lamSid) {
    var span = 360.0 / 27.0;
    var n = Math.floor(lamSid / span);
    if (n > 26) n = 26;
    var rem = lamSid - n * span;
    var pada = Math.floor(rem / (span / 4)) + 1;
    if (pada > 4) pada = 4;
    return { n: n, pada: pada, frac: rem / span };
  }

  // ----------------------------------------------------------- panchanga
  var TITHI_NAMES = ["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi",
    "Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi"];
  var YOGA_NAMES = ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda",
    "Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra",
    "Siddhi","Vyatipata","Variyan","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla",
    "Brahma","Indra","Vaidhriti"];
  var KARANA_MOVABLE = ["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti"];
  var VARA_NAMES = ["Ravivara (Sunday)","Somavara (Monday)","Mangalavara (Tuesday)",
    "Budhavara (Wednesday)","Guruvara (Thursday)","Shukravara (Friday)","Shanivara (Saturday)"];
  var VARA_LORD = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

  function tithiOf(lamMoon, lamSun) {
    var s = wrap360(lamMoon - lamSun);
    var idx = Math.floor(s / 12); // 0..29
    var paksha = idx < 15 ? "Shukla" : "Krishna";
    var name;
    if (idx === 14) name = "Purnima";
    else if (idx === 29) name = "Amavasya";
    else name = TITHI_NAMES[idx % 15];
    return { num: idx + 1, name: name, paksha: paksha, elong: s };
  }

  function karanaOf(elong) {
    var k = Math.floor(elong / 6); // 0..59
    var name;
    if (k === 0) name = "Kimstughna";
    else if (k === 57) name = "Shakuni";
    else if (k === 58) name = "Chatushpada";
    else if (k === 59) name = "Naga";
    else name = KARANA_MOVABLE[(k - 1) % 7];
    return { num: k + 1, name: name };
  }

  function yogaOf(lamMoonSid, lamSunSid) {
    var u = wrap360(lamMoonSid + lamSunSid);
    var idx = Math.floor(u / (360 / 27));
    if (idx > 26) idx = 26;
    return { num: idx + 1, name: YOGA_NAMES[idx] };
  }

  // ------------------------------------------------- sunrise (root-find)
  // Apparent solar altitude (deg) at jdUt for observer (lat, lonEast).
  function sunAltitude(jdUt, latDeg, lonEastDeg) {
    var jdTt = jdTTfromUT(jdUt);
    var T = centuries(jdTt);
    var lam = sunTropical(jdTt, true).lon * D2R;
    var eps = obliquity(T) * D2R;
    var alpha = Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam));
    var delta = Math.asin(Math.sin(lam) * Math.sin(eps));
    var H = (wrap360(gmstDeg(jdUt) + lonEastDeg) * D2R) - alpha;
    var phi = latDeg * D2R;
    return Math.asin(Math.sin(phi) * Math.sin(delta)
      + Math.cos(phi) * Math.cos(delta) * Math.cos(H)) * R2D;
  }

  // Bisection root of g on [a,b] (g(a), g(b) opposite signs).
  function findRoot(g, a, b, iters) {
    iters = iters || 60;
    var fa = g(a), fb = g(b);
    if (fa === 0) return a;
    if (fa * fb > 0) return null;
    for (var i = 0; i < iters; i++) {
      var m = 0.5 * (a + b), fm = g(m);
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return 0.5 * (a + b);
  }

  // Sunrise & sunset (JD UT) for the local calendar date (y,m,d) at tz offset.
  // h0 = -0.833 deg (refraction + semidiameter). Returns nulls in polar cases.
  function sunriseSunset(y, m, d, tzHours, latDeg, lonEastDeg) {
    var jd0 = julianDay(y, m, d, 0) - tzHours / 24.0; // local midnight in UT
    var g = function (t) { return sunAltitude(t, latDeg, lonEastDeg) + 0.8333; };
    var rise = null, set = null;
    var step = 1 / 48; // 30 min scan
    var prevT = jd0, prevV = g(jd0);
    for (var t = jd0 + step; t <= jd0 + 1.0 + 1e-9; t += step) {
      var v = g(t);
      if (prevV < 0 && v >= 0 && rise === null) rise = findRoot(g, prevT, t);
      if (prevV >= 0 && v < 0 && set === null) set = findRoot(g, prevT, t);
      prevT = t; prevV = v;
    }
    return { rise: rise, set: set };
  }

  // ---------------------------------- panchanga event times (root-finding)
  // Spec (S8): "Event timing is root-finding, not interpolation."
  function moonSunElongUt(jdUt) {
    var tt = jdTTfromUT(jdUt);
    return wrap360(moonTropical(tt).lon - sunTropical(tt).lon);
  }
  function moonSidUt(jdUt) {
    var tt = jdTTfromUT(jdUt);
    return toSidereal(moonTropical(tt).lon, tt);
  }
  function moonSunSumSidUt(jdUt) {
    var tt = jdTTfromUT(jdUt);
    return wrap360(toSidereal(moonTropical(tt).lon, tt) + toSidereal(sunTropical(tt).lon, tt));
  }

  // First upward crossing of target (deg) by increasing angle fnUt, after jdStart.
  function findCrossing(fnUt, targetDeg, jdStart, maxDays) {
    var g = function (t) { return wrap180(fnUt(t) - targetDeg); };
    var step = 0.1, prev = jdStart, pv = g(prev);
    for (var t = jdStart + step; t <= jdStart + maxDays + 1e-9; t += step) {
      var v = g(t);
      if (pv < 0 && v >= 0 && (v - pv) < 180) return findRoot(g, prev, t);
      prev = t; pv = v;
    }
    return null;
  }

  // ------------------------------------ dignity & strength (spec S11 set)
  var EXALT_SIGN = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
  var OWN_SIGNS = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
  // Deep debilitation points (sidereal deg); exaltation = +180
  var DEBIL_POINT = { Sun: 190, Moon: 213, Mars: 118, Mercury: 345, Jupiter: 275, Venus: 177, Saturn: 20 };

  function dignityOf(name, rashi) {
    if (EXALT_SIGN[name] === undefined) return null;
    if (rashi === EXALT_SIGN[name]) return "Exalted";
    if (rashi === (EXALT_SIGN[name] + 6) % 12) return "Debilitated";
    if (OWN_SIGNS[name].indexOf(rashi) >= 0) return "Own sign";
    return null;
  }

  // Uccha bala: tent map |wrap180(lam - lam_deb)|/3 virupas, 60 at exaltation.
  function ucchaBala(name, lamSid) {
    if (DEBIL_POINT[name] === undefined) return null;
    return Math.abs(wrap180(lamSid - DEBIL_POINT[name])) / 3.0;
  }

  // Cheshta bala: speed functional normalized against mean motion,
  // retrograde => maximal (spec S11). Tara grahas only.
  var MEAN_MOTION = { Mars: 0.5240, Mercury: 0.9856, Jupiter: 0.0831, Venus: 0.9856, Saturn: 0.0334 };
  function cheshtaBala(name, speedDegDay) {
    var vm = MEAN_MOTION[name];
    if (vm === undefined) return null;
    var cb = 30.0 * (vm - speedDegDay) / vm;
    return Math.max(0, Math.min(60, cb));
  }

  // Graha drishti (sputa drishti): piecewise-linear virupa strength of the
  // aspect cast by `name` on a point `sep` degrees ahead (zodiacal order).
  function drishti(name, sep) {
    sep = wrap360(sep);
    var v;
    if (sep < 30) v = 0;
    else if (sep < 60) v = (sep - 30) / 2;
    else if (sep < 90) v = 15 + (sep - 60);
    else if (sep < 120) v = 45 - (sep - 90) / 2;
    else if (sep < 150) v = 30 - (sep - 120);
    else if (sep < 180) v = (sep - 150) * 2;
    else if (sep < 300) v = (300 - sep) / 2;
    else v = 0;
    // special full aspects: Mars 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th
    if (name === "Mars" && ((sep >= 90 && sep < 120) || (sep >= 210 && sep < 240))) v = 60;
    if (name === "Jupiter" && ((sep >= 120 && sep < 150) || (sep >= 240 && sep < 270))) v = 60;
    if (name === "Saturn" && ((sep >= 60 && sep < 90) || (sep >= 270 && sep < 300))) v = 60;
    return v;
  }

  // ------------------------------------------ ashtakavarga (BPHS tables)
  // ASHTAKAVARGA[graha][ref] = benefic house positions counted from ref.
  // Row totals: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52,
  // Saturn 39; grand total 337 (classical invariant).
  var ASHTAKAVARGA = {
    Sun:     { Sun: [1,2,4,7,8,9,10,11], Moon: [3,6,10,11], Mars: [1,2,4,7,8,9,10,11], Mercury: [3,5,6,9,10,11,12], Jupiter: [5,6,9,11], Venus: [6,7,12], Saturn: [1,2,4,7,8,9,10,11], Lagna: [3,4,6,10,11,12] },
    Moon:    { Sun: [3,6,7,8,10,11], Moon: [1,3,6,7,10,11], Mars: [2,3,5,6,9,10,11], Mercury: [1,3,4,5,7,8,10,11], Jupiter: [1,4,7,8,10,11,12], Venus: [3,4,5,7,9,10,11], Saturn: [3,5,6,11], Lagna: [3,6,10,11] },
    Mars:    { Sun: [3,5,6,10,11], Moon: [3,6,11], Mars: [1,2,4,7,8,10,11], Mercury: [3,5,6,11], Jupiter: [6,10,11,12], Venus: [6,8,11,12], Saturn: [1,4,7,8,9,10,11], Lagna: [1,3,6,10,11] },
    Mercury: { Sun: [5,6,9,11,12], Moon: [2,4,6,8,10,11], Mars: [1,2,4,7,8,9,10,11], Mercury: [1,3,5,6,9,10,11,12], Jupiter: [6,8,11,12], Venus: [1,2,3,4,5,8,9,11], Saturn: [1,2,4,7,8,9,10,11], Lagna: [1,2,4,6,8,10,11] },
    Jupiter: { Sun: [1,2,3,4,7,8,9,10,11], Moon: [2,5,7,9,11], Mars: [1,2,4,7,8,10,11], Mercury: [1,2,4,5,6,9,10,11], Jupiter: [1,2,3,4,7,8,10,11], Venus: [2,5,6,9,10,11], Saturn: [3,5,6,12], Lagna: [1,2,4,5,6,7,9,10,11] },
    Venus:   { Sun: [8,11,12], Moon: [1,2,3,4,5,8,9,11,12], Mars: [3,5,6,9,11,12], Mercury: [3,5,6,9,11], Jupiter: [5,8,9,10,11], Venus: [1,2,3,4,5,8,9,10,11], Saturn: [3,4,5,8,9,10,11], Lagna: [1,2,3,4,5,8,9,11] },
    Saturn:  { Sun: [1,2,4,7,8,10,11], Moon: [3,6,11], Mars: [3,5,6,10,11,12], Mercury: [6,8,9,10,11,12], Jupiter: [5,6,11,12], Venus: [6,11,12], Saturn: [3,5,6,11], Lagna: [1,3,4,6,10,11] }
  };

  // refSigns: { Sun: rashi, ..., Saturn: rashi, Lagna: rashi } (0-11).
  // Returns { bav: {graha: int[12]}, sav: int[12] }.
  function ashtakavarga(refSigns) {
    var grahas = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
    var refs = grahas.concat(["Lagna"]);
    var bav = {}, sav = [0,0,0,0,0,0,0,0,0,0,0,0];
    for (var g = 0; g < grahas.length; g++) {
      var row = [0,0,0,0,0,0,0,0,0,0,0,0];
      for (var r = 0; r < refs.length; r++) {
        var places = ASHTAKAVARGA[grahas[g]][refs[r]];
        var from = refSigns[refs[r]];
        for (var p = 0; p < places.length; p++) {
          row[(from + places[p] - 1) % 12] += 1;
        }
      }
      bav[grahas[g]] = row;
      for (var s = 0; s < 12; s++) sav[s] += row[s];
    }
    return { bav: bav, sav: sav };
  }

  // --------------------------------------------- Vimshottari dasha operator
  var LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
  var DYEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]; // sum = 120

  function vimshottariMahadashas(moonSid, birthJdUt) {
    var nk = nakshatraOf(moonSid);
    var li = nk.n % 9;
    var start = birthJdUt - nk.frac * DYEARS[li] * YEAR_DAYS; // notional MD start
    var out = [];
    for (var k = 0; k < 9; k++) {
      var i = (li + k) % 9;
      var end = start + DYEARS[i] * YEAR_DAYS;
      out.push({ lord: LORDS[i], lordIdx: i, start: start, end: end });
      start = end;
    }
    return { mds: out, balanceYears: (1 - nk.frac) * DYEARS[li], firstLordIdx: li };
  }

  // Self-similar subdivision: sub-periods of a period owned by lordIdx.
  function subPeriods(lordIdx, startJd, durDays) {
    var out = [], t = startJd;
    for (var k = 0; k < 9; k++) {
      var j = (lordIdx + k) % 9;
      var dur = durDays * DYEARS[j] / 120.0;
      out.push({ lord: LORDS[j], lordIdx: j, start: t, end: t + dur });
      t += dur;
    }
    return out;
  }

  // Operative MD/AD/PD chain at time jd.
  function currentDashaChain(mds, jd) {
    for (var i = 0; i < mds.length; i++) {
      var md = mds[i];
      if (md.start <= jd && jd < md.end) {
        var ads = subPeriods(md.lordIdx, md.start, md.end - md.start);
        for (var j = 0; j < ads.length; j++) {
          var ad = ads[j];
          if (ad.start <= jd && jd < ad.end) {
            var pds = subPeriods(ad.lordIdx, ad.start, ad.end - ad.start);
            for (var k = 0; k < pds.length; k++) {
              var pd = pds[k];
              if (pd.start <= jd && jd < pd.end) return { md: md, ad: ad, pd: pd };
            }
            return { md: md, ad: ad, pd: null };
          }
        }
        return { md: md, ad: null, pd: null };
      }
    }
    return null;
  }

  // --------------------------------------- motion calculus & combustion
  function tropicalLonOf(name, jdTt) {
    if (name === "Sun") return sunTropical(jdTt).lon;
    if (name === "Moon") return moonTropical(jdTt).lon;
    if (name === "Rahu") return meanNode(jdTt);
    if (name === "Ketu") return wrap360(meanNode(jdTt) + 180);
    return planetTropical(name, jdTt);
  }

  function speedOf(name, jdTt) { // deg/day, central difference h=0.05 d
    var h = 0.05;
    return wrap180(tropicalLonOf(name, jdTt + h) - tropicalLonOf(name, jdTt - h)) / (2 * h);
  }

  // Classical combustion thresholds (deg from Sun); retro Mercury/Venus tighter.
  var COMBUST = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
  var COMBUST_RETRO = { Mercury: 12, Venus: 8 };

  // ----------------------------------------------------- name syllables
  function buildSyllableIndex() {
    var map = [];
    for (var n = 0; n < 27; n++) {
      for (var p = 0; p < 4; p++) {
        map.push({ syl: NAK_SYLLABLES[n][p].toLowerCase(), n: n, pada: p + 1 });
      }
    }
    map.sort(function (a, b) { return b.syl.length - a.syl.length; }); // longest first
    return map;
  }
  var SYL_INDEX = buildSyllableIndex();

  function nameToNakshatra(name) {
    if (!name) return null;
    var s = name.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!s) return null;
    for (var i = 0; i < SYL_INDEX.length; i++) {
      if (s.indexOf(SYL_INDEX[i].syl) === 0) return SYL_INDEX[i];
    }
    return null;
  }

  // ------------------------------------------------------ chart assembly
  var BODY_ABBR = { Sun:"Su", Moon:"Mo", Mars:"Ma", Mercury:"Me", Jupiter:"Ju",
    Venus:"Ve", Saturn:"Sa", Rahu:"Ra", Ketu:"Ke", Lagna:"La" };

  /**
   * computeChart(input)
   * input: { year, month, day, hour, minute, second, tzHours, lat, lon,
   *          timeUnknown (bool), name (string, optional), nowJdUt (optional) }
   * Local civil time + tz offset -> UT. If timeUnknown, uses local sunrise.
   */
  function computeChart(input) {
    var sec = input.second || 0;
    var localHours = input.hour + input.minute / 60.0 + sec / 3600.0;
    var jdUt = julianDay(input.year, input.month, input.day, localHours) - input.tzHours / 24.0;

    var ss = sunriseSunset(input.year, input.month, input.day, input.tzHours, input.lat, input.lon);
    if (input.timeUnknown && ss.rise !== null) jdUt = ss.rise;

    var jdTt = jdTTfromUT(jdUt);
    var ayan = ayanamsaLahiri(jdTt);

    // Bodies: tropical -> sidereal
    var sun = sunTropical(jdTt), moon = moonTropical(jdTt), rahu = meanNode(jdTt);
    var trop = {
      Sun: sun.lon, Moon: moon.lon,
      Mars: planetTropical("Mars", jdTt), Mercury: planetTropical("Mercury", jdTt),
      Jupiter: planetTropical("Jupiter", jdTt), Venus: planetTropical("Venus", jdTt),
      Saturn: planetTropical("Saturn", jdTt), Rahu: rahu, Ketu: wrap360(rahu + 180)
    };

    var am = ascMc(jdUt, input.lat, input.lon);
    var ascSid = toSidereal(am.asc, jdTt);
    var mcSid = toSidereal(am.mc, jdTt);
    var lagnaRashi = Math.floor(ascSid / 30);

    var order = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
    var bodies = [];
    for (var i = 0; i < order.length; i++) {
      var nm = order[i];
      var sid = toSidereal(trop[nm], jdTt);
      var rashi = Math.floor(sid / 30);
      var nk = nakshatraOf(sid);
      var spd = speedOf(nm, jdTt);
      var retro = (nm === "Rahu" || nm === "Ketu") ? true : spd < 0;
      var combust = false;
      if (nm !== "Sun" && nm !== "Rahu" && nm !== "Ketu") {
        var sep = Math.abs(wrap180(trop[nm] - trop.Sun));
        var thr = (retro && COMBUST_RETRO[nm] !== undefined) ? COMBUST_RETRO[nm] : COMBUST[nm];
        combust = sep < thr;
      }
      bodies.push({
        name: nm, abbr: BODY_ABBR[nm], tropLon: trop[nm], sidLon: sid,
        rashi: rashi, degInSign: sid - rashi * 30,
        nakshatra: nk.n, pada: nk.pada, nakFrac: nk.frac,
        house: ((rashi - lagnaRashi) + 12) % 12 + 1,
        speed: spd, retro: retro, combust: combust,
        d9rashi: Math.floor(wrap360(sid * 9) / 30),
        dignity: dignityOf(nm, rashi),
        ucchaBala: ucchaBala(nm, sid),
        cheshtaBala: cheshtaBala(nm, spd)
      });
    }

    var lagnaNk = nakshatraOf(ascSid);
    var lagna = {
      name: "Lagna", abbr: "La", sidLon: ascSid, rashi: lagnaRashi,
      degInSign: ascSid - lagnaRashi * 30, nakshatra: lagnaNk.n, pada: lagnaNk.pada,
      house: 1, d9rashi: Math.floor(wrap360(ascSid * 9) / 30)
    };

    // Panchanga
    var moonSid = toSidereal(trop.Moon, jdTt), sunSid = toSidereal(trop.Sun, jdTt);
    var tithi = tithiOf(moonSid, sunSid);
    var karana = karanaOf(tithi.elong);
    var yoga = yogaOf(moonSid, sunSid);

    var localJd = jdUt + input.tzHours / 24.0;
    var dayNum = Math.floor(localJd + 0.5);
    var dow = ((dayNum + 1) % 7 + 7) % 7; // 0 = Sunday
    if (ss.rise !== null && jdUt < ss.rise) dow = (dow + 6) % 7; // before sunrise: previous vara

    // Panchanga element end times (UT JDs), by root-finding (spec S8)
    var tithiEnd = findCrossing(moonSunElongUt, tithi.num * 12, jdUt, 1.4);
    var karanaEnd = findCrossing(moonSunElongUt, karana.num * 6, jdUt, 0.8);
    var nakEnd = findCrossing(moonSidUt, (Math.floor(moonSid / (360 / 27)) + 1) * (360 / 27), jdUt, 1.4);
    var yogaEnd = findCrossing(moonSunSumSidUt, yoga.num * (360 / 27), jdUt, 1.2);

    // Strength functionals (spec S11)
    var refSigns = { Lagna: lagnaRashi };
    for (i = 0; i < bodies.length; i++) refSigns[bodies[i].name] = bodies[i].rashi;
    var av = ashtakavarga(refSigns);
    var aspectors = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
    var targets = bodies.map(function (b) { return b.name; }).concat(["Lagna"]);
    var drishtiMatrix = {};
    for (i = 0; i < aspectors.length; i++) {
      var arow = {};
      var fromLon = trop[aspectors[i]];
      for (var j2 = 0; j2 < targets.length; j2++) {
        if (targets[j2] === aspectors[i]) continue;
        var toLon = targets[j2] === "Lagna" ? am.asc : trop[targets[j2]];
        arow[targets[j2]] = drishti(aspectors[i], toLon - fromLon);
      }
      drishtiMatrix[aspectors[i]] = arow;
    }

    // Vimshottari
    var vd = vimshottariMahadashas(moonSid, jdUt);
    var nowJd = input.nowJdUt !== undefined ? input.nowJdUt
      : 2440587.5 + Date.now() / 86400000.0; // Unix epoch JD
    var chain = currentDashaChain(vd.mds, nowJd);

    return {
      input: input, jdUt: jdUt, jdTt: jdTt, ayanamsa: ayan,
      deltaT: (jdTt - jdUt) * 86400.0,
      bodies: bodies, lagna: lagna, mcSid: mcSid,
      sunrise: ss.rise, sunset: ss.set,
      panchanga: {
        tithi: tithi, karana: karana, yoga: yoga,
        vara: { idx: dow, name: VARA_NAMES[dow], lord: VARA_LORD[dow] },
        moonNakshatra: nakshatraOf(moonSid),
        ends: { tithi: tithiEnd, karana: karanaEnd, nakshatra: nakEnd, yoga: yogaEnd }
      },
      dasha: { mds: vd.mds, balanceYears: vd.balanceYears, current: chain, nowJd: nowJd },
      strength: { ashtakavarga: av, drishti: drishtiMatrix },
      nameMatch: nameToNakshatra(input.name)
    };
  }

  // ===================================================================
  // Dasha-bhukti life engine (birth -> age 90)
  // Classical Parashari period assessment: every score is computed from
  // stated rules (functional lordship by lagna, dignity, placement,
  // ashtakavarga, MD->AD relations) and every narrative clause is
  // traceable to one of those rules. Tendencies in tradition's language,
  // never certainties.
  // ===================================================================

  // Naisargika maitri (natural friendship): 1 friend, 0 neutral, -1 enemy
  var RELATIONS = {
    Sun:     { Moon: 1, Mars: 1, Jupiter: 1, Mercury: 0, Venus: -1, Saturn: -1, Rahu: -1, Ketu: -1 },
    Moon:    { Sun: 1, Mercury: 1, Mars: 0, Jupiter: 0, Venus: 0, Saturn: 0, Rahu: -1, Ketu: -1 },
    Mars:    { Sun: 1, Moon: 1, Jupiter: 1, Venus: 0, Saturn: 0, Mercury: -1, Rahu: -1, Ketu: 1 },
    Mercury: { Sun: 1, Venus: 1, Mars: 0, Jupiter: 0, Saturn: 0, Moon: -1, Rahu: 1, Ketu: 0 },
    Jupiter: { Sun: 1, Moon: 1, Mars: 1, Saturn: 0, Mercury: -1, Venus: -1, Rahu: 0, Ketu: 0 },
    Venus:   { Mercury: 1, Saturn: 1, Mars: 0, Jupiter: 0, Sun: -1, Moon: -1, Rahu: 1, Ketu: 1 },
    Saturn:  { Mercury: 1, Venus: 1, Jupiter: 0, Sun: -1, Moon: -1, Mars: -1, Rahu: 1, Ketu: 0 },
    Rahu:    { Venus: 1, Saturn: 1, Mercury: 1, Jupiter: 0, Sun: -1, Moon: -1, Mars: -1, Ketu: -1 },
    Ketu:    { Mars: 1, Venus: 1, Saturn: 1, Jupiter: 0, Mercury: 0, Sun: -1, Moon: -1, Rahu: -1 }
  };
  var NATURAL_TONE = { Jupiter: 1, Venus: 1, Mercury: 0.5, Sun: -0.5, Mars: -1, Saturn: -1, Rahu: -1, Ketu: -1 };
  var NATURAL_BENEFIC = { Jupiter: true, Venus: true, Mercury: true, Moon: true };

  var HOUSE_THEMES = [null,
    "self, health and new identity", "wealth, family and speech",
    "courage, siblings and skills", "home, mother, property and inner peace",
    "children, education, creativity and romance", "health discipline, service and rivals",
    "marriage, partnership and public dealings", "transformation, research, inheritance and shared assets",
    "fortune, dharma, father and long journeys", "career, status and public karma",
    "gains, income and friendships", "expenses, foreign lands, retreat and letting go"];

  function ordinal(n) {
    return n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th");
  }

  // Houses (1-12) ruled by graha from the given lagna; nodes rule none.
  function housesRuledBy(name, lagnaRashi) {
    var out = [];
    for (var r = 0; r < 12; r++) {
      if (RASHI_LORD[r] === name) out.push(((r - lagnaRashi) + 12) % 12 + 1);
    }
    return out.sort(function (a, b) { return a - b; });
  }

  function isYogakaraka(name, lagnaRashi) {
    var ruled = housesRuledBy(name, lagnaRashi);
    var kendra = false, trikona = false;
    for (var i = 0; i < ruled.length; i++) {
      if (ruled[i] === 4 || ruled[i] === 7 || ruled[i] === 10) kendra = true;
      if (ruled[i] === 5 || ruled[i] === 9) trikona = true;
    }
    return kendra && trikona;
  }

  // Functional score of a (non-node) graha from its lordships (BPHS logic).
  function functionalScore(name, lagnaRashi, moonWaxing) {
    var ruled = housesRuledBy(name, lagnaRashi);
    var rulesLagna = ruled.indexOf(1) >= 0;
    var benefic = NATURAL_BENEFIC[name] === true && !(name === "Moon" && !moonWaxing);
    var s = 0;
    for (var i = 0; i < ruled.length; i++) {
      var h = ruled[i];
      if (h === 1) s += 2;
      else if (h === 5 || h === 9) s += 2;
      else if (h === 4 || h === 7 || h === 10) s += benefic ? -1 : 1; // kendradhipati
      else if (h === 3 || h === 6 || h === 11) s -= 2;
      else if (h === 8) s += rulesLagna ? 0 : -2;
      // 2 and 12: neutral, take color from the other lordship
    }
    if (isYogakaraka(name, lagnaRashi)) s += 1.5;
    return s;
  }

  function bodyOf(chart, name) {
    for (var i = 0; i < chart.bodies.length; i++) {
      if (chart.bodies[i].name === name) return chart.bodies[i];
    }
    return null;
  }

  // Placement quality of a graha in this chart (dignity, bhava, AV, states).
  function placementScore(chart, name) {
    var b = bodyOf(chart, name);
    var s = 0;
    if (b.dignity === "Exalted") s += 3;
    else if (b.dignity === "Own sign") s += 2;
    else if (b.dignity === "Debilitated") s -= 3;
    var h = b.house;
    var dusthana = (h === 6 || h === 8 || h === 12);
    var ruled = housesRuledBy(name, chart.lagna.rashi);
    var rulesDusthana = ruled.some(function (x) { return x === 6 || x === 8 || x === 12; });
    if (dusthana) s += (rulesDusthana ? 1.5 : -2); // vipareeta flip
    else if (h === 5 || h === 9) s += 2;
    else if (h === 1 || h === 4 || h === 7 || h === 10) s += 1.5;
    else if (h === 2 || h === 11) s += 1;
    if (b.combust) s -= 1.5;
    if (b.retro && name !== "Rahu" && name !== "Ketu") s += 0.5; // cheshta
    var bav = chart.strength.ashtakavarga.bav[name];
    if (bav) s += (bav[b.rashi] - 4) * 0.5;
    if (b.ucchaBala !== null && b.ucchaBala !== undefined) s += (b.ucchaBala - 30) / 30;
    return s;
  }

  // Overall period-lord quality Q in about [-10, +10].
  function grahaQuality(chart, name) {
    var moonWaxing = chart.panchanga.tithi.elong < 180;
    var q;
    if (name === "Rahu" || name === "Ketu") {
      var disp = RASHI_LORD[bodyOf(chart, name).rashi];
      var dispB = bodyOf(chart, disp);
      q = 0.75 * functionalScore(disp, chart.lagna.rashi, moonWaxing)
        + (NATURAL_TONE[name] || 0)
        + placementScore(chart, name) * 0.6
        + (dispB.dignity === "Exalted" ? 1 : dispB.dignity === "Debilitated" ? -1 : 0);
    } else {
      q = functionalScore(name, chart.lagna.rashi, moonWaxing)
        + (name === "Moon" ? (moonWaxing ? 0.5 : -0.5) : (NATURAL_TONE[name] || 0))
        + placementScore(chart, name);
    }
    return Math.max(-10, Math.min(10, q));
  }

  var GRADES = [
    { min: 72, key: "uttama", label: "Uttama", en: "excellent", tone: "a flourishing stretch" },
    { min: 58, key: "shubha", label: "Shubha", en: "favorable", tone: "a supportive stretch" },
    { min: 42, key: "mishra", label: "Mishra", en: "mixed", tone: "a mixed stretch" },
    { min: 28, key: "kashta", label: "Kashta", en: "demanding", tone: "a demanding stretch" },
    { min: -1, key: "atikashta", label: "Atikashta", en: "testing", tone: "a testing stretch" }
  ];
  function gradeOf(score) {
    for (var i = 0; i < GRADES.length; i++) if (score >= GRADES[i].min) return GRADES[i];
    return GRADES[GRADES.length - 1];
  }

  // Rashi-wise count from MD lord's sign to AD lord's sign (1..12).
  function signCountBetween(chart, fromName, toName) {
    var a = bodyOf(chart, fromName).rashi, b = bodyOf(chart, toName).rashi;
    return ((b - a) + 12) % 12 + 1;
  }

  function mutualRelation(a, b) { // averaged natural friendship, -1..1
    return ((RELATIONS[a][b] || 0) + (RELATIONS[b][a] || 0)) / 2;
  }

  // Score one bhukti; returns { score 0-100, grade, factors: {...} }
  function bhuktiScore(chart, mdLord, adLord, isChidra) {
    var qM = grahaQuality(chart, mdLord), qA = grahaQuality(chart, adLord);
    var s, factors = { qMd: qM, qAd: qA, own: mdLord === adLord, chidra: !!isChidra };
    if (mdLord === adLord) {
      s = qM - 0.5;
      factors.relation = 0; factors.position = 1;
    } else {
      s = 0.6 * qM + 0.4 * qA;
      var pos = signCountBetween(chart, mdLord, adLord);
      factors.position = pos;
      if (pos === 6 || pos === 8 || pos === 12) s -= 2;
      else if (pos === 5 || pos === 9) s += 1.5;
      else if (pos === 1 || pos === 4 || pos === 7 || pos === 10) s += 1;
      else if (pos === 2 || pos === 11) s += 0.5;
      var rel = mutualRelation(mdLord, adLord);
      factors.relation = rel;
      s += rel > 0 ? 1 : rel < -0.4 ? -1.5 : 0;
    }
    if (isChidra) s -= 1;
    s = Math.max(-10, Math.min(10, s));
    var score = Math.round((s + 10) * 5);
    return { score: score, grade: gradeOf(score), factors: factors };
  }

  // ------------------------------------------------- narrative composer
  function listHouses(hs) {
    var parts = hs.map(function (h) { return ordinal(h); });
    if (parts.length <= 1) return parts.join("");
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }

  function themesFor(chart, adLord, mdLord) {
    var seen = {}, out = [];
    function push(h) { if (!seen[h] && out.length < 3) { seen[h] = 1; out.push(HOUSE_THEMES[h]); } }
    housesRuledBy(adLord, chart.lagna.rashi).forEach(push);
    push(bodyOf(chart, adLord).house);
    housesRuledBy(mdLord, chart.lagna.rashi).forEach(push);
    push(bodyOf(chart, mdLord).house);
    return out;
  }

  function roleSentence(chart, name) {
    var b = bodyOf(chart, name);
    var bits = [];
    if (name === "Rahu" || name === "Ketu") {
      var disp = RASHI_LORD[b.rashi];
      bits.push(name + " occupies " + RASHI[b.rashi] + " in your " + ordinal(b.house) +
        " house, delivering results through " + disp + ", its dispositor");
    } else {
      var ruled = housesRuledBy(name, chart.lagna.rashi);
      var place = b.dignity === "Exalted" ? "exalted " : b.dignity === "Own sign" ? "in its own sign " :
        b.dignity === "Debilitated" ? "debilitated " : "";
      bits.push(name + " rules your " + listHouses(ruled) + (ruled.length > 1 ? " houses" : " house") +
        " and sits " + place + "in " + RASHI[b.rashi] + " in the " + ordinal(b.house) + " house");
      if (isYogakaraka(name, chart.lagna.rashi)) bits.push("as yogakaraka for your lagna");
    }
    var states = [];
    if (b.combust) states.push("combust");
    if (b.retro && name !== "Rahu" && name !== "Ketu") states.push("retrograde");
    return bits.join(", ") + (states.length ? " (" + states.join(", ") + ")" : "") + ".";
  }

  function relationClause(chart, mdLord, adLord, factors) {
    if (factors.own) {
      return "The lord runs its own bhukti, so its significations concentrate and intensify.";
    }
    var pos = factors.position;
    if (pos === 6 || pos === 8 || pos === 12) {
      return "Classically, " + adLord + " stands " + ordinal(pos) + " from " + mdLord +
        ", so the two agendas rub against each other — patience over force.";
    }
    if (pos === 5 || pos === 9) {
      return adLord + " stands " + ordinal(pos) + " from " + mdLord +
        ", a trine — the sub-period flows with the mahadasha rather than against it.";
    }
    if (factors.relation < -0.4) {
      return mdLord + " and " + adLord + " are natural adversaries, adding friction to the period.";
    }
    if (factors.relation > 0.4) {
      return mdLord + " and " + adLord + " are natural allies, easing the period's work.";
    }
    return null;
  }

  function bhuktiText(chart, mdLord, adLord, scored, isChidra) {
    var s = [];
    s.push(roleSentence(chart, adLord));
    s.push("Focus falls on " + themesFor(chart, adLord, mdLord).join("; ") + ".");
    var rel = relationClause(chart, mdLord, adLord, scored.factors);
    if (rel) s.push(rel);
    var adRules = housesRuledBy(adLord, chart.lagna.rashi);
    if (adRules.indexOf(6) >= 0 || bodyOf(chart, adLord).house === 6) {
      s.push("With the 6th activated, guard routines around health and avoid needless disputes.");
    }
    if (isChidra) {
      s.push("This bhukti closes the mahadasha (dasha-chidra) — a hand-over phase; keep major commitments light near the transition.");
    }
    var b = bodyOf(chart, adLord);
    if ((b.house === 6 || b.house === 8 || b.house === 12) &&
        adRules.some(function (x) { return x === 6 || x === 8 || x === 12; })) {
      s.push("Its dusthana-lord-in-dusthana placement is vipareeta — obstacles in this window can invert into unexpected gains.");
    }
    return s.join(" ");
  }

  /**
   * lifeTimeline(chart, maxAgeYears=90)
   * Returns { mahadashas: [{lord, startJd, endJd, ageStart, ageEnd, quality,
   *   grade, summary, bhuktis: [{mdLord, adLord, startJd, endJd, ageStart,
   *   ageEnd, score, grade, themes, text, chidra, own}] }], overview }
   */
  function lifeTimeline(chart, maxAgeYears) {
    maxAgeYears = maxAgeYears || 90;
    var birth = chart.jdUt, horizon = birth + maxAgeYears * YEAR_DAYS;
    var mds = chart.dasha.mds, out = [], allBh = [];
    for (var i = 0; i < mds.length; i++) {
      var md = mds[i];
      if (md.end <= birth || md.start >= horizon) continue;
      var qM = grahaQuality(chart, md.lord);
      var mdScore = Math.round((qM + 10) * 5);
      var entry = {
        lord: md.lord, startJd: Math.max(md.start, birth), endJd: Math.min(md.end, horizon),
        ageStart: Math.max(0, (md.start - birth) / YEAR_DAYS),
        ageEnd: Math.min(maxAgeYears, (md.end - birth) / YEAR_DAYS),
        quality: qM, score: mdScore, grade: gradeOf(mdScore), bhuktis: []
      };
      var ads = subPeriods(md.lordIdx, md.start, md.end - md.start);
      for (var j = 0; j < ads.length; j++) {
        var ad = ads[j];
        if (ad.end <= birth || ad.start >= horizon) continue;
        var chidra = j === 8;
        var scored = bhuktiScore(chart, md.lord, ad.lord, chidra);
        var bh = {
          mdLord: md.lord, adLord: ad.lord,
          startJd: Math.max(ad.start, birth), endJd: Math.min(ad.end, horizon),
          ageStart: Math.max(0, (ad.start - birth) / YEAR_DAYS),
          ageEnd: Math.min(maxAgeYears, (ad.end - birth) / YEAR_DAYS),
          score: scored.score, grade: scored.grade,
          themes: themesFor(chart, ad.lord, md.lord),
          text: bhuktiText(chart, md.lord, ad.lord, scored, chidra),
          chidra: chidra, own: md.lord === ad.lord
        };
        entry.bhuktis.push(bh);
        allBh.push(bh);
      }
      // summary: tone + role + best/worst bhukti inside
      var best = null, worst = null;
      entry.bhuktis.forEach(function (b) {
        if (!best || b.score > best.score) best = b;
        if (!worst || b.score < worst.score) worst = b;
      });
      var sum = entry.grade.tone.charAt(0).toUpperCase() + entry.grade.tone.slice(1) +
        " of " + Math.round((entry.endJd - entry.startJd) / YEAR_DAYS * 10) / 10 + " years. " +
        roleSentence(chart, md.lord);
      if (best && worst && best !== worst) {
        sum += " Within it, the " + best.adLord + " bhukti (age " + best.ageStart.toFixed(1) +
          "–" + best.ageEnd.toFixed(1) + ") shines brightest, while the " + worst.adLord +
          " bhukti (age " + worst.ageStart.toFixed(1) + "–" + worst.ageEnd.toFixed(1) + ") asks the most of you.";
      }
      entry.summary = sum;
      out.push(entry);
    }
    // overview
    var sorted = allBh.slice().sort(function (a, b) { return b.score - a.score; });
    var nowJd = chart.dasha.nowJd;
    var current = null;
    for (var k = 0; k < allBh.length; k++) {
      if (allBh[k].startJd <= nowJd && nowJd < allBh[k].endJd) { current = allBh[k]; break; }
    }
    return {
      mahadashas: out,
      overview: {
        best: sorted.slice(0, 3), toughest: sorted.slice(-3).reverse(),
        current: current, ageNow: (nowJd - birth) / YEAR_DAYS, maxAge: maxAgeYears
      }
    };
  }

  // ------------------------------------------------ family confluence
  // members: [{ name, bhuktis: [{startJd, endJd, score, mdLord, adLord}] }]
  // Finds calendar windows where >=2 members simultaneously run supportive
  // (score >= 58) or testing (score < 42) bhuktis. Windows merge over
  // identical member-sets and are filtered to >= minDays. Scores stay
  // self-relative per chart; only TIMING is compared across members.
  function familyConfluence(members, opts) {
    var GOOD = 58, TOUGH = 42;
    var minDays = (opts && opts.minDays) || 60;
    if (!members || members.length < 2) return [];
    var lo = -Infinity, hi = Infinity, i, j;
    for (i = 0; i < members.length; i++) {
      var bh = members[i].bhuktis;
      if (!bh || !bh.length) return [];
      lo = Math.max(lo, bh[0].startJd);
      hi = Math.min(hi, bh[bh.length - 1].endJd);
    }
    if (lo >= hi) return [];
    var cuts = {}; cuts[lo] = 1; cuts[hi] = 1;
    members.forEach(function (m) {
      m.bhuktis.forEach(function (b) {
        if (b.startJd > lo && b.startJd < hi) cuts[b.startJd] = 1;
        if (b.endJd > lo && b.endJd < hi) cuts[b.endJd] = 1;
      });
    });
    var ts = Object.keys(cuts).map(Number).sort(function (a, b) { return a - b; });
    function activeAt(m, t) {
      for (var k = 0; k < m.bhuktis.length; k++) {
        if (m.bhuktis[k].startJd <= t && t < m.bhuktis[k].endJd) return m.bhuktis[k];
      }
      return null;
    }
    var raw = [];
    for (i = 0; i < ts.length - 1; i++) {
      var t0 = ts[i], t1 = ts[i + 1], mid = (t0 + t1) / 2;
      var good = [], tough = [];
      for (j = 0; j < members.length; j++) {
        var b = activeAt(members[j], mid);
        if (!b) continue;
        if (b.score >= GOOD) good.push(members[j].name);
        else if (b.score < TOUGH) tough.push(members[j].name);
      }
      if (good.length >= 2) raw.push({ startJd: t0, endJd: t1, kind: "good", names: good });
      if (tough.length >= 2) raw.push({ startJd: t0, endJd: t1, kind: "tough", names: tough });
    }
    // merge adjacent windows of same kind + same member set
    var merged = [];
    raw.sort(function (a, b) { return a.startJd - b.startJd || (a.kind < b.kind ? -1 : 1); });
    raw.forEach(function (w) {
      var last = null;
      for (var k = merged.length - 1; k >= 0; k--) {
        if (merged[k].kind === w.kind) { last = merged[k]; break; }
      }
      if (last && Math.abs(last.endJd - w.startJd) < 1e-6 &&
          last.names.join("|") === w.names.join("|")) {
        last.endJd = w.endJd;
      } else {
        merged.push({ startJd: w.startJd, endJd: w.endJd, kind: w.kind, names: w.names.slice() });
      }
    });
    return merged.filter(function (w) { return w.endJd - w.startJd >= minDays; })
      .sort(function (a, b) { return a.startJd - b.startJd; });
  }

  // ------------------------------------------------------------ exports
  var Jyotish = {
    familyConfluence: familyConfluence,
    wrap360: wrap360, wrap180: wrap180,
    julianDay: julianDay, jdToDate: jdToDate,
    deltaTSeconds: deltaTSeconds, jdTTfromUT: jdTTfromUT, centuries: centuries,
    sunTropical: sunTropical, sunTropicalMeeus: sunTropicalMeeus,
    moonTropical: moonTropical, planetTropicalKepler: planetTropicalKepler,
    vsopHelio: vsopHelio, hasVSOP: function () { return !!getVSOP(); },
    nutationDpsi: nutationDpsi, obliquity: obliquity, meanNode: meanNode,
    ayanamsaLahiri: ayanamsaLahiri, toSidereal: toSidereal, precessionPA: precessionPA,
    solveKepler: solveKepler, planetTropical: planetTropical, tropicalLonOf: tropicalLonOf,
    gmstDeg: gmstDeg, ascMc: ascMc,
    nakshatraOf: nakshatraOf, tithiOf: tithiOf, karanaOf: karanaOf, yogaOf: yogaOf,
    sunAltitude: sunAltitude, sunriseSunset: sunriseSunset, findRoot: findRoot,
    vimshottariMahadashas: vimshottariMahadashas, subPeriods: subPeriods,
    currentDashaChain: currentDashaChain, speedOf: speedOf,
    nameToNakshatra: nameToNakshatra, computeChart: computeChart,
    dignityOf: dignityOf, ucchaBala: ucchaBala, cheshtaBala: cheshtaBala,
    housesRuledBy: housesRuledBy, isYogakaraka: isYogakaraka,
    functionalScore: functionalScore, grahaQuality: grahaQuality,
    bhuktiScore: bhuktiScore, lifeTimeline: lifeTimeline, gradeOf: gradeOf,
    drishti: drishti, ashtakavarga: ashtakavarga, findCrossing: findCrossing,
    moonSunElongUt: moonSunElongUt, moonSidUt: moonSidUt, moonSunSumSidUt: moonSunSumSidUt,
    NAK: NAK, RASHI: RASHI, RASHI_EN: RASHI_EN, RASHI_LORD: RASHI_LORD,
    NAK_DEITY: NAK_DEITY, NAK_SYMBOL: NAK_SYMBOL, NAK_SYLLABLES: NAK_SYLLABLES,
    LORDS: LORDS, DYEARS: DYEARS, VARA_NAMES: VARA_NAMES, VARA_LORD: VARA_LORD,
    BODY_ABBR: BODY_ABBR, YEAR_DAYS: YEAR_DAYS
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Jyotish;
  else global.Jyotish = Jyotish;
})(typeof window !== "undefined" ? window : globalThis);
