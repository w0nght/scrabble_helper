/**
 * Theme Module
 * Handles light/dark theme switching with localStorage persistence
 */

const THEME_KEY = 'theme';
const THEME_ATTRIBUTE = 'data-theme';
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};
const ICONS = {
    LIGHT: '🌞',
    DARK: '🌙'
};

/**
 * Get the saved theme from localStorage or default to light
 * @returns {string} Theme name ('light' or 'dark')
 */
function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || THEMES.LIGHT;
}

/**
 * Apply theme to the document
 * @param {string} theme - Theme name to apply
 */
function applyTheme(theme) {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

/**
 * Save theme preference to localStorage
 * @param {string} theme - Theme name to save
 */
function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}

/**
 * Update toggle button icon based on current theme
 * @param {HTMLElement} button - Theme toggle button
 * @param {string} theme - Current theme name
 */
function updateToggleIcon(button, theme) {
    button.textContent = theme === THEMES.DARK ? ICONS.DARK : ICONS.LIGHT;
}

/**
 * Toggle between light and dark themes
 * @param {HTMLElement} button - Theme toggle button
 */
function handleToggle(button) {
    const currentTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE);
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;

    applyTheme(newTheme);
    saveTheme(newTheme);
    updateToggleIcon(button, newTheme);
}

/**
 * Initialize theme system
 * - Applies saved theme preference
 * - Sets up theme toggle button listener
 */
export function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');

    if (!themeToggle) {
        console.warn('Theme toggle button (#themeToggle) not found');
        return;
    }

    // Apply saved theme
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    updateToggleIcon(themeToggle, savedTheme);

    // Set up toggle listener
    themeToggle.addEventListener('click', () => handleToggle(themeToggle));

    console.log('✅ Theme module initialized:', savedTheme);
}