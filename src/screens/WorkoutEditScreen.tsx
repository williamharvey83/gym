import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import Screen, { useGoBack } from '../components/Screen.tsx';
import WorkoutEditor from '../components/WorkoutEditor.tsx';
import { db } from '../db/db.ts';
import { updateWorkout } from '../db/workoutRepo.ts';
import type { DraftExercise } from '../db/types.ts';
import { fromDraftExercises, timesFromInputs, toDateInput, toDraftExercises, toTimeInput } from '../lib/workout.ts';

type Form = { name: string; date: string; start: string; end: string; exercises: DraftExercise[] };

export default function WorkoutEditScreen() {
  const { id = '' } = useParams();
  const goBack = useGoBack(`/history/${id}`);
  const [form, setForm] = useState<Form | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void db.workouts.get(id).then((w) => {
      if (!alive) return;
      if (!w) return setMissing(true);
      setForm({
        name: w.name,
        date: toDateInput(w.startedAt),
        start: toTimeInput(w.startedAt),
        end: toTimeInput(w.endedAt),
        exercises: toDraftExercises(w),
      });
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (missing) {
    return (
      <Screen title="Not found" backTo="/history">
        <p className="muted">This workout doesn't exist.</p>
      </Screen>
    );
  }
  if (!form) return null;

  const set = (patch: Partial<Form>) => {
    setForm({ ...form, ...patch });
    setError(null);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const times = timesFromInputs(form.date, form.start, form.end);
    if (!times) return setError('Enter a valid date, start time, and end time.');
    const ex = fromDraftExercises(form.exercises);
    if (!ex.ok) return setError(ex.error);
    await updateWorkout(id, { name: form.name.trim() || 'Workout', ...times, exercises: ex.value });
    goBack();
  }

  return (
    <Screen title="Edit workout" backTo={`/history/${id}`}>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="wo-name" className="label">
            Name
          </label>
          <input id="wo-name" className="input" value={form.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="wo-date" className="label">
            Date
          </label>
          <input id="wo-date" className="input" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div className="filters" style={{ marginTop: 0, marginBottom: 18 }}>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="wo-start" className="label">
              Start
            </label>
            <input id="wo-start" className="input" type="time" value={form.start} onChange={(e) => set({ start: e.target.value })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="wo-end" className="label">
              End
            </label>
            <input id="wo-end" className="input" type="time" value={form.end} onChange={(e) => set({ end: e.target.value })} />
          </div>
        </div>

        <WorkoutEditor mode="edit" exercises={form.exercises} onChange={(exercises) => set({ exercises })} />

        {error && (
          <p className="field-error" role="alert" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}

        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={goBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </Screen>
  );
}
