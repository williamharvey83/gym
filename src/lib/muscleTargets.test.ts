import { describe, expect, it } from 'vitest';
import type { MuscleGroup } from '../db/types.ts';
import { MUSCLE_GROUPS } from '../db/types.ts';
import {
  DEFAULT_GOALS,
  TARGET_GROUPS,
  goalStatus,
  goalsMet,
  parseGoals,
  toTargetGroup,
  weeklySetCounts,
} from './muscleTargets.ts';

const done = (n: number, notDone = 0) => [
  ...Array.from({ length: n }, () => ({ done: true })),
  ...Array.from({ length: notDone }, () => ({ done: false })),
];

const PRIMARY: Record<string, MuscleGroup> = {
  bench: 'chest',
  row: 'upperBack',
  pulldown: 'lats',
  deadlift: 'lowerBack',
  shrug: 'traps',
  curl: 'biceps',
};
const primaryOf = (id: string) => PRIMARY[id];

describe('target groups', () => {
  it('rolls lats, upper back, and lower back into back; traps stay separate', () => {
    expect(toTargetGroup('lats')).toBe('back');
    expect(toTargetGroup('upperBack')).toBe('back');
    expect(toTargetGroup('lowerBack')).toBe('back');
    expect(toTargetGroup('traps')).toBe('traps');
    expect(toTargetGroup('chest')).toBe('chest');
  });

  it('maps every library muscle to a target group', () => {
    for (const m of MUSCLE_GROUPS) expect(TARGET_GROUPS).toContain(toTargetGroup(m));
    expect(TARGET_GROUPS).toHaveLength(12);
  });

  it('defaults to 12 sets for chest and back, 6 for everything else', () => {
    expect(DEFAULT_GOALS.chest).toBe(12);
    expect(DEFAULT_GOALS.back).toBe(12);
    for (const g of TARGET_GROUPS.filter((g) => g !== 'chest' && g !== 'back')) expect(DEFAULT_GOALS[g]).toBe(6);
  });
});

describe('weeklySetCounts', () => {
  it('counts checked sets by primary muscle, combining back muscles', () => {
    const counts = weeklySetCounts(
      [
        { exercises: [{ exerciseId: 'bench', sets: done(4, 1) }, { exerciseId: 'row', sets: done(3) }] },
        { exercises: [{ exerciseId: 'pulldown', sets: done(3) }, { exerciseId: 'deadlift', sets: done(2) }] },
      ],
      [],
      primaryOf,
    );
    expect(counts.chest).toBe(4);
    expect(counts.back).toBe(8);
    expect(counts.traps).toBe(0);
  });

  it('includes checked sets from the workout in progress', () => {
    const counts = weeklySetCounts(
      [{ exercises: [{ exerciseId: 'curl', sets: done(3) }] }],
      [{ exerciseId: 'curl', sets: done(2, 2) }, { exerciseId: 'shrug', sets: done(1) }],
      primaryOf,
    );
    expect(counts.biceps).toBe(5);
    expect(counts.traps).toBe(1);
  });

  it('skips exercises that no longer exist', () => {
    const counts = weeklySetCounts([{ exercises: [{ exerciseId: 'ghost', sets: done(5) }] }], [], primaryOf);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });
});

describe('goalStatus', () => {
  it('is none at zero, partial below the goal, met at or above it', () => {
    expect(goalStatus(0, 6)).toBe('none');
    expect(goalStatus(1, 6)).toBe('partial');
    expect(goalStatus(5, 6)).toBe('partial');
    expect(goalStatus(6, 6)).toBe('met');
    expect(goalStatus(9, 6)).toBe('met');
  });

  it('counts goals met', () => {
    const counts = { ...DEFAULT_GOALS, chest: 12, back: 11, traps: 0 };
    expect(goalsMet(counts, DEFAULT_GOALS)).toBe(10);
  });
});

describe('parseGoals', () => {
  it('keeps valid values and falls back to defaults for the rest', () => {
    const g = parseGoals({ chest: 15, back: 0, traps: 3.5, biceps: '8', calves: 41, abs: 10 });
    expect(g).toEqual({ ...DEFAULT_GOALS, chest: 15, abs: 10 });
  });

  it('returns defaults for junk', () => {
    expect(parseGoals(null)).toEqual(DEFAULT_GOALS);
    expect(parseGoals('x')).toEqual(DEFAULT_GOALS);
  });
});
