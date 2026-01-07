/**
 * Tithi (Lunar Day) definitions and calculations.
 * There are 30 tithis in a lunar month (15 in each paksha).
 */
const TITHIS = [
    // Shukla Paksha (Bright Half - Waxing Moon)
    { index: 0, number: 1, sanskrit: 'प्रतिपदा', english: 'Pratipada', transliteration: 'Pratipada', paksha: 'Shukla', lord: 'Agni', nature: 'auspicious' },
    { index: 1, number: 2, sanskrit: 'द्वितीया', english: 'Dwitiya', transliteration: 'Dwitiya', paksha: 'Shukla', lord: 'Brahma', nature: 'auspicious' },
    { index: 2, number: 3, sanskrit: 'तृतीया', english: 'Tritiya', transliteration: 'Tritiya', paksha: 'Shukla', lord: 'Gauri', nature: 'auspicious' },
    { index: 3, number: 4, sanskrit: 'चतुर्थी', english: 'Chaturthi', transliteration: 'Chaturthi', paksha: 'Shukla', lord: 'Ganesh', nature: 'mixed' },
    { index: 4, number: 5, sanskrit: 'पञ्चमी', english: 'Panchami', transliteration: 'Panchami', paksha: 'Shukla', lord: 'Naga', nature: 'auspicious' },
    { index: 5, number: 6, sanskrit: 'षष्ठी', english: 'Shashthi', transliteration: 'Shashthi', paksha: 'Shukla', lord: 'Kartik', nature: 'auspicious' },
    { index: 6, number: 7, sanskrit: 'सप्तमी', english: 'Saptami', transliteration: 'Saptami', paksha: 'Shukla', lord: 'Sun', nature: 'auspicious' },
    { index: 7, number: 8, sanskrit: 'अष्टमी', english: 'Ashtami', transliteration: 'Ashtami', paksha: 'Shukla', lord: 'Rudra', nature: 'mixed' },
    { index: 8, number: 9, sanskrit: 'नवमी', english: 'Navami', transliteration: 'Navami', paksha: 'Shukla', lord: 'Durga', nature: 'mixed' },
    { index: 9, number: 10, sanskrit: 'दशमी', english: 'Dashami', transliteration: 'Dashami', paksha: 'Shukla', lord: 'Yama', nature: 'auspicious' },
    { index: 10, number: 11, sanskrit: 'एकादशी', english: 'Ekadashi', transliteration: 'Ekadashi', paksha: 'Shukla', lord: 'Vishnu', nature: 'highly auspicious' },
    { index: 11, number: 12, sanskrit: 'द्वादशी', english: 'Dwadashi', transliteration: 'Dwadashi', paksha: 'Shukla', lord: 'Vishnu', nature: 'auspicious' },
    { index: 12, number: 13, sanskrit: 'त्रयोदशी', english: 'Trayodashi', transliteration: 'Trayodashi', paksha: 'Shukla', lord: 'Kamadeva', nature: 'auspicious' },
    { index: 13, number: 14, sanskrit: 'चतुर्दशी', english: 'Chaturdashi', transliteration: 'Chaturdashi', paksha: 'Shukla', lord: 'Shiva', nature: 'mixed' },
    { index: 14, number: 15, sanskrit: 'पूर्णिमा', english: 'Purnima', transliteration: 'Purnima', paksha: 'Purnima', lord: 'Moon', nature: 'highly auspicious' },

    // Krishna Paksha (Dark Half - Waning Moon)
    { index: 15, number: 1, sanskrit: 'प्रतिपदा', english: 'Pratipada', transliteration: 'Pratipada', paksha: 'Krishna', lord: 'Agni', nature: 'auspicious' },
    { index: 16, number: 2, sanskrit: 'द्वितीया', english: 'Dwitiya', transliteration: 'Dwitiya', paksha: 'Krishna', lord: 'Brahma', nature: 'auspicious' },
    { index: 17, number: 3, sanskrit: 'तृतीया', english: 'Tritiya', transliteration: 'Tritiya', paksha: 'Krishna', lord: 'Gauri', nature: 'auspicious' },
    { index: 18, number: 4, sanskrit: 'चतुर्थी', english: 'Chaturthi', transliteration: 'Chaturthi', paksha: 'Krishna', lord: 'Ganesh', nature: 'mixed' },
    { index: 19, number: 5, sanskrit: 'पञ्चमी', english: 'Panchami', transliteration: 'Panchami', paksha: 'Krishna', lord: 'Naga', nature: 'auspicious' },
    { index: 20, number: 6, sanskrit: 'षष्ठी', english: 'Shashthi', transliteration: 'Shashthi', paksha: 'Krishna', lord: 'Kartik', nature: 'auspicious' },
    { index: 21, number: 7, sanskrit: 'सप्तमी', english: 'Saptami', transliteration: 'Saptami', paksha: 'Krishna', lord: 'Sun', nature: 'auspicious' },
    { index: 22, number: 8, sanskrit: 'अष्टमी', english: 'Ashtami', transliteration: 'Ashtami', paksha: 'Krishna', lord: 'Rudra', nature: 'mixed' },
    { index: 23, number: 9, sanskrit: 'नवमी', english: 'Navami', transliteration: 'Navami', paksha: 'Krishna', lord: 'Durga', nature: 'mixed' },
    { index: 24, number: 10, sanskrit: 'दशमी', english: 'Dashami', transliteration: 'Dashami', paksha: 'Krishna', lord: 'Yama', nature: 'auspicious' },
    { index: 25, number: 11, sanskrit: 'एकादशी', english: 'Ekadashi', transliteration: 'Ekadashi', paksha: 'Krishna', lord: 'Vishnu', nature: 'highly auspicious' },
    { index: 26, number: 12, sanskrit: 'द्वादशी', english: 'Dwadashi', transliteration: 'Dwadashi', paksha: 'Krishna', lord: 'Vishnu', nature: 'auspicious' },
    { index: 27, number: 13, sanskrit: 'त्रयोदशी', english: 'Trayodashi', transliteration: 'Trayodashi', paksha: 'Krishna', lord: 'Kamadeva', nature: 'auspicious' },
    { index: 28, number: 14, sanskrit: 'चतुर्दशी', english: 'Chaturdashi', transliteration: 'Chaturdashi', paksha: 'Krishna', lord: 'Shiva', nature: 'mixed' },
    { index: 29, number: 30, sanskrit: 'अमावस्या', english: 'Amavasya', transliteration: 'Amavasya', paksha: 'Amavasya', lord: 'Pitru', nature: 'mixed' }
];

const TITHI_SPAN = 12; // Each tithi spans 12 degrees of elongation

/**
 * Get current tithi based on lunar elongation
 * @param {number} elongation - Lunar elongation in degrees (0-360)
 * @returns {Object} Tithi object with all details
 */
function getTithi(elongation) {
    const index = Math.floor(elongation / TITHI_SPAN) % 30;
    return { ...TITHIS[index] };
}

/**
 * Get progress through current tithi (0-1)
 */
function getTithiProgress(elongation) {
    const tithiStart = Math.floor(elongation / TITHI_SPAN) * TITHI_SPAN;
    return (elongation - tithiStart) / TITHI_SPAN;
}

/**
 * Get time remaining for current tithi
 * Approximate: Moon moves ~12° in 24 hours relative to Sun
 */
function getTithiEndTime(elongation) {
    const progress = getTithiProgress(elongation);
    const remainingProgress = 1 - progress;
    const hoursRemaining = remainingProgress * 24; // Approximate
    return {
        hours: Math.floor(hoursRemaining),
        minutes: Math.floor((hoursRemaining % 1) * 60)
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TITHIS, getTithi, getTithiProgress, getTithiEndTime };
}
