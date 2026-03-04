// ═══ MAIN ENTRY POINT ═══
// Pong Rogue - Modular Game Entry

import {
  GW, GH, BALL_SZ, PAD_W, BASE_PAD_H, PX_HOME, EX, HORIZ,
  PTS_WIN, MAX_WAVE, TRAIL, BASE_SPD, FOCUS_SPEED_MULT,
  PCOL, DIFF_COLORS, DIFF_GLOW, DIFF_RANKS, DIFF_REWARD, DIFF_TIERS,
  TIER_NAMES, TIER_COLORS, TIER_GLOW, TIER_ICON, TIER_ORDER,
  clamp, lerp, rng, easeOut, simBallY, $
} from './constants.js';
import { tone, SFX } from './audio.js';
import { PADDLES, ENEMIES, getEnemiesForDiff, getEnemyAbil, E_ABILS, E_UPS } from './entities.js';
import { ALL_CARDS, getCardsForDiff, getCardsForTier } from './upgrades.js';
import { state, waveCfg, addSparks, resetBall, newGame, saveGame } from './state.js';
import { isFocusActive, isMovingUp, isMovingDown, isMovingLeft, isMovingRight, setupInputHandlers } from './input.js';
import { update } from './game.js';

// Re-export for global access (dev mode etc)
window.SFX = SFX;
window.showDevScreen = showDevScreen;

// ═══ SCREEN MANAGEMENT ═══
function showScreen(id) {
  ['menu-screen', 'cards-screen', 'opp-screen', 'go-screen', 'vic-screen', 'dev-screen'].forEach(s => {
    $(s).classList.toggle('hidden', s !== id);
  });
  $('cv').style.display = id === null ? 'block' : 'none';
  state.curScreen = id;
}

function startWave(pid, wn) {
  state.g = newGame(pid, wn, state.savedState, state.enemyUps, state.chosenOppCfg);
  state.chosenOppCfg = null;
  state.padId = pid;
  showScreen(null);
  if (state.g.cfg.boss) setTimeout(SFX.boss, 80);
}

// ═══ ABILITIES ═══
function doAbility() {
  const g = state.g;
  if (!g || g.done || g.abCD > 0) return;
  const pad = g.pad;
  if (pad.cd >= 900) return;

  SFX.abil();
  g.abCD = pad.cd * g.cdMul;

  switch (g.padId) {
    case 'oracle':
      g.foresightT = 8;
      break;
    case 'inferno':
      g.phaseNext = true;
      break;
    case 'frost':
      g.blizzardT = 1.8;
      g.freezeT = 1.8;
      break;
    case 'storm':
      g.thunderNext = true;
      break;
    case 'voidp':
      if (g.bvx !== 0) {
        const ahead = g.bvx > 0 ? 150 : -150;
        g.gravWell = { x: clamp(g.bx + ahead, 100, GW - 100), y: g.by };
        g.gravWellT = 3;
      }
      break;
  }

  if (g.multicast) {
    setTimeout(() => {
      g.abCD = 0;
      doAbility();
    }, 300);
  }
}

function handleContinue() {
  const g = state.g;
  if (!g || !g.done || g.doneT < 0.8) return;

  if (g.result === 'win') {
    state.savedState = saveGame(g);
    state.wave++;
    if (state.wave > MAX_WAVE) {
      showVictory();
    } else {
      const rewardTier = DIFF_REWARD[g.cfg.diff];
      state.curDiff = g.cfg.diff;
      const eUp = E_UPS[Math.floor(Math.random() * E_UPS.length)];
      state.curEUp = eUp;
      state.enemyUps.push(eUp);
      state.curCards = getCardsForDiff(g.cfg.diff, 3);
      showUpgradeScreen(rewardTier, g.cfg.diff);
    }
  } else {
    if (g.lives <= 0) {
      showGameOver();
    } else {
      state.savedState = saveGame(g);
      showOpponentSelect();
    }
  }
}

