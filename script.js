const input = document.getElementById("input");
const chatbox = document.getElementById("chatbox");
const OPENAI_API_KEY = "";  // ⚠ 安全管理注意

let conversationHistory = [];
let silenceTimer = null;
let feedbackCount = 0;
let feedbackShown = false;

let charCount = 0;
let errorCount = 0;
let typingStartTime = Date.now();


// メッセージバリエーション
const messages = [
  "ゆっくりで大丈夫ですよ。私がそばにいますよ。",
  "焦らなくて大丈夫です。私はここにいますよ。",
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
  return messages[index];
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

// モーダル内のチャット履歴にメッセージを追加する関数
function appendToModalChatHistory(sender, message, isUserMessage) {
  const modalChatHistory = document.getElementById("modal-chat-history");
  if (!modalChatHistory) {
    console.error("Element with ID 'modal-chat-history' not found.");
    return;
  }

  const messageElement = document.createElement("div");
  messageElement.style.marginBottom = "8px"; // メッセージ間の余白

  const senderElement = document.createElement("strong");
  senderElement.textContent = sender + ": ";

  messageElement.appendChild(senderElement);
  messageElement.appendChild(document.createTextNode(message));

  // メッセージのスタイルを送信者によって変更 (任意)
  if (isUserMessage) {
    messageElement.style.textAlign = "right";
    senderElement.style.color = "#0056b3"; // ユーザーの送信者名の色
  } else {
    messageElement.style.textAlign = "left";
    senderElement.style.color = "#196f3d"; // Nozomiの送信者名の色
  }

  modalChatHistory.appendChild(messageElement);
  // 新しいメッセージが表示されるように常に一番下までスクロール
  modalChatHistory.scrollTop = modalChatHistory.scrollHeight;
}

let currentNotificationTimer = null; // ← 通知タイマーをグローバルで管理


// システムからの声かけ
function showSystemMessage(message) {
  const notification = document.getElementById("notification");
  const text = document.getElementById("notification-text");
  const close = document.getElementById("notification-close");
  const ask = document.getElementById("notification-ask");
  if (!notification || !text || !close || !ask) return;

  // ボタン表示切り替え（6種の応答のみ表示）
  const isPredefinedMessage = messages.includes(message);
  ask.style.display = isPredefinedMessage ? "inline" : "none";

  if (currentNotificationTimer) {
    clearTimeout(currentNotificationTimer);
  }

  // 通知表示処理
  if (currentNotificationTimer) {
    clearTimeout(currentNotificationTimer);
  }

  // 4秒後に自動で消す
  // ① 通知を表示する処理（即時）
  text.textContent = message;
  notification.style.display = "block";
  notification.classList.remove("animate-out");
  notification.classList.add("animate-in");

// ② 4秒後に非表示アニメーションを開始
  currentNotificationTimer = setTimeout(() => {
    notification.classList.remove("animate-in");
    notification.classList.add("animate-out");

  // アニメーション終了後に非表示
  setTimeout(() => {
    notification.style.display = "none";
    currentNotificationTimer = null;
  }, 400);
}, 4000);

  // 手動で消せるようにする
  close.onclick = () => {
    clearTimeout(currentNotificationTimer);
    notification.classList.remove("animate-in");
    notification.classList.add("animate-out");
    setTimeout(() => {
      notification.style.display = "none";
      currentNotificationTimer = null;
    }, 400);
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

  sendKeystrokeData();

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

function sendKeystrokeData() {
  const now = Date.now();
  const elapsed = (now - typingStartTime) / 1000; // 秒
  const speed = (charCount / elapsed) * 60;
  const errorRate = charCount > 0 ? (errorCount / charCount) * 100 : 0;

  fetch("http://localhost:5000/keystroke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      char_count: charCount,
      interval: 0,  // 現在は記録していないが拡張可能
      speed: speed,
      error_rate: errorRate,
      label: ""  // 任意で手動入力可
    })
  });

  // カウンタ初期化
  typingStartTime = now;
  charCount = 0;
  errorCount = 0;
}

