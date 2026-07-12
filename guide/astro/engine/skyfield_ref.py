"""Dump JPL DE421 apparent geocentric ecliptic-of-date longitudes (1900-2050 grid)
plus reference sunrises, for cross-validation of the JS jyotish engine."""
import json, os
from skyfield.api import load, wgs84
from skyfield.framelib import ecliptic_frame
from skyfield import almanac

os.chdir(os.path.dirname(os.path.abspath(__file__)))
ts = load.timescale()
eph = load("de421.bsp")
earth = eph["earth"]

TARGETS = {
    "Sun": "sun", "Moon": "moon", "Mercury": "mercury", "Venus": "venus",
    "Mars": "mars", "Jupiter": "jupiter barycenter", "Saturn": "saturn barycenter",
}

# 1900.5 .. 2050, 1200 epochs (~46 d apart) — dense enough to catch
# conjunction/opposition geometry where truncation errors amplify
grid = [2415203.0 + k * (54787.0 / 1199.0) for k in range(1200)]

out = {"grid": []}
for jd in grid:
    t = ts.tt_jd(jd)
    row = {"jd_tt": jd}
    for name, key in TARGETS.items():
        app = earth.at(t).observe(eph[key]).apparent()
        lat, lon, dist = app.frame_latlon(ecliptic_frame)
        row[name] = lon.degrees % 360.0
    out["grid"].append(row)

# Reference sunrises (UT) for known charts
places = [
    ("delhi_2000_01_01", 28.6139, 77.2090, 2000, 1, 1, 5.5),
    ("sydney_1990_05_15", -33.8688, 151.2093, 1990, 5, 15, 10.0),
    ("london_1975_11_03", 51.5074, -0.1278, 1975, 11, 3, 0.0),
    ("newyork_2024_06_21", 40.7128, -74.0060, 2024, 6, 21, -4.0),
]
out["sunrise"] = {}
for key, lat, lon, y, m, d, tz in places:
    loc = wgs84.latlon(lat, lon)
    t0 = ts.ut1_jd(2451544.5 + (ts.utc(y, m, d).tt - 2451544.5))  # midnight UTC of date
    t0 = ts.utc(y, m, d) - tz / 24.0   # local midnight as skyfield Time
    t1 = t0 + 1.0
    f = almanac.sunrise_sunset(eph, loc)
    times, events = almanac.find_discrete(t0, t1, f)
    rise = next((tt for tt, ev in zip(times, events) if ev == 1), None)
    sett = next((tt for tt, ev in zip(times, events) if ev == 0), None)
    out["sunrise"][key] = {
        "rise_jd_ut": rise.ut1 if rise is not None else None,
        "set_jd_ut": sett.ut1 if sett is not None else None,
    }

with open("jpl_ref.json", "w") as f:
    json.dump(out, f)
print("wrote jpl_ref.json:", len(out["grid"]), "epochs,", len(out["sunrise"]), "sunrise cases")
