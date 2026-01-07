/**
 * Karana definitions and calculations.
 * There are 11 karanas (60 in a month, 2 per tithi).
 * 4 are fixed (occur once per month) and 7 cycle repeatedly.
 */
const FIXED_KARANAS = [
    { index: 0, sanskrit: 'किंस्तुघ्न', english: 'Kimstughna', transliteration: 'Kimstughna', nature: 'auspicious', fixed: true },
    { index: 1, sanskrit: 'शकुनि', english: 'Shakuni', transliteration: 'Shakuni', nature: 'inauspicious', fixed: true },
    { index: 2, sanskrit: 'चतुष्पद', english: 'Chatushpada', transliteration: 'Chatushpada', nature: 'inauspicious', fixed: true },
    { index: 3, sanskrit: 'नाग', english: 'Naga', transliteration: 'Naga', nature: 'inauspicious', fixed: true }
];

const ROTATING_KARANAS = [
    { index: 0, sanskrit: 'बव', english: 'Bava', transliteration: 'Bava', nature: 'auspicious', fixed: false },
    { index: 1, sanskrit: 'बालव', english: 'Balava', transliteration: 'Balava', nature: 'auspicious', fixed: false },
    { index: 2, sanskrit: 'कौलव', english: 'Kaulava', transliteration: 'Kaulava', nature: 'auspicious', fixed: false },
    { index: 3, sanskrit: 'तैतिल', english: 'Taitila', transliteration: 'Taitila', nature: 'auspicious', fixed: false },
    { index: 4, sanskrit: 'गर', english: 'Gara', transliteration: 'Gara', nature: 'auspicious', fixed: false },
    { index: 5, sanskrit: 'वणिज', english: 'Vanija', transliteration: 'Vanija', nature: 'auspicious', fixed: false },
    { index: 6, sanskrit: 'विष्टि', english: 'Vishti', transliteration: 'Vishti', nature: 'inauspicious', fixed: false }
];

const KARANA_SPAN = 6; // Each karana spans 6 degrees of elongation

/**
 * Get current karana based on lunar elongation
 * @param {number} elongation - Lunar elongation in degrees (0-360)
 * @returns {Object} Karana object with all details
 */
function getKarana(elongation) {
    const karanaIndex = Math.floor(elongation / KARANA_SPAN) % 60;

    // Fixed karanas occur at specific positions
    // Kimstughna: 2nd half of Amavasya (index 59)
    // Shakuni: 1st half of Krishna Chaturdashi (index 56)
    // Chatushpada: 2nd half of Krishna Chaturdashi (index 57)
    // Naga: 1st half of Amavasya (index 58)

    if (karanaIndex === 59) {
        return { ...FIXED_KARANAS[0], karanaNumber: 60 };
    } else if (karanaIndex === 56) {
        return { ...FIXED_KARANAS[1], karanaNumber: 57 };
    } else if (karanaIndex === 57) {
        return { ...FIXED_KARANAS[2], karanaNumber: 58 };
    } else if (karanaIndex === 58) {
        return { ...FIXED_KARANAS[3], karanaNumber: 59 };
    } else {
        // Rotating karanas (indices 0-55)
        const rotatingIndex = karanaIndex % 7;
        return { ...ROTATING_KARANAS[rotatingIndex], karanaNumber: karanaIndex + 1 };
    }
}

/**
 * Get progress through current karana (0-1)
 */
function getKaranaProgress(elongation) {
    const karanaStart = Math.floor(elongation / KARANA_SPAN) * KARANA_SPAN;
    return (elongation - karanaStart) / KARANA_SPAN;
}

/**
 * Check if current karana is Vishti (Bhadra) - inauspicious
 */
function isVishtiKarana(elongation) {
    const karana = getKarana(elongation);
    return karana.english === 'Vishti';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FIXED_KARANAS, ROTATING_KARANAS, getKarana, getKaranaProgress, isVishtiKarana };
}
