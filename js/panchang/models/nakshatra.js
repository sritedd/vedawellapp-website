/**
 * Nakshatra (Lunar Mansion) definitions and calculations.
 * There are 27 nakshatras, each spanning 13°20' (13.333°) of the ecliptic.
 */
const NAKSHATRAS = [
    { index: 0, sanskrit: 'अश्विनी', english: 'Ashwini', transliteration: 'Ashwini', deity: 'Ashwini Kumaras', symbol: '🐴', planet: 'Ketu', gana: 'Deva', nature: 'swift', element: 'Earth' },
    { index: 1, sanskrit: 'भरणी', english: 'Bharani', transliteration: 'Bharani', deity: 'Yama', symbol: '🔺', planet: 'Venus', gana: 'Manushya', nature: 'fierce', element: 'Earth' },
    { index: 2, sanskrit: 'कृत्तिका', english: 'Krittika', transliteration: 'Krittika', deity: 'Agni', symbol: '🔥', planet: 'Sun', gana: 'Rakshasa', nature: 'mixed', element: 'Fire' },
    { index: 3, sanskrit: 'रोहिणी', english: 'Rohini', transliteration: 'Rohini', deity: 'Brahma', symbol: '🐂', planet: 'Moon', gana: 'Manushya', nature: 'fixed', element: 'Earth' },
    { index: 4, sanskrit: 'मृगशीर्ष', english: 'Mrigashira', transliteration: 'Mrigashira', deity: 'Soma', symbol: '🦌', planet: 'Mars', gana: 'Deva', nature: 'soft', element: 'Earth' },
    { index: 5, sanskrit: 'आर्द्रा', english: 'Ardra', transliteration: 'Ardra', deity: 'Rudra', symbol: '💧', planet: 'Rahu', gana: 'Manushya', nature: 'sharp', element: 'Water' },
    { index: 6, sanskrit: 'पुनर्वसु', english: 'Punarvasu', transliteration: 'Punarvasu', deity: 'Aditi', symbol: '🏹', planet: 'Jupiter', gana: 'Deva', nature: 'movable', element: 'Water' },
    { index: 7, sanskrit: 'पुष्य', english: 'Pushya', transliteration: 'Pushya', deity: 'Brihaspati', symbol: '🌸', planet: 'Saturn', gana: 'Deva', nature: 'swift', element: 'Water' },
    { index: 8, sanskrit: 'आश्लेषा', english: 'Ashlesha', transliteration: 'Ashlesha', deity: 'Nagas', symbol: '🐍', planet: 'Mercury', gana: 'Rakshasa', nature: 'sharp', element: 'Water' },
    { index: 9, sanskrit: 'मघा', english: 'Magha', transliteration: 'Magha', deity: 'Pitru', symbol: '👑', planet: 'Ketu', gana: 'Rakshasa', nature: 'fierce', element: 'Water' },
    { index: 10, sanskrit: 'पूर्वाफाल्गुनी', english: 'Purva Phalguni', transliteration: 'Purva Phalguni', deity: 'Bhaga', symbol: '🛏️', planet: 'Venus', gana: 'Manushya', nature: 'fierce', element: 'Water' },
    { index: 11, sanskrit: 'उत्तराफाल्गुनी', english: 'Uttara Phalguni', transliteration: 'Uttara Phalguni', deity: 'Aryaman', symbol: '🛏️', planet: 'Sun', gana: 'Manushya', nature: 'fixed', element: 'Fire' },
    { index: 12, sanskrit: 'हस्त', english: 'Hasta', transliteration: 'Hasta', deity: 'Savitar', symbol: '✋', planet: 'Moon', gana: 'Deva', nature: 'swift', element: 'Fire' },
    { index: 13, sanskrit: 'चित्रा', english: 'Chitra', transliteration: 'Chitra', deity: 'Vishvakarma', symbol: '💎', planet: 'Mars', gana: 'Rakshasa', nature: 'soft', element: 'Fire' },
    { index: 14, sanskrit: 'स्वाति', english: 'Swati', transliteration: 'Swati', deity: 'Vayu', symbol: '🌿', planet: 'Rahu', gana: 'Deva', nature: 'movable', element: 'Fire' },
    { index: 15, sanskrit: 'विशाखा', english: 'Vishakha', transliteration: 'Vishakha', deity: 'Indra-Agni', symbol: '🌳', planet: 'Jupiter', gana: 'Rakshasa', nature: 'mixed', element: 'Fire' },
    { index: 16, sanskrit: 'अनुराधा', english: 'Anuradha', transliteration: 'Anuradha', deity: 'Mitra', symbol: '🪷', planet: 'Saturn', gana: 'Deva', nature: 'soft', element: 'Air' },
    { index: 17, sanskrit: 'ज्येष्ठा', english: 'Jyeshtha', transliteration: 'Jyeshtha', deity: 'Indra', symbol: '☂️', planet: 'Mercury', gana: 'Rakshasa', nature: 'sharp', element: 'Air' },
    { index: 18, sanskrit: 'मूल', english: 'Mula', transliteration: 'Mula', deity: 'Nirriti', symbol: '🦁', planet: 'Ketu', gana: 'Rakshasa', nature: 'sharp', element: 'Air' },
    { index: 19, sanskrit: 'पूर्वाषाढा', english: 'Purva Ashadha', transliteration: 'Purva Ashadha', deity: 'Apas', symbol: '🐘', planet: 'Venus', gana: 'Manushya', nature: 'fierce', element: 'Air' },
    { index: 20, sanskrit: 'उत्तराषाढा', english: 'Uttara Ashadha', transliteration: 'Uttara Ashadha', deity: 'Vishvadevas', symbol: '🐘', planet: 'Sun', gana: 'Manushya', nature: 'fixed', element: 'Air' },
    { index: 21, sanskrit: 'श्रवण', english: 'Shravana', transliteration: 'Shravana', deity: 'Vishnu', symbol: '👂', planet: 'Moon', gana: 'Deva', nature: 'movable', element: 'Air' },
    { index: 22, sanskrit: 'धनिष्ठा', english: 'Dhanishtha', transliteration: 'Dhanishtha', deity: 'Vasus', symbol: '🥁', planet: 'Mars', gana: 'Rakshasa', nature: 'movable', element: 'Ether' },
    { index: 23, sanskrit: 'शतभिषा', english: 'Shatabhisha', transliteration: 'Shatabhisha', deity: 'Varuna', symbol: '💫', planet: 'Rahu', gana: 'Rakshasa', nature: 'movable', element: 'Ether' },
    { index: 24, sanskrit: 'पूर्वाभाद्रपदा', english: 'Purva Bhadrapada', transliteration: 'Purva Bhadrapada', deity: 'Aja Ekapada', symbol: '⚡', planet: 'Jupiter', gana: 'Manushya', nature: 'fierce', element: 'Ether' },
    { index: 25, sanskrit: 'उत्तराभाद्रपदा', english: 'Uttara Bhadrapada', transliteration: 'Uttara Bhadrapada', deity: 'Ahir Budhnya', symbol: '🐍', planet: 'Saturn', gana: 'Manushya', nature: 'fixed', element: 'Ether' },
    { index: 26, sanskrit: 'रेवती', english: 'Revati', transliteration: 'Revati', deity: 'Pushan', symbol: '🐟', planet: 'Mercury', gana: 'Deva', nature: 'soft', element: 'Ether' }
];

const NAKSHATRA_SPAN = 13.333333; // 13°20' in decimal degrees

/**
 * Get current nakshatra based on Moon's longitude
 * @param {number} moonLongitude - Moon's ecliptic longitude in degrees (0-360)
 * @returns {Object} Nakshatra object with all details
 */
function getNakshatra(moonLongitude) {
    const normalized = ((moonLongitude % 360) + 360) % 360;
    const index = Math.floor(normalized / NAKSHATRA_SPAN);
    return { ...NAKSHATRAS[Math.min(index, 26)] };
}

/**
 * Get progress through current nakshatra (0-1)
 */
function getNakshatraProgress(moonLongitude) {
    const normalized = ((moonLongitude % 360) + 360) % 360;
    const nakshatraStart = Math.floor(normalized / NAKSHATRA_SPAN) * NAKSHATRA_SPAN;
    return (normalized - nakshatraStart) / NAKSHATRA_SPAN;
}

/**
 * Get nakshatra pada (quarter) - 1 to 4
 */
function getNakshatraPada(moonLongitude) {
    const progress = getNakshatraProgress(moonLongitude);
    return Math.floor(progress * 4) + 1;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NAKSHATRAS, getNakshatra, getNakshatraProgress, getNakshatraPada };
}
