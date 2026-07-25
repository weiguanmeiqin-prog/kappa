/**
 * 河童保護プロジェクト v2.0 - メインスクリプト（完全動作統合版）
 */

// --- 1. ゲーム状態管理 ---
const gameState = {
  cucumbers: 0,
  totalCucumbers: 0,
  kappas: 0,
  clickPower: 1,
  cps: 0,
  effectsEnabled: true,
  rescueCost: 50,
  
  upgrades: {
    volunteers: { count: 0, cost: 15, cps: 1, name: "ボランティア募集", desc: "河童保護の協力者を呼びかける" },
    field: { count: 0, cost: 100, cps: 5, name: "専用きゅうり畑", desc: "フレッシュなきゅうりを安定供給" },
    sanctuary: { count: 0, cost: 1100, cps: 30, name: "河童保護区の設立", desc: "広大な水辺で河童を大量保護" }
  },

  trap: {
    isSet: false,
    isReady: false,
    endTime: 0,
    duration: 30,
    cost: 100
  },

  unlockedAchievements: []
};

// --- 2. 各種マスターデータ ---
const zukanData = [
  { id: "normal", name: "ノーマル河童", icon: "🥒🪷", reqKappas: 0, desc: "一般的な河童。きゅうりが大好物。" },
  { id: "volunteer", name: "お手伝い河童", icon: "🧢🥒", reqKappas: 5, desc: "人間のお手伝いをするのが好きな心優しい河童。" },
  { id: "farmer", name: "農家河童", icon: "👨‍🌾🥒", reqKappas: 15, desc: "きゅうり栽培の技術をマスターした職人肌の河童。" },
  { id: "king", name: "長老河童", icon: "👑🪷", reqKappas: 50, desc: "保護区の長。圧倒的な威厳と経験を併せ持つ。" }
];

const achievementsData = [
  { id: "harvest_100", title: "収穫ビギナー", desc: "通算100本のきゅうりを収穫する", check: () => gameState.totalCucumbers >= 100, icon: "🌱" },
  { id: "harvest_1000", title: "きゅうりマスター", desc: "通算1,000本のきゅうりを収穫する", check: () => gameState.totalCucumbers >= 1000, icon: "🥒" },
  { id: "kappa_1", title: "はじめての保護", desc: "河童を1匹救出・保護する", check: () => gameState.kappas >= 1, icon: "🪷" },
  { id: "kappa_10", title: "河童の守護者", desc: "河童を10匹保護する", check: () => gameState.kappas >= 10, icon: "🛡️" }
];

const newsList = [
  "【速報】全国で河童の保護活動が本格化しています。",
  "【話題】特製きゅうりの収穫速度が大幅に向上中！",
  "【気象】河童の活動に適した湿潤な天候が続いています。",
  "【保護区】「もっときゅうりを！」保護された河童たちが元気にアピール。"
];

// --- 3. DOM要素 ---
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

const tabUpgradesBtn = document.getElementById("tab-upgrades-btn");
const tabProtectBtn = document.getElementById("tab-protect-btn");
const tabTrapBtn = document.getElementById("tab-trap-btn");

const tabUpgradesContent = document.getElementById("tab-upgrades");
const tabProtectContent = document.getElementById("tab-protect");
const tabTrapContent = document.getElementById("tab-trap");

const zukanGridEl = document.getElementById("zukan-grid");
const achieveListEl = document.getElementById("achieve-list");
const effectToggleEl = document.getElementById("effect-toggle");

let combo = 1;
let comboTimer = null;

// --- 4. 初期化 ---
function init() {
  loadGame();
  renderUpgrades();
  updateTrapUI();
  updateUI();

  setInterval(gameLoop, 100);
  setInterval(saveGame, 10000);
  setInterval(updateNews, 15000);

  setupEventListeners();
}

// --- 5. イベントリスナー ---
function setupEventListeners() {
  // クリック収穫
  clickTargetEl.addEventListener("click", (e) => {
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

    const gain = gameState.clickPower * (1 + (combo - 1) * 0.1);
    gameState.cucumbers += gain;
    gameState.totalCucumbers += gain;

    if (gameState.effectsEnabled) {
      createFloatingText(e.clientX, e.clientY, `+${Math.floor(gain)}`);
      triggerKappaBounce();
    }

    checkAchievements();
    updateUI();
  });

  // 救出ボタン
  rescueKappaBtn.addEventListener("click", () => {
    if (gameState.cucumbers >= gameState.rescueCost) {
      gameState.cucumbers -= gameState.rescueCost;
      gameState.kappas += 1;
      gameState.rescueCost = Math.floor(gameState.rescueCost * 1.25);
      rescueCostEl.textContent = gameState.rescueCost;

      if (gameState.effectsEnabled) triggerKappaBounce();

      checkAchievements();
      updateUI();
      saveGame();
    }
  });

  // タブ切替
  tabUpgradesBtn.addEventListener("click", () => switchTab("upgrades"));
  tabProtectBtn.addEventListener("click", () => switchTab("protect"));
  if (tabTrapBtn) tabTrapBtn.addEventListener("click", () => switchTab("trap"));

  // モーダルオープン
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

  // モーダル閉じる
  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute("data-target");
      if (targetId) closeModal(targetId);
    });
  });

  document.querySelectorAll(".modal-content").forEach(content => {
    content.addEventListener("click", (e) => e.stopPropagation());
  });

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", () => closeModal(modal.id));
  });

  // トラップ関連イベント
  const setTrapBtn = document.getElementById("set-trap-btn");
  const checkTrapBtn = document.getElementById("check-trap-btn");

  if (setTrapBtn) {
    setTrapBtn.addEventListener("click", () => {
      if (gameState.cucumbers >= gameState.trap.cost && !gameState.trap.isSet) {
        gameState.cucumbers -= gameState.trap.cost;
        gameState.trap.isSet = true;
        gameState.trap.isReady = false;
        gameState.trap.endTime = Date.now() + gameState.trap.duration * 1000;

        updateTrapUI();
        updateUI();
        saveGame();
      }
    });
  }

  if (checkTrapBtn) {
    checkTrapBtn.addEventListener("click", () => {
      if (gameState.trap.isReady) {
        const caughtCount = Math.floor(Math.random() * 3) + 1;
        gameState.kappas += caughtCount;
        alert(`🎉 罠に仕掛けたきゅうりにつられて、河童を ${caughtCount} 匹捕獲しました！`);

        gameState.trap.isSet = false;
        gameState.trap.isReady = false;

        checkAchievements();
        updateTrapUI();
        updateUI();
        saveGame();
      }
    });
  }

  // 設定関連
  effectToggleEl.addEventListener("change", (e) => {
    gameState.effectsEnabled = e.target.checked;
  });

  document.getElementById("export-save-btn").addEventListener("click", () => {
    saveGame();
    alert("ゲームデータを手動保存しました！");
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("本当にデータをリセットしますか？")) {
      localStorage.removeItem("kappaProjectSaveV2");
      location.reload();
    }
  });
}

