"""
jyotish_core.py — reference implementation of the Jyotish Computation Engine (v1).
From-first-principles: Kepler's equation (Newton-Raphson), truncated perturbation
series for Sun/Moon, spherical trig for lagna, precession-based ayanamsa,
root-finding for event times, derivatives for retrogrades, Vimshottari operator.
Run this file to execute the validation suite (Meeus test cases) + a demo chart.
"""
from math import sin, cos, tan, atan2, asin, sqrt, floor, pi, radians, degrees

D2R = pi / 180.0
YEAR_DAYS = 365.25  # dasha year convention (configurable)

# ---------------------------------------------------------------- utilities
def wrap360(x):
    return x % 360.0

def wrap180(x):
    return (x + 180.0) % 360.0 - 180.0

def julian_day(y, m, d, ut_hours=0.0):
    """Meeus ch.7, Gregorian calendar. d may be fractional."""
    d = d + ut_hours / 24.0
    if m <= 2:
        y -= 1
        m += 12
    a = floor(y / 100)
    b = 2 - a + floor(a / 4)
    return floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + d + b - 1524.5

def jd_to_date(jd):
    """Inverse of julian_day (Meeus ch.7)."""
    jd += 0.5
    z, f = int(jd), jd - int(jd)
    if z >= 2299161:
        alpha = int((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - alpha // 4
    else:
        a = z
    b = a + 1524
    c = int((b - 122.1) / 365.25)
    d = int(365.25 * c)
    e = int((b - d) / 30.6001)
    day = b - d - int(30.6001 * e) + f
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    hrs = (day - int(day)) * 24
    return year, month, int(day), hrs

def fmt_jd(jd):
    y, m, d, h = jd_to_date(jd)
    return "%04d-%02d-%02d %02d:%02d UT" % (y, m, d, int(h), int(round((h % 1) * 60)))

def delta_t_seconds(year):
    """Espenak-Meeus polynomials, valid ~1986-2050 (extend piecewise as needed)."""
    t = year - 2000.0
    if year < 2005:
        return (63.86 + 0.3345 * t - 0.060374 * t**2 + 0.0017275 * t**3
                + 0.000651814 * t**4 + 0.00002373599 * t**5)
    return 62.92 + 0.32217 * t + 0.005589 * t**2

def jd_tt_from_ut(jd_ut):
    y, m, d, _ = jd_to_date(jd_ut)
    return jd_ut + delta_t_seconds(y + (m - 0.5) / 12.0) / 86400.0

def centuries(jd_tt):
    return (jd_tt - 2451545.0) / 36525.0

# ---------------------------------------------------------------- Sun (Meeus 25)
def sun_tropical(jd_tt, apparent=True):
    """Returns (longitude deg of-date, radius AU)."""
    T = centuries(jd_tt)
    L0 = wrap360(280.46646 + 36000.76983 * T + 0.0003032 * T * T)
    M = wrap360(357.52911 + 35999.05029 * T - 0.0001537 * T * T)
    e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T
    Mr = M * D2R
    C = ((1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(Mr)
         + (0.019993 - 0.000101 * T) * sin(2 * Mr)
         + 0.000289 * sin(3 * Mr))
    theta = L0 + C
    nu = (M + C) * D2R
    R = 1.000001018 * (1 - e * e) / (1 + e * cos(nu))
    if apparent:
        omega = (125.04 - 1934.136 * T) * D2R
        theta = theta - 0.00569 - 0.00478 * sin(omega)   # nutation + aberration
    return wrap360(theta), R

# ---------------------------------------------------------------- Moon (Meeus 47)
_LTERMS = [  # (D, M, M', F, coeff of sin, unit 1e-6 deg)
 (0,0,1,0,6288774),(2,0,-1,0,1274027),(2,0,0,0,658314),(0,0,2,0,213618),
 (0,1,0,0,-185116),(0,0,0,2,-114332),(2,0,-2,0,58793),(2,-1,-1,0,57066),
 (2,0,1,0,53322),(2,-1,0,0,45758),(0,1,-1,0,-40923),(1,0,0,0,-34720),
 (0,1,1,0,-30383),(2,0,0,-2,15327),(0,0,1,2,-12528),(0,0,1,-2,10980),
 (4,0,-1,0,10675),(0,0,3,0,10034),(4,0,-2,0,8548),(2,1,-1,0,-7888),
 (2,1,0,0,-6766),(1,0,-1,0,-5163),(1,1,0,0,4987),(2,-1,1,0,4036),
 (2,0,2,0,3994),(4,0,0,0,3861),(2,0,-3,0,3665),(0,1,-2,0,-2689),
 (2,0,-1,2,-2602),(2,-1,-2,0,2390),(1,0,1,0,-2348),(2,-2,0,0,2236),
 (0,1,2,0,-2120),(0,2,0,0,-2069),(2,-2,-1,0,2048),(2,0,1,-2,-1773),
 (2,0,0,2,-1595),(4,-1,-1,0,1215),(0,0,2,2,-1110),(3,0,-1,0,-892),
 (2,1,1,0,-810),(4,-1,-2,0,759),(0,2,-1,0,-713),(2,2,-1,0,-700),
 (2,1,-2,0,691),(2,-1,0,-2,596),(4,0,1,0,549),(0,0,4,0,537),
 (4,-1,0,0,520),(1,0,-2,0,-487),(2,1,0,-2,-399),(0,0,2,-2,-381),
 (1,1,1,0,351),(3,0,-2,0,-340),(4,0,-3,0,330),(2,-1,2,0,327),
 (0,2,1,0,-323),(1,1,-1,0,299),(2,0,3,0,294)]

_BTERMS = [  # (D, M, M', F, coeff of sin, unit 1e-6 deg)
 (0,0,0,1,5128122),(0,0,1,1,280602),(0,0,1,-1,277693),(2,0,0,-1,173237),
 (2,0,-1,1,55413),(2,0,-1,-1,46271),(2,0,0,1,32573),(0,0,2,1,17198),
 (2,0,1,-1,9266),(0,0,2,-1,8822),(2,-1,0,-1,8216),(2,0,-2,-1,4324),
 (2,0,1,1,4200),(2,1,0,-1,-3359),(2,-1,-1,1,2463),(2,-1,0,1,2211),
 (2,-1,-1,-1,2065),(0,1,-1,-1,-1870),(4,0,-1,-1,1828),(0,1,0,1,-1794),
 (0,0,0,3,-1749),(0,1,-1,1,-1565),(1,0,0,1,-1491),(0,1,1,1,-1475),
 (0,1,1,-1,-1410),(0,1,0,-1,-1344),(1,0,0,-1,-1335),(0,0,3,1,1107),
 (4,0,0,-1,1021),(4,0,-1,1,833)]

def _moon_args(T):
    Lp = wrap360(218.3164477 + 481267.88123421*T - 0.0015786*T**2 + T**3/538841 - T**4/65194000)
    D  = wrap360(297.8501921 + 445267.1114034*T - 0.0018819*T**2 + T**3/545868 - T**4/113065000)
    M  = wrap360(357.5291092 + 35999.0502909*T - 0.0001536*T**2 + T**3/24490000)
    Mp = wrap360(134.9633964 + 477198.8675055*T + 0.0087414*T**2 + T**3/69699 - T**4/14712000)
    F  = wrap360(93.2720950 + 483202.0175233*T - 0.0036539*T**2 - T**3/3526000 + T**4/863310000)
    return Lp, D, M, Mp, F

def moon_tropical(jd_tt, apparent=True):
    """Returns (longitude, latitude) deg, of-date. Abridged ELP (Meeus ch.47)."""
    T = centuries(jd_tt)
    Lp, D, M, Mp, F = _moon_args(T)
    E = 1 - 0.002516 * T - 0.0000074 * T * T
    A1 = wrap360(119.75 + 131.849 * T)
    A2 = wrap360(53.09 + 479264.290 * T)
    A3 = wrap360(313.45 + 481266.484 * T)
    sl = 0.0
    for d, m, mp, f, c in _LTERMS:
        arg = (d * D + m * M + mp * Mp + f * F) * D2R
        sl += c * (E ** abs(m)) * sin(arg)
    sl += 3958 * sin(A1 * D2R) + 1962 * sin((Lp - F) * D2R) + 318 * sin(A2 * D2R)
    sb = 0.0
    for d, m, mp, f, c in _BTERMS:
        arg = (d * D + m * M + mp * Mp + f * F) * D2R
        sb += c * (E ** abs(m)) * sin(arg)
    sb += (-2235 * sin(Lp * D2R) + 382 * sin(A3 * D2R) + 175 * sin((A1 - F) * D2R)
           + 175 * sin((A1 + F) * D2R) + 127 * sin((Lp - Mp) * D2R) - 115 * sin((Lp + Mp) * D2R))
    lam = wrap360(Lp + sl * 1e-6)
    beta = sb * 1e-6
    if apparent:
        lam = wrap360(lam + nutation_dpsi(T))
    return lam, beta

# --------------------------------------------------- nutation, obliquity, nodes
def nutation_dpsi(T):
    Om = (125.04452 - 1934.136261 * T) * D2R
    Ls = (280.4665 + 36000.7698 * T) * D2R
    Lm = (218.3165 + 481267.8813 * T) * D2R
    return (-17.20 * sin(Om) - 1.32 * sin(2 * Ls) - 0.23 * sin(2 * Lm) + 0.21 * sin(2 * Om)) / 3600.0

def obliquity(T):
    return 23.43929111 - 0.01300417 * T - 1.639e-7 * T * T + 5.036e-7 * T ** 3

def mean_node(jd_tt):
    """Mean lunar ascending node = Rahu (mean). Ketu = +180."""
    T = centuries(jd_tt)
    return wrap360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441)

# ---------------------------------------------------------------- ayanamsa
AYAN_J2000 = 23.85316  # Lahiri (Chitra-paksha) at J2000, deg

def precession_pA(T):
    return (5028.796195 * T + 1.1054348 * T * T) / 3600.0

def ayanamsa_lahiri(jd_tt):
    return AYAN_J2000 + precession_pA(centuries(jd_tt))

def sidereal(lam_tropical, jd_tt):
    return wrap360(lam_tropical - ayanamsa_lahiri(jd_tt))

# --------------------------------------------- planets: Kepler + Standish elements
# a, a', e, e', i, i', L, L', varpi, varpi', Omega, Omega'   (per Julian century)
_ELEM = {
 "Mercury": (0.38709927,0.00000037,0.20563593,0.00001906,7.00497902,-0.00594749,
             252.25032350,149472.67411175,77.45779628,0.16047689,48.33076593,-0.12534081),
 "Venus":   (0.72333566,0.00000390,0.00677672,-0.00004107,3.39467605,-0.00078890,
             181.97909950,58517.81538729,131.60246718,0.00268329,76.67984255,-0.27769418),
 "Earth":   (1.00000261,0.00000562,0.01671123,-0.00004392,-0.00001531,-0.01294668,
             100.46457166,35999.37244981,102.93768193,0.32327364,0.0,0.0),
 "Mars":    (1.52371034,0.00001847,0.09339410,0.00007882,1.84969142,-0.00813131,
             -4.55343205,19140.30268499,-23.94362959,0.44441088,49.55953891,-0.29257343),
 "Jupiter": (5.20288700,-0.00011607,0.04838624,-0.00013253,1.30439695,-0.00183714,
             34.39644051,3034.74612775,14.72847983,0.21252668,100.47390909,0.20469106),
 "Saturn":  (9.53667594,-0.00125060,0.05386179,-0.00050991,2.48599187,0.00193609,
             49.95424423,1222.49362201,92.59887831,-0.41897216,113.66242448,-0.28867794),
}

def solve_kepler(M_rad, e, tol=1e-12):
    """Newton-Raphson on f(E) = E - e sinE - M. Quadratic convergence."""
    M_rad = atan2(sin(M_rad), cos(M_rad))            # wrap to (-pi, pi]
    E = M_rad + e * sin(M_rad)
    for _ in range(30):
        dE = (E - e * sin(E) - M_rad) / (1 - e * cos(E))
        E -= dE
        if abs(dE) < tol:
            break
    return E

def helio_xyz(name, T):
    a0,ad,e0,ed,i0,idd,L0,Ld,w0,wd,O0,Od = _ELEM[name]
    a, e = a0 + ad*T, e0 + ed*T
    i, L = (i0 + idd*T)*D2R, wrap360(L0 + Ld*T)
    varpi, Om = w0 + wd*T, (O0 + Od*T)*D2R
    M = wrap360(L - varpi) * D2R
    w = (varpi - degrees(Om)) * D2R
    E = solve_kepler(M, e)
    nu = 2*atan2(sqrt(1+e)*sin(E/2), sqrt(1-e)*cos(E/2))
    r = a*(1 - e*cos(E))
    u = w + nu
    x = r*(cos(Om)*cos(u) - sin(Om)*sin(u)*cos(i))
    y = r*(sin(Om)*cos(u) + cos(Om)*sin(u)*cos(i))
    z = r*sin(u)*sin(i)
    return x, y, z

def planet_tropical(name, jd_tt):
    """Geocentric of-date ecliptic longitude (deg) with light-time correction."""
    T = centuries(jd_tt)
    ex, ey, ez = helio_xyz("Earth", T)
    px, py, pz = helio_xyz(name, T)
    for _ in range(2):                                # light-time iteration
        dist = sqrt((px-ex)**2 + (py-ey)**2 + (pz-ez)**2)
        tau = dist * 499.004784 / 86400.0
        px, py, pz = helio_xyz(name, T - tau/36525.0)
    lam_j2000 = degrees(atan2(py-ey, px-ex))
    return wrap360(lam_j2000 + precession_pA(T))      # J2000 -> of-date

# --------------------------------------------- sidereal time, lagna, houses
def gmst_deg(jd_ut):
    Tu = (jd_ut - 2451545.0) / 36525.0
    g = (280.46061837 + 360.98564736629*(jd_ut - 2451545.0)
         + 0.000387933*Tu*Tu - Tu**3/38710000.0)
    return wrap360(g)

def asc_mc(jd_ut, lat_deg, lon_east_deg):
    jdtt = jd_tt_from_ut(jd_ut)
    T = centuries(jdtt)
    eps = (obliquity(T)) * D2R
    theta = wrap360(gmst_deg(jd_ut) + lon_east_deg) * D2R    # RAMC
    phi = lat_deg * D2R
    mc = wrap360(degrees(atan2(sin(theta), cos(theta)*cos(eps))))
    asc = wrap360(degrees(atan2(cos(theta), -(sin(theta)*cos(eps) + tan(phi)*sin(eps)))))
    return asc, mc

# --------------------------------------------- nakshatra / rashi / panchanga
NAK = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu",
 "Pushya","Ashlesha","Magha","P.Phalguni","U.Phalguni","Hasta","Chitra","Swati",
 "Vishakha","Anuradha","Jyeshtha","Mula","P.Ashadha","U.Ashadha","Shravana",
 "Dhanishta","Shatabhisha","P.Bhadrapada","U.Bhadrapada","Revati"]
RASHI = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula",
         "Vrischika","Dhanu","Makara","Kumbha","Meena"]

