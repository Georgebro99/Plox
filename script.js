const STARTERS = [
  {
    name: 'Pyron',
    type: 'fire',
    maxHp: 120,
    generator: { ember: 2 },
    moves: [
      { name: 'Flare Bite', power: 24, accuracy: 0.9, type: 'fire' },
      { name: 'Tail Slam', power: 18, accuracy: 0.95, type: 'normal' },
      { name: 'Blaze Rush', power: 20, accuracy: 0.93, type: 'fire' },
      { name: 'Focus Up', power: 0, accuracy: 1, type: 'buff', buff: 6 }
    ],
    unlockMoves: [{ level: 5, move: { name: 'Inferno Spin', power: 30, accuracy: 0.86, type: 'fire' } }]
  },
  {
    name: 'Aquaff',
    type: 'water',
    maxHp: 130,
    generator: { dew: 2 },
    moves: [
      { name: 'Bubble Burst', power: 21, accuracy: 0.95, type: 'water' },
      { name: 'Headbutt', power: 17, accuracy: 0.98, type: 'normal' },
      { name: 'Tidal Kick', power: 22, accuracy: 0.9, type: 'water' },
      { name: 'Shell Guard', power: 0, accuracy: 1, type: 'buff', buff: 7 }
    ],
    unlockMoves: [{ level: 5, move: { name: 'Maelstrom Shot', power: 31, accuracy: 0.84, type: 'water' } }]
  },
  {
    name: 'Leaflit',
    type: 'grass',
    maxHp: 125,
    generator: { fiber: 2 },
    moves: [
      { name: 'Vine Whip', power: 22, accuracy: 0.93, type: 'grass' },
      { name: 'Quick Peck', power: 15, accuracy: 1, type: 'normal' },
      { name: 'Seed Volley', power: 21, accuracy: 0.92, type: 'grass' },
      { name: 'Nature Pulse', power: 0, accuracy: 1, type: 'buff', buff: 8 }
    ],
    unlockMoves: [{ level: 5, move: { name: 'Thorn Cyclone', power: 30, accuracy: 0.86, type: 'grass' } }]
  }
];

const WILD_POOL = [
  ...STARTERS,
  {
    name: 'Voltkit',
    type: 'electric',
    maxHp: 112,
    generator: { spark: 2 },
    moves: [
      { name: 'Spark Jab', power: 20, accuracy: 0.95, type: 'electric' },
      { name: 'Bolt Dash', power: 25, accuracy: 0.84, type: 'electric' },
      { name: 'Quick Nudge', power: 16, accuracy: 1, type: 'normal' },
      { name: 'Charge Up', power: 0, accuracy: 1, type: 'buff', buff: 9 }
    ],
    unlockMoves: [{ level: 6, move: { name: 'Thunder Fang', power: 33, accuracy: 0.82, type: 'electric' } }]
  },
  {
    name: 'Rockoal',
    type: 'earth',
    maxHp: 145,
    generator: { ore: 2 },
    moves: [
      { name: 'Stone Ram', power: 23, accuracy: 0.9, type: 'earth' },
      { name: 'Dust Roar', power: 16, accuracy: 1, type: 'normal' },
      { name: 'Gravel Shot', power: 21, accuracy: 0.93, type: 'earth' },
      { name: 'Iron Focus', power: 0, accuracy: 1, type: 'buff', buff: 7 }
    ],
    unlockMoves: [{ level: 6, move: { name: 'Quake Break', power: 34, accuracy: 0.82, type: 'earth' } }]
  }
];

const EFFECTIVENESS = {
  fire: { grass: 1.3, water: 0.75, earth: 0.9 },
  water: { fire: 1.3, earth: 1.2, grass: 0.75 },
  grass: { water: 1.3, earth: 1.2, fire: 0.75 },
  electric: { water: 1.35, earth: 0.7, grass: 0.9 },
  earth: { electric: 1.35, fire: 1.1, water: 0.85 },
  normal: {}
};

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

