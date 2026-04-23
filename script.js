const STARTERS = [
  { name: 'Pyron', type: 'fire', maxHp: 120, generator: { ember: 2 }, moves: ['Flare Bite', 'Tail Slam'] },
  { name: 'Aquaff', type: 'water', maxHp: 130, generator: { dew: 2 }, moves: ['Bubble Burst', 'Headbutt'] },
  { name: 'Leaflit', type: 'grass', maxHp: 125, generator: { fiber: 2 }, moves: ['Vine Whip', 'Quick Peck'] }
];

const WILD_POOL = [
  ...STARTERS,
  { name: 'Voltkit', type: 'electric', maxHp: 112, generator: { spark: 2 }, moves: ['Spark Jab', 'Bolt Dash'] },
  { name: 'Rockoal', type: 'earth', maxHp: 145, generator: { ore: 2 }, moves: ['Stone Ram', 'Dust Roar'] }
];

const RECIPES = {
  regular_ball: { label: 'Regular Ploxball', cost: { fiber: 1, ore: 1 }, yield: 2 },
  great_ball: { label: 'Great Ploxball', cost: { ember: 2, spark: 2, ore: 1 }, yield: 1 },
  potion: { label: 'Potion', cost: { dew: 2, fiber: 1 }, yield: 1 },
  status_tonic: { label: 'Status Tonic', cost: { dew: 2, ember: 1, spark: 1 }, yield: 1 }
};

const defaultInventory = () => ({
  ploxballs_regular: 20,
  ploxballs_great: 0,
  potion: 1,
  status_tonic: 0,
  ember: 0,
  dew: 0,
  fiber: 0,
  spark: 0,
  ore: 0
});

const state = {
  account: null,
  activeTab: 'hub',
  encounter: null
};

const $ = (id) => document.getElementById(id);
const els = {};

const uid = () => Math.random().toString(36).slice(2, 10);
const hash = (text) => btoa(unescape(encodeURIComponent(text))).slice(0, 24);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function loadAccountByName(name) {
  const raw = localStorage.getItem(`ploxmon_account_${name.toLowerCase()}`);
  return raw ? JSON.parse(raw) : null;
}

function saveAccount(account = state.account) {
  if (!account) return;
  account.updatedAt = Date.now();
  localStorage.setItem(`ploxmon_account_${account.name.toLowerCase()}`, JSON.stringify(account));
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 1800);
}

function toPlox(mon) {
  return { ...mon, id: uid(), hp: mon.maxHp, level: 1, assigned: 'squad' };
}

function ensureDom() {
  const ids = [
    'auth-view','starter-view','game-view','profile-chip','starter-list','toast','create-name','create-pass','create-btn',
    'login-name','login-pass','login-btn','tab-hub','tab-crafting','tab-wild','tab-settings','tab-battle'
  ];

  for (const id of ids) {
    els[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = $(id);
    if (!els[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]) {
      console.error(`Missing element #${id}`);
      return false;
    }
  }

  els.navButtons = Array.from(document.querySelectorAll('.nav-btn'));
  return true;
}

function showView(view) {
  els.authView.classList.toggle('hidden', view !== 'auth');
  els.starterView.classList.toggle('hidden', view !== 'starter');
  els.gameView.classList.toggle('hidden', view !== 'game');
}

function currentSquad() {
  return state.account.ploxmons.filter((p) => p.assigned === 'squad');
}

function workers() {
  return state.account.ploxmons.filter((p) => p.assigned === 'worker');
}

function collectWorkerItems() {
  const now = Date.now();
  const elapsedMins = Math.floor((now - state.account.lastCollectedAt) / 60000);
  if (elapsedMins <= 0) return;

  for (const w of workers()) {
    const [item, perMin] = Object.entries(w.generator)[0];
    state.account.inventory[item] += perMin * elapsedMins;
  }

  state.account.lastCollectedAt = now;
  saveAccount();
}

function setTab(tab) {
  state.activeTab = tab;
  els.navButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  ['hub','crafting','wild','settings','battle'].forEach((name) => {
    $(`tab-${name}`).classList.toggle('hidden', name !== tab);
  });
  renderTabs();
}

function renderStarterSelect() {
  els.starterList.innerHTML = '';
  STARTERS.forEach((s) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${s.name}</h3>
      <p class="help">Type: ${s.type} · HP: ${s.maxHp}</p>
      <p class="help">Idle item: ${Object.keys(s.generator)[0]}</p>
      <button>Choose ${s.name}</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      state.account.ploxmons = [toPlox(s)];
      saveAccount();
      showView('game');
      toast(`${s.name} joined your squad!`);
      renderProfile();
      setTab('hub');
    });

    els.starterList.append(card);
  });
}

