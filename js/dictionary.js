// Dictionary loading, caching, switching
// === CORE DICTIONARY LOGIC ===
// function loadDictionary(dictKey) {
//     // If already loaded, use the cached version
//     if (dictionaryMap[dictKey]) {
//         words = dictionaryMap[dictKey];
//         findWords("search");
//         return;
//     }

//     // Otherwise, fetch and cache it
//     fetch(`./dictionaries/${dictKey}.json`)
//         .then(res => res.json())
//         .then(data => {
//             dictionaryMap[dictKey] = data;
//             words = data;
//             findWords("search");
//         })
//         .catch(err => {
//             console.error("Failed to load dictionary:", dictKey, err);
//         });
// }

// js/dictionary.js

/**
 * Dictionary Module
 * Handles loading, caching, and switching between Scrabble dictionaries
 */

const STORAGE_KEY = 'selectedDict';
const DEFAULT_DICTIONARY = 'Collins_2019';

// Dictionary cache to avoid reloading
const dictionaryCache = {};

// Current state
let currentDictionary = null;
let currentWords = [];

/**
 * Get the saved dictionary preference or default
 * @returns {string} Dictionary name
 */
function getSavedDictionary() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_DICTIONARY;
}

/**
 * Save dictionary preference
 * @param {string} dictName - Dictionary name to save
 */
function saveDictionary(dictName) {
    localStorage.setItem(STORAGE_KEY, dictName);
}

/**
 * Load a dictionary from JSON file
 * @param {string} dictName - Dictionary name (e.g., 'Collins_2019')
 * @returns {Promise<Array>} Array of words
 */
async function fetchDictionary(dictName) {
    try {
        const response = await fetch(`dictionaries/${dictName}.json`);

        if (!response.ok) {
            throw new Error(`Failed to load ${dictName}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.words || data; // Support different JSON structures
    } catch (error) {
        console.error('Error loading dictionary:', error);
        throw error;
    }
}

/**
 * Load a dictionary (with caching)
 * @param {string} dictName - Dictionary name to load
 * @returns {Promise<Array>} Array of words
 */
export async function loadDictionary(dictName) {
    // Check cache first
    if (dictionaryCache[dictName]) {
        console.log(`📖 Dictionary loaded from cache: ${dictName}`);
        currentDictionary = dictName;
        currentWords = dictionaryCache[dictName];
        return currentWords;
    }

    console.log(`📥 Loading dictionary: ${dictName}...`);

    try {
        const words = await fetchDictionary(dictName);

        // Cache it
        dictionaryCache[dictName] = words;
        currentDictionary = dictName;
        currentWords = words;

        console.log(`✅ Dictionary loaded: ${dictName} (${words.length} words)`);
        return words;
    } catch (error) {
        console.error(`❌ Failed to load dictionary: ${dictName}`, error);
        throw error;
    }
}

/**
 * Switch to a different dictionary
 * @param {string} dictName - Dictionary name to switch to
 * @returns {Promise<Array>} Array of words from new dictionary
 */
export async function switchDictionary(dictName) {
    if (dictName === currentDictionary) {
        console.log('Already using this dictionary');
        return currentWords;
    }

    await loadDictionary(dictName);
    saveDictionary(dictName);

    return currentWords;
}

/**
 * Get currently loaded dictionary name
 * @returns {string} Current dictionary name
 */
export function getCurrentDictionary() {
    return currentDictionary;
}

/**
 * Get current words array
 * @returns {Array} Current dictionary words
 */
export function getCurrentWords() {
    return currentWords;
}

/**
 * Get available dictionaries
 * @returns {Array<Object>} Array of {name, label} objects
 */
export function getAvailableDictionaries() {
    return [
        { name: 'Collins_2019', label: 'Collins 2019' },
        { name: 'OTCWL_2016', label: 'OTCWL 2016' },
        { name: 'SOWPODS', label: 'SOWPODS' }
    ];
}

/**
 * Update the dictionary dropdown UI to show current selection
 * @param {string} dictName - Dictionary name
 */
function updateDictionaryUI(dictName) {
    const selectedLabel = document.getElementById('selectedDict');
    const menuItem = document.querySelector(`#dictMenu li[data-dict="${dictName}"]`);

    if (selectedLabel && menuItem) {
        selectedLabel.textContent = menuItem.textContent;
    }
}

/**
 * Initialize dictionary system
 * - Load saved dictionary
 * - Update UI to show current selection
 */
export async function initializeDictionary() {
    const savedDict = getSavedDictionary();

    try {
        await loadDictionary(savedDict);
        updateDictionaryUI(savedDict);
        console.log('✅ Dictionary module initialized');
    } catch (error) {
        console.error('Failed to initialize dictionary:', error);
        // Try falling back to default
        if (savedDict !== DEFAULT_DICTIONARY) {
            console.log(`Falling back to ${DEFAULT_DICTIONARY}...`);
            await loadDictionary(DEFAULT_DICTIONARY);
            updateDictionaryUI(DEFAULT_DICTIONARY);
        }
    }
}

/**
 * Check if a dictionary is cached
 * @param {string} dictName - Dictionary name
 * @returns {boolean}
 */
export function isCached(dictName) {
    return !!dictionaryCache[dictName];
}

/**
 * Get cache statistics (useful for debugging)
 * @returns {Object} Cache info
 */
export function getCacheInfo() {
    return {
        cached: Object.keys(dictionaryCache),
        count: Object.keys(dictionaryCache).length,
        currentDictionary,
        wordCount: currentWords.length
    };
}