const state = { account: null, activeTab: 'hub', encounter: null, wildTurnBusy: false, wildMenu: 'root', wildLog: [] };
const $ = (id) => document.getElementById(id);
const els = {};

const uid = () => Math.random().toString(36).slice(2, 10);
const hash = (text) => btoa(unescape(encodeURIComponent(text))).slice(0, 24);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function effectiveness(moveType, targetType) {
  return EFFECTIVENESS[moveType]?.[targetType] ?? 1;
}

function hpBar(hp, maxHp) {
  const pct = Math.max(0, Math.round((hp / maxHp) * 100));
  const cls = pct > 55 ? 'high' : pct > 25 ? 'mid' : 'low';
  return `<div class="hp-shell"><div class="hp-fill ${cls}" style="width:${pct}%"></div></div>`;
}


function xpToNext(level) {
  return 20 + level * 10;
}

function applyLevelGrowth(mon, onUnlock) {
  let leveled = false;
  while (mon.xp >= xpToNext(mon.level)) {
    mon.xp -= xpToNext(mon.level);
    mon.level += 1;
    mon.maxHp += 6;
    mon.hp = mon.maxHp;
    mon.moves = mon.moves.map((mv) => (mv.power > 0 ? { ...mv, power: mv.power + 1 } : mv));
    leveled = true;

    const unlock = (mon.unlockMoves || []).find((u) => u.level === mon.level);
    if (unlock) {
      mon.moves[mon.moves.length - 1] = unlock.move;
      if (onUnlock) onUnlock(mon, unlock.move);
    }
  }
  return leveled;
}

function grantXp(mon, amount, onUnlock) {
  mon.xp = (mon.xp || 0) + amount;
  return applyLevelGrowth(mon, onUnlock);
}

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
  return { ...structuredClone(mon), id: uid(), hp: mon.maxHp, level: 1, xp: 0, assigned: 'squad', attackBuff: 0, unlockMoves: structuredClone(mon.unlockMoves || []) };
}

function ensureDom() {
  const ids = [
    'auth-view','starter-view','game-view','profile-chip','starter-list','toast','create-name','create-pass','create-btn',
    'login-name','login-pass','login-btn','tab-hub','tab-crafting','tab-wild','tab-settings','tab-battle'
  ];
  for (const id of ids) {
    const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    els[key] = $(id);
    if (!els[key]) return false;
  }
  els.navButtons = Array.from(document.querySelectorAll('.nav-btn'));
  return true;
}

function showView(view) {
  els.authView.classList.toggle('hidden', view !== 'auth');
  els.starterView.classList.toggle('hidden', view !== 'starter');
  els.gameView.classList.toggle('hidden', view !== 'game');
}

const currentSquad = () => state.account.ploxmons.filter((p) => p.assigned === 'squad');
const workers = () => state.account.ploxmons.filter((p) => p.assigned === 'worker');

