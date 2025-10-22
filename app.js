import { initializeTheme } from './js/theme.js';
import { initializeSideMenu } from './js/sideMenu.js';
import { initializeDictionary, switchDictionary, getCurrentWords } from './js/dictionary.js';
import { initializeDropdowns, updateDropdownLabel, setDropdownSelected } from './js/dropdown.js';
import { searchWords, sortMatches, validateInput, getLongestWordLength } from './js/search.js';
import { getWordScore, getScoreStats } from './js/scoring.js';
import { initializeInputHandlers, getFilterValues, setFormDisabled } from './js/inputHandler.js';
import { initializeSlider, getLengthRange, setLengthRange, setDefaultRangeFromInput, updateSliderFromInput } from './js/slider.js';
import { initializeAnimations, updateFlipTiles } from './js/animations.js';
import { initializeUIControls } from './js/uiControls.js';
import {
  showLoadingState,
  hideLoadingState,
  showEmptyState,
  showResultsHeader,
  clearResults,
  renderBatch,
  showPaginationControls,
  showMoreButton,
  showToast,
  scrollToResults,
  initializeUI
} from './js/ui.js';

// ========================================
// APP STATE
// ========================================
let currentSort = 'score';
let currentMatches = [];
let shownCount = 0;
let isSearching = false;
let hasInteracted = false;

const DISPLAY_LIMIT = 30;
const MIN_FLIP_DURATION = 1400; // Animation duration

// ========================================
// RESULTS RENDERING
// ========================================

/**
 * Render the next batch of results
 */
function renderNextBatch() {
  if (shownCount >= currentMatches.length) {
    showMoreButton(false);
    return;
  }

  const longestLength = getLongestWordLength(currentMatches);
  const newShownCount = renderBatch(currentMatches, shownCount, DISPLAY_LIMIT, longestLength);

  shownCount = newShownCount;

  // Show "Show More" button if there are more results
  showMoreButton(shownCount < currentMatches.length);
}

/**
 * Set up "Show More" button handler
 */
function setupShowMoreButton() {
  const showMoreBtn = document.getElementById('showMoreBtn');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', renderNextBatch);
  }
}

// ========================================
// SEARCH LOGIC
// ========================================

/**
 * Main search function
 * @param {string} mode - 'search' or 'sort'
 */
function findWords(mode = 'search') {
  console.log('🔍 findWords() called. Mode:', mode);

  // Get input values
  const filters = getFilterValues();

  // Validate input (allow wildcard-only searches)
  const validation = validateInput(filters.letters, filters.wildcardCount);
  if (!validation.valid) {
    if (hasInteracted) {
      scrollToResults();
      showEmptyState(validation.error);
    }
    return;
  }

  // Get length range from slider
  let [minLength, maxLength] = getLengthRange();

  // Prevent overlapping searches
  if (isSearching) return;
  isSearching = true;

  // Show loading state
  showLoadingState(mode);
  setFormDisabled(true);
  scrollToResults();

  // Perform search after animation delay
  setTimeout(() => {
    try {
      const dictionary = getCurrentWords();

      // Perform search
      const { matches, stats } = searchWords({
        letters: filters.letters,
        wildcardCount: filters.wildcardCount,
        requiredLetter: filters.requiredLetter,
        requiredPosition: filters.requiredPosition,
        minLength,
        maxLength,
        showAll: filters.showAll,
        dictionary,
        scoreFunction: getWordScore
      });

      // Sort results
      const sortedMatches = sortMatches(matches, currentSort);

      // Hide loading
      hideLoadingState();

      // Handle no results
      if (sortedMatches.length === 0) {
        if (stats.skippedDueToPosition > 0) {
          showEmptyState('No words match the required letter at that position. 😬');
        } else {
          showEmptyState('No matching words found. 😢 Try using more letters or wildcards.');
        }
        isSearching = false;
        setFormDisabled(false);
        return;
      }

      // Display results
      currentMatches = sortedMatches;
      shownCount = 0;

      showResultsHeader(sortedMatches.length);
      clearResults();
      renderNextBatch();

      // Show pagination if needed
      showPaginationControls(sortedMatches.length > DISPLAY_LIMIT);

      // Log score stats
      const scoreStats = getScoreStats(sortedMatches);
      console.log('Score stats:', scoreStats);

      isSearching = false;
      setFormDisabled(false);

    } catch (error) {
      console.error('Search failed:', error);
      hideLoadingState();
      showToast('❌ Something went wrong. Please try again!', 'error');
      isSearching = false;
      setFormDisabled(false);
    }
  }, MIN_FLIP_DURATION);
}

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * Handle form submission
 */
function handleSearchSubmit(e) {
  if (isSearching) return;

  hasInteracted = true;
  console.log('Form submitted');
  findWords('search');

  // Reset interaction flag
  setTimeout(() => {
    hasInteracted = false;
  }, 100);
}

/**
 * Handle dictionary change
 */
async function handleDictionaryChange({ value, label }) {
  try {
    await switchDictionary(value);
    updateDropdownLabel('dictToggle', 'selectedDict', label);
    console.log('Switched dictionary:', value);

    // Re-search if there are current results
    if (currentMatches.length > 0) {
      findWords('search');
    }
  } catch (error) {
    console.error('Failed to switch dictionary:', error);
    showToast('❌ Failed to load dictionary. Please try again.', 'error');
  }
}

