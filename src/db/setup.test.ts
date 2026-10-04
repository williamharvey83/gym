import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GymDB } from './db.ts';
import { SEED_EXERCISES, SEED_VERSION } from './seedExercises.ts';
import { META_SEED_VERSION, seedIfNeeded } from './setup.ts';

let db: GymDB;

beforeEach(() => {
  db = new GymDB(`test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await db.delete();
});

describe('seedIfNeeded', () => {
  it('loads the full library on first launch', async () => {
    const added = await seedIfNeeded(db);
    expect(added).toBe(SEED_EXERCISES.length);
    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length);
    expect((await db.meta.get(META_SEED_VERSION))?.value).toBe(SEED_VERSION);
    const bench = await db.exercises.get('seed-barbell-bench-press');
    expect(bench).toMatchObject({ builtIn: true, edited: false, primary: 'chest', equipment: 'barbell' });
  });

  it('does nothing on later launches', async () => {
    await seedIfNeeded(db);
    expect(await seedIfNeeded(db)).toBe(0);
    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length);
  });

  it('never overwrites an edited built-in, but restores missing ones on a seed bump', async () => {
    await seedIfNeeded(db);
    await db.exercises.update('seed-deadlift', { name: 'Conventional Deadlift', edited: true });
    await db.exercises.delete('seed-plank');
    await db.meta.put({ key: META_SEED_VERSION, value: SEED_VERSION - 1 });

    expect(await seedIfNeeded(db)).toBe(1);
    expect((await db.exercises.get('seed-deadlift'))?.name).toBe('Conventional Deadlift');
    expect(await db.exercises.get('seed-plank')).toBeDefined();
  });
});
