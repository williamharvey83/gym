import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import ProgressTabs from '../components/ProgressTabs.tsx';
import { ChartIcon } from '../components/icons.tsx';
import ExerciseProgressChart from '../components/charts/ExerciseProgressChart.tsx';
import WeeklyVolumeChart from '../components/charts/WeeklyVolumeChart.tsx';
import ActivityCalendar from '../components/charts/ActivityCalendar.tsx';
import WeeklySetsCard from '../components/WeeklySetsCard.tsx';
import { db } from '../db/db.ts';
import type { Exercise } from '../db/types.ts';
import { exerciseSeries, exercisesByRecency, weekStreaks, workoutCounts } from '../lib/stats.ts';

function Stat({ value, label, badge }: { value: string | number; label: string; badge?: string | undefined }) {
  return (
    <div className="card stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">
        {label}
        {badge && <span className="tag tag-signal stat-badge">{badge}</span>}
      </span>
    </div>
  );
}

export default function ProgressScreen() {
  const workouts = useLiveQuery(() => db.workouts.orderBy('startedAt').toArray(), []);
  const exercises = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e] as const)), []);
  // Fixed per visit so every card agrees on what "now" is.
  const [now] = useState(() => Date.now());
  const [picked, setPicked] = useState<string | null>(null);

  const primaryOf = useCallback((id: string) => exercises?.get(id)?.primary, [exercises]);

  const starts = useMemo(() => workouts?.map((w) => w.startedAt) ?? [], [workouts]);
  const counts = workoutCounts(starts, now);
  const streaks = weekStreaks(starts, now);

  const trained = useMemo(
    () => (workouts && exercises ? exercisesByRecency(workouts).filter((id) => exercises.has(id)) : []),
    [workouts, exercises],
  );
  const exerciseId = picked && trained.includes(picked) ? picked : trained[0];
  const series = useMemo(
    () => (workouts && exerciseId ? exerciseSeries(workouts, exerciseId) : []),
    [workouts, exerciseId],
  );

  if (!workouts || !exercises) return null;

  if (workouts.length === 0) {
    return (
      <Screen title="Progress">
        <ProgressTabs current="overview" />
        <EmptyState
          icon={<ChartIcon size={40} />}
          title="No workouts logged yet"
          hint="Finish your first workout and your charts, streaks, and history will show up here."
          action={
            <Link to="/workout" className="btn btn-primary">
              Go to Workout
            </Link>
          }
        />
      </Screen>
    );
  }

  const options = trained.map((id) => exercises.get(id)).filter((e): e is Exercise => !!e);
  const weeks = (n: number) => `${n} ${n === 1 ? 'week' : 'weeks'}`;

  return (
    <Screen title="Progress">
      <ProgressTabs current="overview" />

      <div className="stats">
        <Stat value={counts.week} label="This week" />
        <Stat value={counts.month} label="This month" />
        <Stat value={counts.total} label="Total" />
      </div>
      <div className="stats stats-2">
        <Stat
          value={weeks(streaks.current)}
          label="Current streak"
          badge={streaks.current >= 2 && streaks.current === streaks.longest ? 'Best' : undefined}
        />
        <Stat value={weeks(streaks.longest)} label="Longest streak" />
      </div>

      <section className="card chart-card" aria-labelledby="pg-sets">
        <h2 id="pg-sets" className="chart-title">
          Weekly sets by muscle
        </h2>
        <WeeklySetsCard navigable earliest={starts[0]} />
      </section>

      <section className="card chart-card" aria-labelledby="pg-ex">
        <h2 id="pg-ex" className="chart-title">
          Exercise progress
        </h2>
        <label htmlFor="pg-ex-select" className="visually-hidden">
          Exercise
        </label>
        <select
          id="pg-ex-select"
          className="select"
          value={exerciseId ?? ''}
          onChange={(e) => setPicked(e.target.value)}
        >
          {options.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {exerciseId && <ExerciseProgressChart key={exerciseId} points={series} now={now} />}
      </section>

      <section className="card chart-card" aria-labelledby="pg-vol">
        <h2 id="pg-vol" className="chart-title">
          Weekly volume by muscle
        </h2>
        <WeeklyVolumeChart workouts={workouts} primaryOf={primaryOf} now={now} />
      </section>

      <section className="card chart-card" aria-labelledby="pg-cal">
        <h2 id="pg-cal" className="chart-title">
          Workout calendar
        </h2>
        <ActivityCalendar workouts={workouts} now={now} />
      </section>
    </Screen>
  );
}