function renderProfile() {
  els.profileChip.classList.remove('hidden');
  els.profileChip.textContent = `${state.account.name} · Lv ${state.account.trainerLevel} Trainer`;
}

function renderHub() {
  collectWorkerItems();
  const inv = state.account.inventory;
  const squad = currentSquad();
  const workerMon = workers();

  els.tabHub.innerHTML = `
    <h2>Trainer Hub</h2>
    <p>Manage your Ploxmon, heal your squad, and assign workers to passively gather materials.</p>
    <div class="kpi-row">
      <div class="kpi">Regular Balls<b>${inv.ploxballs_regular}</b></div>
      <div class="kpi">Great Balls<b>${inv.ploxballs_great}</b></div>
      <div class="kpi">Potions<b>${inv.potion}</b></div>
      <div class="kpi">Workers<b>${workerMon.length}</b></div>
    </div>
    <div class="split">
      <article class="card">
        <h3>Battle Squad</h3>
        <p class="help">Ploxmon here are available in Wild + Battle tabs.</p>
        <div id="squad-list"></div>
        <button id="heal-all">Heal Squad (uses 1 Potion)</button>
      </article>
      <article class="card">
        <h3>Item Workers</h3>
        <p class="help">Workers are removed from battle squad and generate items over time.</p>
        <div id="worker-list"></div>
      </article>
    </div>
  `;

  const squadList = $('squad-list');
  const workerList = $('worker-list');

  squad.forEach((m) => {
    const row = document.createElement('div');
    row.innerHTML = `${m.name} (HP ${m.hp}/${m.maxHp}) <button data-id="${m.id}">Assign Worker</button>`;
    row.querySelector('button').onclick = () => {
      m.assigned = 'worker';
      saveAccount();
      renderTabs();
    };
    squadList.append(row);
  });

  workerMon.forEach((m) => {
    const item = Object.keys(m.generator)[0];
    const row = document.createElement('div');
    row.innerHTML = `${m.name} generating ${item} <button data-id="${m.id}">Return to Squad</button>`;
    row.querySelector('button').onclick = () => {
      m.assigned = 'squad';
      saveAccount();
      renderTabs();
    };
    workerList.append(row);
  });

  $('heal-all').onclick = () => {
    if (inv.potion <= 0) return toast('No potion available. Craft one first.');
    inv.potion -= 1;
    squad.forEach((m) => {
      m.hp = m.maxHp;
    });
    saveAccount();
    renderTabs();
    toast('Squad healed.');
  };
}

function canCraft(recipe) {
  return Object.entries(recipe.cost).every(([item, amount]) => state.account.inventory[item] >= amount);
}

