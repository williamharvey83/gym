import { db, newId } from './db.ts';
import {
  flushActiveWorkout,
  forgetActiveWorkout,
  getActiveWorkout,
  setActiveWorkout,
} from './activeWorkoutStore.ts';
import type { Routine, Workout, WorkoutExercise } from './types.ts';
import {
  routineChanged,
  routineShape,
  setsForExercise,
  startEmpty,
  startFromRoutine,
  toSavedWorkout,
  uniqueIds,
  type LastSession,
} from '../lib/workout.ts';

/**
 * Most recent finished session for each exercise. `before` limits it to
 * workouts that started earlier (used when viewing an older workout).
 */
export async function getLastSessions(
  exerciseIds: readonly string[],
  before = Number.POSITIVE_INFINITY,
): Promise<Map<string, LastSession>> {
  const out = new Map<string, LastSession>();
  for (const id of new Set(exerciseIds)) {
    const list = await db.workouts.where('exerciseIds').equals(id).reverse().sortBy('startedAt');
    const w = list.find((x) => x.startedAt < before);
    if (w) out.set(id, { workoutId: w.id, startedAt: w.startedAt, sets: setsForExercise(w, id) });
  }
  return out;
}

export function startEmptyWorkout(): void {
  setActiveWorkout(startEmpty(Date.now()));
}

export async function startRoutineWorkout(routine: Routine): Promise<void> {
  const last = await getLastSessions(routine.exercises.map((e) => e.exerciseId));
  setActiveWorkout(startFromRoutine(routine, last, Date.now()));
}

export type FinishResult = {
  workoutId: string;
  savedSets: number;
  /** Set when the workout came from a routine and its exercises or set counts changed. */
  routineUpdate: { routineId: string; routineName: string; exercises: Routine['exercises'] } | null;
};

/** Saves the in-progress workout and clears it, in one transaction. */
export async function finishActiveWorkout(): Promise<FinishResult | null> {
  const active = getActiveWorkout();
  if (!active) return null;
  await flushActiveWorkout();

  const id = newId();
  const { workout, savedSets } = toSavedWorkout(active, id, Date.now());
  const routine = active.routineId ? await db.routines.get(active.routineId) : undefined;
  const shape = routineShape(active.exercises);

  await db.transaction('rw', db.workouts, db.activeWorkout, async () => {
    if (savedSets > 0) await db.workouts.add(workout);
    await db.activeWorkout.delete('current');
  });
  forgetActiveWorkout();

  return {
    workoutId: savedSets > 0 ? id : '',
    savedSets,
    routineUpdate:
      routine && shape.length > 0 && routineChanged(routine.exercises, shape)
        ? { routineId: routine.id, routineName: routine.name, exercises: shape }
        : null,
  };
}

export function discardActiveWorkout(): void {
  setActiveWorkout(null);
}

export async function updateWorkout(
  id: string,
  patch: { name: string; startedAt: number; endedAt: number; exercises: WorkoutExercise[] },
): Promise<void> {
  await db.workouts.update(id, { ...patch, exerciseIds: uniqueIds(patch.exercises) });
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.workouts.delete(id);
}

export async function recentWorkouts(limit: number): Promise<Workout[]> {
  return db.workouts.orderBy('startedAt').reverse().limit(limit).toArray();
}
