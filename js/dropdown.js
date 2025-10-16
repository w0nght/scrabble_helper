/**
 * Dropdown Module
 * Generic dropdown UI behavior - handles opening, closing, and selection
 * Works for any dropdown (dictionary, sort, etc.)
 */

const OPEN_CLASS = 'open';
const SHOW_CLASS = 'show';
const SELECTED_CLASS = 'selected';
const DISABLED_CLASS = 'disabled';

/**
 * Close a specific dropdown
 * @param {HTMLElement} toggle - Dropdown toggle button
 * @param {HTMLElement} menu - Dropdown menu
 */
function closeDropdown(toggle, menu) {
    if (menu) menu.classList.remove(SHOW_CLASS);
    if (toggle) toggle.classList.remove(OPEN_CLASS);
}

/**
 * Open a specific dropdown
 * @param {HTMLElement} toggle - Dropdown toggle button
 * @param {HTMLElement} menu - Dropdown menu
 */
function openDropdown(toggle, menu) {
    if (menu) menu.classList.add(SHOW_CLASS);
    if (toggle) toggle.classList.add(OPEN_CLASS);
}

/**
 * Toggle dropdown open/closed
 * @param {HTMLElement} toggle - Dropdown toggle button
 * @param {HTMLElement} menu - Dropdown menu
 */
function toggleDropdown(toggle, menu) {
    const isOpen = menu?.classList.contains(SHOW_CLASS);

    if (isOpen) {
        closeDropdown(toggle, menu);
    } else {
        openDropdown(toggle, menu);
    }
}

/**
 * Highlight selected item in menu
 * @param {HTMLElement} menu - Dropdown menu
 * @param {HTMLElement} selectedItem - Item to highlight
 */
function highlightSelected(menu, selectedItem) {
    // Remove previous selection
    menu.querySelectorAll('li').forEach(li => {
        li.classList.remove(SELECTED_CLASS);
    });

    // Add to new selection
    if (selectedItem) {
        selectedItem.classList.add(SELECTED_CLASS);
    }
}

/**
 * Update dropdown toggle label
 * @param {HTMLElement} labelElement - Element displaying the label
 * @param {string} text - New label text
 */
function updateLabel(labelElement, text) {
    if (labelElement) {
        labelElement.textContent = text;
    }
}

/**
 * Set up a single dropdown
 * @param {Object} config - Dropdown configuration
 * @param {HTMLElement} config.container - Dropdown container element
 * @param {Function} config.onSelect - Callback when item is selected
 */
function setupDropdown({ container, onSelect }) {
    const toggle = container.querySelector('.dropdown-toggle');
    const menu = container.querySelector('.dropdown-menu');

    if (!toggle || !menu) {
        console.warn('Dropdown missing toggle or menu:', container);
        return;
    }

    // Skip if disabled
    if (toggle.classList.contains(DISABLED_CLASS)) {
        return;
    }

    // Toggle on click
    toggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent immediate outside click
        toggleDropdown(toggle, menu);
    });

    // Handle item selection
    menu.addEventListener('click', (e) => {
        const item = e.target.closest('li');

        if (!item || item.classList.contains(DISABLED_CLASS)) {
            return;
        }

        const value = item.getAttribute('data-value') || item.getAttribute('data-dict');
        const label = item.textContent.trim();

        // Highlight selected
        highlightSelected(menu, item);

        // Close dropdown
        closeDropdown(toggle, menu);

        // Trigger callback
        if (onSelect && value) {
            onSelect({
                value,
                label,
                item,
                toggle,
                menu
            });
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            closeDropdown(toggle, menu);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains(SHOW_CLASS)) {
            closeDropdown(toggle, menu);
        }
    });
}

/**
 * Initialize all dropdowns on the page
 * @param {Object} handlers - Map of dropdown IDs to their select handlers
 * 
 * Example:
 * initializeDropdowns({
 *   'sortDropdown': ({ value, label }) => { ... },
 *   'dictDropdown': ({ value, label }) => { ... }
 * })
 */
export function initializeDropdowns(handlers = {}) {
    const dropdowns = document.querySelectorAll('.dropdown-group');

    if (dropdowns.length === 0) {
        console.warn('No dropdowns found with .dropdown-group class');
        return;
    }

    dropdowns.forEach(dropdown => {
        const dropdownId = dropdown.id || dropdown.getAttribute('data-dropdown');
        const onSelect = handlers[dropdownId];

        setupDropdown({
            container: dropdown,
            onSelect
        });
    });

    console.log(`✅ Initialized ${dropdowns.length} dropdown(s)`);
}

/**
 * Manually update a dropdown's selected label
 * @param {string} toggleId - ID of the toggle button
 * @param {string} labelId - ID of the label element
 * @param {string} text - New label text
 */
export function updateDropdownLabel(toggleId, labelId, text) {
    const labelElement = document.getElementById(labelId);
    updateLabel(labelElement, text);
}

/**
 * Programmatically close all dropdowns
 */
export function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(container => {
        const toggle = container.querySelector('.dropdown-toggle');
        const menu = container.querySelector('.dropdown-menu');
        closeDropdown(toggle, menu);
    });
}