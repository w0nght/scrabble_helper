let lengthSlider = null;

export function initializeSlider() {
    lengthSlider = document.getElementById('lengthRange');
    if (!lengthSlider) return;

    noUiSlider.create(lengthSlider, {
        start: [2, 8],
        connect: true,
        step: 1,
        range: { min: 2, max: 15 },
        behaviour: 'smooth-steps-tap-snap',
        tooltips: true,
        format: {
            to: value => Math.round(value),
            from: value => Number(value)
        },
        pips: { mode: 'count', values: 3, density: 3 }
    });

    const minValueLabel = document.getElementById('minLengthValue');
    const maxValueLabel = document.getElementById('maxLengthValue');

    lengthSlider.noUiSlider.on('update', (values) => {
        if (minValueLabel) minValueLabel.textContent = values[0];
        if (maxValueLabel) maxValueLabel.textContent = values[1];
    });
}

export function getLengthRange() {
    if (!lengthSlider || !lengthSlider.noUiSlider) {
        return [2, 15];
    }
    return lengthSlider.noUiSlider.get().map(Number);
}

export function setLengthRange(min, max) {
    if (!lengthSlider || !lengthSlider.noUiSlider) return;
    lengthSlider.noUiSlider.set([min, max]);
}

export function setDefaultRangeFromInput() {
    if (!lengthSlider || !lengthSlider.noUiSlider) return;
    const letters = document.getElementById('letters')?.value?.toUpperCase().replace(/[^A-Z]/g, '') || '';
    const toggleActive = document.querySelector('#wildcardToggle .toggle-btn.active');
    const wildcards = toggleActive ? parseInt(toggleActive.textContent.trim(), 10) : parseInt(document.getElementById('wildcardCount')?.value || '0');
    const total = letters.length + wildcards;

    const newMax = Math.min(15, Math.max(3, total));
    const [currentMin, currentMax] = lengthSlider.noUiSlider.get().map(Number);

    const newMin = Math.min(currentMin, newMax - 1);
    const adjustedMax = Math.max(newMin + 1, newMax);
    lengthSlider.noUiSlider.set([newMin, adjustedMax]);
}

export function updateSliderFromInput() {
    if (!lengthSlider || !lengthSlider.noUiSlider) return;
    const letters = document.getElementById('letters')?.value?.toUpperCase().replace(/[^A-Z]/g, '') || '';
    const toggleActive = document.querySelector('#wildcardToggle .toggle-btn.active');
    const wildcards = toggleActive ? parseInt(toggleActive.textContent.trim(), 10) : parseInt(document.getElementById('wildcardCount')?.value || '0');
    const total = letters.length + wildcards;

    const newMax = Math.min(15, Math.max(3, total));
    const current = lengthSlider.noUiSlider.get().map(Number);

    lengthSlider.noUiSlider.set([
        Math.min(current[0], newMax - 1),
        newMax
    ]);
}


