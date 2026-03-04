// ═══ INPUT HANDLING ═══
import { state } from './state.js';

// Focus key state - triggered by shift or space for precision movement
export function isFocusActive() {
  return state.keysDown['shift'] || state.keysDown[' '];
}

export function setupInputHandlers(doAbility, handleContinue) {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    state.keysDown[k] = true;

    // Prevent default for game controls
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }

    // Ability trigger
    if (k === 'q') doAbility();

    // Continue/advance
    if (e.key === 'Enter') handleContinue();
  });

  window.addEventListener('keyup', (e) => {
    state.keysDown[e.key.toLowerCase()] = false;
  });
}

export function isKeyDown(key) {
  return state.keysDown[key] || false;
}

// Movement helpers with focus support
export function isMovingUp() {
  return state.keysDown['w'] || state.keysDown['arrowup'];
}

export function isMovingDown() {
  return state.keysDown['s'] || state.keysDown['arrowdown'];
}

export function isMovingLeft() {
  return state.keysDown['a'] || state.keysDown['arrowleft'];
}

export function isMovingRight() {
  return state.keysDown['d'] || state.keysDown['arrowright'];
}
