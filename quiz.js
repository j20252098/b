// パスワード認証を削除
let allWords = [];
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
const FIXED_WORD_COUNT = 1400; // 単語数を1400に固定

// === ユーティリティ関数 ===

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateOptions(allWords, correctMeaning, count) {
    const meanings = allWords.map(w => w.meaning).filter(m => m !== correctMeaning);
    const shuffledMeanings = shuffleArray(meanings);
    return shuffledMeanings.slice(0, count);
}


// === クイズ本体ロジック (quiz.html用) ===

const quizContainer = document.getElementById('quiz-container');
if (quizContainer) {
    // 認証ロジックは全て削除
    
    const rangeForm = document.getElementById('range-form');
    const questionArea = document.getElementById('question-area');
    const resultArea = document.getElementById('result-area');
    const totalWordsSpan = document.getElementById('total-words');

    // 1. JSONデータの読み込み
    fetch('English.json')
        .then(response => {
            if (!response.ok) {
                // ファイルがない場合でも、強制的に1400として扱う（エラー回避のため）
                console.error('English.jsonの読み込みに失敗しました。');
                return []; 
            }
            return response.json();
        })
        .then(data => {
            allWords = data;
            // 単語数は固定値を使用
            totalWordsSpan.textContent = FIXED_WORD_COUNT;
            document.getElementById('end').value = Math.min(10, FIXED_WORD_COUNT); // 最小値を設定
            document.getElementById('end').max = FIXED_WORD_COUNT;
        })
        .catch(error => {
            totalWordsSpan.textContent = FIXED_WORD_COUNT; // エラー時も固定値を表示
            console.error('クイズデータの処理中にエラーが発生しました:', error);
            // 範囲のmax値も固定
            document.getElementById('end').max = FIXED_WORD_COUNT;
        });

    // 2. 範囲選択フォームの送信処理
    rangeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const start = parseInt(document.getElementById('start').value);
        const end = parseInt(document.getElementById('end').value);
        
        // 単語データが固定数未満の場合の対応
        const maxIndex = allWords.length > 0 ? allWords.length : FIXED_WORD_COUNT;

        if (start < 1 || end > maxIndex || start > end) {
             alert(`範囲設定が不正です。(1から${maxIndex}まで)`);
            return;
        }
        
        // 3. 問題の生成
        const selectedWords = allWords.slice(start - 1, end);
        
        // 読み込みに失敗した場合のフェールセーフ
        if (selectedWords.length === 0) {
            alert('クイズデータが読み込まれていないため、開始できません。');
            return;
        }
        
        questions = selectedWords.map(word => {
            const correctAnswer = word.meaning;
            const options = generateOptions(allWords, correctAnswer, 3);
            
            return {
                question: word.word, 
                options: shuffleArray([...options, correctAnswer]),
                correctAnswer: correctAnswer
            };
        });

        currentQuestionIndex = 0;
        score = 0;

        // 画面切り替えアニメーション
        rangeForm.classList.replace('fade-in', 'fade-out');
        setTimeout(() => {
            rangeForm.style.display = 'none';
            questionArea.style.display = 'block';
            questionArea.classList.add('fade-in');
            loadQuestion();
        }, 500); 
    });

    // 4. 問題の表示 (変更なし)
    function loadQuestion() {
        if (currentQuestionIndex >= questions.length) {
            showResults();
            return;
        }

        const q = questions[currentQuestionIndex];
        document.getElementById('question-counter').textContent = `問題 ${currentQuestionIndex + 1} / ${questions.length}`;
        document.getElementById('question').textContent = q.question;
        const optionsDiv = document.getElementById('options');
        optionsDiv.innerHTML = '';
        document.getElementById('feedback-message').innerHTML = '';
        
        q.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-button');
            button.addEventListener('click', () => checkAnswer(option, q.correctAnswer, button));
            optionsDiv.appendChild(button);
        });
        
        questionArea.classList.remove('fade-out');
        questionArea.classList.add('fade-in');
    }

    // 5. 回答の判定 (変更なし)
    function checkAnswer(selectedAnswer, correctAnswer, clickedButton) {
        const feedback = document.getElementById('feedback-message');
        
        document.querySelectorAll('#options button').forEach(btn => btn.disabled = true);

        if (selectedAnswer === correctAnswer) {
            score++;
            feedback.innerHTML = '✅ **正解です！**';
            clickedButton.classList.add('correct-answer-animation');
            
        } else {
            feedback.innerHTML = `❌ **不正解。** 正解は「<span class="correct-text">${correctAnswer}</span>」でした。`;
            clickedButton.classList.add('wrong-answer-animation');
            
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
            }, 500);
        }, 2000);
    }

    // 6. 結果の表示 (変更なし)
    function showResults() {
        questionArea.style.display = 'none';
        resultArea.style.display = 'block';
        resultArea.classList.add('fade-in');
        
        document.getElementById('score').textContent = score;
        document.getElementById('total-questions').textContent = questions.length;
    }
}
