import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db.ts';
import {
  flushActiveWorkout,
  forgetActiveWorkout,
  getActiveWorkout,
  loadActiveWorkout,
  setActiveWorkout,
  updateActiveWorkout,
} from './activeWorkoutStore.ts';
import { finishActiveWorkout, getLastSessions, startRoutineWorkout } from './workoutRepo.ts';
import { createRoutine, duplicateRoutine, listRoutines, moveRoutine } from './routineRepo.ts';
import type { Workout } from './types.ts';

beforeEach(async () => {
  setActiveWorkout(null);
  await flushActiveWorkout();
  await Promise.all(db.tables.map((t) => t.clear()));
});

const workout = (id: string, startedAt: number, exerciseId: string, weight: number): Workout => ({
  id,
  name: 'W',
  routineId: null,
  startedAt,
  endedAt: startedAt + 1,
  exercises: [{ exerciseId, sets: [{ weight, reps: 5, done: true }] }],
  exerciseIds: [exerciseId],
});

describe('crash recovery', () => {
  it('restores the in-progress workout after the app restarts', async () => {
    setActiveWorkout({ key: 'current', name: 'Legs', routineId: null, startedAt: 123, exercises: [] });
    updateActiveWorkout((w) => ({ ...w, name: 'Leg day' }));
    await flushActiveWorkout();

    forgetActiveWorkout(); // simulate the app being killed
    expect(getActiveWorkout()).toBeNull();

    await loadActiveWorkout();
    expect(getActiveWorkout()).toMatchObject({ name: 'Leg day', startedAt: 123 });
  });
});

describe('getLastSessions', () => {
  it('finds the newest workout per exercise, optionally before a time', async () => {
    await db.workouts.bulkAdd([workout('a', 100, 'squat', 225), workout('b', 300, 'squat', 245), workout('c', 200, 'bench', 185)]);
    const last = await getLastSessions(['squat', 'bench', 'curl']);
    expect(last.get('squat')).toMatchObject({ workoutId: 'b', sets: [{ weight: 245 }] });
    expect(last.get('bench')?.workoutId).toBe('c');
    expect(last.has('curl')).toBe(false);

    expect((await getLastSessions(['squat'], 300)).get('squat')?.workoutId).toBe('a');
  });
});

describe('finishActiveWorkout', () => {
  it('saves checked sets, clears the active workout, and offers a routine update when changed', async () => {
    await db.workouts.add(workout('old', 1, 'bench', 185));
    const routineId = await createRoutine('Push', [{ exerciseId: 'bench', sets: 2 }]);
    const routine = (await db.routines.get(routineId))!;

    await startRoutineWorkout(routine);
    const started = getActiveWorkout()!;
    expect(started.exercises[0]!.sets.map((s) => s.weight)).toEqual([185, 185]);

    updateActiveWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) => ({
        ...e,
        sets: [...e.sets.map((s) => ({ ...s, done: true })), { key: 'x', weight: 190, reps: 3, done: true }],
      })),
    }));

    const result = await finishActiveWorkout();
    expect(result?.savedSets).toBe(3);
    expect(result?.routineUpdate).toEqual({ routineId, routineName: 'Push', exercises: [{ exerciseId: 'bench', sets: 3 }] });
    expect(getActiveWorkout()).toBeNull();
    expect(await db.activeWorkout.get('current')).toBeUndefined();

    const saved = (await db.workouts.get(result!.workoutId))!;
    expect(saved).toMatchObject({ name: 'Push', routineId, exerciseIds: ['bench'] });
    expect(saved.endedAt).toBeGreaterThanOrEqual(saved.startedAt);
  });

  it('saves nothing when no sets were checked, but still ends the workout', async () => {
    setActiveWorkout({
      key: 'current',
      name: 'W',
      routineId: null,
      startedAt: 1,
      exercises: [{ key: 'a', exerciseId: 'bench', sets: [{ key: 'b', weight: 100, reps: 5, done: false }] }],
    });
    const result = await finishActiveWorkout();
    expect(result).toMatchObject({ savedSets: 0, workoutId: '', routineUpdate: null });
    expect(await db.workouts.count()).toBe(0);
    expect(getActiveWorkout()).toBeNull();
  });
});

describe('routine ordering', () => {
  it('duplicates in place and moves up and down', async () => {
    const a = await createRoutine('A', []);
    await createRoutine('B', []);
    await duplicateRoutine(a);
    expect((await listRoutines()).map((r) => r.name)).toEqual(['A', 'A (copy)', 'B']);

    await moveRoutine(a, 1);
    expect((await listRoutines()).map((r) => r.name)).toEqual(['A (copy)', 'A', 'B']);
    await moveRoutine(a, -1);
    await moveRoutine(a, -1); // already first: no change
    expect((await listRoutines()).map((r) => r.name)).toEqual(['A', 'A (copy)', 'B']);
  });
});
