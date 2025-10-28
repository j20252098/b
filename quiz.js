let allWords = [];
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let currentMode = "en"; // "en" = 英語→日本語, "jp" = 日本語→英語
const FIXED_WORD_COUNT = 1400;

// 音声
const soundCorrect = document.getElementById("sound-correct");
const soundWrong = document.getElementById("sound-wrong");

// === ユーティリティ ===
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateOptions(allWords, correct, count, mode) {
    const pool = mode === "en" ? allWords.map(w => w.meaning) : allWords.map(w => w.word);
    const filtered = pool.filter(m => m !== correct);
    return shuffleArray(filtered).slice(0, count);
}

// === DOM要素 ===
const rangeForm = document.getElementById('range-form');
const questionArea = document.getElementById('question-area');
const resultArea = document.getElementById('result-area');
const totalWordsSpan = document.getElementById('total-words');
const scoreDisplay = document.getElementById('score-display');
const wordListArea = document.getElementById('word-list-area');
const wordListDiv = document.getElementById('word-list');
const backToMenu = document.getElementById('back-to-menu');
const showListBtn = document.getElementById('show-list-btn');
const toggleEnBtn = document.getElementById('toggle-en');
const toggleJpBtn = document.getElementById('toggle-jp');

// === JSON読み込み ===
fetch('English.json')
    .then(res => res.json())
    .then(data => {
        allWords = data;
        totalWordsSpan.textContent = FIXED_WORD_COUNT;
        document.getElementById('end').max = FIXED_WORD_COUNT;
    })
    .catch(() => totalWordsSpan.textContent = FIXED_WORD_COUNT);

// === 範囲選択フォーム送信 ===
rangeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const start = parseInt(document.getElementById('start').value);
    const end = parseInt(document.getElementById('end').value);
    currentMode = document.getElementById('mode').value;

    if (start < 1 || end > FIXED_WORD_COUNT || start > end) {
        alert(`範囲設定が不正です。(1〜${FIXED_WORD_COUNT})`);
        return;
    }

    const selected = allWords.slice(start - 1, end);
    if (selected.length === 0) return alert("データがありません");

    questions = selected.map(word => {
        const question = currentMode === "en" ? word.word : word.meaning;
        const correct = currentMode === "en" ? word.meaning : word.word;
        const options = generateOptions(allWords, correct, 3, currentMode);
        return { question, correctAnswer: correct, options: shuffleArray([...options, correct]) };
    });

    currentQuestionIndex = 0;
    score = 0;
    rangeForm.style.display = "none";
    questionArea.style.display = "block";
    loadQuestion();
});

// === 問題をロード ===
function loadQuestion() {
    if (currentQuestionIndex >= questions.length) return showResults();

    const q = questions[currentQuestionIndex];
    document.getElementById('question-counter').textContent =
        `問題 ${currentQuestionIndex + 1} / ${questions.length}`;
    document.getElementById('question').textContent = q.question;
    scoreDisplay.textContent = `スコア: ${score} / ${questions.length}`;

    const optionsDiv = document.getElementById('options');
    const feedback = document.getElementById('feedback-message');
    optionsDiv.innerHTML = "";
    feedback.innerHTML = "";

    q.options.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.classList.add("option-button");
        btn.onclick = () => checkAnswer(option, q.correctAnswer, btn);
        optionsDiv.appendChild(btn);
    });
}

// === 回答判定 ===
function checkAnswer(selected, correct, btn) {
    const feedback = document.getElementById('feedback-message');
    document.querySelectorAll('#options button').forEach(b => b.disabled = true);

    if (selected === correct) {
        score++;
        feedback.innerHTML = "✅ 正解！";
        btn.classList.add("correct-answer-animation");
        soundCorrect.play();
    } else {
        feedback.innerHTML = `❌ 不正解。正解は「${correct}」`;
        btn.classList.add("wrong-answer-animation");
        soundWrong.play();
    }

    scoreDisplay.textContent = `スコア: ${score} / ${questions.length}`;

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

// === 結果表示 ===
function showResults() {
    questionArea.style.display = "none";
    resultArea.style.display = "block";
    document.getElementById("score").textContent = score;
    document.getElementById("total-questions").textContent = questions.length;
}

// === 単語一覧表示 ===
showListBtn.onclick = () => {
    rangeForm.style.display = "none";
    wordListArea.style.display = "block";
    renderWordList();
};

backToMenu.onclick = () => {
    wordListArea.style.display = "none";
    rangeForm.style.display = "block";
};

// === 一覧生成 ===
function renderWordList() {
    wordListDiv.innerHTML = "";
    allWords.forEach(w => {
        const row = document.createElement("div");
        row.className = "word-row";
        row.innerHTML = `<span class="word-en">${w.word}</span>
                         <span class="word-jp">${w.meaning}</span>`;
        wordListDiv.appendChild(row);
    });
}

// === 表示切替 ===
toggleEnBtn.onclick = () => {
    const isHidden = toggleEnBtn.classList.toggle("active");
    document.querySelectorAll(".word-en").forEach(el => el.classList.toggle("hidden", isHidden));
    toggleEnBtn.textContent = isHidden ? "英語を表示" : "英語を隠す";
};

toggleJpBtn.onclick = () => {
    const isHidden = toggleJpBtn.classList.toggle("active");
    document.querySelectorAll(".word-jp").forEach(el => el.classList.toggle("hidden", isHidden));
    toggleJpBtn.textContent = isHidden ? "日本語を表示" : "日本語を隠す";
};