// ═══ UI BUILDING ═══
function buildPadGrid() {
  const grid = $('pad-grid');
  grid.innerHTML = '';
  PADDLES.forEach(p => {
    const c = PCOL[p.id];
    const d = document.createElement('div');
    d.className = 'pad-card';
    d.style.setProperty('--pc', c.p);
    d.innerHTML = `<div class="cdot" style="background:${c.p}"></div><div class="pn">${p.name}</div><div class="pd">${p.desc}</div><div class="ps"><div class="pa">[${p.akey}] ${p.abil}</div><div class="pi">${p.ainfo}</div></div><div class="pt">PLAY</div>`;
    d.onclick = () => {
      state.savedState = null;
      state.wave = 1;
      state.enemyUps = [];
      state.padId = p.id;
      SFX.sel();
      showOpponentSelect();
    };
    grid.appendChild(d);
  });
}

function showUpgradeScreen(rewardTier, clearedDiff) {
  const tc = TIER_COLORS[rewardTier];
  const tg = TIER_GLOW[rewardTier];
  const ti = TIER_ICON[rewardTier];
  const dc = DIFF_COLORS[clearedDiff];
  const dg = DIFF_GLOW[clearedDiff];

  $('rank-display').innerHTML = `<span style="font-size:11px;color:${dc};letter-spacing:4px;text-shadow:0 0 10px rgba(${dg},0.3);">${clearedDiff} CLEARED</span>`;
  $('diff-display').innerHTML = `<span style="font-size:9px;color:${tc};letter-spacing:2px;">${ti} ${TIER_NAMES[rewardTier]} REWARDS</span>`;

  const eup = state.curEUp;
  $('e-warn-box').innerHTML = eup ? `<div style="padding:6px 12px;border:1px solid rgba(255,60,60,0.1);border-radius:2px;background:rgba(255,30,30,0.03);display:inline-block;"><span style="color:#a55;font-size:8px;letter-spacing:2px;">ENEMY UPGRADE:</span> <span style="color:#f66;font-size:10px;letter-spacing:3px;">${eup.icon} ${eup.name}</span></div>` : '';
  $('next-wave-info').textContent = `NEXT: WAVE ${state.wave}`;

  const grid = $('card-grid');
  grid.innerHTML = '';
  state.curCards.forEach(card => {
    const cardTc = TIER_COLORS[card.tier];
    const cardTg = TIER_GLOW[card.tier];
    const cardTi = TIER_ICON[card.tier];
    const d = document.createElement('div');
    d.className = 'upgrade-card';
    d.style.setProperty('--uc', cardTc);
    d.innerHTML = `<div class="utier" style="color:${cardTc}">${cardTi} ${TIER_NAMES[card.tier]}</div><div class="uname">${card.name}</div><div class="udesc">${card.desc}</div><div class="utype">${card.type.toUpperCase()}</div>`;
    d.onclick = () => {
      SFX.sel();
      const newState = { ...state.savedState };
      card.fn(newState);
      state.savedState = newState;
      showOpponentSelect();
    };
    grid.appendChild(d);
  });

  showScreen('cards-screen');
}

function showGameOver() {
  $('go-info').textContent = `WAVE ${state.wave} \u00B7 ${PADDLES.find(p => p.id === state.padId)?.name}`;
  $('go-buffs').textContent = state.enemyUps.length > 0 ? `ENEMY HAD ${state.enemyUps.length} UPGRADE${state.enemyUps.length > 1 ? 'S' : ''}` : ' ';
  showScreen('go-screen');
}

