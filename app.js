let words = [];

const letterScores = {
  A: 1, B: 3, C: 3, D: 2, E: 1,
  F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1,
  P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4,
  Z: 10
};

fetch("Collins_2019.json")
  .then(res => res.json())
  .then(data => words = data)
  .then(data => {
  words = data;
  console.log("Dictionary loaded:", words.length, "words");
});;  
  

function setMode(button) {
  const buttons = document.querySelectorAll('.toggle-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  button.classList.add('active');
  document.getElementById('lengthMode').value = button.dataset.mode;
}

function updateLengthDisplay() {
  document.getElementById("lengthDisplay").textContent =
    document.getElementById("wordLength").value;
}

function getWordScore(word) {
  return word.split('').reduce((sum, char) => sum + (letterScores[char.toUpperCase()] || 0), 0);
}

// 🆕 Helper function for required letter position
function matchRequiredPosition(word, letter, pos) {
  if (!letter || !pos) return true;
  const index = parseInt(pos) - 1;
  return word[index] === letter;
}

function findWords() {
  console.log("Search triggered");
  const input = document.getElementById("letters").value.toUpperCase();
  const resultDiv = document.getElementById("results");
  const length = parseInt(document.getElementById("wordLength").value);
  const mode = document.getElementById("lengthMode").value;
  const showAll = document.getElementById("showAll").checked;
  const requiredLetter = document.getElementById("requiredLetter").value.toUpperCase();
  const requiredPosition = document.getElementById("requiredPosition").value;

  const results = words.filter(word => {
    const letters = input.split('');

    // Check if all letters in the word are available in input (bag-of-letters logic)
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

    if (showAll) return true;

    if (mode === "equal" && word.length !== length) return false;
    if (mode === "greater" && word.length <= length) return false;
    if (mode === "less" && word.length >= length) return false;

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