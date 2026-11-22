// audio.js — all sound is synthesized with WebAudio, no audio files.
// A low pulse while the alarm climbs, a sting when spotted, a chime for
// the loot, and a little getaway riff when Vesper slips out with the gold.

let ctx = null;
let muted = false;
let pulseTimer = null;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playSpotted() {
  ensureAudio();
  tone(620, 0.16, 'square', 0.12);
  tone(880, 0.22, 'square', 0.12, 0.12);
}

export function playAlarmBlip() {
  ensureAudio();
  tone(980, 0.09, 'sawtooth', 0.05);
}

export function playLoot() {
  ensureAudio();
  tone(523, 0.14, 'sine', 0.16);
  tone(659, 0.14, 'sine', 0.16, 0.1);
  tone(784, 0.3, 'sine', 0.18, 0.2);
}

export function playEmp() {
  ensureAudio();
  tone(1200, 0.4, 'sawtooth', 0.08, 0, 120);
}

export function playNoiseMaker() {
  ensureAudio();
  tone(1800, 0.12, 'square', 0.07);
  tone(1800, 0.12, 'square', 0.07, 0.18);
}

export function playCaught() {
  ensureAudio();
  tone(440, 0.3, 'sawtooth', 0.14, 0, 110);
  tone(220, 0.5, 'sawtooth', 0.14, 0.25, 55);
}

export function playGetaway() {
  ensureAudio();
  const notes = [392, 494, 587, 784, 988];
  notes.forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11));
}

export function playClick() {
  ensureAudio();
  tone(700, 0.06, 'sine', 0.08);
}

// A heartbeat that quickens as the alarm climbs; call every frame.
export function alarmHeartbeat(alarmValue) {
  if (!ctx || muted || alarmValue < 15) return;
  const now = performance.now();
  const interval = 900 - alarmValue * 6; // faster as the meter fills
  if (pulseTimer && now - pulseTimer < interval) return;
  pulseTimer = now;
  tone(70, 0.12, 'sine', 0.22);
}

export function toggleMute() {
  muted = !muted;
  return muted;
}