// ═══ OPPONENT SELECTION ═══
function generateOpponents(wv) {
  const baseRankIdx = Math.min(Math.floor(wv / 1.5), DIFF_RANKS.length - 1);
  const configs = [];

  // Easy
  const easyRank = Math.max(0, baseRankIdx - 1);
  const easyDiff = DIFF_RANKS[easyRank];
  let aiSpd = 220 + wv * 18;
  let aiReact = clamp(0.04 + wv * 0.02, 0, 0.35);
  const easyPool = getEnemiesForDiff(easyDiff);
  const easyEnemy = easyPool.length > 0 ? easyPool[Math.floor(Math.random() * easyPool.length)] : ENEMIES[0];
  const easyCfg = { wv, boss: false, diff: easyDiff, aiSpd, aiReact, eH: BASE_PAD_H, enemy: easyEnemy, trickAng: false, ghost: false, chaos: false, jitter: false, label: 'EASY' };
  easyEnemy.mod(easyCfg);
  configs.push(easyCfg);

  // Normal
  const normDiff = DIFF_RANKS[baseRankIdx];
  const normBoss = wv > 2 && wv % 3 === 0;
  if (baseRankIdx >= 5) {
    aiSpd = 220 + wv * 30 + (normBoss ? 80 : 0);
    aiReact = clamp(0.25 + wv * 0.07 + (normBoss ? 0.15 : 0), 0, 0.97);
  } else {
    aiSpd = 220 + wv * 22 + (normBoss ? 50 : 0);
    aiReact = clamp(0.06 + wv * 0.025 + (normBoss ? 0.06 : 0), 0, 0.4);
  }
  const normPool = getEnemiesForDiff(normDiff);
  const normEnemy = normPool.length > 0 ? normPool[Math.floor(Math.random() * normPool.length)] : ENEMIES[0];
  const normCfg = { wv, boss: normBoss, diff: normDiff, aiSpd, aiReact, eH: BASE_PAD_H, enemy: normEnemy, trickAng: false, ghost: false, chaos: false, jitter: false, label: 'NORMAL' };
  normEnemy.mod(normCfg);
  configs.push(normCfg);

  // Hard
  const hardRankIdx = Math.min(baseRankIdx + 2, DIFF_RANKS.length - 1);
  const hardDiff = DIFF_RANKS[hardRankIdx];
  const hardBoss = wv > 1;
  if (hardRankIdx >= 5) {
    aiSpd = 220 + wv * 35 + (hardBoss ? 100 : 0);
    aiReact = clamp(0.3 + wv * 0.08 + (hardBoss ? 0.18 : 0), 0, 0.98);
  } else {
    aiSpd = 220 + wv * 28 + (hardBoss ? 70 : 0);
    aiReact = clamp(0.1 + wv * 0.04 + (hardBoss ? 0.1 : 0), 0, 0.5);
  }
  const hardPool = getEnemiesForDiff(hardDiff);
  const hardEnemy = hardPool.length > 0 ? hardPool[Math.floor(Math.random() * hardPool.length)] : ENEMIES[0];
  const hardCfg = { wv, boss: hardBoss, diff: hardDiff, aiSpd, aiReact, eH: BASE_PAD_H, enemy: hardEnemy, trickAng: false, ghost: false, chaos: false, jitter: false, label: 'HARD' };
  hardEnemy.mod(hardCfg);
  configs.push(hardCfg);

  return configs;
}

function showOpponentSelect() {
  $('opp-wave-num').textContent = state.wave;
  const opponents = generateOpponents(state.wave);
  const grid = $('opp-grid');
  grid.innerHTML = '';

  opponents.forEach(cfg => {
    const dc = DIFF_COLORS[cfg.diff];
    const dg = DIFF_GLOW[cfg.diff];
    const availTiers = DIFF_TIERS[cfg.diff] || ['common'];

    const d = document.createElement('div');
    d.className = 'opp-card';
    d.style.borderColor = '#161616';

    let html = `<div class="opp-label">${cfg.label}</div>`;
    html += `<div class="opp-diff" style="color:${dc};text-shadow:0 0 12px rgba(${dg},0.3);">${cfg.diff}</div>`;
    if (cfg.boss) html += `<div class="opp-boss">\u2605 BOSS \u2605</div>`;
    html += `<div class="opp-name">${cfg.enemy.name}</div>`;
    html += `<div class="opp-tag">${cfg.enemy.tag || '\u00A0'}</div>`;

    const eab = getEnemyAbil(cfg.enemy.id);
    if (eab.id !== 'none') {
      html += `<div style="margin:4px 0 6px;padding:4px 8px;border:1px solid rgba(255,80,80,0.15);border-radius:2px;background:rgba(255,40,40,0.04);">`;
      html += `<div style="font-size:6.5px;letter-spacing:3px;color:#a66;margin-bottom:2px;">ABILITY</div>`;
      html += `<div style="font-size:10px;color:#f88;letter-spacing:2px;">${eab.icon} ${eab.name}</div>`;
      html += `<div style="font-size:7px;color:#a88;margin-top:2px;">${eab.desc}</div>`;
      html += `</div>`;
    }

    const spdR = Math.min(Math.round(cfg.aiSpd / 80), 9);
    const iqR = Math.min(Math.round(cfg.aiReact * 10), 9);
    const szR = Math.min(Math.round(cfg.eH / 20), 9);
    html += `<div class="opp-stats"><div class="opp-stat">SPD ${spdR}</div><div class="opp-stat">IQ ${iqR}</div><div class="opp-stat">SZ ${szR}</div></div>`;

    html += `<div class="opp-reward-box">`;
    html += `<div class="opp-reward-label">POSSIBLE RARITIES</div>`;
    html += `<div class="opp-tiers">`;
    availTiers.forEach(tier => {
      const tc = TIER_COLORS[tier];
      const tg = TIER_GLOW[tier];
      const icon = TIER_ICON[tier];
      html += `<div class="opp-tier-pill" style="color:${tc};border-color:color-mix(in srgb,${tc} 25%,#111);background:rgba(${tg},0.06)">${icon} ${TIER_NAMES[tier]}</div>`;
    });
    html += `</div></div>`;
    html += `<div class="opp-fight">FIGHT</div>`;

    d.innerHTML = html;
    d.onmouseenter = () => { d.style.borderColor = dc; d.style.boxShadow = `0 0 30px rgba(${dg},.12),inset 0 0 20px rgba(${dg},.03)`; };
    d.onmouseleave = () => { d.style.borderColor = '#161616'; d.style.boxShadow = 'none'; };
    d.onclick = () => { state.chosenOppCfg = cfg; SFX.sel(); startWave(state.padId, state.wave); };
    grid.appendChild(d);
  });

  showScreen('opp-screen');
}

