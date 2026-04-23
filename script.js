const roster = [
  {
    name: 'Pyron',
    maxHp: 120,
    type: 'fire',
    moves: [
      { name: 'Flare Bite', power: 24, accuracy: 0.9, type: 'fire' },
      { name: 'Ember Shot', power: 16, accuracy: 1, type: 'fire' },
      { name: 'Tail Slam', power: 18, accuracy: 0.95, type: 'normal' },
      { name: 'Focus Up', power: 0, accuracy: 1, type: 'buff', buff: 6 }
    ]
  },
  {
    name: 'Aquaff',
    maxHp: 130,
    type: 'water',
    moves: [
      { name: 'Bubble Burst', power: 20, accuracy: 0.95, type: 'water' },
      { name: 'Tidal Kick', power: 23, accuracy: 0.88, type: 'water' },
      { name: 'Headbutt', power: 17, accuracy: 0.98, type: 'normal' },
      { name: 'Shell Guard', power: 0, accuracy: 1, type: 'buff', buff: 8 }
    ]
  },
  {
    name: 'Leaflit',
    maxHp: 125,
    type: 'grass',
    moves: [
      { name: 'Vine Whip', power: 21, accuracy: 0.93, type: 'grass' },
      { name: 'Seed Volley', power: 16, accuracy: 1, type: 'grass' },
      { name: 'Quick Peck', power: 15, accuracy: 1, type: 'normal' },
      { name: 'Nature Pulse', power: 0, accuracy: 1, type: 'buff', buff: 7 }
    ]
  },
  {
    name: 'Voltkit',
    maxHp: 112,
    type: 'normal',
    moves: [
      { name: 'Spark Jab', power: 19, accuracy: 0.96, type: 'normal' },
      { name: 'Bolt Dash', power: 25, accuracy: 0.82, type: 'normal' },
      { name: 'Quick Swipe', power: 14, accuracy: 1, type: 'normal' },
      { name: 'Charge Up', power: 0, accuracy: 1, type: 'buff', buff: 9 }
    ]
  }
];

const effectiveness = {
  fire: { grass: 1.35, water: 0.7, fire: 0.85, normal: 1 },
  water: { fire: 1.35, grass: 0.7, water: 0.85, normal: 1 },
  grass: { water: 1.35, fire: 0.7, grass: 0.85, normal: 1 },
  normal: { fire: 1, water: 1, grass: 1, normal: 1 }
};

const els = {
  startMenu: document.getElementById('start-menu'),
  starterButtons: document.getElementById('starter-buttons'),
  hub: document.getElementById('hub'),
  currentPartner: document.getElementById('current-partner'),
  searchBattle: document.getElementById('search-battle'),
  collection: document.getElementById('collection'),
  battleUi: document.getElementById('battle-ui'),
  playerCard: document.getElementById('player-card'),
  enemyCard: document.getElementById('enemy-card'),
  playerName: document.getElementById('player-name'),
  enemyName: document.getElementById('enemy-name'),
  playerHpText: document.getElementById('player-hp-text'),
  enemyHpText: document.getElementById('enemy-hp-text'),
  playerHpFill: document.getElementById('player-hp-fill'),
  enemyHpFill: document.getElementById('enemy-hp-fill'),
  playerStatus: document.getElementById('player-status'),
  enemyStatus: document.getElementById('enemy-status'),
  moveButtons: document.getElementById('move-buttons'),
  capture: document.getElementById('capture'),
  run: document.getElementById('run'),
  log: document.getElementById('log')
};

