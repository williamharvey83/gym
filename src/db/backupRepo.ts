import { db, SCHEMA_VERSION, type GymDB } from './db.ts';
import { getActiveWorkout } from './activeWorkoutStore.ts';
import { SEED_VERSION } from './seedExercises.ts';
import { META_SEED_VERSION, seedIfNeeded } from './setup.ts';
import { buildBackup, type BackupFile } from '../lib/backup.ts';
import { parseGoals } from '../lib/muscleTargets.ts';

// Kept here (not imported from weeklySets.ts) so this module stays free of React.
const META_GOALS = 'muscleGoals';

export const META_LAST_EXPORT = 'lastExport';

export async function createBackup(database: GymDB = db, now = Date.now()): Promise<BackupFile> {
  return database.transaction('r', database.exercises, database.routines, database.workouts, database.meta, async () => {
    const [exercises, routines, workouts, seed, goals] = await Promise.all([
      database.exercises.toArray(),
      database.routines.orderBy('order').toArray(),
      database.workouts.orderBy('startedAt').toArray(),
      database.meta.get(META_SEED_VERSION),
      database.meta.get(META_GOALS),
    ]);
    const seedVersion = typeof seed?.value === 'number' ? seed.value : SEED_VERSION;
    return buildBackup({ exercises, routines, workouts }, SCHEMA_VERSION, seedVersion, now, {
      muscleGoals: parseGoals(goals?.value),
    });
  });
}

export async function recordExport(now = Date.now(), database: GymDB = db): Promise<void> {
  await database.meta.put({ key: META_LAST_EXPORT, value: now });
}

/**
 * Replaces all exercises, routines, and workouts with the backup's, in a
 * single transaction: if anything fails, the database is left exactly as it
 * was. Settings like the storage-persistence result are kept.
 */
export async function replaceAllData(file: BackupFile, database: GymDB = db): Promise<void> {
  if (database === db && getActiveWorkout()) {
    throw new Error('Finish or discard the workout in progress before importing a backup.');
  }
  const { exercises, routines, workouts } = file.data;
  await database.transaction('rw', database.exercises, database.routines, database.workouts, database.meta, async () => {
    await Promise.all([database.exercises.clear(), database.routines.clear(), database.workouts.clear()]);
    await database.exercises.bulkAdd(exercises);
    await database.routines.bulkAdd(routines);
    await database.workouts.bulkAdd(workouts);
    await database.meta.put({ key: META_SEED_VERSION, value: file.seedVersion });
    // Older backups have no goals; keep this phone's goals in that case.
    if (file.settings?.muscleGoals) await database.meta.put({ key: META_GOALS, value: file.settings.muscleGoals });
  });
  // A backup from before newer preloaded lifts existed gets them added now.
  await seedIfNeeded(database);
}
