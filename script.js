/**
 * 河童保護プロジェクト v2.0 - メインスクリプト（モーダル動作改善版）
 */

// --- 1. ゲーム状態管理（セーブデータ構造） ---
const gameState = {
  cucumbers: 0,
  totalCucumbers: 0, // 通算収穫数（実績判定用）
  kappas: 0,         // 保護中の河童数
  clickPower: 1,
  cps: 0,            // 1秒あたりの自動収穫数
  effectsEnabled: true, // 演出ON/OFF
  rescueCost: 50,    // 初回の河童救出コスト
  
  // 設備・アップグレード情報
  upgrades: {
    volunteers: { count: 0, cost: 15, cps: 1, name: "ボランティア募集", desc: "河童保護の協力者を呼びかける" },
    field: { count: 0, cost: 100, cps: 5, name: "専用きゅうり畑", desc: "フレッシュなきゅうりを安定供給" },
    sanctuary: { count: 0, cost: 1100, cps: 30, name: "河童保護区の設立", desc: "広大な水辺で河童を大量保護" }
  },

  // 解放済み実績ID
  unlockedAchievements: []
};

// --- 2. 各種マスターデータ ---

// 河童図鑑データ
const zukanData = [
  { id: "normal", name: "ノーマル河童", icon: "🥒🪷", reqKappas: 0, desc: "一般的な河童。きゅうりが大好物。" },
  { id: "volunteer", name: "お手伝い河童", icon: "🧢🥒", reqKappas: 5, desc: "人間のお手伝いをするのが好きな心優しい河童。" },
  { id: "farmer", name: "農家河童", icon: "👨‍🌾🥒", reqKappas: 15, desc: "きゅうり栽培の技術をマスターした職人肌の河童。" },
  { id: "king", name: "長老河童", icon: "👑🪷", reqKappas: 50, desc: "保護区の長。圧倒的な威厳と経験を併せ持つ。" }
];

// 実績データ
const achievementsData = [
  { id: "harvest_100", title: "収穫ビギナー", desc: "通算100本のきゅうりを収穫する", check: () => gameState.totalCucumbers >= 100, icon: "🌱" },
  { id: "harvest_1000", title: "きゅうりマスター", desc: "通算1,000本のきゅうりを収穫する", check: () => gameState.totalCucumbers >= 1000, icon: "🥒" },
  { id: "kappa_1", title: "はじめての保護", desc: "河童を1匹救出・保護する", check: () => gameState.kappas >= 1, icon: "🪷" },
  { id: "kappa_10", title: "河童の守護者", desc: "河童を10匹保護する", check: () => gameState.kappas >= 10, icon: "🛡️" }
];

// ニュース一覧
const newsList = [
  "【速報】全国で河童の保護活動が本格化しています。",
  "【話題】特製きゅうりの収穫速度が大幅に向上中！",
  "【気象】河童の活動に適した湿潤な天候が続いています。",
  "【保護区】「もっときゅうりを！」保護された河童たちが元気にアピール。"
];

// --- 3. DOM要素取得 ---
const cucumberCountEl = document.getElementById("cucumber-count");
const kappaCountEl = document.getElementById("kappa-count");
const clickTargetEl = document.getElementById("click-target");
const kappaSpriteEl = document.getElementById("kappa-character");
const upgradeListEl = document.getElementById("upgrade-list");
const rescueKappaBtn = document.getElementById("rescue-kappa-btn");
const rescueCostEl = document.getElementById("rescue-cost");

const comboDisplayEl = document.getElementById("combo-display");
const comboCountEl = document.getElementById("combo-count");
const newsTextEl = document.getElementById("news-text");
const newsTickerEl = document.getElementById("news-ticker");

// タブ関連
const tabUpgradesBtn = document.getElementById("tab-upgrades-btn");
const tabProtectBtn = document.getElementById("tab-protect-btn");
const tabUpgradesContent = document.getElementById("tab-upgrades");
const tabProtectContent = document.getElementById("tab-protect");

// モーダル関連
const zukanGridEl = document.getElementById("zukan-grid");
const achieveListEl = document.getElementById("achieve-list");
const effectToggleEl = document.getElementById("effect-toggle");

// --- 4. コンボ関連変数 ---
let combo = 1;
let comboTimer = null;

// --- 5. 初期化関数 ---
function init() {
  loadGame();
  renderUpgrades();
  updateUI();

  // ループ処理（100msごとに自動収穫＆UI同期）
  setInterval(gameLoop, 100);

  // 定期セーブ（10秒ごと）
  setInterval(saveGame, 10000);

  // ニュース更新（15秒ごと）
  setInterval(updateNews, 15000);

  setupEventListeners();
}

