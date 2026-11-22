// alarm.js — the alarm meter: the game's heartbeat.
// Being seen fills it fast; hiding bleeds it off slowly. The first sighting
// does not punish at once: a fair grace window warns "SPOTTED!" and only
// if the thief is still in view when it expires does the meter jump.
// At 100 the vault locks down and the run is busted.

import { ALARM } from './config.js';

export function createAlarm() {
  return {
    value: 0,
    spotted: false,      // any eye on the thief right now
    graceUntil: 0,       // end of the fair-warning window
    warned: false,       // the grace jump has already been applied
    busted: false,
  };
}

export function updateAlarm(alarm, seen, dt, now) {
  alarm.spotted = seen;
  if (seen) {
    if (alarm.graceUntil === 0) {
      alarm.graceUntil = now + 1.4; // THIEF.graceSeconds, kept in sync
      alarm.warned = false;
    } else if (now >= alarm.graceUntil && !alarm.warned) {
      alarm.value += ALARM.spotPenalty;
      alarm.warned = true;
    }
    alarm.value += ALARM.risePerSecondSeen * dt;
  } else {
    alarm.graceUntil = 0;
    alarm.warned = false;
    alarm.value = Math.max(0, alarm.value - ALARM.decayPerSecondHidden * dt);
  }
  if (alarm.value >= ALARM.bustAt) {
    alarm.value = ALARM.bustAt;
    alarm.busted = true;
  }
  return alarm;
}

// Score for a clean getaway: the gold, minus a penalty for the noise made.
export function getawayScore(hasLoot, alarmValue, secondsUsed) {
  if (!hasLoot) return 0;
  const stealthBonus = Math.round((100 - alarmValue) * 40);
  const timeBonus = Math.max(0, Math.round((240 - secondsUsed) * 25));
  return 50000 + stealthBonus + timeBonus;
}
