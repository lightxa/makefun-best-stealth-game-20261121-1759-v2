// main.js — one job: run Tideglass Harbor.
// Owns the game state, the input, the frame loop and the win/lose
// rules. Everything else lives in its own file: levels describe the
// dock, vision decides sight, guards patrol and suspect, the player
// moves and makes noise, render draws, audio sings.

import { WORLD_W, WORLD_H } from './levels.js';
import { createGuards, updateGuards, maxSuspicion } from './guards.js';
import { createPlayer, updatePlayer, collectManifests, playerOnBoat } from './player.js';
import { coneProximity } from './vision.js';
import { drawWorld, drawHud, drawScreen } from './render.js';
import { initAudio, startAmbience, playFootstep, playPickup, playNearMiss, playAlarm, playWin } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = new Set();

const state = {
  phase: 'start', // start | playing | win | lose
  player: createPlayer(),
  guards: createGuards(),
  alarm: false,
  alarmTimer: 0,
  nearMiss: false,
  nearMissNotified: false,
  maxSuspicion: 0,
  elapsed: 0,
  winTime: 0,
  lastStep: 0,
};

function resetGame() {
  state.player = createPlayer();
  state.guards = createGuards();
  state.alarm = false;
  state.alarmTimer = 0;
  state.nearMiss = false;
  state.nearMissNotified = false;
  state.maxSuspicion = 0;
  state.elapsed = 0;
  state.winTime = 0;
  state.phase = 'playing';
}

function startGame() {
  initAudio();
  startAmbience();
  resetGame();
}

function tick(dt) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;

  const moved = updatePlayer(state.player, keys, dt);
  if (moved) {
    const stepNow = Math.floor(state.player.stepPhase);
    if (stepNow !== state.lastStep) {
      state.lastStep = stepNow;
      playFootstep(state.player.sneaking);
    }
  }

  const event = updateGuards(state.guards, state.player, dt, state.alarm);
  if (event === 'alarm' && !state.alarm) {
    state.alarm = true;
    state.alarmTimer = 8;
    playAlarm();
  }
  if (event === 'caught') {
    state.phase = 'lose';
    return;
  }

  if (state.alarm) {
    state.alarmTimer -= dt;
    const allRelaxed = state.guards.every((g) => g.state === 'patrol' || g.state === 'return');
    if (state.alarmTimer <= 0 && allRelaxed) state.alarm = false;
  }

  state.maxSuspicion = maxSuspicion(state.guards);
  state.nearMiss =
    !state.player.hiddenInFog &&
    state.guards.some((g) => coneProximity(g, state.player) > 0.55 && g.suspicion < 100);
  if (state.nearMiss && !state.nearMissNotified && state.maxSuspicion > 25) {
    state.nearMissNotified = true;
    playNearMiss();
  }
  if (state.maxSuspicion < 10) state.nearMissNotified = false;

  const picked = collectManifests(state.player);
  if (picked) playPickup();

  if (playerOnBoat(state.player)) {
    state.phase = 'win';
    state.winTime = Math.round(state.elapsed);
    playWin();
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last ?? now)) / 1000);
  frame.last = now;
  tick(dt);
  drawWorld(ctx, state, now / 1000);
  if (state.phase !== 'start') drawHud(ctx, state);
  if (state.phase !== 'playing') drawScreen(ctx, state);
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
  if (key === 'enter' && state.phase === 'start') {
    startGame();
    return;
  }
  if (key === 'r' && (state.phase === 'win' || state.phase === 'lose')) {
    startGame();
    return;
  }
  keys.add(key);
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener('click', () => {
  if (state.phase === 'start') startGame();
});
window.addEventListener('blur', () => keys.clear());

// A small staging hook for screenshots and play-tests: lets a test
// harness start the game and place the player and guards without
// touching the real controls.
window.__tideglass = {
  state,
  start: startGame,
  reset: resetGame,
  teleportPlayer(x, y) {
    state.player.x = x;
    state.player.y = y;
  },
  placeGuard(i, x, y, facing) {
    const g = state.guards[i];
    g.x = x;
    g.y = y;
    g.facing = facing;
    g.facingLocked = true;
    g.pauseLeft = 999;
  },
  setSuspicion(i, value) {
    state.guards[i].suspicion = value;
  },
};

requestAnimationFrame(frame);
