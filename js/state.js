import {
  GW,
  GH,
  BASE_PAD_H,
  BASE_SPD,
  PX_HOME,
  DIFF_RANKS,
  clamp,
  rng,
} from './constants.js';
import { PADDLES, ENEMIES, getEnemiesForDiff, getEnemyAbil } from './entities.js';

// ═══ GLOBAL STATE ═══
// Using object to allow mutable state in ES modules
export const state = {
  curScreen: 'menu',
  padId: 'classic',
  wave: 1,
  savedState: null,
  enemyUps: [],
  curCards: [],
  curEUp: null,
  curDiff: null,
  g: null,
  keysDown: {},
  chosenOppCfg: null,
};

// ═══ WAVE CONFIGURATION ═══
export function waveCfg(wv) {
  const boss = wv > 1 && wv % 3 === 0;
  const rankIdx = Math.min(Math.floor(wv / 1.5), DIFF_RANKS.length - 1);
  const diff = boss ? DIFF_RANKS[Math.min(rankIdx + 1, DIFF_RANKS.length - 1)] : DIFF_RANKS[rankIdx];
  let aiSpd, aiReact;
  if (rankIdx >= 5) {
    aiSpd = 220 + wv * 30 + (boss ? 80 : 0);
    aiReact = clamp(0.25 + wv * 0.07 + (boss ? 0.15 : 0), 0, 0.97);
  } else {
    aiSpd = 220 + wv * 22 + (boss ? 50 : 0);
    aiReact = clamp(0.06 + wv * 0.025 + (boss ? 0.06 : 0), 0, 0.4);
  }
  const eH = BASE_PAD_H;
  const pool = getEnemiesForDiff(diff);
  const enemy = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : ENEMIES[0];
  const cfg = { wv, boss, diff, aiSpd, aiReact, eH, enemy, trickAng: false, ghost: false, chaos: false, jitter: false };
  enemy.mod(cfg);
  return cfg;
}

// ═══ HELPERS ═══
export function addSparks(game, x, y, n = 8, sp = 120, col = null) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 30 + Math.random() * sp;
    game.sparks.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.15 + Math.random() * 0.3,
      max: 0.45,
      col,
    });
  }
}

export function resetBall(game, dir) {
  game.rallyBase = game.bs;
  game.rallyHits = 0;
  game.ballSpd = game.rallyBase;
  game.bx = GW / 2;
  game.by = GH / 2 + rng(-60, 60);
  game.bvx = 0;
  game.bvy = 0;
  game.pendingDir = dir;
  game.startPause = 0.5;
  game.shUsed = false;
  game.combo = 0;
  game.trail = [];
  game.curveNext = false;
  game.smashNext = false;
  game.ghostBall = false;
  game.ghostT = 0;
}

