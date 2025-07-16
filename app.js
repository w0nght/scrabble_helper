let words = [];

fetch("Collins_2019.json")
  .then(res => res.json())
  .then(data => {
    words = data;
    console.log("Dictionary loaded:", words.length);
  });

const letterScores = {
  A: 1, B: 3, C: 3, D: 2, E: 1,
  F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1,
  P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4,
  Z: 10
};

function getWordScore(word) {
  return word.split('').reduce((sum, char) => sum + (letterScores[char.toUpperCase()] || 0), 0);
}

function matchRequiredPosition(word, letter, pos) {
  if (!letter || !pos) return true;
  const index = parseInt(pos) - 1;
  return word[index] === letter;
}

// Update labels and prevent overlap - Dual-range slider 
function updateLengthLabels() {
  const minSlider = document.getElementById("minLength");
  const maxSlider = document.getElementById("maxLength");
  let minVal = parseInt(minSlider.value);
  let maxVal = parseInt(maxSlider.value);

  // Prevent overlap
  if (minVal >= maxVal) {
    if (event?.target === minSlider) {
      minVal = maxVal - 1;
      minSlider.value = minVal;
    } else {
      maxVal = minVal + 1;
      maxSlider.value = maxVal;
    }
  }

  // Update labels
  document.getElementById("minLengthLabel").textContent = minVal;
  document.getElementById("maxLengthLabel").textContent = maxVal;

  // Calculate percentage positions for highlight bar
  const minPercent = ((minVal - 2) / (15 - 2)) * 100;
  const maxPercent = ((maxVal - 2) / (15 - 2)) * 100;

  const slider = document.querySelector(".range-slider");
  slider.style.setProperty('--min-percent', `${minPercent}%`);
  slider.style.setProperty('--max-percent', `${maxPercent}%`);


  updateSummaryLabel?.();
}

// Dynamically Set Default Range from Input when users type in the #letters input
function setDefaultRangeFromInput() {
  const input = document.getElementById("letters").value.toUpperCase().replace(/[^A-Z]/g, '');
  const wildcardCount = parseInt(document.getElementById("wildcardCount").value || "0");
  const totalLetters = input.length + wildcardCount;

  const min = 2;
  const max = Math.min(15, totalLetters);

  document.getElementById("minLength").value = min;
  document.getElementById("maxLength").value = Math.max(min + 1, max);

  updateLengthLabels();
}


