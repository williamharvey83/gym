import type {
  ActiveWorkout,
  DraftExercise,
  DraftSet,
  Routine,
  RoutineExercise,
  SetEntry,
  Workout,
  WorkoutExercise,
} from '../db/types.ts';

/** What you did for one exercise in your most recent session with it. */
export type LastSession = { workoutId: string; startedAt: number; sets: SetEntry[] };
export type LastSessions = ReadonlyMap<string, LastSession>;

export function newKey(): string {
  return crypto.randomUUID();
}

export function emptySet(): DraftSet {
  return { key: newKey(), weight: null, reps: null, done: false };
}

function copySet(src: { weight: number | null; reps: number | null }): DraftSet {
  return { key: newKey(), weight: src.weight, reps: src.reps, done: false };
}

/** All sets logged for an exercise in one workout, in order. */
export function setsForExercise(w: Pick<Workout, 'exercises'>, exerciseId: string): SetEntry[] {
  return w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets);
}

/**
 * `count` sets prefilled from last session: set i copies last session's set i,
 * or its final set if this time has more sets. Empty if there's no history.
 */
export function setsFromHistory(last: readonly SetEntry[] | undefined, count: number): DraftSet[] {
  const out: DraftSet[] = [];
  for (let i = 0; i < Math.max(1, count); i++) {
    const src = last?.[i] ?? last?.[last.length - 1];
    out.push(src ? copySet(src) : emptySet());
  }
  return out;
}

/**
 * The next set to add. Prefers last session's matching set, then a copy of the
 * set above it, then blank.
 */
export function nextSet(current: readonly DraftSet[], last: readonly SetEntry[] | undefined): DraftSet {
  const src = last?.[current.length] ?? current[current.length - 1] ?? last?.[last.length - 1];
  return src ? copySet(src) : emptySet();
}

/**
 * After a set is checked, copies its numbers into the completely blank,
 * unchecked sets below it, so the rest need just a tap each.
 */
export function fillBlanksBelow(sets: readonly DraftSet[], index: number): DraftSet[] {
  const src = sets[index];
  if (!src) return [...sets];
  return sets.map((s, i) =>
    i > index && !s.done && s.weight === null && s.reps === null ? { ...s, weight: src.weight, reps: src.reps } : s,
  );
}

/** An exercise added mid-workout: same number of sets as last time, or one. */
export function newDraftExercise(exerciseId: string, last: readonly SetEntry[] | undefined): DraftExercise {
  return { key: newKey(), exerciseId, sets: setsFromHistory(last, last?.length || 1) };
}

export function startEmpty(now: number): ActiveWorkout {
  return { key: 'current', name: 'Workout', routineId: null, startedAt: now, exercises: [] };
}

export function startFromRoutine(routine: Routine, last: LastSessions, now: number): ActiveWorkout {
  return {
    key: 'current',
    name: routine.name,
    routineId: routine.id,
    startedAt: now,
    exercises: routine.exercises.map((re) => ({
      key: newKey(),
      exerciseId: re.exerciseId,
      sets: setsFromHistory(last.get(re.exerciseId)?.sets, re.sets),
    })),
  };
}

function isComplete(s: DraftSet): s is DraftSet & { weight: number; reps: number } {
  return s.done && s.weight !== null && s.reps !== null;
}

/** Turns the in-progress workout into a saved one. Only checked sets are kept. */
export function toSavedWorkout(
  active: ActiveWorkout,
  id: string,
  endedAt: number,
): { workout: Workout; savedSets: number; skippedSets: number } {
  let savedSets = 0;
  let skippedSets = 0;
  const exercises: WorkoutExercise[] = [];
  for (const ex of active.exercises) {
    const sets = ex.sets.filter(isComplete).map((s) => ({ weight: s.weight, reps: s.reps, done: true }));
    savedSets += sets.length;
    skippedSets += ex.sets.length - sets.length;
    if (sets.length > 0) exercises.push({ exerciseId: ex.exerciseId, sets });
  }
  return {
    workout: {
      id,
      name: active.name.trim() || 'Workout',
      routineId: active.routineId,
      startedAt: active.startedAt,
      endedAt: Math.max(endedAt, active.startedAt),
      exercises,
      exerciseIds: uniqueIds(exercises),
    },
    savedSets,
    skippedSets,
  };
}

export function uniqueIds(exercises: readonly { exerciseId: string }[]): string[] {
  return [...new Set(exercises.map((e) => e.exerciseId))];
}

/** The routine this workout would become: exercises in order with their set counts. */
export function routineShape(exercises: readonly DraftExercise[]): RoutineExercise[] {
  return exercises.map((e) => ({ exerciseId: e.exerciseId, sets: Math.max(1, e.sets.length) }));
}

export function routineChanged(planned: readonly RoutineExercise[], actual: readonly RoutineExercise[]): boolean {
  return (
    planned.length !== actual.length ||
    planned.some((p, i) => p.exerciseId !== actual[i]?.exerciseId || p.sets !== actual[i]?.sets)
  );
}

/** Saved workout -> editable form (for editing past workouts). */
export function toDraftExercises(w: Pick<Workout, 'exercises'>): DraftExercise[] {
  return w.exercises.map((e) => ({
    key: newKey(),
    exerciseId: e.exerciseId,
    sets: e.sets.map((s) => ({ key: newKey(), weight: s.weight, reps: s.reps, done: true })),
  }));
}

/** Editable form -> saved exercises. Every set needs weight and reps. */
export function fromDraftExercises(
  exercises: readonly DraftExercise[],
): { ok: true; value: WorkoutExercise[] } | { ok: false; error: string } {
  const value: WorkoutExercise[] = [];
  for (const ex of exercises) {
    const sets: SetEntry[] = [];
    for (const s of ex.sets) {
      if (s.weight === null || s.reps === null) return { ok: false, error: 'Fill in weight and reps for every set, or delete the empty ones.' };
      sets.push({ weight: s.weight, reps: s.reps, done: true });
    }
    if (sets.length > 0) value.push({ exerciseId: ex.exerciseId, sets });
  }
  if (value.length === 0) return { ok: false, error: 'A workout needs at least one set.' };
  return { ok: true, value };
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1) as [T];
  next.splice(to, 0, item);
  return next;
}

// ---------- Date and time inputs (local time) ----------

const pad = (n: number) => String(n).padStart(2, '0');

/** ms -> "2026-10-04" */
export function toDateInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ms -> "18:05" */
export function toTimeInput(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combine(date: string, time: string): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})/.exec(time);
  if (!dm || !tm) return null;
  const d = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]));
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** Start and end from form inputs. An end time before the start means it ran past midnight. */
export function timesFromInputs(date: string, start: string, end: string): { startedAt: number; endedAt: number } | null {
  const startedAt = combine(date, start);
  let endedAt = combine(date, end);
  if (startedAt === null || endedAt === null) return null;
  if (endedAt < startedAt) {
    const e = new Date(endedAt);
    e.setDate(e.getDate() + 1);
    endedAt = e.getTime();
  }
  return { startedAt, endedAt };
}
