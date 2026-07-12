"""Cross-validate jyotish_core against Swiss Ephemeris (Moshier mode) 1950-2050."""
import swisseph as swe
from jyotish_core import (moon_tropical, sun_tropical, planet_tropical, mean_node,
                          ayanamsa_lahiri, wrap180, jd_tt_from_ut)

swe.set_ephe_path(None)
FLG = swe.FLG_MOSEPH | swe.FLG_SPEED
IDS = {"Sun":swe.SUN,"Moon":swe.MOON,"Mercury":swe.MERCURY,"Venus":swe.VENUS,
       "Mars":swe.MARS,"Jupiter":swe.JUPITER,"Saturn":swe.SATURN,"Rahu":swe.MEAN_NODE}

def mine(name, jdtt):
    if name == "Sun":  return sun_tropical(jdtt)[0]
    if name == "Moon": return moon_tropical(jdtt)[0]
    if name == "Rahu": return mean_node(jdtt)
    return planet_tropical(name, jdtt)

grid = [2433282.5 + k*(36525.0/40) for k in range(41)]   # 1950..2050, ~2.5y steps
print("Max |error| vs Swiss Ephemeris over 1950-2050 (41 epochs):")
for name, pid in IDS.items():
    worst = max(abs(wrap180(mine(name, jd) - swe.calc(jd, pid, FLG)[0][0])) for jd in grid)
    unit = worst*3600
    print("  %-8s %10.5f deg  (%8.1f arcsec)" % (name, worst, unit))

# ayanamsa check vs exact Lahiri
swe.set_sid_mode(swe.SIDM_LAHIRI)
worst = max(abs(ayanamsa_lahiri(jd) - swe.get_ayanamsa(jd)) for jd in grid)
print("  %-8s %10.5f deg  (%8.1f arcsec)" % ("Ayanamsa", worst, worst*3600))
