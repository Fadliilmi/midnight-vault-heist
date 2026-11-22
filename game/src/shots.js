// shots.js — deterministic staged scenes for the screenshots.
// ?shot=start shows the title over the full room; ?shot=play drops Vesper
// mid-heist beside the vault with a guard's cone sweeping in and the alarm
// already warm; ?shot=end shows the clean getaway screen. A seed query
// param keeps the staged poses identical on every load.

export function applyShot(state, params) {
  const shot = params.get('shot');
  if (!shot) return false;
  if (shot === 'start') {
    state.phase = 'title';
    state.thief.x = 120; state.thief.y = 470; // just inside the door, clear of the ENTRY label
    state.guards[0].x = 180; state.guards[0].y = 300; state.guards[0].angle = Math.PI / 2;
    state.guards[1].x = 680; state.guards[1].y = 250; state.guards[1].angle = -Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 + 0.4;
    state.cameras[1].angle = Math.PI - 0.3;
    state.now = 12;
  } else if (shot === 'play') {
    state.phase = 'playing';
    // Vesper hugging the desk row, one step from the vault, loot in sight.
    state.thief.x = 700; state.thief.y = 210;
    state.thief.facing = 0;
    state.guards[0].x = 610; state.guards[0].y = 300; state.guards[0].angle = Math.PI;
    state.guards[1].x = 740; state.guards[1].y = 320; state.guards[1].angle = Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 + 0.55;
    state.cameras[1].angle = Math.PI - 0.55;
    state.alarm.value = 38;
    state.now = 45;
  } else if (shot === 'end') {
    state.phase = 'won';
    state.thief.hasLoot = true;
    state.thief.x = 856; state.thief.y = 492; // beside the exit, label clear of the door text
    state.score = 52400;
    state.alarmPeak = 41;
    state.elapsed = 96;
    state.timeLeft = 204;
    state.alarm.value = 41;
    state.now = 96;
  } else {
    return false;
  }
  return true;
}
