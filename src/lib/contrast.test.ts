import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.ts';

const BG = '#F6F5F1';
const SURFACE = '#FFFFFF';
const IRON = '#14181F';
const FLOW = '#004C99';
const TONAL = '#3D7BC4';
const SIGNAL = '#E2581C';
const MUTED = '#4A4F57';
const FLOW_TINT = '#E3ECF6';

const AA_TEXT = 4.5;
const AA_LARGE = 3;

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio(FLOW, BG)).toBeCloseTo(contrastRatio(BG, FLOW), 10);
  });
});

describe('palette pairs used for small text pass AA (4.5:1)', () => {
  it.each([
    ['Iron on background', IRON, BG],
    ['Iron on surface', IRON, SURFACE],
    ['Muted on background', MUTED, BG],
    ['Flow on background', FLOW, BG],
    ['Flow on surface', FLOW, SURFACE],
    ['Flow on active tint', FLOW, FLOW_TINT],
    ['White on Flow', '#FFFFFF', FLOW],
    ['Iron on Signal fill', IRON, SIGNAL],
    ['Error red on surface', '#A3260F', SURFACE],
    ['Error red on background', '#A3260F', BG],
    ['Error red on error tint', '#A3260F', '#FBE9E4'],
    ['White on danger button', '#FFFFFF', '#A3260F'],
  ])('%s', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('accent colors are restricted to large text, icons, and fills', () => {
  it('Tonal Step on background passes for large text and graphics only', () => {
    const r = contrastRatio(TONAL, BG);
    expect(r).toBeGreaterThanOrEqual(AA_LARGE);
    expect(r).toBeLessThan(AA_TEXT);
  });

  it('Signal on background passes for large text and graphics only', () => {
    const r = contrastRatio(SIGNAL, BG);
    expect(r).toBeGreaterThanOrEqual(AA_LARGE);
    expect(r).toBeLessThan(AA_TEXT);
  });

  it('white text on a Signal fill fails AA, so Signal fills take Iron text', () => {
    expect(contrastRatio('#FFFFFF', SIGNAL)).toBeLessThan(AA_TEXT);
  });
});
