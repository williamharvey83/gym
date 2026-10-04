import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen, { useGoBack } from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { db } from '../db/db.ts';
import { deleteWorkout } from '../db/workoutRepo.ts';
import { formatDate, formatDuration, formatSet, formatTime } from '../lib/format.ts';

export default function WorkoutDetailScreen() {
  const { id = '' } = useParams();
  const goBack = useGoBack('/history');
  const workout = useLiveQuery(async () => (await db.workouts.get(id)) ?? null, [id]);
  const names = useLiveQuery(async () => {
    if (!workout) return new Map<string, string>();
    const rows = await db.exercises.bulkGet(workout.exerciseIds);
    return new Map(rows.flatMap((r) => (r ? [[r.id, r.name] as const] : [])));
  }, [workout]);

  if (workout === undefined) return null;
  if (workout === null) {
    return (
      <Screen title="Not found" backTo="/history">
        <EmptyState title="This workout doesn't exist" hint="It may have been deleted." />
      </Screen>
    );
  }

  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0);

  async function onDelete() {
    if (window.confirm("Delete this workout? This can't be undone.")) {
      await deleteWorkout(id);
      goBack();
    }
  }

  return (
    <Screen
      title={workout.name}
      backTo="/history"
      actions={
        <Link to={`/history/${id}/edit`} className="btn btn-secondary">
          Edit
        </Link>
      }
    >
      <div className="card facts">
        <div>
          <div className="fact-label">Date</div>
          <div>{formatDate(workout.startedAt)}</div>
        </div>
        <div className="facts-row">
          <div>
            <div className="fact-label">Time</div>
            <div>
              {formatTime(workout.startedAt)} – {formatTime(workout.endedAt)}
            </div>
          </div>
          <div>
            <div className="fact-label">Duration</div>
            <div>{formatDuration(workout.endedAt - workout.startedAt)}</div>
          </div>
          <div>
            <div className="fact-label">Sets</div>
            <div>{totalSets}</div>
          </div>
        </div>
      </div>

      {workout.exercises.map((ex, i) => (
        <section key={i} className="section">
          <h2 className="detail-ex-title">
            <Link to={`/library/${encodeURIComponent(ex.exerciseId)}`}>{names?.get(ex.exerciseId) ?? 'Exercise'}</Link>
          </h2>
          <ol className="card detail-sets">
            {ex.sets.map((s, j) => (
              <li key={j}>
                <span className="detail-set-n">{j + 1}</span>
                {formatSet(s.weight, s.reps)}
              </li>
            ))}
          </ol>
        </section>
      ))}

      <div className="section">
        <button type="button" className="btn btn-danger btn-block" onClick={onDelete}>
          Delete workout
        </button>
      </div>
    </Screen>
  );
}
