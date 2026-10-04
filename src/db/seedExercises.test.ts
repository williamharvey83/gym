import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES, seedId } from './seedExercises.ts';
import { EQUIPMENT, MUSCLE_GROUPS } from './types.ts';

describe('seed exercise library', () => {
  it('has about 150 lifts', () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(140);
    expect(SEED_EXERCISES.length).toBeLessThanOrEqual(180);
  });

  it('has unique ids and names', () => {
    const ids = SEED_EXERCISES.map((e) => e.id);
    const names = SEED_EXERCISES.map((e) => e.name.toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(SEED_EXERCISES.map((e) => [e.name, e] as const))('%s is well formed', (_name, e) => {
    expect(MUSCLE_GROUPS).toContain(e.primary);
    expect(EQUIPMENT).toContain(e.equipment);
    for (const m of e.secondary) expect(MUSCLE_GROUPS).toContain(m);
    expect(e.secondary).not.toContain(e.primary);
    expect(new Set(e.secondary).size).toBe(e.secondary.length);
    expect(e.cues.length).toBeGreaterThanOrEqual(2);
    expect(e.cues.length).toBeLessThanOrEqual(4);
    for (const c of e.cues) expect(c.trim()).toBe(c);
  });

  it('covers every muscle group and equipment type', () => {
    for (const m of MUSCLE_GROUPS) expect(SEED_EXERCISES.some((e) => e.primary === m)).toBe(true);
    for (const q of EQUIPMENT) expect(SEED_EXERCISES.some((e) => e.equipment === q)).toBe(true);
  });
});

describe('seedId', () => {
  it('slugs names stably', () => {
    expect(seedId("Farmer's Carry")).toBe('seed-farmers-carry');
    expect(seedId('Low-to-High Cable Fly')).toBe('seed-low-to-high-cable-fly');
    expect(seedId('EZ-Bar Curl')).toBe('seed-ez-bar-curl');
  });
});
