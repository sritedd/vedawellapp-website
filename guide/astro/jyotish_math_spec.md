# Jyotish Computation Engine — Mathematical Specification (v1)

Goal: replace table-lookup + linear arithmetic with a first-principles engine. Every quantity in a Vedic chart (graha longitudes, lagna, nakshatra, tithi, dashas, transits, retrogrades) is derived from celestial mechanics: transcendental equations solved numerically, truncated Fourier/Poisson series from perturbation theory, spherical trigonometry, polynomial precession models, and root-finding/derivatives for event timing.

Scope note: this math guarantees astronomical accuracy and exact traditional quantities. It does not, and cannot, establish the predictive validity of interpretation — that layer belongs to the tradition, not the equations.

Pipeline:

birth data → time scales (§1) → tropical geocentric longitudes (§2–§4) → ayanamsa → sidereal longitudes (§5) → lagna & houses (§6) → nakshatra/rashi/panchanga (§7–§8) → Vimshottari dasha operator (§9) → motion calculus: retrogrades, transits, event times (§10) → strength functionals (§11).

---

## 1. Time scales

**Julian Day (Meeus).** For calendar date Y-M-D with universal time expressed as fractional day d:

If M ≤ 2: Y ← Y−1, M ← M+12. Let A = ⌊Y/100⌋, B = 2 − A + ⌊A/4⌋ (Gregorian).

JD = ⌊365.25(Y + 4716)⌋ + ⌊30.6001(M + 1)⌋ + d + B − 1524.5

**ΔT (Terrestrial Time − Universal Time).** Ephemeris formulas need uniform time TT; clocks give UT. Espenak–Meeus piecewise polynomials, with t = y − 2000:

- 1986–2005: ΔT = 63.86 + 0.3345t − 0.060374t² + 0.0017275t³ + 0.000651814t⁴ + 0.00002373599t⁵
- 2005–2050: ΔT = 62.92 + 0.32217t + 0.005589t²

JD_TT = JD_UT + ΔT/86400.

**Julian centuries from J2000.0:** T = (JD_TT − 2451545.0)/36525. All series below are functions of T.

---

## 2. Planetary positions — the core mechanics

The exact problem is the N-body system of ODEs

**r̈ᵢ = G Σ_{j≠i} mⱼ (rⱼ − rᵢ)/|rⱼ − rᵢ|³**

Three solution tiers, in increasing accuracy:

**Tier A (v1, implemented): osculating Keplerian elements + Kepler's equation.**
Each planet's elements (a, e, i, L, ϖ, Ω) are linear polynomials in T (JPL/Standish 1800–2050 fit). Then:

1. Mean anomaly M = L − ϖ, argument of perihelion ω = ϖ − Ω.
2. **Kepler's equation** (transcendental): M = E − e·sin E. Solve by Newton–Raphson:

   E_{n+1} = E_n − (E_n − e sin E_n − M)/(1 − e cos E_n),  E₀ = M + e sin M

   Since f′(E) = 1 − e cos E ≥ 1 − e > 0, the iteration converges quadratically; 4–6 iterations reach 1e−12 rad.
3. True anomaly and radius:

   ν = 2·atan2(√(1+e)·sin(E/2), √(1−e)·cos(E/2)),  r = a(1 − e cos E)
4. Heliocentric ecliptic (J2000) vector, with u = ω + ν:

   x = r(cos Ω cos u − sin Ω sin u cos i)
   y = r(sin Ω cos u + cos Ω sin u cos i)
   z = r sin u sin i
5. Geocentric vector: **ρ = r_planet − r_earth**; λ = atan2(ρy, ρx), β = atan2(ρz, √(ρx²+ρy²)).
6. **Light-time correction:** τ = |ρ|·(499.005 s)/86400; recompute the planet at T − τ/36525 (one iteration suffices).
7. Precess J2000 → of-date: λ_date = λ_J2000 + p_A(T), with general precession in longitude

   p_A(T) = (5028.796195·T + 1.1054348·T²)/3600 degrees.

Accuracy: ~1′–10′ (worst for Saturn). Sufficient for rashi/nakshatra/dasha work; see Tier B for production.