function renderCrafting() {
  const inv = state.account.inventory;
  els.tabCrafting.innerHTML = `
    <h2>Crafting</h2>
    <p>Use materials generated by worker Ploxmon to craft balls and recovery items.</p>
    <article class="card">
      <h3>Materials</h3>
      <p>ember ${inv.ember} · dew ${inv.dew} · fiber ${inv.fiber} · spark ${inv.spark} · ore ${inv.ore}</p>
    </article>
    <div id="recipe-list" class="split"></div>
  `;

  const container = $('recipe-list');
  Object.entries(RECIPES).forEach(([key, recipe]) => {
    const c = document.createElement('article');
    c.className = 'card';
    const costs = Object.entries(recipe.cost).map(([item, qty]) => `${qty} ${item}`).join(', ');
    c.innerHTML = `<h3>${recipe.label}</h3><p class="help">Cost: ${costs}</p><button>Craft</button>`;
    const btn = c.querySelector('button');
    btn.disabled = !canCraft(recipe);
    btn.onclick = () => {
      if (!canCraft(recipe)) return;
      Object.entries(recipe.cost).forEach(([item, qty]) => {
        inv[item] -= qty;
      });
      if (key === 'regular_ball') inv.ploxballs_regular += recipe.yield;
      if (key === 'great_ball') inv.ploxballs_great += recipe.yield;
      if (key === 'potion') inv.potion += recipe.yield;
      if (key === 'status_tonic') inv.status_tonic += recipe.yield;
      saveAccount();
      renderTabs();
      toast(`${recipe.label} crafted.`);
    };
    container.append(c);
  });
}

function throwBall(encounter, ballType) {
  const inv = state.account.inventory;
  const hpFactor = 1 - encounter.hp / encounter.maxHp;
  const base = ballType === 'great' ? 0.45 : 0.25;
  const chance = Math.min(0.92, base + hpFactor * 0.5);

  if (ballType === 'great') inv.ploxballs_great -= 1;
  else inv.ploxballs_regular -= 1;

  if (Math.random() < chance) {
    state.account.ploxmons.push(toPlox(encounter));
    state.encounter = null;
    saveAccount();
    renderTabs();
    toast(`Captured ${encounter.name}!`);
    return;
  }

  encounter.hp = Math.max(1, encounter.hp - Math.floor(Math.random() * 8));
  saveAccount();
  renderTabs();
  toast(`${encounter.name} escaped the ball.`);
}

function renderWild() {
  const squad = currentSquad();
  const inv = state.account.inventory;
  const lead = squad[0];

  els.tabWild.innerHTML = `
    <h2>Wild</h2>
    <p>Find and capture wild Ploxmon. You need at least one squad member to search.</p>
    <div class="split">
      <article class="card">
        <h3>Search Zone</h3>
        <p class="help">Lead: ${lead ? lead.name : 'none'} · Regular Balls: ${inv.ploxballs_regular} · Great Balls: ${inv.ploxballs_great}</p>
        <button id="search-wild" ${lead ? '' : 'disabled'}>Search Wild</button>
        <div id="encounter-box"></div>
      </article>
      <article class="card">
        <h3>How capture works</h3>
        <p class="help">Lower wild HP = easier captures. Great Ploxballs have better base chance.</p>
        <p class="help">Tip: keep at least one Ploxmon in squad. Workers cannot battle.</p>
      </article>
    </div>
  `;

  $('search-wild').onclick = () => {
    if (!lead) return;
    const found = toPlox(pick(WILD_POOL));
    found.hp = Math.max(18, found.maxHp - Math.floor(Math.random() * 60));
    state.encounter = found;
    renderTabs();
    toast(`A wild ${found.name} appeared!`);
  };

  const box = $('encounter-box');
  if (state.encounter) {
    const e = state.encounter;
    box.innerHTML = `
      <div class="log">
        <div class="system">Wild ${e.name} (${e.type})</div>
        <div>HP: ${e.hp}/${e.maxHp}</div>
      </div>
      <div class="split" style="margin-top:.6rem">
        <button id="throw-regular" ${inv.ploxballs_regular <= 0 ? 'disabled' : ''}>Throw Regular Ball</button>
        <button id="throw-great" ${inv.ploxballs_great <= 0 ? 'disabled' : ''}>Throw Great Ball</button>
      </div>
      <button id="leave-wild" style="margin-top:.6rem">Leave Encounter</button>
    `;

    $('throw-regular').onclick = () => throwBall(e, 'regular');
    $('throw-great').onclick = () => throwBall(e, 'great');
    $('leave-wild').onclick = () => {
      state.encounter = null;
      renderTabs();
    };
  }
}

