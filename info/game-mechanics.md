# Game Mechanics — PONG ROGUE

## Game Dimensions & Constants

Defined at [`script.js:7-8`](script.js:7):

| Constant | Value | Purpose |
|----------|-------|---------|
| `GW` | 800 | Game world width (logical pixels) |
| `GH` | 500 | Game world height (logical pixels) |
| `BALL_SZ` | 10 | Ball size (square, rendered as rect) |
| `PAD_W` | 12 | Paddle width (both player and enemy) |
| `BASE_PAD_H` | 72 | Default paddle height before modifiers |
| `PX_HOME` | 40 | Player paddle default X position |
| `EX` | 760 (`GW-40`) | Enemy paddle X position |
| `HORIZ` | 50 | Base horizontal movement range for player |
| `PTS_WIN` | 5 | Points to win a round |
| `MAX_WAVE` | 12 | Total waves to beat the game |
| `TRAIL` | 16 | Max ball trail points |
| `BASE_SPD` | 340 | Default ball speed |
| `FOCUS_SPEED_MULT` | 0.4 | Focus mode slows movement to 40% |

## Coordinate System

- Origin `(0,0)` is top-left
- Player is on the **left** (X ≈ 40)
- Enemy is on the **right** (X ≈ 760)
- Ball travels horizontally between paddles
- Canvas scales to fill the viewport via `sx = canvasWidth / GW`, `sy = canvasHeight / GH`

## Ball Physics

### Movement
- Ball position: `g.bx`, `g.by`
- Ball velocity: `g.bvx`, `g.bvy`
- Updated each frame: `g.bx += g.bvx * dt * twMul` (twMul = time warp modifier)
- Wall bounce: reflects Y velocity on top/bottom edges
- Speed normalizes toward `g.ballSpd` each frame via [`lerp`](script.js:409)

### Rally Acceleration
- Each hit increments `g.rallyHits`
- Ball speed scales: `g.ballSpd = g.rallyBase * 1.05^rallyHits`
- Resets on scoring via [`resetBall()`](script.js:212)

### Player Paddle Hit (lines 411–496)
- Flat wall reflection: `g.bvx = Math.abs(g.bvx)` (always bounces right)
- **Paddle velocity transfer**: `g.bvy += clamp(g.pVelY * 0.45, ...)` — the paddle's movement speed influences the ball's vertical direction
- Ball angle is NOT determined by hit position on paddle (unlike classic pong) — it's determined by paddle velocity
- Speed normalized to target after hit
- `bvy` clamped so ball never goes near-vertical: `maxVy = speed * 0.92`

### Enemy Paddle Hit (lines 501–521)
- Uses hit-position-based angle (classic pong style): `rel = (ballY - paddleY) / (paddleH / 2)`
- Angle range: 0.35 normally, 0.45 with `trickAng`
- If ball has `_pierce` flag, it passes through

### Scoring
- Ball exits left (`bx < 0`): enemy scores (line 564)
  - Shield can auto-block first miss
  - Berserker stacks reset
  - If enemy reaches `PTS_WIN`: game over, player loses a life
- Ball exits right (`bx > GW`): player scores (line 570)
  - Double/triple score modifiers apply
  - Vampire heals 1 life
  - Siphon degrades enemy AI

## Player Movement

Defined in update loop at [`script.js:370-382`](script.js:370):

- **Vertical**: W/S or Arrow Up/Down at speed `g.pSpd` (default 420)
- **Horizontal**: A/D or Arrow Left/Right at `pSpd * 0.55`
- Horizontal auto-returns to `PX_HOME` when no keys pressed (lerp at `dt * 4`)
- Horizontal range: `PX_HOME ± (HORIZ * horizMul)`
- Paddle velocity tracked: `g.pVelY = (g.py - g.prevPy) / dt`

## AI System

Defined at [`script.js:574-610`](script.js:574):

### Key AI Parameters
| Parameter | Purpose |
|-----------|---------|
| `g.aiSpd` | Movement speed in pixels/second |
| `g.aiReact` | 0–1 value. Higher = better prediction accuracy |
| `g.aiTgt` | Cached target Y position |
| `g.aiTgtTimer` | Recomputes target every ~120–180ms |
| `g.aiRandOff` | Random offset based on `(1 - aiReact)` |

### AI Behavior
1. When ball approaches (`bvx > 0`): predicts landing via [`simBallY()`](script.js:13), blends between current ball Y and predicted Y based on `aiReact`
2. When ball going away (`bvx < 0`): drifts toward center
3. When ghost ball active: waves back and forth (can't track invisible ball)
4. Dead zone of 2px prevents micro-jitter near target
5. Mirror Match override: copies player Y with 0.4s delay

### Jitter Enemy Modifier
- Adds `sin(t * 18) * 2.5` oscillation to enemy Y position

## Wave Configuration

[`waveCfg()`](script.js:194) generates stats for a wave:

- `rankIdx = floor(wave / 1.5)` — maps wave number to difficulty rank
- Boss waves: `wave > 1 && wave % 3 === 0` — every 3rd wave starting from wave 3
- Boss gets +1 rank tier
- Below A rank (idx < 5): slower scaling (`aiSpd = 220 + wave*22`, `aiReact` capped at ~0.4)
- A rank and above (idx ≥ 5): aggressive scaling (`aiSpd = 220 + wave*30`, `aiReact` up to 0.97)

## Lives System

- Start with 3 lives
- Lose a life when enemy wins a round (reaches `PTS_WIN`)
- Lives carry between waves via `savedState`
- Can be increased by upgrades (Extra Life, Iron Will, Undying, Juggernaut, etc.)
- Vampire passive: heal 1 life per goal (capped at 6)
- Game over when lives ≤ 0 after a round loss

## Utility Functions

| Function | Location | Purpose |
|----------|----------|---------|
| [`clamp(v, lo, hi)`](script.js:9) | line 9 | Clamp value to range |
| [`lerp(a, b, t)`](script.js:10) | line 10 | Linear interpolation |
| [`rng(a, b)`](script.js:11) | line 11 | Random float in range |
| [`easeOut(t)`](script.js:12) | line 12 | Cubic ease-out |
| [`simBallY(bx, by, vx, vy, tx)`](script.js:13) | line 13 | Simulate ball Y at target X (for AI prediction) |
