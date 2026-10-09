import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db.ts';
import { useActiveWorkout } from './activeWorkoutStore.ts';
import { addWeeks, startOfWeek } from '../lib/stats.ts';
import { parseGoals, weeklySetCounts, type Goals } from '../lib/muscleTargets.ts';

/** Must match the key in backupRepo.ts. */
export const META_GOALS = 'muscleGoals';

export async function saveGoals(goals: Goals): Promise<void> {
  await db.meta.put({ key: META_GOALS, value: goals });
}

export function useGoals(): Goals | undefined {
  return useLiveQuery(async () => parseGoals((await db.meta.get(META_GOALS))?.value), []);
}

/**
 * Checked sets per target group for the week starting `weekStart` (Monday
 * 00:00). For the current week, the workout in progress counts live.
 */
export function useWeeklySets(weekStart: number): { counts: Goals; goals: Goals } | undefined {
  const active = useActiveWorkout();
  const data = useLiveQuery(async () => {
    const [workouts, exercises, goalsRow] = await Promise.all([
      db.workouts.where('startedAt').between(weekStart, addWeeks(weekStart, 1), true, false).toArray(),
      db.exercises.toArray(),
      db.meta.get(META_GOALS),
    ]);
    return { workouts, primary: new Map(exercises.map((e) => [e.id, e.primary])), goals: parseGoals(goalsRow?.value) };
  }, [weekStart]);
  if (!data) return undefined;

  const isCurrentWeek = weekStart === startOfWeek(Date.now());
  const live = isCurrentWeek && active ? active.exercises : [];
  return { counts: weeklySetCounts(data.workouts, live, (id) => data.primary.get(id)), goals: data.goals };
}
