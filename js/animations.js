export function initializeAnimations() {
    // Stagger tile animation indices on page load
    document.querySelectorAll('.flip-tile').forEach((tile, i) => {
        tile.style.setProperty('--i', i);
    });
}

export function updateFlipTiles(message) {
    const tileLoader = document.getElementById('resultsTileLoader');
    if (!tileLoader) return;

    tileLoader.innerHTML = '';
    [...message].forEach((char, i) => {
        const tile = document.createElement('div');
        tile.className = 'flip-tile';
        tile.textContent = char;
        tile.style.setProperty('--i', i);
        tileLoader.appendChild(tile);
    });
}


