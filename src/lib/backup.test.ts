import { describe, expect, it } from 'vitest';
import type { Exercise, Routine, Workout } from '../db/types.ts';
import { backupFileName, buildBackup, summarize, validateBackup, type BackupData } from './backup.ts';

const SCHEMA = 1;

const ex = (id: string, builtIn = true): Exercise => ({
  id,
  name: `Lift ${id}`,
  primary: 'chest',
  secondary: ['triceps'],
  equipment: 'barbell',
  cues: ['Brace'],
  builtIn,
  edited: false,
  createdAt: 1,
  updatedAt: 1,
});

const routine: Routine = { id: 'r1', name: 'Push', order: 0, exercises: [{ exerciseId: 'a', sets: 3 }], createdAt: 1, updatedAt: 1 };

const workout = (id: string, startedAt: number): Workout => ({
  id,
  name: 'Push',
  routineId: 'r1',
  startedAt,
  endedAt: startedAt + 3_600_000,
  exercises: [{ exerciseId: 'a', sets: [{ weight: 135, reps: 8, done: true }, { weight: 137.5, reps: 6, done: true }] }],
  exerciseIds: ['a'],
});

const DATA: BackupData = { exercises: [ex('a'), ex('b', false)], routines: [routine], workouts: [workout('w1', 1000), workout('w2', 5000)] };
const good = () => buildBackup(structuredClone(DATA), SCHEMA, 1, Date.UTC(2026, 9, 4, 18));
const text = (v: unknown) => JSON.stringify(v);

function errorOf(v: unknown): string {
  const r = validateBackup(typeof v === 'string' ? v : text(v), SCHEMA);
  if (r.ok) throw new Error('expected validation to fail');
  return r.error;
}

describe('validateBackup: accepts', () => {
  it('a file the app exported, unchanged', () => {
    const r = validateBackup(text(good()), SCHEMA);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.data).toEqual(DATA);
  });

  it('and summarizes what it contains', () => {
    const r = validateBackup(text(good()), SCHEMA);
    expect(r.ok && r.summary).toEqual({
      exportedAt: Date.UTC(2026, 9, 4, 18),
      exercises: 2,
      customExercises: 1,
      routines: 1,
      workouts: 2,
      sets: 4,
      firstWorkout: 1000,
      lastWorkout: 5000,
    });
  });

  it('an empty backup', () => {
    const r = validateBackup(text(buildBackup({ exercises: [], routines: [], workouts: [] }, SCHEMA, 1, 0)), SCHEMA);
    expect(r.ok).toBe(true);
  });

  it('rebuilds exerciseIds instead of trusting the file', () => {
    const f = good();
    f.data.workouts[0]!.exerciseIds = ['zzz'];
    const r = validateBackup(text(f), SCHEMA);
    expect(r.ok && r.file.data.workouts[0]!.exerciseIds).toEqual(['a']);
  });
});

