/*
  Rest timer math. Everything is based on wall-clock timestamps, never on
  counting intervals, so the countdown stays right when the phone locks, the
  tab sleeps, or the app is reopened.
*/

export const PRESETS = [60, 90, 120, 180] as const;
export const STEP_SECONDS = 15;
export const MAX_SECONDS = 60 * 60;
/** Only sound the alarm if we notice the end within this window. */
export const ALARM_GRACE_MS = 5000;

export type TimerState =
  | { status: 'idle' }
  | { status: 'running'; endsAt: number; totalMs: number }
  | { status: 'done'; endedAt: number };

export const IDLE: TimerState = { status: 'idle' };

export function startTimer(now: number, seconds: number): TimerState {
  const ms = Math.min(MAX_SECONDS, Math.max(1, seconds)) * 1000;
  return { status: 'running', endsAt: now + ms, totalMs: ms };
}

/** +15 s / -15 s. Going to zero or below stops the timer without an alarm. */
export function adjustTimer(state: TimerState, deltaSeconds: number, now: number): TimerState {
  if (state.status !== 'running') return state;
  const remaining = state.endsAt - now + deltaSeconds * 1000;
  if (remaining <= 0) return IDLE;
  const capped = Math.min(remaining, MAX_SECONDS * 1000);
  return { status: 'running', endsAt: now + capped, totalMs: Math.max(state.totalMs + (capped - (state.endsAt - now)), capped) };
}

export function remainingMs(state: TimerState, now: number): number {
  return state.status === 'running' ? Math.max(0, state.endsAt - now) : 0;
}

/** 0 (just started) to 1 (finished). */
export function progress(state: TimerState, now: number): number {
  if (state.status !== 'running') return state.status === 'done' ? 1 : 0;
  return Math.min(1, Math.max(0, 1 - remainingMs(state, now) / state.totalMs));
}

/** Moves a running timer to done once its end time has passed. */
export function tick(state: TimerState, now: number): TimerState {
  return state.status === 'running' && now >= state.endsAt ? { status: 'done', endedAt: state.endsAt } : state;
}

/** Whether a timer that ended at `endedAt` is recent enough to sound now. */
export function shouldAlarm(endedAt: number, now: number): boolean {
  return now - endedAt <= ALARM_GRACE_MS;
}

/** Countdown text, rounding up so it shows 0:01 until the very end. "1:30" */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function parseTimerState(raw: unknown): TimerState {
  if (typeof raw !== 'object' || raw === null) return IDLE;
  const r = raw as Record<string, unknown>;
  if (r.status === 'running' && typeof r.endsAt === 'number' && typeof r.totalMs === 'number' && r.totalMs > 0) {
    return { status: 'running', endsAt: r.endsAt, totalMs: r.totalMs };
  }
  if (r.status === 'done' && typeof r.endedAt === 'number') return { status: 'done', endedAt: r.endedAt };
  return IDLE;
}
