/** "135 lb", "132.5 lb". Weights are stored in 0.5 lb steps. */
export function formatWeight(lb: number): string {
  const rounded = Math.round(lb * 2) / 2;
  return `${rounded.toLocaleString('en-US', { maximumFractionDigits: 1 })} lb`;
}

/** "135 lb × 8" */
export function formatSet(weight: number, reps: number): string {
  return `${formatWeight(weight)} × ${reps}`;
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
