let words = [];

fetch("Collins_2019.json")
  .then(res => res.json())
  .then(data => words = data);  

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

function findWords() {
  const input = document.getElementById("letters").value.toUpperCase();
  const resultDiv = document.getElementById("results");
  const length = parseInt(document.getElementById("wordLength").value);
  const mode = document.getElementById("lengthMode").value;
  const showAll = document.getElementById("showAll").checked;

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

    if (showAll) return true;

    if (mode === "equal" && word.length !== length) return false;
    if (mode === "greater" && word.length <= length) return false;
    if (mode === "less" && word.length >= length) return false;

    return true;
  });

  resultDiv.innerHTML = results.length
    ? results.join(', ')
    : "No matches found.";
}