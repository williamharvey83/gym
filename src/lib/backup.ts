import {
  EQUIPMENT,
  MAX_CUES,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type MuscleGroup,
  type Routine,
  type SetEntry,
  type Workout,
} from '../db/types.ts';
import { MAX_REPS, MAX_WEIGHT } from './numbers.ts';
import { MAX_GOAL, MIN_GOAL, TARGET_GROUPS, parseGoals, type Goals } from './muscleTargets.ts';
import { uniqueIds } from './workout.ts';

/*
  Backup file:
  {
    "app": "gym-tracker",
    "format": 1,              // layout of this file
    "schemaVersion": 1,       // database schema the data came from
    "exportedAt": "2026-10-04T18:00:00.000Z",
    "seedVersion": 1,
    "data": { "exercises": [...], "routines": [...], "workouts": [...] }
  }

  Validation is all-or-nothing: any problem rejects the whole file, so an
  import can never leave the database half replaced.
*/

export const BACKUP_APP = 'gym-tracker';
export const BACKUP_FORMAT = 1;

export type BackupData = { exercises: Exercise[]; routines: Routine[]; workouts: Workout[] };

/** User preferences carried in the backup. Optional: older files have none. */
export type BackupSettings = { muscleGoals?: Goals };

export type BackupFile = {
  app: typeof BACKUP_APP;
  format: number;
  schemaVersion: number;
  exportedAt: string;
  seedVersion: number;
  data: BackupData;
  settings?: BackupSettings;
};

export type BackupSummary = {
  exportedAt: number | null;
  exercises: number;
  customExercises: number;
  routines: number;
  workouts: number;
  sets: number;
  firstWorkout: number | null;
  lastWorkout: number | null;
};

export function buildBackup(
  data: BackupData,
  schemaVersion: number,
  seedVersion: number,
  now: number,
  settings?: BackupSettings,
): BackupFile {
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion,
    exportedAt: new Date(now).toISOString(),
    seedVersion,
    data,
    ...(settings ? { settings } : {}),
  };
}