// Wildcard group button listener
function setWildcard(button, count) {
  const group = button.parentElement;
  const buttons = group.querySelectorAll(".toggle-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  document.getElementById("wildcardCount").value = count;
  console.log("wildcardCount:", count);

  // ✅ Update the range slider based on new wildcard count
  setDefaultRangeFromInput();
  updateSummaryLabel();
}

function updateSummaryLabel() {
  const min = parseInt(document.getElementById("minLength").value);
  const max = parseInt(document.getElementById("maxLength").value);
  const wildcardCount = parseInt(document.getElementById("wildcardCount").value || "0");
  const showAll = document.getElementById("showAll").checked;

  let text = "";

  if (showAll) {
    text = `Showing all suggestions (ignoring length filter), using ${wildcardCount} wildcard${wildcardCount !== 1 ? "s" : ""}`;
  } else {
    text = `Searching for words between ${min} and ${max} letters with ${wildcardCount} wildcard${wildcardCount !== 1 ? "s" : ""}`;
  }
  console.log("summaryLabel:", text);
  console.log("min:", min);
  console.log("max:", max);

  document.getElementById("summaryLabel").textContent = text;
}


function findWords() {
  // 1. Get inputs and elements
  const input = document.getElementById("letters").value.toUpperCase().replace(/[^A-Z]/g, '');
  const wildcardCount = parseInt(document.getElementById("wildcardCount").value || "0");
  const requiredLetter = document.getElementById("requiredLetter").value.toUpperCase();
  const requiredPosition = parseInt(document.getElementById("requiredPosition").value);
  const showAll = document.getElementById("showAll").checked;

  const minLength = parseInt(document.getElementById("minLength").value);
  const maxLength = parseInt(document.getElementById("maxLength").value);

  const allLetters = input + '?'.repeat(wildcardCount);
  const availableLetters = allLetters.split('');

  // 2. Get DOM elements
  const resultsContainer = document.getElementById("results");
  const resultsHeader = document.getElementById("resultsHeader");
  const resultsBar = document.getElementById("resultsBar");
  const resultsTextLoader = document.getElementById("resultsTextLoader");
  const resultsTileLoader = document.getElementById("resultsTileLoader");
  const MIN_FLIP_DURATION = 1400; // total time to let tiles animate. Adjust delay duration to simulate processing time

  // 3. Prepare UI
  resultsContainer.innerHTML = '';
  resultsHeader.textContent = '';
  resultsBar.style.display = "none";
  resultsTextLoader.style.display = "block"; // show loading spinner
  resultsTileLoader.style.display = "flex"; // show loading flipping tile

  // Scroll BEFORE results are calculated
  document.getElementById("resultsAnchor").scrollIntoView({ behavior: "smooth" });

  // 4. Delay to simulate "thinking time"
  setTimeout(() => {
    const matches = [];

    // 5. Match words from dictionary
    for (const word of words) {
      // Filter by word length if "Show All" is not checked
      if (!showAll && (word.length < minLength || word.length > maxLength)) {
        continue;
      }

      // Check required letter at a position (if specified)
      if (!matchRequiredPosition(word, requiredLetter, requiredPosition)) continue;

      // Handle letter matching with wildcards
      const tempLetters = [...availableLetters];
      const wordLetters = word.toUpperCase().split('');
      const wildcardIndices = [];
      let valid = true;

      for (let i = 0; i < wordLetters.length; i++) {
        const letter = wordLetters[i];
        const idx = tempLetters.indexOf(letter);

        if (idx !== -1) {
          tempLetters.splice(idx, 1); // Use the letter
        } else {
          const wildIdx = tempLetters.indexOf('?');
          if (wildIdx !== -1) {
            wildcardIndices.push(i); // Track wildcard positions
            tempLetters.splice(wildIdx, 1);
          } else {
            valid = false; // Letter not available at all
            break;
          }
        }
      }

      // Add valid word to matches
      if (valid) {
        matches.push({
          word,
          wildcards: wildcardIndices,
          score: getWordScore(word)
        });
      }
    }

    // 6. Sort matches if a sort option is selected
    const sortBy = document.getElementById("sortBy").value;
    if (sortBy === "score") {
      matches.sort((a, b) => b.score - a.score);
    } else if (sortBy === "length") {
      matches.sort((a, b) => b.word.length - a.word.length);
    } else if (sortBy === "alpha") {
      matches.sort((a, b) => a.word.localeCompare(b.word));
    }

    // 7. Hide loader only after full flip is done
    resultsTextLoader.style.display = "none";
    resultsTileLoader.style.display = "none";

    // 8. Handle no matches
    if (matches.length === 0) {
      resultsBar.style.display = "none";
      resultsContainer.textContent = "No matching words found. 😢";
      return;
    }

    // 9. Update results header
    resultsBar.style.display = "flex";
    resultsHeader.textContent = `Found ${matches.length} valid word${matches.length !== 1 ? 's' : ''}`;

    // 10. Display results with fade-in animation
    const longestWordLength = Math.max(...matches.map(m => m.word.length));

    matches.forEach((match, index) => {
      const span = document.createElement("span");

      // Highlight wildcards
      span.innerHTML = match.word
        .split('')
        .map((char, i) => match.wildcards.includes(i)
          ? `<span class="wildcard">${char}</span>`
          : char
        )
        .join('') + ` <small>${match.score} pts</small>`;

      // Mark high score words if desired
      if (!showAll && match.word.length === longestWordLength) {
        span.classList.add("high-score");
      }

      // Animate each result
      span.style.animationDelay = `${index * 40}ms`;
      resultsContainer.appendChild(span);
    });
  }, MIN_FLIP_DURATION); // wait this long before rendering anything
}

document.getElementById("letters").addEventListener("input", (e) => {
  // Allow only A-Z letters, uppercase automatically
  const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
  e.target.value = cleaned;

  // Update the min/max range based on total letters + wildcards
  setDefaultRangeFromInput();
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

// reset - start over button
function resetAllFilters() {
  const resultsArea = document.getElementById("results");

  // Trigger wipe animation on results
  resultsArea.classList.add("wipe-out");

  // Delay reset until animation completes
  setTimeout(() => {
    // Reset input state
    document.getElementById("letters").value = "";
    document.getElementById("minLength").value = "2";
    document.getElementById("maxLength").value = "5";
    // document.getElementById("wordLength").value = 5;
    // document.getElementById("lengthMode").value = "greater";
    document.getElementById("requiredLetter").value = "";
    document.getElementById("requiredPosition").value = "";
    document.getElementById("wildcardCount").value = 0;
    document.getElementById("showAll").checked = false;
    document.getElementById("sortBy").value = "none";

    // Reset toggle states
    document.querySelectorAll(".toggle-group").forEach(group => {
      const buttons = group.querySelectorAll(".toggle-btn");
      buttons.forEach(btn => btn.classList.remove("active"));
      buttons[0]?.classList.add("active");
    });

    // Clear results and update summary
    clearResults();
    updateSummaryLabel();

    // Remove animation class and restore visibility
    resultsArea.classList.remove("wipe-out");

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 400); // Matches CSS animation duration
}


function clearResults() {
  document.getElementById("results").innerHTML = '';
  document.getElementById("resultsHeader").textContent = '';
  document.getElementById("resultsBar").style.display = "none";
}


// Dark theme logic
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const isDark = currentTheme === 'dark';

  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌞' : '🌙';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggle.textContent = saved === 'dark' ? '🌙' : '🌞';

  updateSummaryLabel();

  // To stagger each tile’s flip nicely, assign animation delays on page load:
  document.querySelectorAll(".flip-tile").forEach((tile, i) => {
    tile.style.setProperty("--i", i);
  });
});

// Open/Close Menu logic
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const closeMenu = document.getElementById("closeMenu");

menuToggle.addEventListener("click", () => {
  sideMenu.classList.add("open");
});

closeMenu.addEventListener("click", () => {
  sideMenu.classList.remove("open");
});

// Optional: Close menu when a link is clicked
sideMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    sideMenu.classList.remove("open");
  });
});

// Version Info
fetch('https://api.github.com/repos/w0nght/scrabble_helper/tags')
  .then(res => res.json())
  .then(tags => {
    if (tags.length > 0) {
      document.getElementById('version').innerHTML = `Version: ${tags[0].name} | &copy; 2025 Joey Wong`;
    } else {
      document.getElementById('version').innerHTML = "Version: dev | &copy; 2025 Joey Wong`";
    }
  })
  .catch(() => {
    console.error('Error fetching version:', error);
    document.getElementById('version').innerHTML = "Version: offline | &copy; 2025 Joey Wong";
  });