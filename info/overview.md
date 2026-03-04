# Project Overview — PONG ROGUE

## What Is This

A **roguelite pong game** — single-player pong with RPG progression. The player picks a paddle class, fights through 12 waves of increasingly difficult AI opponents, and collects upgrades between rounds. Built as a single-page web app with no frameworks.

## Tech Stack

- **ES Modules** — modular JavaScript in `js/` folder
- **Single HTML page** — [`index.html`](index.html)
- **CSS** — [`styles.css`](styles.css) for menu/card UI, CRT scanline overlay
- **Canvas 2D** — all gameplay rendering via `<canvas id="cv">`
- **Web Audio API** — procedural sound effects (no audio files)
- **Biome** — configured for linting/formatting (tabs, double quotes)
- **No build step** — serve via any HTTP server (ES modules require server)

## File Structure

| File/Folder | Purpose |
|-------------|---------|
| `index.html` | Entry point. Contains all screen layouts (menu, cards, opponent select, game over, victory, dev mode) |
| `js/` | ES modules containing all game logic |
| `js/main.js` | Entry module: screen management, UI builders, game loop, initialization |
| `js/audio.js` | Web Audio oscillator-based SFX |
| `js/constants.js` | Game dimensions, physics values, utilities, difficulty/tier data |
| `js/entities.js` | Paddles, enemies, enemy abilities, enemy upgrades |
| `js/upgrades.js` | All upgrade cards, card selection logic |
| `js/state.js` | Game state management, `newGame()` factory, save/load |
| `js/input.js` | Input handling, focus mode detection |
| `js/game.js` | Update loop: physics, collision, AI, ability execution |
| `styles.css` | Dark CRT aesthetic. Paddle cards, upgrade cards, opponent cards, buttons, screen transitions |
| `script.js` | **Legacy** - original monolithic version (kept for reference) |
| `package.json` | Only dependency: `@biomejs/biome` for formatting/linting |
| `biome.json` | Biome config: tabs, double quotes, recommended rules |

## Architecture Pattern

The codebase uses **ES modules** with clear separation of concerns:

1. **audio.js** — Web Audio oscillator-based SFX (tone generator, SFX object)
2. **constants.js** — Game dimensions, physics values, utilities, tier/difficulty data
3. **entities.js** — Paddle definitions, enemy definitions, enemy abilities
4. **upgrades.js** — Upgrade card pool, card selection algorithms
5. **state.js** — Global state object, wave config, newGame() factory, save/load
6. **input.js** — Keyboard handlers, focus mode (Shift/Space for precision)
7. **game.js** — Update loop: physics, collision, AI, ability execution
8. **main.js** — Screen management, UI builders, game loop, initialization

## Key Global State

All mutable game state is stored in the `state` object exported from `js/state.js`:

| Property | Type | Purpose |
|----------|------|---------|
| `state.g` | Object \| null | The active game state. `null` when on a menu screen. |
| `state.curScreen` | string \| null | Current visible screen ID, or `null` when gameplay is active |
| `state.padId` | string | Selected paddle class ID |
| `state.wave` | number | Current wave (1–12) |
| `state.savedState` | Object \| null | Persistent player stats/abilities carried between waves |
| `state.enemyUps` | Array | Accumulated enemy upgrades across waves |
| `state.keysDown` | Object | Currently pressed keys |
| `state.chosenOppCfg` | Object \| null | The opponent config chosen from the selection screen |

## Known Issues / Quirks

- Legacy `script.js` is kept for reference but not used
- No error boundaries — a crash in update/draw would halt the game loop
