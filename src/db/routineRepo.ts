import { db, newId } from './db.ts';
import type { Routine, RoutineExercise } from './types.ts';
import { moveItem } from '../lib/workout.ts';

export async function listRoutines(): Promise<Routine[]> {
  return db.routines.orderBy('order').toArray();
}

export async function createRoutine(name: string, exercises: RoutineExercise[]): Promise<string> {
  const now = Date.now();
  const id = newId();
  await db.transaction('rw', db.routines, async () => {
    const last = await db.routines.orderBy('order').last();
    await db.routines.add({ id, name, exercises, order: (last?.order ?? -1) + 1, createdAt: now, updatedAt: now });
  });
  return id;
}

export async function updateRoutine(id: string, patch: { name?: string; exercises?: RoutineExercise[] }): Promise<void> {
  await db.routines.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteRoutine(id: string): Promise<void> {
  // Past workouts keep their own name, so nothing else needs to change.
  await db.routines.delete(id);
}

/** Copies a routine and places the copy right after the original. */
export async function duplicateRoutine(id: string): Promise<string | null> {
  return db.transaction('rw', db.routines, async () => {
    const list = await listRoutines();
    const index = list.findIndex((r) => r.id === id);
    const src = list[index];
    if (!src) return null;
    const now = Date.now();
    const copy: Routine = {
      ...src,
      id: newId(),
      name: `${src.name} (copy)`,
      exercises: src.exercises.map((e) => ({ ...e })),
      createdAt: now,
      updatedAt: now,
    };
    list.splice(index + 1, 0, copy);
    await db.routines.bulkPut(list.map((r, i) => ({ ...r, order: i })));
    return copy.id;
  });
}

/** Moves a routine up (-1) or down (+1) in the list. */
export async function moveRoutine(id: string, delta: -1 | 1): Promise<void> {
  await db.transaction('rw', db.routines, async () => {
    const list = await listRoutines();
    const from = list.findIndex((r) => r.id === id);
    const next = moveItem(list, from, from + delta);
    await db.routines.bulkPut(next.map((r, i) => ({ ...r, order: i })));
  });
}
