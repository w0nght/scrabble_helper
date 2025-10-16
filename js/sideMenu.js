/**
 * Side Menu Module
 * Handles opening, closing, and interaction behaviors for the side navigation menu
 */

// js/sideMenu.js


const MENU_OPEN_CLASS = 'open';

// Cache DOM elements
let menuToggle;
let sideMenu;
let closeMenu;

/**
 * Open the side menu
 */
function openMenu() {
    if (sideMenu) {
        sideMenu.classList.add(MENU_OPEN_CLASS);
    }
}

/**
 * Close the side menu
 */
function closeMenuHandler() {
    if (sideMenu) {
        sideMenu.classList.remove(MENU_OPEN_CLASS);
    }
}

/**
 * Check if the menu is currently open
 * @returns {boolean}
 */
function isMenuOpen() {
    return sideMenu?.classList.contains(MENU_OPEN_CLASS) || false;
}

/**
 * Handle clicks outside the menu to close it
 * @param {MouseEvent} event - Click event
 */
function handleOutsideClick(event) {
    const clickedInsideMenu = sideMenu?.contains(event.target);
    const clickedToggleButton = menuToggle?.contains(event.target);

    if (isMenuOpen() && !clickedInsideMenu && !clickedToggleButton) {
        closeMenuHandler();
    }
}

/**
 * Set up menu toggle button
 */
function setupToggleButton() {
    if (!menuToggle) return;

    menuToggle.addEventListener('click', openMenu);
}

/**
 * Set up close button
 */
function setupCloseButton() {
    if (!closeMenu) return;

    closeMenu.addEventListener('click', closeMenuHandler);
}

/**
 * Set up auto-close on link clicks
 * Useful for single-page apps or smooth scrolling to sections
 */
function setupLinkAutoClose() {
    if (!sideMenu) return;

    const menuLinks = sideMenu.querySelectorAll('a');

    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenuHandler();
        });
    });
}

/**
 * Set up click-outside-to-close behavior
 */
function setupOutsideClickClose() {
    document.addEventListener('click', handleOutsideClick);
}
/**
 * Set up Keyboard Support
 */
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        // Close menu on Escape key
        if (e.key === 'Escape' && isMenuOpen()) {
            closeMenuHandler();
        }
    });
}

/**
 * Initialize side menu
 * Sets up all event listeners and behaviors
 */
export function initializeSideMenu() {
    // Cache DOM elements
    menuToggle = document.getElementById('menuToggle');
    sideMenu = document.getElementById('sideMenu');
    closeMenu = document.getElementById('closeMenu');

    // Validate required elements
    if (!menuToggle || !sideMenu || !closeMenu) {
        console.warn('Side menu elements not found:', {
            menuToggle: !!menuToggle,
            sideMenu: !!sideMenu,
            closeMenu: !!closeMenu
        });
        return;
    }

    // Set up all behaviors
    setupToggleButton();
    setupCloseButton();
    setupLinkAutoClose();
    setupOutsideClickClose();
    setupKeyboardControls()

    console.log('✅ Side menu initialized');
}

