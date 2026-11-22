// config.js — tuning constants for Midnight Vault, the silent-heist game.
// One room, one thief, two guards, two cameras, one vault of gold.

export const VIEW = { w: 960, h: 600 };

export const THIEF = {
  radius: 13,
  speed: 165,          // px per second
  sneakSpeed: 95,      // holding Shift: slower, quieter, harder to spot
  graceSeconds: 1.4,   // fair warning window after first being seen
};

export const GUARD = {
  radius: 14,
  speed: 62,
  coneRange: 190,
  coneHalfAngle: 0.52, // ~60 degree vision cone
  chaseSpeed: 118,
};

export const CAMERA = {
  range: 175,
  coneHalfAngle: 0.42,
  sweepSpeed: 0.55,    // radians per second
  sweepArc: 0.85,      // radians either side of base angle
};

export const ALARM = {
  risePerSecondSeen: 34,   // while any eye is on the thief
  decayPerSecondHidden: 9, // slow bleed-off once out of sight
  bustAt: 100,
  spotPenalty: 18,         // instant jump when the grace window expires
};

export const TOOLS = {
  noiseMaker: { uses: 2, key: '1', radius: 150, label: 'NOISE-MAKER' },
  emp:        { uses: 1, key: '2', seconds: 6,  label: 'EMP' },
  disguise:   { uses: 1, key: '3', seconds: 8,  label: 'DISGUISE' },
};

export const LOOT_VALUE = 50000; // dollars in the vault, paid out on a clean getaway