function collectWorkerItems() {
  const mins = Math.floor((Date.now() - state.account.lastCollectedAt) / 60000);
  if (mins <= 0) return;
  for (const w of workers()) {
    const [item, perMin] = Object.entries(w.generator)[0];
    state.account.inventory[item] += perMin * mins;
  }
  state.account.lastCollectedAt = Date.now();
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
    card.className = 'card mon-card';
    card.innerHTML = `<h3>${s.name}</h3><p class="pill">${s.type} type</p><p class="help">HP ${s.maxHp}</p><button>Choose</button>`;
    card.querySelector('button').onclick = () => {
      state.account.ploxmons = [toPlox(s)];
      saveAccount();
      showView('game');
      renderProfile();
      setTab('hub');
      toast(`${s.name} joined your squad!`);
    };
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

  els.tabHub.innerHTML = `
    <h2>Trainer Hub</h2>
    <p>Heal squad, assign workers, and manage your active battling Ploxmon.</p>
    <div class="kpi-row">
      <div class="kpi">Regular Balls<b>${inv.ploxballs_regular}</b></div>
      <div class="kpi">Great Balls<b>${inv.ploxballs_great}</b></div>
      <div class="kpi">Potions<b>${inv.potion}</b></div>
      <div class="kpi">Workers<b>${workers().length}</b></div>
    </div>
    <div class="split">
      <article class="card"><h3>Squad</h3><div id="squad-list"></div><button id="heal-all">Heal Squad (1 Potion)</button></article>
      <article class="card"><h3>Workers</h3><div id="worker-list"></div></article>
    </div>
  `;

  const squadList = $('squad-list');
  const workerList = $('worker-list');

  squad.forEach((m) => {
    const d = document.createElement('div');
    d.className = 'row';
    d.innerHTML = `<span>${m.name} Lv${m.level} ${m.type}</span><button>Assign Worker</button>`;
    d.querySelector('button').onclick = () => {
      m.assigned = 'worker';
      saveAccount();
      renderTabs();
    };
    squadList.append(d);
  });

  workers().forEach((m) => {
    const item = Object.keys(m.generator)[0];
    const d = document.createElement('div');
    d.className = 'row';
    d.innerHTML = `<span>${m.name} generating ${item}</span><button>Return</button>`;
    d.querySelector('button').onclick = () => {
      m.assigned = 'squad';
      saveAccount();
      renderTabs();
    };
    workerList.append(d);
  });

  $('heal-all').onclick = () => {
    if (inv.potion <= 0) return toast('No potion available.');
    inv.potion -= 1;
    squad.forEach((m) => {
      m.hp = m.maxHp;
      m.attackBuff = 0;
    });
    saveAccount();
    renderTabs();
  };
}

const canCraft = (recipe) => Object.entries(recipe.cost).every(([item, amt]) => state.account.inventory[item] >= amt);

function renderCrafting() {
  const inv = state.account.inventory;
  els.tabCrafting.innerHTML = `
    <h2>Crafting</h2>
    <p>Turn worker materials into battle tools.</p>
    <article class="card"><h3>Materials</h3><p>ember ${inv.ember} · dew ${inv.dew} · fiber ${inv.fiber} · spark ${inv.spark} · ore ${inv.ore}</p></article>
    <div id="recipe-list" class="split"></div>
  `;

  const list = $('recipe-list');
  Object.entries(RECIPES).forEach(([key, recipe]) => {
    const c = document.createElement('article');
    c.className = 'card';
    c.innerHTML = `<h3>${recipe.label}</h3><p class="help">${Object.entries(recipe.cost).map(([i, q]) => `${q} ${i}`).join(', ')}</p><button>Craft</button>`;
    const b = c.querySelector('button');
    b.disabled = !canCraft(recipe);
    b.onclick = () => {
      if (!canCraft(recipe)) return;
      Object.entries(recipe.cost).forEach(([i, q]) => (inv[i] -= q));
      if (key === 'regular_ball') inv.ploxballs_regular += recipe.yield;
      if (key === 'great_ball') inv.ploxballs_great += recipe.yield;
      if (key === 'potion') inv.potion += recipe.yield;
      if (key === 'status_tonic') inv.status_tonic += recipe.yield;
      saveAccount();
      renderTabs();
      toast(`${recipe.label} crafted.`);
    };
    list.append(c);
  });
}

function calcDamage(attacker, defender, move) {
  if (move.power === 0) return 0;
  if (Math.random() > move.accuracy) return -1;
  const typeMult = effectiveness(move.type, defender.type);
  const variance = 0.9 + Math.random() * 0.2;
  const levelScale = 1 + ((attacker.level || 1) - 1) * 0.05;
  return Math.max(1, Math.round((move.power + (attacker.attackBuff || 0)) * typeMult * variance * levelScale));
}

function renderFightCard(mon, label) {
  return `
    <article class="battle-card">
      <h4>${label}: ${mon.name}</h4>
      <p class="pill">${mon.type} · Lv ${mon.level}</p>
      ${hpBar(mon.hp, mon.maxHp)}
      <p class="help">HP ${mon.hp}/${mon.maxHp} · XP ${(mon.xp || 0)}/${xpToNext(mon.level || 1)}</p>
    </article>
  `;
}