**Tier B (build phase): VSOP87 truncated Poisson series.** Perturbation theory writes each coordinate as

L(T) = Σₖ Tᵏ Σₙ Aₖₙ cos(Bₖₙ + Cₖₙ T)

i.e., a Fourier-type expansion of the N-body solution; thousands of terms give ≪1″. Swiss Ephemeris (pyswisseph, Moshier mode) implements this with no data files and is the drop-in production backend.

**Tier C (research): direct numerical integration** of the ODEs above with RK4 or a symplectic integrator (leapfrog/Wisdom–Holman), initialized from JPL state vectors. This is the "pure calculus" route and validates the series.

---

## 3. Sun (of-date, Meeus ch. 25)

L₀ = 280.46646 + 36000.76983·T + 0.0003032·T²
M = 357.52911 + 35999.05029·T − 0.0001537·T²

Equation of center (the closed-form series solution of Kepler's equation expanded in e):

C = (1.914602 − 0.004817T − 0.000014T²) sin M + (0.019993 − 0.000101T) sin 2M + 0.000289 sin 3M

True longitude Θ = L₀ + C. Radius R = 1.000001018(1 − e²)/(1 + e cos ν), e = 0.016708634 − 0.000042037T, ν = M + C.

Apparent (nutation + aberration): λ_⊙ = Θ − 0.00569° − 0.00478°·sin Ω, with Ω = 125.04 − 1934.136T.

---

## 4. Moon (of-date, abridged ELP/Meeus ch. 47) and nodes

Fundamental arguments (degrees):

L′ = 218.3164477 + 481267.88123421T − 0.0015786T² + T³/538841 − T⁴/65194000
D  = 297.8501921 + 445267.1114034T − 0.0018819T² + T³/545868 − T⁴/113065000
M  = 357.5291092 + 35999.0502909T − 0.0001536T² + T³/24490000
M′ = 134.9633964 + 477198.8675055T + 0.0087414T² + T³/69699 − T⁴/14712000
F  = 93.2720950 + 483202.0175233T − 0.0036539T² − T³/3526000 + T⁴/863310000

Longitude: λ = L′ + 10⁻⁶·Σᵢ aᵢ·E^{|mᵢ|}·sin(dᵢD + mᵢM + m′ᵢM′ + fᵢF) + planetary additives, with eccentricity damping E = 1 − 0.002516T − 0.0000074T². Leading terms (coefficient ×10⁻⁶ deg): 6288774·sin M′, 1274027·sin(2D−M′), 658314·sin 2D, 213618·sin 2M′, −185116·sin M, −114332·sin 2F, … (~30 terms in v1 ⇒ ~0.3′; full 60-term table or Tier B ⇒ ≪0.1′). Latitude β is the analogous sine series in F-dominant arguments (leading term 5.128122°·sin F).

**Rahu (mean node):** Ω = 125.0445479 − 1934.1362891T + 0.0020754T² + T³/467441. **Ketu = Ω + 180°.** (True node adds periodic corrections; config flag.)

**Topocentric correction (build item):** the Moon's parallax reaches ~1°; for rigorous work shift the geocentric vector by the observer's geocentric position (spherical Earth: Δλ ≈ −π·cos φ′·sin H / cos β, π = asin(6378.14/Δ_km)).

**Nutation & obliquity** (needed for apparent positions and lagna):

ε = 23.43929111° − 0.01300417T − 1.639e−7·T² + 5.036e−7·T³ (+ Δε)
Δψ ≈ (−17.20 sin Ω − 1.32 sin 2L₀ − 0.23 sin 2L′ + 0.21 sin 2Ω)/3600 degrees

---

## 5. Ayanamsa — tropical → sidereal

The sidereal zodiac is the tropical zodiac rotated back by the accumulated precession since the epoch when the two coincided (Lahiri/Chitrā-pakṣa: Spica fixed at 180°).

A(T) = A₂₀₀₀ + p_A(T),  A₂₀₀₀ = 23°51′11″ ≈ 23.85316°, p_A from §2.

**λ_sidereal = (λ_tropical − A) mod 360°.** Every Jyotish quantity below uses sidereal longitudes. (Production: Swiss Ephemeris SIDM_LAHIRI for the committee-exact value; other ayanamsas = different A₂₀₀₀ anchors.)

---

## 6. Lagna (Ascendant), MC, houses — spherical trigonometry

**Greenwich mean sidereal time** (degrees), with T_u from JD_UT:

GMST = 280.46061837 + 360.98564736629·(JD_UT − 2451545.0) + 0.000387933·T_u² − T_u³/38710000

Local sidereal time: LST = GMST + longitude_east. Let θ = RAMC = LST (deg), φ = geographic latitude, ε = true obliquity.

**Midheaven:** λ_MC = atan2(sin θ, cos θ·cos ε)

**Ascendant:** λ_Asc = atan2( cos θ, −(sin θ·cos ε + tan φ·sin ε) )

(both wrapped to [0°,360°), then converted to sidereal by subtracting A). Derivation: intersection of the ecliptic plane with the horizon plane, i.e., solving the spherical triangle formed by equator, ecliptic, horizon.

**Houses.** Whole-sign (default Jyotish): bhava k = rashi(Asc) + k − 1. Equal: cusp_k = Asc + 30(k−1). Sripati/Porphyry: trisect the ecliptic arcs between Asc, IC, Desc, MC. Placidus (optional) requires solving the transcendental semi-arc equation

RA(λ_k) = RAMC + (k/3)·[90° + arcsin(tan φ · tan δ(λ_k))]

by fixed-point iteration — another place where "advanced math" is unavoidable.

## 7. Nakshatra, pada, rashi — exact quantization

One nakshatra = 360/27 = 40/3 degrees; one pada = 10/3 degrees.

n = ⌊λ_sid · 27/360⌋ (0 = Aśvinī),  pada = ⌊(λ_sid mod 40/3)·3/10⌋ + 1,  rashi = ⌊λ_sid/30⌋

Fractional progress through the nakshatra (drives dasha balance): f = (λ_sid mod 40/3)/(40/3) ∈ [0,1).

## 8. Panchanga — angles, not tables

Let s = λ_moon − λ_sun (mod 360), u = λ_moon + λ_sun (mod 360).

tithi = ⌊s/12°⌋ + 1 (1–30); karana = ⌊s/6°⌋; yoga = ⌊u/(40/3)°⌋ + 1; vara from sunrise.

**Event timing is root-finding, not interpolation.** Tithi k ends at the root of g(t) = wrap180(s(t) − 12k). Because ds/dt varies between ~10.8°/day and ~14.4°/day, linear table interpolation errs by hours; Brent/bisection on g gives seconds.

**Sunrise** (needed for vara, hora, dasha day-lengths): solve for hour angle H₀ in

sin h₀ = sin φ sin δ + cos φ cos δ cos H₀,  h₀ = −0.833° (refraction + semidiameter)

⇒ H₀ = arccos[(sin h₀ − sin φ sin δ)/(cos φ cos δ)], iterate once since δ_⊙ changes intraday.

## 9. Vimshottari dasha — a proportional-measure operator

Lord cycle (120 y total): Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17. Lord of nakshatra n is index n mod 9.

Map birth to a point on the 120-year dasha circle: with n, f from §7 and Y_j the year-lengths,

**p₀ = Σ_{j<(n mod 9)} Y_j + f·Y_{n mod 9}** (years elapsed in the cycle)

Balance of first mahādaśā = (1 − f)·Y_{n mod 9}. The timeline is the cycle unrolled from p₀.

**Sub-periods are a self-similar (multiplicative) subdivision.** The period at nesting depth k with lord chain (l₁,…,l_k) — starting from l₁'s own sub-lord and cycling — has duration

**Δt(l₁,…,l_k) = 120 · Π_{i=1..k} (Y_{l_i}/120) = (Y_{l₁}·Y_{l₂}···Y_{l_k}) / 120^{k−1} years**

Antardaśā, pratyantar-, sūkṣma-, prāṇa-daśā are k = 2,3,4,5. Finding the operative chain at time t is a mixed-radix expansion of (t − birth + p₀) mod 120 in the nested Y-weights — computable in O(9k). Year length is a config constant (365.25 d default; 360-day sāvana optional).

## 10. Motion calculus — retrogrades, stations, transits

Velocity: dλ/dt ≈ [λ(t+h) − λ(t−h)]/(2h) (central difference, h = 0.05 d; O(h²) error).

- **Retrograde** ⇔ dλ/dt < 0. **Stations** = roots of dλ/dt (secant/bisection on the derivative).
- **Ingress/transit** (e.g., Saturn enters a rashi): root of wrap180(λ(t) − λ_target); **conjunction** of two grahas: root of wrap180(λ₁ − λ₂). Bracket by daily scan, refine by Brent → sub-second timing.
- **Combustion**: angular separation from Sun via the spherical law of cosines, cos ψ = sin β₁ sin β₂ + cos β₁ cos β₂ cos(λ₁−λ₂), compared to per-planet thresholds.
- Wrapping algebra: all comparisons in ℝ/360ℤ via wrap180(x) = ((x+180) mod 360) − 180.

## 11. Strength functionals (śaḍbala / aṣṭakavarga as math objects)

- **Uccha bala** (exaltation strength): distance from the debilitation point, U(λ) = |wrap180(λ − λ_deb)|/3 virūpas — a piecewise-linear tent map peaking at 60 at exaltation.
- **Cheṣṭā bala**: function of instantaneous speed from §10 normalized against mean motion (retrograde ⇒ maximal) — strength as a functional of dλ/dt.
- **Graha dṛṣṭi (sputa dṛṣṭi)**: aspect strength as a piecewise-linear function of separation θ through the classical nodes (30°,0)→(60°,15)→(90°,45)→(120°,30)→(150°,0)→(180°,60), with Mars/Jupiter/Saturn given full value at their special angles. (Verify node values against BPHS during build.)
- **Aṣṭakavarga**: encode each graha's benefic-point table as a binary matrix B_p ∈ {0,1}^{8×12}; Sarvāṣṭakavarga SAV = Σ_p B_p, transit score of a planet at time t = SAV[·, rashi(λ_sid(t))]. Reduces the whole system to integer linear algebra.

## 12. Numerical methods appendix

Newton–Raphson (quadratic convergence when f′ bounded away from 0 — true for Kepler since 1−e cos E ≥ 1−e); bracketed Brent/bisection for event roots (guaranteed convergence, needed because λ(t) is only piecewise-monotonic); central differences O(h²) for velocities; series truncation error bounded by the sum of omitted amplitudes; RK4 local error O(h⁵) for Tier C; all angle arithmetic done in the quotient group ℝ/360ℤ.

## 13. Validation targets (v1 must pass)

1. JD(2000-01-01 12:00 UT) = 2451545.0 exactly.
2. GMST(1987-04-10.0 UT) = 197.693195° (Meeus ex. 12.a).
3. Sun apparent λ(JDE 2448908.5) = 199.906° ± 0.01 (Meeus ex. 25.a).
4. Moon λ(JDE 2448724.5) = 133.1627° ± 0.05, β = −3.2291° ± 0.02 (Meeus ex. 47.a).
5. New Moon root within ±45 min of 2000-01-06 18:14 UT.
6. Lahiri ayanamsa(J2000) = 23.853° ± 0.02.
7. Vimshottari invariants: ΣY = 120; each mahādaśā's antardaśās sum exactly to it; λ_moon = 0° ⇒ full 7 y Ketu balance.
8. Ascendant identities (φ = 0, θ = 0 ⇒ Asc = 90°; θ = 0 ⇒ MC = 0°).
9. Cross-check every longitude against Swiss Ephemeris (Moshier) over a 1950–2050 grid; report max |error|.

## 14. Build roadmap

Phase 1 (this repo): reference engine per §1–§10, validated. Phase 2: swap Tier A/abridged series for pyswisseph backend (sub-arcsecond, exact Lahiri, true node, topocentric); add sunrise-anchored panchanga and full śaḍbala/aṣṭakavarga modules per §11. Phase 3: event scanners (transit/dasha calendars), divisional charts D-n via λ ↦ (n·λ) mod 360 mappings, API + UI.
