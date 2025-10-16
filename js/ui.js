// DOM manipulation, animations// js/ui.js

/**
 * UI Module
 * Handles all DOM manipulation, rendering, and visual feedback
 */

/**
 * Show loading state with animated tiles
 * @param {string} mode - 'search' or 'sort'
 */
export function showLoadingState(mode = 'search') {
    const resultsContainer = document.getElementById('results');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsBar = document.getElementById('resultsBar');
    const resultsTextLoader = document.getElementById('resultsTextLoader');
    const resultsTileLoader = document.getElementById('resultsTileLoader');
    const showMoreBtn = document.getElementById('showMoreBtn');

    // Clear previous results
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (resultsHeader) resultsHeader.textContent = '';
    if (resultsBar) resultsBar.style.display = 'none';
    if (showMoreBtn) showMoreBtn.style.display = 'none';

    // Show loaders
    if (resultsTextLoader) {
        resultsTextLoader.style.display = 'block';
        resultsTextLoader.textContent = mode === 'sort' ? 'Sorting...' : 'Finding words...';
    }

    if (resultsTileLoader) {
        resultsTileLoader.style.display = 'flex';
    }

    // Update flip tiles if function exists
    if (typeof updateFlipTiles === 'function') {
        updateFlipTiles(mode === 'sort' ? 'SORT!' : 'FLIP!');
    }
}

/**
 * Hide loading state
 */
export function hideLoadingState() {
    const resultsTextLoader = document.getElementById('resultsTextLoader');
    const resultsTileLoader = document.getElementById('resultsTileLoader');

    if (resultsTextLoader) resultsTextLoader.style.display = 'none';
    if (resultsTileLoader) resultsTileLoader.style.display = 'none';
}

/**
 * Show empty state message
 * @param {string} message - Message to display
 */
export function showEmptyState(message) {
    const resultsContainer = document.getElementById('results');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsBar = document.getElementById('resultsBar');

    hideLoadingState();

    if (resultsContainer) resultsContainer.textContent = message;
    if (resultsHeader) resultsHeader.textContent = '';
    if (resultsBar) resultsBar.style.display = 'none';
}

/**
 * Show results header with count
 * @param {number} count - Number of results
 */
export function showResultsHeader(count) {
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsBar = document.getElementById('resultsBar');

    if (resultsHeader) {
        resultsHeader.textContent = `Found ${count} valid word${count !== 1 ? 's' : ''}`;
    }

    if (resultsBar) {
        // Re-initialize visibility after a reset fade-out
        resultsBar.style.removeProperty('transition');
        resultsBar.style.display = 'flex';
        resultsBar.style.opacity = '1';
    }
}

/**
 * Clear results container
 */
export function clearResults() {
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
}

/**
 * Create a word tile element
 * @param {Object} match - Match object with word, score, wildcards
 * @param {number} longestLength - Length of longest word (for sizing)
 * @returns {HTMLElement} Word tile element
 */
export function createWordTile(match) {
    const span = document.createElement('span');

    const formattedChars = match.word
        .split('')
        .map((char, i) => {
            const displayChar = i === 0 ? char.toUpperCase() : char;
            if (match.wildcards && match.wildcards.includes(i)) {
                return `<span class="wildcard">${displayChar}</span>`;
            }
            return displayChar;
        });

    span.innerHTML = formattedChars.join('') + ` <small>${match.score} pts</small>`;
    return span;
}

/**
 * Render a batch of results with staggered animation
 * @param {Array<Object>} matches - Array of match objects
 * @param {number} startIndex - Starting index
 * @param {number} batchSize - Number to render
 * @param {number} longestLength - Length of longest word
 */
export function renderBatch(matches, startIndex = 0, batchSize = 30, longestLength = 15) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;

    const endIndex = Math.min(startIndex + batchSize, matches.length);
    const batch = matches.slice(startIndex, endIndex);

    batch.forEach((match, index) => {
        const span = createWordTile(match);
        span.style.animationDelay = `${index * 40}ms`;
        resultsContainer.appendChild(span);
    });

    return endIndex;
}

/**
 * Show/hide pagination controls
 * @param {boolean} show - Whether to show controls
 */
export function showPaginationControls(show) {
    const paginationControls = document.getElementById('paginationControls');
    if (paginationControls) {
        paginationControls.style.display = show ? 'block' : 'none';
    }
}

/**
 * Show/hide "Show More" button
 * @param {boolean} show - Whether to show button
 */
export function showMoreButton(show) {
    const showMoreBtn = document.getElementById('showMoreBtn');
    if (showMoreBtn) {
        showMoreBtn.style.display = show ? 'block' : 'none';
    }
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'info'
 * @param {number} duration - Duration in ms (0 = no auto-hide)
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Check if toast container exists
    let toastContainer = document.getElementById('toastContainer');

    if (!toastContainer) {
        // Create toast container if it doesn't exist
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-hide if duration is set
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

/**
 * Update result statistics display
 * @param {Object} stats - Statistics object
 */
export function updateResultStats(stats) {
    const statsElement = document.getElementById('resultStats');
    if (!statsElement) return;

    statsElement.innerHTML = `
    <div class="stat">Total: ${stats.total}</div>
    <div class="stat">Max Score: ${stats.maxScore || 0}</div>
    <div class="stat">Avg Score: ${stats.avgScore || 0}</div>
  `;
}

/**
 * Scroll to results section smoothly
 */
export function scrollToResults() {
    const resultsAnchor = document.getElementById('resultsAnchor');
    if (resultsAnchor) {
        resultsAnchor.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Initialize UI module
 */
export function initializeUI() {
    console.log('✅ UI module initialized');
}