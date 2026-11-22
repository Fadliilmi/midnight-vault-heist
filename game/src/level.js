// level.js — the vault hall: one room, three ways across it.
// Walls are cover: they block movement and block every line of sight.
// Routes: the west corridor (past Rook), the desk maze in the middle,
// and the east gallery under the cameras (past Bishop, straight to the vault).

export const LEVEL = {
  name: 'The Meridian Vault — Hall of Gold',
  entry: { x: 62, y: 538 },
  exit: { x: 898, y: 538, w: 56, h: 34 },
  loot: { x: 858, y: 168, radius: 20, value: 50000 },
  vault: { x: 792, y: 42, w: 130, h: 96 },
  // cover blocks: desks, pillars, a counter and the vault itself
  walls: [
    { x: 250, y: 150, w: 130, h: 46, kind: 'desk' },
    { x: 250, y: 360, w: 130, h: 46, kind: 'desk' },
    { x: 520, y: 250, w: 130, h: 46, kind: 'desk' },
    { x: 520, y: 430, w: 130, h: 46, kind: 'desk' },
    { x: 452, y: 118, w: 42, h: 42, kind: 'pillar' },
    { x: 452, y: 448, w: 42, h: 42, kind: 'pillar' },
    { x: 120, y: 236, w: 92, h: 26, kind: 'counter' },
    { x: 660, y: 300, w: 26, h: 92, kind: 'counter' },
    { x: 792, y: 42, w: 130, h: 96, kind: 'vault' },
  ],
  guards: [
    {
      name: 'Rook',
      waypoints: [
        { x: 180, y: 130 }, { x: 180, y: 470 },
        { x: 380, y: 470 }, { x: 380, y: 130 },
      ],
    },
    {
      name: 'Bishop',
      waypoints: [
        { x: 610, y: 130 }, { x: 610, y: 470 },
        { x: 740, y: 470 }, { x: 740, y: 130 },
      ],
    },
  ],
  cameras: [
    { name: 'CAM-1', x: 480, y: 22, baseAngle: Math.PI / 2 },   // top wall, looks down
    { name: 'CAM-2', x: 938, y: 300, baseAngle: Math.PI },      // east wall, looks left
  ],
};

// Circle (thief / guard) against a rectangle: true when they overlap.
export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// True when the thief at (x, y) would collide with a wall or the room edge.
export function blockedAt(x, y, r, walls) {
  if (x < 18 + r || x > 960 - 18 - r || y < 18 + r || y > 600 - 18 - r) return true;
  for (const w of walls) if (circleHitsRect(x, y, r, w)) return true;
  return false;
}

// Segment vs rectangle test, used for line of sight.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab method: walk the segment through the rect's x/y slabs.
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, x1 - rect.x], [dx, rect.x + rect.w - x1],
                        [-dy, y1 - rect.y], [dy, rect.y + rect.h - y1]]) {
    if (p === 0) { if (q < 0) return false; }
    else {
      const t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}

// True when a wall stands between the watcher and the thief.
export function sightBlocked(x1, y1, x2, y2, walls) {
  for (const w of walls) if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
  return false;
}