describe('validateBackup: rejects', () => {
  it('text that is not JSON', () => {
    expect(errorOf('not json {')).toMatch(/couldn't be read as JSON/);
  });

  it('JSON from some other app', () => {
    expect(errorOf({ hello: 'world' })).toMatch(/isn't a Gym Tracker backup/);
    expect(errorOf([1, 2])).toMatch(/isn't a Gym Tracker backup/);
    expect(errorOf(null)).toMatch(/isn't a Gym Tracker backup/);
  });

  it('a file without version info', () => {
    const f: Record<string, unknown> = { ...good() };
    delete f.schemaVersion;
    expect(errorOf(f)).toMatch(/missing its version/);
  });

  it('a backup from a newer app version', () => {
    expect(errorOf({ ...good(), schemaVersion: SCHEMA + 1 })).toMatch(/newer version/);
    expect(errorOf({ ...good(), format: 99 })).toMatch(/newer version/);
  });

  it('a missing data section or table', () => {
    const f: Record<string, unknown> = { ...good() };
    delete f.data;
    expect(errorOf(f)).toMatch(/data must be an object/);
    const g = good() as unknown as { data: Record<string, unknown> };
    delete g.data.workouts;
    expect(errorOf(g)).toMatch(/workouts must be a list/);
  });

  it.each([
    ['an unknown muscle', (f: ReturnType<typeof good>) => ((f.data.exercises[0] as unknown as Record<string, unknown>).primary = 'neck'), /exercises\[0\]\.primary/],
    ['unknown equipment', (f: ReturnType<typeof good>) => ((f.data.exercises[1] as unknown as Record<string, unknown>).equipment = 'rock'), /exercises\[1\]\.equipment/],
    ['too many cues', (f: ReturnType<typeof good>) => (f.data.exercises[0]!.cues = ['a', 'b', 'c', 'd', 'e']), /more than 4 cues/],
    ['a blank exercise name', (f: ReturnType<typeof good>) => (f.data.exercises[0]!.name = '  '), /exercises\[0\]\.name is empty/],
    ['a duplicate exercise id', (f: ReturnType<typeof good>) => (f.data.exercises[1]!.id = 'a'), /exercises\[1\]\.id is a duplicate/],
    ['a routine pointing at a missing exercise', (f: ReturnType<typeof good>) => (f.data.routines[0]!.exercises[0]!.exerciseId = 'gone'), /routines\[0\]\.exercises\[0\]\.exerciseId points to an exercise/],
    ['a routine with zero sets', (f: ReturnType<typeof good>) => (f.data.routines[0]!.exercises[0]!.sets = 0), /routines\[0\]\.exercises\[0\]\.sets must be between/],
    ['a workout pointing at a missing exercise', (f: ReturnType<typeof good>) => (f.data.workouts[1]!.exercises[0]!.exerciseId = 'gone'), /workouts\[1\]\.exercises\[0\]\.exerciseId/],
    ['fractional reps', (f: ReturnType<typeof good>) => (f.data.workouts[0]!.exercises[0]!.sets[1]!.reps = 6.5), /workouts\[0\]\.exercises\[0\]\.sets\[1\]\.reps must be a whole number/],
    ['negative weight', (f: ReturnType<typeof good>) => (f.data.workouts[0]!.exercises[0]!.sets[0]!.weight = -5), /weight must be between/],
    ['weight as text', (f: ReturnType<typeof good>) => ((f.data.workouts[0]!.exercises[0]!.sets[0] as unknown as Record<string, unknown>).weight = '135'), /weight must be a number/],
    ['an end before the start', (f: ReturnType<typeof good>) => (f.data.workouts[0]!.endedAt = 0), /workouts\[0\]\.endedAt is before the start/],
    ['a duplicate workout id', (f: ReturnType<typeof good>) => (f.data.workouts[1]!.id = 'w1'), /workouts\[1\]\.id is a duplicate/],
    ['a bad routine id on a workout', (f: ReturnType<typeof good>) => ((f.data.workouts[0] as unknown as Record<string, unknown>).routineId = 7), /routineId must be text or empty/],
  ])('%s', (_name, mutate, pattern) => {
    const f = good();
    mutate(f);
    expect(errorOf(f)).toMatch(pattern);
  });

  it('never returns partial data alongside an error', () => {
    const f = good();
    f.data.workouts[1]!.exercises[0]!.sets[0]!.reps = -1;
    const r = validateBackup(text(f), SCHEMA);
    expect(r).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe('backup helpers', () => {
  it('names the file by local date', () => {
    expect(backupFileName(new Date(2026, 9, 4, 23, 59).getTime())).toBe('gym-backup-2026-10-04.json');
  });

  it('summarizes an empty backup', () => {
    const s = summarize({ exportedAt: 'nope', data: { exercises: [], routines: [], workouts: [] } });
    expect(s).toMatchObject({ exportedAt: null, workouts: 0, firstWorkout: null, lastWorkout: null });
  });
});
