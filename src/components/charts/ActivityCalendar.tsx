import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { Workout } from '../../db/types.ts';
import { formatDate } from '../../lib/format.ts';
import { addMonths, dayKey, heatLevel, startOfDay, startOfMonth, workoutSetCount } from '../../lib/stats.ts';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Day = { key: string; ms: number; sets: number; future: boolean };

function monthDays(monthStart: number, today: number, setsByDay: Map<string, number>): { lead: number; days: Day[] } {
  const first = new Date(monthStart);
  const lead = (first.getDay() + 6) % 7; // blank cells before the 1st (weeks start Monday)
  const days: Day[] = [];
  for (let d = new Date(first); d.getMonth() === first.getMonth(); d.setDate(d.getDate() + 1)) {
    const ms = d.getTime();
    const key = dayKey(ms);
    days.push({ key, ms, sets: setsByDay.get(key) ?? 0, future: ms > today });
  }
  return { lead, days };
}

/** 12 small month grids, shaded by completed sets per day. Tap a day for details. */
export default function ActivityCalendar({ workouts, now }: { workouts: Workout[]; now: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const today = startOfDay(now);

  const byDay = useMemo(() => {
    const m = new Map<string, Workout[]>();
    for (const w of workouts) {
      const k = dayKey(w.startedAt);
      m.set(k, [...(m.get(k) ?? []), w]);
    }
    return m;
  }, [workouts]);

  const setsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const [k, ws] of byDay) m.set(k, ws.reduce((n, w) => n + workoutSetCount(w), 0));
    return m;
  }, [byDay]);

  const months = useMemo(() => {
    const last = startOfMonth(now);
    return Array.from({ length: 12 }, (_, i) => addMonths(last, i - 11));
  }, [now]);

  const daysTrained = months.reduce((n, m) => n + monthDays(m, today, setsByDay).days.filter((d) => d.sets > 0).length, 0);
  const sel = selected ? byDay.get(selected) : undefined;

  return (
    <div>
      <p className="chart-headline">
        <strong>{daysTrained}</strong> <span className="muted">days trained in the past 12 months</span>
      </p>

      <div className="cal-grid">
        {months.map((m) => {
          const { lead, days } = monthDays(m, today, setsByDay);
          const name = new Date(m).toLocaleDateString('en-US', { month: 'short' });
          return (
            <div key={m} className="cal-month">
              <div className="cal-month-name">{name}</div>
              <div className="cal-days" role="group" aria-label={new Date(m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
                {DOW.map((d, i) => (
                  <span key={`h${i}`} className="cal-dow" aria-hidden="true">
                    {d}
                  </span>
                ))}
                {Array.from({ length: lead }, (_, i) => (
                  <span key={`b${i}`} />
                ))}
                {days.map((d) => {
                  const level = heatLevel(d.sets);
                  const label = `${formatDate(d.ms)}: ${d.sets === 0 ? 'no workout' : `${d.sets} sets`}`;
                  if (d.future) return <span key={d.key} className="cal-day future" aria-hidden="true" />;
                  return d.sets > 0 ? (
                    <button
                      key={d.key}
                      type="button"
                      className={`cal-day l${level}${selected === d.key ? ' sel' : ''}`}
                      aria-label={label}
                      aria-pressed={selected === d.key}
                      onClick={() => setSelected(selected === d.key ? null : d.key)}
                    />
                  ) : (
                    <span key={d.key} className={`cal-day l0${d.ms === today ? ' today' : ''}`} title={label} />
                  );
                })}
              </div>
            </div>
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
        {sel && selected ? (
          <>
            <strong>{formatDate(sel[0]!.startedAt)}</strong>
            <ul>
              {sel.map((w) => (
                <li key={w.id}>
                  <Link to={`/history/${w.id}`}>{w.name}</Link> · {workoutSetCount(w)} sets
                </li>
              ))}
            </ul>
          </>
        ) : (
          <span className="muted">Tap a shaded day to see that workout.</span>
        )}
      </div>
    </div>
  );
}
