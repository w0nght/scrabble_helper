/**
 * Scoring Module
 * Calculates Scrabble word scores based on standard letter values
 */

// Standard Scrabble letter point values
const LETTER_SCORES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1,
    'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1,
    'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1,
    'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4,
    'Z': 10
};

const WILDCARD_SCORE = 0; // Wildcards/blanks are worth 0 points

/**
 * Get the point value for a single letter
 * @param {string} letter - Single letter (A-Z)
 * @returns {number} Point value
 */
export function getLetterScore(letter) {
    const upperLetter = letter.toUpperCase();
    return LETTER_SCORES[upperLetter] || 0;
}

/**
 * Calculate the total score for a word
 * @param {string} word - Word to score
 * @param {Array<number>} wildcardIndices - Indices where wildcards were used (0-indexed)
 * @returns {number} Total score
 */
export function getWordScore(word, wildcardIndices = []) {
    let score = 0;

    for (let i = 0; i < word.length; i++) {
        if (wildcardIndices.includes(i)) {
            // Wildcard position - worth 0 points
            score += WILDCARD_SCORE;
        } else {
            // Normal letter
            score += getLetterScore(word[i]);
        }
    }

    return score;
}

/**
 * Get the letter score breakdown for a word (useful for UI)
 * @param {string} word - Word to analyze
 * @param {Array<number>} wildcardIndices - Indices where wildcards were used
 * @returns {Array<Object>} Array of { letter, score, isWildcard }
 */
export function getScoreBreakdown(word, wildcardIndices = []) {
    return word.split('').map((letter, index) => ({
        letter: letter.toUpperCase(),
        score: wildcardIndices.includes(index) ? WILDCARD_SCORE : getLetterScore(letter),
        isWildcard: wildcardIndices.includes(index)
    }));
}

/**
 * Get all letter scores (useful for reference)
 * @returns {Object} Letter to score mapping
 */
export function getAllLetterScores() {
    return { ...LETTER_SCORES };
}

/**
 * Calculate score with potential bonus multipliers
 * (For future expansion - double/triple letter/word scores)
 * @param {string} word - Word to score
 * @param {Array<number>} wildcardIndices - Wildcard positions
 * @param {Object} bonuses - Optional bonus multipliers
 * @returns {number} Total score with bonuses
 */
export function getWordScoreWithBonuses(word, wildcardIndices = [], bonuses = {}) {
    let baseScore = 0;

    // Calculate base score with letter multipliers
    for (let i = 0; i < word.length; i++) {
        let letterScore;

        if (wildcardIndices.includes(i)) {
            letterScore = WILDCARD_SCORE;
        } else {
            letterScore = getLetterScore(word[i]);
        }

        // Apply letter multiplier if exists
        const letterMultiplier = bonuses.letterMultipliers?.[i] || 1;
        baseScore += letterScore * letterMultiplier;
    }

    // Apply word multiplier
    const wordMultiplier = bonuses.wordMultiplier || 1;
    let totalScore = baseScore * wordMultiplier;

    // Apply bingo bonus (using all 7 tiles)
    if (word.length === 7 && bonuses.bingoBonus) {
        totalScore += 50; // Standard Scrabble bingo bonus
    }

    return totalScore;
}

/**
 * Sort words by score (descending)
 * @param {Array<Object>} words - Array of word objects with 'score' property
 * @returns {Array<Object>} Sorted array
 */
export function sortByScore(words) {
    return [...words].sort((a, b) => b.score - a.score);
}

/**
 * Get statistics about scores
 * @param {Array<Object>} matches - Array of word matches with scores
 * @returns {Object} Score statistics
 */
export function getScoreStats(matches) {
    if (matches.length === 0) {
        return {
            min: 0,
            max: 0,
            average: 0,
            total: 0
        };
    }

    const scores = matches.map(m => m.score);

    return {
        min: Math.min(...scores),
        max: Math.max(...scores),
        average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        total: scores.reduce((a, b) => a + b, 0)
    };
}