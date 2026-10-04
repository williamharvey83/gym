import { describe, expect, it } from 'vitest';
import { filterExercises, validateExerciseDraft, type ExerciseDraft } from './exercises.ts';
import type { Equipment, MuscleGroup } from '../db/types.ts';

type E = { name: string; primary: MuscleGroup; secondary: MuscleGroup[]; equipment: Equipment };

const LIST: E[] = [
  { name: 'One-Arm Dumbbell Row', primary: 'upperBack', secondary: ['lats', 'biceps'], equipment: 'dumbbell' },
  { name: 'Barbell Bench Press', primary: 'chest', secondary: ['triceps'], equipment: 'barbell' },
  { name: 'Dumbbell Bench Press', primary: 'chest', secondary: ['triceps'], equipment: 'dumbbell' },
  { name: 'Lat Pulldown', primary: 'lats', secondary: ['biceps'], equipment: 'cable' },
];

const ALL = { query: '', muscle: 'all', equipment: 'all' } as const;

describe('filterExercises', () => {
  it('returns everything sorted by name with no filters', () => {
    expect(filterExercises(LIST, ALL).map((e) => e.name)).toEqual([
      'Barbell Bench Press',
      'Dumbbell Bench Press',
      'Lat Pulldown',
      'One-Arm Dumbbell Row',
    ]);
  });

  it('matches all words in any order, ignoring case and punctuation', () => {
    expect(filterExercises(LIST, { ...ALL, query: 'row DUMB' }).map((e) => e.name)).toEqual(['One-Arm Dumbbell Row']);
    expect(filterExercises(LIST, { ...ALL, query: 'one arm' }).map((e) => e.name)).toEqual(['One-Arm Dumbbell Row']);
    expect(filterExercises(LIST, { ...ALL, query: '  bench  ' })).toHaveLength(2);
  });

  it('understands gym shorthand', () => {
    expect(filterExercises(LIST, { ...ALL, query: 'db row' }).map((e) => e.name)).toEqual(['One-Arm Dumbbell Row']);
    expect(filterExercises(LIST, { ...ALL, query: 'bb bench' }).map((e) => e.name)).toEqual(['Barbell Bench Press']);
    expect(
      filterExercises([{ name: 'Romanian Deadlift', primary: 'hamstrings', secondary: [], equipment: 'barbell' }], {
        ...ALL,
        query: 'RDL',
      }),
    ).toHaveLength(1);
  });

  it('filters by equipment', () => {
    expect(filterExercises(LIST, { ...ALL, equipment: 'dumbbell' }).map((e) => e.name)).toEqual([
      'Dumbbell Bench Press',
      'One-Arm Dumbbell Row',
    ]);
  });

  it('filters by primary muscle only', () => {
    expect(filterExercises(LIST, { ...ALL, muscle: 'lats' }).map((e) => e.name)).toEqual(['Lat Pulldown']);
    expect(filterExercises(LIST, { ...ALL, muscle: 'triceps' })).toHaveLength(0);
  });

  it('combines filters', () => {
    expect(filterExercises(LIST, { query: 'press', muscle: 'chest', equipment: 'barbell' })).toHaveLength(1);
    expect(filterExercises(LIST, { query: 'curl', muscle: 'all', equipment: 'all' })).toHaveLength(0);
  });
});

describe('validateExerciseDraft', () => {
  const good: ExerciseDraft = {
    name: '  Zercher   Squat ',
    primary: 'quads',
    secondary: ['glutes', 'quads', 'glutes'],
    equipment: 'barbell',
    cues: ['Bar in elbow crease', '', '  Stay upright  '],
  };

  it('cleans a valid draft', () => {
    const r = validateExerciseDraft(good, ['Back Squat']);
    expect(r).toEqual({
      ok: true,
      value: {
        name: 'Zercher Squat',
        primary: 'quads',
        secondary: ['glutes'],
        equipment: 'barbell',
        cues: ['Bar in elbow crease', 'Stay upright'],
      },
    });
  });

  it('allows no cues on a custom exercise', () => {
    expect(validateExerciseDraft({ ...good, cues: [] }, []).ok).toBe(true);
  });

  it('rejects a missing name, muscle, and equipment', () => {
    const r = validateExerciseDraft({ name: ' ', primary: '', secondary: [], equipment: '', cues: [] }, []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['equipment', 'name', 'primary']);
  });

  it('rejects a duplicate name regardless of case', () => {
    const r = validateExerciseDraft({ ...good, name: 'back squat' }, ['Back Squat']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toMatch(/already exists/);
  });

  it('rejects more than four cues', () => {
    const r = validateExerciseDraft({ ...good, cues: ['a', 'b', 'c', 'd', 'e'] }, []);
    expect(r.ok).toBe(false);
  });
});
