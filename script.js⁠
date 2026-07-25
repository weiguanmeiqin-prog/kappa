/**
 * 河童保護プロジェクト - メインスクリプト
 */

// --- ゲーム状態管理 ---
const gameState = {
  cucumbers: 0,
  kappas: 0,
  clickPower: 1,
  cps: 0, // Cucumbers Per Second (1秒あたりの自動収穫数)
  upgrades: {
    volunteers: { count: 0, cost: 15, cps: 1, name: "ボランティア募集", desc: "河童保護の協力者を呼びかける" },
    field: { count: 0, cost: 100, cps: 5, name: "専用きゅうり畑", desc: "フレッシュなきゅうりを安定供給" },
    sanctuary: { count: 0, cost: 1100, cps: 30, name: "河童保護区の設立", desc: "広大な水辺で河童を大量保護" }
  }
};

// --- ニューステロップ用データ ---
const newsList = [
  "【速報】ご近所で新しい河童の目撃情報がありました。",
  "【話題】きゅうりの消費量が前年比200%を記録。",
  "【気象】河童の活動に適した湿潤な天候が続いています。",
  "【保護区】「もっときゅうりを」河童保護団体が呼びかけ。"
];

// --- DOM要素 ---
const cucumberCountEl = document.getElementById("cucumber-count");
const kappaCountEl = document.getElementById("kappa-count");
const clickTargetEl = document.getElementById("click-target");
const kappaSpriteEl = document.getElementById("kappa-character");
const upgradeListEl = document.getElementById("upgrade-list");
const newsTextEl = document.getElementById("news-text");
const newsTickerEl = document.getElementById("news-ticker");

const settingsBtn = document.getElementById("settings-btn");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const resetBtn = document.getElementById("reset-btn");
const settingsModal = document.getElementById("settings-modal");

// --- 初期化 ---
function init() {
  loadGame();
  renderUpgrades();
  updateUI();
  
  // 自動収穫ループ (100msごとに実行)
  setInterval(gameLoop, 100);
  
  // 自動セーブ (10秒ごと)
  setInterval(saveGame, 10000);
  
  // ニュース更新 (15秒ごと)
  setInterval(updateNews, 15000);

  setupEventListeners();
}

// --- イベントリスナー設定 ---
function setupEventListeners() {
  // きゅうりクリック時
  clickTargetEl.addEventListener("click", (e) => {
    gameState.cucumbers += gameState.clickPower;
    
    // エフェクト演出
    createFloatingText(e.clientX, e.clientY, `+${gameState.clickPower}`);
    triggerKappaBounce();
    
    updateUI();
  });

  // 設定モーダル制御
  settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
  closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
  
  // データリセット
  resetBtn.addEventListener("click", () => {
    if (confirm("本当にデータをリセットしますか？保護した河童も野生に戻ります。")) {
      localStorage.removeItem("kappaProjectSave");
      location.reload();
    }
  });

  // 他ボタンのダミーイベント（拡張用）
  document.getElementById("zukan-btn").addEventListener("click", () => alert("河童図鑑機能は今後のアップデートで追加予定です！"));
  document.getElementById("achieve-btn").addEventListener("click", () => alert("実績機能は今後のアップデートで追加予定です！"));
}

// --- ゲームループ (毎秒処理) ---
let lastTick = Date.now();
function gameLoop() {
  const now = Date.now();
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  // CPSに基づききゅうりを増やす
  if (gameState.cps > 0) {
    gameState.cucumbers += gameState.cps * delta;
    updateUI();
  }
}

// --- UI更新 ---
function updateUI() {
  cucumberCountEl.textContent = Math.floor(gameState.cucumbers).toLocaleString();
  kappaCountEl.textContent = gameState.kappas.toLocaleString();

  // アップグレードボタンの購入可否状態を更新
  Object.keys(gameState.upgrades).forEach(id => {
    const item = gameState.upgrades[id];
    const btn = document.getElementById(`buy-${id}`);
    const card = document.getElementById(`upgrade-card-${id}`);
    if (btn && card) {
      if (gameState.cucumbers >= item.cost) {
        card.classList.remove("disabled");
        btn.disabled = false;
      } else {
        card.classList.add("disabled");
        btn.disabled = true;
      }
    }
  });
}

