/**
 * Sunrise/Sunset calculator using NOAA Solar Calculator algorithm.
 * Provides accurate sun times for any location on Earth.
 */
const SunTimesCalculator = {
    /**
     * Calculate sunrise time for a given date and location.
     * @param {Date} date - The date
     * @param {number} latitude - Latitude in degrees
     * @param {number} longitude - Longitude in degrees
     * @param {number} timezone - Timezone offset in hours (e.g., 5.5 for IST)
     * @returns {Object} { hours, minutes, formatted } in local time
     */
    calculateSunrise(date, latitude, longitude, timezone) {
        return this.calculateSunTime(date, latitude, longitude, timezone, true);
    },

    /**
     * Calculate sunset time for a given date and location.
     */
    calculateSunset(date, latitude, longitude, timezone) {
        return this.calculateSunTime(date, latitude, longitude, timezone, false);
    },

    /**
     * Core sun time calculation using NOAA algorithm
     */
    calculateSunTime(date, latitude, longitude, timezone, isSunrise) {
        const jd = AstronomicalCalculator.toJulianDay(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
        const t = AstronomicalCalculator.julianCentury(jd);

        // Equation of time in minutes
        const eot = this.equationOfTime(t);

        // Solar declination
        const decl = this.sunDeclination(t);

        // Hour angle
        const ha = this.hourAngleSunrise(latitude, decl);

        if (isNaN(ha)) {
            // Sun doesn't rise or set at this location on this date
            return null;
        }

        // Solar noon in minutes from midnight UTC
        const solarNoon = 720 - 4 * longitude - eot;

        let timeUTC;
        if (isSunrise) {
            timeUTC = solarNoon - 4 * ha;
        } else {
            timeUTC = solarNoon + 4 * ha;
        }

        // Convert to local time
        const localTime = timeUTC + timezone * 60;

        // Handle day overflow
        let adjustedTime = localTime;
        if (adjustedTime < 0) adjustedTime += 1440;
        if (adjustedTime >= 1440) adjustedTime -= 1440;

        const hours = Math.floor(adjustedTime / 60);
        const minutes = Math.floor(adjustedTime % 60);

        return {
            hours,
            minutes,
            formatted: this.formatTime(hours, minutes),
            totalMinutes: adjustedTime
        };
    },

    /**
     * Equation of Time in minutes
     */
    equationOfTime(t) {
        const epsilon = AstronomicalCalculator.getObliquity(
            AstronomicalCalculator.J2000 + t * 36525
        ) * AstronomicalCalculator.DEG_TO_RAD;

        const l0 = (280.46646 + 36000.76983 * t) * AstronomicalCalculator.DEG_TO_RAD;
        const e = 0.016708634 - 0.000042037 * t;
        const m = (357.52911 + 35999.05029 * t) * AstronomicalCalculator.DEG_TO_RAD;

        let y = Math.tan(epsilon / 2);
        y *= y;

        const sin2l0 = Math.sin(2 * l0);
        const sinm = Math.sin(m);
        const cos2l0 = Math.cos(2 * l0);
        const sin4l0 = Math.sin(4 * l0);
        const sin2m = Math.sin(2 * m);

        const eot = y * sin2l0 - 2 * e * sinm + 4 * e * y * sinm * cos2l0
            - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;

        return eot * AstronomicalCalculator.RAD_TO_DEG * 4; // Convert to minutes
    },

    /**
     * Sun declination in degrees
     */
    sunDeclination(t) {
        const epsilon = AstronomicalCalculator.getObliquity(
            AstronomicalCalculator.J2000 + t * 36525
        );
        const lambda = AstronomicalCalculator.getSunLongitude(
            AstronomicalCalculator.J2000 + t * 36525
        );

        const sinDecl = Math.sin(epsilon * AstronomicalCalculator.DEG_TO_RAD) *
            Math.sin(lambda * AstronomicalCalculator.DEG_TO_RAD);

        return Math.asin(sinDecl) * AstronomicalCalculator.RAD_TO_DEG;
    },

    /**
     * Hour angle of sunrise/sunset in degrees
     */
    hourAngleSunrise(latitude, declination) {
        const latRad = latitude * AstronomicalCalculator.DEG_TO_RAD;
        const declRad = declination * AstronomicalCalculator.DEG_TO_RAD;

        // Standard refraction correction (-0.833 degrees)
        const zenith = 90.833 * AstronomicalCalculator.DEG_TO_RAD;

        const cosHA = (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(declRad)))
            - Math.tan(latRad) * Math.tan(declRad);

        if (cosHA > 1 || cosHA < -1) {
            return NaN; // Sun doesn't rise or set
        }

        return Math.acos(cosHA) * AstronomicalCalculator.RAD_TO_DEG;
    },

    /**
     * Calculate solar noon
     */
    calculateSolarNoon(date, longitude, timezone) {
        const jd = AstronomicalCalculator.toJulianDay(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
        const t = AstronomicalCalculator.julianCentury(jd);

        const eot = this.equationOfTime(t);
        const solarNoon = 720 - 4 * longitude - eot + timezone * 60;

        const hours = Math.floor(solarNoon / 60);
        const minutes = Math.floor(solarNoon % 60);

        return {
            hours,
            minutes,
            formatted: this.formatTime(hours, minutes)
        };
    },

    /**
     * Format time as HH:MM AM/PM
     */
    formatTime(hours, minutes) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
    },

    /**
     * Calculate day length in hours
     */
    getDayLength(date, latitude, longitude, timezone) {
        const sunrise = this.calculateSunrise(date, latitude, longitude, timezone);
        const sunset = this.calculateSunset(date, latitude, longitude, timezone);

        if (!sunrise || !sunset) return null;

        let length = sunset.totalMinutes - sunrise.totalMinutes;
        if (length < 0) length += 1440;

        return {
            hours: Math.floor(length / 60),
            minutes: Math.floor(length % 60),
            totalMinutes: length
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SunTimesCalculator;
}
