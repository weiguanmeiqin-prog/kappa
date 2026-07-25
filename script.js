/**
 * 河童保護プロジェクト v2.0 - 図鑑＆実績拡張版
 */

// 1. ゲーム状態
const gameState = {
  cucumbers: 0,
  totalCucumbers: 0,
  kappas: 0,
  clickPower: 1,
  cps: 0,
  effectsEnabled: true,
  rescueCost: 50, // 救出コストは50固定
  trapCaughtTotal: 0, // 罠で捕獲した合計数
  
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

// 2. マスタデータ (図鑑を拡張)
const zukanData = [
  { id: "normal", name: "ノーマル河童", icon: "🥒🪷", reqKappas: 0, desc: "一般的な河童。きゅうりが大好物。" },
  { id: "volunteer", name: "お手伝い河童", icon: "🧢🥒", reqKappas: 5, desc: "人間のお手伝いをするのが好きな心優しい河童。" },
  { id: "farmer", name: "農家河童", icon: "👨‍🌾🥒", reqKappas: 15, desc: "きゅうり栽培の技術をマスターした職人肌の河童。" },
  { id: "king", name: "長老河童", icon: "👑🪷", reqKappas: 50, desc: "保護区の長。圧倒的な威厳と経験を併せ持つ。" },
  { id: "ninja", name: "忍者河童", icon: "🥷🥒", reqKappas: 100, desc: "水遁の術を極めた忍びの河童。素早い。" },
  { id: "cyber", name: "メカ河童", icon: "🤖🪷", reqKappas: 250, desc: "最先端技術でサイボーグ化した超スペック河童。" },
  { id: "emperor", name: "河童王", icon: "🤴🥒", reqKappas: 500, desc: "全国の河童たちを率いる偉大な王様。" },
  { id: "god", name: "神河童", icon: "🌟🪷", reqKappas: 1000, desc: "きゅうりの神に選ばれし伝説の全知全能河童。" }
];

// 実績を拡張
const achievementsData = [
  { id: "harvest_100", title: "収穫ビギナー", desc: "通算100本のきゅうりを収穫する", check: () => gameState.totalCucumbers >= 100, icon: "🌱" },
  { id: "harvest_1000", title: "きゅうりマスター", desc: "通算1,000本のきゅうりを収穫する", check: () => gameState.totalCucumbers >= 1000, icon: "🥒" },
  { id: "harvest_1m", title: "きゅうり帝国", desc: "通算1,000,000本のきゅうりを収穫する", check: () => gameState.totalCucumbers >= 1000000, icon: "🏰" },
  { id: "kappa_1", title: "はじめての保護", desc: "河童を1匹救出・保護する", check: () => gameState.kappas >= 1, icon: "🪷" },
  { id: "kappa_10", title: "河童の守護者", desc: "河童を10匹保護する", check: () => gameState.kappas >= 10, icon: "🛡️" },
  { id: "kappa_100", title: "河童のパラダイス", desc: "河童を100匹保護する", check: () => gameState.kappas >= 100, icon: "🏞️" },
  { id: "kappa_1000", title: "伝説の保護団体", desc: "河童を1,000匹保護する", check: () => gameState.kappas >= 1000, icon: "✨" },
  { id: "trap_master", title: "罠の達人", desc: "罠で通算10匹以上の河童を捕獲する", check: () => gameState.trapCaughtTotal >= 10, icon: "🪤" }
];

const newsList = [
  "【速報】全国で河童の保護活動が本格化しています。",
  "【話題】特製きゅうりの収穫速度が大幅に向上中！",
  "【気象】河童の活動に適した湿潤な天候が続いています。",
  "【保護区】「もっときゅうりを！」保護された河童たちが元気にアピール。",
  "【目撃】忍者河童が川面を走っているのが目撃されました。",
  "【噂】伝説の「神河童」がきゅうり畑に降臨するという都市伝説が流行中。"
];

let combo = 1;
let comboTimer = null;

// DOMの読み込みが完全に完了してから初期化を実行する
document.addEventListener("DOMContentLoaded", () => {
  try {
    init();
  } catch (err) {
    console.error("初期化中にエラーが発生しました:", err);
  }
});

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

function setupEventListeners() {
  const clickTarget = document.getElementById("click-target");
  if (clickTarget) {
    clickTarget.addEventListener("click", (e) => {
      combo++;
      const comboDisplay = document.getElementById("combo-display");
      const comboCount = document.getElementById("combo-count");
      
      if (combo > 1 && comboDisplay && comboCount) {
        comboDisplay.classList.remove("hidden");
        comboCount.textContent = combo;
      }
      clearTimeout(comboTimer);
      comboTimer = setTimeout(() => {
        combo = 1;
        if (comboDisplay) comboDisplay.classList.add("hidden");
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
  }

  // 河童救出ボタン（コスト固定）
  const rescueBtn = document.getElementById("rescue-kappa-btn");
  if (rescueBtn) {
    rescueBtn.addEventListener("click", () => {
      if (gameState.cucumbers >= gameState.rescueCost) {
        gameState.cucumbers -= gameState.rescueCost;
        gameState.kappas += 1;

        const rescueCostEl = document.getElementById("rescue-cost");
        if (rescueCostEl) rescueCostEl.textContent = gameState.rescueCost;

        if (gameState.effectsEnabled) triggerKappaBounce();

        checkAchievements();
        updateUI();
        saveGame();
      }
    });
  }

  // タブ切り替え
  bindClick("tab-upgrades-btn", () => switchTab("upgrades"));
  bindClick("tab-protect-btn", () => switchTab("protect"));
  bindClick("tab-trap-btn", () => switchTab("trap"));

  // モーダル開閉
  bindClick("zukan-btn", () => { renderZukan(); openModal("zukan-modal"); });
  bindClick("achieve-btn", () => { renderAchievements(); openModal("achieve-modal"); });
  bindClick("settings-btn", () => { openModal("settings-modal"); });

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

  // トラップ機能
  bindClick("set-trap-btn", () => {
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

  bindClick("check-trap-btn", () => {
    if (gameState.trap.isReady) {
      const caughtCount = Math.floor(Math.random() * 3) + 1;
      gameState.kappas += caughtCount;
      gameState.trapCaughtTotal = (gameState.trapCaughtTotal || 0) + caughtCount; // カウント保持
      alert(`🎉 罠に仕掛けたきゅうりにつられて、河童を ${caughtCount} 匹捕獲しました！`);

      gameState.trap.isSet = false;
      gameState.trap.isReady = false;

      checkAchievements();
      updateTrapUI();
      updateUI();
      saveGame();
    }
  });

  // 設定項目
  const effectToggle = document.getElementById("effect-toggle");
  if (effectToggle) {
    effectToggle.addEventListener("change", (e) => {
      gameState.effectsEnabled = e.target.checked;
    });
  }

  bindClick("export-save-btn", () => {
    saveGame();
    alert("ゲームデータを手動保存しました！");
  });

  bindClick("reset-btn", () => {
    if (confirm("本当にデータをリセットしますか？")) {
      localStorage.removeItem("kappaProjectSaveV2");
      location.reload();
    }
  });
}

function bindClick(id, callback) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", callback);
}

function switchTab(tabName) {
  const btnMap = { upgrades: "tab-upgrades-btn", protect: "tab-protect-btn", trap: "tab-trap-btn" };
  const contentMap = { upgrades: "tab-upgrades", protect: "tab-protect", trap: "tab-trap" };

  Object.keys(btnMap).forEach(key => {
    const btn = document.getElementById(btnMap[key]);
    const content = document.getElementById(contentMap[key]);
    if (btn) btn.classList.toggle("active", key === tabName);
    if (content) content.classList.toggle("hidden", key !== tabName);
  });
}

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

function updateUI() {
  const cucEl = document.getElementById("cucumber-count");
  const kapEl = document.getElementById("kappa-count");
  if (cucEl) cucEl.textContent = Math.floor(gameState.cucumbers).toLocaleString();
  if (kapEl) kapEl.textContent = gameState.kappas.toLocaleString();

  Object.keys(gameState.upgrades).forEach(id => {
    const item = gameState.upgrades[id];
    const btn = document.getElementById(`buy-${id}`);
    const card = document.getElementById(`upgrade-card-${id}`);
    if (btn && card) {
      card.classList.toggle("disabled", gameState.cucumbers < item.cost);
      btn.disabled = gameState.cucumbers < item.cost;
    }
  });

  const rescueBtn = document.getElementById("rescue-kappa-btn");
  if (rescueBtn) rescueBtn.disabled = gameState.cucumbers < gameState.rescueCost;

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

function renderUpgrades() {
  const upgradeListEl = document.getElementById("upgrade-list");
  if (!upgradeListEl) return;
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

function renderZukan() {
  const zukanGridEl = document.getElementById("zukan-grid");
  if (!zukanGridEl) return;
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
  const achieveListEl = document.getElementById("achieve-list");
  if (!achieveListEl) return;
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
  const kappaSpriteEl = document.getElementById("kappa-character");
  if (!kappaSpriteEl) return;
  kappaSpriteEl.classList.remove("bounce");
  void kappaSpriteEl.offsetWidth;
  kappaSpriteEl.classList.add("bounce");
}

function updateNews() {
  const randomIndex = Math.floor(Math.random() * newsList.length);
  showNews(newsList[randomIndex]);
}

function showNews(text) {
  const newsTextEl = document.getElementById("news-text");
  const newsTickerEl = document.getElementById("news-ticker");
  if (!newsTextEl || !newsTickerEl) return;
  
  newsTextEl.textContent = text;
  newsTickerEl.classList.remove("news-slide-in");
  void newsTickerEl.offsetWidth;
  newsTickerEl.classList.add("news-slide-in");
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

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
      gameState.rescueCost = 50;
      gameState.trapCaughtTotal = parsed.trapCaughtTotal || 0;
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

      const rescueCostEl = document.getElementById("rescue-cost");
      if (rescueCostEl) rescueCostEl.textContent = gameState.rescueCost;

      const effectToggle = document.getElementById("effect-toggle");
      if (effectToggle) effectToggle.checked = gameState.effectsEnabled;
      
      recalculateStats();
    } catch (e) {
      console.error("セーブデータの読み込み失敗:", e);
    }
  }
}
