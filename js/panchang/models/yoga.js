/**
 * Yoga definitions and calculations.
 * There are 27 yogas, each spanning 13°20' of combined Sun+Moon longitude.
 */
const YOGAS = [
    { index: 0, sanskrit: 'विष्कम्भ', english: 'Vishkambha', transliteration: 'Vishkambha', nature: 'inauspicious', meaning: 'Supporting' },
    { index: 1, sanskrit: 'प्रीति', english: 'Priti', transliteration: 'Priti', nature: 'auspicious', meaning: 'Love' },
    { index: 2, sanskrit: 'आयुष्मान्', english: 'Ayushman', transliteration: 'Ayushman', nature: 'auspicious', meaning: 'Long-lived' },
    { index: 3, sanskrit: 'सौभाग्य', english: 'Saubhagya', transliteration: 'Saubhagya', nature: 'auspicious', meaning: 'Good Fortune' },
    { index: 4, sanskrit: 'शोभन', english: 'Shobhana', transliteration: 'Shobhana', nature: 'auspicious', meaning: 'Splendor' },
    { index: 5, sanskrit: 'अतिगण्ड', english: 'Atiganda', transliteration: 'Atiganda', nature: 'inauspicious', meaning: 'Great Obstacle' },
    { index: 6, sanskrit: 'सुकर्मा', english: 'Sukarma', transliteration: 'Sukarma', nature: 'auspicious', meaning: 'Good Deeds' },
    { index: 7, sanskrit: 'धृति', english: 'Dhriti', transliteration: 'Dhriti', nature: 'auspicious', meaning: 'Determination' },
    { index: 8, sanskrit: 'शूल', english: 'Shoola', transliteration: 'Shoola', nature: 'inauspicious', meaning: 'Spear' },
    { index: 9, sanskrit: 'गण्ड', english: 'Ganda', transliteration: 'Ganda', nature: 'inauspicious', meaning: 'Obstacle' },
    { index: 10, sanskrit: 'वृद्धि', english: 'Vriddhi', transliteration: 'Vriddhi', nature: 'auspicious', meaning: 'Growth' },
    { index: 11, sanskrit: 'ध्रुव', english: 'Dhruva', transliteration: 'Dhruva', nature: 'auspicious', meaning: 'Constant' },
    { index: 12, sanskrit: 'व्याघात', english: 'Vyaghata', transliteration: 'Vyaghata', nature: 'inauspicious', meaning: 'Beating' },
    { index: 13, sanskrit: 'हर्षण', english: 'Harshana', transliteration: 'Harshana', nature: 'auspicious', meaning: 'Joy' },
    { index: 14, sanskrit: 'वज्र', english: 'Vajra', transliteration: 'Vajra', nature: 'mixed', meaning: 'Thunderbolt' },
    { index: 15, sanskrit: 'सिद्धि', english: 'Siddhi', transliteration: 'Siddhi', nature: 'auspicious', meaning: 'Accomplishment' },
    { index: 16, sanskrit: 'व्यतीपात', english: 'Vyatipata', transliteration: 'Vyatipata', nature: 'inauspicious', meaning: 'Calamity' },
    { index: 17, sanskrit: 'वरीयान्', english: 'Variyan', transliteration: 'Variyan', nature: 'auspicious', meaning: 'Excellence' },
    { index: 18, sanskrit: 'परिघ', english: 'Parigha', transliteration: 'Parigha', nature: 'inauspicious', meaning: 'Iron Bar' },
    { index: 19, sanskrit: 'शिव', english: 'Shiva', transliteration: 'Shiva', nature: 'auspicious', meaning: 'Auspicious' },
    { index: 20, sanskrit: 'सिद्ध', english: 'Siddha', transliteration: 'Siddha', nature: 'auspicious', meaning: 'Perfect' },
    { index: 21, sanskrit: 'साध्य', english: 'Sadhya', transliteration: 'Sadhya', nature: 'auspicious', meaning: 'Achievable' },
    { index: 22, sanskrit: 'शुभ', english: 'Shubha', transliteration: 'Shubha', nature: 'auspicious', meaning: 'Fortunate' },
    { index: 23, sanskrit: 'शुक्ल', english: 'Shukla', transliteration: 'Shukla', nature: 'auspicious', meaning: 'Bright' },
    { index: 24, sanskrit: 'ब्रह्म', english: 'Brahma', transliteration: 'Brahma', nature: 'auspicious', meaning: 'Creator' },
    { index: 25, sanskrit: 'इन्द्र', english: 'Indra', transliteration: 'Indra', nature: 'auspicious', meaning: 'King of Gods' },
    { index: 26, sanskrit: 'वैधृति', english: 'Vaidhriti', transliteration: 'Vaidhriti', nature: 'inauspicious', meaning: 'Contradiction' }
];

const YOGA_SPAN = 13.333333; // 13°20'

/**
 * Get current yoga based on Sun and Moon longitudes
 * @param {number} sunLongitude - Sun's ecliptic longitude in degrees
 * @param {number} moonLongitude - Moon's ecliptic longitude in degrees
 * @returns {Object} Yoga object with all details
 */
function getYoga(sunLongitude, moonLongitude) {
    const sum = ((sunLongitude + moonLongitude) % 360 + 360) % 360;
    const index = Math.floor(sum / YOGA_SPAN);
    return { ...YOGAS[Math.min(index, 26)] };
}

/**
 * Get progress through current yoga (0-1)
 */
function getYogaProgress(sunLongitude, moonLongitude) {
    const sum = ((sunLongitude + moonLongitude) % 360 + 360) % 360;
    const yogaStart = Math.floor(sum / YOGA_SPAN) * YOGA_SPAN;
    return (sum - yogaStart) / YOGA_SPAN;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { YOGAS, getYoga, getYogaProgress };
}