// --- 6. イベントリスナー登録 ---
function setupEventListeners() {
  // きゅうりクリック（収穫）処理
  clickTargetEl.addEventListener("click", (e) => {
    // コンボ計算
    combo++;
    if (combo > 1) {
      comboDisplayEl.classList.remove("hidden");
      comboCountEl.textContent = combo;
    }
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      combo = 1;
      comboDisplayEl.classList.add("hidden");
    }, 1200);

    // 獲得量＝クリック力 × コンボ倍率
    const gain = gameState.clickPower * (1 + (combo - 1) * 0.1);
    gameState.cucumbers += gain;
    gameState.totalCucumbers += gain;

    // 演出
    if (gameState.effectsEnabled) {
      createFloatingText(e.clientX, e.clientY, `+${Math.floor(gain)}`);
      triggerKappaBounce();
    }

    checkAchievements();
    updateUI();
  });

  // 河童の救出ボタン
  rescueKappaBtn.addEventListener("click", () => {
    if (gameState.cucumbers >= gameState.rescueCost) {
      gameState.cucumbers -= gameState.rescueCost;
      gameState.kappas += 1;
      
      // 次の救出コスト増加 (1.25倍)
      gameState.rescueCost = Math.floor(gameState.rescueCost * 1.25);
      rescueCostEl.textContent = gameState.rescueCost;

      if (gameState.effectsEnabled) {
        triggerKappaBounce();
      }

      checkAchievements();
      updateUI();
      saveGame();
    }
  });

  // タブ切り替え
  tabUpgradesBtn.addEventListener("click", () => {
    tabUpgradesBtn.classList.add("active");
    tabProtectBtn.classList.remove("active");
    tabUpgradesContent.classList.remove("hidden");
    tabProtectContent.classList.add("hidden");
  });

  tabProtectBtn.addEventListener("click", () => {
    tabProtectBtn.classList.add("active");
    tabUpgradesBtn.classList.remove("active");
    tabProtectContent.classList.remove("hidden");
    tabUpgradesContent.classList.add("hidden");
  });

  // モーダルオープンボタン
  document.getElementById("zukan-btn").addEventListener("click", () => {
    renderZukan();
    openModal("zukan-modal");
  });

  document.getElementById("achieve-btn").addEventListener("click", () => {
    renderAchievements();
    openModal("achieve-modal");
  });

  document.getElementById("settings-btn").addEventListener("click", () => {
    openModal("settings-modal");
  });

  // --- 【ここを徹底修正】モーダル閉じる処理 ---
  
  // 1. ❌ボタンをクリックした時の処理
  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // 背景クリックイベントとの重複を防止
      const targetId = btn.getAttribute("data-target");
      if (targetId) {
        closeModal(targetId);
      }
    });
  });

  // 2. モーダルのコンテンツ部分（白いウィンドウ）をクリックしても背景に伝播しないようにする
  document.querySelectorAll(".modal-content").forEach(content => {
    content.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  // 3. モーダルの背景（設定画面などの「外側」の暗いエリア）をクリックしたら閉じる処理
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", () => {
      closeModal(modal.id);
    });
  });

  // 設定：演出トグル
  effectToggleEl.addEventListener("change", (e) => {
    gameState.effectsEnabled = e.target.checked;
  });

  // 設定：データ手動保存＆リセット
  document.getElementById("export-save-btn").addEventListener("click", () => {
    saveGame();
    alert("ゲームデータを手動保存しました！");
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("本当にデータをリセットしますか？保護した河童も野生に戻ります。")) {
      localStorage.removeItem("kappaProjectSaveV2");
      location.reload();
    }
  });
}

// --- 7. ゲームループ (100ms周期) ---
let lastTick = Date.now();
function gameLoop() {
  const now = Date.now();
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  // CPSによる自動収穫
  if (gameState.cps > 0) {
    const autoGain = gameState.cps * delta;
    gameState.cucumbers += autoGain;
    gameState.totalCucumbers += autoGain;
    checkAchievements();
    updateUI();
  }
}

// --- 8. UI更新 ---
function updateUI() {
  cucumberCountEl.textContent = Math.floor(gameState.cucumbers).toLocaleString();
  kappaCountEl.textContent = gameState.kappas.toLocaleString();

  // 設備購入ボタンの活性/非活性
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

  // 救出ボタンの活性/非活性
  rescueKappaBtn.disabled = gameState.cucumbers < gameState.rescueCost;
}

