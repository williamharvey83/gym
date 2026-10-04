import { describe, expect, it } from 'vitest';
import { formatClock, formatCompactLb, formatDuration, formatSet, formatVolume, formatWeight } from './format.ts';

describe('formatWeight', () => {
  it('always shows lb', () => {
    expect(formatWeight(135)).toBe('135 lb');
    expect(formatWeight(132.5)).toBe('132.5 lb');
    expect(formatWeight(0)).toBe('0 lb');
    expect(formatWeight(1025)).toBe('1,025 lb');
  });

  it('formats a set', () => {
    expect(formatSet(135, 8)).toBe('135 lb × 8');
  });
});

describe('volume formatting', () => {
  it('shows lb with separators or compact units', () => {
    expect(formatVolume(12340.4)).toBe('12,340 lb');
    expect(formatCompactLb(940)).toBe('940 lb');
    expect(formatCompactLb(12345)).toBe('12.3K lb');
  });
});

describe('formatDuration', () => {
  it('rounds to minutes', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(45 * 60000 + 20000)).toBe('45 min');
    expect(formatDuration(60 * 60000)).toBe('1 h');
    expect(formatDuration(65 * 60000)).toBe('1 h 5 min');
  });
});

describe('formatClock', () => {
  it('formats a stopwatch', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(247000)).toBe('4:07');
    expect(formatClock(3729000)).toBe('1:02:09');
  });
});
