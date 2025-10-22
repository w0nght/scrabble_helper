import { getLengthRange, setLengthRange, setDefaultRangeFromInput } from './slider.js';
import { clearResults, showMoreButton } from './ui.js';

function updateSummaryLabel() {
    const [min, max] = getLengthRange();
    const wildcardCount = parseInt(document.getElementById('wildcardCount').value || '0');
    const showAll = document.getElementById('showAll').checked;

    let text = '';
    if (showAll) {
        text = `Showing all suggestions (ignoring length filter), using ${wildcardCount} wildcard${wildcardCount !== 1 ? 's' : ''}`;
    } else {
        const wildcardText = `with ${wildcardCount} wildcard${wildcardCount !== 1 ? 's' : ''}`;
        text = (min === max)
            ? `Searching for ${min}-letter words ${wildcardText}`
            : `Searching for words between ${min} and ${max} letters ${wildcardText}`;
    }
    const el = document.getElementById('summaryLabel');
    if (el) el.textContent = text;
}

function setWildcard(button, count) {
    const group = button.parentElement;
    const buttons = group.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    document.getElementById('wildcardCount').value = count;
    updateSummaryLabel();
    setDefaultRangeFromInput();
}

function resetAllFilters() {
    const resultsArea = document.getElementById('results');
    const resultsBar = document.getElementById('resultsBar');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');
    resultsArea?.classList.add('wipe-out');

    setTimeout(() => {
        const lettersInput = document.getElementById('letters');
        const reqLetter = document.getElementById('requiredLetter');
        const reqPos = document.getElementById('requiredPosition');
        const wildcardCount = document.getElementById('wildcardCount');
        const showAll = document.getElementById('showAll');

        if (lettersInput) lettersInput.value = '';
        if (reqLetter) reqLetter.value = '';
        if (reqPos) reqPos.value = '';
        if (wildcardCount) wildcardCount.value = 0;
        if (showAll) showAll.checked = false;

        setLengthRange(3, 8);

        document.querySelectorAll('.toggle-group').forEach(group => {
            const buttons = group.querySelectorAll('.toggle-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            if (buttons[0]) buttons[0].classList.add('active');
        });

        // Close any open dropdowns and ease out results bar
        dropdownMenus.forEach(menu => menu.classList.remove('show'));
        if (resultsBar) {
            resultsBar.style.transition = 'opacity 200ms ease';
            resultsBar.style.opacity = '0';
            // also hide after fade
            setTimeout(() => { if (resultsBar) resultsBar.style.display = 'none'; }, 210);
        }

        clearResults();
        showMoreButton(false); // Hide Show More button on reset
        updateSummaryLabel();

        resultsArea?.classList.remove('wipe-out');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
}

function initializeInputConstraints() {
    const reqLetter = document.getElementById('requiredLetter');
    if (reqLetter) {
        reqLetter.addEventListener('input', (e) => {
            const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
            e.target.value = cleaned.slice(0, 1);
        });
    }

    const reqPos = document.getElementById('requiredPosition');
    if (reqPos) {
        reqPos.addEventListener('input', (e) => {
            let cleaned = e.target.value.replace(/[^0-9]/g, '');
            if (cleaned !== '') {
                let number = parseInt(cleaned, 10);
                if (number < 1) number = 1;
                if (number > 12) number = 12;
                cleaned = number.toString();
            }
            e.target.value = cleaned;
        });
    }
}

function initializeScrollButtons() {
    const scrollButtons = document.getElementById('scrollButtons');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    const scrollToResultsBtn = document.getElementById('scrollToResults');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (scrollButtons) scrollButtons.classList.toggle('show', y > 200);
    });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (scrollToResultsBtn) {
        scrollToResultsBtn.addEventListener('click', () => {
            const anchor = document.getElementById('resultsErrorHandlerAnchor');
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

export function initializeUIControls() {
    // Initialize inputs and scroll UI
    initializeInputConstraints();
    initializeScrollButtons();

    // Initial summary
    updateSummaryLabel();

    // Expose for inline HTML
    window.updateSummaryLabel = updateSummaryLabel;
    window.setWildcard = setWildcard;
    window.resetAllFilters = resetAllFilters;
}