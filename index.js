const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const CORRECT_PASSWORD = '1152025'; // パスワードはここで比較

// ミドルウェア
app.use(bodyParser.urlencoded({ extended: true }));
// publicフォルダ内の静的ファイル（HTML/CSS/JS）を配信
app.use(express.static(path.join(__dirname, 'public')));

// JSONデータの読み込み
const wordsPath = path.join(__dirname, 'English.json');
let englishWords = [];
try {
    englishWords = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
} catch (e) {
    console.error("Error reading English.json:", e);
}

// 配列をシャッフルするユーティリティ関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 誤答の選択肢を生成する関数
function generateOptions(allWords, correctMeaning, count) {
    const meanings = allWords.map(w => w.meaning).filter(m => m !== correctMeaning);
    const shuffledMeanings = shuffleArray(meanings);
    return shuffledMeanings.slice(0, count);
}

// --- ルーティング ---

// ログインページを表示
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// パスワード認証
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === CORRECT_PASSWORD) {
        // 認証成功: クイズページへリダイレクト
        res.sendFile(path.join(__dirname, 'public', 'quiz.html'));
    } else {
        // 認証失敗: ログインページに戻る（簡単なエラー表示）
        res.send(`
            <script>
                alert('パスワードが違います'); 
                window.location.href='/';
            </script>
        `);
    }
});

// クイズデータ取得API
app.get('/api/quiz-data', (req, res) => {
    // 問題範囲の指定（クライアントからのリクエストは1始まりを想定し、0始まりに変換）
    const totalLength = englishWords.length;
    const start = parseInt(req.query.start) || 1;
    const end = parseInt(req.query.end) || totalLength;
    
    // 範囲チェックと0-indexed変換
    const startIndex = Math.max(0, start - 1);
    const endIndex = Math.min(totalLength, end); 

    const selectedWords = englishWords.slice(startIndex, endIndex);

    const selectedQuestions = selectedWords.map(word => {
        const correctAnswer = word.meaning;
        // 誤答3つを生成
        const options = generateOptions(englishWords, correctAnswer, 3); 
        
        return {
            id: word.english, // 問題の識別子（英単語）
            question: word.english, // 英単語が問題文
            options: shuffleArray([...options, correctAnswer]), // 選択肢をシャッフル
            correctAnswer: correctAnswer
        };
    });

    res.json(selectedQuestions);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
