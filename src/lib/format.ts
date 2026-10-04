/** "135 lb", "132.5 lb". Weights are stored in 0.5 lb steps. */
export function formatWeight(lb: number): string {
  const rounded = Math.round(lb * 2) / 2;
  return `${rounded.toLocaleString('en-US', { maximumFractionDigits: 1 })} lb`;
}

/** "135 lb × 8" */
export function formatSet(weight: number, reps: number): string {
  return `${formatWeight(weight)} × ${reps}`;
}

/** "1 routine", "3 routines", "1,204 sets" */
export function plural(n: number, word: string, many = `${word}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : many}`;
}

/** Whole pounds with separators: "12,340 lb". */
export function formatVolume(lb: number): string {
  return `${Math.round(lb).toLocaleString('en-US')} lb`;
}

/** Short pounds for chart labels: "940 lb", "12.3k lb", "1.2M lb". */
export function formatCompactLb(lb: number): string {
  return `${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(lb))} lb`;
}

/** "6:42 PM" */
export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** "45 min", "1 h 5 min" */
export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Stopwatch: "4:07", "1:02:09" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** "Oct 4" */
export function formatShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "Sat, Oct 4, 2026" */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
