import { describe, expect, it } from 'vitest';
import { parseReps, parseWeight, weightText } from './numbers.ts';

describe('parseWeight', () => {
  it.each([
    ['135', 135],
    ['132.5', 132.5],
    ['132.4', 132.5],
    ['132.2', 132],
    ['0', 0],
    ['.5', 0.5],
    ['45.', 45],
    ['22,5', 22.5],
    [' 95 ', 95],
  ])('%s -> %s', (text, expected) => {
    expect(parseWeight(text)).toBe(expected);
  });

  it.each(['', '.', '-5', 'abc', '1e3', '2001', '1.2.3'])('rejects %j', (text) => {
    expect(parseWeight(text)).toBeNull();
  });
});

describe('parseReps', () => {
  it('accepts whole numbers', () => {
    expect(parseReps('8')).toBe(8);
    expect(parseReps('0')).toBe(0);
    expect(parseReps('999')).toBe(999);
  });

  it.each(['', '8.5', '-1', '1000', 'x'])('rejects %j', (text) => {
    expect(parseReps(text)).toBeNull();
  });
});

describe('weightText', () => {
  it('formats for an input box', () => {
    expect(weightText(null)).toBe('');
    expect(weightText(135)).toBe('135');
    expect(weightText(132.5)).toBe('132.5');
  });
});
