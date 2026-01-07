/**
 * Panchang Engine - Main calculation orchestrator.
 * Combines all astronomical and Vedic calculations into a complete Panchang.
 */
const PanchangEngine = {
    // Default locations
    LOCATIONS: {
        'Mumbai': { lat: 19.0760, lng: 72.8777, tz: 5.5 },
        'Delhi': { lat: 28.6139, lng: 77.2090, tz: 5.5 },
        'Chennai': { lat: 13.0827, lng: 80.2707, tz: 5.5 },
        'Kolkata': { lat: 22.5726, lng: 88.3639, tz: 5.5 },
        'Bangalore': { lat: 12.9716, lng: 77.5946, tz: 5.5 },
        'Hyderabad': { lat: 17.3850, lng: 78.4867, tz: 5.5 },
        'Ahmedabad': { lat: 23.0225, lng: 72.5714, tz: 5.5 },
        'Pune': { lat: 18.5204, lng: 73.8567, tz: 5.5 },
        'Varanasi': { lat: 25.3176, lng: 82.9739, tz: 5.5 },
        'Ujjain': { lat: 23.1765, lng: 75.7885, tz: 5.5 },
        'Sydney': { lat: -33.8688, lng: 151.2093, tz: 11 },
        'London': { lat: 51.5074, lng: -0.1278, tz: 0 },
        'New York': { lat: 40.7128, lng: -74.0060, tz: -5 }
    },

    // Hindu months (Masa)
    HINDU_MONTHS: [
        { sanskrit: 'चैत्र', english: 'Chaitra' },
        { sanskrit: 'वैशाख', english: 'Vaishakha' },
        { sanskrit: 'ज्येष्ठ', english: 'Jyeshtha' },
        { sanskrit: 'आषाढ़', english: 'Ashadha' },
        { sanskrit: 'श्रावण', english: 'Shravana' },
        { sanskrit: 'भाद्रपद', english: 'Bhadrapada' },
        { sanskrit: 'आश्विन', english: 'Ashwin' },
        { sanskrit: 'कार्तिक', english: 'Kartik' },
        { sanskrit: 'मार्गशीर्ष', english: 'Margashirsha' },
        { sanskrit: 'पौष', english: 'Pausha' },
        { sanskrit: 'माघ', english: 'Magha' },
        { sanskrit: 'फाल्गुन', english: 'Phalguna' }
    ],

    /**
     * Get Vikram Samvat year
     * Vikram Samvat is 57 years ahead of Gregorian year
     * New year starts around mid-April (Chaitra Shukla Pratipada)
     */
    getVikramSamvat(date, moonLongitude) {
        const year = date.getFullYear();
        const month = date.getMonth();
        // Vikram Samvat year changes around mid-March/April
        // Before Chaitra (roughly before April), use previous year
        if (month < 3) { // Jan-March
            return year + 56;
        }
        return year + 57;
    },

    /**
     * Get Hindu month (Masa) based on Sun's position
     * Each month corresponds to Sun transiting through a Rashi
     */
    getHinduMonth(sunLongitude) {
        // Hindu month is determined by Sun's position
        // Month changes when Sun enters a new Rashi
        // Mesha (0-30°) = Chaitra/Vaishakha border area

        if (typeof sunLongitude !== 'number' || isNaN(sunLongitude)) {
            return this.HINDU_MONTHS[0];
        }

        const rashiIndex = Math.floor(sunLongitude / 30);

        // Map Rashi to Hindu month (approximate - this is simplified)
        // The Sun in Makara (Capricorn, 270-300°) corresponds to Pausha
        // Mapping: Makara->Pausha, Kumbha->Magha, Meena->Phalguna, Mesha->Chaitra, etc.
        const monthMapping = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8]; // Mesha=0 -> Chaitra
        const monthIndex = monthMapping[rashiIndex] || 0;

        return this.HINDU_MONTHS[monthIndex] || this.HINDU_MONTHS[0];
    },

    /**
     * Calculate complete Panchang for a given date and location.
     * @param {Date} date - The date
     * @param {number} latitude - Latitude in degrees
     * @param {number} longitude - Longitude in degrees
     * @param {number} timezone - Timezone offset in hours
     * @returns {Object} Complete Panchang data
     */
    calculate(date, latitude, longitude, timezone) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // Get sunrise and sunset first (Hindu day starts at sunrise)
        const sunrise = SunTimesCalculator.calculateSunrise(date, latitude, longitude, timezone);
        const sunset = SunTimesCalculator.calculateSunset(date, latitude, longitude, timezone);
        const solarNoon = SunTimesCalculator.calculateSolarNoon(date, longitude, timezone);

        // Calculate Julian Day at sunrise
        const jdSunrise = AstronomicalCalculator.toJulianDay(
            year, month, day,
            sunrise ? sunrise.hours : 6,
            sunrise ? sunrise.minutes : 0
        );

        // Get Sun and Moon positions at sunrise
        const sunLongitude = AstronomicalCalculator.getSunLongitude(jdSunrise);
        const moonLongitude = AstronomicalCalculator.getMoonLongitude(jdSunrise);
        const elongation = AstronomicalCalculator.getLunarElongation(jdSunrise);

        // Moon phase
        const moonPhase = AstronomicalCalculator.getMoonPhase(jdSunrise);
        const moonPhaseName = AstronomicalCalculator.getMoonPhaseName(moonPhase);

        // Calculate all Panchang elements
        const tithi = getTithi(elongation);
        tithi.progress = getTithiProgress(elongation);
        tithi.endTime = getTithiEndTime(elongation);

        const nakshatra = getNakshatra(moonLongitude);
        nakshatra.progress = getNakshatraProgress(moonLongitude);
        nakshatra.pada = getNakshatraPada(moonLongitude);

        const yoga = getYoga(sunLongitude, moonLongitude);
        yoga.progress = getYogaProgress(sunLongitude, moonLongitude);

        const karana = getKarana(elongation);
        karana.progress = getKaranaProgress(elongation);
        karana.isVishti = isVishtiKarana(elongation);

        const moonSign = getMoonRashi(moonLongitude);
        moonSign.progress = getRashiProgress(moonLongitude);
        moonSign.degree = getRashiDegree(moonLongitude);

        const sunSign = getSunRashi(sunLongitude);
        sunSign.progress = getRashiProgress(sunLongitude);
        sunSign.degree = getRashiDegree(sunLongitude);

        // Calculate inauspicious times
        const rahuKaal = this.calculateRahuKaal(sunrise, sunset, date.getDay());
        const gulikaKaal = this.calculateGulikaKaal(sunrise, sunset, date.getDay());
        const yamaganda = this.calculateYamaganda(sunrise, sunset, date.getDay());
        const abhijit = this.calculateAbhijitMuhurta(sunrise, sunset);

        // Day length
        const dayLength = SunTimesCalculator.getDayLength(date, latitude, longitude, timezone);

        return {
            date: {
                gregorian: date.toDateString(),
                day: day,
                month: month,
                year: year,
                weekday: this.getWeekday(date.getDay()),
                weekdayIndex: date.getDay()
            },
            hinduCalendar: {
                masa: this.getHinduMonth(sunLongitude),
                samvat: this.getVikramSamvat(date, moonLongitude),
                paksha: tithi.paksha === 'Shukla'
                    ? { sanskrit: 'शुक्ल पक्ष', english: 'Bright Half' }
                    : { sanskrit: 'कृष्ण पक्ष', english: 'Dark Half' }
            },
            location: {
                latitude,
                longitude,
                timezone
            },
            sunTimes: {
                sunrise,
                sunset,
                solarNoon,
                dayLength
            },
            moonPhase: {
                phase: moonPhase,
                ...moonPhaseName,
                illumination: Math.round(Math.abs(Math.cos(moonPhase * 2 * Math.PI)) * 100)
            },
            tithi,
            nakshatra,
            yoga,
            karana,
            moonSign,
            sunSign,
            positions: {
                sunLongitude: Math.round(sunLongitude * 100) / 100,
                moonLongitude: Math.round(moonLongitude * 100) / 100,
                elongation: Math.round(elongation * 100) / 100
            },
            inauspiciousTimes: {
                rahuKaal,
                gulikaKaal,
                yamaganda
            },
            auspiciousTimes: {
                abhijit
            }
        };
    },

    /**
     * Get weekday with Hindu name
     */
    getWeekday(dayIndex) {
        const weekdays = [
            { english: 'Sunday', hindi: 'रविवार', transliteration: 'Ravivaar', lord: 'Sun' },
            { english: 'Monday', hindi: 'सोमवार', transliteration: 'Somvaar', lord: 'Moon' },
            { english: 'Tuesday', hindi: 'मंगलवार', transliteration: 'Mangalvaar', lord: 'Mars' },
            { english: 'Wednesday', hindi: 'बुधवार', transliteration: 'Budhvaar', lord: 'Mercury' },
            { english: 'Thursday', hindi: 'गुरुवार', transliteration: 'Guruvaar', lord: 'Jupiter' },
            { english: 'Friday', hindi: 'शुक्रवार', transliteration: 'Shukravaar', lord: 'Venus' },
            { english: 'Saturday', hindi: 'शनिवार', transliteration: 'Shanivaar', lord: 'Saturn' }
        ];
        return weekdays[dayIndex];
    },

    /**
     * Calculate Rahu Kaal
     * Each day has a different Rahu Kaal period based on the weekday
     */
    calculateRahuKaal(sunrise, sunset, weekday) {
        if (!sunrise || !sunset) return null;

        // Rahu Kaal order: Sun=8, Mon=2, Tue=7, Wed=5, Thu=6, Fri=4, Sat=3
        const rahuOrder = [8, 2, 7, 5, 6, 4, 3];
        const period = rahuOrder[weekday];

        const dayDuration = sunset.totalMinutes - sunrise.totalMinutes;
        const periodDuration = dayDuration / 8;

        const startMinutes = sunrise.totalMinutes + (period - 1) * periodDuration;
        const endMinutes = startMinutes + periodDuration;

        return {
            start: SunTimesCalculator.formatTime(Math.floor(startMinutes / 60), Math.floor(startMinutes % 60)),
            end: SunTimesCalculator.formatTime(Math.floor(endMinutes / 60), Math.floor(endMinutes % 60)),
            isCurrent: this.isCurrentTime(startMinutes, endMinutes)
        };
    },

    /**
     * Calculate Gulika Kaal
     */
    calculateGulikaKaal(sunrise, sunset, weekday) {
        if (!sunrise || !sunset) return null;

        // Gulika Kaal order: Sun=7, Mon=6, Tue=5, Wed=4, Thu=3, Fri=2, Sat=1
        const gulikaOrder = [7, 6, 5, 4, 3, 2, 1];
        const period = gulikaOrder[weekday];

        const dayDuration = sunset.totalMinutes - sunrise.totalMinutes;
        const periodDuration = dayDuration / 8;

        const startMinutes = sunrise.totalMinutes + (period - 1) * periodDuration;
        const endMinutes = startMinutes + periodDuration;

        return {
            start: SunTimesCalculator.formatTime(Math.floor(startMinutes / 60), Math.floor(startMinutes % 60)),
            end: SunTimesCalculator.formatTime(Math.floor(endMinutes / 60), Math.floor(endMinutes % 60)),
            isCurrent: this.isCurrentTime(startMinutes, endMinutes)
        };
    },

    /**
     * Calculate Yamaganda
     */
    calculateYamaganda(sunrise, sunset, weekday) {
        if (!sunrise || !sunset) return null;

        // Yamaganda order: Sun=5, Mon=4, Tue=3, Wed=2, Thu=1, Fri=7, Sat=6
        const yamagandaOrder = [5, 4, 3, 2, 1, 7, 6];
        const period = yamagandaOrder[weekday];

        const dayDuration = sunset.totalMinutes - sunrise.totalMinutes;
        const periodDuration = dayDuration / 8;

        const startMinutes = sunrise.totalMinutes + (period - 1) * periodDuration;
        const endMinutes = startMinutes + periodDuration;

        return {
            start: SunTimesCalculator.formatTime(Math.floor(startMinutes / 60), Math.floor(startMinutes % 60)),
            end: SunTimesCalculator.formatTime(Math.floor(endMinutes / 60), Math.floor(endMinutes % 60)),
            isCurrent: this.isCurrentTime(startMinutes, endMinutes)
        };
    },

    /**
     * Calculate Abhijit Muhurta (most auspicious time)
     * 48 minutes around solar noon
     */
    calculateAbhijitMuhurta(sunrise, sunset) {
        if (!sunrise || !sunset) return null;

        const solarNoonMinutes = (sunrise.totalMinutes + sunset.totalMinutes) / 2;
        const startMinutes = solarNoonMinutes - 24;
        const endMinutes = solarNoonMinutes + 24;

        return {
            start: SunTimesCalculator.formatTime(Math.floor(startMinutes / 60), Math.floor(startMinutes % 60)),
            end: SunTimesCalculator.formatTime(Math.floor(endMinutes / 60), Math.floor(endMinutes % 60)),
            isCurrent: this.isCurrentTime(startMinutes, endMinutes)
        };
    },

    /**
     * Check if current time is within a period
     */
    isCurrentTime(startMinutes, endMinutes) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    },

    /**
     * Get Panchang for next/previous day
     */
    getNextDay(date) {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        return next;
    },

    getPreviousDay(date) {
        const prev = new Date(date);
        prev.setDate(prev.getDate() - 1);
        return prev;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanchangEngine;
}
