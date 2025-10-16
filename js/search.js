/**
 * Search Module
 * Core word-finding logic with wildcard support, filtering, and sorting
 */

/**
 * Check if a word matches the required letter at the required position
 * @param {string} word - Word to check
 * @param {string} requiredLetter - Required letter (empty if none)
 * @param {number} requiredPosition - Position (1-indexed, 0 if none)
 * @returns {boolean}
 */
export function matchRequiredPosition(word, requiredLetter, requiredPosition) {
    // No requirement
    if (!requiredLetter || !requiredPosition || requiredPosition < 1) {
        return true;
    }

    // Convert to 0-indexed
    const index = requiredPosition - 1;

    // Position out of range
    if (index >= word.length) {
        return false;
    }

    return word[index].toUpperCase() === requiredLetter.toUpperCase();
}

/**
 * Check if a word can be formed from available letters (with wildcards)
 * @param {string} word - Word to check
 * @param {Array<string>} availableLetters - Available letters including '?' for wildcards
 * @returns {Object|null} { valid: boolean, wildcardIndices: Array<number> } or null if invalid
 */
function canFormWord(word, availableLetters) {
    const tempLetters = [...availableLetters];
    const wordLetters = word.toUpperCase().split('');
    const wildcardIndices = [];

    for (let i = 0; i < wordLetters.length; i++) {
        const letter = wordLetters[i];
        const idx = tempLetters.indexOf(letter);

        if (idx !== -1) {
            // Letter found - use it
            tempLetters.splice(idx, 1);
        } else {
            // Letter not found - try using a wildcard
            const wildIdx = tempLetters.indexOf('?');
            if (wildIdx !== -1) {
                wildcardIndices.push(i);
                tempLetters.splice(wildIdx, 1);
            } else {
                // Can't form this word
                return null;
            }
        }
    }

    return {
        valid: true,
        wildcardIndices
    };
}

/**
 * Filter words by length range
 * @param {Array<string>} words - Words to filter
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {boolean} showAll - If true, bypass length filtering
 * @returns {Array<string>}
 */
function filterByLength(words, minLength, maxLength, showAll) {
    if (showAll) return words;

    return words.filter(word =>
        word.length >= minLength && word.length <= maxLength
    );
}

/**
 * Sort matches by specified criteria
 * @param {Array<Object>} matches - Array of match objects
 * @param {string} sortBy - Sort criteria: 'score', 'length-desc', 'length-asc', 'alpha'
 * @returns {Array<Object>} Sorted matches
 */
export function sortMatches(matches, sortBy) {
    const sorted = [...matches]; // Don't mutate original

    switch (sortBy) {
        case 'score':
            sorted.sort((a, b) => b.score - a.score);
            break;
        case 'length-desc':
            sorted.sort((a, b) => b.word.length - a.word.length);
            break;
        case 'length-asc':
            sorted.sort((a, b) => a.word.length - b.word.length);
            break;
        case 'alpha':
            sorted.sort((a, b) => a.word.localeCompare(b.word));
            break;
        default:
            console.warn(`Unknown sort type: ${sortBy}`);
    }

    return sorted;
}

/**
 * Search for words matching the given criteria
 * @param {Object} params - Search parameters
 * @param {string} params.letters - Available letters (A-Z)
 * @param {number} params.wildcardCount - Number of wildcard tiles
 * @param {string} params.requiredLetter - Required letter (optional)
 * @param {number} params.requiredPosition - Required position 1-indexed (optional)
 * @param {number} params.minLength - Minimum word length
 * @param {number} params.maxLength - Maximum word length
 * @param {boolean} params.showAll - Bypass length filtering
 * @param {Array<string>} params.dictionary - Dictionary word list
 * @param {Function} params.scoreFunction - Function to calculate word score
 * @returns {Object} { matches: Array, stats: Object }
 */
export function searchWords({
    letters,
    wildcardCount = 0,
    requiredLetter = '',
    requiredPosition = 0,
    minLength = 2,
    maxLength = 15,
    showAll = false,
    dictionary = [],
    scoreFunction = null
}) {
    console.log('🔍 Starting word search...', {
        letters,
        wildcardCount,
        requiredLetter,
        requiredPosition,
        minLength,
        maxLength,
        dictionarySize: dictionary.length
    });

    // Prepare available letters
    const allLetters = letters.toUpperCase() + '?'.repeat(wildcardCount);
    const availableLetters = allLetters.split('');

    const matches = [];
    let skippedDueToLength = 0;
    let skippedDueToPosition = 0;
    let skippedDueToLetters = 0;

    // Filter by length first (optimization)
    const lengthFiltered = filterByLength(dictionary, minLength, maxLength, showAll);
    skippedDueToLength = dictionary.length - lengthFiltered.length;

    // Search through filtered words
    for (const word of lengthFiltered) {
        // Check required position
        if (!matchRequiredPosition(word, requiredLetter, requiredPosition)) {
            skippedDueToPosition++;
            continue;
        }

        // Check if word can be formed
        const result = canFormWord(word, availableLetters);

        if (result && result.valid) {
            matches.push({
                word,
                wildcards: result.wildcardIndices,
                score: scoreFunction ? scoreFunction(word, result.wildcardIndices) : 0
            });
        } else {
            skippedDueToLetters++;
        }
    }

    console.log('✅ Search complete:', {
        matches: matches.length,
        skippedDueToLength,
        skippedDueToPosition,
        skippedDueToLetters
    });

    return {
        matches,
        stats: {
            total: matches.length,
            skippedDueToLength,
            skippedDueToPosition,
            skippedDueToLetters
        }
    };
}

/**
 * Validate search input
 * @param {string} letters - Input letters
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateInput(letters, wildcardCount = 0) {
    const hasLetters = !!(letters && letters.trim() !== '');
    const hasWildcards = Number(wildcardCount) > 0;

    if (!hasLetters && !hasWildcards) {
        return {
            valid: false,
            error: 'Please enter some letters. 🙏'
        };
    }

    const cleaned = (letters || '').toUpperCase().replace(/[^A-Z]/g, '');

    if (cleaned.length === 0 && !hasWildcards) {
        return {
            valid: false,
            error: 'Please enter valid letters (A-Z). 🙏'
        };
    }

    return {
        valid: true,
        error: null
    };
}

/**
 * Sanitize input to uppercase letters only
 * @param {string} input - Raw input
 * @returns {string} Cleaned input
 */
export function sanitizeInput(input) {
    return input.toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Get the longest word length from matches
 * @param {Array<Object>} matches - Match objects with 'word' property
 * @returns {number}
 */
export function getLongestWordLength(matches) {
    if (matches.length === 0) return 0;
    return Math.max(...matches.map(m => m.word.length));
}