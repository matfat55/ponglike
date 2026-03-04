// ═══ GAME MODULE ═══
// Main game logic - update, draw, and core gameplay

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

// ═══ RICO BOUNCE ═══
function ricoB(gg) {
  if (!gg.rico) return;
  const s = Math.hypot(gg.bvx, gg.bvy);
  const n = Math.min(s * 1.08, gg.bs * 2.5);
  gg.bvx *= n / s;
  gg.bvy *= n / s;
}

// ═══ UPDATE ═══
export function update(dt) {
  const g = state.g;
  if (!g) return;
  if (g.done) { g.doneT += dt; return; }

  g.t += dt;
  if (g.abCD > 0) g.abCD -= dt;
  if (g.shake > 0) { g.shake -= dt; const i = g.shake * 20; g.shX = (Math.random() - 0.5) * i; g.shY = (Math.random() - 0.5) * i; } else { g.shX = 0; g.shY = 0; }
  if (g.flash > 0) g.flash -= dt * 4;
  if (g.hitFlash > 0) g.hitFlash -= dt * 6;
  if (g.scoreFlash > 0) g.scoreFlash -= dt * 2;
  if (g.chromaShift > 0) g.chromaShift -= dt * 5;
  g.ghostA = g.cfg.ghost ? 0.15 + Math.abs(Math.sin(g.t * 6)) * 0.65 : 1;

  // Start-of-point pause
  if (g.startPause > 0) {
    g.startPause -= dt;
    if (g.startPause <= 0) {
      const spd = g.rallyBase * Math.pow(1.05, g.rallyHits);
      g.ballSpd = spd;
      g.bvx = g.pendingDir * spd;
      g.bvy = rng(-160, 160);
    }
  }
  if (g.ghostT > 0) { g.ghostT -= dt; if (g.ghostT <= 0) g.ghostBall = false; }
  if (g.wallT > 0) { g.wallT -= dt; if (g.wallT <= 0) g.placedWall = null; }
  if (g.shrinkT > 0) g.shrinkT -= dt;
  if (g.freezeT > 0) g.freezeT -= dt;
  if (g.shockT > 0) g.shockT -= dt;

  // Enemy paddle height
  if (g.shrinkT > 0) g.eH = g.eHBase * 0.5;
  else if (g.bulkT > 0) g.eH = g.eHBase * 1.4;
  else g.eH = g.eHBase;
  g.eH = Math.min(g.eH, BASE_PAD_H * 1.4);

  // Sparks
  for (let i = g.sparks.length - 1; i >= 0; i--) {
    const p = g.sparks[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.92; p.vy *= 0.92;
    p.life -= dt;
    if (p.life <= 0) g.sparks.splice(i, 1);
  }

  // Ability timers
  if (g.foresightT > 0) g.foresightT -= dt;
  if (g.blizzardT > 0) g.blizzardT -= dt;
  if (g.gravWellT > 0) { g.gravWellT -= dt; if (g.gravWellT <= 0) g.gravWell = null; }

  // Gravity well
  if (g.gravWell && g.gravWellT > 0) {
    const dx = g.gravWell.x - g.bx, dy = g.gravWell.y - g.by;
    const dist = Math.max(Math.hypot(dx, dy), 15);
    if (g.bvx < 0) {
      const force = 3200 / (dist + 30);
      g.bvx += dx / dist * force * dt; g.bvy += dy / dist * force * dt;
      if (dist < 20) g.bvx = Math.abs(g.bvx) + 100 * dt;
    } else {
      const force = 1800 / (dist + 40);
      const perp = g.by < g.ey ? -1 : 1;
      g.bvy += perp * force * dt * 0.7;
      g.bvx += dx / dist * force * dt * 0.3;
      const ratio = Math.abs(g.bvy) / (Math.abs(g.bvx) + 1);
      if (ratio > 3) g.bvx += Math.sign(g.bvx) * 200 * dt;
    }
  }

  // Lightning bolts
  for (let i = g.bolts.length - 1; i >= 0; i--) {
    const b = g.bolts[i];
    b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 8) b.trail.shift();
    b.zig -= dt; if (b.zig <= 0) { b.zig = 0.12 + Math.random() * 0.1; b.vy = (Math.random() - 0.5) * 250; }
    if (b.y < 10) { b.y = 10; b.vy = Math.abs(b.vy); }
    if (b.y > GH - 10) { b.y = GH - 10; b.vy = -Math.abs(b.vy); }
    if (b.x > EX - PAD_W / 2 - 4 && b.x < EX + PAD_W / 2 + 4 && b.y > g.ey - g.eH / 2 - 4 && b.y < g.ey + g.eH / 2 + 4) {
      g.freezeT = Math.max(g.freezeT, 0.7);
      g.shake = 0.08; g.flash = 0.12; g.flashCol = [1, 0.93, 0.27];
      addSparks(g, EX, g.ey, 14, 100, [1, 0.93, 0.27]);
      tone(400, 0.06, 'square', 0.04); tone(200, 0.1, 'square', 0.03, 30);
      g.bolts.splice(i, 1); continue;
    }
    if (b.x > GW || b.x < 0 || b.life <= 0) g.bolts.splice(i, 1);
  }

  // Mirror Match
  if (g.mirrorMatch) {
    g.mirrorBuf.push({ t: g.t, y: g.py });
    while (g.mirrorBuf.length > 0 && g.mirrorBuf[0].t < g.t - 0.4) g.mirrorBuf.shift();
    if (g.mirrorBuf.length > 0) g._mirrorY = g.mirrorBuf[0].y;
  }

  const rallyMul = Math.pow(1.05, g.rallyHits);
  g.ballSpd = g.rallyBase * rallyMul;

  // Time warp
  let twMul = 1;
  if (g.timewarp) {
    const nx = g.bx / GW;
    if (g.bvx > 0) twMul = lerp(1.15, 0.7, nx);
    else twMul = lerp(0.75, 1.2, nx);
  }
  if (g.blizzardT > 0 && g.bx > GW * 0.4) twMul *= 0.3;

  // ═══ PLAYER MOVEMENT WITH FOCUS KEY ═══
  const baseSp = g.pSpd;
  const focusActive = isFocusActive();
  // Focus mode reduces movement speed for precision
  const sp = focusActive ? baseSp * FOCUS_SPEED_MULT : baseSp;
  const hMax = HORIZ * g.horizMul;

  if (isMovingUp()) g.py -= sp * dt;
  if (isMovingDown()) g.py += sp * dt;
  if (g.voidWalk && g.bvx < 0) g.py = lerp(g.py, g.by, dt * 12);
  g.py = clamp(g.py, g.ph / 2, GH - g.ph / 2);

  // Horizontal with focus slowdown
  const horizSpeed = focusActive ? sp * 0.55 : baseSp * 0.55;
  if (isMovingLeft()) g.px -= horizSpeed * dt;
  if (isMovingRight()) g.px += horizSpeed * dt;
  if (!isMovingLeft() && !isMovingRight()) g.px = lerp(g.px, PX_HOME, dt * 4);
  g.px = clamp(g.px, PX_HOME - hMax, PX_HOME + hMax);

  g.pVelY = (g.py - g.prevPy) / Math.max(dt, 0.001);
  g.prevPy = g.py;

  // Ball movement
  const ballFrozen = g.tsT > 0 || g.eAbilPhase === 'strike' || g.startPause > 0;
  if (!ballFrozen) { g.trail.push({ x: g.bx, y: g.by }); if (g.trail.length > TRAIL) g.trail.shift(); }

  if (!ballFrozen) {
    g.bx += g.bvx * dt * twMul; g.by += g.bvy * dt * twMul;
    if (g.curveNext && g.bvx > 0) { g.bvy += Math.sign(g.bvy || 1) * 320 * dt; g.bvy = clamp(g.bvy, -g.ballSpd * 1.8, g.ballSpd * 1.8); }
    if (g.magnet && g.bvx < 0) g.bvy += Math.sign(g.py - g.by) * 45 * dt;
    if (g.homing && g.bvx > 0 && g.bx > GW * 0.4) {
      const gap = g.by < g.ey ? g.ey - g.eH / 2 - 20 : g.ey + g.eH / 2 + 20;
      g.bvy += Math.sign(gap - g.by) * 60 * dt;
    }
    if (g.singularity && g.bvx > 0) { g.bvx += 50 * dt; g.bvy *= 0.998; }
  }

  const bs2 = BALL_SZ / 2, col = PCOL[g.padId];

  // Wall bounce
  if (g.by - bs2 < 0) { g.by = bs2; g.bvy = Math.abs(g.bvy); SFX.wall(); addSparks(g, g.bx, 0, 4, 60, col.t); ricoB(g); }
  if (g.by + bs2 > GH) { g.by = GH - bs2; g.bvy = -Math.abs(g.bvy); SFX.wall(); addSparks(g, g.bx, GH, 4, 60, col.t); ricoB(g); }

  // Placed wall collision
  if (g.placedWall) {
    const w = g.placedWall, wW = 8, wH = 60;
    if (g.bx + bs2 > w.x - wW / 2 && g.bx - bs2 < w.x + wW / 2 && g.by + bs2 > w.y - wH / 2 && g.by - bs2 < w.y + wH / 2) {
      g.bvx = -g.bvx;
      g.bx = g.bvx > 0 ? w.x + wW / 2 + bs2 + 1 : w.x - wW / 2 - bs2 - 1;
      SFX.wall(); addSparks(g, g.bx, g.by, 10, 80, col.t);
    }
  }

  const cs = Math.hypot(g.bvx, g.bvy);
  const skipNorm = g.tsT > 0 || g.eAbilPhase === 'strike' || g.pullT > 0 || g.spinCurveT > 0;
  if (!skipNorm && cs > 1) {
    const maxSpd = g.ballSpd * 2.8;
    if (cs > maxSpd) { const r = maxSpd / cs; g.bvx *= r; g.bvy *= r; }
    else { const r = lerp(1, g.ballSpd / cs, dt * 5); g.bvx *= r; g.bvy *= r; }
  }

  // Player hit
  if (g.bvx < 0) {
    const pL = g.px - PAD_W / 2 - 2, pR = g.px + PAD_W / 2 + 2, pT = g.py - g.ph / 2, pB = g.py + g.ph / 2;
    if (!(g.bx - bs2 > pR || g.bx + bs2 < pL || g.by + bs2 < pT || g.by - bs2 > pB)) {
      let spd = g.ballSpd * 1.03;
      let piercing = false;
      if (g.smashNext) { spd = g.ballSpd * 2.5; g.smashNext = false; g.shake = 0.25; g.chromaShift = 1.2; addSparks(g, g.px + PAD_W, g.by, 28, 220, col.t); g.flash = 0.4; g.flashCol = col.t; SFX.smash(); piercing = true; }
      if (g.transcend) piercing = true;
      if (g.phaseNext) { g.phaseNext = false; piercing = true; g.shake = 0.12; g.chromaShift = 0.5; g.flash = 0.2; g.flashCol = [0.8, 0.53, 1]; addSparks(g, g.bx, g.by, 16, 120, [0.8, 0.53, 1]); tone(700, 0.06, 'sine', 0.04); }

      g.bvx = Math.abs(g.bvx);
      g.bvy += clamp(g.pVelY * 0.45, -spd * 0.7, spd * 0.7);
      if (g.edge) { const rel = clamp((g.by - g.py) / (g.ph / 2), -1, 1); if (Math.abs(rel) > 0.6) g.bvy += rel * spd * 0.4; }

      const curSpd = Math.hypot(g.bvx, g.bvy);
      if (curSpd > 0.1) { const r = spd / curSpd; g.bvx *= r; g.bvy *= r; }
      g.bvx = Math.abs(g.bvx);
      const maxVy = spd * 0.92;
      if (Math.abs(g.bvy) > maxVy) { g.bvy = Math.sign(g.bvy) * maxVy; g.bvx = Math.sqrt(spd * spd - g.bvy * g.bvy); }
      g.bx = pR + bs2 + 1;

      g.combo++; g.rallyHits++;
      g.flash = Math.max(g.flash, 0.18); g.hitFlash = 1; g.shake = Math.max(g.shake, 0.03);
      SFX.paddle(); addSparks(g, g.px + PAD_W / 2, g.by, 5, 80, col.t);

      // Master of Skill
      if (g.masterSkill) {
        g._masterBaseSpd = g.ballSpd; g._masterHitBoosted = true;
        g.bs *= 1.2;
        const boosted = g.ballSpd * 3;
        g.bvx = Math.sign(g.bvx) * Math.abs(g.bvx) / Math.hypot(g.bvx, g.bvy) * boosted;
        g.bvy = g.bvy / Math.hypot(g.bvx, g.bvy) * boosted;
        g.shake = Math.max(g.shake, 0.1); g.chromaShift = Math.max(g.chromaShift, 0.3);
      }

      if (g.freeze) g.freezeT = 0.8;
      if (g.shockwave) { const push = (g.by < g.ey) ? -60 : 60; g.ey += push; g.shockT = 0.3; addSparks(g, EX, g.ey, 8, 100, [1, 0.5, 0.2]); }
      if (g.thunderNext) {
        g.thunderNext = false;
        g.bolts.push({ x: g.bx, y: g.by, vx: 550, vy: 0, life: 2, zig: 0.15, trail: [] });
        tone(600, 0.05, 'square', 0.05); tone(800, 0.08, 'square', 0.04, 30);
      }
      if (g.stormCaller) {
        g.bolts.push({ x: g.bx, y: g.by, vx: 500, vy: (Math.random() - 0.5) * 150, life: 2, zig: 0.1, trail: [] });
      }
      if (g.phantomStrike && !piercing) {
        const teleportDist = (GW - g.bx) * 0.2;
        g.bx += teleportDist;
        addSparks(g, g.bx, g.by, 10, 60, col.t);
      }
      if (g.berserker) {
        g.berserkerStacks++;
        g.bs = g._berserkerBase * Math.pow(1.08, g.berserkerStacks);
      }
      if (g.overcharge && g.combo % 3 === 0) {
        piercing = true;
        g.shake = Math.max(g.shake, 0.15); g.chromaShift = Math.max(g.chromaShift, 0.8);
        addSparks(g, g.bx, g.by, 20, 150, [1, 0.3, 0.1]);
      }
      if (g.afterimage) {
        g.afterBall = { x: g.bx - 30, y: g.by, vx: g.bvx * 0.7, vy: g.bvy * 0.7, life: 1.2, trail: [] };
      }

      if (!piercing) {
        // Normal collision - ball goes right
      } else {
        // Piercing - ball continues through
        g.ghostBall = true; g.ghostT = 0.5;
      }
    }
  }

  // Doppelganger paddle collision
  if (g.doppel && g.bvx > 0) {
    const dpX = EX - 60;
    const dpL = dpX - PAD_W / 2, dpR = dpX + PAD_W / 2;
    const dpH = g.ph * 0.8, dpT = g.py - dpH / 2, dpB = g.py + dpH / 2;
    if (!(g.bx - bs2 > dpR || g.bx + bs2 < dpL || g.by + bs2 < dpT || g.by - bs2 > dpB)) {
      g.bvx = -Math.abs(g.bvx);
      g.bx = dpL - bs2 - 1;
      SFX.paddle(); addSparks(g, dpX, g.by, 4, 50, col.t);
    }
  }

  // Afterimage ball
  if (g.afterBall) {
    const ab = g.afterBall;
    ab.life -= dt;
    ab.x += ab.vx * dt; ab.y += ab.vy * dt;
    ab.trail.push({ x: ab.x, y: ab.y }); if (ab.trail.length > 10) ab.trail.shift();
    if (ab.y < bs2) { ab.y = bs2; ab.vy = Math.abs(ab.vy); }
    if (ab.y > GH - bs2) { ab.y = GH - bs2; ab.vy = -Math.abs(ab.vy); }
    if (ab.x > GW - 30) {
      g.pScore += g.dblScore ? 2 : 1;
      g.scoreFlash = 1; g.scoreFlashSide = 1; g.flashCol = col.t;
      SFX.score(); addSparks(g, GW, ab.y, 12, 100, col.t);
      g.afterBall = null;
      if (g.pScore >= PTS_WIN) { g.done = true; g.result = 'win'; SFX.win(); }
    }
    if (ab.life <= 0) g.afterBall = null;
  }

  // Enemy paddle hit
  if (g.bvx > 0 && !g.ghostBall) {
    const eL = EX - PAD_W / 2 - 2, eR = EX + PAD_W / 2 + 2, eT = g.ey - g.eH / 2, eB = g.ey + g.eH / 2;
    if (!(g.bx - bs2 > eR || g.bx + bs2 < eL || g.by + bs2 < eT || g.by - bs2 > eB)) {
      const spd = g.ballSpd * 1.02;
      const angRange = g.trickAng ? 0.45 : 0.35;
      const ang = Math.PI + (Math.random() - 0.5) * angRange * 2;
      g.bvx = Math.cos(ang) * spd; g.bvy = Math.sin(ang) * spd;
      g.bx = eL - bs2 - 1;
      g.rallyHits++; g.combo = 0;
      SFX.paddle(); addSparks(g, EX - PAD_W / 2, g.by, 4, 60);
      if (g.chaos) g.rallyBase = Math.min(g.rallyBase * 1.04, 600);
      if (g.masterSkill && g._masterHitBoosted) {
        g._masterHitBoosted = false;
        g.ballSpd = g._masterBaseSpd;
      }
      if (g.spinNext) { g.spinNext = false; g.spinCurveT = 0.6; }
    }
  }

  // Clone paddle
  if (g.cloneT > 0 && g.bvx > 0) {
    const clX = EX - 35;
    const clL = clX - PAD_W / 2, clR = clX + PAD_W / 2;
    const clT = g.cloneY - g.eH / 2, clB = g.cloneY + g.eH / 2;
    if (!(g.bx - bs2 > clR || g.bx + bs2 < clL || g.by + bs2 < clT || g.by - bs2 > clB)) {
      const spd = g.ballSpd;
      const ang = Math.PI + (Math.random() - 0.5) * 0.4;
      g.bvx = Math.cos(ang) * spd; g.bvy = Math.sin(ang) * spd;
      g.bx = clL - bs2 - 1;
      SFX.paddle(); addSparks(g, clX, g.by, 4, 50, [0.5, 0.5, 1]);
    }
  }

  // Spin curve
  if (g.spinCurveT > 0) {
    g.spinCurveT -= dt;
    const curveMag = 400;
    g.bvy += Math.sign(g.bvy || 1) * curveMag * dt;
  }

  // Scoring
  if (g.bx < -20) {
    if (g.shields > 0 && !g.shUsed) {
      g.shUsed = true; g.shields--;
      g.bx = PX_HOME + PAD_W + 20;
      g.bvx = Math.abs(g.bvx); g.bvy = (Math.random() - 0.5) * 200;
      g.shake = 0.15; g.flash = 0.3; g.flashCol = [0.2, 0.8, 1];
      addSparks(g, g.px + PAD_W, g.by, 20, 120, [0.2, 0.8, 1]);
      tone(500, 0.1, 'sine', 0.06);
    } else {
      g.eScore++;
      g.scoreFlash = 1; g.scoreFlashSide = -1; g.flashCol = [1, 0.3, 0.3];
      SFX.miss();
      if (g.berserker) { g.berserkerStacks = 0; g.bs = g._berserkerBase; }
      if (g.eScore >= PTS_WIN) {
        g.lives--;
        g.done = true; g.result = 'lose';
      } else {
        resetBall(g, -1);
      }
    }
  }
  if (g.bx > GW + 20) {
    const pts = g.dblScore ? 2 : 1;
    g.pScore += pts;
    g.scoreFlash = 1; g.scoreFlashSide = 1; g.flashCol = col.t;
    SFX.score(); addSparks(g, GW, g.by, 12, 100, col.t);
    if (g.vampire && g.lives < 6) g.lives++;
    if (g.siphon) { g.aiSpd *= 0.95; g.aiReact *= 0.95; }
    if (g.pScore >= PTS_WIN) {
      g.done = true; g.result = 'win'; SFX.win();
    } else {
      resetBall(g, 1);
    }
  }

  // Enemy AI (simplified - full version in original)
  if (g.freezeT <= 0) {
    const targetY = g.mirrorMatch ? g._mirrorY : simBallY(g.bx, g.by, g.bvx, g.bvy, EX);
    const diff = targetY - g.ey;
    const maxMove = g.aiSpd * dt;
    if (g.dashT > 0) {
      g.dashT -= dt;
      g.ey += Math.sign(diff) * g.dashSpd * dt;
    } else {
      g.ey += clamp(diff * g.aiReact, -maxMove, maxMove);
    }
    if (g.jitter) g.ey += Math.sin(g.t * 18) * 2.5;
    g.ey = clamp(g.ey, g.eH / 2, GH - g.eH / 2);
  }

  // Enemy ability timers
  if (g.bulkT > 0) g.bulkT -= dt;
  if (g.pullT > 0) {
    g.pullT -= dt;
    if (g.bvx < 0) {
      g.bvx *= 0.97;
      g.bvx += 80 * dt;
    }
  }
  if (g.overdriveT > 0) {
    g.overdriveT -= dt;
    g.ballSpd = g.rallyBase * 2;
  }
  if (g.cloneT > 0) {
    g.cloneT -= dt;
    g.cloneY = lerp(g.cloneY, g.ey, dt * 4);
  }

  // Enemy ability casting (simplified)
  if (g.eAbilCD > 0) g.eAbilCD -= dt;
  if (g.eAbilCD <= 0 && g.eAbil.id !== 'none') {
    const canUse = g.bvx > 0 && g.bx > GW * 0.4;
    if (canUse) {
      switch (g.eAbil.id) {
        case 'dash':
          if (Math.abs(g.by - g.ey) > g.eH * 0.8) {
            g.dashT = 0.5; g.dashSpd = g.aiSpd * 3.5;
            g.eAbilCD = g.eAbil.cd;
          }
          break;
        case 'bulk':
          g.bulkT = 2.5;
          g.eAbilCD = g.eAbil.cd;
          break;
        case 'pull':
          if (g.bx > GW * 0.7) {
            g.pullT = 2;
            g.eAbilCD = g.eAbil.cd;
          }
          break;
        case 'accel':
          g.overdriveT = 2;
          g.eAbilCD = g.eAbil.cd;
          break;
        case 'clone':
          g.cloneT = 3; g.cloneY = g.ey;
          g.eAbilCD = g.eAbil.cd;
          break;
        case 'blink':
          if (Math.abs(g.by - g.ey) > g.eH * 0.7) {
            g.ey = g.by;
            g.blinkFlash = 0.2;
            g.eAbilCD = g.eAbil.cd;
          }
          break;
        case 'spin':
          g.spinNext = true;
          g.eAbilCD = g.eAbil.cd;
          break;
      }
    }
  }

  if (g.blinkFlash > 0) g.blinkFlash -= dt;
}

// Export other necessary functions
export { ricoB };
