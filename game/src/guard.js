// guard.js — the patrol guards: waypoints, vision cones, and the chase.
// A guard walks his loop, sweeping his torch cone. When he sees the thief
// he shouts, the alarm climbs, and he gives chase; lose him behind cover
// and he walks back to his route, suspicious but calm.

import { GUARD } from './config.js';
import { blockedAt, sightBlocked } from './level.js';

export function createGuard(spec) {
  const start = spec.waypoints[0];
  return {
    name: spec.name,
    waypoints: spec.waypoints,
    wpIndex: 1,
    x: start.x, y: start.y,
    angle: Math.PI / 2,
    radius: GUARD.radius,
    state: 'patrol', // patrol | investigate | chase | return
    target: null,    // {x, y} the guard is walking toward while investigating
    alert: 0,        // 0 calm .. 1 fully alerted
  };
}

// Can this guard see the thief right now? Range, cone angle, line of sight.
export function guardSeesThief(guard, thief, walls, now, disguised) {
  const dx = thief.x - guard.x, dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.coneRange) return false;
  if (disguised && dist > 55) return false; // the disguise holds at a distance
  const toThief = Math.atan2(dy, dx);
  let diff = toThief - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > GUARD.coneHalfAngle) return false;
  if (sightBlocked(guard.x, guard.y, thief.x, thief.y, walls)) return false;
  return true;
}

function stepToward(guard, tx, ty, speed, dt, walls) {
  const dx = tx - guard.x, dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  guard.angle = Math.atan2(dy, dx);
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  if (!blockedAt(nx, guard.y, guard.radius, walls)) guard.x = nx;
  if (!blockedAt(guard.x, ny, guard.radius, walls)) guard.y = ny;
  return dist <= step + 1;
}

export function updateGuard(guard, thief, walls, dt, now, disguised) {
  const sees = guardSeesThief(guard, thief, walls, now, disguised);
  if (sees) {
    guard.state = 'chase';
    guard.alert = 1;
  } else if (guard.state === 'chase') {
    // Lost her: fall back to the patrol, still wary.
    guard.state = 'return';
    guard.alert = 0.6;
  }

  if (guard.state === 'chase') {
    stepToward(guard, thief.x, thief.y, GUARD.chaseSpeed, dt, walls);
  } else if (guard.state === 'investigate' && guard.target) {
    if (stepToward(guard, guard.target.x, guard.target.y, GUARD.speed * 1.3, dt, walls)) {
      guard.state = 'return';
    }
  } else if (guard.state === 'return') {
    // Walk back to the nearest waypoint, then resume the loop.
    let best = 0, bestDist = Infinity;
    guard.waypoints.forEach((wp, i) => {
      const d = Math.hypot(wp.x - guard.x, wp.y - guard.y);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    const wp = guard.waypoints[best];
    if (stepToward(guard, wp.x, wp.y, GUARD.speed, dt, walls)) {
      guard.wpIndex = (best + 1) % guard.waypoints.length;
      guard.state = 'patrol';
      guard.alert = Math.max(0, guard.alert - dt * 0.4);
    }
  } else {
    const wp = guard.waypoints[guard.wpIndex];
    if (stepToward(guard, wp.x, wp.y, GUARD.speed, dt, walls)) {
      guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
    }
    guard.alert = Math.max(0, guard.alert - dt * 0.2);
  }
  return sees;
}

// A noise-maker rings out: the nearest calm guard goes to listen.
export function lureGuard(guard, x, y) {
  if (guard.state === 'chase') return;
  guard.state = 'investigate';
  guard.target = { x, y };
}
