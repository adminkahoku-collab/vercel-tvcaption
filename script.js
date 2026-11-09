// ========================================================
// 設定エリア (ご自身の Firebase URL に変更してください)
// ※ 末尾のスラッシュ (/) は自動除去されます
// ========================================================
const FIREBASE_DATABASE_URL = "https://caption-db-cbff9-default-rtdb.asia-southeast1.firebasedatabase.app";

const BASE_URL = FIREBASE_DATABASE_URL.replace(/\/+$/, "");

// 話者ごとの自動カラー割り当て
const speakerColors = {};
const COLOR_PALETTE = [
  "#1a73e8", // ブルー
  "#d93025", // レッド
  "#188038", // グリーン
  "#e37400", // オレンジ
  "#a142f4", // パープル
  "#0097a7"  // シアン
];
let colorIndex = 0;

function getSpeakerColor(speaker) {
  if (!speakerColors[speaker]) {
    speakerColors[speaker] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
    colorIndex++;
  }
  return speakerColors[speaker];
}

// タイムスタンプフォーマット (HH:MM:SS)
function formatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return d.toTimeString().split(' ')[0];
}

// ========================================================
// 1. 確定ログ (list) のリアルタイム受信 (EventSource)
// ========================================================
function connectListStream() {
  const listContainer = document.getElementById("list-container");
  const transcriptBox = document.getElementById("transcript-box");
  const statusBadge = document.getElementById("status");

  // Firebase REST API の Realtime Streaming (.json)
  const eventSource = new EventSource(`${BASE_URL}/transcripts/list.json`);

  eventSource.onopen = () => {
    statusBadge.innerText = "🟢 リアルタイム接続中";
    statusBadge.style.backgroundColor = "#e6f4ea";
    statusBadge.style.color = "#137333";
  };

  eventSource.onerror = () => {
    statusBadge.innerText = "🔴 再接続中...";
    statusBadge.style.backgroundColor = "#fce8e6";
    statusBadge.style.color = "#c5221f";
  };

  eventSource.addEventListener("put", (e) => {
    const data = JSON.parse(e.data);
    if (!data.data) return;

    // 初回一括ロード、または新規追加ノードの判定
    const payload = data.data;

    if (data.path === "/") {
      // 全データ初期表示
      listContainer.innerHTML = "";
      Object.keys(payload).forEach(key => {
        appendMessage(listContainer, payload[key]);
      });
    } else {
      // 1件ずつ追加
      appendMessage(listContainer, payload);
    }

    // 自動最下部スクロール
    transcriptBox.scrollTop = transcriptBox.scrollHeight;
  });
}

// メッセージ要素の描画
function appendMessage(container, item) {
  if (!item || !item.content) return;

  const color = getSpeakerColor(item.speaker);
  const timeStr = formatTime(item.timestamp);

  const itemDiv = document.createElement("div");
  itemDiv.className = "transcript-item";
  itemDiv.innerHTML = `
    <div>
      <span class="speaker-name" style="background-color: ${color}">${item.speaker}</span>
      <span class="timestamp">${timeStr}</span>
    </div>
    <div class="message-content">${item.content}</div>
  `;
  container.appendChild(itemDiv);
}

// ========================================================
// 2. 発話中仮字幕 (interim) のリアルタイム受信
// ========================================================
function connectInterimStream() {
  const interimBox = document.getElementById("interim-box");
  const eventSource = new EventSource(`${BASE_URL}/transcripts/interim.json`);

  eventSource.addEventListener("put", (e) => {
    const data = JSON.parse(e.data);
    const item = data.data;

    if (item && item.content) {
      const color = getSpeakerColor(item.speaker);
      interimBox.innerHTML = `
        <span class="speaker-name" style="background-color: ${color}; opacity: 0.8;">${item.speaker}</span>
        <span style="margin-left: 8px;">${item.content} ...</span>
      `;
    } else {
      // 確定されて interim が DELETE されたらクリア
      interimBox.innerHTML = "";
    }
  });
}

// 起動
document.addEventListener("DOMContentLoaded", () => {
  connectListStream();
  connectInterimStream();
});
