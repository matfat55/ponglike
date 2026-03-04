// ═══ PADDLES ═══
export const PADDLES = [
  {
    id: 'classic',
    name: 'STANDARD',
    hMul: 1.1,
    desc: 'No special tricks. Pure pong. Slightly larger paddle.',
    abil: 'NONE',
    akey: '',
    ainfo: '',
    cd: 999,
  },
  {
    id: 'oracle',
    name: 'ORACLE',
    hMul: 1,
    desc: 'See the future. Reveals full ball trajectory for 8 seconds.',
    abil: 'FORESIGHT',
    akey: 'Q',
    ainfo: 'See ball path 8s',
    cd: 12,
  },
  {
    id: 'inferno',
    name: 'PHANTOM',
    hMul: 0.95,
    desc: 'Phase through. Ball becomes a ghost that pierces the enemy once.',
    abil: 'PHASE',
    akey: 'Q',
    ainfo: 'Next hit pierces enemy',
    cd: 6,
  },
  {
    id: 'frost',
    name: 'GLACIER',
    hMul: 1.05,
    desc: 'Flash freeze. Enemy and ball freeze solid.',
    abil: 'BLIZZARD',
    akey: 'Q',
    ainfo: 'Freeze all 1.8s',
    cd: 8,
  },
  {
    id: 'storm',
    name: 'STORM',
    hMul: 0.9,
    desc: 'Next hit fires a stun bolt that freezes enemy paddle.',
    abil: 'THUNDER',
    akey: 'Q',
    ainfo: 'Stun bolt on next hit',
    cd: 6,
  },
  {
    id: 'voidp',
    name: 'VOID',
    hMul: 1,
    desc: 'Drop a gravity well in the ball path. Warps trajectory.',
    abil: 'GRAVITY WELL',
    akey: 'Q',
    ainfo: 'Gravity well 3s',
    cd: 6,
  },
];

// ═══ ENEMIES with difficulty ═══
export const ENEMIES = [
  // F-tier
  { id: 'basic', name: 'ROOKIE', tag: '', diff: 'F', mod: (c) => {} },
  {
    id: 'sleepy',
    name: 'DROWSY',
    tag: 'zz',
    diff: 'F',
    mod: (c) => {
      c.aiSpd *= 0.85;
    },
  },
  // E-tier
  {
    id: 'wide',
    name: 'WALL',
    tag: '=',
    diff: 'E',
    mod: (c) => {
      c.aiSpd *= 0.9;
    },
  },
  {
    id: 'stubborn',
    name: 'BRICK',
    tag: '[]',
    diff: 'E',
    mod: (c) => {
      c.aiSpd *= 0.85;
    },
  },
  // D-tier
  {
    id: 'fast',
    name: 'SPEEDSTER',
    tag: '>>',
    diff: 'D',
    mod: (c) => {
      c.aiSpd *= 1.3;
    },
  },
  {
    id: 'jitter',
    name: 'TWITCHER',
    tag: '~~',
    diff: 'D',
    mod: (c) => {
      c.aiSpd *= 1.15;
      c.jitter = true;
    },
  },
  // C-tier
  {
    id: 'tricky',
    name: 'TRICKSTER',
    tag: '~',
    diff: 'C',
    mod: (c) => {
      c.trickAng = true;
    },
  },
  {
    id: 'mimic',
    name: 'MIMIC',
    tag: '<>',
    diff: 'C',
    mod: (c) => {
      c.trickAng = true;
      c.aiSpd *= 1.1;
    },
  },
  // B-tier
  {
    id: 'ghost',
    name: 'PHANTOM',
    tag: '?',
    diff: 'B',
    mod: (c) => {
      c.ghost = true;
    },
  },
  {
    id: 'blinker',
    name: 'BLINKER',
    tag: '*?',
    diff: 'B',
    mod: (c) => {
      c.ghost = true;
      c.aiSpd *= 1.1;
    },
  },
  // A-tier
  {
    id: 'tank',
    name: 'FORTRESS',
    tag: '##',
    diff: 'A',
    mod: (c) => {
      c.aiSpd *= 0.85;
    },
  },
  {
    id: 'jugg',
    name: 'JUGGERNAUT',
    tag: '###',
    diff: 'A',
    mod: (c) => {
      c.aiReact = Math.min(c.aiReact + 0.08, 0.95);
    },
  },
  // S-tier
  {
    id: 'sniper',
    name: 'SNIPER',
    tag: '+',
    diff: 'S',
    mod: (c) => {
      c.aiReact = Math.min(c.aiReact + 0.14, 0.97);
    },
  },
  {
    id: 'hunter',
    name: 'HUNTER',
    tag: '>+',
    diff: 'S',
    mod: (c) => {
      c.aiReact = Math.min(c.aiReact + 0.1, 0.96);
      c.aiSpd *= 1.2;
    },
  },
  // SS-tier
  {
    id: 'accel',
    name: 'CHAOS',
    tag: '!!',
    diff: 'SS',
    mod: (c) => {
      c.chaos = true;
      c.aiSpd *= 1.1;
    },
  },
  {
    id: 'warden',
    name: 'WARDEN',
    tag: '!#',
    diff: 'SS',
    mod: (c) => {
      c.aiReact = Math.min(c.aiReact + 0.15, 0.97);
      c.chaos = true;
      c.trickAng = true;
    },
  },
  // SSS-tier (boss-only)
  {
    id: 'apex',
    name: 'APEX',
    tag: '\u2620',
    diff: 'SSS',
    mod: (c) => {
      c.chaos = true;
      c.trickAng = true;
      c.aiReact = Math.min(c.aiReact + 0.2, 0.98);
      c.aiSpd *= 1.3;
    },
  },
  {
    id: 'void',
    name: 'THE VOID',
    tag: '\u2588',
    diff: 'SSS',
    mod: (c) => {
      c.ghost = true;
      c.chaos = true;
      c.trickAng = true;
      c.aiReact = Math.min(c.aiReact + 0.18, 0.98);
      c.aiSpd *= 1.25;
    },
  },
];

