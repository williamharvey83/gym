import { useState } from 'react';
import { Link } from 'react-router';
import BodyMap, { STATUS_FILL } from './BodyMap.tsx';
import { BackIcon, ChevronIcon } from './icons.tsx';
import { useWeeklySets } from '../db/weeklySets.ts';
import { formatShortDate, plural } from '../lib/format.ts';
import { TARGET_GROUPS, TARGET_LABELS, goalStatus, goalsMet, type GoalStatus, type TargetGroup } from '../lib/muscleTargets.ts';
import { addWeeks, startOfWeek } from '../lib/stats.ts';

/** Progress ring: gray track, amber arc while in progress, full blue with a check when met. */
function StatusRing({ status, fraction }: { status: GoalStatus; fraction: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg className="status-ring" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      {status === 'met' ? (
        <>
          <circle cx="12" cy="12" r="11" fill={STATUS_FILL.met} />
          <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r={r} fill="none" stroke="#C3C8CF" strokeWidth="4" />
          {status === 'partial' && (
            <circle
              cx="12"
              cy="12"
              r={r}
              fill="none"
              stroke={STATUS_FILL.partial}
              strokeWidth="4"
              strokeDasharray={`${c * Math.min(1, fraction)} ${c}`}
              transform="rotate(-90 12 12)"
            />
          )}
        </>
      )}
    </svg>
  );
}

const LEGEND: { status: GoalStatus; label: string; fraction: number }[] = [
  { status: 'none', label: 'No sets', fraction: 0 },
  { status: 'partial', label: 'In progress', fraction: 0.5 },
  { status: 'met', label: 'Goal met', fraction: 1 },
];

/**
 * This week's checked sets per muscle group against the goals.
 * `navigable` adds arrows to look at past weeks.
 */
export default function WeeklySetsCard({
  navigable = false,
  earliest,
}: {
  navigable?: boolean;
  /** Start of the oldest workout, which limits how far back the arrows go. */
  earliest?: number | undefined;
}) {
  const thisWeek = startOfWeek(Date.now());
  const [week, setWeek] = useState(thisWeek);
  const [selected, setSelected] = useState<TargetGroup | null>(null);
  const data = useWeeklySets(week);

  const title = week === thisWeek ? 'This week' : week === addWeeks(thisWeek, -1) ? 'Last week' : `Week of ${formatShortDate(week)}`;
  const range = `${formatShortDate(week)} – ${formatShortDate(addWeeks(week, 1) - 1)}`;

  const pick = (g: TargetGroup) => setSelected((s) => (s === g ? null : g));

  return (
    <div className="weekly-sets">
      {navigable ? (
        <div className="week-nav">
          <button
            type="button"
            className="icon-btn"
            aria-label="Previous week"
            disabled={earliest === undefined || week <= startOfWeek(earliest)}
            onClick={() => setWeek(addWeeks(week, -1))}
          >
            <BackIcon size={22} />
          </button>
          <div className="week-nav-label" aria-live="polite">
            <span className="week-nav-title">{title}</span>
            <span className="week-nav-sub">{range}</span>
          </div>
          <button type="button" className="icon-btn" aria-label="Next week" disabled={week >= thisWeek} onClick={() => setWeek(addWeeks(week, 1))}>
            <ChevronIcon size={22} />
          </button>
        </div>
      ) : (
        <p className="week-nav-sub weekly-range">{range} · resets Monday 12:00 AM</p>
      )}

      {data && (
        <>
          <p className="chart-headline">
            <strong>
              {goalsMet(data.counts, data.goals)} of {TARGET_GROUPS.length}
            </strong>{' '}
            <span className="muted">set goals met</span>
          </p>

          <BodyMap counts={data.counts} goals={data.goals} selected={selected} onSelect={pick} />

          <div className="body-legend" aria-hidden="true">
            {LEGEND.map((l) => (
              <span key={l.status} className="body-legend-item">
                <span className="body-swatch" style={{ background: STATUS_FILL[l.status] }} />
                {l.label}
              </span>
            ))}
          </div>

          <p className="body-readout" aria-live="polite">
            {selected ? (
              <>
                <strong>{TARGET_LABELS[selected]}</strong> · {data.counts[selected]} of {plural(data.goals[selected], 'set')}
                {data.counts[selected] < data.goals[selected]
                  ? ` · ${data.goals[selected] - data.counts[selected]} to go`
                  : ' · goal met'}
              </>
            ) : (
              <span className="muted">Tap a muscle or a row to see its count.</span>
            )}
          </p>

          <ul className="target-list">
            {TARGET_GROUPS.map((g) => {
              const n = data.counts[g];
              const goal = data.goals[g];
              const status = goalStatus(n, goal);
              const statusText = status === 'met' ? 'goal met' : status === 'partial' ? 'in progress' : 'no sets yet';
              return (
                <li key={g}>
                  <button
                    type="button"
                    className={selected === g ? 'target-row sel' : 'target-row'}
                    aria-pressed={selected === g}
                    aria-label={`${TARGET_LABELS[g]}: ${n} of ${goal} sets, ${statusText}`}
                    onClick={() => pick(g)}
                  >
                    <StatusRing status={status} fraction={n / goal} />
                    <span className="target-text">
                      <span className="target-name">{TARGET_LABELS[g]}</span>
                      <span className="target-count">
                        {n} <span className="muted">/ {plural(goal, 'set')}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Link to="/settings" state={{ scrollTo: 'goals' }} className="btn btn-ghost goals-link">
            Edit set goals
          </Link>
        </>
      )}
    </div>
  );
}