// --- 演出関連 ---
function createFloatingText(x, y, text) {
  const el = document.createElement("div");
  el.className = "floating-text";
  el.textContent = text;
  
  // ランダムに少し位置を散らす
  const offsetX = (Math.random() - 0.5) * 20;
  el.style.left = `${x + offsetX}px`;
  el.style.top = `${y - 20}px`;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 800);
}

function triggerKappaBounce() {
  kappaSpriteEl.classList.remove("bounce");
  // 再描画を発火させてアニメーションを再適用
  void kappaSpriteEl.offsetWidth;
  kappaSpriteEl.classList.add("bounce");
}

function updateNews() {
  const randomIndex = Math.floor(Math.random() * newsList.length);
  newsTextEl.textContent = newsList[randomIndex];
  
  newsTickerEl.classList.remove("news-slide-in");
  void newsTickerEl.offsetWidth;
  newsTickerEl.classList.add("news-slide-in");
}

// --- アップグレード描画と購入 ---
function renderUpgrades() {
  upgradeListEl.innerHTML = "";
  
  Object.keys(gameState.upgrades).forEach(id => {
    const item = gameState.upgrades[id];
    
    const card = document.createElement("div");
    card.className = "upgrade-item";
    card.id = `upgrade-card-${id}`;

    card.innerHTML = `
      <div class="upgrade-info">
        <span class="name">${item.name} (${item.count})</span>
        <span class="desc">${item.desc} [+${item.cps} きゅうり/秒]</span>
      </div>
      <button id="buy-${id}" class="buy-btn">
        🥒 ${Math.floor(item.cost)}
      </button>
    `;

    upgradeListEl.appendChild(card);

    document.getElementById(`buy-${id}`).addEventListener("click", () => buyUpgrade(id));
  });
}

function buyUpgrade(id) {
  const item = gameState.upgrades[id];
  if (gameState.cucumbers >= item.cost) {
    gameState.cucumbers -= item.cost;
    item.count += 1;
    
    // 次回のコスト増加（1.15倍）
    item.cost = Math.floor(item.cost * 1.15);
    
    // 全体CPSと河童数の再計算
    recalculateStats();
    
    // 描画とUI更新
    renderUpgrades();
    updateUI();
    saveGame();
  }
}

function recalculateStats() {
  let totalCps = 0;
  let totalKappas = 0;

  Object.keys(gameState.upgrades).forEach(id => {
    const item = gameState.upgrades[id];
    totalCps += item.count * item.cps;
    totalKappas += item.count; // アップグレード数に応じて保護河童が増加
  });

  gameState.cps = totalCps;
  gameState.kappas = totalKappas;
}

// --- セーブ & ロード ---
function saveGame() {
  localStorage.setItem("kappaProjectSave", JSON.stringify(gameState));
}

function loadGame() {
  const savedData = localStorage.getItem("kappaProjectSave");
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      
      // データの流し込み
      gameState.cucumbers = parsed.cucumbers || 0;
      gameState.kappas = parsed.kappas || 0;
      gameState.clickPower = parsed.clickPower || 1;

      if (parsed.upgrades) {
        Object.keys(parsed.upgrades).forEach(id => {
          if (gameState.upgrades[id]) {
            gameState.upgrades[id].count = parsed.upgrades[id].count || 0;
            gameState.upgrades[id].cost = parsed.upgrades[id].cost || gameState.upgrades[id].cost;
          }
        });
      }

      recalculateStats();
    } catch (e) {
      console.error("セーブデータの読み込みに失敗しました", e);
    }
  }
}

// ゲーム起動
init();
