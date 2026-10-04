import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { Workout } from '../../db/types.ts';
import { formatDate, plural } from '../../lib/format.ts';
import { addMonths, dayKey, heatLevel, startOfDay, startOfMonth, workoutSetCount } from '../../lib/stats.ts';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Day = { key: string; ms: number; sets: number; future: boolean };
type Month = { start: number; lead: number; days: Day[]; workouts: Workout[] };

function buildMonth(start: number, today: number, setsByDay: Map<string, number>, workouts: Workout[]): Month {
  const first = new Date(start);
  const lead = (first.getDay() + 6) % 7; // blank cells before the 1st (weeks start Monday)
  const days: Day[] = [];
  for (let d = new Date(first); d.getMonth() === first.getMonth(); d.setDate(d.getDate() + 1)) {
    const ms = d.getTime();
    const key = dayKey(ms);
    days.push({ key, ms, sets: setsByDay.get(key) ?? 0, future: ms > today });
  }
  const end = addMonths(start, 1);
  return { start, lead, days, workouts: workouts.filter((w) => w.startedAt >= start && w.startedAt < end) };
}

/**
 * 12 small month grids, shaded by completed sets per day. Each month is one
 * large tap target (day squares are too small to tap reliably); tapping it
 * lists that month's workouts below.
 */
export default function ActivityCalendar({ workouts, now }: { workouts: Workout[]; now: number }) {
  const today = startOfDay(now);
  const [selected, setSelected] = useState<number | null>(null);

  const setsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of workouts) {
      const k = dayKey(w.startedAt);
      m.set(k, (m.get(k) ?? 0) + workoutSetCount(w));
    }
    return m;
  }, [workouts]);

  const months = useMemo(() => {
    const last = startOfMonth(now);
    return Array.from({ length: 12 }, (_, i) => buildMonth(addMonths(last, i - 11), today, setsByDay, workouts));
  }, [now, today, setsByDay, workouts]);

  const daysTrained = months.reduce((n, m) => n + m.days.filter((d) => d.sets > 0).length, 0);
  const sel = months.find((m) => m.start === selected);

  return (
    <div>
      <p className="chart-headline">
        <strong>{daysTrained}</strong> <span className="muted">days trained in the past 12 months</span>
      </p>

      <div className="cal-grid">
        {months.map((m) => {
          const long = new Date(m.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          const trained = m.days.filter((d) => d.sets > 0).length;
          return (
            <button
              key={m.start}
              type="button"
              className={selected === m.start ? 'cal-month sel' : 'cal-month'}
              aria-pressed={selected === m.start}
              aria-label={`${long}: ${plural(m.workouts.length, 'workout')} on ${plural(trained, 'day')}`}
              onClick={() => setSelected(selected === m.start ? null : m.start)}
            >
              <span className="cal-month-name">{new Date(m.start).toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="cal-days" aria-hidden="true">
                {DOW.map((d, i) => (
                  <span key={`h${i}`} className="cal-dow">
                    {d}
                  </span>
                ))}
                {Array.from({ length: m.lead }, (_, i) => (
                  <span key={`b${i}`} />
                ))}
                {m.days.map((d) => (
                  <span
                    key={d.key}
                    className={`cal-day l${heatLevel(d.sets)}${d.ms === today ? ' today' : ''}${d.future ? ' future' : ''}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="cal-legend" aria-hidden="true">
        <span>Fewer sets</span>
        <span className="cal-day l0" />
        <span className="cal-day l1" />
        <span className="cal-day l2" />
        <span className="cal-day l3" />
        <span>More</span>
      </div>

      <div className="cal-readout" aria-live="polite">
        {sel ? (
          <>
            <strong>
              {new Date(sel.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·{' '}
              {plural(sel.workouts.length, 'workout')}
            </strong>
            {sel.workouts.length > 0 ? (
              <ul className="list cal-list">
                {[...sel.workouts].reverse().map((w) => (
                  <li key={w.id}>
                    <Link to={`/history/${w.id}`} className="row">
                      <span className="row-main">
                        <span className="row-title">{w.name}</span>
                        <span className="row-sub">
                          {formatDate(w.startedAt)} · {plural(workoutSetCount(w), 'set')}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No workouts this month.</p>
            )}
          </>
        ) : (
          <span className="muted">Tap a month to list its workouts.</span>
        )}
      </div>
    </div>
  );
}
