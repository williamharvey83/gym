import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db.ts';
import { createExercise, deleteExercise, isExerciseInUse } from './exerciseRepo.ts';
import { seedIfNeeded } from './setup.ts';

const DRAFT = { name: 'Zercher Squat', primary: 'quads', secondary: [], equipment: 'barbell', cues: [] } as const;

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('deleteExercise', () => {
  it('deletes an unused custom exercise', async () => {
    const id = await createExercise({ ...DRAFT, secondary: [], cues: [] });
    expect(await isExerciseInUse(id)).toBe(false);
    expect(await deleteExercise(id)).toBe(true);
    expect(await db.exercises.get(id)).toBeUndefined();
  });

  it('refuses built-in exercises', async () => {
    await seedIfNeeded(db);
    expect(await deleteExercise('seed-back-squat')).toBe(false);
    expect(await db.exercises.get('seed-back-squat')).toBeDefined();
  });

  it('refuses an exercise used in a routine', async () => {
    const id = await createExercise({ ...DRAFT, secondary: [], cues: [] });
    await db.routines.add({ id: 'r1', name: 'Legs', order: 0, exercises: [{ exerciseId: id, sets: 3 }], createdAt: 0, updatedAt: 0 });
    expect(await deleteExercise(id)).toBe(false);
  });

  it('refuses an exercise in a logged workout', async () => {
    const id = await createExercise({ ...DRAFT, secondary: [], cues: [] });
    await db.workouts.add({
      id: 'w1',
      name: 'Legs',
      routineId: null,
      startedAt: 1,
      endedAt: 2,
      exercises: [{ exerciseId: id, sets: [{ weight: 95, reps: 5, done: true }] }],
      exerciseIds: [id],
    });
    expect(await deleteExercise(id)).toBe(false);
  });

  it('refuses an exercise in the in-progress workout', async () => {
    const id = await createExercise({ ...DRAFT, secondary: [], cues: [] });
    await db.activeWorkout.put({ key: 'current', name: 'Legs', routineId: null, startedAt: 1, exercises: [{ exerciseId: id, sets: [] }] });
    expect(await deleteExercise(id)).toBe(false);
  });
});
