import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GymDB } from './db.ts';
import { SEED_EXERCISES } from './seedExercises.ts';
import { seedIfNeeded } from './setup.ts';
import { createBackup, replaceAllData } from './backupRepo.ts';
import { validateBackup } from '../lib/backup.ts';
import type { Workout } from './types.ts';

let db: GymDB;

beforeEach(async () => {
  db = new GymDB(`test-${crypto.randomUUID()}`);
  await seedIfNeeded(db);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

const workout = (id: string, startedAt: number): Workout => ({
  id,
  name: 'Legs',
  routineId: null,
  startedAt,
  endedAt: startedAt + 1000,
  exercises: [{ exerciseId: 'seed-back-squat', sets: [{ weight: 225, reps: 5, done: true }] }],
  exerciseIds: ['seed-back-squat'],
});

describe('backup round trip', () => {
  it('exports everything and imports it back identically', async () => {
    await db.workouts.bulkAdd([workout('w1', 100), workout('w2', 200)]);
    await db.routines.add({ id: 'r1', name: 'Legs', order: 0, exercises: [{ exerciseId: 'seed-back-squat', sets: 4 }], createdAt: 1, updatedAt: 1 });
    await db.exercises.update('seed-deadlift', { name: 'Conventional Deadlift', edited: true });

    const exported = await createBackup(db, 123);
    const parsed = validateBackup(JSON.stringify(exported), 1);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const other = new GymDB(`test-${crypto.randomUUID()}`);
    await seedIfNeeded(other);
    await other.workouts.add(workout('old', 1));
    await replaceAllData(parsed.file, other);

    expect((await other.workouts.toArray()).map((w) => w.id)).toEqual(['w1', 'w2']);
    expect(await other.routines.count()).toBe(1);
    expect((await other.exercises.get('seed-deadlift'))?.name).toBe('Conventional Deadlift');
    expect(await other.exercises.count()).toBe(SEED_EXERCISES.length);
    await other.delete();
  });
});

describe('replaceAllData', () => {
  it('never partially imports: a failure midway leaves the old data untouched', async () => {
    await db.workouts.add(workout('keep-me', 1));
    const before = await createBackup(db, 0);

    const incoming = await createBackup(db, 0);
    incoming.data.workouts = [workout('new-1', 10), workout('new-2', 20)];

    // Fail on the last write of the transaction.
    vi.spyOn(db.workouts, 'bulkAdd').mockRejectedValueOnce(new Error('disk full'));
    await expect(replaceAllData(incoming, db)).rejects.toThrow('disk full');

    const after = await createBackup(db, 0);
    expect(after.data).toEqual(before.data);
  });

  it('carries weekly set goals across, and keeps local goals for backups without them', async () => {
    await db.meta.put({ key: 'muscleGoals', value: { chest: 15, back: 12 } });
    const withGoals = await createBackup(db, 0);
    expect(withGoals.settings?.muscleGoals?.chest).toBe(15);

    await db.meta.put({ key: 'muscleGoals', value: { chest: 9 } });
    await replaceAllData(withGoals, db);
    expect(((await db.meta.get('muscleGoals'))?.value as { chest: number }).chest).toBe(15);

    const { settings: _drop, ...older } = withGoals;
    await db.meta.put({ key: 'muscleGoals', value: { chest: 20 } });
    await replaceAllData(older, db);
    expect(((await db.meta.get('muscleGoals'))?.value as { chest: number }).chest).toBe(20);
  });

  it('adds preloaded lifts missing from an older backup', async () => {
    const file = await createBackup(db, 0);
    file.data.exercises = file.data.exercises.filter((e) => e.id !== 'seed-plank');
    file.seedVersion = 0;
    await replaceAllData(file, db);
    expect(await db.exercises.get('seed-plank')).toBeDefined();
  });
});