// ═══ NEW GAME ═══
export function newGame(pid, wv, sv, eUps, oppCfg) {
  const pad = PADDLES.find((p) => p.id === pid);
  const cfg = oppCfg || waveCfg(wv);
  const am = sv?.aiMod ?? 1;
  const bs = sv?.bs ?? BASE_SPD;
  const _iDir = Math.random() > 0.5 ? 1 : -1;

  const ng = {
    padId: pid,
    pad,
    cfg,
    t: 0,
    bx: GW / 2,
    by: GH / 2 + rng(-40, 40),
    bvx: 0,
    bvy: 0,
    pendingDir: _iDir,
    startPause: 0.5,
    bs,
    rallyBase: bs,
    ballSpd: bs,
    rallyHits: 0,
    trail: [],
    px: PX_HOME,
    py: GH / 2,
    ph: sv?.ph ?? BASE_PAD_H * pad.hMul,
    pSpd: sv?.pSpd ?? 420,
    horizMul: sv?.horizMul ?? 1,
    ey: GH / 2,
    eH: cfg.eH,
    eHBase: cfg.eH,
    aiSpd: cfg.aiSpd * am,
    aiMod: am,
    aiReact: cfg.aiReact,
    pScore: 0,
    eScore: 0,
    lives: sv?.lives ?? 3,
    shields: sv?.shields ?? 0,
    shUsed: false,
    cdMul: sv?.cdMul ?? 1,
    // Abilities (passive)
    edge: sv?.edge ?? false,
    rico: sv?.rico ?? false,
    magnet: sv?.magnet ?? false,
    dblScore: sv?.dblScore ?? false,
    vampire: sv?.vampire ?? false,
    freeze: sv?.freeze ?? false,
    afterimage: sv?.afterimage ?? false,
    shockwave: sv?.shockwave ?? false,
    homing: sv?.homing ?? false,
    timewarp: sv?.timewarp ?? false,
    multicast: sv?.multicast ?? false,
    transcend: sv?.transcend ?? false,
    doppel: sv?.doppel ?? false,
    singularity: sv?.singularity ?? false,
    // Secret abilities
    aiCap: sv?.aiCap ?? false,
    triScore: sv?.triScore ?? false,
    echoHit: sv?.echoHit ?? false,
    voidWalk: sv?.voidWalk ?? false,
    // New secret combat abilities
    stormCaller: sv?.stormCaller ?? false,
    phantomStrike: sv?.phantomStrike ?? false,
    mirrorMatch: sv?.mirrorMatch ?? false,
    berserker: sv?.berserker ?? false,
    overcharge: sv?.overcharge ?? false,
    berserkerStacks: 0,
    _berserkerBase: sv?.bs ?? BASE_SPD,
    mirrorBuf: [],
    // Active state
    abCD: 0,
    curveNext: false,
    multiBalls: [],
    ghostBall: false,
    ghostT: 0,
    placedWall: null,
    wallT: 0,
    shrinkT: 0,
    smashNext: false,
    freezeT: 0,
    afterBall: null,
    shockT: 0,
    // New paddle ability states
    foresightT: 0,
    phaseNext: false,
    blizzardT: 0,
    thunderNext: false,
    bolts: [],
    gravWell: null,
    gravWellT: 0,
    // Master of Skill state
    masterSkill: sv?.masterSkill ?? false,
    siphon: sv?.siphon ?? false,
    _masterBaseSpd: 0,
    _masterHitBoosted: false,
    shake: 0,
    shX: 0,
    shY: 0,
    flash: 0,
    flashCol: [1, 1, 1],
    ghostA: 1,
    combo: 0,
    sparks: [],
    hitFlash: 0,
    scoreFlash: 0,
    scoreFlashSide: 0,
    chromaShift: 0,
    done: false,
    result: null,
    doneT: 0,
    trickAng: cfg.trickAng,
    chaos: cfg.chaos,
    jitter: cfg.jitter || false,
    // Enemy ability state
    eAbil: getEnemyAbil(cfg.enemy.id),
    eAbilCD: 2,
    eAbilActive: 0,
    eAbilPhase: 'idle',
    // Lightning-specific
    ltChannel: 0,
    ltStun: 0,
    ltBoltX: 0,
    ltBoltY: 0,
    ltBolts: [],
    // Bulk-specific
    bulkT: 0,
    bulkScale: 1,
    // Pull-specific
    pullT: 0,
    // Timestop-specific
    tsT: 0,
    tsBallVx: 0,
    tsBallVy: 0,
    // Voidpulse-specific
    vpT: 0,
    vpX: 0,
    vpY: 0,
    // Blink flash
    blinkFlash: 0,
    // Spin return
    spinNext: false,
    spinCurveT: 0,
    // Dash
    dashT: 0,
    dashSpd: 0,
    overdriveT: 0,
    cloneT: 0,
    cloneY: 0,
    // Paddle velocity tracking
    prevPy: GH / 2,
    pVelY: 0,
    // AI target caching
    aiTgt: GH / 2,
    aiTgtTimer: 0,
    aiRandOff: 0,
    aiBallDir: 0,
  };

  // Apply AI cap
  if (ng.aiCap) {
    ng.aiReact = Math.min(ng.aiReact, 0.5);
    ng.aiSpd *= 0.6;
  }
  if (eUps) {
    for (const eu of eUps) eu.fn(ng);
  }
  if (ng.aiCap) {
    ng.aiReact = Math.min(ng.aiReact, 0.5);
    ng.aiSpd = Math.min(ng.aiSpd, 250);
  }

  return ng;
}

export function saveGame(game) {
  return {
    bs: game.bs,
    ph: game.ph,
    pSpd: game.pSpd,
    cdMul: game.cdMul,
    edge: game.edge,
    rico: game.rico,
    shields: game.shields,
    lives: game.lives,
    aiMod: game.aiMod,
    horizMul: game.horizMul,
    magnet: game.magnet,
    dblScore: game.dblScore,
    vampire: game.vampire,
    freeze: game.freeze,
    afterimage: game.afterimage,
    shockwave: game.shockwave,
    homing: game.homing,
    timewarp: game.timewarp,
    multicast: game.multicast,
    transcend: game.transcend,
    doppel: game.doppel,
    singularity: game.singularity,
    aiCap: game.aiCap,
    triScore: game.triScore,
    echoHit: game.echoHit,
    voidWalk: game.voidWalk,
    stormCaller: game.stormCaller,
    phantomStrike: game.phantomStrike,
    mirrorMatch: game.mirrorMatch,
    berserker: game.berserker,
    overcharge: game.overcharge,
    masterSkill: game.masterSkill,
    siphon: game.siphon,
  };
}
