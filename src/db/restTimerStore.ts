import { useSyncExternalStore } from 'react';
import { IDLE, adjustTimer, parseTimerState, shouldAlarm, startTimer, tick, type TimerState } from '../lib/timer.ts';
import { buzz, playChime, unlockAudio } from '../lib/sound.ts';

/*
  One rest timer for the whole app. The state is just timestamps, saved to
  localStorage so a reload or relaunch picks it back up. The alarm is armed
  with a single timeout at the end time and re-checked whenever the app comes
  back to the foreground, since a locked phone pauses timers.
*/

const KEY = 'gym.restTimer';
let state: TimerState = load();
let alarm: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function load(): TimerState {
  try {
    return parseTimerState(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
  } catch {
    return IDLE;
  }
}

function set(next: TimerState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: timer still works for this session */
  }
  arm();
  for (const fn of listeners) fn();
}

function arm() {
  if (alarm) clearTimeout(alarm);
  alarm = null;
  if (state.status === 'running') {
    alarm = setTimeout(check, Math.max(0, state.endsAt - Date.now()) + 20);
  }
}

/** Moves to done if the end has passed, and sounds the alarm if it just did. */
function check() {
  const now = Date.now();
  const next = tick(state, now);
  if (next === state) return arm();
  set(next);
  if (next.status === 'done' && shouldAlarm(next.endedAt, now)) {
    playChime();
    buzz();
  }
}

export function startRestTimer(seconds: number) {
  unlockAudio();
  set(startTimer(Date.now(), seconds));
}

export function adjustRestTimer(deltaSeconds: number) {
  set(adjustTimer(state, deltaSeconds, Date.now()));
}

export function stopRestTimer() {
  if (state.status !== 'idle') set(IDLE);
}

export function getRestTimer(): TimerState {
  return state;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useRestTimer(): TimerState {
  return useSyncExternalStore(subscribe, getRestTimer);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  check();
}
