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

// word length group button listener
function setMode(button) {
  const group = button.parentElement;
  const buttons = group.querySelectorAll(".toggle-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  document.getElementById("lengthMode").value = button.getAttribute("data-mode");
  console.log("lengthMode:", button.dataset.mode);
  updateLengthDisplay();
  updateSummaryLabel();
}

// Wildcard group button listener
function setWildcard(button, count) {
  const group = button.parentElement;
  const buttons = group.querySelectorAll(".toggle-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  document.getElementById("wildcardCount").value = count;
  console.log("wildcardCount:", count);
  updateSummaryLabel();
}

function updateLengthDisplay() {
  updateLengthExplanation();
  updateSummaryLabel();
}

function updateLengthExplanation() {
  const length = document.getElementById("wordLength").value;
  const mode = document.getElementById("lengthMode").value;

  const modeText = {
    greater: "greater than or equal to",
    less: "less than or equal to",
    equal: "exactly"
  };

  const label = document.getElementById("lengthDynamic");
  label.textContent = ` ${length}`;
}

function updateSummaryLabel() {
  const length = parseInt(document.getElementById("wordLength").value);
  const mode = document.getElementById("lengthMode").value;
  const wildcardCount = parseInt(document.getElementById("wildcardCount").value || "0");
  const showAll = document.getElementById("showAll").checked;

  const modeSymbol = {
    greater: "≥",
    less: "≤",
    equal: "="
  }[mode];

  let text = "";

  if (showAll) {
    text = `Showing all suggestions (ignoring length filter), using ${wildcardCount} wildcard${wildcardCount !== 1 ? "s" : ""}`;
  } else {
    text = `Searching for words ${modeSymbol} ${length} letters with ${wildcardCount} wildcard${wildcardCount !== 1 ? "s" : ""}`;
  }

  document.getElementById("summaryLabel").textContent = text;
}


function findWords() {
  const input = document.getElementById("letters").value.toUpperCase().replace(/[^A-Z]/g, '');
  const length = parseInt(document.getElementById("wordLength").value);
  const mode = document.getElementById("lengthMode").value;
  const wildcardCount = parseInt(document.getElementById("wildcardCount").value || "0");
  const requiredLetter = document.getElementById("requiredLetter").value.toUpperCase();
  const requiredPosition = parseInt(document.getElementById("requiredPosition").value);
  const showAll = document.getElementById("showAll").checked;

  const allLetters = input + '?'.repeat(wildcardCount);
  const availableLetters = allLetters.split('');

  const resultsContainer = document.getElementById("results");
  const resultsHeader = document.getElementById("resultsHeader");
  const resultsBar = document.getElementById("resultsBar");
  resultsContainer.innerHTML = '';

  const matches = [];

  for (const word of words) {
    if (
      !showAll &&
      ((mode === "greater" && word.length < length) ||
        (mode === "less" && word.length > length) ||
        (mode === "equal" && word.length !== length))
    ) continue;

    if (!matchRequiredPosition(word, requiredLetter, requiredPosition)) continue;

    const tempLetters = [...availableLetters];
    const wordLetters = word.toUpperCase().split('');
    const wildcardIndices = [];

    let valid = true;

    for (let i = 0; i < wordLetters.length; i++) {
      const l = wordLetters[i];
      const idx = tempLetters.indexOf(l);

      if (idx !== -1) {
        tempLetters.splice(idx, 1);
      } else {
        const wildIdx = tempLetters.indexOf('?');
        if (wildIdx !== -1) {
          wildcardIndices.push(i);
          tempLetters.splice(wildIdx, 1);
        } else {
          valid = false;
          break;
        }
      }
    }

    if (valid) {
      matches.push({
        word,
        wildcards: wildcardIndices,
        score: getWordScore(word)
      });
    }
  }

  // After collecting matches
  const sortBy = document.getElementById("sortBy").value;

  if (sortBy === "score") {
    matches.sort((a, b) => b.score - a.score);
  } else if (sortBy === "length") {
    matches.sort((a, b) => b.word.length - a.word.length);
  } else if (sortBy === "alpha") {
    matches.sort((a, b) => a.word.localeCompare(b.word));
  }


  if (matches.length === 0) {
    resultsBar.style.display = "none";
    resultsContainer.textContent = "No matching words found. 😢";
    return;
  }

  // Show result header and update it
  if (resultsBar) {
    resultsBar.style.display = "flex";
  }
  resultsHeader.textContent = `Found ${matches.length} valid word${matches.length !== 1 ? 's' : ''}`;

  const maxLength = Math.max(...matches.map(m => m.word.length));

  for (const match of matches) {

    const span = document.createElement("span");

    span.innerHTML = match.word
      .split('')
      .map((char, i) => match.wildcards.includes(i)
        ? `<span class="wildcard">${char}</span>`
        : char
      )
      .join('') + ` <small>${match.score} pts</small>`;

    if (!showAll && match.word.length === maxLength) {
      span.classList.add("high-score");
    }

    resultsContainer.appendChild(span);
  }
}



document.getElementById("letters").addEventListener("input", (e) => {
  // Allow only A-Z letters, uppercase automatically
  const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
  e.target.value = cleaned;
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
    document.getElementById("wordLength").value = 5;
    document.getElementById("lengthMode").value = "greater";
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