function renderBattle() {
  els.tabBattle.innerHTML = `
    <h2>Battle</h2>
    <p>Online PvP requires a backend server. For now, this tab queues you against local ghost trainers.</p>
    <article class="card">
      <h3>Ghost Arena (offline placeholder)</h3>
      <p class="help">Battle rules: uses your first squad Ploxmon. Winner gets 1 trainer XP + 1 random material.</p>
      <button id="queue-battle" ${currentSquad().length ? '' : 'disabled'}>Queue Battle</button>
      <div id="battle-log" class="log"></div>
    </article>
  `;

  $('queue-battle').onclick = () => {
    const lead = currentSquad()[0];
    const ghost = pick(WILD_POOL);
    const winChance = lead ? Math.min(0.9, 0.5 + lead.level * 0.03) : 0;
    const win = Math.random() < winChance;
    const log = $('battle-log');
    log.innerHTML = '';
    log.innerHTML += `<div class="system">You vs Ghost Trainer using ${ghost.name}</div>`;

    if (win) {
      const reward = pick(['ember', 'dew', 'fiber', 'spark', 'ore']);
      state.account.inventory[reward] += 1;
      state.account.trainerLevel += 1;
      log.innerHTML += `<div class="win">Victory! +1 ${reward}, trainer level up.</div>`;
    } else {
      log.innerHTML += '<div class="lose">Defeat. Heal and craft, then queue again.</div>';
    }

    saveAccount();
    renderProfile();
    toast('Battle completed.');
  };
}

function renderSettings() {
  els.tabSettings.innerHTML = `
    <h2>Settings</h2>
    <p>Manage account session and local save data.</p>
    <article class="card">
      <h3>Account</h3>
      <p class="help">Signed in as ${state.account.name}</p>
      <button id="sign-out">Sign Out</button>
      <button id="delete-save">Delete Save</button>
    </article>
  `;

  $('sign-out').onclick = () => {
    state.account = null;
    state.encounter = null;
    els.profileChip.classList.add('hidden');
    showView('auth');
    toast('Signed out.');
  };

  $('delete-save').onclick = () => {
    localStorage.removeItem(`ploxmon_account_${state.account.name.toLowerCase()}`);
    state.account = null;
    state.encounter = null;
    els.profileChip.classList.add('hidden');
    showView('auth');
    toast('Save deleted.');
  };
}

function renderTabs() {
  if (!state.account) return;
  renderHub();
  renderCrafting();
  renderWild();
  renderSettings();
  renderBattle();
}

function createAccount() {
  const name = els.createName.value.trim();
  const pass = els.createPass.value;
  if (!name || pass.length < 3) return toast('Use a name and password (3+ chars).');
  if (loadAccountByName(name)) return toast('That trainer name already exists.');

  state.account = {
    name,
    passHash: hash(pass),
    trainerLevel: 1,
    inventory: defaultInventory(),
    ploxmons: [],
    lastCollectedAt: Date.now(),
    updatedAt: Date.now()
  };

  saveAccount();
  renderProfile();
  showView('starter');
  renderStarterSelect();
}

function login() {
  const name = els.loginName.value.trim();
  const pass = els.loginPass.value;
  const account = loadAccountByName(name);
  if (!account || account.passHash !== hash(pass)) return toast('Invalid login.');

  state.account = account;
  collectWorkerItems();
  renderProfile();

  if (!state.account.ploxmons.length) {
    showView('starter');
    renderStarterSelect();
  } else {
    showView('game');
    setTab('hub');
  }

  toast(`Welcome back, ${name}.`);
}

function wireEvents() {
  els.createBtn.addEventListener('click', createAccount);
  els.loginBtn.addEventListener('click', login);
  els.navButtons.forEach((btn) => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
}

function init() {
  if (!ensureDom()) return;
  showView('auth');
  wireEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
