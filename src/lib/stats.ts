import type { MuscleGroup, SetEntry, Workout } from '../db/types.ts';
import { setsForExercise } from './workout.ts';

/*
  Progress math. Weeks start on Monday, in local time. Date arithmetic goes
  through Date setters (not "+ 7 * 24h") so daylight-saving changes don't
  shift week boundaries.
*/

// ---------- Strength ----------

/** Epley estimated one-rep max: weight × (1 + reps / 30). Zero reps lifts nothing. */
export function epley1RM(weight: number, reps: number): number {
  return reps <= 0 ? 0 : weight * (1 + reps / 30);
}

/** Heaviest set; ties go to the one with more reps. */
export function topSet(sets: readonly SetEntry[]): SetEntry | null {
  let best: SetEntry | null = null;
  for (const s of sets) {
    if (s.reps <= 0) continue;
    if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) best = s;
  }
  return best;
}

export type ExercisePoint = {
  workoutId: string;
  date: number;
  topWeight: number;
  topReps: number;
  /** Best estimated 1RM across the session's sets (not just the top set). */
  e1rm: number;
};

/** One point per workout that included the exercise, oldest first. */
export function exerciseSeries(workouts: readonly Workout[], exerciseId: string): ExercisePoint[] {
  const out: ExercisePoint[] = [];
  for (const w of workouts) {
    const sets = setsForExercise(w, exerciseId);
    const top = topSet(sets);
    if (!top) continue;
    const e1rm = Math.max(...sets.map((s) => epley1RM(s.weight, s.reps)));
    out.push({ workoutId: w.id, date: w.startedAt, topWeight: top.weight, topReps: top.reps, e1rm });
  }
  return out.sort((a, b) => a.date - b.date);
}

// ---------- Volume ----------

/** Sets × reps × weight, summed. */
export function volume(sets: readonly SetEntry[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function workoutVolume(w: Pick<Workout, 'exercises'>): number {
  return w.exercises.reduce((sum, e) => sum + volume(e.sets), 0);
}

export function workoutSetCount(w: Pick<Workout, 'exercises'>): number {
  return w.exercises.reduce((n, e) => n + e.sets.length, 0);
}

export type MuscleVolume = { muscle: MuscleGroup; volume: number; sets: number };

/**
 * Volume per primary muscle for workouts that started in [from, to).
 * Exercises missing from `primaryOf` (deleted) are skipped. Sorted high to low.
 */
export function volumeByMuscle(
  workouts: readonly Workout[],
  primaryOf: (exerciseId: string) => MuscleGroup | undefined,
  from: number,
  to: number,
): MuscleVolume[] {
  const map = new Map<MuscleGroup, MuscleVolume>();
  for (const w of workouts) {
    if (w.startedAt < from || w.startedAt >= to) continue;
    for (const e of w.exercises) {
      const muscle = primaryOf(e.exerciseId);
      if (!muscle) continue;
      const row = map.get(muscle) ?? { muscle, volume: 0, sets: 0 };
      row.volume += volume(e.sets);
      row.sets += e.sets.length;
      map.set(muscle, row);
    }
  }
  return [...map.values()].sort((a, b) => b.volume - a.volume || b.sets - a.sets);
}

// ---------- Calendar ----------

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Monday 00:00 of the week containing `ms`. */
export function startOfWeek(ms: number): number {
  const d = new Date(startOfDay(ms));
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

export function addWeeks(weekStart: number, n: number): number {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + n * 7);
  return d.getTime();
}

export function startOfMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function addMonths(monthStart: number, n: number): number {
  const d = new Date(monthStart);
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
}

/** "2026-10-04" in local time. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------- Streaks and counts ----------

/**
 * Streaks counted in weeks with at least one workout. The current streak
 * still counts if this week has no workout yet (the week isn't over), as long
 * as last week had one.
 */
export function weekStreaks(workoutStarts: readonly number[], now: number): { current: number; longest: number } {
  const weeks = new Set(workoutStarts.map(startOfWeek));
  if (weeks.size === 0) return { current: 0, longest: 0 };

  let current = 0;
  let w = startOfWeek(now);
  if (!weeks.has(w)) w = addWeeks(w, -1);
  while (weeks.has(w)) {
    current++;
    w = addWeeks(w, -1);
  }

  const sorted = [...weeks].sort((a, b) => a - b);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === addWeeks(sorted[i - 1]!, 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { current, longest: Math.max(longest, current) };
}

export function workoutCounts(workoutStarts: readonly number[], now: number): { week: number; month: number; total: number } {
  const week = startOfWeek(now);
  const month = startOfMonth(now);
  return {
    week: workoutStarts.filter((t) => t >= week && t <= now).length,
    month: workoutStarts.filter((t) => t >= month && t <= now).length,
    total: workoutStarts.length,
  };
}

/** Completed sets per local day. */
export function setsPerDay(workouts: readonly Workout[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const w of workouts) {
    const k = dayKey(w.startedAt);
    out.set(k, (out.get(k) ?? 0) + workoutSetCount(w));
  }
  return out;
}

/** Heat-map shade: 0 none, 1 = 1–9 sets, 2 = 10–19, 3 = 20+. */
export function heatLevel(sets: number): 0 | 1 | 2 | 3 {
  if (sets <= 0) return 0;
  if (sets < 10) return 1;
  if (sets < 20) return 2;
  return 3;
}

/** Exercises that have history, most recently trained first. */
export function exercisesByRecency(workouts: readonly Workout[]): string[] {
  const last = new Map<string, number>();
  for (const w of workouts) {
    for (const id of w.exerciseIds) last.set(id, Math.max(last.get(id) ?? 0, w.startedAt));
  }
  return [...last.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
