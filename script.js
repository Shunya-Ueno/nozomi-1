const input = document.getElementById("input");
const chatbox = document.getElementById("chatbox");

let silenceTimer = null;
let feedbackCount = 0;
let feedbackShown = false;

let charCount = 0;
let errorCount = 0;
let typingStartTime = Date.now();


// メッセージバリエーション
const messages = [
  "ゆっくりで大丈夫ですよ。私がそばにいます。",
  "焦らなくて大丈夫です。私はここにいます。",
  "無理しなくても大丈夫ですよ。いつでも話してくださいね。",
  "言葉が出てこなくても大丈夫です。よろしければお手伝いしましょうか？",
  "考え中でしょうか？ ゆっくりで構いませんよ。",
  "少し息をついてもいいかもしれませんね。私はここにいます。"
];

// 次のフィードバックまでの時間を計算
function nextSilenceInterval(count) {
  if (count === 0) return 5000;               // 1回目：5秒
  if (count === 1) return 10000;              // 2回目：+10秒
  return 15000;                               // 以降：+15秒ずつ
}

function scheduleFeedback() {
  const waitTime = nextSilenceInterval(feedbackCount);

  silenceTimer = setTimeout(() => {
    showSystemMessage(getRandomMessage());
    feedbackCount++;
    scheduleFeedback();  // 次のフィードバックも予約（漸増）
  }, waitTime);
}

let lastIndex = -1; // 直前に表示したインデックス

function getRandomMessage() {
  let index;
  do {
    index = Math.floor(Math.random() * messages.length);
  } while (index === lastIndex);  // 同じものが選ばれたら再抽選

  lastIndex = index; // 今回のインデックスを記憶
  return `私: ${messages[index]}`;
}

// ユーザーのキー入力を検知
input.addEventListener("keydown", (event) => {
  clearTimeout(silenceTimer);
  feedbackShown = false;
  scheduleFeedback();  // 再スタート


  if (event.key === "Enter" && input.value.trim() !== "") {
    const message = input.value;
    appendMessage("あなた", message);
    input.value = "";
    resetFeedback();  // 送信時に状態リセット
  }
});

// チャット欄にメッセージ追加
function appendMessage(sender, message) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatbox.appendChild(div);
  chatbox.scrollTop = chatbox.scrollHeight;
}

let currentNotificationTimer = null; // ← 通知タイマーをグローバルで管理

// システムからの声かけ
function showSystemMessage(message) {
  const notification = document.getElementById("notification");
  const text = document.getElementById("notification-text");
  const close = document.getElementById("notification-close");
  if (!notification || !text || !close) return;

  // 前のタイマーをキャンセルして上書き
  if (currentNotificationTimer) {
    clearTimeout(currentNotificationTimer);
  }

  text.textContent = message;
  notification.style.display = "block";

  // 3秒後に自動で消す
  currentNotificationTimer = setTimeout(() => {
    notification.style.display = "none";
    currentNotificationTimer = null;
  }, 3000);

  // 手動で消せるようにする
  close.onclick = () => {
    clearTimeout(currentNotificationTimer);
    notification.style.display = "none";
    currentNotificationTimer = null;
  };
}

// 状態の初期化
function resetFeedback() {
  clearTimeout(silenceTimer);
  feedbackCount = 0;
  feedbackShown = false;
}


// 入力文字数のカウント（insertText のみ）
input.addEventListener("input", (event) => {
  if (event.inputType === "insertText") {
    charCount += event.data.length;
  }
});



// --- 拡張①: 30秒ごとのチェック＋ベースライン比較（全体傾向） ---
let speedHistory = [];
let errorRateHistory = [];

setInterval(() => {
  const now = Date.now();
  const elapsed = (now - typingStartTime) / 1000; // 秒数
  const speed = (charCount / elapsed) * 60;
  const errorRate = charCount > 0 ? (errorCount / charCount) * 100 : 0;

  const avgSpeed = speedHistory.slice(-5).reduce((a, b) => a + b, 0) / (speedHistory.length >= 5 ? 5 : speedHistory.length || 1);
  const avgError = errorRateHistory.slice(-5).reduce((a, b) => a + b, 0) / (errorRateHistory.length >= 5 ? 5 : errorRateHistory.length || 1);

  if (Math.abs(speed - avgSpeed) > 10) {
    showSystemMessage(speed > avgSpeed
      ? "いつもより少し速いですね。大丈夫ですか？"
      : "いつもよりゆっくりですね。少しお疲れではありませんか？");
  }

  if (Math.abs(errorRate - avgError) > 4) {
    showSystemMessage(errorRate > avgError
      ? "打ち間違いが増えているようです。休憩してみてもいいかもしれません。"
      : "以前より打ち間違いが減ってきていますね。落ち着いている証拠かもしれません。");
  }

  speedHistory.push(speed);
  errorRateHistory.push(errorRate);
  typingStartTime = now;
  charCount = 0;
  errorCount = 0;
}, 7000); // 7秒ごとに実行

// --- 拡張②: 入力後5秒間の沈黙で即時評価（短期揺らぎ） ---
let silenceCheckTimer = null;

function scheduleSilenceCheck() {
  clearTimeout(silenceCheckTimer);
  silenceCheckTimer = setTimeout(() => {
    const now = Date.now();
    const elapsed = (now - typingStartTime) / 1000;
    const speed = (charCount / elapsed) * 60;
    const errorRate = charCount > 0 ? (errorCount / charCount) * 100 : 0;

    showSystemMessage("入力がしばらく止まっていますね。何かあればいつでも話しかけてください。");
  }, 5000); // 5秒間無入力で反応
}

// --- 拡張③: 入力リズムとエラーをリアルタイムに記録 ---
let keyTimestamps = [];

input.addEventListener("input", (event) => {
  if (event.inputType === "insertText") {
    charCount += event.data.length;
    keyTimestamps.push(Date.now());
    scheduleSilenceCheck();  // 拡張②の沈黙チェッカーを起動
  }
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Backspace") {
    errorCount++;
  }
});

// --- 拡張④: ズレ検出時に反応＋記録（※拡張①の中に組み込み済み） ---
// この機能はすでに拡張①の以下部分で実装済みです：

// if (Math.abs(speed - avgSpeed) > 10) { showSystemMessage(...) }
// if (Math.abs(errorRate - avgError) > 4) { showSystemMessage(...) }

