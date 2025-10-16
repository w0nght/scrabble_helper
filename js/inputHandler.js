/**
 * Input Handler Module
 * Manages form inputs, validation, and user interactions
 */

import { sanitizeInput } from './search.js';

/**
 * Set up letter input field
 * - Auto-uppercase
 * - Allow only A-Z
 * - Trigger callbacks on change
 */
export function setupLetterInput(inputId, callbacks = {}) {
    const input = document.getElementById(inputId);

    if (!input) {
        console.warn(`Letter input #${inputId} not found`);
        return;
    }

    input.addEventListener('input', (e) => {
        // Sanitize and update value
        const cleaned = sanitizeInput(e.target.value);
        e.target.value = cleaned;

        // Trigger callback if provided
        if (callbacks.onChange) {
            callbacks.onChange(cleaned);
        }
    });

    // Allow Enter key to trigger search
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && callbacks.onEnter) {
            e.preventDefault();
            callbacks.onEnter();
        }
    });

    console.log('✅ Letter input initialized');
}

/**
 * Set up form submission handler
 * @param {string} formId - Form element ID
 * @param {Function} onSubmit - Callback when form is submitted
 */
export function setupFormSubmit(formId, onSubmit) {
    const form = document.getElementById(formId) || document.querySelector('form.filters');

    if (!form) {
        console.warn(`Form #${formId} not found; falling back to .filters selector also failed.`);
        return;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (onSubmit) {
            onSubmit(e);
        }
    });

    console.log('✅ Form submit handler initialized');
}

/**
 * Get all filter values from the form
 * @returns {Object} Filter values
 */
export function getFilterValues() {
    const toggleActive = document.querySelector('#wildcardToggle .toggle-btn.active');
    const wildcardFromToggle = toggleActive ? parseInt(toggleActive.textContent.trim(), 10) : NaN;
    const wildcardHidden = parseInt(document.getElementById('wildcardCount')?.value || '0');

    return {
        letters: document.getElementById('letters')?.value.toUpperCase().replace(/[^A-Z]/g, '') || '',
        wildcardCount: Number.isNaN(wildcardFromToggle) ? wildcardHidden : wildcardFromToggle,
        requiredLetter: document.getElementById('requiredLetter')?.value.toUpperCase() || '',
        requiredPosition: parseInt(document.getElementById('requiredPosition')?.value || '0'),
        showAll: document.getElementById('showAll')?.checked || false
    };
}

/**
 * Parse required letter and position from combined input
 * E.g., "A3" -> { letter: 'A', position: 3 }
 * @param {string} input - Combined input like "A3"
 * @returns {Object} { letter: string, position: number }
 */
export function parseRequiredLetterPosition(input) {
    if (!input || input.trim() === '') {
        return { letter: '', position: 0 };
    }

    const match = input.trim().toUpperCase().match(/^([A-Z])(\d+)$/);

    if (!match) {
        console.warn(`Invalid required letter/position format: ${input}`);
        return { letter: '', position: 0 };
    }

    return {
        letter: match[1],
        position: parseInt(match[2])
    };
}

/**
 * Set up required letter/position input with validation
 * @param {string} inputId - Input element ID
 */
export function setupRequiredPositionInput(inputId) {
    const input = document.getElementById(inputId);

    if (!input) {
        console.warn(`Required position input #${inputId} not found`);
        return;
    }

    input.addEventListener('input', (e) => {
        // Allow only letter followed by number (e.g., A3, B10)
        const value = e.target.value.toUpperCase();
        const cleaned = value.replace(/[^A-Z0-9]/g, '');
        e.target.value = cleaned;

        // Visual feedback for valid format
        const isValid = /^[A-Z]\d+$/.test(cleaned) || cleaned === '';
        input.classList.toggle('invalid', cleaned !== '' && !isValid);
    });

    console.log('✅ Required position input initialized');
}

/**
 * Disable/enable form during search
 * @param {boolean} disabled - Whether to disable inputs
 */
export function setFormDisabled(disabled) {
    const form = document.getElementById('searchForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, button, select');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

/**
 * Clear all form inputs
 */
export function clearForm() {
    document.getElementById('letters').value = '';
    document.getElementById('wildcardCount').value = '0';
    document.getElementById('requiredLetter').value = '';
    document.getElementById('requiredPosition').value = '';
    document.getElementById('showAll').checked = false;
}

/**
 * Initialize all input handlers
 * @param {Object} callbacks - Event callbacks
 */
export function initializeInputHandlers(callbacks = {}) {
    setupLetterInput('letters', {
        onChange: callbacks.onLettersChange,
        onEnter: callbacks.onSearch
    });

    setupFormSubmit('searchForm', callbacks.onSubmit);

    if (document.getElementById('requiredLetter')) {
        setupRequiredPositionInput('requiredLetter');
    }

    console.log('✅ Input handlers initialized');
}
