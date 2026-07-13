/* UI layer: form handling, chart & panel rendering. Engine = global Jyotish. */
(function () {
  "use strict";
  var J = window.Jyotish;
  var $ = function (id) { return document.getElementById(id); };

  var GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var SANSKRIT = { Sun: "Surya", Moon: "Chandra", Mars: "Mangala", Mercury: "Budha",
    Jupiter: "Guru", Venus: "Shukra", Saturn: "Shani", Rahu: "Rahu", Ketu: "Ketu", Lagna: "Lagna" };
  var LORD_ABBR = { Ketu: "Ke", Venus: "Ve", Sun: "Su", Moon: "Mo", Mars: "Ma",
    Rahu: "Ra", Jupiter: "Ju", Saturn: "Sa", Mercury: "Me" };
  var C = { bg: "#10141F", panel: "#171C2B", line: "#2C3450", lineSoft: "#232941",
    ink: "#EAE4D4", ink2: "#9FA3B3", ink3: "#6B7186", gold: "#D9A84E", goldDeep: "#BE8A30", verm: "#E0644C" };

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function dms(x) {
    var d = Math.floor(x), mf = (x - d) * 60, m = Math.floor(mf), s = Math.round((mf - m) * 60);
    if (s === 60) { s = 0; m++; } if (m === 60) { m = 0; d++; }
    return d + "°" + pad2(m) + "′" + pad2(s) + "″";
  }
  function jdLocal(jdUt, tz) { return J.jdToDate(jdUt + tz / 24.0); }
  function fmtTime(jdUt, tz) {
    var p = jdLocal(jdUt, tz);
    var h = Math.floor(p.h), mi = Math.round((p.h - h) * 60);
    if (mi === 60) { mi = 0; h++; }
    return pad2(h) + ":" + pad2(mi);
  }
  function fmtDate(jdUt, tz) {
    var p = jdLocal(jdUt, tz);
    return p.d + " " + MON[p.m - 1] + " " + p.y;
  }
  function fmtDateTime(jdUt, tz) { return fmtDate(jdUt, tz) + ", " + fmtTime(jdUt, tz); }
  function fmtUntil(jdUt, tz, birthJd) {
    if (jdUt === null) return "";
    var t = fmtTime(jdUt, tz);
    var dayDiff = Math.floor(jdUt + tz / 24 + 0.5) - Math.floor(birthJd + tz / 24 + 0.5);
    return "until " + t + (dayDiff > 0 ? " +" + dayDiff + "d" : "");
  }
  function yearsToYMD(y) {
    var Y = Math.floor(y), rem = (y - Y) * 12, M = Math.floor(rem), D = Math.round((rem - M) * 30.44);
    return Y + "y " + M + "m " + D + "d";
  }

  // ------------------------------------------------------ city autocomplete
  var acBox = $("city-ac"), cityIn = $("in-city");
  function citySearch(q) {
    q = q.toLowerCase().trim();
    if (q.length < 2) return [];
    var starts = [], contains = [];
    for (var i = 0; i < CITIES.length; i++) {
      var c = CITIES[i], hay = (c[0] + " " + c[1]).toLowerCase();
      if (hay.indexOf(q) === 0 || c[0].toLowerCase().indexOf(q) === 0) starts.push(c);
      else if (hay.indexOf(q) >= 0) contains.push(c);
      if (starts.length > 9) break;
    }
    return starts.concat(contains).slice(0, 9);
  }
  function pickCity(c) {
    cityIn.value = c[0] + ", " + c[1];
    $("in-lat").value = c[2]; $("in-lon").value = c[3]; $("in-tz").value = c[4];
    $("in-dst").checked = false;
    acBox.style.display = "none";
    if (c[5]) $("form-error").textContent = "";
  }
  cityIn.addEventListener("input", function () {
    var res = citySearch(cityIn.value);
    if (!res.length) { acBox.style.display = "none"; return; }
    acBox.innerHTML = "";
    res.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "<span>" + esc(c[0]) + "</span><span class='cc'>" + esc(c[1]) + " · UTC" +
        (c[4] >= 0 ? "+" : "") + c[4] + (c[5] ? " · DST region" : "") + "</span>";
      b.addEventListener("click", function () { pickCity(c); });
      acBox.appendChild(b);
    });
    acBox.style.display = "block";
  });
  cityIn.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      var first = acBox.querySelector("button");
      if (first && acBox.style.display === "block") first.click();
    }
    if (e.key === "Escape") acBox.style.display = "none";
  });
  document.addEventListener("click", function (e) {
    if (!acBox.contains(e.target) && e.target !== cityIn) acBox.style.display = "none";
  });
  $("in-tu").addEventListener("change", function () { $("in-time").disabled = this.checked; });

  // ---------------------------------------------------------- form handling
  $("birth-form").addEventListener("submit", function (e) {
    e.preventDefault();
    $("example-note").style.display = "none";
    compute(false);
  });

  function compute(isExample) {
    var err = $("form-error"); err.style.display = "none";
    var dateV = $("in-date").value, timeV = $("in-time").value, tu = $("in-tu").checked;
    var lat = parseFloat($("in-lat").value), lon = parseFloat($("in-lon").value), tz = parseFloat($("in-tz").value);
    function fail(msg) { err.textContent = msg; err.style.display = "block"; }
    if (!dateV) return fail("Enter the date of birth.");
    var dp = dateV.split("-").map(Number);
    if (dp[0] < 1800 || dp[0] > 2149) return fail("Dates from 1800 to 2149 are supported (the ephemeris series are truncated for this span).");
    if (!tu && !timeV) return fail("Enter the birth time, or tick “time unknown” to use sunrise.");
    if (isNaN(lat) || isNaN(lon)) return fail("Pick a city from the list, or type latitude and longitude directly.");
    if (isNaN(tz)) return fail("Enter the UTC offset in effect at birth (e.g. 5.5 for IST).");
    if (Math.abs(lat) > 66.5) fail("Note: polar latitudes — sunrise-based items may be approximate."); // non-blocking
    var hp = tu || !timeV ? [6, 0] : timeV.split(":").map(Number);
    var chart = J.computeChart({
      year: dp[0], month: dp[1], day: dp[2], hour: hp[0], minute: hp[1] || 0, second: 0,
      tzHours: tz + ($("in-dst").checked ? 1 : 0),
      lat: lat, lon: lon, timeUnknown: tu, name: $("in-name").value.trim()
    });
    renderAll(chart, isExample);
  }

  // ---------------------------------------------------------------- render
  var chartStyle = "north", lastChart = null;
  $("btn-north").addEventListener("click", function () { setStyle("north"); });
  $("btn-south").addEventListener("click", function () { setStyle("south"); });
  function setStyle(s) {
    chartStyle = s;
    $("btn-north").setAttribute("aria-pressed", s === "north" ? "true" : "false");
    $("btn-south").setAttribute("aria-pressed", s === "south" ? "true" : "false");
    if (lastChart) renderCharts(lastChart);
  }

  function renderAll(chart, isExample) {
    lastChart = chart;
    var r = $("results");
    r.style.display = "block";
    r.classList.remove("reveal"); void r.offsetWidth; r.classList.add("reveal");
    $("example-note").style.display = isExample ? "block" : "none";

    var inp = chart.input, tz = inp.tzHours;
    $("sub-birth").textContent = fmtDateTime(chart.jdUt, tz) + " local · " +
      Math.abs(inp.lat).toFixed(2) + "°" + (inp.lat >= 0 ? "N" : "S") + " " +
      Math.abs(inp.lon).toFixed(2) + "°" + (inp.lon >= 0 ? "E" : "W");
    $("sub-ayan").textContent = "ayanamsa " + dms(chart.ayanamsa) + " · sidereal";

    drawWheel(chart);
    renderFacts(chart);
    renderCharts(chart);
    renderPlanetTable(chart);
    renderPanchanga(chart);
    renderDasha(chart);
    renderLifeMap(chart);
    renderFamily();
    renderStrength(chart);
    renderName(chart);
    renderReading(chart);
    renderAppendix(chart);
    if (!isExample) r.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderFacts(chart) {
    var tz = chart.input.tzHours, p = chart.panchanga;
    var moon = chart.bodies[1], sun = chart.bodies[0];
    var rows = [
      ["Lagna (ascendant)", J.RASHI[chart.lagna.rashi] + " " + dms(chart.lagna.degInSign), true],
      ["Rashi (moon sign)", J.RASHI[moon.rashi] + " · " + J.RASHI_EN[moon.rashi], true],
      ["Janma nakshatra", J.NAK[moon.nakshatra] + " · pada " + moon.pada, true],
      ["Surya (sun sign)", J.RASHI[sun.rashi] + " · " + J.RASHI_EN[sun.rashi], false],
      ["Tithi", p.tithi.paksha + " " + p.tithi.name, false],
      ["Vara", p.vara.name, false],
      ["Sunrise", chart.sunrise !== null ? fmtTime(chart.sunrise, tz) : "—", false],
      ["Sunset", chart.sunset !== null ? fmtTime(chart.sunset, tz) : "—", false]
    ];
    var h = "";
    rows.forEach(function (rw) {
      h += "<div class='fact'><span class='k'>" + rw[0] + "</span><span class='v" + (rw[2] ? " gold" : "") + "'>" + esc(rw[1]) + "</span></div>";
    });
    var cur = chart.dasha.current;
    h += "<div class='chips'>";
    if (cur) {
      h += "<span class='chip gold'>Running: <b>" + cur.md.lord + "</b> mahadasha · <b>" + cur.ad.lord + "</b> antardasha</span>";
    }
    var retro = chart.bodies.filter(function (b) { return b.retro && b.name !== "Rahu" && b.name !== "Ketu"; });
    if (retro.length) h += "<span class='chip'>Retrograde: <b>" + retro.map(function (b) { return b.name; }).join(", ") + "</b></span>";
    if (chart.input.timeUnknown) h += "<span class='chip'>Time unknown — chart cast for sunrise; lagna &amp; houses are indicative only</span>";
    h += "</div>";
    $("facts").innerHTML = h;
  }

  // ------------------------------------------------------------- sky wheel
  function drawWheel(chart) {
    var cv = $("wheel"), ctx = cv.getContext("2d");
    var W = cv.width, cx = W / 2, cy = W / 2;
    ctx.clearRect(0, 0, W, W);
    var R1 = W * 0.475, R2 = W * 0.40, R3 = W * 0.355, Rp = W * 0.30;
    function pt(lon, r) {
      var a = (180 - lon) * Math.PI / 180;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    }
    // starfield (seeded)
    var seed = 42;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var s = 0; s < 110; s++) {
      var rr = Math.sqrt(rnd()) * R3 * 0.92, aa = rnd() * 6.2832;
      ctx.globalAlpha = 0.12 + rnd() * 0.3;
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(cx + rr * Math.cos(aa), cy + rr * Math.sin(aa), rnd() * 1.6 + 0.4, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // rings
    [R1, R2, R3].forEach(function (r, i) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7);
      ctx.strokeStyle = i === 0 ? C.line : C.lineSoft; ctx.lineWidth = i === 0 ? 2 : 1.2; ctx.stroke();
    });
    // sign spokes + glyphs
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (var k = 0; k < 12; k++) {
      var p1 = pt(k * 30, R2), p2 = pt(k * 30, R1);
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.2; ctx.stroke();
      var g = pt(k * 30 + 15, (R1 + R2) / 2);
      ctx.fillStyle = C.gold; ctx.font = (W * 0.038) + "px serif";
      ctx.fillText(GLYPH[k], g[0], g[1]);
    }
    // nakshatra ticks
    for (k = 0; k < 27; k++) {
      var t1 = pt(k * 360 / 27, R3), t2 = pt(k * 360 / 27, R3 + W * 0.012);
      ctx.beginPath(); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]);
      ctx.strokeStyle = C.ink3; ctx.lineWidth = 1; ctx.stroke();
    }
    // lagna axis
    var la = pt(chart.lagna.sidLon, R2 - 2), lo = pt(chart.lagna.sidLon + 180, Rp * 0.25);
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(lo[0], lo[1]); ctx.lineTo(la[0], la[1]);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.setLineDash([]);
    var lt = pt(chart.lagna.sidLon, R2 - W * 0.033);
    ctx.fillStyle = C.gold; ctx.font = "600 " + (W * 0.028) + "px " + '"Rozha One", serif';
    ctx.fillText("La", lt[0], lt[1]);
    // planets with radial stagger for close longitudes
    var sorted = chart.bodies.slice().sort(function (a, b) { return a.sidLon - b.sidLon; });
    var lastLon = -99, level = 0;
    sorted.forEach(function (b) {
      if (b.sidLon - lastLon < 11) level = (level + 1) % 3; else level = 0;
      lastLon = b.sidLon;
      var r = Rp - level * W * 0.052;
      var pp = pt(b.sidLon, r);
      ctx.beginPath(); ctx.arc(pp[0], pp[1], W * 0.008, 0, 7);
      ctx.fillStyle = b.retro && b.name !== "Rahu" && b.name !== "Ketu" ? C.verm : C.goldDeep;
      ctx.fill();
      ctx.strokeStyle = C.bg; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = (W * 0.026) + "px " + '"Rozha One", serif';
      var lp = pt(b.sidLon, r + W * 0.036);
      ctx.fillText(b.abbr, lp[0], lp[1]);
      var tick1 = pt(b.sidLon, R3), tick2 = pt(b.sidLon, R3 - W * 0.014);
      ctx.beginPath(); ctx.moveTo(tick1[0], tick1[1]); ctx.lineTo(tick2[0], tick2[1]);
      ctx.strokeStyle = C.goldDeep; ctx.lineWidth = 1.6; ctx.stroke();
    });
    // center
    ctx.fillStyle = C.ink3; ctx.font = (W * 0.024) + "px " + '"Rozha One", serif';
    ctx.fillText("ॐ", cx, cy);
  }

  // ------------------------------------------------------- kundli renderers
  function placementsOf(chart, dv) {
    var out = [];
    out.push({ abbr: "La", rashi: dv === 9 ? chart.lagna.d9rashi : chart.lagna.rashi, lagna: true, retro: false });
    chart.bodies.forEach(function (b) {
      out.push({ abbr: b.abbr, rashi: dv === 9 ? b.d9rashi : b.rashi, lagna: false,
        retro: b.retro && b.name !== "Rahu" && b.name !== "Ketu" });
    });
    return out;
  }

  function renderCharts(chart) {
    var d1 = placementsOf(chart, 1), d9 = placementsOf(chart, 9);
    var asc1 = chart.lagna.rashi, asc9 = chart.lagna.d9rashi;
    if (chartStyle === "north") {
      $("chart-d1").innerHTML = northSVG(d1, asc1);
      $("chart-d9").innerHTML = northSVG(d9, asc9);
    } else {
      $("chart-d1").innerHTML = southHTML(d1, asc1);
      $("chart-d9").innerHTML = southHTML(d9, asc9);
    }
  }

  var NPOS = [[200,105],[105,55],[55,105],[105,200],[55,295],[105,345],[200,295],[295,345],[345,295],[295,200],[345,105],[295,55]];
  function northSVG(pls, ascRashi) {
    var byHouse = [];
    for (var h = 0; h < 12; h++) byHouse.push([]);
    pls.forEach(function (p) { byHouse[((p.rashi - ascRashi) + 12) % 12].push(p); });
    var s = "<svg class='kundli-n' viewBox='0 0 400 400' role='img' aria-label='Kundli chart, North Indian style'>";
    s += "<rect x='8' y='8' width='384' height='384'/>";
    s += "<line x1='8' y1='8' x2='392' y2='392'/><line x1='392' y1='8' x2='8' y2='392'/>";
    s += "<line x1='200' y1='8' x2='392' y2='200'/><line x1='392' y1='200' x2='200' y2='392'/>";
    s += "<line x1='200' y1='392' x2='8' y2='200'/><line x1='8' y1='200' x2='200' y2='8'/>";
    for (h = 0; h < 12; h++) {
      var cx = NPOS[h][0], cy = NPOS[h][1];
      var signNum = ((ascRashi + h) % 12) + 1;
      s += "<text class='signnum' x='" + cx + "' y='" + (cy - 14) + "' text-anchor='middle'>" + signNum + "</text>";
      var items = byHouse[h];
      for (var i = 0; i < items.length; i++) {
        var row = Math.floor(i / 3), col = i % 3, n = Math.min(items.length - row * 3, 3);
        var x = cx + (col - (n - 1) / 2) * 32;
        var y = cy + 4 + row * 16;
        var cls = "pl" + (items[i].lagna ? " lagna" : "") + (items[i].retro ? " retro" : "");
        s += "<text class='" + cls + "' x='" + x + "' y='" + y + "' text-anchor='middle'>" +
          items[i].abbr + (items[i].retro ? "˖" : "") + "</text>";
      }
    }
    return s + "</svg>";
  }

  var SPOS = [[1,2],[1,3],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[3,1],[2,1],[1,1]]; // rashi 0..11 -> [row,col]
  function southHTML(pls, ascRashi) {
    var bySign = [];
    for (var r = 0; r < 12; r++) bySign.push([]);
    pls.forEach(function (p) { bySign[p.rashi].push(p); });
    var h = "<div class='kundli-s' role='img' aria-label='Kundli chart, South Indian style'>";
    for (r = 0; r < 12; r++) {
      var pos = SPOS[r], isAsc = r === ascRashi;
      var houseNum = ((r - ascRashi) + 12) % 12 + 1;
      h += "<div class='cell" + (isAsc ? " asc" : "") + "' style='grid-row:" + pos[0] + ";grid-column:" + pos[1] + "'>";
      h += "<span class='glyph'>" + GLYPH[r] + "</span><span class='hnum'>" + houseNum + "</span><div class='pls'>";
      h += bySign[r].map(function (p) {
        var cls = p.lagna ? "lg" : (p.retro ? "r" : "");
        return "<span class='" + cls + "'>" + p.abbr + (p.retro ? "˖" : "") + "</span>";
      }).join(" ");
      h += "</div></div>";
    }
    h += "<div class='center'><span class='t'>" + J.RASHI[ascRashi] + " lagna</span><span class='d'>houses count clockwise from La</span></div>";
    return h + "</div>";
  }

  // ---------------------------------------------------------- planet table
  function renderPlanetTable(chart) {
    var h = "<table><thead><tr><th>Graha</th><th>Longitude</th><th>Rashi</th><th>Nakshatra</th><th>House</th><th>Motion °/day</th><th>Dignity &amp; state</th></tr></thead><tbody>";
    var rows = [chart.lagna].concat(chart.bodies);
    rows.forEach(function (b) {
      var isLagna = b.name === "Lagna";
      h += "<tr>";
      h += "<td><span class='graha-name'>" + b.name + "<span class='dev'>" + SANSKRIT[b.name] + "</span></span></td>";
      h += "<td class='num'>" + GLYPH[b.rashi] + " " + dms(b.degInSign) + "</td>";
      h += "<td>" + J.RASHI[b.rashi] + "</td>";
      h += "<td>" + J.NAK[b.nakshatra] + " <span style='color:var(--ink-3)'>· " + b.pada + "</span></td>";
      h += "<td class='num'>" + b.house + "</td>";
      if (isLagna) h += "<td class='num'>—</td>";
      else {
        var spd = (b.speed >= 0 ? "+" : "") + b.speed.toFixed(3);
        h += "<td class='num'>" + spd + (b.retro && b.name !== "Rahu" && b.name !== "Ketu" ? " <span class='flag retro'>℞ retro</span>" : "") + "</td>";
      }
      var flags = "";
      if (b.dignity === "Exalted") flags += "<span class='flag ex'>exalted</span>";
      if (b.dignity === "Debilitated") flags += "<span class='flag deb'>debilitated</span>";
      if (b.dignity === "Own sign") flags += "<span class='flag own'>own sign</span>";
      if (b.combust) flags += "<span class='flag comb'>combust</span>";
      if ((b.name === "Rahu" || b.name === "Ketu") && !isLagna) flags += "<span class='flag own'>node · always retro</span>";
      h += "<td>" + (flags || "<span style='color:var(--ink-3)'>—</span>") + "</td></tr>";
    });
    $("planet-table").innerHTML = h + "</tbody></table>";
  }

  // ------------------------------------------------------------- panchanga
  function renderPanchanga(chart) {
    var p = chart.panchanga, tz = chart.input.tzHours, e = p.ends, bjd = chart.jdUt;
    var mnk = p.moonNakshatra;
    var rows = [
      ["Tithi", p.tithi.paksha + " " + p.tithi.name + " (" + p.tithi.num + ")", fmtUntil(e.tithi, tz, bjd)],
      ["Vara", p.vara.name, "lord " + p.vara.lord],
      ["Nakshatra", J.NAK[mnk.n] + " · pada " + mnk.pada, fmtUntil(e.nakshatra, tz, bjd)],
      ["Yoga", p.yoga.name + " (" + p.yoga.num + ")", fmtUntil(e.yoga, tz, bjd)],
      ["Karana", p.karana.name, fmtUntil(e.karana, tz, bjd)],
      ["Sunrise → Sunset", (chart.sunrise !== null ? fmtTime(chart.sunrise, tz) : "—") + " → " + (chart.sunset !== null ? fmtTime(chart.sunset, tz) : "—"), ""],
      ["Ayanamsa (Lahiri)", dms(chart.ayanamsa), "ΔT " + chart.deltaT.toFixed(1) + " s"],
      ["Julian Day (UT)", chart.jdUt.toFixed(5), ""]
    ];
    var h = "";
    rows.forEach(function (r) {
      h += "<div class='prow'><span class='k'>" + r[0] + "</span><span class='v'>" + esc(r[1]) +
        (r[2] ? "<small>" + esc(r[2]) + "</small>" : "") + "</span></div>";
    });
    $("panchanga").innerHTML = h;
  }

  // ----------------------------------------------------------------- dasha
  function renderDasha(chart) {
    var d = chart.dasha, tz = chart.input.tzHours, cur = d.current;
    var h = "";
    if (cur) {
      h += "<div class='dchain'>";
      [["Mahadasha", cur.md], ["Antardasha", cur.ad], ["Pratyantardasha", cur.pd]].forEach(function (lv) {
        if (!lv[1]) return;
        h += "<div class='dcell'><span class='lv'>" + lv[0] + "</span><div class='who'>" + lv[1].lord + "</div>" +
          "<div class='rng'>" + fmtDate(lv[1].start, tz) + " → " + fmtDate(lv[1].end, tz) + "</div></div>";
      });
      h += "</div>";
    }
    var t0 = d.mds[0].start, span = d.mds[8].end - t0;
    h += "<div class='dband'>";
    d.mds.forEach(function (md) {
      var w = (md.end - md.start) / span * 100;
      var cls = d.nowJd >= md.end ? "past" : (cur && cur.md === md ? "cur" : "");
      h += "<div class='dseg " + cls + "' style='flex-basis:" + w.toFixed(3) + "%' title='" + md.lord +
        " mahadasha: " + fmtDate(md.start, tz) + " → " + fmtDate(md.end, tz) + "'>" +
        "<div class='t'><b>" + LORD_ABBR[md.lord] + "</b><span>" + Math.round((md.end - md.start) / 365.25) + "y</span></div></div>";
    });
    var nowPct = Math.max(0, Math.min(100, (d.nowJd - t0) / span * 100));
    h += "<div class='dnow' style='left:" + nowPct.toFixed(2) + "%'></div></div>";
    h += "<div class='dscale'><span>" + fmtDate(t0, tz).slice(-4) + "</span><span>120-year Vimshottari cycle</span><span>" + fmtDate(d.mds[8].end, tz).slice(-4) + "</span></div>";
    h += "<div class='hint'>Dasha balance at birth: <b style='color:var(--gold)'>" + d.mds[0].lord + " " +
      yearsToYMD(d.balanceYears) + "</b> remaining of its " + Math.round((d.mds[0].end - d.mds[0].start) / 365.25) + " years.</div>";
    $("dasha-top").innerHTML = h;

    // expandable MD table
    var th = "<table><thead><tr><th></th><th>Mahadasha</th><th>Begins</th><th>Ends</th><th>Length</th><th>Age at start</th></tr></thead><tbody>";
    d.mds.forEach(function (md, i) {
      var isCur = cur && cur.md === md;
      th += "<tr class='mdrow" + (isCur ? " hl" : "") + "' data-i='" + i + "'>";
      th += "<td><span class='expander' id='exp-" + i + "'>▸</span></td>";
      th += "<td><span class='graha-name'>" + md.lord + "</span>" + (isCur ? " <span class='flag comb'>running</span>" : "") + "</td>";
      th += "<td class='num'>" + fmtDate(md.start, tz) + "</td><td class='num'>" + fmtDate(md.end, tz) + "</td>";
      th += "<td class='num'>" + Math.round((md.end - md.start) / 365.25) + "y</td>";
      th += "<td class='num'>" + Math.max(0, (md.start - chart.jdUt) / 365.25).toFixed(1) + "</td></tr>";
      th += "<tr class='adbox' id='ad-" + i + "' style='display:none'><td></td><td colspan='5'></td></tr>";
    });
    $("dasha-table").innerHTML = th + "</tbody></table>";
    d.mds.forEach(function (md, i) {
      var row = $("dasha-table").querySelector(".mdrow[data-i='" + i + "']");
      row.addEventListener("click", function () {
        var box = $("ad-" + i), open = box.style.display !== "none";
        box.style.display = open ? "none" : "table-row";
        $("exp-" + i).textContent = open ? "▸" : "▾";
        if (!open && !box.dataset.filled) {
          var ads = J.subPeriods(md.lordIdx, md.start, md.end - md.start);
          box.cells[1].innerHTML = ads.map(function (ad) {
            var isCurAd = cur && cur.md === md && cur.ad && cur.ad.lord === ad.lord;
            return "<span class='adline" + (isCurAd ? " cur" : "") + "'>" + LORD_ABBR[ad.lord] + " " +
              fmtDate(ad.start, tz) + "–" + fmtDate(ad.end, tz) + "</span>";
          }).join(" ");
          box.dataset.filled = "1";
        }
      });
    });
  }

  // -------------------------------------------------- life map (0-90)
  function fmtMonYr(jdUt, tz) {
    var p = jdLocal(jdUt, tz);
    return MON[p.m - 1] + " " + p.y;
  }

  function gradeChip(grade, score) {
    return "<span class='gchip " + grade.key + "'>" + grade.label +
      (score !== undefined ? " · " + score : "") + "</span>";
  }

  function renderLifeMap(chart) {
    var life = J.lifeTimeline(chart, 90);
    var tz = chart.input.tzHours, o = life.overview;
    var h = "";

    h += "<div style='font-size:13px;color:var(--ink-2);max-width:80ch'>Each dasha-bhukti window scored by the classical Parashari rules — functional lordship for your lagna, dignity and placement of the period lords, ashtakavarga support, and the relation between mahadasha and bhukti lords. Higher is smoother.</div>";
    h += "<canvas id='life-curve' width='1080' height='300' role='img' aria-label='Life quality curve from birth to age 90, one step per dasha-bhukti'></canvas>";
    h += "<div class='life-tip' id='life-tip'></div>";

    h += "<div class='life-over'>";
    if (o.current && o.ageNow >= 0 && o.ageNow <= o.maxAge) {
      h += "<span class='gchip " + o.current.grade.key + "'>Now (age " + o.ageNow.toFixed(1) + "): " +
        o.current.mdLord + "–" + o.current.adLord + " · " + o.current.grade.label + "</span>";
    }
    o.best.forEach(function (b) {
      h += "<span class='gchip uttama'>Peak: " + b.mdLord + "–" + b.adLord + " · age " +
        b.ageStart.toFixed(1) + "–" + b.ageEnd.toFixed(1) + "</span>";
    });
    o.toughest.forEach(function (b) {
      h += "<span class='gchip kashta'>Care: " + b.mdLord + "–" + b.adLord + " · age " +
        b.ageStart.toFixed(1) + "–" + b.ageEnd.toFixed(1) + "</span>";
    });
    h += "</div>";

    h += "<div id='md-blocks'>";
    life.mahadashas.forEach(function (m, i) {
      var isCur = o.current && o.current.mdLord === m.lord &&
        m.startJd <= chart.dasha.nowJd && chart.dasha.nowJd < m.endJd;
      h += "<div class='md-block" + (isCur ? " open" : "") + "' id='mdb-" + i + "'>";
      h += "<button type='button' class='md-head' data-mdb='" + i + "' aria-expanded='" + (isCur ? "true" : "false") + "'>";
      h += "<span class='who'>" + m.lord + "</span>";
      h += "<span class='ages'>age " + m.ageStart.toFixed(1) + "–" + m.ageEnd.toFixed(1) + " · " +
        fmtMonYr(m.startJd, tz) + " – " + fmtMonYr(m.endJd, tz) + "</span>";
      h += gradeChip(m.grade, m.score);
      h += "<span class='caret'>▾</span></button>";
      h += "<div class='md-body'><p class='md-sum'>" + m.summary + "</p>";
      m.bhuktis.forEach(function (b) {
        h += "<div class='bh-row'>";
        h += "<div><span class='who'>" + LORD_ABBR[b.mdLord] + "–" + b.adLord + "</span><br>" + gradeChip(b.grade, b.score) + "</div>";
        h += "<div class='rng'>age " + b.ageStart.toFixed(1) + "–" + b.ageEnd.toFixed(1) + "<br>" +
          fmtMonYr(b.startJd, tz) + " –<br>" + fmtMonYr(b.endJd, tz) + "</div>";
        h += "<div class='txt'>" + b.text + "</div>";
        h += "</div>";
      });
      h += "</div></div>";
    });
    h += "</div>";
    h += "<div class='life-fine'>This map is the classical Parashari dasha-phala reading of your chart — tendencies expressed in the tradition's own rules, not certainties, and never a substitute for medical, financial or legal judgement. The same lords that test you in one domain often build you in another.</div>";

    $("lifemap").innerHTML = h;
    drawLifeCurve(chart, life);

    var blocks = $("md-blocks");
    blocks.addEventListener("click", function (e) {
      var head = e.target && e.target.closest ? e.target.closest(".md-head") : null;
      if (!head) return;
      var blk = $("mdb-" + head.getAttribute("data-mdb"));
      if (!blk) return;
      var open = blk.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function drawLifeCurve(chart, life) {
    var cv = $("life-curve");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    var padL = 34, padR = 12, padT = 30, padB = 26;
    var x0 = padL, x1 = W - padR, y0 = H - padB, y1 = padT;
    var maxAge = life.overview.maxAge;
    function ax(age) { return x0 + (age / maxAge) * (x1 - x0); }
    function sy(score) { return y0 - (score / 100) * (y0 - y1); }
    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.font = "11px " + '"Cascadia Mono", Consolas, monospace';
    ctx.fillStyle = C.ink3; ctx.strokeStyle = C.lineSoft; ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(function (s) {
      ctx.beginPath(); ctx.moveTo(x0, sy(s)); ctx.lineTo(x1, sy(s)); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(String(s), x0 - 6, sy(s));
    });
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var a = 0; a <= maxAge; a += 10) {
      ctx.fillText(String(a), ax(a), y0 + 6);
    }

    // MD boundaries + lord labels
    ctx.textBaseline = "bottom";
    life.mahadashas.forEach(function (m) {
      var x = ax(m.ageStart);
      ctx.strokeStyle = C.line; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x, y1 - 4); ctx.lineTo(x, y0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.gold; ctx.font = "12px " + '"Rozha One", serif';
      ctx.fillText(LORD_ABBR[m.lord], ax((m.ageStart + m.ageEnd) / 2), y1 - 6);
    });

    // step area + line
    var bhs = [];
    life.mahadashas.forEach(function (m) { m.bhuktis.forEach(function (b) { bhs.push(b); }); });
    ctx.beginPath();
    ctx.moveTo(ax(bhs[0].ageStart), y0);
    bhs.forEach(function (b) {
      ctx.lineTo(ax(b.ageStart), sy(b.score));
      ctx.lineTo(ax(b.ageEnd), sy(b.score));
    });
    ctx.lineTo(ax(bhs[bhs.length - 1].ageEnd), y0);
    ctx.closePath();
    ctx.fillStyle = "rgba(190,138,48,0.16)";
    ctx.fill();
    ctx.beginPath();
    bhs.forEach(function (b, i) {
      if (i === 0) ctx.moveTo(ax(b.ageStart), sy(b.score));
      else ctx.lineTo(ax(b.ageStart), sy(b.score));
      ctx.lineTo(ax(b.ageEnd), sy(b.score));
    });
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke();

    // "now" marker
    var ageNow = life.overview.ageNow;
    if (ageNow >= 0 && ageNow <= maxAge) {
      var xn = ax(ageNow);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(xn, y1); ctx.lineTo(xn, y0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.ink; ctx.font = "10px " + '"Cascadia Mono", Consolas, monospace';
      ctx.textAlign = xn > (x0 + x1) / 2 ? "right" : "left";
      ctx.fillText("now", xn + (xn > (x0 + x1) / 2 ? -4 : 4), y1 + 10);
    }

    // hover tooltip
    if (!cv.addEventListener) return;
    var tip = $("life-tip"), tz = chart.input.tzHours;
    cv.addEventListener("mousemove", function (e) {
      var rect = cv.getBoundingClientRect();
      var scale = W / rect.width;
      var px = (e.clientX - rect.left) * scale;
      var age = (px - x0) / (x1 - x0) * maxAge;
      var hit = null;
      for (var i = 0; i < bhs.length; i++) {
        if (age >= bhs[i].ageStart && age < bhs[i].ageEnd) { hit = bhs[i]; break; }
      }
      if (!hit || age < 0 || age > maxAge) { tip.style.display = "none"; return; }
      tip.innerHTML = "<div class='t1'>" + hit.mdLord + " mahadasha · " + hit.adLord + " bhukti · " +
        hit.grade.label + " " + hit.score + "</div><div class='t2'>age " + hit.ageStart.toFixed(1) +
        "–" + hit.ageEnd.toFixed(1) + " · " + fmtMonYr(hit.startJd, tz) + " – " + fmtMonYr(hit.endJd, tz) + "</div>";
      tip.style.display = "block";
      var bx = e.clientX - rect.left, by = e.clientY - rect.top;
      tip.style.left = Math.min(bx + 14, rect.width - 270) + "px";
      tip.style.top = (by + 16) + "px";
    });
    cv.addEventListener("mouseleave", function () { tip.style.display = "none"; });
  }

  // ---------------------------------------------- family timeline (kutumba)
  var FAM_KEY = "jyotishFamily.v1";
  var famMembers = [];   // [{ name, input }] persisted client-side only
  var famCache = {};     // input-json -> { chart, bhuktis }
  var BAND = { uttama: "#2F9D6C", shubha: "#BE8A30", mishra: "#3F4767", kashta: "#A14E3D", atikashta: "#E0644C" };

  function famLoad() {
    try {
      if (typeof localStorage === "undefined") return;
      var raw = localStorage.getItem(FAM_KEY);
      if (raw) famMembers = JSON.parse(raw).slice(0, 4);
    } catch (err) { famMembers = []; }
  }
  function famSave() {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(FAM_KEY, JSON.stringify(famMembers));
    } catch (err) { /* private mode etc. — keep in-memory */ }
  }
  function famTimelineOf(m) {
    var key = JSON.stringify(m.input);
    if (!famCache[key]) {
      var ch = J.computeChart(m.input);
      var flat = [];
      J.lifeTimeline(ch, 90).mahadashas.forEach(function (md) {
        md.bhuktis.forEach(function (b) { flat.push(b); });
      });
      famCache[key] = { chart: ch, bhuktis: flat };
    }
    return famCache[key];
  }
  function famActiveAt(bhuktis, t) {
    for (var k = 0; k < bhuktis.length; k++) {
      if (bhuktis[k].startJd <= t && t < bhuktis[k].endJd) return bhuktis[k];
    }
    return null;
  }

  function addFamilyMember() {
    if (!lastChart) return;
    if (famMembers.length >= 4) { alert("Family timeline holds up to 4 charts — remove one first."); return; }
    var inp = lastChart.input, copy = {};
    ["year","month","day","hour","minute","second","tzHours","lat","lon","timeUnknown","name"].forEach(function (k) {
      if (inp[k] !== undefined) copy[k] = inp[k];
    });
    var dup = famMembers.some(function (m) {
      var a = m.input;
      return a.year === copy.year && a.month === copy.month && a.day === copy.day &&
        a.hour === copy.hour && a.minute === copy.minute && a.lat === copy.lat && a.lon === copy.lon;
    });
    if (dup) { alert("This chart is already on the family timeline."); return; }
    famMembers.push({ name: (copy.name || "").trim() || "Member " + (famMembers.length + 1), input: copy });
    famSave();
    renderFamily();
  }

  function renderFamily() {
    var box = $("family");
    if (!box) return;
    var h = "<div style='font-size:13px;color:var(--ink-2);max-width:80ch'>Cast each family member's chart above, then add it here. The rows share one calendar axis so you can compare <b style='color:var(--ink)'>timing</b> — when each person's supportive and testing periods fall, and where they coincide. Scores are each chart's own ranking, so rows are never compared by height. Charts stay in this browser only.</div>";
    h += "<div class='fam-actions'>";
    h += "<button type='button' class='fam-btn' id='fam-add'" + (famMembers.length >= 4 ? " disabled" : "") + ">+ Add current chart</button>";
    famMembers.forEach(function (m, i) {
      h += "<span class='fam-member'>" + esc(m.name) +
        " <span class='meta'>" + pad2(m.input.day) + "." + pad2(m.input.month) + "." + m.input.year + "</span>" +
        "<button type='button' data-fam-remove='" + i + "' aria-label='Remove " + esc(m.name) + "'>×</button></span>";
    });
    if (famMembers.length) h += "<button type='button' class='fam-btn ghost' id='fam-clear'>Clear all</button>";
    h += "</div>";

    if (famMembers.length >= 1) {
      var rows = famMembers.length;
      h += "<canvas id='family-strips' width='1080' height='" + (rows * 44 + 50) +
        "' role='img' aria-label='Family dasha timeline: one grade-band row per member on a shared calendar axis'></canvas>";
      h += "<div class='life-tip' id='fam-tip'></div>";
      h += "<div class='fam-legend'>";
      [["uttama","Uttama · excellent"],["shubha","Shubha · favorable"],["mishra","Mishra · mixed"],["kashta","Kashta · demanding"],["atikashta","Atikashta · testing"]].forEach(function (g) {
        h += "<span class='gchip " + g[0] + "'>" + g[1] + "</span>";
      });
      h += "</div>";
    }

    if (famMembers.length >= 2) {
      var members = famMembers.map(function (m) {
        return { name: m.name, bhuktis: famTimelineOf(m).bhuktis };
      });
      var windows = J.familyConfluence(members, { minDays: 90 });
      var nowJd = 2440587.5 + Date.now() / 86400000.0;
      var tzs = famMembers[0].input.tzHours;
      function confRows(kind, title, note) {
        var list = windows.filter(function (w) { return w.kind === kind; });
        if (!list.length) return "";
        var out = "<div class='conf-head'>" + title + "</div><div style='font-size:12px;color:var(--ink-3)'>" + note + "</div><div class='conf-list'>";
        var shown = 0;
        list.forEach(function (w) {
          if (shown >= 14) return;
          shown++;
          var isNow = w.startJd <= nowJd && nowJd < w.endJd;
          var mid = (w.startJd + w.endJd) / 2;
          var detail = members.filter(function (m) { return w.names.indexOf(m.name) >= 0; })
            .map(function (m) {
              var b = famActiveAt(m.bhuktis, mid);
              return esc(m.name) + " in " + (b ? LORD_ABBR[b.mdLord] + "–" + LORD_ABBR[b.adLord] : "—");
            }).join(" · ");
          out += "<div class='conf-row" + (isNow ? " now-row" : "") + "'>";
          out += "<span class='rng'>" + fmtMonYr(w.startJd, tzs) + " – " + fmtMonYr(w.endJd, tzs) +
            (isNow ? " ◂ now" : "") + "</span>";
          out += "<span class='who'>" + w.names.map(esc).join(" + ") + "</span>";
          out += "<span style='color:var(--ink-3);font-size:12px'>" + detail + "</span></div>";
        });
        if (list.length > shown) out += "<div class='conf-row'><span class='rng'>+" + (list.length - shown) + " more windows</span></div>";
        return out + "</div>";
      }
      h += confRows("good", "Supportive confluences",
        "Two or more members simultaneously in Shubha or Uttama periods — the family's natural windows for joint undertakings.");
      h += confRows("tough", "Testing confluences",
        "Two or more members simultaneously in demanding periods — spread big commitments away from these, and be gentle with each other.");
      if (!windows.length) h += "<div class='conf-head'>No sustained confluences</div><div style='font-size:12px;color:var(--ink-3)'>No window of 90+ days where two members share strongly marked periods — the family's highs and lows are staggered.</div>";
    } else if (famMembers.length === 1) {
      h += "<div style='font-size:12.5px;color:var(--ink-3);margin-top:10px'>Add a second chart to see confluence windows.</div>";
    }
    h += "<div class='life-fine'>Each row ranks that person's periods against their own chart — the classical scale is self-relative, so band colors compare <i>when</i>, never <i>who is better</i>. Family reading of aligned dashas is traditional for timing shared decisions; treat it as the tradition's language of tendencies.</div>";
    box.innerHTML = h;
    if (famMembers.length >= 1) drawFamilyStrips();
  }

  function drawFamilyStrips() {
    var cv = $("family-strips");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    var padL = 96, padR = 14, rowH = 44, bandH = 26, topPad = 12;
    var tls = famMembers.map(function (m) { return famTimelineOf(m); });
    var minJd = Infinity, maxJd = -Infinity;
    tls.forEach(function (t) {
      minJd = Math.min(minJd, t.bhuktis[0].startJd);
      maxJd = Math.max(maxJd, t.bhuktis[t.bhuktis.length - 1].endJd);
    });
    function x(t) { return padL + (t - minJd) / (maxJd - minJd) * (W - padL - padR); }
    ctx.clearRect(0, 0, W, H);

    // year ticks (decades; 20y if the span is very wide)
    var y0 = topPad + famMembers.length * rowH;
    var yr0 = J.jdToDate(minJd).y, yr1 = J.jdToDate(maxJd).y;
    var step = (yr1 - yr0) > 130 ? 20 : 10;
    ctx.font = "11px " + '"Cascadia Mono", Consolas, monospace';
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var yr = Math.ceil(yr0 / step) * step; yr <= yr1; yr += step) {
      var xt = x(J.julianDay(yr, 1, 1, 0));
      ctx.strokeStyle = C.lineSoft; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xt, topPad); ctx.lineTo(xt, y0); ctx.stroke();
      ctx.fillStyle = C.ink3;
      ctx.fillText(String(yr), xt, y0 + 8);
    }

    // member rows
    famMembers.forEach(function (m, i) {
      var yTop = topPad + i * rowH + (rowH - bandH) / 2;
      ctx.fillStyle = C.ink2;
      ctx.font = "12.5px -apple-system, 'Segoe UI', sans-serif";
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      var label = m.name.length > 11 ? m.name.slice(0, 10) + "…" : m.name;
      ctx.fillText(label, padL - 8, yTop + bandH / 2);
      tls[i].bhuktis.forEach(function (b) {
        var xa = x(b.startJd), xb = x(b.endJd);
        ctx.fillStyle = BAND[b.grade.key] || BAND.mishra;
        ctx.fillRect(xa + 0.5, yTop, Math.max(0.8, xb - xa - 1), bandH);
      });
    });

    // now line
    var nowJd = 2440587.5 + Date.now() / 86400000.0;
    if (nowJd > minJd && nowJd < maxJd) {
      var xn = x(nowJd);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(xn, topPad - 4); ctx.lineTo(xn, y0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.ink; ctx.font = "10px " + '"Cascadia Mono", Consolas, monospace';
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText("now", xn + 4, topPad + 6);
    }

    // hover tooltip
    if (!cv.addEventListener) return;
    var tip = $("fam-tip");
    cv.addEventListener("mousemove", function (e) {
      var rect = cv.getBoundingClientRect();
      var sx = W / rect.width, sy = H / rect.height;
      var px = (e.clientX - rect.left) * sx, py = (e.clientY - rect.top) * sy;
      var row = Math.floor((py - topPad) / rowH);
      var t = minJd + (px - padL) / (W - padL - padR) * (maxJd - minJd);
      if (row < 0 || row >= famMembers.length || px < padL) { tip.style.display = "none"; return; }
      var b = famActiveAt(tls[row].bhuktis, t);
      if (!b) { tip.style.display = "none"; return; }
      var tz = famMembers[row].input.tzHours;
      tip.innerHTML = "<div class='t1'>" + esc(famMembers[row].name) + " — " + b.mdLord + " MD · " +
        b.adLord + " bhukti · " + b.grade.label + " " + b.score + "</div><div class='t2'>age " +
        b.ageStart.toFixed(1) + "–" + b.ageEnd.toFixed(1) + " · " + fmtMonYr(b.startJd, tz) + " – " + fmtMonYr(b.endJd, tz) + "</div>";
      tip.style.display = "block";
      var bx = e.clientX - rect.left, by = e.clientY - rect.top;
      tip.style.left = Math.min(bx + 14, rect.width - 280) + "px";
      tip.style.top = (by + cvOffsetTop(cv) + 16) + "px";
    });
    cv.addEventListener("mouseleave", function () { tip.style.display = "none"; });
  }
  function cvOffsetTop(cv) {
    // tooltip div is positioned against the card; offset by canvas position inside it
    return (cv.offsetTop || 0);
  }

  // -------------------------------------------------------------- strength
  function renderStrength(chart) {
    var av = chart.strength.ashtakavarga, lagnaR = chart.lagna.rashi;
    var h = "<div style='font-size:13px;color:var(--ink-2);margin-bottom:2px'>Sarvashtakavarga — total benefic bindus per rashi (average 28; 30+ supportive, 24− lean)</div><div class='sav'>";
    for (var s = 0; s < 12; s++) {
      var v = av.sav[s];
      h += "<div class='s" + (v >= 30 ? " hi" : v <= 24 ? " lo" : "") + (s === lagnaR ? " lagna" : "") +
        "' title='" + J.RASHI[s] + (s === lagnaR ? " (lagna)" : "") + "'><span class='g'>" + GLYPH[s] + "</span><span class='n'>" + v + "</span></div>";
    }
    h += "</div>";

    // uccha / cheshta bala
    h += "<details><summary>Uccha &amp; cheshta bala (virupas, 0–60)</summary><div class='inner tbl-wrap'><table class='mini'><thead><tr><th>Graha</th>";
    var g7 = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
    g7.forEach(function (g) { h += "<th>" + LORD_ABBR[g] + "</th>"; });
    h += "</tr></thead><tbody><tr><td>Uccha (exaltation)</td>";
    g7.forEach(function (g) {
      var b = chart.bodies.filter(function (x) { return x.name === g; })[0];
      h += "<td class='num'>" + b.ucchaBala.toFixed(1) + "</td>";
    });
    h += "</tr><tr><td>Cheshta (motion)</td>";
    g7.forEach(function (g) {
      var b = chart.bodies.filter(function (x) { return x.name === g; })[0];
      h += "<td class='num'>" + (b.cheshtaBala === null ? "—" : b.cheshtaBala.toFixed(1)) + "</td>";
    });
    h += "</tr></tbody></table><p class='hint' style='margin:10px 0 0'>Uccha bala peaks at the exaltation point and falls linearly to zero at debilitation. Cheshta bala rewards slow or retrograde motion against each graha’s mean rate (Sun &amp; Moon take other balas in the classical scheme).</p></div></details>";

    // BAV
    h += "<details><summary>Bhinnashtakavarga — per-graha bindus</summary><div class='inner tbl-wrap'><table class='mini'><thead><tr><th></th>";
    for (s = 0; s < 12; s++) h += "<th>" + GLYPH[s] + "</th>";
    h += "<th>Σ</th></tr></thead><tbody>";
    g7.forEach(function (g) {
      h += "<tr><td>" + g + "</td>";
      var tot = 0;
      for (s = 0; s < 12; s++) { var b = av.bav[g][s]; tot += b; h += "<td class='num'>" + b + "</td>"; }
      h += "<td class='num'><b>" + tot + "</b></td></tr>";
    });
    h += "<tr><td><b>SAV</b></td>";
    for (s = 0; s < 12; s++) h += "<td class='num'><b>" + av.sav[s] + "</b></td>";
    h += "<td class='num'><b>337</b></td></tr></tbody></table></div></details>";

    // drishti
    h += "<details><summary>Graha drishti — aspect strengths (virupas)</summary><div class='inner tbl-wrap'><table class='mini'><thead><tr><th>casts → on</th>";
    var targets = chart.bodies.map(function (b) { return b.name; }).concat(["Lagna"]);
    targets.forEach(function (t) { h += "<th>" + (LORD_ABBR[t] || "La") + "</th>"; });
    h += "</tr></thead><tbody>";
    g7.forEach(function (g) {
      h += "<tr><td>" + g + "</td>";
      targets.forEach(function (t) {
        if (t === g) { h += "<td class='num' style='color:var(--ink-3)'>·</td>"; return; }
        var v = Math.round(chart.strength.drishti[g][t]);
        h += "<td class='num'" + (v >= 45 ? " style='color:var(--gold);font-weight:700'" : v === 0 ? " style='color:var(--ink-3)'" : "") + ">" + v + "</td>";
      });
      h += "</tr>";
    });
    h += "</tbody></table><p class='hint' style='margin:10px 0 0'>Parashari sputa drishti: full sight (60) at the 7th; Mars also sees the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th in full.</p></div></details>";
    $("strength").innerHTML = h;
  }

  // ------------------------------------------------------------- name card
  function renderName(chart) {
    var moon = chart.bodies[1], n = moon.nakshatra, pada = moon.pada;
    var syls = J.NAK_SYLLABLES[n];
    var h = "<p style='margin:0 0 4px;font-size:14px'>Janma nakshatra <b style='color:var(--gold)'>" + J.NAK[n] +
      "</b>, pada " + pada + " — the auspicious opening syllables for a given name:</p><div class='syls'>";
    for (var i = 0; i < 4; i++) {
      h += "<span class='syl" + (i + 1 === pada ? " hot" : "") + "'>" + syls[i] + "</span>";
    }
    h += "</div>";
    var name = chart.input.name;
    if (name) {
      var m = chart.nameMatch;
      if (m) {
        var match = m.n === n;
        var mRashi = J.RASHI[Math.floor((m.n * (360 / 27) + (m.pada - 0.5) * (10 / 3)) / 30)];
        h += "<p style='font-size:13.5px;color:var(--ink-2);margin:6px 0 0'>“" + esc(name) + "” opens with <b style='color:var(--ink)'>" + m.syl.charAt(0).toUpperCase() + m.syl.slice(1) + "</b> → " +
          J.NAK[m.n] + " pada " + m.pada + " (" + mRashi + " name-rashi)" +
          (match ? " — <span style='color:var(--teal)'>aligned with the janma nakshatra ✓</span>"
                 : " — differs from the janma nakshatra; tradition treats the name-rashi as a secondary reference for muhurta when birth data is uncertain.") + "</p>";
      } else {
        h += "<p style='font-size:13.5px;color:var(--ink-2);margin:6px 0 0'>“" + esc(name) + "” does not begin with any of the 108 traditional pada syllables — no name-rashi mapping.</p>";
      }
    }
    $("namecard").innerHTML = h;
  }

  // --------------------------------------------------------------- reading
  function renderReading(chart) {
    var lagna = chart.lagna, moon = chart.bodies[1], sun = chart.bodies[0], cur = chart.dasha.current, tz = chart.input.tzHours;
    var lagnaLord = J.RASHI_LORD[lagna.rashi];
    var lordBody = chart.bodies.filter(function (b) { return b.name === lagnaLord; })[0];
    var n = moon.nakshatra;
    var h = "";
    h += "<p><b>Lagna:</b> " + J.RASHI[lagna.rashi] + " (" + J.RASHI_EN[lagna.rashi] + ") rises at " + dms(lagna.degInSign) +
      ". Its lord " + lagnaLord + " sits in " + J.RASHI[lordBody.rashi] + ", house " + lordBody.house +
      (lordBody.dignity ? ", " + lordBody.dignity.toLowerCase() : "") + ".</p>";
    h += "<p><b>Chandra:</b> the Moon occupies " + J.RASHI[moon.rashi] + " in " + J.NAK[n] + " nakshatra (pada " + moon.pada +
      ") — deity " + J.NAK_DEITY[n] + ", symbol " + J.NAK_SYMBOL[n].toLowerCase() + ", ruled by " + J.LORDS[n % 9] +
      ", whose cycle therefore opens the Vimshottari sequence.</p>";
    h += "<p><b>Surya:</b> the Sun stands in " + J.RASHI[sun.rashi] + ", house " + sun.house +
      (sun.dignity ? " — " + sun.dignity.toLowerCase() : "") + ".</p>";
    if (cur) {
      h += "<p><b>Now running:</b> " + cur.md.lord + " mahadasha · " + cur.ad.lord + " antardasha" +
        (cur.pd ? " · " + cur.pd.lord + " pratyantardasha" : "") +
        "; the antardasha runs until " + fmtDate(cur.ad.end, tz) + ".</p>";
    }
    var retro = chart.bodies.filter(function (b) { return b.retro && b.name !== "Rahu" && b.name !== "Ketu"; });
    var comb = chart.bodies.filter(function (b) { return b.combust; });
    if (retro.length || comb.length) {
      h += "<p><b>Motion:</b> " +
        (retro.length ? retro.map(function (b) { return b.name; }).join(", ") + " retrograde at birth. " : "") +
        (comb.length ? comb.map(function (b) { return b.name; }).join(", ") + " combust (within the Sun’s glare)." : "") + "</p>";
    }
    h += "<div class='fine'>The chart, panchanga, dashas and strengths above are exact traditional quantities computed from planetary mechanics. What they <i>mean</i> is the tradition’s domain — this engine asserts the astronomy, not the prediction.</div>";
    $("reading").innerHTML = h;
  }

  // -------------------------------------------------------------- appendix
  function renderAppendix(chart) {
    var h = "";
    h += "<p><b style='color:var(--ink)'>Method.</b> Time scales: Julian Day (Meeus ch.7), ΔT by Espenak–Meeus polynomials (here " + chart.deltaT.toFixed(1) + " s). Planets &amp; Sun: VSOP87D truncated Poisson series (heliocentric, ecliptic of date) with light-time iteration, annual aberration and nutation. Moon: abridged ELP (Meeus ch.47, 60+30 terms). Rahu/Ketu: mean lunar node. Ayanamsa: Lahiri/Chitra-paksha via IAU precession, anchored 23°51′11″ at J2000 (Spica ≈ 180°). Lagna &amp; MC: spherical trigonometry from apparent sidereal time. Houses: whole-sign. Sunrise and every panchanga boundary: bracketed bisection root-finding, not interpolation. Vimshottari: exact proportional subdivision of the 120-year cycle.</p>";
    h += "<p><b style='color:var(--ink)'>Validation</b> (run against independent references at build time): <code>88/88</code> spec checks pass — Meeus worked examples, ascendant identities, dasha invariants, ashtakavarga total 337. Against the JPL DE421 ephemeris over 1900–2050 (1,200 epochs), max longitude error: Sun 0.01′, Moon 0.22′, Mercury 0.01′, Venus 0.02′, Mars 0.01′, Jupiter 0.02′, Saturn 0.02′ — the worst case is 1/900 of one pada. New-moon roots land within 35 s of the 2017 &amp; 2024 solar-eclipse times; sunrise within 2 s of the Skyfield almanac.</p>";
    h += "<p><b style='color:var(--ink)'>Life map scoring.</b> Each bhukti's score is a stated, reproducible function of classical factors: BPHS functional lordship for your lagna (trikona lords benefic; 3rd/6th/8th/11th lords malefic; kendradhipati; yogakaraka detection), the period lord's dignity, bhava, combustion, retrogression, ashtakavarga bindus and uccha bala, plus the mahadasha–bhukti relation (trine/dusthana counting between the lords, natural friendship, own-bhukti and dasha-chidra rules). Nodes take their dispositor's functional nature. The 0–100 scale is a ranking of the chart's own periods, not an absolute measure.</p>";
    h += "<p><b style='color:var(--ink)'>Limits.</b> Valid 1800–2149 (series truncation span). Moon is geocentric — classical kundli practice; topocentric parallax (≤≈1°) is not applied. Node is mean, not true. The UTC offset you enter is taken as ground truth — for historical births check what clock the birthplace actually used (e.g. pre-1948 India, wartime DST). A 1-minute birth-time error moves the lagna ≈ 0.25° and the Moon ≈ 0.55′ — birth-time accuracy matters more than ephemeris accuracy here.</p>";
    $("appendix").innerHTML = h;
  }

  // family container: one delegated listener (contents re-render freely)
  $("family").addEventListener("click", function (e) {
    var t = e.target || {};
    if (t.id === "fam-add") { addFamilyMember(); return; }
    if (t.id === "fam-clear") { famMembers = []; famSave(); renderFamily(); return; }
    var rm = t.getAttribute ? t.getAttribute("data-fam-remove") : null;
    if (rm !== null && rm !== undefined) {
      famMembers.splice(parseInt(rm, 10), 1);
      famSave();
      renderFamily();
    }
  });

  // ------------------------------------------------------------ boot: example
  famLoad();
  $("in-date").value = "1990-09-08";
  $("in-time").value = "10:15";
  pickCity(["Chennai (Madras)", "India", 13.08, 80.27, 5.5, 0]);
  $("in-name").value = "Ananya";
  compute(true);
})();
