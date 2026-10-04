import { useSyncExternalStore } from 'react';
import { db } from './db.ts';
import type { ActiveWorkout } from './types.ts';

/*
  The in-progress workout lives in memory for instant typing, and every change
  is written straight through to IndexedDB so it survives the app closing,
  crashing, or the phone killing it in the background.
*/

let current: ActiveWorkout | null = null;
const listeners = new Set<() => void>();
let writes: Promise<unknown> = Promise.resolve();

function emit() {
  for (const fn of listeners) fn();
}

/** Restores an unfinished workout on launch. */
export async function loadActiveWorkout(): Promise<void> {
  current = (await db.activeWorkout.get('current')) ?? null;
  emit();
}

export function getActiveWorkout(): ActiveWorkout | null {
  return current;
}

export function setActiveWorkout(next: ActiveWorkout | null): void {
  current = next;
  emit();
  // Chain writes so they land in order even if one is slow.
  writes = writes
    .then(async () => {
      if (next) await db.activeWorkout.put(next);
      else await db.activeWorkout.delete('current');
    })
    .catch((err: unknown) => console.error('Saving in-progress workout failed', err));
}

export function updateActiveWorkout(fn: (w: ActiveWorkout) => ActiveWorkout): void {
  if (current) setActiveWorkout(fn(current));
}

/** Waits for pending writes. Call before reading the stored row directly. */
export function flushActiveWorkout(): Promise<unknown> {
  return writes;
}

/** Clears memory only; the caller has already deleted the stored row. */
export function forgetActiveWorkout(): void {
  current = null;
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useActiveWorkout(): ActiveWorkout | null {
  return useSyncExternalStore(subscribe, getActiveWorkout);
}
