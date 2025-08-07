// === GLOBAL ===
let currentDict = localStorage.getItem("selectedDict") || "Collins_2019";
let words = [];
const dictionaryMap = {};
let currentSort = "score"; // default
let currentMatches = []; // Store matches here
let displayLimit = 30;   // Show 30 at a time
let shownCount = 0;      // How many already shown
let isSearching = false;
let hasInteracted = false;
let lengthSlider = document.getElementById('lengthRange');

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

// Initialize noUiSlider
noUiSlider.create(lengthSlider, {
  start: [2, 8],         // Default values
  connect: true,         // Show range highlight
  step: 1,
  range: {
    min: 2,
    max: 15
  },
  // Move handle on tap, bars are draggable
  behaviour: 'smooth-steps-tap-snap',
  tooltips: true,
  format: {
    to: value => Math.round(value),
    from: value => Number(value)
  },
  // cssPrefix: 'noUi-', // defaults to 'noUi-',
  pips: { mode: 'count', values: 3, density: 3, }
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


// === THEME TOGGLE LOGIC ===
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const isDark = currentTheme === 'dark';

  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌞' : '🌙';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

// === DOM READY INITIALIZATION ===
// it handles direct interactions with the HTML document, like event listeners
window.addEventListener('DOMContentLoaded', () => {
  // === APPLY SAVED THEME ===
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggle.textContent = saved === 'dark' ? '🌙' : '🌞';

  // Load the initial dictionary
  loadDictionary(currentDict);

  // Update UI with remembered dictionary
  const initialLabel = document.querySelector(`#dictMenu li[data-dict="${currentDict}"]`);
  if (initialLabel) {
    document.getElementById("selectedDict").textContent = initialLabel.textContent;
  }

  updateSummaryLabel();

  // === STAGGER TILE ANIMATION ON PAGE LOAD ===
  document.querySelectorAll(".flip-tile").forEach((tile, i) => {
    tile.style.setProperty("--i", i);
  });

  // === ELEMENT SELECTORS ===
  const selectedOption = document.getElementById("selectedOption");
  const dropdowns = document.querySelectorAll(".dropdown-group");

  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenu = document.getElementById("closeMenu");

  const form = document.querySelector('.filters');

  // === DROPDOWN SORT LOGIC ===
  function initDropdowns() {

    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector(".dropdown-toggle");
      const menu = dropdown.querySelector(".dropdown-menu");

      if (!toggle || !menu) return;

      // Skip disabled dropdowns
      if (toggle.classList.contains("disabled")) return;

      // Toggle menu on click
      toggle.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("show");
        toggle.classList.toggle("open", isOpen);
      });

      // Handle option selection
      menu.addEventListener("click", (e) => {
        if (e.target.tagName === "LI" && !e.target.classList.contains("disabled")) {
          const value = e.target.getAttribute("data-value") || e.target.getAttribute("data-dict");
          const label = e.target.textContent;

          // Handle different dropdowns by ID or context
          if (toggle.id === "dropdownToggle") {
            currentSort = value;
            document.getElementById("selectedOption").textContent = label;
            findWords("sort");
          } else if (toggle.id === "dictToggle") {
            const selectedDict = value;
            currentDict = selectedDict;
            localStorage.setItem("selectedDict", selectedDict); // Save to local storage
            document.getElementById("selectedDict").textContent = label;
            console.log("Switched dictionary:", selectedDict, words.length);
            loadDictionary(selectedDict);
          }

          // Highlight selected item
          menu.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
          e.target.classList.add("selected");

          // Close menu
          menu.classList.remove("show");
          toggle.classList.remove("open");
        }
      });

      // Close on outside click
      document.addEventListener("click", (e) => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove("show");
          toggle.classList.remove("open");
        }
      });
    });
  }


  // === SIDE MENU LOGIC ===
  function initSideMenu() {
    menuToggle.addEventListener("click", () => {
      sideMenu.classList.add("open");
    });

    closeMenu.addEventListener("click", () => {
      sideMenu.classList.remove("open");
    });

    sideMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        sideMenu.classList.remove("open");
      });
    });

    document.addEventListener("click", (e) => {
      if (
        sideMenu.classList.contains("open") &&
        !sideMenu.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        sideMenu.classList.remove("open");
      }
    });
  }

  // === CORE DICTIONARY LOGIC ===
  function loadDictionary(dictKey) {
    // If already loaded, use the cached version
    if (dictionaryMap[dictKey]) {
      words = dictionaryMap[dictKey];
      findWords("search");
      return;
    }

    // Otherwise, fetch and cache it
    fetch(`./dictionaries/${dictKey}.json`)
      .then(res => res.json())
      .then(data => {
        dictionaryMap[dictKey] = data;
        words = data;
        findWords("search");
      })
      .catch(err => {
        console.error("Failed to load dictionary:", dictKey, err);
      });
  }

  // === ALL EVENT LISTENERs ===

  // input listener before the form submit handler - best practice
  document.getElementById("letters").addEventListener("input", (e) => {
    // Allow only A-Z letters, uppercase automatically
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    e.target.value = cleaned;
    // Update the min/max range based on total letters + wildcards
    setDefaultRangeFromInput();
  });

  // === FORM SUBMIT HANDLER ===
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isSearching) return; // prevent double submits during search

    hasInteracted = true;
    console.log("set has interacted to -", hasInteracted);
    console.log("Form submitted");
    findWords();

    // Delay reset so findWords can still access hasInteracted correctly
    setTimeout(() => {
      hasInteracted = false;// reset for next input session
    }, 100);
  });

  // === INIT ===
  initDropdowns(); // Now supports both sort & dictionary
  initSideMenu();

  // === Wire up the "Show More" button ===
  document.getElementById("showMoreBtn").addEventListener("click", () => {
    renderNextBatch(true); // Tell it this is a user-triggered render
  });

  // Add more listeners below (e.g., reset buttons)...

  const scrollButtons = document.getElementById("scrollButtons");
  const scrollToTopBtn = document.getElementById("scrollToTop");
  const scrollToResultsBtn = document.getElementById("scrollToResults");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    scrollButtons.classList.toggle("show", y > 200); // only show if scrolled down a bit
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  scrollToResultsBtn.addEventListener("click", () => {
    const anchor = document.getElementById("resultsAnchor");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth" });
    }
  });

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
    const wildcardText = `with ${wildcardCount} wildcard${wildcardCount !== 1 ? "s" : ""}`;
    text = (min === max)
      ? `Searching for ${min}-letter words ${wildcardText}`
      : `Searching for words between ${min} and ${max} letters ${wildcardText}`;
  }

  console.log("summaryLabel:", text);
  console.log("min:", min);
  console.log("max:", max);

  document.getElementById("summaryLabel").textContent = text;
}


