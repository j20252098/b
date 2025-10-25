let questions = [];
let currentQuestionIndex = 0;
let score = 0;

const rangeForm = document.getElementById('range-form');
const questionArea = document.getElementById('question-area');
const resultArea = document.getElementById('result-area');
const totalWordsSpan = document.getElementById('total-words');

// 初期設定: 総単語数を取得
fetch('/api/quiz-data')
    .then(res => res.json())
    .then(data => {
        totalWordsSpan.textContent = data.length;
        document.getElementById('end').value = data.length;
    })
    .catch(error => {
        totalWordsSpan.textContent = 'エラー';
        console.error('Failed to fetch total word count:', error);
    });

// 範囲選択フォームの送信処理
rangeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    // サーバーから指定範囲の問題を取得
    const response = await fetch(`/api/quiz-data?start=${start}&end=${end}`);
    questions = await response.json();
    currentQuestionIndex = 0;
    score = 0;
    
    if (questions.length > 0) {
        rangeForm.classList.replace('fade-in', 'fade-out');
        // アニメーション完了後に要素を切り替え
        setTimeout(() => {
            rangeForm.style.display = 'none';
            questionArea.style.display = 'block';
            questionArea.classList.add('fade-in');
            loadQuestion();
        }, 500); 
    } else {
        alert('指定された範囲に問題がありません。');
    }
});

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        // クイズ終了
        showResults();
        return;
    }

    const q = questions[currentQuestionIndex];
    document.getElementById('question-counter').textContent = `問題 ${currentQuestionIndex + 1} / ${questions.length}`;
    document.getElementById('question').textContent = q.question;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    // フィードバックをリセット
    document.getElementById('feedback-message').textContent = '';
    
    q.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.addEventListener('click', () => checkAnswer(option, q.correctAnswer, button));
        optionsDiv.appendChild(button);
    });
    
    // 新しい問題のフェードインアニメーションをトリガー
    questionArea.classList.remove('fade-out');
    questionArea.classList.add('fade-in');
}

function checkAnswer(selectedAnswer, correctAnswer, clickedButton) {
    const feedback = document.getElementById('feedback-message');
    
    // 全てのボタンを無効化
    document.querySelectorAll('#options button').forEach(btn => btn.disabled = true);
    
    // 正誤判定とアニメーション
    if (selectedAnswer === correctAnswer) {
        score++;
        feedback.innerHTML = '✅ **正解です！**';
        clickedButton.classList.add('correct-answer-animation');
        
    } else {
        feedback.innerHTML = `❌ **不正解。** 正解は「<span class="correct-text">${correctAnswer}</span>」でした。`;
        clickedButton.classList.add('wrong-answer-animation');
        
        // 正解のボタンをハイライト
        document.querySelectorAll('#options button').forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add('highlight-correct');
            }
        });
    }

    // 2秒後に次の問題へ移行
    setTimeout(() => {
        questionArea.classList.replace('fade-in', 'fade-out');
        
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
        }, 500); // fade-outの完了を待つ
    }, 2000);
}

function showResults() {
    questionArea.style.display = 'none';
    resultArea.style.display = 'block';
    resultArea.classList.add('fade-in');
    
    document.getElementById('score').textContent = score;
    document.getElementById('total-questions').textContent = questions.length;
}