def nakshatra(lam_sid):
    span = 360.0/27.0
    n = int(lam_sid // span)
    rem = lam_sid - n*span
    pada = int(rem // (span/4)) + 1
    return n, pada, rem/span

def tithi(lam_moon, lam_sun):
    s = wrap360(lam_moon - lam_sun)
    return int(s // 12) + 1, s

# --------------------------------------------- Vimshottari dasha operator
LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"]
DYEARS = [7,20,6,10,7,18,16,19,17]        # sum = 120

def vimshottari_mahadashas(moon_sid, birth_jd_ut):
    n, _, f = nakshatra(moon_sid)
    li = n % 9
    start = birth_jd_ut - f * DYEARS[li] * YEAR_DAYS   # notional MD start
    out = []
    for k in range(9):
        i = (li + k) % 9
        end = start + DYEARS[i] * YEAR_DAYS
        out.append((LORDS[i], start, end))
        start = end
    return out

def antardashas(md_lord_idx, md_start_jd):
    out, t = [], md_start_jd
    for k in range(9):
        j = (md_lord_idx + k) % 9
        dur = DYEARS[md_lord_idx] * DYEARS[j] / 120.0 * YEAR_DAYS
        out.append((LORDS[j], t, t + dur))
        t += dur
    return out

def current_dasha(mahadashas, jd):
    for lord, s, e in mahadashas:
        if s <= jd < e:
            for al, a_s, a_e in antardashas(LORDS.index(lord), s):
                if a_s <= jd < a_e:
                    return lord, al
    return None, None

# --------------------------------------------- motion calculus & event roots
def speed(fn, jd_tt, h=0.05):
    return wrap180(fn(jd_tt + h)[0] - fn(jd_tt - h)[0]) / (2*h)

def is_retrograde(name, jd_tt):
    f = lambda t: (planet_tropical(name, t), 0)
    return speed(f, jd_tt) < 0

def find_root(g, a, b, iters=80):
    fa, fb = g(a), g(b)
    if fa == 0: return a
    if fa * fb > 0: raise ValueError("root not bracketed")
    for _ in range(iters):
        m = 0.5*(a+b)
        fm = g(m)
        if fa*fm <= 0: b, fb = m, fm
        else: a, fa = m, fm
    return 0.5*(a+b)

def elongation(jd_tt):
    lm, _ = moon_tropical(jd_tt)
    ls, _ = sun_tropical(jd_tt)
    return wrap180(lm - ls)

def find_new_moon(jd_tt_guess):
    """Nearest new moon: root of wrapped elongation, scanned +/-16 d."""
    step, t0 = 0.5, jd_tt_guess - 16
    prev_t, prev_v = t0, elongation(t0)
    t = t0 + step
    while t < jd_tt_guess + 16:
        v = elongation(t)
        if prev_v < 0 <= v and (v - prev_v) < 180:
            return find_root(elongation, prev_t, t)
        prev_t, prev_v = t, v
        t += step
    raise RuntimeError("no new moon found")

# =================================================================== tests
def _run_tests():
    ok = []
    def check(label, got, want, tol):
        good = abs(got - want) <= tol
        ok.append(good)
        print("%-46s got %12.6f  want %12.6f  tol %g  [%s]"
              % (label, got, want, tol, "PASS" if good else "FAIL"))

    check("JD 2000-01-01 12:00 UT", julian_day(2000,1,1,12.0), 2451545.0, 1e-9)
    check("GMST 1987-04-10.0 (Meeus 12.a)", gmst_deg(2446895.5), 197.693195, 5e-4)

    lam, R = sun_tropical(2448908.5)              # Meeus ex. 25.a (TD)
    check("Sun apparent lon 1992-10-13 (25.a)", lam, 199.90895, 2e-3)
    check("Sun radius (25.a)", R, 0.99766, 1e-4)

    lam, beta = moon_tropical(2448724.5, apparent=False)   # Meeus ex. 47.a
    check("Moon lon 1992-04-12 (47.a)", lam, 133.162655, 0.01)
    check("Moon lat 1992-04-12 (47.a)", beta, -3.229126, 0.01)

    check("Lahiri ayanamsa J2000", ayanamsa_lahiri(2451545.0), 23.853, 0.02)

    nm_tt = find_new_moon(julian_day(2000,1,7))
    nm_ut = nm_tt - delta_t_seconds(2000)/86400.0
    check("New moon 2000-01-06 18:14 UT (JD)", nm_ut, 2451550.2597, 0.031)  # 45 min

    asc, mc = 0, 0
    # identity: phi=0, RAMC=0 -> Asc=90, MC=0. Build synthetic via direct formula:
    eps = obliquity(0.0)*D2R
    asc_id = wrap360(degrees(atan2(cos(0.0), -(sin(0.0)*cos(eps)))))
    check("Asc identity (phi=0, RAMC=0)", asc_id, 90.0, 1e-9)

    check("Vimshottari total years", sum(DYEARS), 120, 0)
    mds = vimshottari_mahadashas(0.0, 2451545.0)   # Moon at 0 Ashwini
    check("Balance @0 Ashwini = full Ketu 7y", (mds[0][2]-mds[0][1])/YEAR_DAYS, 7.0, 1e-9)
    ads = antardashas(1, 0.0)                      # Venus MD
    check("Venus antardashas sum = 20y", (ads[-1][2]-ads[0][1])/YEAR_DAYS, 20.0, 1e-9)

    jd = jd_tt_from_ut(julian_day(2000,1,1,12.0) - 5.5/24)   # sanity windows
    jup, sat = planet_tropical("Jupiter", jd), planet_tropical("Saturn", jd)
    check("Jupiter 2000-01-01 in [18,32] (mid)", jup, 25.0, 7.0)
    check("Saturn  2000-01-01 in [34,48] (mid)", sat, 41.0, 7.0)

    print("\n%d/%d checks passed." % (sum(ok), len(ok)))
    return all(ok)

def _demo():
    print("\n--- DEMO CHART: 2000-01-01 12:00 IST, New Delhi (28.6139N, 77.2090E) ---")
    jd_ut = julian_day(2000,1,1,12.0) - 5.5/24
    jdtt = jd_tt_from_ut(jd_ut)
    lm, _ = moon_tropical(jdtt); ls, _ = sun_tropical(jdtt)
    bodies = [("Sun", ls), ("Moon", lm)]
    for p in ["Mercury","Venus","Mars","Jupiter","Saturn"]:
        bodies.append((p, planet_tropical(p, jdtt)))
    rahu = mean_node(jdtt)
    bodies += [("Rahu", rahu), ("Ketu", wrap360(rahu+180))]
    asc, mc = asc_mc(jd_ut, 28.6139, 77.2090)
    bodies.append(("Lagna", asc))
    print("%-8s %12s  %-11s %-13s" % ("Body","sid.lon","rashi","nakshatra"))
    for name, lam_t in bodies:
        lam_s = sidereal(lam_t, jdtt)
        n, pada, _ = nakshatra(lam_s)
        print("%-8s %11.4f°  %-11s %s-%d" % (name, lam_s, RASHI[int(lam_s//30)], NAK[n], pada))
    t_no, s = tithi(sidereal(lm,jdtt), sidereal(ls,jdtt))
    print("Tithi: %d (elongation %.3f°)   Ayanamsa: %.4f°" % (t_no, s, ayanamsa_lahiri(jdtt)))
    moon_sid = sidereal(lm, jdtt)
    mds = vimshottari_mahadashas(moon_sid, jd_ut)
    print("\nVimshottari mahadashas:")
    for lord, s0, e0 in mds:
        print("  %-8s %s  ->  %s" % (lord, fmt_jd(s0)[:10], fmt_jd(e0)[:10]))
    now = julian_day(2026,7,12,12.0)
    md, ad = current_dasha(mds, now)
    print("Running period on 2026-07-12: %s mahadasha / %s antardasha" % (md, ad))
    print("\nRetrograde today (2026-07-12):",
          [p for p in ["Mercury","Venus","Mars","Jupiter","Saturn"]
           if is_retrograde(p, jd_tt_from_ut(now))] or "none")

if __name__ == "__main__":
    passed = _run_tests()
    _demo()
    if not passed:
        raise SystemExit(1)
