// main.js — the game loop and the state machine.
// Phases: title → playing → paused → won / lost. The thief enters at the
// service door, lifts the loot from the vault, and leaves through the east
// fire exit. The alarm is the clock: at 100% the vault locks down.

import { VIEW } from './config.js';
import { LEVEL } from './level.js';
import { createThief, moveThief, useNoiseMaker, useEmp, useDisguise, empActive } from './thief.js';
import { createGuard, updateGuard, lureGuard, guardSeesThief } from './guard.js';
import { createCamera, updateCamera, cameraSeesThief, disableCamera } from './camera.js';
import { createAlarm, updateAlarm, getawayScore } from './alarm.js';
import { createInput } from './input.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';
import * as audio from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function newGame() {
  return {
    phase: 'title',
    now: 0,
    elapsed: 0,
    timeLeft: 300,
    thief: createThief(LEVEL.entry.x, LEVEL.entry.y),
    guards: LEVEL.guards.map(createGuard),
    cameras: LEVEL.cameras.map(createCamera),
    alarm: createAlarm(),
    alarmPeak: 0,
    score: 0,
    message: '',
    blipAt: 0,
  };
}

let state = newGame();
const input = createInput(canvas);
const staged = applyShot(state, new URLSearchParams(window.location.search));

function resetToTitle() {
  state = newGame();
  applyShot(state, new URLSearchParams(window.location.search));
}

function startPlaying() {
  if (state.phase !== 'title') return;
  state.phase = 'playing';
  audio.ensureAudio();
  audio.playClick();
}

function checkLootAndExit() {
  const t = state.thief;
  if (!t.hasLoot) {
    const d = Math.hypot(t.x - LEVEL.loot.x, t.y - LEVEL.loot.y);
    if (d < LEVEL.loot.radius + t.radius + 6) {
      t.hasLoot = true;
      audio.playLoot();
    }
  }
  if (t.hasLoot) {
    const e = LEVEL.exit;
    if (t.x > e.x - 6 && t.x < e.x + e.w + 6 && t.y > e.y - 6 && t.y < e.y + e.h + 6) {
      state.phase = 'won';
      state.score = getawayScore(true, state.alarm.value, state.elapsed);
      audio.playGetaway();
    }
  }
}

function handleToolKeys() {
  const t = state.thief;
  if (input.wasPressed('1')) {
    input.consume('1');
    if (useNoiseMaker(t, input.mouse.x, input.mouse.y, state.now)) {
      audio.playNoiseMaker();
      // The nearest calm guard walks over to listen.
      let best = null, bestDist = Infinity;
      for (const g of state.guards) {
        const d = Math.hypot(g.x - input.mouse.x, g.y - input.mouse.y);
        if (d < bestDist) { bestDist = d; best = g; }
      }
      if (best) lureGuard(best, input.mouse.x, input.mouse.y);
    }
  }
  if (input.wasPressed('2')) {
    input.consume('2');
    if (useEmp(t, state.now)) {
      audio.playEmp();
      for (const c of state.cameras) disableCamera(c, state.now + 6);
    }
  }
  if (input.wasPressed('3')) {
    input.consume('3');
    if (useDisguise(t, state.now)) audio.playClick();
  }
}

let last = performance.now();

function frame(nowMs) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;

  if (input.wasPressed('r')) { input.consume('r'); resetToTitle(); }
  if (input.wasPressed('m')) { input.consume('m'); audio.toggleMute(); }

  if (state.phase === 'title') {
    if (input.wasPressed('enter') || input.wasPressed(' ') || input.consumeClick()) {
      input.consume('enter'); input.consume(' ');
      startPlaying();
    }
    // The staged title still shows the room breathing behind it.
    state.now += dt;
    for (const c of state.cameras) updateCamera(c, dt, state.now);
  } else if (state.phase === 'playing') {
    if (input.wasPressed('p')) { input.consume('p'); state.phase = 'paused'; }
    state.now += dt;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, 300 - state.elapsed);
    handleToolKeys();
    moveThief(state.thief, input.keys, dt, LEVEL.walls, state.now);

    let seen = false;
    const disguised = state.thief.disguiseUntil > state.now;
    for (const g of state.guards) {
      if (updateGuard(g, state.thief, LEVEL.walls, dt, state.now, disguised)) seen = true;
    }
    for (const c of state.cameras) {
      updateCamera(c, dt, state.now);
      if (cameraSeesThief(c, state.thief, LEVEL.walls, state.now)) seen = true;
    }
    const wasSpotted = state.alarm.spotted;
    updateAlarm(state.alarm, seen, dt, state.now);
    state.alarmPeak = Math.max(state.alarmPeak, state.alarm.value);
    if (seen && !wasSpotted) audio.playSpotted();
    if (state.alarm.value >= 60 && state.now - state.blipAt > 1) {
      state.blipAt = state.now;
      audio.playAlarmBlip();
    }
    audio.alarmHeartbeat(state.alarm.value);
    checkLootAndExit();
    if (state.alarm.busted) {
      state.phase = 'lost';
      audio.playCaught();
    }
    if (state.timeLeft <= 0 && state.phase === 'playing') {
      state.phase = 'lost';
      audio.playCaught();
    }
  } else if (state.phase === 'paused') {
    if (input.wasPressed('p')) { input.consume('p'); state.phase = 'playing'; }
  }

  drawGame(ctx, state);
}

requestAnimationFrame(frame);