async function playWildTurn(moveIndex) {
  if (!state.encounter || state.wildTurnBusy) return;
  state.wildTurnBusy = true;

  const you = currentSquad()[0];
  const wild = state.encounter;
  const move = you.moves[moveIndex];
  if (move.power === 0 && move.buff) {
    you.attackBuff = (you.attackBuff || 0) + move.buff;
    state.wildLog.push(`<div class=\"system\">${you.name} used ${move.name}. Attack +${move.buff}.</div>`);
  } else {
    const dmg = calcDamage(you, wild, move);
    if (dmg < 0) {
      state.wildLog.push(`<div>${you.name}'s ${move.name} missed.</div>`);
    } else {
      wild.hp = Math.max(0, wild.hp - dmg);
      state.wildLog.push(`<div>${you.name} used ${move.name} for ${dmg} dmg.</div>`);
    }
  }

  if (wild.hp <= 0) {
    state.wildLog.push(`<div class=\"win\">Wild ${wild.name} fainted.</div>`);
    const leveled = grantXp(you, 12, (m, mv) => state.wildLog.push(`<div class=\"system\">${m.name} learned ${mv.name}!</div>`));
    if (leveled) state.wildLog.push(`<div class=\"system\">${you.name} leveled up to Lv ${you.level}!</div>`);
    state.encounter = null;
    saveAccount();
    renderTabs();
    state.wildTurnBusy = false;
    return;
  }

  await sleep(450);
  const enemyMove = pick(wild.moves);
  if (enemyMove.power === 0 && enemyMove.buff) {
    wild.attackBuff = (wild.attackBuff || 0) + enemyMove.buff;
    state.wildLog.push(`<div class=\"system\">Wild ${wild.name} used ${enemyMove.name}. Attack rose.</div>`);
  } else {
    const enemyDmg = calcDamage(wild, you, enemyMove);
    if (enemyDmg < 0) {
      state.wildLog.push(`<div>Wild ${wild.name}'s ${enemyMove.name} missed.</div>`);
    } else {
      you.hp = Math.max(0, you.hp - enemyDmg);
      state.wildLog.push(`<div class=\"lose\">Wild ${wild.name} used ${enemyMove.name} for ${enemyDmg} dmg.</div>`);
    }
  }

  if (you.hp <= 0) {
    state.wildLog.push(`<div class=\"lose\">${you.name} fainted. Heal in Trainer Hub.</div>`);
    state.encounter = null;
  }

  saveAccount();
  renderTabs();
  state.wildTurnBusy = false;
}

function throwBall(ballType) {
  const inv = state.account.inventory;
  const wild = state.encounter;
  if (!wild) return;

  const hpFactor = 1 - wild.hp / wild.maxHp;
  const base = ballType === 'great' ? 0.45 : 0.22;
  const chance = Math.min(0.93, base + hpFactor * 0.52);

  if (ballType === 'great') {
    if (inv.ploxballs_great <= 0) return;
    inv.ploxballs_great -= 1;
  } else {
    if (inv.ploxballs_regular <= 0) return;
    inv.ploxballs_regular -= 1;
  }

  if (Math.random() < chance) {
    state.account.ploxmons.push(toPlox(wild));
    state.encounter = null;
    state.wildLog = [];
    toast('Capture successful!');
  } else {
    toast(`${wild.name} broke free.`);
  }

  saveAccount();
  renderTabs();
}


