const CORRECT_PASSWORD = '1152025';
const AUTH_KEY = 'quiz_authenticated'; // 認証状態を保存するキー
let allWords = [];
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// === ユーティリティ関数 ===

// 配列をシャッフルする
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 誤答の選択肢を生成する
function generateOptions(allWords, correctMeaning, count) {
    const meanings = allWords.map(w => w.meaning).filter(m => m !== correctMeaning);
    const shuffledMeanings = shuffleArray(meanings);
    return shuffledMeanings.slice(0, count);
}


// === 認証処理 (index.html用) ===

if (document.getElementById('login-form')) {
    // ログインページにいる場合、セッションをリセット
    sessionStorage.removeItem(AUTH_KEY);
    
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputPassword = document.getElementById('password-input').value;
        const errorMsg = document.getElementById('login-error');

        if (inputPassword === CORRECT_PASSWORD) {
            // 認証成功: セッションに認証済みフラグをセット
            sessionStorage.setItem(AUTH_KEY, 'true');
            // クイズページへ遷移
            window.location.href = 'quiz.html';
        } else {
            // 認証失敗
            errorMsg.style.display = 'block';
            setTimeout(() => { errorMsg.style.display = 'none'; }, 2000);
        }
    });
}


// === クイズ本体ロジック (quiz.html用) ===

if (document.getElementById('quiz-container')) {
    // ページロード時: 認証チェック
    if (sessionStorage.getItem(AUTH_KEY) !== 'true') {
        alert('アクセスするにはパスワードが必要です。');
        // ログインページへ強制リダイレクト
        window.location.href = 'index.html'; 
    }
    
    const rangeForm = document.getElementById('range-form');
    const questionArea = document.getElementById('question-area');
    const resultArea = document.getElementById('result-area');
    const totalWordsSpan = document.getElementById('total-words');

    // 1. JSONデータの読み込み
    fetch('English.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('English.jsonの読み込みに失敗しました');
            }
            return response.json();
        })
        .then(data => {
            allWords = data;
            totalWordsSpan.textContent = data.length;
            document.getElementById('end').value = data.length;
        })
        .catch(error => {
            totalWordsSpan.textContent = 'エラー';
            console.error('Failed to load quiz data:', error);
            alert('クイズデータを読み込めませんでした。ファイルパスを確認してください。');
        });

    // 2. 範囲選択フォームの送信処理
    rangeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const start = parseInt(document.getElementById('start').value);
        const end = parseInt(document.getElementById('end').value);
        
        if (allWords.length === 0) {
            alert('データを読み込み中です。少々お待ちください。');
            return;
        }

        if (start < 1 || end > allWords.length || start > end) {
            alert(`範囲設定が不正です。(1から${allWords.length}まで)`);
            return;
        }

        // 3. 問題の生成
        const selectedWords = allWords.slice(start - 1, end);
        
        questions = selectedWords.map(word => {
            const correctAnswer = word.meaning;
            const options = generateOptions(allWords, correctAnswer, 3);
            
            return {
                question: word.word, // 問題文は "word" (英単語)
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

    // 4. 問題の表示
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

    // 5. 回答の判定
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

    // 6. 結果の表示
    function showResults() {
        questionArea.style.display = 'none';
        resultArea.style.display = 'block';
        resultArea.classList.add('fade-in');
        
        document.getElementById('score').textContent = score;
        document.getElementById('total-questions').textContent = questions.length;
    }
}
