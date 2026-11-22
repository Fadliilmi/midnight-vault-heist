// render.js — everything the player sees, drawn on one canvas.
// The look: a night-blue vault hall where safe cover is dark, danger is
// amber and red, and the gold is the brightest thing in the room, so the
// plan reads at a glance: where to hide, where not to walk, what to steal.

import { VIEW, GUARD, CAMERA } from './config.js';
import { LEVEL } from './level.js';
import { disguiseActive, empActive } from './thief.js';

const FLOOR_A = '#171a2b';
const FLOOR_B = '#141728';

function drawFloor(ctx) {
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 24; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x * 40, y * 40, 40, 40);
    }
  }
  // The gold carpet: the thief's intended path, entry to vault to exit.
  ctx.fillStyle = 'rgba(176, 141, 60, 0.16)';
  ctx.fillRect(40, 516, 880, 46);
  ctx.strokeStyle = 'rgba(200, 164, 80, 0.35)';
  ctx.strokeRect(40, 516, 880, 46);
}

function drawWalls(ctx) {
  ctx.strokeStyle = '#3a3f5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(9, 9, VIEW.w - 18, VIEW.h - 18);
  for (const w of LEVEL.walls) {
    if (w.kind === 'vault') {
      ctx.fillStyle = '#4a4232';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#c9a24b';
      ctx.fillRect(w.x + 8, w.y + 8, w.w - 16, w.h - 16);
      ctx.fillStyle = '#2c2417';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a24b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAULT', w.x + w.w / 2, w.y + w.h - 12);
    } else if (w.kind === 'desk') {
      ctx.fillStyle = '#3d2f23';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#57432e';
      ctx.fillRect(w.x + 5, w.y + 5, w.w - 10, w.h - 10);
      ctx.fillStyle = '#6f5a3d';
      ctx.fillRect(w.x + 12, w.y + 10, 18, 12);
      ctx.fillRect(w.x + w.w - 30, w.y + 10, 18, 12);
    } else if (w.kind === 'pillar') {
      ctx.fillStyle = '#2e3350';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#454b70';
      ctx.fillRect(w.x + 5, w.y + 5, w.w - 10, w.h - 10);
    } else { // counter
      ctx.fillStyle = '#333a55';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#4a5278';
      ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
    }
  }
}

