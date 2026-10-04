import { useMemo, useState } from 'react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BackIcon, ChevronIcon } from '../icons.tsx';
import { MUSCLE_LABELS, type MuscleGroup, type Workout } from '../../db/types.ts';
import { cssVar } from '../../lib/cssVar.ts';
import { formatCompactLb, formatShortDate, formatVolume } from '../../lib/format.ts';
import { addWeeks, startOfWeek, volumeByMuscle, type MuscleVolume } from '../../lib/stats.ts';

type Row = MuscleVolume & { label: string };
type TipProps = { active?: boolean; payload?: readonly { payload?: Row }[] };

function Tip({ active, payload }: TipProps) {
  const r = active ? payload?.[0]?.payload : undefined;
  if (!r) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{r.label}</div>
      <div className="chart-tip-row">
        <strong>{formatVolume(r.volume)}</strong>
      </div>
      <div className="chart-tip-row">
        {r.sets} {r.sets === 1 ? 'set' : 'sets'}
      </div>
    </div>
  );
}

export default function WeeklyVolumeChart({
  workouts,
  primaryOf,
  now,
}: {
  workouts: Workout[];
  primaryOf: (id: string) => MuscleGroup | undefined;
  now: number;
}) {
  const thisWeek = startOfWeek(now);
  const [week, setWeek] = useState(thisWeek);
  const earliest = workouts.length ? startOfWeek(Math.min(...workouts.map((w) => w.startedAt))) : thisWeek;

  const rows: Row[] = useMemo(
    () =>
      volumeByMuscle(workouts, primaryOf, week, addWeeks(week, 1)).map((r) => ({ ...r, label: MUSCLE_LABELS[r.muscle] })),
    [workouts, primaryOf, week],
  );
  const total = rows.reduce((n, r) => n + r.volume, 0);
  const sets = rows.reduce((n, r) => n + r.sets, 0);

  const flow = cssVar('--flow');
  const iron = cssVar('--iron');
  const muted = cssVar('--text-muted');

  const title = week === thisWeek ? 'This week' : week === addWeeks(thisWeek, -1) ? 'Last week' : `Week of ${formatShortDate(week)}`;

  return (
    <div>
      <div className="week-nav">
        <button
          type="button"
          className="icon-btn"
          aria-label="Previous week"
          disabled={week <= earliest}
          onClick={() => setWeek(addWeeks(week, -1))}
        >
          <BackIcon size={22} />
        </button>
        <div className="week-nav-label" aria-live="polite">
          <span className="week-nav-title">{title}</span>
          <span className="week-nav-sub">
            {formatShortDate(week)} – {formatShortDate(addWeeks(week, 1) - 1)}
          </span>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Next week"
          disabled={week >= thisWeek}
          onClick={() => setWeek(addWeeks(week, 1))}
        >
          <ChevronIcon size={22} />
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="muted chart-empty">No sets logged this week.</p>
      ) : (
        <>
          <p className="chart-headline">
            <strong>{formatVolume(total)}</strong> <span className="muted">· {sets} sets</span>
          </p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={rows.length * 34 + 8}>
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }} barCategoryGap={8}>
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={92}
                  tick={{ fill: iron, fontSize: 13 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<Tip />} cursor={{ fill: 'rgba(0,76,153,0.08)' }} isAnimationActive={false} />
                <Bar dataKey="volume" fill={flow} radius={[0, 4, 4, 0]} maxBarSize={18} minPointSize={2} isAnimationActive={false}>
                  <LabelList
                    dataKey="volume"
                    position="right"
                    formatter={(v: unknown) => formatCompactLb(Number(v))}
                    style={{ fill: muted, fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="visually-hidden">
            <caption>Volume by primary muscle, {title.toLowerCase()}</caption>
            <tbody>
              {rows.map((r) => (
                <tr key={r.muscle}>
                  <th scope="row">{r.label}</th>
                  <td>{formatVolume(r.volume)}</td>
                  <td>{r.sets} sets</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p className="chart-note muted">Counts each exercise's primary muscle only. Bodyweight lifts count added weight.</p>
    </div>
  );
}
