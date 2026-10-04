import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen, { useGoBack } from '../components/Screen.tsx';
import ExercisePicker from '../components/ExercisePicker.tsx';
import { CloseIcon, DownIcon, MinusIcon, PlusIcon, UpIcon } from '../components/icons.tsx';
import { db } from '../db/db.ts';
import { createRoutine, updateRoutine } from '../db/routineRepo.ts';
import { moveItem, newKey } from '../lib/workout.ts';

type Item = { key: string; exerciseId: string; sets: number };

const MAX_SETS = 20;

export default function RoutineEditScreen() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const goBack = useGoBack('/routines');

  const [name, setName] = useState('');
  const [items, setItems] = useState<Item[] | null>(isNew ? [] : null);
  const [error, setError] = useState<{ field: 'name' | 'exercises'; text: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [missing, setMissing] = useState(false);

  const names = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e.name])), []);

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    void db.routines.get(id).then((r) => {
      if (!alive) return;
      if (!r) return setMissing(true);
      setName(r.name);
      setItems(r.exercises.map((e) => ({ key: newKey(), ...e })));
    });
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  if (missing) {
    return (
      <Screen title="Not found" backTo="/routines">
        <p className="muted">This routine doesn't exist.</p>
      </Screen>
    );
  }
  if (!items) return null;

  const update = (key: string, sets: number) =>
    setItems(items.map((it) => (it.key === key ? { ...it, sets: Math.min(MAX_SETS, Math.max(1, sets)) } : it)));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!items) return;
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) {
      setError({ field: 'name', text: 'Enter a name.' });
      document.getElementById('rt-name')?.focus();
      return;
    }
    if (items.length === 0) {
      setError({ field: 'exercises', text: 'Add at least one exercise.' });
      return;
    }
    const exercises = items.map(({ exerciseId, sets }) => ({ exerciseId, sets }));
    if (isNew) await createRoutine(clean, exercises);
    else await updateRoutine(id, { name: clean, exercises });
    if (isNew) navigate('/routines', { replace: true });
    else goBack();
  }

  return (
    <Screen title={isNew ? 'New routine' : 'Edit routine'} backTo="/routines">
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="rt-name" className="label">
            Name
          </label>
          <input
            id="rt-name"
            className="input"
            value={name}
            maxLength={60}
            autoComplete="off"
            autoCapitalize="words"
            placeholder="e.g. Push"
            aria-invalid={error?.field === 'name'}
            onChange={(e) => {
              setName(e.target.value);
              if (error?.field === 'name') setError(null);
            }}
          />
          {error?.field === 'name' && <p className="field-error">{error.text}</p>}
        </div>

        <h2 className="section-title">Exercises</h2>
        {items.length === 0 ? (
          <p className="muted">No exercises yet. Add the lifts for this routine in the order you do them.</p>
        ) : (
          <ol className="list rt-list">
            {items.map((it, i) => {
              const exName = names?.get(it.exerciseId) ?? 'Exercise';
              return (
                <li key={it.key} className="rt-item">
                  <div className="rt-top">
                    <span className="rt-name">
                      <span className="rt-index">{i + 1}.</span> {exName}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove ${exName}`}
                      onClick={() => setItems(items.filter((x) => x.key !== it.key))}
                    >
                      <CloseIcon size={20} />
                    </button>
                  </div>
                  <div className="rt-controls">
                    <div className="stepper" role="group" aria-label={`Planned sets for ${exName}`}>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Fewer sets"
                        disabled={it.sets <= 1}
                        onClick={() => update(it.key, it.sets - 1)}
                      >
                        <MinusIcon size={20} />
                      </button>
                      <span className="stepper-value" aria-live="polite">
                        {it.sets} {it.sets === 1 ? 'set' : 'sets'}
                      </span>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="More sets"
                        disabled={it.sets >= MAX_SETS}
                        onClick={() => update(it.key, it.sets + 1)}
                      >
                        <PlusIcon size={20} />
                      </button>
                    </div>
                    <div className="rt-move">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Move ${exName} up`}
                        disabled={i === 0}
                        onClick={() => setItems(moveItem(items, i, i - 1))}
                      >
                        <UpIcon size={22} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Move ${exName} down`}
                        disabled={i === items.length - 1}
                        onClick={() => setItems(moveItem(items, i, i + 1))}
                      >
                        <DownIcon size={22} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {error?.field === 'exercises' && <p className="field-error">{error.text}</p>}

        <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: 14 }} onClick={() => setPickerOpen(true)}>
          <PlusIcon size={20} />
          Add exercises
        </button>

        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={goBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(ids) => {
          setItems([...items, ...ids.map((exerciseId) => ({ key: newKey(), exerciseId, sets: 3 }))]);
          if (error?.field === 'exercises') setError(null);
        }}
      />
    </Screen>
  );
}
