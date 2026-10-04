export const MAX_WEIGHT = 2000;
export const MAX_REPS = 999;

/** Parses a typed weight in lb, rounded to the nearest 0.5. Null if invalid. */
export function parseWeight(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d*\.?\d*$/.test(t) || t === '' || t === '.') return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > MAX_WEIGHT) return null;
  return Math.round(n * 2) / 2;
}

/** Parses typed reps as a whole number. Null if invalid. */
export function parseReps(text: string): number | null {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n <= MAX_REPS ? n : null;
}

/** Text shown in a weight box: "135", "132.5". */
export function weightText(lb: number | null): string {
  return lb === null ? '' : String(Math.round(lb * 2) / 2);
}
