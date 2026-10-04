import type { GymDB } from './db.ts';
import { SEED_EXERCISES, SEED_VERSION } from './seedExercises.ts';
import type { Exercise } from './types.ts';

export const META_SEED_VERSION = 'seedVersion';
export const META_PERSIST = 'storagePersist';

export type PersistStatus = {
  /** 'granted' | 'denied' | 'unsupported' */
  state: 'granted' | 'denied' | 'unsupported';
  checkedAt: number;
};

/**
 * Adds any preloaded exercises this install doesn't have yet. Existing rows,
 * including edited built-ins, are never overwritten.
 */
export async function seedIfNeeded(db: GymDB, now = Date.now()): Promise<number> {
  return db.transaction('rw', db.exercises, db.meta, async () => {
    const row = await db.meta.get(META_SEED_VERSION);
    if (typeof row?.value === 'number' && row.value >= SEED_VERSION) return 0;

    const existing = new Set(await db.exercises.toCollection().primaryKeys());
    const toAdd: Exercise[] = SEED_EXERCISES.filter((s) => !existing.has(s.id)).map((s) => ({
      ...s,
      secondary: [...s.secondary],
      cues: [...s.cues],
      builtIn: true,
      edited: false,
      createdAt: now,
      updatedAt: now,
    }));
    await db.exercises.bulkAdd(toAdd);
    await db.meta.put({ key: META_SEED_VERSION, value: SEED_VERSION });
    return toAdd.length;
  });
}

/**
 * Asks the browser to keep IndexedDB data from being evicted. The browser may
 * grant silently, deny silently, or (Safari) decide based on install state, so
 * the result is re-checked on every launch and stored for Settings.
 */
export async function ensurePersistence(db: GymDB, now = Date.now()): Promise<PersistStatus> {
  let state: PersistStatus['state'] = 'unsupported';
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (storage?.persist && storage.persisted) {
    try {
      const already = await storage.persisted();
      state = already || (await storage.persist()) ? 'granted' : 'denied';
    } catch {
      state = 'denied';
    }
  }
  const status: PersistStatus = { state, checkedAt: now };
  await db.meta.put({ key: META_PERSIST, value: status });
  return status;
}

export async function initDatabase(db: GymDB): Promise<void> {
  await seedIfNeeded(db);
  // Don't block startup on the persistence prompt.
  void ensurePersistence(db);
}
