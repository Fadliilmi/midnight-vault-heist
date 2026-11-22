// thief.js — the thief: movement, tools, and the loot in her pocket.
// "Vesper" slips in through the service door, lifts the gold, and leaves
// through the east fire exit. She carries three tools, each with a cost:
// a noise-maker that pulls a guard away, an EMP that blinds the cameras,
// and a disguise that lets her walk past a guard — slowly, and only once.

import { THIEF, TOOLS } from './config.js';
import { blockedAt } from './level.js';

export function createThief(x, y) {
  return {
    name: 'Vesper',
    x, y,
    radius: THIEF.radius,
    facing: -Math.PI / 2,
    sneaking: false,
    hasLoot: false,
    tools: {
      noiseMaker: TOOLS.noiseMaker.uses,
      emp: TOOLS.emp.uses,
      disguise: TOOLS.disguise.uses,
    },
    empUntil: 0,
    disguiseUntil: 0,
    noisePulse: null, // {x, y, until} — a thrown noise-maker still ringing
    caughtFlash: 0,
  };
}

// Move with WASD/arrows; Shift sneaks. Returns nothing; walls stop the thief.
export function moveThief(thief, keys, dt, walls, now) {
  let dx = 0, dy = 0;
  if (keys['arrowup'] || keys['w']) dy -= 1;
  if (keys['arrowdown'] || keys['s']) dy += 1;
  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  thief.sneaking = !!keys['shift'];
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  const speed = thief.sneaking ? THIEF.sneakSpeed : THIEF.speed;
  thief.facing = Math.atan2(dy / len, dx / len);
  // Walk in small substeps so the thief slides right up to a wall instead
  // of stopping dead a full stride away from it (and never tunnels through).
  const step = speed * dt;
  const substeps = Math.max(1, Math.ceil(step / 4));
  const sx = ((dx / len) * step) / substeps;
  const sy = ((dy / len) * step) / substeps;
  for (let i = 0; i < substeps; i++) {
    const nx = thief.x + sx;
    const ny = thief.y + sy;
    // Slide along walls: try each axis on its own.
    if (!blockedAt(nx, thief.y, thief.radius, walls)) thief.x = nx;
    if (!blockedAt(thief.x, ny, thief.radius, walls)) thief.y = ny;
  }
}

// Throw the noise-maker at the mouse position: the nearest guard walks to it.
export function useNoiseMaker(thief, mx, my, now) {
  if (thief.tools.noiseMaker <= 0) return false;
  thief.tools.noiseMaker -= 1;
  thief.noisePulse = { x: mx, y: my, until: now + 2.5 };
  return true;
}

// Fire the EMP: every camera goes dark for a few seconds.
export function useEmp(thief, now) {
  if (thief.tools.emp <= 0) return false;
  thief.tools.emp -= 1;
  thief.empUntil = now + TOOLS.emp.seconds;
  return true;
}

// Put on the disguise: guards ignore the thief unless she sprints or
// walks right up to one — but she can only stroll while wearing it.
export function useDisguise(thief, now) {
  if (thief.tools.disguise <= 0) return false;
  thief.tools.disguise -= 1;
  thief.disguiseUntil = now + TOOLS.disguise.seconds;
  return true;
}

export function empActive(thief, now) { return now < thief.empUntil; }
export function disguiseActive(thief, now) { return now < thief.disguiseUntil; }
