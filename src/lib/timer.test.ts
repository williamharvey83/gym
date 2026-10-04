import { describe, expect, it } from 'vitest';
import {
  IDLE,
  adjustTimer,
  formatCountdown,
  parseTimerState,
  progress,
  remainingMs,
  shouldAlarm,
  startTimer,
  tick,
} from './timer.ts';

const T0 = 1_000_000;

describe('rest timer', () => {
  it('counts down from timestamps, not ticks', () => {
    const t = startTimer(T0, 90);
    expect(remainingMs(t, T0)).toBe(90_000);
    // Phone locked for a minute: no ticks ran, but the math is still right.
    expect(remainingMs(t, T0 + 60_000)).toBe(30_000);
    expect(remainingMs(t, T0 + 120_000)).toBe(0);
  });

  it('finishes once the end time passes, keeping the true end time', () => {
    const t = startTimer(T0, 60);
    expect(tick(t, T0 + 59_999)).toBe(t);
    expect(tick(t, T0 + 75_000)).toEqual({ status: 'done', endedAt: T0 + 60_000 });
    expect(tick(IDLE, T0)).toBe(IDLE);
  });

  it('adds and subtracts 15 seconds', () => {
    const t = startTimer(T0, 60);
    const plus = adjustTimer(t, 15, T0 + 10_000);
    expect(remainingMs(plus, T0 + 10_000)).toBe(65_000);
    const minus = adjustTimer(t, -15, T0 + 10_000);
    expect(remainingMs(minus, T0 + 10_000)).toBe(35_000);
  });

  it('stops without an alarm when -15 goes past zero', () => {
    const t = startTimer(T0, 60);
    expect(adjustTimer(t, -15, T0 + 50_000)).toEqual(IDLE);
  });

  it('ignores adjustments when not running', () => {
    expect(adjustTimer(IDLE, 15, T0)).toBe(IDLE);
    const done = { status: 'done', endedAt: T0 } as const;
    expect(adjustTimer(done, 15, T0)).toBe(done);
  });

  it('caps at one hour', () => {
    expect(remainingMs(startTimer(T0, 99_999), T0)).toBe(3_600_000);
    const t = adjustTimer(startTimer(T0, 3590), 15, T0);
    expect(remainingMs(t, T0)).toBe(3_600_000);
  });

  it('reports progress for the bar', () => {
    const t = startTimer(T0, 100);
    expect(progress(t, T0)).toBe(0);
    expect(progress(t, T0 + 25_000)).toBeCloseTo(0.25);
    expect(progress(IDLE, T0)).toBe(0);
    expect(progress({ status: 'done', endedAt: T0 }, T0)).toBe(1);
  });

  it('keeps progress sensible after +15', () => {
    const t = adjustTimer(startTimer(T0, 60), 15, T0 + 30_000);
    expect(progress(t, T0 + 30_000)).toBeCloseTo(30 / 75);
  });

  it('only alarms if the end is noticed promptly', () => {
    expect(shouldAlarm(T0, T0 + 1000)).toBe(true);
    expect(shouldAlarm(T0, T0 + 60_000)).toBe(false);
  });
});

describe('formatCountdown', () => {
  it('rounds up to whole seconds', () => {
    expect(formatCountdown(90_000)).toBe('1:30');
    expect(formatCountdown(89_001)).toBe('1:30');
    expect(formatCountdown(500)).toBe('0:01');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-5)).toBe('0:00');
  });
});

describe('parseTimerState', () => {
  it('restores saved state and rejects junk', () => {
    expect(parseTimerState({ status: 'running', endsAt: 5, totalMs: 3 })).toEqual({ status: 'running', endsAt: 5, totalMs: 3 });
    expect(parseTimerState({ status: 'done', endedAt: 5 })).toEqual({ status: 'done', endedAt: 5 });
    expect(parseTimerState(null)).toEqual(IDLE);
    expect(parseTimerState({ status: 'running', endsAt: 'x' })).toEqual(IDLE);
  });
});
