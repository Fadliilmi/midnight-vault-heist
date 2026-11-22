[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Fadliilmi/midnight-vault-heist/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Fadliilmi/midnight-vault-heist/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

# Midnight Vault — a silent heist in one room

Vesper slips in through the service door, lifts the $50,000 loot from the
Meridian Vault, and walks out the east fire exit — without the guards or
the cameras ever seeing her. A complete, original top-down 2D stealth
game that runs offline in a desktop browser from static files.

## How to play

Open `game/index.html` in a desktop browser (or `node serve.ts`, then
http://localhost:8080). No network, no build step.

- **Move** — WASD / arrow keys; hold **Shift** to sneak (slower, harder to spot)
- **Aim a tool with the mouse** — **[1]** noise-maker lures the nearest guard,
  **[2]** EMP blinds both cameras for 6s, **[3]** disguise lets you stroll past
  a guard — once, and only slowly
- **P** pause · **R** restart · **M** mute

## The room

One vault hall, three ways across it: the west corridor past Rook, the desk
maze in the middle, or the east gallery under the cameras past Bishop. Desks,
pillars and the vault itself block every line of sight, so the plan is in the
cover. Guards patrol with amber vision cones; cameras sweep red cones across
the hall. Being seen starts a fair grace window — break line of sight before
it runs out, or the alarm jumps and climbs toward a 100% lockdown. Grab the
loot, reach the green EXIT, and the getaway pays for the planning: a stealth
and time bonus on top of the $50,000.

## Files

- `game/index.html` — page shell
- `game/src/main.js` — game loop and state machine (title → playing → won/lost)
- `game/src/level.js` — the vault hall: walls, cover, patrol routes, cameras
- `game/src/thief.js` — Vesper: movement, tools, the loot in her pocket
- `game/src/guard.js` — patrol guards: waypoints, vision cones, the chase
- `game/src/camera.js` — security cameras: the slow, readable sweep
- `game/src/alarm.js` — the alarm meter, the grace window, the getaway score
- `game/src/render.js` — everything on the canvas
- `game/src/audio.js` — WebAudio-synthesized sounds, no audio files
- `game/src/input.js` — keyboard and mouse
- `game/src/config.js` — tuning constants
- `game/src/shots.js` — deterministic staged scenes (`?shot=start|play|end`)
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with `vendor/makefun-game.ts`

Built for the make.fun bounty
[Make the best heist game](https://make.fun/c/best-heist-game-20261122-0559).
