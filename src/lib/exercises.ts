import {
  EQUIPMENT,
  MAX_CUES,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from '../db/types.ts';

export type ExerciseFilter = {
  query: string;
  muscle: MuscleGroup | 'all';
  equipment: Equipment | 'all';
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Gym shorthand. A typed word matches if the name contains it or its expansion. */
const ABBREVIATIONS: Record<string, string> = {
  db: 'dumbbell',
  bb: 'barbell',
  kb: 'kettlebell',
  ez: 'ez bar',
  bw: 'bodyweight',
  rdl: 'romanian deadlift',
  sldl: 'stiff leg deadlift',
  ohp: 'overhead press',
  bss: 'bulgarian split squat',
  ghr: 'glute ham raise',
  rdf: 'rear delt fly',
};

function termMatches(name: string, term: string): boolean {
  const expanded = ABBREVIATIONS[term];
  // Abbreviations match whole words only, so "bb" doesn't hit "dumbbell".
  if (expanded !== undefined) return name.includes(expanded) || name.split(' ').includes(term);
  return name.includes(term);
}

/**
 * Name search: every word typed must appear somewhere in the name, in any
 * order, so "db row" or "row dumb" both find "One-Arm Dumbbell Row".
 * Muscle filter matches the primary muscle only.
 */
export function filterExercises<T extends Pick<Exercise, 'name' | 'primary' | 'secondary' | 'equipment'>>(
  list: readonly T[],
  { query, muscle, equipment }: ExerciseFilter,
): T[] {
  const terms = normalize(query).split(' ').filter(Boolean);
  return list
    .filter((e) => {
      if (equipment !== 'all' && e.equipment !== equipment) return false;
      if (muscle !== 'all' && e.primary !== muscle) return false;
      if (terms.length === 0) return true;
      const name = normalize(e.name);
      return terms.every((t) => termMatches(name, t));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type ExerciseDraft = {
  name: string;
  primary: MuscleGroup | '';
  secondary: MuscleGroup[];
  equipment: Equipment | '';
  cues: string[];
};

export type DraftErrors = Partial<Record<'name' | 'primary' | 'equipment' | 'cues', string>>;

export type CleanDraft = Pick<Exercise, 'name' | 'primary' | 'secondary' | 'equipment' | 'cues'>;

/**
 * Validates and cleans an add/edit form. `otherNames` holds the names of all
 * other exercises, for the duplicate check.
 */
export function validateExerciseDraft(
  draft: ExerciseDraft,
  otherNames: readonly string[],
): { ok: true; value: CleanDraft } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const name = draft.name.trim().replace(/\s+/g, ' ');

  if (!name) errors.name = 'Enter a name.';
  else if (name.length > 80) errors.name = 'Keep the name under 80 characters.';
  else if (otherNames.some((n) => n.trim().toLowerCase() === name.toLowerCase()))
    errors.name = 'An exercise with this name already exists.';

  const primary = draft.primary;
  if (!primary || !(MUSCLE_GROUPS as readonly string[]).includes(primary)) errors.primary = 'Choose a primary muscle.';

  const equipment = draft.equipment;
  if (!equipment || !(EQUIPMENT as readonly string[]).includes(equipment)) errors.equipment = 'Choose equipment.';

  const cues = draft.cues.map((c) => c.trim()).filter(Boolean);
  if (cues.length > MAX_CUES) errors.cues = `Use at most ${MAX_CUES} cues.`;
  else if (cues.some((c) => c.length > 120)) errors.cues = 'Keep each cue under 120 characters.';

  if (Object.keys(errors).length > 0 || !primary || !equipment) return { ok: false, errors };

  const secondary = [...new Set(draft.secondary)].filter((m) => m !== primary);
  return { ok: true, value: { name, primary, secondary, equipment, cues } };
}
