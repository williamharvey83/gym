import type { ReactNode } from 'react';
import { TARGET_LABELS, goalStatus, type Goals, type GoalStatus, type TargetGroup } from '../lib/muscleTargets.ts';

/*
  Front and back figures. Each muscle shape is drawn once for the figure's
  right side (viewer's left) and mirrored, so the body stays symmetrical.
  Coordinates are in a 160 × 360 box per figure, centered on x = 80.
*/

export const STATUS_FILL: Record<GoalStatus, string> = {
  none: '#D5D9DE',
  partial: '#E3A72F',
  met: '#0B57A4',
};

const BASE_FILL = '#EEF0F2';
const OUTLINE = '#8A9099'; // ~3.2:1 on white, so the figure's edge is visible

type Shape = { d: string; mirror?: boolean };

/** Neutral body parts drawn under the muscles. */
const BASE: Shape[] = [
  { d: 'M80 5 a17 21 0 1 0 0.01 0 Z' }, // head
  { d: 'M71 44 L89 44 L91 60 L69 60 Z' }, // neck
  { d: 'M50 60 Q80 52 110 60 L120 72 L117 114 L111 150 L114 178 L46 178 L49 150 L43 114 L40 72 Z' }, // torso
  { d: 'M47 170 L113 170 L118 198 L80 210 L42 198 Z' }, // hips
  { d: 'M41 66 Q28 70 26 98 L23 134 L37 136 L45 104 Z', mirror: true }, // upper arm
  { d: 'M24 130 L19 178 L31 180 L39 134 Z', mirror: true }, // forearm
  { d: 'M25 178 a7 11 0 1 0 0.01 0 Z', mirror: true }, // hand
  { d: 'M44 192 L80 202 L77 272 L51 274 L43 232 Z', mirror: true }, // thigh
  { d: 'M52 272 L76 272 L75 290 L53 290 Z', mirror: true }, // knee
  { d: 'M52 288 L75 288 L72 336 L56 336 Z', mirror: true }, // shin
  { d: 'M55 334 L73 334 L76 348 L49 348 Z', mirror: true }, // foot
];

const FRONT: Record<string, Shape[]> = {
  traps: [{ d: 'M71 55 Q62 60 54 62 L70 64 Z', mirror: true }],
  shoulders: [{ d: 'M55 62 Q38 61 33 82 Q37 93 46 89 Q50 75 59 66 Z', mirror: true }],
  chest: [{ d: 'M78 66 L60 66 Q48 80 50 97 Q63 107 78 101 Z', mirror: true }],
  biceps: [{ d: 'M35 92 Q28 106 30 125 L40 127 Q45 110 46 93 Z', mirror: true }],
  forearms: [{ d: 'M28 135 Q21 153 23 173 L31 175 Q38 153 39 136 Z', mirror: true }],
  abs: [
    { d: 'M69 106 L91 106 L91 160 Q80 168 69 160 Z' },
    { d: 'M52 106 Q60 110 66 110 L66 157 Q56 151 52 140 Z', mirror: true },
  ],
  quads: [{ d: 'M49 200 Q45 232 54 267 Q64 271 74 267 Q78 235 76 206 Z', mirror: true }],
  calves: [{ d: 'M54 292 Q50 310 57 330 L63 330 Q61 310 63 292 Z', mirror: true }],
};

const BACK: Record<string, Shape[]> = {
  traps: [{ d: 'M80 50 L62 62 L80 106 L98 62 Z' }],
  shoulders: [{ d: 'M57 62 Q38 61 33 82 Q37 93 46 89 Q50 75 61 66 Z', mirror: true }],
  back: [
    { d: 'M60 70 Q47 94 54 130 L78 144 L78 108 Z', mirror: true },
    { d: 'M69 142 L91 142 L93 168 L67 168 Z' },
  ],
  triceps: [{ d: 'M34 90 Q27 106 29 125 L40 127 Q45 108 45 91 Z', mirror: true }],
  forearms: [{ d: 'M28 135 Q21 153 23 173 L31 175 Q38 153 39 136 Z', mirror: true }],
  glutes: [{ d: 'M79 174 Q57 172 49 190 Q52 208 78 208 Z', mirror: true }],
  hamstrings: [{ d: 'M49 214 Q45 240 54 267 L74 267 Q78 240 76 214 Z', mirror: true }],
  calves: [{ d: 'M52 286 Q45 306 56 328 L71 328 Q77 306 72 286 Z', mirror: true }],
};

function paths(shapes: Shape[], props: Record<string, unknown>): ReactNode[] {
  return shapes.flatMap((s, i) => {
    const p = <path key={`${i}l`} d={s.d} {...props} />;
    return s.mirror ? [p, <path key={`${i}r`} d={s.d} transform="translate(160 0) scale(-1 1)" {...props} />] : [p];
  });
}

function Figure({
  muscles,
  counts,
  goals,
  selected,
  onSelect,
  x,
  label,
}: {
  muscles: Record<string, Shape[]>;
  counts: Goals;
  goals: Goals;
  selected: TargetGroup | null;
  onSelect: (g: TargetGroup) => void;
  x: number;
  label: string;
}) {
  return (
    <g transform={`translate(${x} 0)`}>
      {paths(BASE, { fill: BASE_FILL, stroke: OUTLINE, strokeWidth: 1.25, strokeLinejoin: 'round' })}
      {Object.entries(muscles).map(([group, shapes]) => {
        const g = group as TargetGroup;
        const isSel = selected === g;
        return (
          <g key={g} className="body-muscle" onClick={() => onSelect(g)}>
            {paths(shapes, {
              fill: STATUS_FILL[goalStatus(counts[g], goals[g])],
              // A white edge keeps neighboring muscles apart; the selected group gets an Iron ring.
              stroke: isSel ? '#14181F' : '#FFFFFF',
              strokeWidth: isSel ? 2.25 : 1.25,
              strokeLinejoin: 'round',
            })}
          </g>
        );
      })}
      <text x="80" y="370" textAnchor="middle" className="body-label">
        {label}
      </text>
    </g>
  );
}

/**
 * Front and back body map colored by weekly set status. Tapping a muscle
 * selects its group; the list next to it carries the same information in text
 * for screen readers and anyone who can't tell the colors apart.
 */
export default function BodyMap({
  counts,
  goals,
  selected,
  onSelect,
}: {
  counts: Goals;
  goals: Goals;
  selected: TargetGroup | null;
  onSelect: (g: TargetGroup) => void;
}) {
  const met = (Object.keys(goals) as TargetGroup[]).filter((g) => goalStatus(counts[g], goals[g]) === 'met');
  return (
    <svg
      className="body-map"
      viewBox="0 0 340 378"
      role="img"
      aria-label={`Body map of this week's sets. Goals met: ${met.length ? met.map((g) => TARGET_LABELS[g]).join(', ') : 'none yet'}. Details are in the list below.`}
    >
      <Figure muscles={FRONT} counts={counts} goals={goals} selected={selected} onSelect={onSelect} x={0} label="Front" />
      <Figure muscles={BACK} counts={counts} goals={goals} selected={selected} onSelect={onSelect} x={180} label="Back" />
    </svg>
  );
}
