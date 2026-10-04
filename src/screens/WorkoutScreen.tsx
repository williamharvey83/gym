import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import WorkoutEditor from '../components/WorkoutEditor.tsx';
import Sheet, { ActionSheet } from '../components/Sheet.tsx';
import { ChevronIcon, DumbbellIcon, MoreIcon } from '../components/icons.tsx';
import RestTimerBar from '../components/RestTimerBar.tsx';
import { updateActiveWorkout, useActiveWorkout } from '../db/activeWorkoutStore.ts';
import { stopRestTimer } from '../db/restTimerStore.ts';
import { listRoutines, updateRoutine } from '../db/routineRepo.ts';
import {
  discardActiveWorkout,
  finishActiveWorkout,
  getLastSessions,
  recentWorkouts,
  startEmptyWorkout,
  startRoutineWorkout,
  type FinishResult,
} from '../db/workoutRepo.ts';
import type { ActiveWorkout } from '../db/types.ts';
import { formatClock, formatDate, formatDuration } from '../lib/format.ts';

export default function WorkoutScreen() {
  const active = useActiveWorkout();
  const navigate = useNavigate();
  // Kept here, not in the live view, because finishing clears the active workout.
  const [routinePrompt, setRoutinePrompt] = useState<FinishResult | null>(null);

  function afterFinish(result: FinishResult) {
    if (result.routineUpdate) setRoutinePrompt(result);
    else if (result.workoutId) navigate(`/history/${result.workoutId}`);
  }

  function closeRoutinePrompt(save: boolean) {
    const r = routinePrompt;
    setRoutinePrompt(null);
    if (!r) return;
    if (save && r.routineUpdate) void updateRoutine(r.routineUpdate.routineId, { exercises: r.routineUpdate.exercises });
    if (r.workoutId) navigate(`/history/${r.workoutId}`);
  }

  return (
    <>
      {active ? <LiveWorkout active={active} onFinished={afterFinish} /> : <StartView />}

      <Sheet
        open={!!routinePrompt}
        onClose={() => closeRoutinePrompt(false)}
        title="Save changes to routine?"
        footer={
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={() => closeRoutinePrompt(false)}>
              Keep as is
            </button>
            <button type="button" className="btn btn-primary" onClick={() => closeRoutinePrompt(true)}>
              Update routine
            </button>
          </div>
        }
      >
        <p>
          You changed the exercises or sets in this workout. Update the “{routinePrompt?.routineUpdate?.routineName}”
          routine to match, for next time?
        </p>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------

function StartView() {
  const navigate = useNavigate();
  const routines = useLiveQuery(() => listRoutines(), []);
  const recent = useLiveQuery(() => recentWorkouts(5), []);

  return (
    <Screen title="Workout">
      <button type="button" className="btn btn-primary btn-block btn-lg" onClick={startEmptyWorkout}>
        Start empty workout
      </button>

      <section className="section" aria-labelledby="start-routines">
        <h2 id="start-routines" className="section-title">
          Start from a routine
        </h2>
        {routines === undefined ? null : routines.length === 0 ? (
          <p className="muted">
            No routines yet. <Link to="/routines/new">Create one</Link> to start your regular workouts with one tap.
          </p>
        ) : (
          <ul className="list">
            {routines.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="row row-button"
                  onClick={async () => {
                    await startRoutineWorkout(r);
                    navigate('/workout');
                  }}
                >
                  <span className="row-main">
                    <span className="row-title">{r.name}</span>
                    <span className="row-sub">
                      {r.exercises.length} {r.exercises.length === 1 ? 'exercise' : 'exercises'}
                    </span>
                  </span>
                  <span className="row-action">Start</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="start-recent">
        <h2 id="start-recent" className="section-title">
          Recent workouts
        </h2>
        {recent === undefined ? null : recent.length === 0 ? (
          <EmptyState
            icon={<DumbbellIcon size={36} />}
            title="No workouts yet"
            hint="Your finished workouts will show up here."
          />
        ) : (
          <ul className="list">
            {recent.map((w) => (
              <li key={w.id}>
                <Link to={`/history/${w.id}`} className="row">
                  <span className="row-main">
                    <span className="row-title">{w.name}</span>
                    <span className="row-sub">
                      {formatDate(w.startedAt)} · {formatDuration(w.endedAt - w.startedAt)}
                    </span>
                  </span>
                  <ChevronIcon size={20} className="row-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}

// ---------------------------------------------------------------------------

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="elapsed" aria-label="Elapsed time">
      {formatClock(now - since)}
    </span>
  );
}

function LiveWorkout({ active, onFinished }: { active: ActiveWorkout; onFinished: (r: FinishResult) => void }) {
  const ids = active.exercises.map((e) => e.exerciseId);
  const last = useLiveQuery(() => getLastSessions(ids), [ids.join(',')]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const allSets = active.exercises.flatMap((e) => e.sets);
  const done = allSets.filter((s) => s.done).length;

  function rename() {
    const name = window.prompt('Workout name', active.name);
    if (name !== null && name.trim()) updateActiveWorkout((w) => ({ ...w, name: name.trim() }));
  }

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    try {
      const result = await finishActiveWorkout();
      stopRestTimer();
      setFinishOpen(false);
      if (result) onFinished(result);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <main className="screen live">
      <div className="live-bar">
        <div className="live-bar-main">
          {/* Rename lives in the ⋯ menu, which keeps this a calm heading instead of a small tap target. */}
          <h1 className="live-name">{active.name}</h1>
          <Elapsed since={active.startedAt} />
        </div>
        <button type="button" className="icon-btn" aria-label="Workout options" onClick={() => setMenuOpen(true)}>
          <MoreIcon size={24} />
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setFinishOpen(true)}>
          Finish
        </button>
      </div>

      <WorkoutEditor
        mode="live"
        exercises={active.exercises}
        last={last}
        onChange={(exercises) => updateActiveWorkout((w) => ({ ...w, exercises }))}
      />

      {/* Room so the pinned rest timer never covers the last exercise. */}
      <div className="rest-spacer" aria-hidden="true" />
      <RestTimerBar />

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Workout"
        actions={[
          { label: 'Rename workout', onSelect: rename },
          {
            label: 'Discard workout',
            danger: true,
            onSelect: () => {
              if (window.confirm("Discard this workout? Nothing from it will be saved, and this can't be undone.")) {
                discardActiveWorkout();
                stopRestTimer();
              }
            },
          },
        ]}
      />

      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Finish workout?"
        footer={
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setFinishOpen(false)}>
              Keep going
            </button>
            <button type="button" className="btn btn-primary" disabled={finishing} onClick={finish}>
              {done === 0 ? 'End workout' : 'Finish'}
            </button>
          </div>
        }
      >
        {done === 0 ? (
          <p>No sets are checked, so nothing will be saved. Check off the sets you did first, or end the workout without saving.</p>
        ) : (
          <>
            <p>
              <strong>
                {done} {done === 1 ? 'set' : 'sets'}
              </strong>{' '}
              checked off in <Elapsed since={active.startedAt} />.
            </p>
            {allSets.length > done && (
              <p className="muted">
                {allSets.length - done} unchecked {allSets.length - done === 1 ? 'set' : 'sets'} won't be saved.
              </p>
            )}
          </>
        )}
      </Sheet>
    </main>
  );
}