/**
 * Handle sort change
 */
function handleSortChange({ value, label }) {
  currentSort = value;
  updateDropdownLabel('dropdownToggle', 'selectedOption', label);

  // Re-sort if there are current results
  if (currentMatches.length > 0) {
    findWords('sort');
  }
}

/**
 * Handle letters input change
 */
function handleLettersChange(letters) {
  // Update length slider range if function exists
  if (typeof setDefaultRangeFromInput === 'function') {
    setDefaultRangeFromInput();
  }
  // Refresh summary when letters change
  if (typeof updateSummaryLabel === 'function') {
    updateSummaryLabel();
  }
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the application
 */
async function init() {
  console.log('🚀 Initializing Scrabble Helper...');

  // Initialize UI
  initializeUI();

  // Initialize UI modules
  initializeTheme();
  initializeSideMenu();
  initializeSlider();
  initializeAnimations();
  initializeUIControls();

  // Initialize dictionary (async - must wait)
  await initializeDictionary();

  // Initialize dropdowns
  initializeDropdowns({
    'sortDropdown': handleSortChange,
    'dictDropdown': handleDictionaryChange
  });

  // Ensure current dictionary is reflected/bolded in the menu
  const currentDict = document.getElementById('selectedDict')?.textContent?.includes('OTCWL') ? 'otcwl2016' :
    document.getElementById('selectedDict')?.textContent?.includes('SOWPODS') ? 'sowpods' :
      'Collins_2019';
  setDropdownSelected('dictDropdown', { attr: 'data-dict', value: currentDict });

  // Initialize input handlers
  initializeInputHandlers({
    onLettersChange: handleLettersChange,
    onSearch: handleSearchSubmit,
    onSubmit: handleSearchSubmit
  });

  // Set up show more button
  setupShowMoreButton();

  console.log('✅ App initialized successfully');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// === DOM READY INITIALIZATION ===
// it handles direct interactions with the HTML document, like event listeners
window.addEventListener('DOMContentLoaded', () => {

  // === ELEMENT SELECTORS ===
  const selectedOption = document.getElementById("selectedOption");
  const dropdowns = document.querySelectorAll(".dropdown-group");


  const form = document.querySelector('.filters');

  const scrollButtons = document.getElementById("scrollButtons");
  const scrollToTopBtn = document.getElementById("scrollToTop");
  const scrollToResultsBtn = document.getElementById("scrollToResults");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    scrollButtons.classList.toggle("show", y > 200); // only show if scrolled down a bit
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  scrollToResultsBtn.addEventListener("click", () => {
    const anchor = document.getElementById("resultsAnchor");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth" });
    }
  });

});


// Required Letter: only A–Z
document.getElementById("requiredLetter").addEventListener("input", (e) => {
  const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
  e.target.value = cleaned.slice(0, 1); // enforce max 1 letter
});

// Required Position: only 1–12
document.getElementById("requiredPosition").addEventListener("input", (e) => {
  let cleaned = e.target.value.replace(/[^0-9]/g, '');

  if (cleaned !== '') {
    let number = parseInt(cleaned, 10);
    if (number < 1) number = 1;
    if (number > 12) number = 12;
    cleaned = number.toString();
  }

  e.target.value = cleaned;
});

// === Funny rotating intro messages ===
const introMessages = [
  `Think of this as your <strong>totally harmless</strong> Scrabble sidekick — not a cheat, just a really enthusiastic friend who’s great with words. Pop in your letters, maybe a wildcard or two, and let's make some magic happen.`,
  `Not a cheat... just a <em>very helpful</em> coincidence. 🧐 Type in your tiles and let's see what the dictionary gods say.`,
  `We're not saying this is cheating... but your cousin Brian might raise an eyebrow. 😏 Let’s find the best words, shall we?`,
  `This tool isn’t cheating — it’s just <em>optimizing your genius</em>. Input your letters, and we’ll do the heavy lifting.`,
  `Your friendly neighborhood word whisperer. Drop your tiles in — we’ll take it from here. No judgment. 😉`,
  `Shhh... we won’t say anything. Let’s win this game with charm and letters.`,
  `Words are hard. That’s why you brought backup. Welcome aboard.`,
  `This isn't cheating — it's <em>enhanced vocabulary exploration</em>. Totally educational.`,
  `Type your letters in, and let this tool do what it does best: make you look brilliant.`,
  `We won’t tell the Scrabble police if you don’t. 🤫 Type in those tiles!`,
  `Everyone has that one smart friend. This one just lives in your browser.`,
  `Cheating? Nah. It’s called <em>strategic assistance</em> — and it’s fabulous.`,
  `Just you, your letters, and a suspiciously smart web app. Let’s find that bingo, shall we?`,
  `Just between us... this is how legends are made. Quietly. With great words. 😌`,
  `You didn't hear this from me... but seven-letter words just magically happen here.`,
  `Let’s call it... aggressive word support. Totally fair. Probably.`,
  `Technically, you’re still playing Scrabble. You’re just playing it <em>better</em>.`,
  `What happens in this tab... stays in this tab. 🕶️`,
  `It’s not about cheating. It’s about </em>clever resource management</em>.`
];

// Pick one at random on load
const randomIndex = Math.floor(Math.random() * introMessages.length);
document.getElementById("introText").innerHTML = introMessages[randomIndex];