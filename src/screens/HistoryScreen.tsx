import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import ProgressTabs from '../components/ProgressTabs.tsx';
import { ChartIcon, ChevronIcon } from '../components/icons.tsx';
import { db } from '../db/db.ts';
import type { Workout } from '../db/types.ts';
import { formatDuration, formatVolume } from '../lib/format.ts';
import { workoutSetCount, workoutVolume } from '../lib/stats.ts';

function groupByMonth(workouts: Workout[]): { label: string; items: Workout[] }[] {
  const groups: { label: string; items: Workout[] }[] = [];
  for (const w of workouts) {
    const label = new Date(w.startedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(w);
    else groups.push({ label, items: [w] });
  }
  return groups;
}

export default function HistoryScreen() {
  const workouts = useLiveQuery(() => db.workouts.orderBy('startedAt').reverse().toArray(), []);

  return (
    <Screen title="Progress">
      <ProgressTabs current="history" />
      {workouts === undefined ? null : workouts.length === 0 ? (
        <EmptyState
          icon={<ChartIcon size={40} />}
          title="No workouts yet"
          hint="Every workout you finish is listed here by date. Start one from the Workout tab."
          action={
            <Link to="/workout" className="btn btn-primary">
              Go to Workout
            </Link>
          }
        />
      ) : (
        groupByMonth(workouts).map((g) => (
          <section key={g.label} className="section history-month" aria-label={g.label}>
            <h2 className="section-title">
              {g.label} <span className="history-count">· {g.items.length}</span>
            </h2>
            <ul className="list">
              {g.items.map((w) => {
                const d = new Date(w.startedAt);
                return (
                  <li key={w.id}>
                    <Link to={`/history/${w.id}`} className="row">
                      <span className="day-chip" aria-hidden="true">
                        <span className="day-chip-dow">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="day-chip-num">{d.getDate()}</span>
                      </span>
                      <span className="row-main">
                        <span className="row-title">{w.name}</span>
                        <span className="row-sub">
                          <span className="visually-hidden">
                            {d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} ·{' '}
                          </span>
                          {formatDuration(w.endedAt - w.startedAt)} · {workoutSetCount(w)} sets · {formatVolume(workoutVolume(w))}
                        </span>
                      </span>
                      <ChevronIcon size={20} className="row-chevron" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </Screen>
  );
}