export function backupFileName(now: number): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `gym-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export function summarize(file: Pick<BackupFile, 'data' | 'exportedAt'>): BackupSummary {
  const { exercises, routines, workouts } = file.data;
  const starts = workouts.map((w) => w.startedAt);
  const exported = Date.parse(file.exportedAt);
  return {
    exportedAt: Number.isNaN(exported) ? null : exported,
    exercises: exercises.length,
    customExercises: exercises.filter((e) => !e.builtIn).length,
    routines: routines.length,
    workouts: workouts.length,
    sets: workouts.reduce((n, w) => n + w.exercises.reduce((m, e) => m + e.sets.length, 0), 0),
    firstWorkout: starts.length ? Math.min(...starts) : null,
    lastWorkout: starts.length ? Math.max(...starts) : null,
  };
}

// ---------------------------------------------------------------------------
// Validation

class Invalid extends Error {}

type Obj = Record<string, unknown>;

function fail(path: string, problem: string): never {
  throw new Invalid(`${path} ${problem}`);
}

function obj(v: unknown, path: string): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(path, 'must be an object.');
  return v as Obj;
}

function arr(v: unknown, path: string): unknown[] {
  if (!Array.isArray(v)) fail(path, 'must be a list.');
  return v;
}

function str(v: unknown, path: string, { min = 0, max = 200 } = {}): string {
  if (typeof v !== 'string') fail(path, 'must be text.');
  if (v.trim().length < min) fail(path, 'is empty.');
  if (v.length > max) fail(path, `is longer than ${max} characters.`);
  return v;
}

function num(v: unknown, path: string, { min = -Infinity, max = Infinity, int = false } = {}): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(path, 'must be a number.');
  if (int && !Number.isInteger(v)) fail(path, 'must be a whole number.');
  if (v < min || v > max) fail(path, `must be between ${min} and ${max}.`);
  return v;
}

function bool(v: unknown, path: string): boolean {
  if (typeof v !== 'boolean') fail(path, 'must be true or false.');
  return v;
}

function oneOf<T extends string>(v: unknown, options: readonly T[], path: string): T {
  if (typeof v !== 'string' || !(options as readonly string[]).includes(v)) fail(path, 'has an unknown value.');
  return v as T;
}

const TIME = { min: 0, max: 8.64e15 };

function exercise(v: unknown, path: string): Exercise {
  const o = obj(v, path);
  const primary = oneOf<MuscleGroup>(o.primary, MUSCLE_GROUPS, `${path}.primary`);
  const secondary = arr(o.secondary, `${path}.secondary`).map((m, i) =>
    oneOf<MuscleGroup>(m, MUSCLE_GROUPS, `${path}.secondary[${i}]`),
  );
  const cues = arr(o.cues, `${path}.cues`).map((c, i) => str(c, `${path}.cues[${i}]`, { max: 200 }));
  if (cues.length > MAX_CUES) fail(`${path}.cues`, `has more than ${MAX_CUES} cues.`);
  return {
    id: str(o.id, `${path}.id`, { min: 1 }),
    name: str(o.name, `${path}.name`, { min: 1, max: 80 }),
    primary,
    secondary: [...new Set(secondary)].filter((m) => m !== primary),
    equipment: oneOf<Equipment>(o.equipment, EQUIPMENT, `${path}.equipment`),
    cues,
    builtIn: bool(o.builtIn, `${path}.builtIn`),
    edited: bool(o.edited, `${path}.edited`),
    createdAt: num(o.createdAt, `${path}.createdAt`, TIME),
    updatedAt: num(o.updatedAt, `${path}.updatedAt`, TIME),
  };
}

function routine(v: unknown, path: string, exerciseIds: Set<string>): Routine {
  const o = obj(v, path);
  return {
    id: str(o.id, `${path}.id`, { min: 1 }),
    name: str(o.name, `${path}.name`, { min: 1, max: 80 }),
    order: num(o.order, `${path}.order`, { int: true }),
    exercises: arr(o.exercises, `${path}.exercises`).map((e, i) => {
      const p = `${path}.exercises[${i}]`;
      const eo = obj(e, p);
      const exerciseId = str(eo.exerciseId, `${p}.exerciseId`, { min: 1 });
      if (!exerciseIds.has(exerciseId)) fail(`${p}.exerciseId`, 'points to an exercise that is not in the file.');
      return { exerciseId, sets: num(eo.sets, `${p}.sets`, { min: 1, max: 50, int: true }) };
    }),
    createdAt: num(o.createdAt, `${path}.createdAt`, TIME),
    updatedAt: num(o.updatedAt, `${path}.updatedAt`, TIME),
  };
}

function setEntry(v: unknown, path: string): SetEntry {
  const o = obj(v, path);
  return {
    weight: num(o.weight, `${path}.weight`, { min: 0, max: MAX_WEIGHT }),
    reps: num(o.reps, `${path}.reps`, { min: 0, max: MAX_REPS, int: true }),
    done: bool(o.done, `${path}.done`),
  };
}

function workout(v: unknown, path: string, exerciseIds: Set<string>): Workout {
  const o = obj(v, path);
  const startedAt = num(o.startedAt, `${path}.startedAt`, TIME);
  const endedAt = num(o.endedAt, `${path}.endedAt`, TIME);
  if (endedAt < startedAt) fail(`${path}.endedAt`, 'is before the start time.');
  if (o.routineId !== null && typeof o.routineId !== 'string') fail(`${path}.routineId`, 'must be text or empty.');
  const exercises = arr(o.exercises, `${path}.exercises`).map((e, i) => {
    const p = `${path}.exercises[${i}]`;
    const eo = obj(e, p);
    const exerciseId = str(eo.exerciseId, `${p}.exerciseId`, { min: 1 });
    if (!exerciseIds.has(exerciseId)) fail(`${p}.exerciseId`, 'points to an exercise that is not in the file.');
    return { exerciseId, sets: arr(eo.sets, `${p}.sets`).map((s, j) => setEntry(s, `${p}.sets[${j}]`)) };
  });
  return {
    id: str(o.id, `${path}.id`, { min: 1 }),
    name: str(o.name, `${path}.name`, { max: 80 }),
    routineId: o.routineId as string | null,
    startedAt,
    endedAt,
    exercises,
    // Always rebuilt from the exercises rather than trusted from the file.
    exerciseIds: uniqueIds(exercises),
  };
}

function uniqueBy<T extends { id: string }>(list: T[], path: string): T[] {
  const seen = new Set<string>();
  list.forEach((x, i) => {
    if (seen.has(x.id)) fail(`${path}[${i}].id`, 'is a duplicate.');
    seen.add(x.id);
  });
  return list;
}

/**
 * Upgrades data from older schema versions to the current shape. There is
 * only one version so far; add a step here for each future schema change.
 */
function migrate(data: Obj, fromVersion: number): Obj {
  void fromVersion;
  return data;
}

function settingsFrom(v: unknown): BackupSettings | undefined {
  if (v === undefined) return undefined;
  const o = obj(v, 'settings');
  if (o.muscleGoals === undefined) return {};
  const g = obj(o.muscleGoals, 'settings.muscleGoals');
  for (const k of TARGET_GROUPS) {
    if (g[k] !== undefined) num(g[k], `settings.muscleGoals.${k}`, { min: MIN_GOAL, max: MAX_GOAL, int: true });
  }
  return { muscleGoals: parseGoals(g) };
}

export type ValidationResult = { ok: true; file: BackupFile; summary: BackupSummary } | { ok: false; error: string };

/** Parses and fully validates a backup file's text. */
export function validateBackup(text: string, currentSchemaVersion: number): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't a valid backup. It couldn't be read as JSON." };
  }
  if (typeof raw !== 'object' || raw === null || (raw as Obj).app !== BACKUP_APP) {
    return { ok: false, error: "This file isn't a Gym Tracker backup." };
  }
  const top = raw as Obj;
  if (typeof top.format !== 'number' || typeof top.schemaVersion !== 'number' || !Number.isInteger(top.schemaVersion) || top.schemaVersion < 1) {
    return { ok: false, error: 'This backup is missing its version information, so it can’t be imported safely.' };
  }
  if (top.format > BACKUP_FORMAT || top.schemaVersion > currentSchemaVersion) {
    return { ok: false, error: 'This backup was made by a newer version of the app. Update the app, then try again.' };
  }

  try {
    const data = migrate(obj(top.data, 'data'), top.schemaVersion);
    const exercises = uniqueBy(arr(data.exercises, 'exercises').map((e, i) => exercise(e, `exercises[${i}]`)), 'exercises');
    const ids = new Set(exercises.map((e) => e.id));
    const routines = uniqueBy(arr(data.routines, 'routines').map((r, i) => routine(r, `routines[${i}]`, ids)), 'routines');
    const workouts = uniqueBy(arr(data.workouts, 'workouts').map((w, i) => workout(w, `workouts[${i}]`, ids)), 'workouts');
    const exportedAt = typeof top.exportedAt === 'string' ? top.exportedAt : '';
    const seedVersion = typeof top.seedVersion === 'number' && Number.isInteger(top.seedVersion) ? top.seedVersion : 0;
    const settings = settingsFrom(top.settings);
    const file: BackupFile = {
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      schemaVersion: currentSchemaVersion,
      exportedAt,
      seedVersion,
      data: { exercises, routines, workouts },
      ...(settings ? { settings } : {}),
    };
    return { ok: true, file, summary: summarize(file) };
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, error: `This backup has a problem and can’t be imported: ${err.message}` };
    throw err;
  }
}
