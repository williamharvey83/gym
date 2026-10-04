import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen, { useGoBack } from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { db } from '../db/db.ts';
import { deleteExercise, isExerciseInUse, restoreBuiltIn, workoutsWithExercise } from '../db/exerciseRepo.ts';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../db/types.ts';
import { formatDate, formatSet } from '../lib/format.ts';

export default function ExerciseDetailScreen() {
  const { id = '' } = useParams();
  // null = loaded but missing; undefined = still loading.
  const exercise = useLiveQuery(async () => (await db.exercises.get(id)) ?? null, [id]);
  const history = useLiveQuery(() => workoutsWithExercise(id), [id]);
  const inUse = useLiveQuery(() => isExerciseInUse(id), [id]);
  const goBack = useGoBack('/library');

  if (exercise === undefined) return null;

  if (exercise === null) {
    return (
      <Screen title="Not found" backTo="/library">
        <EmptyState title="This exercise doesn't exist" hint="It may have been removed. Go back to the library." />
      </Screen>
    );
  }

  async function onDelete() {
    if (!exercise || !window.confirm(`Delete "${exercise.name}"? This can't be undone.`)) return;
    if (await deleteExercise(id)) goBack();
    else window.alert('This exercise is now in use, so it was not deleted.');
  }

  async function onRestore() {
    if (window.confirm('Restore the original name, muscles, equipment, and cues? Your logged history is kept.')) {
      await restoreBuiltIn(id);
    }
  }

  return (
    <Screen
      title={exercise.name}
      backTo="/library"
      actions={
        <Link to={`/library/${encodeURIComponent(id)}/edit`} className="btn btn-secondary">
          Edit
        </Link>
      }
    >
      {(!exercise.builtIn || exercise.edited) && (
        <div className="tags" style={{ marginBottom: 12 }}>
          {!exercise.builtIn && <span className="tag">Custom</span>}
          {exercise.edited && <span className="tag">Edited</span>}
        </div>
      )}

      <div className="card facts">
        <div>
          <div className="fact-label">Primary muscle</div>
          <div className="tags">
            <span className="tag tag-primary">{MUSCLE_LABELS[exercise.primary]}</span>
          </div>
        </div>
        {exercise.secondary.length > 0 && (
          <div>
            <div className="fact-label">Secondary</div>
            <div className="tags">
              {exercise.secondary.map((m) => (
                <span key={m} className="tag">
                  {MUSCLE_LABELS[m]}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="fact-label">Equipment</div>
          <div className="tags">
            <span className="tag">{EQUIPMENT_LABELS[exercise.equipment]}</span>
          </div>
        </div>
      </div>

      <section className="section" aria-labelledby="cues-h">
        <h2 id="cues-h" className="section-title">
          Form cues
        </h2>
        {exercise.cues.length > 0 ? (
          <ol className="card cues">
            {exercise.cues.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        ) : (
          <p className="muted">No cues yet. Tap Edit to add up to four.</p>
        )}
      </section>

      <section className="section" aria-labelledby="hist-h">
        <h2 id="hist-h" className="section-title">
          History
        </h2>
        {history === undefined ? null : history.length === 0 ? (
          <p className="muted">No sets logged yet. Finish a workout with this exercise and it will show up here.</p>
        ) : (
          <ul className="list">
            {history.map((w) => {
              const sets = w.exercises
                .filter((we) => we.exerciseId === id)
                .flatMap((we) => we.sets)
                .filter((s) => s.done);
              return (
                <li key={w.id} className="history-item">
                  <div className="history-date">{formatDate(w.startedAt)}</div>
                  <div className="history-sets">
                    {sets.length > 0 ? sets.map((s) => formatSet(s.weight, s.reps)).join(', ') : 'No completed sets'}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {exercise.builtIn && exercise.edited && (
        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={onRestore}>
            Restore original
          </button>
        </div>
      )}

      {!exercise.builtIn && inUse !== undefined && (
        <div className="section">
          {inUse ? (
            <p className="field-hint">This exercise is used in a routine or workout, so it can't be deleted.</p>
          ) : (
            <button type="button" className="btn btn-danger btn-block" onClick={onDelete}>
              Delete exercise
            </button>
          )}
        </div>
      )}
    </Screen>
  );
}