function drawCone(ctx, x, y, angle, range, halfAngle, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawThief(ctx, thief, now) {
  const disguised = disguiseActive(thief, now);
  ctx.save();
  ctx.translate(thief.x, thief.y);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 9, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Hooded figure: dark cloak, pale face, gold sash once the loot is taken.
  ctx.fillStyle = disguised ? '#5a5f7a' : '#1d1d28';
  ctx.beginPath(); ctx.arc(0, 0, thief.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = disguised ? '#9aa0c0' : '#c9a24b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8d9b0';
  ctx.beginPath(); ctx.arc(Math.cos(thief.facing) * 4, Math.sin(thief.facing) * 4, 5, 0, Math.PI * 2); ctx.fill();
  if (thief.hasLoot) {
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(-8, 8, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6d1f'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#e8e6df';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(disguised ? 'Vesper (disguised)' : 'VESPER', thief.x, thief.y - 20);
}

function drawGuard(ctx, guard) {
  const chasing = guard.state === 'chase';
  const color = chasing ? 'rgba(255, 64, 64, 0.30)' : 'rgba(255, 196, 66, 0.25)';
  drawCone(ctx, guard.x, guard.y, guard.angle, GUARD.coneRange, GUARD.coneHalfAngle, color);
  ctx.fillStyle = chasing ? '#a02020' : '#232a4a';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = chasing ? '#ff8080' : '#7d86b8';
  ctx.lineWidth = 2; ctx.stroke();
  // Torch dot + facing tick
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 10, guard.y + Math.sin(guard.angle) * 10, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dfe3f5';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  const label = guard.name + (chasing ? ' !' : guard.state === 'investigate' ? ' ?' : '');
  ctx.fillText(label, guard.x, guard.y - 20);
}

function drawCamera(ctx, camera, now, empOn) {
  const disabled = now < camera.disabledUntil || empOn;
  const color = disabled ? 'rgba(120,120,120,0.12)' : 'rgba(255, 80, 80, 0.22)';
  if (!disabled) drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA.range, CAMERA.coneHalfAngle, color);
  ctx.fillStyle = '#20242f';
  ctx.fillRect(camera.x - 9, camera.y - 6, 18, 12);
  ctx.fillStyle = disabled ? '#666' : '#ff4040';
  ctx.beginPath(); ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffb3b3';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(camera.name + (disabled ? ' OFF' : ''), camera.x, camera.y + 24);
}

function drawLootAndExit(ctx, thief, now) {
  // The loot: a glowing pile of gold bars before the vault door.
  const pulse = 0.75 + 0.25 * Math.sin(now * 3);
  ctx.save();
  ctx.shadowColor = '#ffd94a';
  ctx.shadowBlur = 22 * pulse;
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath(); ctx.arc(LEVEL.loot.x, LEVEL.loot.y, LEVEL.loot.radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#8a6d1f';
  ctx.fillRect(LEVEL.loot.x - 12, LEVEL.loot.y - 4, 24, 8);
  ctx.fillRect(LEVEL.loot.x - 8, LEVEL.loot.y - 11, 16, 8);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LOOT  $50,000', LEVEL.loot.x, LEVEL.loot.y - 30);
  // The exit: the east fire door, green and obvious.
  const e = LEVEL.exit;
  ctx.fillStyle = thief.hasLoot ? '#1f7a37' : '#274d31';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = thief.hasLoot ? '#5dff8a' : '#3f7a52';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#d6ffd9';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(thief.hasLoot ? 'EXIT — GO!' : 'EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  // Entry door, bottom-left.
  ctx.fillStyle = '#3a3f5e';
  ctx.fillRect(34, 516, 56, 34);
  ctx.strokeStyle = '#6a70a0';
  ctx.strokeRect(34, 516, 56, 34);
  ctx.fillStyle = '#c9cdea';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('ENTRY', 62, 537);
}

function drawHud(ctx, state) {
  const { alarm, thief, timeLeft } = state;
  ctx.fillStyle = 'rgba(8, 8, 16, 0.92)';
  ctx.fillRect(0, 0, VIEW.w, 34);
  ctx.fillStyle = '#e8e6df';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT VAULT', 14, 22);
  // Alarm meter: the big bar across the top, labelled, colour-coded.
  const mx = 190, mw = 380, mh = 16, my = 9;
  ctx.fillStyle = '#2a0f14';
  ctx.fillRect(mx, my, mw, mh);
  const frac = alarm.value / 100;
  ctx.fillStyle = frac < 0.4 ? '#e8b93c' : frac < 0.75 ? '#e07830' : '#e03030';
  ctx.fillRect(mx, my, mw * frac, mh);
  ctx.strokeStyle = '#6a5a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, mw, mh);
  ctx.fillStyle = '#ffd9d9';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM ' + Math.round(alarm.value) + '%', mx + mw + 10, 22);
  // Loot, tools, clock.
  ctx.textAlign = 'right';
  ctx.fillStyle = thief.hasLoot ? '#ffd94a' : '#9a93a8';
  ctx.fillText(thief.hasLoot ? 'LOOT ✓ $50,000' : 'LOOT —', 940, 22);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#c9cdea';
  ctx.font = '12px sans-serif';
  ctx.fillText(
    `Tools:  [1] noise ${thief.tools.noiseMaker}   [2] EMP ${thief.tools.emp}   [3] disguise ${thief.tools.disguise}`,
    14, 52,
  );
  ctx.textAlign = 'right';
  ctx.fillText('⏱ ' + Math.max(0, Math.ceil(timeLeft)) + 's', 940, 52);
  // SPOTTED warning with the fair grace window.
  if (alarm.spotted && !alarm.busted) {
    const graceLeft = Math.max(0, alarm.graceUntil - state.now);
    ctx.fillStyle = 'rgba(224, 48, 48, 0.9)';
    ctx.fillRect(VIEW.w / 2 - 150, 66, 300, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(alarm.warned ? 'SPOTTED — BREAK LINE OF SIGHT!' : `SPOTTED! HIDE IN ${graceLeft.toFixed(1)}s`, VIEW.w / 2, 87);
  }
  // Noise-maker pulse ring.
  if (thief.noisePulse && state.now < thief.noisePulse.until) {
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(thief.noisePulse.x, thief.noisePulse.y, 18 + (state.now % 0.5) * 60, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(6, 6, 14, 0.78)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('MIDNIGHT VAULT', VIEW.w / 2, 180);
  ctx.fillStyle = '#e8e6df';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('A silent heist in one room', VIEW.w / 2, 220);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#c9cdea';
  const lines = [
    'Vesper slips in at the ENTRY, lifts the $50,000 LOOT from the vault,',
    'and walks out the EXIT — without the guards or the cameras ever seeing her.',
    '',
    'Read the cones before you move. Desks and pillars block every line of sight.',
    'Tools cost a use: [1] noise-maker lures a guard · [2] EMP blinds the cameras',
    '[3] disguise lets you stroll past a guard — once, and only slowly.',
    'Seen? You get a fair warning: break line of sight before the grace runs out.',
    '',
    'WASD / arrows to move · Shift to sneak · mouse aims the noise-maker',
    'Click or press Enter to begin',
  ];
  lines.forEach((l, i) => ctx.fillText(l, VIEW.w / 2, 262 + i * 24));
}

function drawEnd(ctx, state) {
  ctx.fillStyle = state.phase === 'won' ? 'rgba(6, 20, 10, 0.82)' : 'rgba(24, 6, 8, 0.82)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.textAlign = 'center';
  if (state.phase === 'won') {
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY!', VIEW.w / 2, 220);
    ctx.fillStyle = '#e8e6df';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Vesper walks out with $${state.score.toLocaleString()} — the vault never knew she was there.`, VIEW.w / 2, 268);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#c9cdea';
    ctx.fillText(`Alarm peaked at ${Math.round(state.alarmPeak)}% · ${Math.round(state.elapsed)}s inside · press R to run it again`, VIEW.w / 2, 306);
  } else {
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('BUSTED!', VIEW.w / 2, 220);
    ctx.fillStyle = '#e8e6df';
    ctx.font = '20px sans-serif';
    ctx.fillText('The alarm hit 100% — the vault locks down and the guards close in.', VIEW.w / 2, 268);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#c9cdea';
    ctx.fillText('Watch the cones, use the cover, and mind the grace window. Press R to try again.', VIEW.w / 2, 306);
  }
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6, 6, 14, 0.6)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#e8e6df';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW.w / 2, VIEW.h / 2);
  ctx.font = '15px sans-serif';
  ctx.fillText('P to resume · R to restart', VIEW.w / 2, VIEW.h / 2 + 34);
}

export function drawGame(ctx, state) {
  drawFloor(ctx);
  drawWalls(ctx);
  for (const g of state.guards) drawGuard(ctx, g);
  for (const c of state.cameras) drawCamera(ctx, c, state.now, empActive(state.thief, state.now));
  drawLootAndExit(ctx, state.thief, state.now);
  drawThief(ctx, state.thief, state.now);
  drawHud(ctx, state);
  if (state.phase === 'title') drawTitle(ctx);
  if (state.phase === 'won' || state.phase === 'lost') drawEnd(ctx, state);
  if (state.phase === 'paused') drawPaused(ctx);
}