// --- 6. タブ切り替えヘルパー ---
function switchTab(tabName) {
  tabUpgradesBtn.classList.toggle("active", tabName === "upgrades");
  tabProtectBtn.classList.toggle("active", tabName === "protect");
  if (tabTrapBtn) tabTrapBtn.classList.toggle("active", tabName === "trap");

  tabUpgradesContent.classList.toggle("hidden", tabName !== "upgrades");
  tabProtectContent.classList.toggle("hidden", tabName !== "protect");
  if (tabTrapContent) tabTrapContent.classList.toggle("hidden", tabName !== "trap");
}

// --- 7. ループ処理 ---
let lastTick = Date.now();
function gameLoop() {
  const now = Date.now();
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  if (gameState.cps > 0) {
    const autoGain = gameState.cps * delta;
    gameState.cucumbers += autoGain;
    gameState.totalCucumbers += autoGain;
    checkAchievements();
    updateUI();
  }

  // トラップタイマー計算
  if (gameState.trap && gameState.trap.isSet && !gameState.trap.isReady) {
    const remaining = Math.max(0, Math.ceil((gameState.trap.endTime - Date.now()) / 1000));
    const timerEl = document.getElementById("trap-timer");
    
    if (remaining <= 0) {
      gameState.trap.isReady = true;
      updateTrapUI();
    } else if (timerEl) {
      timerEl.textContent = `残り時間: ${remaining}秒`;
    }
  }
}

// --- 8. UI更新 ---
function updateUI() {
  cucumberCountEl.textContent = Math.floor(gameState.cucumbers).toLocaleString();
  kappaCountEl.textContent = gameState.kappas.toLocaleString();

  Object.keys(gameState.upgrades).forEach(id => {
    const item = gameState.upgrades[id];
    const btn = document.getElementById(`buy-${id}`);
    const card = document.getElementById(`upgrade-card-${id}`);
    if (btn && card) {
      card.classList.toggle("disabled", gameState.cucumbers < item.cost);
      btn.disabled = gameState.cucumbers < item.cost;
    }
  });

  rescueKappaBtn.disabled = gameState.cucumbers < gameState.rescueCost;

  const setTrapBtn = document.getElementById("set-trap-btn");
  if (setTrapBtn && !gameState.trap.isSet) {
    setTrapBtn.disabled = gameState.cucumbers < gameState.trap.cost;
  }
}

function updateTrapUI() {
  const iconEl = document.getElementById("trap-status-icon");
  const statusEl = document.getElementById("trap-status-text");
  const timerEl = document.getElementById("trap-timer");
  const setBtn = document.getElementById("set-trap-btn");
  const checkBtn = document.getElementById("check-trap-btn");

  if (!iconEl || !statusEl || !timerEl || !setBtn || !checkBtn) return;

  if (!gameState.trap.isSet) {
    iconEl.textContent = "🧺";
    statusEl.textContent = "仕掛け準備完了";
    timerEl.textContent = "仕掛け時間: 30秒";
    setBtn.classList.remove("hidden");
    checkBtn.classList.add("hidden");
    setBtn.disabled = gameState.cucumbers < gameState.trap.cost;
  } else if (gameState.trap.isSet && !gameState.trap.isReady) {
    iconEl.textContent = "⏳";
    statusEl.textContent = "河童を誘き寄せ中...";
    setBtn.classList.add("hidden");
    checkBtn.classList.add("hidden");
  } else if (gameState.trap.isReady) {
    iconEl.textContent = "🎁";
    statusEl.textContent = "なにかが罠にかかったようだ！";
    timerEl.textContent = "回収可能！";
    setBtn.classList.add("hidden");
    checkBtn.classList.remove("hidden");
  }
}

// --- 9. アップグレード描画 ---
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
    item.cost = Math.floor(item.cost * 1.15);
    
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

// --- 10. モーダル類 ---
function renderZukan() {
  zukanGridEl.innerHTML = "";
  zukanData.forEach(item => {
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

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// --- 11. セーブ & ロード ---
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

      if (parsed.trap) {
        gameState.trap = { ...gameState.trap, ...parsed.trap };
      }

      rescueCostEl.textContent = gameState.rescueCost;
      effectToggleEl.checked = gameState.effectsEnabled;
      
      recalculateStats();
    } catch (e) {
      console.error("ロード失敗:", e);
    }
  }
}

// ゲーム起動
init();
