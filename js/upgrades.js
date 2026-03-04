import { TIER_ORDER, DIFF_TIERS } from './constants.js';

// ═══ UPGRADE POOL (stat + ability upgrades) ═══
export const ALL_CARDS = [
  // COMMON (stat)
  {
    id: 'wider',
    name: 'WIDE PADDLE',
    desc: '+30% paddle size',
    tier: 'common',
    type: 'stat',
    fn: (s) => {
      s.ph *= 1.3;
    },
  },
  {
    id: 'swift',
    name: 'QUICK FEET',
    desc: '+30% paddle speed',
    tier: 'common',
    type: 'stat',
    fn: (s) => {
      s.pSpd *= 1.3;
    },
  },
  {
    id: 'heavy',
    name: 'HEAVY BALL',
    desc: '+20% ball speed, enemy AI -15%',
    tier: 'common',
    type: 'stat',
    fn: (s) => {
      s.bs *= 1.2;
      s.aiMod *= 0.85;
    },
  },
  // UNCOMMON (stat + light ability)
  {
    id: 'life',
    name: 'EXTRA LIFE',
    desc: '+1 life',
    tier: 'uncommon',
    type: 'stat',
    fn: (s) => {
      s.lives++;
    },
  },
  {
    id: 'cd',
    name: 'FAST CHARGE',
    desc: '-35% ability cooldown',
    tier: 'uncommon',
    type: 'stat',
    fn: (s) => {
      s.cdMul *= 0.65;
    },
  },
  {
    id: 'edge',
    name: 'EDGE MASTER',
    desc: 'Outer paddle hits send extreme angles',
    tier: 'uncommon',
    type: 'ability',
    fn: (s) => {
      s.edge = true;
    },
  },
  {
    id: 'reach',
    name: 'LONG REACH',
    desc: '+50% horizontal paddle movement range',
    tier: 'uncommon',
    type: 'stat',
    fn: (s) => {
      s.horizMul *= 1.5;
    },
  },
  {
    id: 'bounceback',
    name: 'SNAPBACK',
    desc: 'Ball speeds up 15% each time it bounces off a wall',
    tier: 'uncommon',
    type: 'ability',
    fn: (s) => {
      s.rico = true;
    },
  },
  // RARE (strong stat + abilities)
  {
    id: 'shield',
    name: 'SAFETY NET',
    desc: 'Auto-block your first missed ball each wave',
    tier: 'rare',
    type: 'ability',
    fn: (s) => {
      s.shields++;
    },
  },
  {
    id: 'freeze',
    name: 'FREEZE FRAME',
    desc: 'Enemy paddle freezes 0.8s every time you hit the ball',
    tier: 'rare',
    type: 'ability',
    fn: (s) => {
      s.freeze = true;
    },
  },
  {
    id: 'siphon',
    name: 'SIPHON',
    desc: 'Enemy AI gets 5% worse every time you score',
    tier: 'rare',
    type: 'ability',
    fn: (s) => {
      s.siphon = true;
    },
  },
  {
    id: 'turbo',
    name: 'ADRENALINE',
    desc: '+40% paddle speed, +15% ball speed',
    tier: 'rare',
    type: 'stat',
    fn: (s) => {
      s.pSpd *= 1.4;
      s.bs *= 1.15;
    },
  },
  {
    id: 'fort',
    name: 'IRON WILL',
    desc: '+2 lives, +10% paddle size',
    tier: 'rare',
    type: 'stat',
    fn: (s) => {
      s.lives += 2;
      s.ph *= 1.1;
    },
  },
  // EPIC (powerful abilities)
  {
    id: 'magnet',
    name: 'MAGNETISM',
    desc: 'Ball curves toward your paddle when heading your way',
    tier: 'epic',
    type: 'ability',
    fn: (s) => {
      s.magnet = true;
    },
  },
  {
    id: 'double',
    name: 'DOUBLE OR NOTHING',
    desc: 'Every goal scores 2 points instead of 1',
    tier: 'epic',
    type: 'ability',
    fn: (s) => {
      s.dblScore = true;
    },
  },
  {
    id: 'vampire',
    name: 'VAMPIRE',
    desc: 'Heal 1 life every time you score a goal',
    tier: 'epic',
    type: 'ability',
    fn: (s) => {
      s.vampire = true;
    },
  },
  {
    id: 'afterimg',
    name: 'AFTERIMAGE',
    desc: 'A delayed ghost ball follows and scores separately',
    tier: 'epic',
    type: 'ability',
    fn: (s) => {
      s.afterimage = true;
    },
  },
  {
    id: 'shockwave',
    name: 'TREMOR',
    desc: 'Every hit pushes enemy paddle away from the ball',
    tier: 'epic',
    type: 'ability',
    fn: (s) => {
      s.shockwave = true;
    },
  },
  {
    id: 'gravity2',
    name: 'DEAD ZONE',
    desc: 'Ball constantly drifts toward the enemy goal',
    tier: 'epic',
    type: 'ability',
    fn: (s) => {
      s.singularity = true;
    },
  },
  // LEGENDARY
  {
    id: 'homing',
    name: 'HUNTER BALL',
    desc: 'Ball curves toward gaps in enemy defense',
    tier: 'legendary',
    type: 'ability',
    fn: (s) => {
      s.homing = true;
    },
  },
  {
    id: 'timewarp',
    name: 'TIME WARP',
    desc: 'Ball slows down near enemy, speeds up near you',
    tier: 'legendary',
    type: 'ability',
    fn: (s) => {
      s.timewarp = true;
    },
  },
  {
    id: 'multicast',
    name: 'ECHO CAST',
    desc: 'Your paddle ability triggers twice per use',
    tier: 'legendary',
    type: 'ability',
    fn: (s) => {
      s.multicast = true;
    },
  },
  {
    id: 'unstop',
    name: 'JUGGERNAUT',
    desc: '+3 lives, +30% paddle, +30% speed, +15% ball',
    tier: 'legendary',
    type: 'stat',
    fn: (s) => {
      s.lives += 3;
      s.ph *= 1.3;
      s.pSpd *= 1.3;
      s.bs *= 1.15;
    },
  },
  {
    id: 'sec_mirror',
    name: 'MIRROR MATCH',
    desc: 'Enemy copies YOUR position with a 0.4s delay. Fake them out.',
    tier: 'legendary',
    type: 'ability',
    fn: (s) => {
      s.mirrorMatch = true;
    },
  },
  // MYTHICAL (game-changing)
  {
    id: 'godmode',
    name: 'TRANSCENDENCE',
    desc: 'Ball phases through enemy paddle. Every hit scores.',
    tier: 'mythical',
    type: 'ability',
    fn: (s) => {
      s.transcend = true;
    },
  },
  {
    id: 'clone',
    name: 'DOPPELGANGER',
    desc: 'A phantom paddle mirrors you on the right side',
    tier: 'mythical',
    type: 'ability',
    fn: (s) => {
      s.doppel = true;
    },
  },
  {
    id: 'immortal',
    name: 'UNDYING',
    desc: '+5 lives, auto-block first miss each wave',
    tier: 'mythical',
    type: 'stat',
    fn: (s) => {
      s.lives += 5;
      s.shields += 1;
    },
  },
  {
    id: 'warpspd',
    name: 'LIGHTSPEED',
    desc: 'Ball +50%, paddle +80%, cooldown -50%',
    tier: 'mythical',
    type: 'stat',
    fn: (s) => {
      s.bs *= 1.5;
      s.pSpd *= 1.8;
      s.cdMul *= 0.5;
    },
  },
  {
    id: 'sec_berserk',
    name: 'BERSERKER',
    desc: 'Each consecutive hit = +8% ball speed. Resets when enemy scores.',
    tier: 'mythical',
    type: 'ability',
    fn: (s) => {
      s.berserker = true;
    },
  },
  // SECRET (combat abilities)
  {
    id: 'sec_storm',
    name: 'STORM CALLER',
    desc: 'Every hit fires a stun bolt that freezes enemy paddle.',
    tier: 'secret',
    type: 'ability',
    fn: (s) => {
      s.stormCaller = true;
    },
  },
  {
    id: 'sec_phantom',
    name: 'PHANTOM STRIKE',
    desc: 'Ball teleports 20% closer to the goal on every hit.',
    tier: 'secret',
    type: 'ability',
    fn: (s) => {
      s.phantomStrike = true;
    },
  },
  {
    id: 'sec_over',
    name: 'OVERCHARGE',
    desc: 'Every 3rd consecutive hit, ball pierces through enemy paddle.',
    tier: 'secret',
    type: 'ability',
    fn: (s) => {
      s.overcharge = true;
    },
  },
  {
    id: 'sec_abs',
    name: 'THE ABSOLUTE',
    desc: 'Every secret ability combined. All stats boosted.',
    tier: 'secret',
    type: 'ability',
    fn: (s) => {
      s.stormCaller = true;
      s.phantomStrike = true;
      s.berserker = true;
      s.overcharge = true;
      s.transcend = false;
      s.doppel = true;
      s.homing = true;
      s.multicast = true;
      s.magnet = true;
      s.dblScore = true;
      s.vampire = true;
      s.freeze = true;
      s.shockwave = true;
      s.edge = true;
      s.rico = true;
      s.lives += 5;
      s.pSpd *= 1.5;
      s.bs *= 1.1;
      s.cdMul *= 0.3;
      s.shields += 3;
    },
  },
  {
    id: 'sec_master',
    name: 'MASTER OF SKILL',
    desc:
      'Strip ALL abilities. Ball 50% faster. Your hits TRIPLE speed. Enemy hits reset. Every rally = permanent +20% base speed.',
    tier: 'mythical',
    type: 'ability',
    fn: (s) => {
      s.masterSkill = true;
      s.bs *= 1.5;
      s.freeze = false;
      s.afterimage = false;
      s.shockwave = false;
      s.homing = false;
      s.timewarp = false;
      s.multicast = false;
      s.transcend = false;
      s.doppel = false;
      s.singularity = false;
      s.magnet = false;
      s.dblScore = false;
      s.vampire = false;
      s.echoHit = false;
      s.voidWalk = false;
      s.stormCaller = false;
      s.phantomStrike = false;
      s.berserker = false;
      s.overcharge = false;
      s.cdMul = 999;
    },
  },
];