function showVictory() {
  const c = PCOL[state.padId];
  $('vic-title').style.textShadow = `0 0 30px ${c.g}0.3), 0 0 60px ${c.g}0.1)`;
  $('vic-info').textContent = `${PADDLES.find(p => p.id === state.padId)?.name} \u00B7 COMPLETE`;
  showScreen('vic-screen');
}

// ═══ DEV MODE ═══
let devPad = 'classic', devEnemy = 'basic', devBoss = false, devWave = 6;

function showDevScreen() {
  const pg = $('dev-pad-grid');
  pg.innerHTML = '';
  PADDLES.forEach(p => {
    const c = PCOL[p.id];
    const d = document.createElement('div');
    d.style.cssText = `padding:8px 12px;cursor:pointer;border:1px solid ${devPad === p.id ? c.p : '#1a1a1a'};border-radius:3px;background:${devPad === p.id ? 'rgba(255,255,255,0.04)' : '#050508'};display:flex;align-items:center;gap:10px;transition:all 0.15s;`;
    d.innerHTML = `<div style="width:6px;height:6px;border-radius:50%;background:${c.p};box-shadow:0 0 6px ${c.p};flex-shrink:0;"></div><div><div style="font-size:10px;font-weight:700;letter-spacing:3px;color:${devPad === p.id ? c.p : '#aaa'}">${p.name}</div><div style="font-size:7px;color:#776;letter-spacing:2px;margin-top:2px;">[Q] ${p.abil} - ${p.ainfo}</div></div>`;
    d.onclick = () => { devPad = p.id; SFX.sel(); showDevScreen(); };
    pg.appendChild(d);
  });

  const eg = $('dev-enemy-grid');
  eg.innerHTML = '';
  ENEMIES.forEach(e => {
    const dc = DIFF_COLORS[e.diff] || '#fff';
    const eab = getEnemyAbil(e.id);
    const sel = devEnemy === e.id;
    const d = document.createElement('div');
    d.style.cssText = `padding:6px 10px;cursor:pointer;border:1px solid ${sel ? dc : '#1a1a1a'};border-radius:3px;background:${sel ? 'rgba(255,255,255,0.03)' : '#050508'};display:flex;align-items:center;gap:8px;transition:all 0.15s;`;
    d.innerHTML = `<div style="font-size:9px;font-weight:900;color:${dc};width:28px;text-align:center;letter-spacing:1px;">${e.diff}</div><div style="flex:1;"><div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${sel ? '#eee' : '#999'}">${e.name} <span style="color:#665;font-size:7px;">${e.tag}</span></div>${eab.id !== 'none' ? `<div style="font-size:6.5px;color:#a66;letter-spacing:1.5px;margin-top:1px;">${eab.icon} ${eab.name}</div>` : ''}</div>`;
    d.onclick = () => { devEnemy = e.id; SFX.sel(); showDevScreen(); };
    eg.appendChild(d);
  });

  const opts = $('dev-opts');
  opts.innerHTML = '';
  const bossD = document.createElement('div');
  bossD.style.cssText = `padding:8px 12px;cursor:pointer;border:1px solid ${devBoss ? '#f66' : '#1a1a1a'};border-radius:3px;background:${devBoss ? 'rgba(255,40,40,0.06)' : '#050508'};transition:all 0.15s;`;
  bossD.innerHTML = `<div style="font-size:9px;font-weight:700;letter-spacing:3px;color:${devBoss ? '#f66' : '#666'};">\u2605 BOSS MODE: ${devBoss ? 'ON' : 'OFF'}</div>`;
  bossD.onclick = () => { devBoss = !devBoss; SFX.sel(); showDevScreen(); };
  opts.appendChild(bossD);

  const wvD = document.createElement('div');
  wvD.style.cssText = 'padding:8px 12px;border:1px solid #1a1a1a;border-radius:3px;background:#050508;';
  wvD.innerHTML = `<div style="font-size:9px;font-weight:700;letter-spacing:3px;color:#999;margin-bottom:6px;">WAVE LEVEL: ${devWave}</div><input type="range" min="1" max="12" value="${devWave}" style="width:100%;accent-color:#f66;" id="dev-wave-slider">`;
  opts.appendChild(wvD);
  setTimeout(() => {
    const sl = $('dev-wave-slider');
    if (sl) sl.oninput = e => { devWave = parseInt(e.target.value); sl.parentElement.querySelector('div').textContent = 'WAVE LEVEL: ' + devWave; };
  }, 0);

  showScreen('dev-screen');
}