function renderWildActionMenu(lead, inv) {
  if (!state.encounter || !lead) return '';

  if (state.wildMenu === 'attack') {
    return `<div id="wild-attack" class="move-grid"></div><button id="back-root">Back</button>`;
  }

  if (state.wildMenu === 'switch') {
    return `<div id="wild-switch" class="move-grid"></div><button id="back-root">Back</button>`;
  }

  if (state.wildMenu === 'item') {
    return `
      <div class="move-grid">
        <button id="throw-regular" ${inv.ploxballs_regular <= 0 ? 'disabled' : ''}>Regular Ball (${inv.ploxballs_regular})</button>
        <button id="throw-great" ${inv.ploxballs_great <= 0 ? 'disabled' : ''}>Great Ball (${inv.ploxballs_great})</button>
        <button id="use-potion" ${inv.potion <= 0 ? 'disabled' : ''}>Use Potion (${inv.potion})</button>
      </div>
      <button id="back-root">Back</button>
    `;
  }

  return `
    <div class="battle-actions-grid">
      <button id="menu-attack">Attack</button>
      <button id="menu-switch">Switch</button>
      <button id="menu-item">Item</button>
      <button id="leave-wild">Leave</button>
    </div>
  `;
}

function wireWildActionMenu(lead, inv) {
  if (!state.encounter || !lead) return;

  if (state.wildMenu === 'root') {
    $('menu-attack').onclick = () => { state.wildMenu = 'attack'; renderTabs(); };
    $('menu-switch').onclick = () => { state.wildMenu = 'switch'; renderTabs(); };
    $('menu-item').onclick = () => { state.wildMenu = 'item'; renderTabs(); };
    $('leave-wild').onclick = () => { state.encounter = null; state.wildMenu = 'root'; state.wildLog = []; renderTabs(); };
    return;
  }

  $('back-root').onclick = () => { state.wildMenu = 'root'; renderTabs(); };

  if (state.wildMenu === 'attack') {
    const wrap = $('wild-attack');
    lead.moves.forEach((m, idx) => {
      const btn = document.createElement('button');
      btn.textContent = `${m.name} (${m.type})`;
      btn.disabled = state.wildTurnBusy;
      btn.onclick = () => { void playWildTurn(idx); };
      wrap.append(btn);
    });
    return;
  }

  if (state.wildMenu === 'switch') {
    const wrap = $('wild-switch');
    const squad = currentSquad();
    squad.forEach((m) => {
      const btn = document.createElement('button');
      btn.textContent = `${m.name} HP ${m.hp}/${m.maxHp}`;
      btn.disabled = m.id === lead.id || m.hp <= 0;
      btn.onclick = () => {
        const current = squad.find((x) => x.id === lead.id);
        const target = squad.find((x) => x.id === m.id);
        if (!current || !target) return;
        // reorder by moving selected to front in persistent array
        state.account.ploxmons = [
          ...state.account.ploxmons.filter((x) => x.id === target.id),
          ...state.account.ploxmons.filter((x) => x.id !== target.id)
        ];
        state.wildMenu = 'root';
        saveAccount();
        renderTabs();
      };
      wrap.append(btn);
    });
    return;
  }

  if (state.wildMenu === 'item') {
    $('throw-regular').onclick = () => throwBall('regular');
    $('throw-great').onclick = () => throwBall('great');
    $('use-potion').onclick = () => {
      if (inv.potion <= 0) return;
      inv.potion -= 1;
      lead.hp = Math.min(lead.maxHp, lead.hp + 35);
      saveAccount();
      toast(`${lead.name} recovered HP.`);
      renderTabs();
    };
  }
}
function renderWild() {
  const lead = currentSquad()[0];
  const inv = state.account.inventory;

  els.tabWild.innerHTML = `
    <h2>Wild</h2>
    <p>Battle wild Ploxmon with moves, then capture using the 4-action battle menu.</p>
    <article class="card">
      <div class="row"><b>Lead:</b> <span>${lead ? `${lead.name} HP ${lead.hp}/${lead.maxHp}` : 'None'}</span></div>
      <div class="row"><b>Balls:</b> <span>Regular ${inv.ploxballs_regular} · Great ${inv.ploxballs_great}</span></div>
      <button id="search-wild" ${lead ? '' : 'disabled'}>Search Wild Ploxmon</button>
      <div id="wild-area"></div>
    </article>
  `;

  $('search-wild').onclick = () => {
    if (!lead) return;
    const found = toPlox(pick(WILD_POOL));
    found.hp = Math.max(20, found.maxHp - Math.floor(Math.random() * 50));
    found.attackBuff = 0;
    state.encounter = found;
    state.wildMenu = 'root';
    state.wildLog = [`<div class=\"system\">A wild ${found.name} appeared!</div>`];
    renderTabs();
  };

  const area = $('wild-area');
  if (!state.encounter || !lead) return;

  area.innerHTML = `
    <div class="battle-stage">
      ${renderFightCard(lead, 'You')}
      ${renderFightCard(state.encounter, 'Wild')}
    </div>
    <div id="wild-action-panel">${renderWildActionMenu(lead, inv)}</div>
    <div id="wild-log" class="log">${state.wildLog.join('')}</div>
  `;

  wireWildActionMenu(lead, inv);
}

