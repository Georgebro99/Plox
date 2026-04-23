const roster = [
  {
    name: 'Pyron',
    maxHp: 120,
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
    moves: [
      { name: 'Vine Whip', power: 21, accuracy: 0.93, type: 'grass' },
      { name: 'Seed Volley', power: 16, accuracy: 1, type: 'grass' },
      { name: 'Quick Peck', power: 15, accuracy: 1, type: 'normal' },
      { name: 'Nature Pulse', power: 0, accuracy: 1, type: 'buff', buff: 7 }
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
  playerName: document.getElementById('player-name'),
  enemyName: document.getElementById('enemy-name'),
  playerHpText: document.getElementById('player-hp-text'),
  enemyHpText: document.getElementById('enemy-hp-text'),
  playerHpFill: document.getElementById('player-hp-fill'),
  enemyHpFill: document.getElementById('enemy-hp-fill'),
  playerStatus: document.getElementById('player-status'),
  enemyStatus: document.getElementById('enemy-status'),
  moveButtons: document.getElementById('move-buttons'),
  log: document.getElementById('log'),
  newBattle: document.getElementById('new-battle')
};

let state = null;

const pickMonster = () => structuredClone(roster[Math.floor(Math.random() * roster.length)]);

const hpPercent = (hp, maxHp) => Math.max(0, Math.round((hp / maxHp) * 100));

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

const render = () => {
  const { player, enemy, over } = state;

  els.playerName.textContent = player.name;
  els.enemyName.textContent = enemy.name;

  els.playerHpText.textContent = `${player.hp}/${player.maxHp}`;
  els.enemyHpText.textContent = `${enemy.hp}/${enemy.maxHp}`;

  updateHpBar(els.playerHpFill, player.hp, player.maxHp);
  updateHpBar(els.enemyHpFill, enemy.hp, enemy.maxHp);

  els.playerStatus.textContent = player.attackBuff ? `Attack buff +${player.attackBuff}` : 'No status effects';
  els.enemyStatus.textContent = enemy.attackBuff ? `Attack buff +${enemy.attackBuff}` : 'No status effects';

  for (const button of els.moveButtons.querySelectorAll('button')) {
    button.disabled = over;
  }
};

const addLog = (text, cls = '') => {
  const line = document.createElement('div');
  line.textContent = text;
  line.className = `log-line ${cls}`.trim();
  els.log.prepend(line);
};

const damageFromMove = (attacker, defender, move) => {
  if (move.power <= 0) {
    return 0;
  }

  const hitRoll = Math.random();
  if (hitRoll > move.accuracy) {
    return -1;
  }

  const eff = effectiveness[move.type]?.[defender.type] ?? 1;
  const variance = 0.88 + Math.random() * 0.24;
  return Math.max(1, Math.round((move.power + attacker.attackBuff) * eff * variance));
};

const applyMove = (attackerKey, defenderKey, moveIndex) => {
  if (state.over) {
    return;
  }

  const attacker = state[attackerKey];
  const defender = state[defenderKey];
  const move = attacker.moves[moveIndex];

  if (move.power === 0 && move.buff) {
    attacker.attackBuff += move.buff;
    addLog(`${attacker.name} used ${move.name} and boosted attack by ${move.buff}.`);
    return;
  }

  const dmg = damageFromMove(attacker, defender, move);
  if (dmg < 0) {
    addLog(`${attacker.name} used ${move.name}, but it missed!`);
    return;
  }

  defender.hp = Math.max(0, defender.hp - dmg);
  const eff = effectiveness[move.type]?.[defender.type] ?? 1;

  if (eff > 1.1) {
    addLog(`${attacker.name} used ${move.name}. It's super effective (${dmg} dmg)!`);
  } else if (eff < 0.9) {
    addLog(`${attacker.name} used ${move.name}. It's not very effective (${dmg} dmg).`);
  } else {
    addLog(`${attacker.name} used ${move.name} for ${dmg} damage.`);
  }
};

const enemyTurn = () => {
  if (state.over) {
    return;
  }

  const moveIndex = Math.floor(Math.random() * state.enemy.moves.length);
  applyMove('enemy', 'player', moveIndex);

  if (state.player.hp <= 0) {
    state.over = true;
    addLog('You were defeated. Better luck next battle!', 'lose');
  }
};

const playerTurn = (moveIndex) => {
  if (state.over) {
    return;
  }

  applyMove('player', 'enemy', moveIndex);

  if (state.enemy.hp <= 0) {
    state.over = true;
    addLog('Victory! Enemy monster fainted.', 'win');
    render();
    return;
  }

  enemyTurn();
  render();
};

const wireMoves = () => {
  els.moveButtons.innerHTML = '';

  state.player.moves.forEach((move, index) => {
    const button = document.createElement('button');
    button.textContent = `${move.name} (${move.type})`;
    button.addEventListener('click', () => playerTurn(index));
    els.moveButtons.append(button);
  });
};

const startBattle = () => {
  const player = pickMonster();
  let enemy = pickMonster();

  if (enemy.name === player.name) {
    const alternatives = roster.filter((monster) => monster.name !== player.name);
    enemy = structuredClone(alternatives[Math.floor(Math.random() * alternatives.length)]);
  }

  state = {
    player: { ...player, hp: player.maxHp, type: player.moves[0].type, attackBuff: 0 },
    enemy: { ...enemy, hp: enemy.maxHp, type: enemy.moves[0].type, attackBuff: 0 },
    over: false
  };

  els.log.innerHTML = '';
  addLog(`A wild ${state.enemy.name} appeared!`);
  wireMoves();
  render();
};

els.newBattle.addEventListener('click', startBattle);

startBattle();
