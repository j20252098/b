let words = [];
let currentIndex = 0;
let score = 0;
let totalQuestions = 0;
let mode = "en"; // 英語→日本語モード

// -------------------- データ読み込み --------------------
fetch("English.json")
  .then(res => res.json())
  .then(data => {
    words = data;
    document.getElementById("total-words").textContent = data.length;
  })
  .catch(() => {
    alert("English.json の読み込みに失敗しました。");
  });

// -------------------- 問題範囲フォーム --------------------
const rangeForm = document.getElementById("range-form");
const quizContainer = document.getElementById("quiz-container");
const questionArea = document.getElementById("question-area");
const resultArea = document.getElementById("result-area");
const wordListArea = document.getElementById("word-list-area");

rangeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const start = parseInt(document.getElementById("start").value);
  const end = parseInt(document.getElementById("end").value);
  mode = document.getElementById("mode").value;

  if (isNaN(start) || isNaN(end) || start < 1 || end > words.length || start > end) {
    alert("正しい範囲を入力してください。");
    return;
  }

  startQuiz(start, end);
});

// -------------------- クイズ開始 --------------------
function startQuiz(start, end) {
  rangeForm.style.display = "none";
  questionArea.style.display = "block";

  const quizWords = words.slice(start - 1, end);
  totalQuestions = quizWords.length;
  currentIndex = 0;
  score = 0;

  showQuestion(quizWords);
}

// -------------------- 問題を表示 --------------------
function showQuestion(quizWords) {
  const q = quizWords[currentIndex];
  const questionCounter = document.getElementById("question-counter");
  const question = document.getElementById("question");
  const optionsContainer = document.getElementById("options");
  const feedback = document.getElementById("feedback-message");
  const scoreDisplay = document.getElementById("score-display");

  feedback.textContent = "";
  optionsContainer.innerHTML = "";

  questionCounter.textContent = `問題 ${currentIndex + 1} / ${totalQuestions}`;
  scoreDisplay.textContent = `スコア: ${score} / ${currentIndex}`;

  const correctAnswer = mode === "en" ? q.meaning : q.word;
  question.textContent = mode === "en" ? q.word : q.meaning;

  // ランダム選択肢
  const options = generateOptions(correctAnswer);
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.classList.add("option-button");
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(opt === correctAnswer, quizWords);
    optionsContainer.appendChild(btn);
  });
}

function generateOptions(correct) {
  const options = [correct];
  while (options.length < 4) {
    const random = words[Math.floor(Math.random() * words.length)];
    const value = mode === "en" ? random.meaning : random.word;
    if (!options.includes(value)) options.push(value);
  }
  return options.sort(() => Math.random() - 0.5);
}

// -------------------- 回答処理 --------------------
function handleAnswer(isCorrect, quizWords) {
  const feedback = document.getElementById("feedback-message");
  const soundCorrect = document.getElementById("sound-correct");
  const soundWrong = document.getElementById("sound-wrong");
  const scoreDisplay = document.getElementById("score-display");

  if (isCorrect) {
    feedback.textContent = "正解！";
    feedback.className = "feedback correct-text";
    score++;
    soundCorrect.play();
  } else {
    feedback.textContent = "不正解...";
    feedback.className = "feedback wrong-text";
    soundWrong.play();
  }

  scoreDisplay.textContent = `スコア: ${score} / ${currentIndex + 1}`;

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < quizWords.length) {
      showQuestion(quizWords);
    } else {
      showResult();
    }
  }, 800);
}

// -------------------- 結果表示 --------------------
function showResult() {
  document.getElementById("question-area").style.display = "none";
  document.getElementById("result-area").style.display = "block";
  document.getElementById("score").textContent = score;
  document.getElementById("total-questions").textContent = totalQuestions;
}

// -------------------- 単語一覧表示 --------------------
document.getElementById("show-list-btn").addEventListener("click", () => {
  rangeForm.style.display = "none";
  wordListArea.style.display = "block";
  renderWordList(words);
});

document.getElementById("back-to-menu").addEventListener("click", () => {
  wordListArea.style.display = "none";
  rangeForm.style.display = "flex";
});

// -------------------- 一覧描画 --------------------
function renderWordList(list) {
  const container = document.getElementById("word-list");
  container.innerHTML = "";

  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "word-item";
    div.innerHTML = `
      <span class="word-id">${item.id}.</span>
      <span class="word-en">${item.word}</span>
      <span class="word-jp">${item.meaning}</span>
    `;
    container.appendChild(div);
  });
}

// -------------------- 検索機能 --------------------
document.getElementById("search-input").addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = words.filter(item =>
    item.id.toString().includes(keyword) ||
    item.word.toLowerCase().includes(keyword) ||
    item.meaning.toLowerCase().includes(keyword)
  );
  renderWordList(filtered);
});

// -------------------- 表示切り替え（日本語・英語） --------------------
const toggleEnBtn = document.getElementById("toggle-en");
const toggleJpBtn = document.getElementById("toggle-jp");

let enHidden = false;
let jpHidden = false;

toggleEnBtn.addEventListener("click", () => {
  enHidden = !enHidden;
  document.querySelectorAll(".word-en").forEach(el => el.style.display = enHidden ? "none" : "inline");
  toggleEnBtn.textContent = enHidden ? "英語を表示" : "英語を隠す";
});

toggleJpBtn.addEventListener("click", () => {
  jpHidden = !jpHidden;
  document.querySelectorAll(".word-jp").forEach(el => el.style.display = jpHidden ? "none" : "inline");
  toggleJpBtn.textContent = jpHidden ? "日本語を表示" : "日本語を隠す";
});
