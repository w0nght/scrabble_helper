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

let lengthSlider = document.getElementById('lengthRange');

noUiSlider.create(lengthSlider, {
  start: [2, 8],         // Default values
  connect: true,         // Show range highlight
  step: 1,
  range: {
    min: 2,
    max: 15
  },
  // Move handle on tap, bars are draggable
  behaviour: 'tap-drag',
  tooltips: true,
  format: {
    to: value => Math.round(value),
    from: value => Number(value)
  },

});

// Update visible values
const minValueLabel = document.getElementById("minLengthValue");
const maxValueLabel = document.getElementById("maxLengthValue");

lengthSlider.noUiSlider.on('update', (values, handle) => {
  minValueLabel.textContent = values[0];
  maxValueLabel.textContent = values[1];

  // Also update the summary
  updateSummaryLabel();
});


// Dynamically Set Default Range from Input when users type in the #letters input
function setDefaultRangeFromInput() {
  const letters = document.getElementById("letters").value.toUpperCase().replace(/[^A-Z]/g, '');
  const wildcards = parseInt(document.getElementById("wildcardCount").value || "0");
  const total = letters.length + wildcards;

  // Calculate new max based on user input
  const newMax = Math.min(15, Math.max(3, total));

  // Get current slider values
  const [currentMin, currentMax] = lengthSlider.noUiSlider.get().map(Number);

  // Avoid overlap: ensure min < max
  const newMin = Math.min(currentMin, newMax - 1);
  const adjustedMax = Math.max(newMin + 1, newMax);

  // Apply the new range
  lengthSlider.noUiSlider.set([newMin, adjustedMax]);
}

// Wildcard group button listener
function setWildcard(button, count) {
  const group = button.parentElement;
  const buttons = group.querySelectorAll(".toggle-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");

  document.getElementById("wildcardCount").value = count;
  updateSummaryLabel();

  // Update range slider when wildcard changes
  setDefaultRangeFromInput();
}

function updateSliderFromInput() {
  const letters = document.getElementById("letters").value.toUpperCase().replace(/[^A-Z]/g, '');
  const wildcards = parseInt(document.getElementById("wildcardCount").value || "0");
  const total = letters.length + wildcards;

  const newMax = Math.min(15, Math.max(3, total));
  const current = lengthSlider.noUiSlider.get().map(Number);

  lengthSlider.noUiSlider.set([
    Math.min(current[0], newMax - 1),
    newMax
  ]);

  updateSummaryLabel?.();
}

function updateSummaryLabel() {
  const [min, max] = lengthSlider.noUiSlider.get().map(Number);
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

  const [minLength, maxLength] = lengthSlider.noUiSlider.get().map(v => parseInt(v));

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
    document.getElementById("requiredLetter").value = "";
    document.getElementById("requiredPosition").value = "";
    document.getElementById("wildcardCount").value = 0;
    document.getElementById("showAll").checked = false;
    document.getElementById("sortBy").value = "none";

    // ✅ Reset the range slider to default values (e.g., 3 to 8)
    lengthSlider.noUiSlider.set([3, 8]);

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

// === Funny rotating intro messages ===
const introMessages = [
  `Think of this as your <strong>totally harmless</strong> Scrabble sidekick — not a cheat, just a really enthusiastic friend who’s great with words. Pop in your letters, maybe a wildcard or two, and let's make some magic happen.`,
  `Not a cheat... just a <em>very helpful</em> coincidence. 🧐 Type in your tiles and let's see what the dictionary gods say.`,
  `We're not saying this is cheating... but your cousin Brian might raise an eyebrow. 😏 Let’s find the best words, shall we?`,
  `This tool isn’t cheating — it’s just <em>optimizing your genius</em>. Input your letters, and we’ll do the heavy lifting.`,
  `Your friendly neighborhood word whisperer. Drop your tiles in — we’ll take it from here. No judgment. 😉`,
  `Shhh… we won’t say anything. Let’s win this game with charm and letters.`,
  `Words are hard. That’s why you brought backup. Welcome aboard.`,
  `This isn't cheating — it's <em>enhanced vocabulary exploration</em>. Totally educational.`,
  `Type your letters in, and let this tool do what it does best: make you look brilliant.`,
  `We won’t tell the Scrabble police if you don’t. 🤫 Type in those tiles!`,
  `Everyone has that one smart friend. This one just lives in your browser.`,
  `Cheating? Nah. It’s called <em>strategic assistance</em> — and it’s fabulous.`,
  `Just you, your letters, and a suspiciously smart web app. Let’s find that bingo, shall we?`,
  `Just between us… this is how legends are made. Quietly. With great words. 😌`,
  `You didn't hear this from me… but seven-letter words just magically happen here.`,
  `Let’s call it… aggressive word support. Totally fair. Probably.`,
  `Technically, you’re still playing Scrabble. You’re just playing it <em>better</em>.`,
  `What happens in this tab… stays in this tab. 🕶️`,
  `It’s not about cheating. It’s about </em>clever resource management</em>.`
];

// Pick one at random on load
const randomIndex = Math.floor(Math.random() * introMessages.length);
document.getElementById("introText").innerHTML = introMessages[randomIndex];

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