function renderBattle() {
  els.tabBattle.innerHTML = `
    <h2>Battle</h2>
    <p>UI upgraded with a PvP-style battle board. (Real online PvP still needs backend networking.)</p>
    <article class="card">
      <h3>Ghost Arena</h3>
      <button id="queue-battle" ${currentSquad().length ? '' : 'disabled'}>Start Arena Match</button>
      <div id="arena-view"></div>
      <div id="battle-log" class="log"></div>
    </article>
  `;

  $('queue-battle').onclick = async () => {
    const lead = structuredClone(currentSquad()[0]);
    if (!lead) return;
    lead.attackBuff = 0;
    const ghost = toPlox(pick(WILD_POOL));
    ghost.attackBuff = 0;

    const arenaView = $('arena-view');
    const log = $('battle-log');
    log.innerHTML = '<div class="system">Arena match started.</div>';

    while (lead.hp > 0 && ghost.hp > 0) {
      arenaView.innerHTML = `<div class="battle-stage">${renderFightCard(lead, 'You')}${renderFightCard(ghost, 'Ghost')}</div>`;
      const yourMove = pick(lead.moves);
      const d1 = calcDamage(lead, ghost, yourMove);
      if (d1 > 0) {
        ghost.hp = Math.max(0, ghost.hp - d1);
        log.innerHTML += `<div>${lead.name} used ${yourMove.name} (${d1}).</div>`;
      }
      if (ghost.hp <= 0) break;

      await sleep(300);
      const ghostMove = pick(ghost.moves);
      const d2 = calcDamage(ghost, lead, ghostMove);
      if (d2 > 0) {
        lead.hp = Math.max(0, lead.hp - d2);
        log.innerHTML += `<div class="lose">${ghost.name} used ${ghostMove.name} (${d2}).</div>`;
      }
      await sleep(300);
    }

    if (lead.hp > 0) {
      const reward = pick(['ember', 'dew', 'fiber', 'spark', 'ore']);
      state.account.inventory[reward] += 1;
      state.account.trainerLevel += 1;
      const squadLead = currentSquad()[0];
      if (squadLead) {
        const lvl = grantXp(squadLead, 18, (m, mv) => log.innerHTML += `<div class=\"system\">${m.name} learned ${mv.name}!</div>`);
        if (lvl) log.innerHTML += `<div class=\"system\">${squadLead.name} reached Lv ${squadLead.level}!</div>`;
      }
      log.innerHTML += `<div class="win">Victory! +1 ${reward}.</div>`;
    } else {
      log.innerHTML += '<div class="lose">Defeat. Train and craft then retry.</div>';
    }

    saveAccount();
    renderProfile();
  };
}

function renderSettings() {
  els.tabSettings.innerHTML = `
    <h2>Settings</h2>
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
  };
  $('delete-save').onclick = () => {
    localStorage.removeItem(`ploxmon_account_${state.account.name.toLowerCase()}`);
    state.account = null;
    state.encounter = null;
    els.profileChip.classList.add('hidden');
    showView('auth');
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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
