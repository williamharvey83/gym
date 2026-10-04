import Dexie, { type EntityTable } from 'dexie';
import type { ActiveWorkout, Exercise, MetaRow, Routine, Workout } from './types.ts';

export class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  routines!: EntityTable<Routine, 'id'>;
  workouts!: EntityTable<Workout, 'id'>;
  activeWorkout!: EntityTable<ActiveWorkout, 'key'>;
  meta!: EntityTable<MetaRow, 'key'>;

  constructor(name = 'gym') {
    super(name);

    // Schema history. Never edit a released version: add a new
    // this.version(n) with only the changed stores and an .upgrade() if data
    // needs reshaping. Bump SCHEMA_VERSION to match.
    this.version(1).stores({
      exercises: 'id, name, primary, equipment',
      routines: 'id, order',
      workouts: 'id, startedAt, *exerciseIds',
      activeWorkout: 'key',
      meta: 'key',
    });
  }
}

/** Latest Dexie schema version. Also written into backup files. */
export const SCHEMA_VERSION = 1;

export const db = new GymDB();

export function newId(): string {
  return crypto.randomUUID();
}
