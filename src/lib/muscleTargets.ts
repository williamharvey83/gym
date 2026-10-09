import type { MuscleGroup, SetEntry } from '../db/types.ts';

/*
  Weekly set targets. These use their own, coarser groups: lats, upper back,
  and lower back roll up into "back". Everything else maps one to one. The
  library keeps the detailed muscles; only this feature uses the roll-up.
*/

export const TARGET_GROUPS = [
  'chest',
  'back',
  'traps',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
] as const;
export type TargetGroup = (typeof TARGET_GROUPS)[number];

export const TARGET_LABELS: Record<TargetGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  traps: 'Traps',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
};

export type Goals = Record<TargetGroup, number>;

export const DEFAULT_GOALS: Goals = {
  chest: 12,
  back: 12,
  traps: 6,
  shoulders: 6,
  biceps: 6,
  triceps: 6,
  forearms: 6,
  abs: 6,
  quads: 6,
  hamstrings: 6,
  glutes: 6,
  calves: 6,
};

export const MIN_GOAL = 1;
export const MAX_GOAL = 40;

export function toTargetGroup(m: MuscleGroup): TargetGroup {
  return m === 'lats' || m === 'upperBack' || m === 'lowerBack' ? 'back' : m;
}

export type GoalStatus = 'none' | 'partial' | 'met';

export function goalStatus(sets: number, goal: number): GoalStatus {
  if (sets <= 0) return 'none';
  return sets >= goal ? 'met' : 'partial';
}

export function emptyCounts(): Goals {
  return Object.fromEntries(TARGET_GROUPS.map((g) => [g, 0])) as Goals;
}

type Countable = { exerciseId: string; sets: readonly Pick<SetEntry, 'done'>[] };

/**
 * Checked sets per target group, by each exercise's primary muscle. Pass the
 * finished workouts for the week plus, for the current week, the exercises of
 * the workout in progress (their checked sets count live).
 */
export function weeklySetCounts(
  workouts: readonly { exercises: readonly Countable[] }[],
  inProgress: readonly Countable[],
  primaryOf: (exerciseId: string) => MuscleGroup | undefined,
): Goals {
  const counts = emptyCounts();
  const add = (e: Countable) => {
    const m = primaryOf(e.exerciseId);
    if (m) counts[toTargetGroup(m)] += e.sets.filter((s) => s.done).length;
  };
  for (const w of workouts) w.exercises.forEach(add);
  inProgress.forEach(add);
  return counts;
}

/** Reads saved goals, falling back to defaults for anything missing or invalid. */
export function parseGoals(raw: unknown): Goals {
  const out = { ...DEFAULT_GOALS };
  if (typeof raw !== 'object' || raw === null) return out;
  for (const g of TARGET_GROUPS) {
    const v = (raw as Record<string, unknown>)[g];
    if (typeof v === 'number' && Number.isInteger(v) && v >= MIN_GOAL && v <= MAX_GOAL) out[g] = v;
  }
  return out;
}

export function goalsMet(counts: Goals, goals: Goals): number {
  return TARGET_GROUPS.filter((g) => goalStatus(counts[g], goals[g]) === 'met').length;
}