function devLaunch() {
  const enemy = ENEMIES.find(e => e.id === devEnemy) || ENEMIES[0];
  const wv = devWave;
  const boss = devBoss;
  const rankIdx = Math.min(Math.floor(wv / 1.5), DIFF_RANKS.length - 1);
  const diff = boss ? DIFF_RANKS[Math.min(rankIdx + 1, DIFF_RANKS.length - 1)] : enemy.diff;
  const diffIdx = DIFF_RANKS.indexOf(diff);
  let aiSpd, aiReact;
  if (diffIdx >= 5) { aiSpd = 220 + wv * 30 + (boss ? 80 : 0); aiReact = clamp(0.25 + wv * 0.07 + (boss ? 0.15 : 0), 0, 0.97); }
  else { aiSpd = 220 + wv * 22 + (boss ? 50 : 0); aiReact = clamp(0.06 + wv * 0.025 + (boss ? 0.06 : 0), 0, 0.4); }
  const eH = BASE_PAD_H;
  const cfg = { wv, boss, diff, aiSpd, aiReact, eH, enemy, trickAng: false, ghost: false, chaos: false, jitter: false };
  enemy.mod(cfg);
  state.savedState = null;
  state.wave = wv;
  state.enemyUps = [];
  state.chosenOppCfg = cfg;
  state.padId = devPad;
  state.g = newGame(devPad, wv, null, [], cfg);
  state.chosenOppCfg = null;
  showScreen(null);
  if (boss) setTimeout(SFX.boss, 80);
}

// ═══ DRAW ═══
let _sp = null;
function getSP(ctx) {
  if (_sp) return _sp;
  const c = document.createElement('canvas');
  c.width = 4; c.height = 4;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(0, 0, 4, 1);
  x.fillStyle = 'rgba(0,0,0,0.02)'; x.fillRect(0, 2, 4, 1);
  _sp = ctx.createPattern(c, 'repeat');
  return _sp;
}

