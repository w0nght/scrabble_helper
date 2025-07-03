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

function setMode(button) {
  const buttons = document.querySelectorAll('.toggle-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  document.getElementById('lengthMode').value = button.dataset.mode;
  updateLengthExplanation();
}

function updateLengthDisplay() {
  updateLengthExplanation();
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
  label.textContent = `${modeText[mode]} ${length}`;
}

function findWords() {
  const input = document.getElementById("letters").value.toUpperCase();
  const resultDiv = document.getElementById("results");
  const length = parseInt(document.getElementById("wordLength").value);
  const mode = document.getElementById("lengthMode").value;
  const showAll = document.getElementById("showAll").checked;

  const requiredLetter = document.getElementById("requiredLetter").value.toUpperCase();
  const requiredPosition = document.getElementById("requiredPosition").value;

  const results = words.filter(word => {
    const letters = input.split('');

    const isMatch = word.split('').every(l => {
      const index = letters.indexOf(l);
      if (index !== -1) {
        letters.splice(index, 1);
        return true;
      }
      return false;
    });

    if (!isMatch) return false;
    if (!matchRequiredPosition(word, requiredLetter, requiredPosition)) return false;

    if (!showAll) {
      if (mode === "equal" && word.length !== length) return false;
      if (mode === "greater" && word.length < length) return false;
      if (mode === "less" && word.length > length) return false;
    }

    return true;
  });

  resultDiv.innerHTML = results.length
    ? results.map(w => {
      const score = getWordScore(w);
      const scoreClass = score >= 20 ? "high-score" : "";
      return `<span><strong>${w}</strong><small class="${scoreClass}"> ${score}</small></span>`;
    }).join('')
    : "No matches found.";
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