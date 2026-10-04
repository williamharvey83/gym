import { db, newId } from './db.ts';
import { SEED_BY_ID } from './seedExercises.ts';
import type { Exercise, Workout } from './types.ts';
import type { CleanDraft } from '../lib/exercises.ts';

export async function createExercise(draft: CleanDraft): Promise<string> {
  const now = Date.now();
  const id = newId();
  await db.exercises.add({ ...draft, id, builtIn: false, edited: false, createdAt: now, updatedAt: now });
  return id;
}

export async function updateExercise(id: string, draft: CleanDraft): Promise<void> {
  await db.exercises.update(id, { ...draft, edited: true, updatedAt: Date.now() });
}

/** Puts a preloaded exercise back to its original name, muscles, and cues. */
export async function restoreBuiltIn(id: string): Promise<void> {
  const seed = SEED_BY_ID.get(id);
  if (!seed) return;
  await db.exercises.update(id, {
    name: seed.name,
    primary: seed.primary,
    secondary: [...seed.secondary],
    equipment: seed.equipment,
    cues: [...seed.cues],
    edited: false,
    updatedAt: Date.now(),
  });
}

/** True if any routine, finished workout, or the in-progress workout uses this exercise. */
export async function isExerciseInUse(id: string): Promise<boolean> {
  if ((await db.workouts.where('exerciseIds').equals(id).count()) > 0) return true;
  const active = await db.activeWorkout.get('current');
  if (active?.exercises.some((e) => e.exerciseId === id)) return true;
  const routines = await db.routines.toArray();
  return routines.some((r) => r.exercises.some((e) => e.exerciseId === id));
}

/**
 * Deletes a custom exercise that nothing uses. Returns false (and deletes
 * nothing) for built-ins or exercises with logged data or routine slots.
 */
export async function deleteExercise(id: string): Promise<boolean> {
  return db.transaction('rw', [db.exercises, db.workouts, db.routines, db.activeWorkout], async () => {
    const ex = await db.exercises.get(id);
    if (!ex || ex.builtIn || (await isExerciseInUse(id))) return false;
    await db.exercises.delete(id);
    return true;
  });
}

/** Finished workouts that include this exercise, newest first. */
export async function workoutsWithExercise(exerciseId: string): Promise<Workout[]> {
  const list = await db.workouts.where('exerciseIds').equals(exerciseId).toArray();
  return list.sort((a, b) => b.startedAt - a.startedAt);
}

export async function allExerciseNamesExcept(id: string | null): Promise<string[]> {
  const all: Exercise[] = await db.exercises.toArray();
  return all.filter((e) => e.id !== id).map((e) => e.name);
}