// == Handle tile loader message ==
function updateFlipTiles(message) {
  const tileLoader = document.getElementById("resultsTileLoader");

  // Clear current tiles
  tileLoader.innerHTML = "";

  // Create new tiles for each character in the message
  [...message].forEach((char, i) => {
    const tile = document.createElement("div");
    tile.className = "flip-tile";
    tile.textContent = char;
    tile.style.setProperty("--i", i); // Preserve animation staggering
    tileLoader.appendChild(tile);
  });
}


function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}


function findWords(mode = "search") {
  console.log("has interacted (in find words()):", hasInteracted);
  console.log("🔍 findWords() called. Mode:", mode);
  // 1. Get user inputs
  const input = document.getElementById("letters").value.toUpperCase().replace(/[^A-Z]/g, '');
  const wildcardCount = parseInt(document.getElementById("wildcardCount").value || "0");
  const requiredLetter = document.getElementById("requiredLetter").value.toUpperCase();
  const requiredPosition = parseInt(document.getElementById("requiredPosition").value);
  const showAll = document.getElementById("showAll").checked;
  const [minLength, maxLength] = lengthSlider.noUiSlider.get().map(v => parseInt(v));
  const allLetters = input + '?'.repeat(wildcardCount);
  const availableLetters = allLetters.split('');

  // 2. Handle empty input
  if (!input) {
    const resultsContainer = document.getElementById("results");
    const resultsHeader = document.getElementById("resultsHeader");
    const resultsBar = document.getElementById("resultsBar");

    resultsContainer.innerHTML = '';
    resultsHeader.textContent = '';
    resultsBar.style.display = "none";

    if (hasInteracted) {
      // Scroll to results
      document.getElementById("resultsAnchor").scrollIntoView({ behavior: "smooth" });
      resultsContainer.textContent = "Please enter some letters. 🙏";
    }
    return;
  }

  // 3. Prepare UI and elements
  const resultsContainer = document.getElementById("results");
  const resultsHeader = document.getElementById("resultsHeader");
  const resultsBar = document.getElementById("resultsBar");
  const resultsTextLoader = document.getElementById("resultsTextLoader");
  const resultsTileLoader = document.getElementById("resultsTileLoader");
  const showMoreBtn = document.getElementById("showMoreBtn");

  const MIN_FLIP_DURATION = 1400;

  // Clear previous results and show loading state
  resultsContainer.innerHTML = '';
  resultsHeader.textContent = '';
  resultsBar.style.display = "none";
  resultsTextLoader.style.display = "block";
  resultsTileLoader.style.display = "flex";
  showMoreBtn.style.display = "none";

  console.log("Mode: ", mode);
  // Update the tile loader message
  if (mode === "sort") {
    resultsTextLoader.textContent = "Sorting...";
    updateFlipTiles("SORT!");
  } else {
    resultsTextLoader.textContent = "Finding words...";
    updateFlipTiles("FLIP!");
  }

  // Prevent overlapping searches
  if (isSearching) return;
  isSearching = true;

  // Scroll to results
  document.getElementById("resultsAnchor").scrollIntoView({ behavior: "smooth" });

  // 4. Simulate delay for animation and UX
  setTimeout(() => {
    try {
      // throw new Error("Test error handling");
      const matches = [];
      let skippedDueToPosition = 0;

      // 5. Loop through dictionary and find matching words
      for (const word of words) {
        // Skip words outside length range (unless "Show All" is on)
        if (!showAll && (word.length < minLength || word.length > maxLength)) continue;

        // Skip if word doesn’t match required letter at position
        if (!matchRequiredPosition(word, requiredLetter, requiredPosition)) {
          skippedDueToPosition++;
          continue;
        }

        // Prepare for letter matching
        const tempLetters = [...availableLetters];
        const wordLetters = word.toUpperCase().split('');
        const wildcardIndices = [];
        let valid = true;

        // Try matching letters (with wildcards)
        for (let i = 0; i < wordLetters.length; i++) {
          const letter = wordLetters[i];
          const idx = tempLetters.indexOf(letter);

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

        // Add to results if valid
        if (valid) {
          matches.push({
            word,
            wildcards: wildcardIndices,
            score: getWordScore(word)
          });
        }
      }

      // 6. Sort matches based on dropdown value
      const sortBy = currentSort;
      if (sortBy === "score") {
        matches.sort((a, b) => b.score - a.score);
      } else if (sortBy === "length-desc") {
        matches.sort((a, b) => b.word.length - a.word.length);
      } else if (sortBy === "length-asc") {
        matches.sort((a, b) => a.word.length - b.word.length);
      } else if (sortBy === "alpha") {
        matches.sort((a, b) => a.word.localeCompare(b.word));
      }


      // 7. Hide loader after full flip animation is done
      resultsTextLoader.style.display = "none";
      resultsTileLoader.style.display = "none";

      // 8. Handle no matches
      if (matches.length === 0) {
        resultsTextLoader.style.display = "none";
        resultsTileLoader.style.display = "none";
        resultsBar.style.display = "none";

        if (skippedDueToPosition > 0) {
          resultsContainer.textContent = "No words match the required letter at that position. 😬";
        } else {
          resultsContainer.textContent = "No matching words found. 😢 Try using more letters or wildcards.";
        }

        isSearching = false; // UNLOCK future searches
        return;
      }

      // 9. Update results header
      resultsBar.style.display = "flex";
      resultsHeader.textContent = `Found ${matches.length} valid word${matches.length !== 1 ? 's' : ''}`;

      // 10. Display results with fade-in animation
      const longestWordLength = Math.max(...matches.map(m => m.word.length));

      // Save matches globally
      currentMatches = matches;
      shownCount = 0;
      resultsContainer.innerHTML = ''; // Clear before initial display
      renderNextBatch();

      // Show pagination controls if more than 30
      document.getElementById("paginationControls").style.display = matches.length > displayLimit ? "block" : "none";

      // 11. Done searching
      isSearching = false; // Allow future calls again
    } catch (error) {
      console.error("Search failed:", error);
      resultsTextLoader.style.display = "none";
      resultsTileLoader.style.display = "none";
      isSearching = false;
      showToast("❌ Something went wrong. Please try again!");
    }
  }, MIN_FLIP_DURATION); // wait this long before rendering anything
}

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

// === RESET LOGIC ===
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

    // Reset the range slider to default values (e.g., 3 to 8)
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

// === BATCH RENDER ===
function renderNextBatch(isTriggeredByShowMore = false) {
  const batch = currentMatches.slice(shownCount, shownCount + displayLimit);
  const container = document.getElementById("results");
  const showMoreBtn = document.getElementById("showMoreBtn");
  const showMoreLoader = document.getElementById("showMoreLoader");

  // Always hide both first
  showMoreBtn.style.display = "none";
  showMoreLoader.style.display = "none";

  const hasMore = shownCount + batch.length < currentMatches.length;

  if (isTriggeredByShowMore) {
    // Show loader right away
    showMoreLoader.style.display = "block";

    // Slight delay before rendering batch
    setTimeout(() => {
      showMoreLoader.style.display = "none";

      batch.forEach((match, index) => {
        const span = document.createElement("span");

        const formattedChars = match.word
          .split('')
          .map((char, i) => {
            let displayChar = i === 0 ? char.toUpperCase() : char;
            if (match.wildcards.includes(i)) {
              return `<span class="wildcard">${displayChar}</span>`;
            }
            return displayChar;
          });

        span.innerHTML = formattedChars.join('') + ` <small>${match.score} pts</small>`;
        span.style.animationDelay = `${index * 40}ms`;
        container.appendChild(span);
      });

      shownCount += batch.length;

      if (hasMore) {
        showMoreBtn.style.display = "block";
      }

    }, 500); // Delay before rendering (matches "Loading more..." duration)
  } else {
    // Initial render (no loader)
    batch.forEach((match, index) => {
      const span = document.createElement("span");

      const formattedChars = match.word
        .toLowerCase()
        .split('')
        .map((char, i) => {
          let displayChar = i === 0 ? char.toUpperCase() : char;
          if (match.wildcards.includes(i)) {
            return `<span class="wildcard">${displayChar}</span>`;
          }
          return displayChar;
        });

      span.innerHTML = formattedChars.join('') + ` <small>${match.score} pts</small>`;
      span.style.animationDelay = `${index * 40}ms`;
      container.appendChild(span);
    });

    shownCount += batch.length;

    if (hasMore) {
      showMoreBtn.style.display = "block";
    }
  }
}


function clearResults() {
  document.getElementById("results").innerHTML = '';
  document.getElementById("resultsHeader").textContent = '';
  document.getElementById("resultsBar").style.display = "none";
  document.getElementById("showMoreBtn").style.display = "none";
}


// === Funny rotating intro messages ===
const introMessages = [
  `Think of this as your <strong>totally harmless</strong> Scrabble sidekick — not a cheat, just a really enthusiastic friend who’s great with words. Pop in your letters, maybe a wildcard or two, and let's make some magic happen.`,
  `Not a cheat... just a <em>very helpful</em> coincidence. 🧐 Type in your tiles and let's see what the dictionary gods say.`,
  `We're not saying this is cheating... but your cousin Brian might raise an eyebrow. 😏 Let’s find the best words, shall we?`,
  `This tool isn’t cheating — it’s just <em>optimizing your genius</em>. Input your letters, and we’ll do the heavy lifting.`,
  `Your friendly neighborhood word whisperer. Drop your tiles in — we’ll take it from here. No judgment. 😉`,
  `Shhh... we won’t say anything. Let’s win this game with charm and letters.`,
  `Words are hard. That’s why you brought backup. Welcome aboard.`,
  `This isn't cheating — it's <em>enhanced vocabulary exploration</em>. Totally educational.`,
  `Type your letters in, and let this tool do what it does best: make you look brilliant.`,
  `We won’t tell the Scrabble police if you don’t. 🤫 Type in those tiles!`,
  `Everyone has that one smart friend. This one just lives in your browser.`,
  `Cheating? Nah. It’s called <em>strategic assistance</em> — and it’s fabulous.`,
  `Just you, your letters, and a suspiciously smart web app. Let’s find that bingo, shall we?`,
  `Just between us... this is how legends are made. Quietly. With great words. 😌`,
  `You didn't hear this from me... but seven-letter words just magically happen here.`,
  `Let’s call it... aggressive word support. Totally fair. Probably.`,
  `Technically, you’re still playing Scrabble. You’re just playing it <em>better</em>.`,
  `What happens in this tab... stays in this tab. 🕶️`,
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