// --- 9. 設備・アップグレード処理 ---
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
    item.cost = Math.floor(item.cost * 1.15); // 次回コスト1.15倍
    
    recalculateStats();
    renderUpgrades();
    updateUI();
    saveGame();
  }
}

function recalculateStats() {
  let totalCps = 0;
  Object.keys(gameState.upgrades).forEach(id => {
    const item = gameState.upgrades[id];
    totalCps += item.count * item.cps;
  });
  gameState.cps = totalCps;
}

// --- 10. 図鑑モーダル描画 ---
function renderZukan() {
  zukanGridEl.innerHTML = "";

  zukanData.forEach(item => {
    // 保護中の河童数が必要条件を満たしていれば解放
    const isUnlocked = gameState.kappas >= item.reqKappas;

    const card = document.createElement("div");
    card.className = `zukan-card ${isUnlocked ? '' : 'locked'}`;

    card.innerHTML = `
      <span class="icon">${isUnlocked ? item.icon : "❓"}</span>
      <span class="name">${isUnlocked ? item.name : "？？？"}</span>
      <p class="desc">${isUnlocked ? item.desc : `必要保護数: ${item.reqKappas}匹`}</p>
    `;

    zukanGridEl.appendChild(card);
  });
}

// --- 11. 実績判定・描画 ---
function checkAchievements() {
  achievementsData.forEach(ach => {
    if (!gameState.unlockedAchievements.includes(ach.id) && ach.check()) {
      gameState.unlockedAchievements.push(ach.id);
      showNews(`🏆 実績解除: 【${ach.title}】を達成しました！`);
    }
  });
}

function renderAchievements() {
  achieveListEl.innerHTML = "";

  achievementsData.forEach(ach => {
    const isUnlocked = gameState.unlockedAchievements.includes(ach.id);

    const item = document.createElement("div");
    item.className = `achieve-item ${isUnlocked ? 'unlocked' : ''}`;

    item.innerHTML = `
      <div class="achieve-icon">${isUnlocked ? ach.icon : "🔒"}</div>
      <div class="achieve-info">
        <span class="title">${ach.title} ${isUnlocked ? "✅" : ""}</span>
        <span class="detail">${ach.desc}</span>
      </div>
    `;

    achieveListEl.appendChild(item);
  });
}

// --- 12. 演出関連 ---
function createFloatingText(x, y, text) {
  const el = document.createElement("div");
  el.className = "floating-text";
  el.textContent = text;
  
  const offsetX = (Math.random() - 0.5) * 30;
  el.style.left = `${x + offsetX}px`;
  el.style.top = `${y - 20}px`;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function triggerKappaBounce() {
  kappaSpriteEl.classList.remove("bounce");
  void kappaSpriteEl.offsetWidth;
  kappaSpriteEl.classList.add("bounce");
}

function updateNews() {
  const randomIndex = Math.floor(Math.random() * newsList.length);
  showNews(newsList[randomIndex]);
}

function showNews(text) {
  newsTextEl.textContent = text;
  newsTickerEl.classList.remove("news-slide-in");
  void newsTickerEl.offsetWidth;
  newsTickerEl.classList.add("news-slide-in");
}

// --- 13. モーダル操作ヘルパー ---
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// --- 14. セーブ & ロード ---
function saveGame() {
  localStorage.setItem("kappaProjectSaveV2", JSON.stringify(gameState));
}

function loadGame() {
  const savedData = localStorage.getItem("kappaProjectSaveV2");
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      
      gameState.cucumbers = parsed.cucumbers || 0;
      gameState.totalCucumbers = parsed.totalCucumbers || 0;
      gameState.kappas = parsed.kappas || 0;
      gameState.rescueCost = parsed.rescueCost || 50;
      gameState.effectsEnabled = parsed.effectsEnabled !== undefined ? parsed.effectsEnabled : true;
      gameState.unlockedAchievements = parsed.unlockedAchievements || [];

      if (parsed.upgrades) {
        Object.keys(parsed.upgrades).forEach(id => {
          if (gameState.upgrades[id]) {
            gameState.upgrades[id].count = parsed.upgrades[id].count || 0;
            gameState.upgrades[id].cost = parsed.upgrades[id].cost || gameState.upgrades[id].cost;
          }
        });
      }

      rescueCostEl.textContent = gameState.rescueCost;
      effectToggleEl.checked = gameState.effectsEnabled;
      
      recalculateStats();
    } catch (e) {
      console.error("セーブデータの読み込み失敗:", e);
    }
  }
}

// ゲーム起動
init();