export function getCardsForTier(maxTier, count) {
  const tierIdx = TIER_ORDER.indexOf(maxTier);
  const pool = ALL_CARDS.filter((c) => TIER_ORDER.indexOf(c.tier) <= tierIdx);
  const weighted = [];
  for (const c of pool) {
    const ci = TIER_ORDER.indexOf(c.tier);
    const w = ci >= tierIdx ? 3 : ci >= tierIdx - 1 ? 2 : 1;
    for (let i = 0; i < w; i++) weighted.push(c);
  }
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);
  const seen = new Set();
  const result = [];
  for (const c of shuffled) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      result.push(c);
      if (result.length >= count) break;
    }
  }
  if (result.length < count) {
    for (const c of pool.sort(() => Math.random() - 0.5)) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        result.push(c);
        if (result.length >= count) break;
      }
    }
  }
  return result;
}

export function getCardsForDiff(diff, count) {
  const tiers = DIFF_TIERS[diff] || ['common'];
  const pool = ALL_CARDS.filter((c) => tiers.includes(c.tier));
  const weighted = [];
  const maxIdx = Math.max(...tiers.map((t) => TIER_ORDER.indexOf(t)));
  for (const c of pool) {
    const ci = TIER_ORDER.indexOf(c.tier);
    const w = ci >= maxIdx ? 4 : ci >= maxIdx - 1 ? 2 : 1;
    for (let i = 0; i < w; i++) weighted.push(c);
  }
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);
  const seen = new Set();
  const result = [];
  for (const c of shuffled) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      result.push(c);
      if (result.length >= count) break;
    }
  }
  if (result.length < count) {
    for (const c of pool.sort(() => Math.random() - 0.5)) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        result.push(c);
        if (result.length >= count) break;
      }
    }
  }
  return result;
}