function draw(ctx, cw, ch) {
  const g = state.g;
  if (!g) return;

  const sx = cw / GW, sy = ch / GH;
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  const chroma = g.chromaShift * 3;
  ctx.translate(g.shX * sx, g.shY * sy);
  ctx.scale(sx, sy);
  const col = PCOL[g.padId];
  const dCol = DIFF_COLORS[g.cfg.diff] || '#fff';

  // Background
  ctx.fillStyle = '#030303';
  ctx.fillRect(-10, -10, GW + 20, GH + 20);
  const vg = ctx.createRadialGradient(GW / 2, GH / 2, GW * 0.18, GW / 2, GH / 2, GW * 0.74);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(0.6, 'rgba(0,0,0,0.1)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GW, GH);

  // Flash effects
  if (g.flash > 0) {
    const [r, g2, b] = g.flashCol;
    ctx.fillStyle = `rgba(${r * 255 | 0},${g2 * 255 | 0},${b * 255 | 0},${g.flash * 0.055})`;
    ctx.fillRect(0, 0, GW, GH);
  }
  if (g.scoreFlash > 0) {
    const sf = g.scoreFlash, side = g.scoreFlashSide;
    const grd = ctx.createLinearGradient(side > 0 ? GW : 0, 0, side > 0 ? GW - 280 : 280, 0);
    const [r, g2, b] = g.flashCol;
    grd.addColorStop(0, `rgba(${r * 255 | 0},${g2 * 255 | 0},${b * 255 | 0},${sf * 0.07})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GW, GH);
  }

  // Time warp zones
  if (g.timewarp) {
    ctx.fillStyle = 'rgba(100,50,200,0.035)';
    ctx.fillRect(GW * 0.65, 0, GW * 0.35, GH);
    ctx.fillStyle = 'rgba(200,100,50,0.035)';
    ctx.fillRect(0, 0, GW * 0.35, GH);
  }

  // Center line
  ctx.shadowColor = col.g + '0.25)';
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#888';
  for (let y = 6; y < GH; y += 20) ctx.fillRect(GW / 2 - 1.5, y, 3, 12);
  ctx.shadowBlur = 0;

  // Scores
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 80px "Share Tech Mono",monospace';
  ctx.shadowColor = col.g + '0.22)';
  ctx.shadowBlur = 22;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillText(g.pScore, GW / 2 - 100, 16);
  ctx.fillText(g.eScore, GW / 2 + 100, 16);
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#fff';
  ctx.fillText(g.pScore, GW / 2 - 100, 16);
  ctx.fillText(g.eScore, GW / 2 + 100, 16);
  ctx.shadowBlur = 0;

  // Difficulty badge
  ctx.font = 'bold 10px "Share Tech Mono",monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = dCol;
  ctx.shadowColor = dCol;
  ctx.shadowBlur = 6;
  ctx.fillText(g.cfg.diff + (g.cfg.boss ? ' BOSS' : ''), GW / 2, 4);
  ctx.shadowBlur = 0;

  // Focus indicator
  if (isFocusActive()) {
    ctx.globalAlpha = 0.3 + 0.1 * Math.sin(g.t * 8);
    ctx.strokeStyle = col.p;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.strokeRect(g.px - PAD_W / 2 - 8, g.py - g.ph / 2 - 8, PAD_W + 16, g.ph + 16);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Player paddle
  const pGlow = g.hitFlash > 0 ? 20 : 6;
  ctx.shadowColor = col.g + '0.6)';
  ctx.shadowBlur = pGlow;
  ctx.fillStyle = col.p;
  ctx.fillRect(g.px - PAD_W / 2, g.py - g.ph / 2, PAD_W, g.ph);
  ctx.shadowBlur = 28;
  ctx.fillStyle = col.g + (g.hitFlash > 0 ? 0.06 : 0.02) + ')';
  ctx.fillRect(g.px - PAD_W / 2 - 6, g.py - g.ph / 2 - 6, PAD_W + 12, g.ph + 12);
  ctx.shadowBlur = 0;

  if (g.smashNext || g.curveNext || g.thunderNext || g.phaseNext) {
    const p = 0.2 + 0.2 * Math.sin(g.t * 11);
    ctx.strokeStyle = col.g + p + ')';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = col.g + '0.35)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(g.px - PAD_W / 2 - 5, g.py - g.ph / 2 - 5, PAD_W + 10, g.ph + 10);
    ctx.shadowBlur = 0;
  }

  // Doppelganger paddle
  if (g.doppel) {
    const dpX = EX - 60;
    ctx.globalAlpha = 0.3 + 0.15 * Math.sin(g.t * 3);
    ctx.shadowColor = col.g + '0.4)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = col.p;
    ctx.fillRect(dpX - PAD_W / 2, g.py - g.ph * 0.4, PAD_W, g.ph * 0.8);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Enemy paddle
  ctx.globalAlpha = g.ghostA;
  const eSh = g.shrinkT > 0;
  const frozen = g.freezeT > 0;
  ctx.shadowColor = frozen ? 'rgba(100,150,255,0.4)' : eSh ? 'rgba(255,80,80,0.3)' : 'rgba(255,255,255,0.35)';
  ctx.shadowBlur = frozen ? 8 : eSh ? 3 : 4;
  ctx.fillStyle = frozen ? '#88aaff' : eSh ? '#866' : '#ddd';
  ctx.fillRect(EX - PAD_W / 2, g.ey - g.eH / 2, PAD_W, g.eH);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Clone paddle
  if (g.cloneT > 0) {
    const clX = EX - 35;
    const ca2 = Math.min(g.cloneT, 0.5) * 2;
    ctx.globalAlpha = ca2 * 0.4;
    ctx.fillStyle = '#88f';
    ctx.shadowColor = 'rgba(100,100,255,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillRect(clX - PAD_W / 2, g.cloneY - g.eH / 2, PAD_W, g.eH);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Ball trail
  if (g.trail.length > 2) {
    const [tr, tg, tb] = col.t;
    for (let i = 1; i < g.trail.length; i++) {
      const t = i / g.trail.length, pt = g.trail[i], pp = g.trail[i - 1];
      const alpha = t * t * 0.2, sz = BALL_SZ * (0.2 + t * 0.55);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${tr * 255 | 0},${tg * 255 | 0},${tb * 255 | 0})`;
      for (let s = 0; s < 2; s++) {
        const st = s / 2;
        ctx.fillRect(lerp(pp.x, pt.x, st) - sz / 2, lerp(pp.y, pt.y, st) - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Ball
  const ghostAlpha = g.ghostBall ? (0.28 + 0.2 * Math.sin(g.t * 10)) : 1;
  ctx.globalAlpha = ghostAlpha;
  if (chroma > 0.3) {
    ctx.globalAlpha = ghostAlpha * 0.15;
    ctx.fillStyle = '#f55';
    ctx.fillRect(g.bx - BALL_SZ / 2 - chroma, g.by - BALL_SZ / 2, BALL_SZ, BALL_SZ);
    ctx.fillStyle = '#55f';
    ctx.fillRect(g.bx - BALL_SZ / 2 + chroma, g.by - BALL_SZ / 2, BALL_SZ, BALL_SZ);
    ctx.globalAlpha = ghostAlpha;
  }
  ctx.shadowColor = col.g + '0.5)';
  ctx.shadowBlur = g.smashNext ? 22 : 10;
  ctx.fillStyle = col.g + (g.smashNext ? 0.08 : 0.04) + ')';
  ctx.fillRect(g.bx - BALL_SZ, g.by - BALL_SZ, BALL_SZ * 2, BALL_SZ * 2);
  ctx.shadowBlur = g.smashNext ? 16 : 6;
  ctx.fillStyle = col.p;
  ctx.fillRect(g.bx - BALL_SZ / 2, g.by - BALL_SZ / 2, BALL_SZ, BALL_SZ);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Lightning bolts
  for (const b of g.bolts) {
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,255,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    if (b.trail.length > 0) {
      ctx.moveTo(b.trail[0].x, b.trail[0].y);
      for (const pt of b.trail) ctx.lineTo(pt.x, pt.y);
    }
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Sparks
  for (const p of g.sparks) {
    const t = p.life / p.max;
    ctx.globalAlpha = t * 0.7;
    const c = p.col;
    if (c) {
      ctx.fillStyle = `rgb(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0})`;
      ctx.shadowColor = ctx.fillStyle;
    } else {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
    }
    ctx.shadowBlur = 3 + t * 5;
    const sz = 1.5 + t * 3;
    ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Gravity well VFX
  if (g.gravWell && g.gravWellT > 0) {
    const gw = g.gravWell;
    ctx.globalAlpha = 0.15 + 0.1 * Math.sin(g.t * 5);
    ctx.strokeStyle = col.p;
    ctx.lineWidth = 1;
    for (let r = 0; r < 3; r++) {
      const radius = 15 + r * 12 + Math.sin(g.t * 6 + r) * 5;
      ctx.beginPath();
      ctx.arc(gw.x, gw.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = col.p;
    ctx.beginPath();
    ctx.arc(gw.x, gw.y, 4 + Math.sin(g.t * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Foresight path
  if (g.foresightT > 0 && g.bvx !== 0) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = col.g + '0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    let px = g.bx, py = g.by, pvx = g.bvx, pvy = g.bvy;
    ctx.moveTo(px, py);
    for (let i = 0; i < 600; i++) {
      px += pvx * 0.004;
      py += pvy * 0.004;
      if (py < 5) { py = 5; pvy = Math.abs(pvy); }
      if (py > GH - 5) { py = GH - 5; pvy = -Math.abs(pvy); }
      ctx.lineTo(px, py);
      if (px < 0 || px > GW) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // HUD - lives and ability
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = '10px "Share Tech Mono",monospace';
  ctx.fillStyle = '#666';
  ctx.fillText(`LIVES: ${g.lives}`, 10, GH - 10);

  if (g.pad.cd < 900) {
    const cdPct = Math.max(0, 1 - g.abCD / (g.pad.cd * g.cdMul));
    ctx.fillStyle = cdPct >= 1 ? col.p : '#444';
    ctx.fillText(`[Q] ${g.pad.abil}: ${cdPct >= 1 ? 'READY' : Math.ceil(g.abCD) + 's'}`, 10, GH - 24);
  }

  // Focus mode indicator
  if (isFocusActive()) {
    ctx.fillStyle = col.p;
    ctx.fillText('FOCUS', 10, GH - 38);
  }

  // Done overlay
  if (g.done) {
    const fade = Math.min(g.doneT * 2, 1);
    ctx.fillStyle = `rgba(0,0,0,${fade * 0.7})`;
    ctx.fillRect(0, 0, GW, GH);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px "Share Tech Mono",monospace';
    ctx.fillStyle = g.result === 'win' ? col.p : '#f55';
    ctx.shadowColor = g.result === 'win' ? col.g + '0.4)' : 'rgba(255,50,50,0.4)';
    ctx.shadowBlur = 20;
    ctx.fillText(g.result === 'win' ? 'VICTORY' : 'DEFEAT', GW / 2, GH / 2 - 20);
    ctx.font = '12px "Share Tech Mono",monospace';
    ctx.fillStyle = '#888';
    ctx.shadowBlur = 0;
    ctx.fillText('PRESS ENTER TO CONTINUE', GW / 2, GH / 2 + 30);
  }

  ctx.restore();
}

// ═══ INITIALIZATION ═══
setupInputHandlers(doAbility, handleContinue);

$('cv').addEventListener('click', () => handleContinue());
$('go-retry').onclick = () => { state.savedState = null; state.wave = 1; state.enemyUps = []; state.chosenOppCfg = null; SFX.sel(); showOpponentSelect(); };
$('go-menu').onclick = () => { state.savedState = null; state.wave = 1; state.enemyUps = []; state.chosenOppCfg = null; showScreen('menu-screen'); };
$('vic-again').onclick = () => { state.savedState = null; state.wave = 1; state.enemyUps = []; state.chosenOppCfg = null; showScreen('menu-screen'); };
$('dev-go').onclick = () => { SFX.sel(); devLaunch(); };
$('dev-back').onclick = () => { SFX.sel(); showScreen('menu-screen'); };

// ═══ GAME LOOP ═══
const cv = $('cv');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
let last = performance.now();

function resize() {
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.04);
  last = now;
  if (state.curScreen === null && state.g) {
    update(dt);
    draw(ctx, cv.width, cv.height);
  }
  requestAnimationFrame(loop);
}

buildPadGrid();
showScreen('menu-screen');
requestAnimationFrame(loop);
