/**
 * Rashi (Zodiac Sign) definitions.
 * There are 12 rashis, each spanning 30 degrees of the ecliptic.
 */
const RASHIS = [
    { index: 0, sanskrit: 'मेष', english: 'Aries', transliteration: 'Mesha', symbol: '♈', element: 'Fire', quality: 'Cardinal', ruler: 'Mars', emoji: '🐏' },
    { index: 1, sanskrit: 'वृषभ', english: 'Taurus', transliteration: 'Vrishabha', symbol: '♉', element: 'Earth', quality: 'Fixed', ruler: 'Venus', emoji: '🐂' },
    { index: 2, sanskrit: 'मिथुन', english: 'Gemini', transliteration: 'Mithuna', symbol: '♊', element: 'Air', quality: 'Mutable', ruler: 'Mercury', emoji: '👯' },
    { index: 3, sanskrit: 'कर्क', english: 'Cancer', transliteration: 'Karka', symbol: '♋', element: 'Water', quality: 'Cardinal', ruler: 'Moon', emoji: '🦀' },
    { index: 4, sanskrit: 'सिंह', english: 'Leo', transliteration: 'Simha', symbol: '♌', element: 'Fire', quality: 'Fixed', ruler: 'Sun', emoji: '🦁' },
    { index: 5, sanskrit: 'कन्या', english: 'Virgo', transliteration: 'Kanya', symbol: '♍', element: 'Earth', quality: 'Mutable', ruler: 'Mercury', emoji: '👧' },
    { index: 6, sanskrit: 'तुला', english: 'Libra', transliteration: 'Tula', symbol: '♎', element: 'Air', quality: 'Cardinal', ruler: 'Venus', emoji: '⚖️' },
    { index: 7, sanskrit: 'वृश्चिक', english: 'Scorpio', transliteration: 'Vrishchika', symbol: '♏', element: 'Water', quality: 'Fixed', ruler: 'Mars', emoji: '🦂' },
    { index: 8, sanskrit: 'धनु', english: 'Sagittarius', transliteration: 'Dhanu', symbol: '♐', element: 'Fire', quality: 'Mutable', ruler: 'Jupiter', emoji: '🏹' },
    { index: 9, sanskrit: 'मकर', english: 'Capricorn', transliteration: 'Makara', symbol: '♑', element: 'Earth', quality: 'Cardinal', ruler: 'Saturn', emoji: '🐐' },
    { index: 10, sanskrit: 'कुम्भ', english: 'Aquarius', transliteration: 'Kumbha', symbol: '♒', element: 'Air', quality: 'Fixed', ruler: 'Saturn', emoji: '🏺' },
    { index: 11, sanskrit: 'मीन', english: 'Pisces', transliteration: 'Meena', symbol: '♓', element: 'Water', quality: 'Mutable', ruler: 'Jupiter', emoji: '🐟' }
];

const RASHI_SPAN = 30; // Each rashi spans 30 degrees

/**
 * Get rashi based on longitude
 * @param {number} longitude - Ecliptic longitude in degrees (0-360)
 * @returns {Object} Rashi object with all details
 */
function getRashi(longitude) {
    const normalized = ((longitude % 360) + 360) % 360;
    const index = Math.floor(normalized / RASHI_SPAN);
    return { ...RASHIS[index] };
}

/**
 * Get Sun's rashi (solar month)
 */
function getSunRashi(sunLongitude) {
    return getRashi(sunLongitude);
}

/**
 * Get Moon's rashi (Moon sign)
 */
function getMoonRashi(moonLongitude) {
    return getRashi(moonLongitude);
}

/**
 * Get progress through current rashi (0-1)
 */
function getRashiProgress(longitude) {
    const normalized = ((longitude % 360) + 360) % 360;
    const rashiStart = Math.floor(normalized / RASHI_SPAN) * RASHI_SPAN;
    return (normalized - rashiStart) / RASHI_SPAN;
}

/**
 * Get degree within rashi (0-30)
 */
function getRashiDegree(longitude) {
    const normalized = ((longitude % 360) + 360) % 360;
    return normalized % RASHI_SPAN;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RASHIS, getRashi, getSunRashi, getMoonRashi, getRashiProgress, getRashiDegree };
}
