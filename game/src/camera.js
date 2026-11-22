// camera.js — the security cameras: a slow, readable sweep.
// Each camera swings its cone back and forth across its arc. The sweep is
// steady and telegraphed, so the player can time the crossing — the tension
// is in the timing, not in a surprise. An EMP freezes them dark.

import { CAMERA } from './config.js';
import { sightBlocked } from './level.js';

export function createCamera(spec) {
  return {
    name: spec.name,
    x: spec.x, y: spec.y,
    baseAngle: spec.baseAngle,
    angle: spec.baseAngle,
    phase: Math.random() * Math.PI * 2,
    disabledUntil: 0,
  };
}

export function updateCamera(camera, dt, now) {
  if (now < camera.disabledUntil) return; // EMP: frozen, cone off
  camera.phase += dt * CAMERA.sweepSpeed;
  camera.angle = camera.baseAngle + Math.sin(camera.phase) * CAMERA.sweepArc;
}

export function cameraSeesThief(camera, thief, walls, now) {
  if (now < camera.disabledUntil) return false;
  const dx = thief.x - camera.x, dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.range) return false;
  const toThief = Math.atan2(dy, dx);
  let diff = toThief - camera.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > CAMERA.coneHalfAngle) return false;
  if (sightBlocked(camera.x, camera.y, thief.x, thief.y, walls)) return false;
  return true;
}

export function disableCamera(camera, until) {
  camera.disabledUntil = Math.max(camera.disabledUntil, until);
}