const state = {
  scene: 'menu',
  busy: false,
  collection: [],
  activeMonsterName: '',
  battle: null
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cloneMonster = (monster) => structuredClone(monster);
const pickMonster = () => cloneMonster(roster[Math.floor(Math.random() * roster.length)]);
const hpPercent = (hp, maxHp) => Math.max(0, Math.round((hp / maxHp) * 100));

const getOwnedMonster = (name) => state.collection.find((monster) => monster.name === name);

const addLog = (text, cls = '') => {
  const line = document.createElement('div');
  line.textContent = text;
  line.className = `log-line ${cls}`.trim();
  els.log.prepend(line);
};

const setScene = (scene) => {
  state.scene = scene;
  els.startMenu.classList.toggle('hidden', scene !== 'menu');
  els.hub.classList.toggle('hidden', scene !== 'hub');
  els.battleUi.classList.toggle('hidden', scene !== 'battle');
};

const updateHpBar = (fillEl, hp, maxHp) => {
  const pct = hpPercent(hp, maxHp);
  fillEl.style.width = `${pct}%`;

  if (pct > 55) {
    fillEl.style.background = 'linear-gradient(90deg, #57d98c, #90f4b8)';
  } else if (pct > 25) {
    fillEl.style.background = 'linear-gradient(90deg, #f3d169, #ffe2a1)';
  } else {
    fillEl.style.background = 'linear-gradient(90deg, #ec6d86, #ff99ad)';
  }
};

const refreshHub = () => {
  const active = getOwnedMonster(state.activeMonsterName);
  els.currentPartner.textContent = active
    ? `Active partner: ${active.name} (${active.type.toUpperCase()})`
    : 'Pick a captured monster to fight with.';

  const names = state.collection.map((m) => m.name);
  els.collection.textContent = `Captured: ${names.length ? names.join(', ') : 'none yet'}`;
};

const setControlsEnabled = (enabled) => {
  for (const button of els.moveButtons.querySelectorAll('button')) {
    button.disabled = !enabled;
  }
  els.capture.disabled = !enabled;
  els.run.disabled = !enabled;
  els.searchBattle.disabled = !enabled;
};

const renderBattle = () => {
  if (!state.battle) {
    return;
  }

  const { player, enemy } = state.battle;
  els.playerName.textContent = player.name;
  els.enemyName.textContent = `Wild ${enemy.name}`;
  els.playerHpText.textContent = `${player.hp}/${player.maxHp}`;
  els.enemyHpText.textContent = `${enemy.hp}/${enemy.maxHp}`;
  els.playerStatus.textContent = player.attackBuff ? `Attack buff +${player.attackBuff}` : 'No status effects';
  els.enemyStatus.textContent = enemy.attackBuff ? `Attack buff +${enemy.attackBuff}` : 'No status effects';
  updateHpBar(els.playerHpFill, player.hp, player.maxHp);
  updateHpBar(els.enemyHpFill, enemy.hp, enemy.maxHp);
};

const damageFromMove = (attacker, defender, move) => {
  if (move.power <= 0) {
    return 0;
  }

  if (Math.random() > move.accuracy) {
    return -1;
  }

  const eff = effectiveness[move.type]?.[defender.type] ?? 1;
  const variance = 0.9 + Math.random() * 0.22;
  return Math.max(1, Math.round((move.power + attacker.attackBuff) * eff * variance));
};

const pulseCard = async (card, className, ms = 300) => {
  card.classList.add(className);
  await delay(ms);
  card.classList.remove(className);
};

const handleMove = async (attacker, defender, move, attackerCard, defenderCard) => {
  await pulseCard(attackerCard, 'attack', 220);

  if (move.power === 0 && move.buff) {
    attacker.attackBuff += move.buff;
    addLog(`${attacker.name} used ${move.name}. Attack rose by ${move.buff}.`, 'system');
    await delay(420);
    return;
  }

  const dmg = damageFromMove(attacker, defender, move);
  if (dmg < 0) {
    addLog(`${attacker.name} used ${move.name}, but it missed!`);
    await delay(450);
    return;
  }

  defender.hp = Math.max(0, defender.hp - dmg);
  await pulseCard(defenderCard, 'hit', 380);

  const eff = effectiveness[move.type]?.[defender.type] ?? 1;
  if (eff > 1.1) {
    addLog(`${attacker.name} used ${move.name}. Super effective! ${dmg} damage.`);
  } else if (eff < 0.9) {
    addLog(`${attacker.name} used ${move.name}. Not very effective. ${dmg} damage.`);
  } else {
    addLog(`${attacker.name} used ${move.name} for ${dmg} damage.`);
  }

  renderBattle();
  await delay(520);
};

const finishBattleToHub = async (message, cls = 'system') => {
  addLog(message, cls);
  setControlsEnabled(false);
  await delay(900);
  state.battle = null;
  setScene('hub');
  refreshHub();
};

const enemyTurn = async () => {
  const battle = state.battle;
  if (!battle || battle.over) {
    return;
  }

  addLog(`Wild ${battle.enemy.name} is thinking...`, 'system');
  await delay(550);
  const moveIndex = Math.floor(Math.random() * battle.enemy.moves.length);
  await handleMove(battle.enemy, battle.player, battle.enemy.moves[moveIndex], els.enemyCard, els.playerCard);

  if (battle.player.hp <= 0) {
    battle.over = true;
    await finishBattleToHub(`${battle.player.name} fainted! You rushed back to the hub.`, 'lose');
  }
};

const playerMove = async (moveIndex) => {
  const battle = state.battle;
  if (!battle || battle.over || state.busy) {
    return;
  }

  state.busy = true;
  setControlsEnabled(false);

  await handleMove(battle.player, battle.enemy, battle.player.moves[moveIndex], els.playerCard, els.enemyCard);

  if (battle.enemy.hp <= 0) {
    battle.over = true;
    await finishBattleToHub(`Wild ${battle.enemy.name} fainted!`, 'win');
    state.busy = false;
    return;
  }

  await enemyTurn();
  state.busy = false;
  if (state.scene === 'battle' && !battle.over) {
    setControlsEnabled(true);
  }
};

const captureAttempt = async () => {
  const battle = state.battle;
  if (!battle || battle.over || state.busy) {
    return;
  }

  state.busy = true;
  setControlsEnabled(false);

  addLog(`You threw a Capture Orb at ${battle.enemy.name}!`, 'system');
  await pulseCard(els.enemyCard, 'hit', 500);

  const healthFactor = 1 - battle.enemy.hp / battle.enemy.maxHp;
  const chance = 0.2 + healthFactor * 0.65;

  if (Math.random() < chance) {
    battle.over = true;

    if (!getOwnedMonster(battle.enemy.name)) {
      state.collection.push(cloneMonster({ ...battle.enemy, hp: battle.enemy.maxHp, attackBuff: 0 }));
      addLog(`${battle.enemy.name} was captured!`, 'win');
    } else {
      addLog(`${battle.enemy.name} was caught, but you already own one.`, 'system');
    }

    await finishBattleToHub('Capture complete. Returning to hub...');
    state.busy = false;
    return;
  }

  addLog(`${battle.enemy.name} broke free!`, 'lose');
  await delay(500);
  await enemyTurn();

  state.busy = false;
  if (state.scene === 'battle' && !battle.over) {
    setControlsEnabled(true);
  }
};

const startEncounter = () => {
  if (state.busy) {
    return;
  }

  const active = getOwnedMonster(state.activeMonsterName);
  if (!active) {
    refreshHub();
    return;
  }

  let enemy = pickMonster();
  if (enemy.name === active.name) {
    const options = roster.filter((monster) => monster.name !== active.name);
    enemy = cloneMonster(options[Math.floor(Math.random() * options.length)]);
  }

  state.battle = {
    player: { ...cloneMonster(active), hp: active.maxHp, attackBuff: 0 },
    enemy: { ...enemy, hp: enemy.maxHp, attackBuff: 0 },
    over: false
  };

  els.log.innerHTML = '';
  addLog(`A wild ${enemy.name} appeared!`, 'system');
  setScene('battle');
  renderBattle();
  wireMoves();
  setControlsEnabled(true);
};

const runToHub = async () => {
  if (!state.battle || state.busy) {
    return;
  }

  state.busy = true;
  setControlsEnabled(false);
  await finishBattleToHub('You ran back to the hub safely.', 'system');
  state.busy = false;
};

const wireMoves = () => {
  els.moveButtons.innerHTML = '';
  state.battle.player.moves.forEach((move, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `${move.name} (${move.type})`;
    btn.addEventListener('click', () => {
      void playerMove(idx);
    });
    els.moveButtons.append(btn);
  });
};

const chooseStarter = (name) => {
  const starter = cloneMonster(roster.find((monster) => monster.name === name));
  state.collection = [starter];
  state.activeMonsterName = starter.name;
  setScene('hub');
  refreshHub();
};

const renderStarterMenu = () => {
  els.starterButtons.innerHTML = '';
  for (const monster of roster.slice(0, 3)) {
    const btn = document.createElement('button');
    btn.textContent = `${monster.name} (${monster.type})`;
    btn.addEventListener('click', () => chooseStarter(monster.name));
    els.starterButtons.append(btn);
  }
};

els.searchBattle.addEventListener('click', startEncounter);
els.capture.addEventListener('click', () => {
  void captureAttempt();
});
els.run.addEventListener('click', () => {
  void runToHub();
});

renderStarterMenu();
setScene('menu');
