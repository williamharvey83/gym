import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import Screen, { useGoBack } from '../components/Screen.tsx';
import { db } from '../db/db.ts';
import { allExerciseNamesExcept, createExercise, updateExercise } from '../db/exerciseRepo.ts';
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  MAX_CUES,
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type Equipment,
  type MuscleGroup,
} from '../db/types.ts';
import { validateExerciseDraft, type DraftErrors, type ExerciseDraft } from '../lib/exercises.ts';

const EMPTY: ExerciseDraft = { name: '', primary: '', secondary: [], equipment: '', cues: [] };

/** Always show one blank cue box after the filled ones, up to the max. */
function cueSlots(cues: string[]): string[] {
  const filled = [...cues];
  while (filled.length > 0 && filled[filled.length - 1] === '') filled.pop();
  return filled.length < MAX_CUES ? [...filled, ''] : filled.slice(0, MAX_CUES);
}

export default function ExerciseEditScreen() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const goBack = useGoBack(isNew ? '/library' : `/library/${encodeURIComponent(id)}`);

  const [draft, setDraft] = useState<ExerciseDraft | null>(isNew ? EMPTY : null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    void db.exercises.get(id).then((e) => {
      if (!alive) return;
      if (!e) setMissing(true);
      else setDraft({ name: e.name, primary: e.primary, secondary: e.secondary, equipment: e.equipment, cues: e.cues });
    });
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  if (missing) {
    return (
      <Screen title="Not found" backTo="/library">
        <p className="muted">This exercise doesn't exist.</p>
      </Screen>
    );
  }
  if (!draft) return null;

  const set = <K extends keyof ExerciseDraft>(key: K, value: ExerciseDraft[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    if (key in errors) setErrors(({ [key as keyof DraftErrors]: _, ...rest }) => rest);
  };

  function toggleSecondary(m: MuscleGroup) {
    if (!draft) return;
    set('secondary', draft.secondary.includes(m) ? draft.secondary.filter((x) => x !== m) : [...draft.secondary, m]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft || saving) return;
    const result = validateExerciseDraft(draft, await allExerciseNamesExcept(id ?? null));
    if (!result.ok) {
      setErrors(result.errors);
      const first = Object.keys(result.errors)[0];
      document.getElementById(`ex-${first}`)?.focus();
      return;
    }
    setSaving(true);
    if (isNew) {
      const newId = await createExercise(result.value);
      navigate(`/library/${encodeURIComponent(newId)}`, { replace: true });
    } else {
      await updateExercise(id, result.value);
      goBack();
    }
  }

  const slots = cueSlots(draft.cues);

  return (
    <Screen title={isNew ? 'New exercise' : 'Edit exercise'} backTo="/library">
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="ex-name" className="label">
            Name
          </label>
          <input
            id="ex-name"
            className="input"
            value={draft.name}
            maxLength={80}
            autoComplete="off"
            autoCapitalize="words"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'ex-name-err' : undefined}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && (
            <p id="ex-name-err" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="ex-primary" className="label">
            Primary muscle
          </label>
          <select
            id="ex-primary"
            className="select"
            value={draft.primary}
            aria-invalid={!!errors.primary}
            aria-describedby={errors.primary ? 'ex-primary-err' : undefined}
            onChange={(e) => {
              const p = e.target.value as MuscleGroup | '';
              set('primary', p);
              setDraft((d) => (d ? { ...d, secondary: d.secondary.filter((m) => m !== p) } : d));
            }}
          >
            <option value="">Choose…</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>
                {MUSCLE_LABELS[m]}
              </option>
            ))}
          </select>
          {errors.primary && (
            <p id="ex-primary-err" className="field-error">
              {errors.primary}
            </p>
          )}
        </div>

        <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 18px' }}>
          <legend className="label" style={{ marginBottom: 8 }}>
            Secondary muscles <span className="muted">(optional)</span>
          </legend>
          <div className="chips">
            {MUSCLE_GROUPS.filter((m) => m !== draft.primary).map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={draft.secondary.includes(m)}
                onClick={() => toggleSecondary(m)}
              >
                {MUSCLE_LABELS[m]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="ex-equipment" className="label">
            Equipment
          </label>
          <select
            id="ex-equipment"
            className="select"
            value={draft.equipment}
            aria-invalid={!!errors.equipment}
            aria-describedby={errors.equipment ? 'ex-equipment-err' : undefined}
            onChange={(e) => set('equipment', e.target.value as Equipment | '')}
          >
            <option value="">Choose…</option>
            {EQUIPMENT.map((q) => (
              <option key={q} value={q}>
                {EQUIPMENT_LABELS[q]}
              </option>
            ))}
          </select>
          {errors.equipment && (
            <p id="ex-equipment-err" className="field-error">
              {errors.equipment}
            </p>
          )}
        </div>

        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 4 }}>
            Form cues <span className="muted">(up to {MAX_CUES})</span>
          </legend>
          {slots.map((c, i) => (
            <input
              key={i}
              id={i === 0 ? 'ex-cues' : undefined}
              className="input"
              value={c}
              maxLength={120}
              placeholder={`Cue ${i + 1}`}
              aria-label={`Cue ${i + 1}`}
              onChange={(e) => {
                const next = [...slots];
                next[i] = e.target.value;
                set('cues', next);
              }}
            />
          ))}
          {errors.cues && <p className="field-error">{errors.cues}</p>}
        </fieldset>

        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={goBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Save
          </button>
        </div>
      </form>
    </Screen>
  );
}
