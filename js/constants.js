// ═══ CONSTANTS ═══
export const GW = 800;
export const GH = 500;
export const BALL_SZ = 10;
export const PAD_W = 12;
export const BASE_PAD_H = 72;
export const PX_HOME = 40;
export const EX = GW - 40;
export const HORIZ = 50;
export const PTS_WIN = 5;
export const MAX_WAVE = 12;
export const TRAIL = 16;
export const BASE_SPD = 340;
export const FOCUS_SPEED_MULT = 0.4; // Focus mode slows movement to 40%

// ═══ UTILITY FUNCTIONS ═══
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rng = (a, b) => a + Math.random() * (b - a);
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const $ = (id) => document.getElementById(id);

export function simBallY(bx, by, vx, vy, tx) {
  if (vx <= 0) return by;
  let px = bx,
    py = by,
    pvx = vx,
    pvy = vy;
  for (let i = 0; i < 500; i++) {
    px += pvx * 0.008;
    py += pvy * 0.008;
    if (py < 5) {
      py = 5;
      pvy = Math.abs(pvy);
    }
    if (py > GH - 5) {
      py = GH - 5;
      pvy = -Math.abs(pvy);
    }
    if (px >= tx) return py;
  }
  return py;
}

// ═══ DIFFICULTY RATINGS ═══
export const DIFF_RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
export const DIFF_COLORS = {
  F: '#446644',
  E: '#558855',
  D: '#669966',
  C: '#88aa88',
  B: '#66aaff',
  A: '#5588ff',
  S: '#ffaa44',
  SS: '#ff6644',
  SSS: '#ff44ff',
};
export const DIFF_GLOW = {
  F: '68,102,68',
  E: '85,136,85',
  D: '102,153,102',
  C: '136,170,136',
  B: '102,170,255',
  A: '85,136,255',
  S: '255,170,68',
  SS: '255,102,68',
  SSS: '255,68,255',
};
export const DIFF_REWARD = {
  F: 'common',
  E: 'common',
  D: 'uncommon',
  C: 'uncommon',
  B: 'rare',
  A: 'rare',
  S: 'epic',
  SS: 'legendary',
  SSS: 'secret',
};
export const DIFF_TIERS = {
  F: ['common'],
  E: ['common', 'uncommon'],
  D: ['common', 'uncommon'],
  C: ['common', 'uncommon', 'rare'],
  B: ['uncommon', 'rare'],
  A: ['uncommon', 'rare', 'epic'],
  S: ['rare', 'epic', 'legendary'],
  SS: ['epic', 'legendary', 'mythical'],
  SSS: ['legendary', 'mythical', 'secret'],
};

// ═══ TIER SYSTEM ═══
export const TIER_NAMES = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
  mythical: 'MYTHICAL',
  secret: 'SECRET',
};
export const TIER_COLORS = {
  common: '#667788',
  uncommon: '#55aa77',
  rare: '#5588ff',
  epic: '#ffaa44',
  legendary: '#ff5555',
  mythical: '#ff44ff',
  secret: '#00ffcc',
};
export const TIER_GLOW = {
  common: '102,119,136',
  uncommon: '85,170,119',
  rare: '85,136,255',
  epic: '255,170,68',
  legendary: '255,85,85',
  mythical: '255,68,255',
  secret: '0,255,204',
};
export const TIER_ICON = {
  common: '\u25C7',
  uncommon: '\u25C8',
  rare: '\u2605',
  epic: '\u2726',
  legendary: '\u2742',
  mythical: '\u2748',
  secret: '\u2756',
};
export const TIER_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'secret'];

// ═══ COLOR PALETTES ═══
export const PCOL = {
  classic: { p: '#ffffff', g: 'rgba(255,255,255,', t: [1, 1, 1] },
  oracle: { p: '#44ddff', g: 'rgba(68,221,255,', t: [0.27, 0.87, 1] },
  inferno: { p: '#cc88ff', g: 'rgba(204,136,255,', t: [0.8, 0.53, 1] },
  frost: { p: '#88ccff', g: 'rgba(136,204,255,', t: [0.53, 0.8, 1] },
  storm: { p: '#ffee44', g: 'rgba(255,238,68,', t: [1, 0.93, 0.27] },
  voidp: { p: '#ff44aa', g: 'rgba(255,68,170,', t: [1, 0.27, 0.67] },
};
