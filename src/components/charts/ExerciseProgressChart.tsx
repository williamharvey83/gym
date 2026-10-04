import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cssVar } from '../../lib/cssVar.ts';
import { formatDate, formatShortDate, formatSet, formatWeight } from '../../lib/format.ts';
import type { ExercisePoint } from '../../lib/stats.ts';

const RANGES = [
  { key: '3M', months: 3 },
  { key: '6M', months: 6 },
  { key: '1Y', months: 12 },
  { key: 'All', months: 0 },
] as const;
type RangeKey = (typeof RANGES)[number]['key'];

const DAY = 86_400_000;
const round1 = (n: number) => Math.round(n * 10) / 10;

function cutoff(months: number, now: number): number {
  if (months === 0) return -Infinity;
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d.getTime();
}

/** Y range padded a little and snapped to 5 lb so gridlines land on round numbers. */
function yDomain(points: ExercisePoint[]): [number, number] {
  const vals = points.flatMap((p) => [p.topWeight, p.e1rm]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max(5, (hi - lo) * 0.1);
  return [Math.max(0, Math.floor((lo - pad) / 5) * 5), Math.ceil((hi + pad) / 5) * 5];
}

type TipProps = { active?: boolean; payload?: readonly { payload?: ExercisePoint }[] };

function Tip({ active, payload }: TipProps) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{formatDate(p.date)}</div>
      <div className="chart-tip-row">
        <span className="key key-solid" aria-hidden="true" />
        Top set <strong>{formatSet(p.topWeight, p.topReps)}</strong>
      </div>
      <div className="chart-tip-row">
        <span className="key key-dashed" aria-hidden="true" />
        Est. 1RM <strong>{formatWeight(round1(p.e1rm))}</strong>
      </div>
    </div>
  );
}

export default function ExerciseProgressChart({ points, now }: { points: ExercisePoint[]; now: number }) {
  const [range, setRange] = useState<RangeKey>('All');
  const [showTable, setShowTable] = useState(false);

  const shown = useMemo(() => {
    const from = cutoff(RANGES.find((r) => r.key === range)?.months ?? 0, now);
    return points.filter((p) => p.date >= from);
  }, [points, range, now]);

  const latest = points[points.length - 1];
  const bestE1rm = Math.max(...points.map((p) => p.e1rm));
  const latestIsBest = !!latest && points.length > 1 && latest.e1rm >= bestE1rm;

  const flow = cssVar('--flow');
  const tonal = cssVar('--tonal');
  const surface = cssVar('--surface');
  const muted = cssVar('--text-muted');

  const xDomain: [number, number] | undefined =
    shown.length === 1 ? [shown[0]!.date - 3 * DAY, shown[0]!.date + 3 * DAY] : undefined;

  return (
    <div>
      {/* Legend that doubles as a direct label of the latest values. */}
      {latest && (
        <div className="chart-legend">
          <div className="legend-item">
            <span className="key key-solid" aria-hidden="true" />
            <span className="legend-name">Top set</span>
            <span className="legend-value">{formatSet(latest.topWeight, latest.topReps)}</span>
          </div>
          <div className="legend-item">
            <span className="key key-dashed" aria-hidden="true" />
            <span className="legend-name">Est. 1RM</span>
            <span className="legend-value">{formatWeight(round1(latest.e1rm))}</span>
            {latestIsBest && <span className="tag tag-signal">Best</span>}
          </div>
        </div>
      )}

      <div className="chips range-chips" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r.key} type="button" className="chip" aria-pressed={range === r.key} onClick={() => setRange(r.key)}>
            {r.key}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="muted chart-empty">No sessions in this range.</p>
      ) : (
        <div className="chart-box" role="img" aria-label={`Line chart of top set and estimated one-rep max over ${shown.length} sessions. Use the data table for exact values.`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={shown} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(20,24,31,0.08)" />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={xDomain ?? ['dataMin', 'dataMax']}
                tickFormatter={(v: number) => formatShortDate(v)}
                tick={{ fill: muted, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(20,24,31,0.2)' }}
                minTickGap={28}
              />
              <YAxis
                domain={yDomain(shown)}
                tick={{ fill: muted, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickCount={5}
                allowDecimals={false}
              />
              <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(20,24,31,0.35)', strokeWidth: 1 }} isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="e1rm"
                name="Est. 1RM"
                stroke={tonal}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: tonal, stroke: surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: tonal, stroke: surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="topWeight"
                name="Top set"
                stroke={flow}
                strokeWidth={2}
                dot={{ r: 4, fill: flow, stroke: surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: flow, stroke: surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {shown.length === 1 && <p className="muted chart-note">Log this exercise again to see a trend.</p>}

      <button type="button" className="btn btn-ghost table-toggle" aria-expanded={showTable} onClick={() => setShowTable(!showTable)}>
        {showTable ? 'Hide data table' : 'Show data table'}
      </button>
      {showTable && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Top set</th>
                <th scope="col">Est. 1RM</th>
              </tr>
            </thead>
            <tbody>
              {[...shown].reverse().map((p) => (
                <tr key={p.workoutId}>
                  <td>{formatShortDate(p.date)}</td>
                  <td>{formatSet(p.topWeight, p.topReps)}</td>
                  <td>{formatWeight(round1(p.e1rm))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