async function queryChatGPT(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: conversationHistory,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      appendMessage("Nozomi", "GPTからの返答が取得できませんでした。");
      console.error("レスポンスが不正:", data);
      return "";
    }

    const reply = data.choices[0].message.content;
    conversationHistory.push({ role: "assistant", content: reply });
    return reply;

  } catch (error) {
    appendMessage("Nozomi", "エラーが発生しました。ネットワークまたはAPIキーをご確認ください。");
    console.error("fetchエラー:", error);
    return "";
  }
}

console.log("--- Debug: Checking if elements are found ---");
console.log("Modal (gpt-input-modal):", document.getElementById("gpt-input-modal"));
console.log("Modal Text Area (gpt-inner-text):", document.getElementById("gpt-inner-text"));
console.log("Modal Submit Button (submit-inner):", document.getElementById("submit-inner"));
console.log("Modal Cancel Button (cancel-inner):", document.getElementById("cancel-inner"));
console.log("Notification Ask Button (notification-ask):", document.getElementById("notification-ask"));
console.log("--- End Debug: Element check ---");


// ✅「聞いてみる」ボタン → モーダルを開く
document.getElementById("notification-ask").onclick = () => {
  console.log("Debug: '聞いてみる' (notification-ask) button clicked."); // ← 追加
  document.getElementById("gpt-input-modal").style.display = "block";
};

// ✅「送信」ボタン → GPTへ送信
document.getElementById("submit-inner").onclick = async () => {
  const gptInnerTextarea = document.getElementById("gpt-inner-text");
  const userMessage = gptInnerTextarea.value.trim();

  if (!userMessage) {
    return; // 入力が空なら何もしない
  }

  // 1. ユーザーのメッセージをモーダル内のチャット履歴に表示
  appendToModalChatHistory("あなた", userMessage, true);

  // 2. 入力用テキストエリアをクリアしてフォーカス
  gptInnerTextarea.value = "";
  gptInnerTextarea.focus();

  // 3. APIにメッセージを送信して応答を得る
  // 「考え中...」を履歴に追加 (一時的な表示)
  const tempThinkingMessageDiv = document.createElement("div");
  tempThinkingMessageDiv.setAttribute("id", "temp-thinking-message"); // IDを振って後で削除しやすくする
  tempThinkingMessageDiv.style.marginBottom = "8px";
  const thinkingSender = document.createElement("strong");
  thinkingSender.textContent = "nozomi: ";
  thinkingSender.style.color = "#196f3d";
  tempThinkingMessageDiv.appendChild(thinkingSender);
  tempThinkingMessageDiv.appendChild(document.createTextNode("考え中..."));

  const modalChatHistory = document.getElementById("modal-chat-history");
  if (modalChatHistory) {
      modalChatHistory.appendChild(tempThinkingMessageDiv);
      modalChatHistory.scrollTop = modalChatHistory.scrollHeight;
  }


  try {
    const apiReply = await queryChatGPT(userMessage); // 既存のAPI呼び出し関数

    // 「考え中...」のメッセージを削除
    const thinkingMsgElement = document.getElementById("temp-thinking-message");
    if (thinkingMsgElement) {
        thinkingMsgElement.remove();
    }

    // 4. API (nozomi) の応答をモーダル内のチャット履歴に表示
    if (apiReply && apiReply.trim() !== "") {
      appendToModalChatHistory("nozomi", apiReply, false);
    } else if (apiReply === "") { 
      appendToModalChatHistory("nozomi", "(応答がありませんでした)", false);
    }

  } catch (error) {
    console.error("API Error in modal (submit-inner):", error);
    // エラー発生時も「考え中...」を削除
    const thinkingMsgElement = document.getElementById("temp-thinking-message");
    if (thinkingMsgElement) {
        thinkingMsgElement.remove();
    }
    appendToModalChatHistory("nozomi", "エラーが発生しました。しばらくしてからもう一度お試しください。", false);
  }
};

// ✅「キャンセル」ボタン → モーダルを閉じる
document.getElementById("cancel-inner").onclick = () => {
  console.log("Debug: Modal 'キャンセル' (cancel-inner) button clicked."); // ← 追加
  document.getElementById("gpt-input-modal").style.display = "none";
  document.getElementById("gpt-inner-text").value = "";
  console.log("Debug: Modal 'キャンセル' - gpt-input-modal display set to none."); // ← 追加
};
