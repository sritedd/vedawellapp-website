/**
 * High-precision astronomical calculator using simplified VSOP87 theory.
 * Ported from VedaWell Android app.
 * Accuracy: ~1 arcminute for Sun, ~5 arcminutes for Moon
 */
const AstronomicalCalculator = {
    // Constants
    J2000: 2451545.0,  // Julian Day for J2000.0 epoch
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI,

    /**
     * Convert Gregorian date to Julian Day Number.
     * Valid for dates after October 15, 1582.
     */
    toJulianDay(year, month, day, hour = 12, minute = 0, second = 0) {
        let y = year;
        let m = month;
        const d = day + hour / 24 + minute / 1440 + second / 86400;

        if (m <= 2) {
            y -= 1;
            m += 12;
        }

        const a = Math.floor(y / 100);
        const b = 2 - a + Math.floor(a / 4);

        return Math.floor(365.25 * (y + 4716)) +
            Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
    },

    /**
     * Convert Julian Day to Gregorian date.
     */
    fromJulianDay(jd) {
        const z = Math.floor(jd + 0.5);
        const f = jd + 0.5 - z;

        let a;
        if (z < 2299161) {
            a = z;
        } else {
            const alpha = Math.floor((z - 1867216.25) / 36524.25);
            a = z + 1 + alpha - Math.floor(alpha / 4);
        }

        const b = a + 1524;
        const c = Math.floor((b - 122.1) / 365.25);
        const d = Math.floor(365.25 * c);
        const e = Math.floor((b - d) / 30.6001);

        const day = b - d - Math.floor(30.6001 * e) + f;
        const month = e < 14 ? e - 1 : e - 13;
        const year = month > 2 ? c - 4716 : c - 4715;

        return { year, month, day: Math.floor(day) };
    },

    /**
     * Convert Julian Day to centuries since J2000.0.
     */
    julianCentury(jd) {
        return (jd - this.J2000) / 36525.0;
    },

    /**
     * Calculate Sun's ecliptic longitude using simplified VSOP87.
     * @returns Longitude in degrees (0-360)
     */
    getSunLongitude(jd) {
        const t = this.julianCentury(jd);

        // Mean longitude of the Sun
        const l0 = this.normalizeAngle(280.46646 + 36000.76983 * t + 0.0003032 * t * t);

        // Mean anomaly of the Sun
        const m = this.normalizeAngle(357.52911 + 35999.05029 * t - 0.0001537 * t * t);
        const mRad = m * this.DEG_TO_RAD;

        // Equation of center
        const c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(mRad) +
            (0.019993 - 0.000101 * t) * Math.sin(2 * mRad) +
            0.000289 * Math.sin(3 * mRad);

        // Sun's true longitude
        const sunLon = this.normalizeAngle(l0 + c);

        // Apparent longitude (correcting for nutation and aberration)
        const omega = 125.04 - 1934.136 * t;
        const apparent = sunLon - 0.00569 - 0.00478 * Math.sin(omega * this.DEG_TO_RAD);

        return this.normalizeAngle(apparent);
    },

    /**
     * Calculate Moon's ecliptic longitude.
     * Based on Meeus "Astronomical Algorithms" Chapter 47.
     * @returns Longitude in degrees (0-360)
     */
    getMoonLongitude(jd) {
        const t = this.julianCentury(jd);

        // Moon's mean longitude
        const lPrime = this.normalizeAngle(
            218.3164477 + 481267.88123421 * t - 0.0015786 * t * t +
            t * t * t / 538841 - t * t * t * t / 65194000
        );

        // Moon's mean anomaly
        const m = this.normalizeAngle(
            134.9633964 + 477198.8675055 * t + 0.0087414 * t * t +
            t * t * t / 69699 - t * t * t * t / 14712000
        );

        // Sun's mean anomaly
        const mPrime = this.normalizeAngle(
            357.5291092 + 35999.0502909 * t - 0.0001536 * t * t +
            t * t * t / 24490000
        );

        // Moon's argument of latitude
        const f = this.normalizeAngle(
            93.2720950 + 483202.0175233 * t - 0.0036539 * t * t -
            t * t * t / 3526000 + t * t * t * t / 863310000
        );

        // Mean elongation of Moon from Sun
        const d = this.normalizeAngle(
            297.8501921 + 445267.1114034 * t - 0.0018819 * t * t +
            t * t * t / 545868 - t * t * t * t / 113065000
        );

        // Convert to radians
        const mRad = m * this.DEG_TO_RAD;
        const mPrimeRad = mPrime * this.DEG_TO_RAD;
        const fRad = f * this.DEG_TO_RAD;
        const dRad = d * this.DEG_TO_RAD;

        // Sum of periodic terms (major terms)
        let sumL = 0;
        sumL += 6288774 * Math.sin(mRad);
        sumL += 1274027 * Math.sin(2 * dRad - mRad);
        sumL += 658314 * Math.sin(2 * dRad);
        sumL += 213618 * Math.sin(2 * mRad);
        sumL -= 185116 * Math.sin(mPrimeRad);
        sumL -= 114332 * Math.sin(2 * fRad);
        sumL += 58793 * Math.sin(2 * dRad - 2 * mRad);
        sumL += 57066 * Math.sin(2 * dRad - mPrimeRad - mRad);
        sumL += 53322 * Math.sin(2 * dRad + mRad);
        sumL += 45758 * Math.sin(2 * dRad - mPrimeRad);
        sumL -= 40923 * Math.sin(mPrimeRad - mRad);
        sumL -= 34720 * Math.sin(dRad);
        sumL -= 30383 * Math.sin(mPrimeRad + mRad);

        // Convert from 0.000001 degrees to degrees and add to mean longitude
        return this.normalizeAngle(lPrime + sumL / 1000000);
    },

    /**
     * Calculate lunar elongation (Moon longitude - Sun longitude).
     * Primary value for Tithi calculation.
     */
    getLunarElongation(jd) {
        const moonLon = this.getMoonLongitude(jd);
        const sunLon = this.getSunLongitude(jd);
        return this.normalizeAngle(moonLon - sunLon);
    },

    /**
     * Normalize angle to 0-360 degrees.
     */
    normalizeAngle(angle) {
        let result = angle % 360;
        if (result < 0) result += 360;
        return result;
    },

    /**
     * Calculate obliquity of the ecliptic.
     */
    getObliquity(jd) {
        const t = this.julianCentury(jd);
        return 23.439291 - 0.0130042 * t - 0.00000016 * t * t + 0.000000504 * t * t * t;
    },

    /**
     * Calculate Moon phase (0-1 where 0=new, 0.5=full)
     */
    getMoonPhase(jd) {
        const elongation = this.getLunarElongation(jd);
        return elongation / 360;
    },

    /**
     * Get Moon phase name
     */
    getMoonPhaseName(phase) {
        if (phase < 0.0625) return { name: 'New Moon (Amavasya)', emoji: '🌑' };
        if (phase < 0.1875) return { name: 'Waxing Crescent (Shukla Paksha)', emoji: '🌒' };
        if (phase < 0.3125) return { name: 'First Quarter (Shukla Paksha)', emoji: '🌓' };
        if (phase < 0.4375) return { name: 'Waxing Gibbous (Shukla Paksha)', emoji: '🌔' };
        if (phase < 0.5625) return { name: 'Full Moon (Purnima)', emoji: '🌕' };
        if (phase < 0.6875) return { name: 'Waning Gibbous (Krishna Paksha)', emoji: '🌖' };
        if (phase < 0.8125) return { name: 'Last Quarter (Krishna Paksha)', emoji: '🌗' };
        if (phase < 0.9375) return { name: 'Waning Crescent (Krishna Paksha)', emoji: '🌘' };
        return { name: 'New Moon (Amavasya)', emoji: '🌑' };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AstronomicalCalculator;
}