export function getEnemiesForDiff(diff) {
  return ENEMIES.filter((e) => e.diff === diff);
}

// ═══ ENEMY ABILITIES ═══
export const E_ABILS = {
  none: { id: 'none', name: '', desc: '', icon: '', cd: 999 },
  dash: { id: 'dash', name: 'DASH', desc: 'Surges to ball at 3x speed', icon: '\u21A0', cd: 4, dur: 0.5 },
  spin: { id: 'spin', name: 'SPIN RETURN', desc: 'Curves the ball back mid-flight', icon: '\u21BB', cd: 6, dur: 0 },
  blink: { id: 'blink', name: 'BLINK', desc: 'Teleports to ball instantly', icon: '\u2607', cd: 5, dur: 0 },
  bulk: { id: 'bulk', name: 'BULK UP', desc: 'Paddle grows 1.4x for 2.5s', icon: '\u2B1B', cd: 8, dur: 2.5 },
  pull: { id: 'pull', name: 'GRAVITY PULL', desc: 'Drags ball back toward enemy', icon: '\u2299', cd: 7, dur: 2 },
  lightning: {
    id: 'lightning',
    name: 'LIGHTNING',
    desc: 'Channels lightning, stuns ball, launches it at you',
    icon: '\u26A1',
    cd: 10,
    dur: 1.2,
  },
  voidpulse: {
    id: 'voidpulse',
    name: 'VOID PULSE',
    desc: 'Reverses ball at 2x speed, pushes your paddle, freezes you',
    icon: '\u29BF',
    cd: 9,
    dur: 0.3,
  },
  rampage: {
    id: 'rampage',
    name: 'RAMPAGE',
    desc: 'Fires 2 phantom balls at you that score if they pass',
    icon: '\u2622',
    cd: 10,
    dur: 2.5,
  },
  accel: { id: 'accel', name: 'OVERDRIVE', desc: 'Ball accelerates to 2x speed for 2s', icon: '\u00BB', cd: 8, dur: 2 },
  clone: {
    id: 'clone',
    name: 'CLONE',
    desc: 'Spawns a phantom copy of paddle that blocks too',
    icon: '\u2261',
    cd: 12,
    dur: 3,
  },
};

export const ENEMY_ABIL_MAP = {
  basic: 'none',
  sleepy: 'none',
  wide: 'none',
  stubborn: 'none',
  fast: 'dash',
  jitter: 'dash',
  tricky: 'spin',
  mimic: 'spin',
  ghost: 'blink',
  blinker: 'blink',
  tank: 'bulk',
  jugg: 'accel',
  sniper: 'pull',
  hunter: 'lightning',
  accel: 'clone',
  warden: 'lightning',
  apex: 'voidpulse',
  void: 'rampage',
};

export function getEnemyAbil(enemyId) {
  return E_ABILS[ENEMY_ABIL_MAP[enemyId] || 'none'] || E_ABILS.none;
}

// ═══ ENEMY UPGRADES ═══
export const E_UPS = [
  {
    id: 'ef',
    name: 'FASTER',
    desc: 'Enemy speed +20%',
    icon: '\u00BB',
    fn: (g) => {
      g.aiSpd *= 1.2;
    },
  },
  {
    id: 'es',
    name: 'SMARTER',
    desc: 'Enemy react +15%',
    icon: '\u25C6',
    fn: (g) => {
      g.aiReact = Math.min(g.aiReact * 1.15, 0.96);
    },
  },
  {
    id: 'eb',
    name: 'BALL SPD+',
    desc: 'Ball base +8%',
    icon: '\u25CF',
    fn: (g) => {
      g.bs *= 1.08;
    },
  },
  {
    id: 'ea',
    name: 'AGGRO',
    desc: 'Sharper returns',
    icon: '\u2220',
    fn: (g) => {
      g.trickAng = true;
    },
  },
  {
    id: 'eg',
    name: 'GHOST',
    desc: 'Enemy flickers invisible',
    icon: '?',
    fn: (g) => {
      g.cfg.ghost = true;
    },
  },
];
