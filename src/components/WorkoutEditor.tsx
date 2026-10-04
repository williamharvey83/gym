import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import NumberField from './NumberField.tsx';
import ExercisePicker from './ExercisePicker.tsx';
import Sheet, { ActionSheet } from './Sheet.tsx';
import { CheckIcon, MoreIcon, PlusIcon } from './icons.tsx';
import { db } from '../db/db.ts';
import type { DraftExercise, DraftSet, Exercise } from '../db/types.ts';
import { formatSet, formatShortDate } from '../lib/format.ts';
import { getLastSessions } from '../db/workoutRepo.ts';
import {
  fillBlanksBelow,
  moveItem,
  newDraftExercise,
  nextSet,
  type LastSession,
  type LastSessions,
} from '../lib/workout.ts';

type Props = {
  exercises: DraftExercise[];
  onChange: (next: DraftExercise[]) => void;
  /** 'live' shows check boxes and last session; 'edit' is for past workouts. */
  mode: 'live' | 'edit';
  last?: LastSessions | undefined;
};

export default function WorkoutEditor({ exercises, onChange, mode, last }: Props) {
  const lookup = useLiveQuery(async () => {
    const rows = await db.exercises.bulkGet([...new Set(exercises.map((e) => e.exerciseId))]);
    return new Map(rows.filter((r): r is Exercise => !!r).map((r) => [r.id, r]));
  }, [exercises.map((e) => e.exerciseId).join(',')]);

  // Latest list, for updates that finish after an await.
  const latest = useRef(exercises);
  latest.current = exercises;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [cuesKey, setCuesKey] = useState<string | null>(null);
  const [setMenu, setSetMenu] = useState<{ exKey: string; setKey: string; n: number } | null>(null);

  const updateExercise = (key: string, fn: (e: DraftExercise) => DraftExercise) =>
    onChange(exercises.map((e) => (e.key === key ? fn(e) : e)));

  const menuIndex = exercises.findIndex((e) => e.key === menuKey);
  const menuEx = exercises[menuIndex];
  const cuesEx = exercises.find((e) => e.key === cuesKey);
  const nameOf = (id: string) => lookup?.get(id)?.name ?? 'Exercise';

  return (
    <div className="editor">
      {exercises.length === 0 && (
        <p className="muted editor-empty">
          {mode === 'live' ? 'Add your first exercise to start logging sets.' : 'This workout has no exercises.'}
        </p>
      )}

      {exercises.map((ex) => (
        <ExerciseCard
          key={ex.key}
          ex={ex}
          info={lookup?.get(ex.exerciseId)}
          mode={mode}
          last={last?.get(ex.exerciseId)}
          onChangeSets={(sets) => updateExercise(ex.key, (e) => ({ ...e, sets }))}
          onAddSet={() =>
            updateExercise(ex.key, (e) => {
              const s = nextSet(e.sets, mode === 'live' ? last?.get(e.exerciseId)?.sets : undefined);
              return { ...e, sets: [...e.sets, mode === 'edit' ? { ...s, done: true } : s] };
            })
          }
          onOpenMenu={() => setMenuKey(ex.key)}
          onOpenSetMenu={(setKey, n) => setSetMenu({ exKey: ex.key, setKey, n })}
        />
      ))}

      <button type="button" className="btn btn-secondary btn-block" onClick={() => setPickerOpen(true)}>
        <PlusIcon size={20} />
        Add exercise
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (ids) => {
          // Newly picked exercises aren't in `last` yet, so look them up now.
          const history = mode === 'live' ? await getLastSessions(ids) : new Map<string, LastSession>();
          onChange([
            ...latest.current,
            ...ids.map((id) => {
              const ex = newDraftExercise(id, history.get(id)?.sets);
              return mode === 'edit' ? { ...ex, sets: ex.sets.map((s) => ({ ...s, done: true })) } : ex;
            }),
          ]);
        }}
      />

      <ActionSheet
        open={!!menuEx}
        onClose={() => setMenuKey(null)}
        title={menuEx ? nameOf(menuEx.exerciseId) : ''}
        actions={[
          { label: 'Show form cues', onSelect: () => setCuesKey(menuKey) },
          { label: 'Move up', disabled: menuIndex <= 0, onSelect: () => onChange(moveItem(exercises, menuIndex, menuIndex - 1)) },
          {
            label: 'Move down',
            disabled: menuIndex >= exercises.length - 1,
            onSelect: () => onChange(moveItem(exercises, menuIndex, menuIndex + 1)),
          },
          {
            label: 'Remove exercise',
            danger: true,
            onSelect: () => {
              const hasData = menuEx?.sets.some((s) => s.done);
              if (!hasData || window.confirm('Remove this exercise and its completed sets?')) {
                onChange(exercises.filter((e) => e.key !== menuKey));
              }
            },
          },
        ]}
      />

      <ActionSheet
        open={!!setMenu}
        onClose={() => setSetMenu(null)}
        title={setMenu ? `Set ${setMenu.n}` : ''}
        actions={[
          {
            label: `Delete set ${setMenu?.n ?? ''}`,
            danger: true,
            onSelect: () =>
              setMenu &&
              updateExercise(setMenu.exKey, (e) => ({ ...e, sets: e.sets.filter((s) => s.key !== setMenu.setKey) })),
          },
        ]}
      />

      <Sheet open={!!cuesEx} onClose={() => setCuesKey(null)} title={cuesEx ? nameOf(cuesEx.exerciseId) : ''}>
        {(() => {
          const cues = cuesEx ? lookup?.get(cuesEx.exerciseId)?.cues ?? [] : [];
          return cues.length > 0 ? (
            <ol className="cues">
              {cues.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          ) : (
            <p className="muted">No cues for this exercise. Add some in the Library tab.</p>
          );
        })()}
      </Sheet>
    </div>
  );
}

function ExerciseCard({
  ex,
  info,
  mode,
  last,
  onChangeSets,
  onAddSet,
  onOpenMenu,
  onOpenSetMenu,
}: {
  ex: DraftExercise;
  info: Exercise | undefined;
  mode: 'live' | 'edit';
  last: { startedAt: number; sets: { weight: number; reps: number }[] } | undefined;
  onChangeSets: (sets: DraftSet[]) => void;
  onAddSet: () => void;
  onOpenMenu: () => void;
  onOpenSetMenu: (setKey: string, n: number) => void;
}) {
  const name = info?.name ?? 'Exercise';
  const doneCount = ex.sets.filter((s) => s.done).length;

  return (
    <section className="card ex-card" aria-label={name}>
      <header className="ex-head">
        <div className="ex-title-wrap">
          <h2 className="ex-title">{name}</h2>
          {mode === 'live' && (
            <p className="ex-last">
              {last ? (
                <>
                  <span className="ex-last-label">Last · {formatShortDate(last.startedAt)}:</span>{' '}
                  {last.sets.map((s) => formatSet(s.weight, s.reps)).join(', ')}
                </>
              ) : (
                'First time logging this exercise'
              )}
            </p>
          )}
        </div>
        <button type="button" className="icon-btn" aria-label={`Options for ${name}`} onClick={onOpenMenu}>
          <MoreIcon size={24} />
        </button>
      </header>

      {ex.sets.length > 0 && (
        <div className={mode === 'live' ? 'sets' : 'sets sets-edit'} role="table" aria-label={`${name} sets`}>
          <div className="set-row set-head" role="row">
            <span role="columnheader">Set</span>
            <span role="columnheader">Weight</span>
            <span role="columnheader">Reps</span>
            {mode === 'live' && (
              <span role="columnheader">
                <span className="visually-hidden">Done</span>
                <CheckIcon size={16} aria-hidden="true" />
              </span>
            )}
          </div>
          {ex.sets.map((s, i) => (
            <SetRow
              key={s.key}
              n={i + 1}
              set={s}
              mode={mode}
              bodyweight={info?.equipment === 'bodyweight'}
              onChange={(next) => {
                const sets = ex.sets.map((x) => (x.key === s.key ? next : x));
                onChangeSets(next.done && !s.done && mode === 'live' ? fillBlanksBelow(sets, i) : sets);
              }}
              onOpenMenu={() => onOpenSetMenu(s.key, i + 1)}
            />
          ))}
        </div>
      )}

      <div className="ex-foot">
        <button type="button" className="btn btn-ghost" onClick={onAddSet}>
          <PlusIcon size={20} />
          Add set
        </button>
        {mode === 'live' && ex.sets.length > 0 && (
          <span className="ex-progress">
            {doneCount}/{ex.sets.length} done
          </span>
        )}
      </div>
    </section>
  );
}

function SetRow({
  n,
  set,
  mode,
  bodyweight,
  onChange,
  onOpenMenu,
}: {
  n: number;
  set: DraftSet;
  mode: 'live' | 'edit';
  bodyweight: boolean;
  onChange: (s: DraftSet) => void;
  onOpenMenu: () => void;
}) {
  const weightRef = useRef<HTMLInputElement>(null);
  const repsRef = useRef<HTMLInputElement>(null);

  function toggleDone() {
    if (set.done) return onChange({ ...set, done: false });
    // Bodyweight lifts log added load, so a blank weight means 0 lb.
    const weight = set.weight ?? (bodyweight ? 0 : null);
    if (weight === null) return weightRef.current?.focus();
    if (set.reps === null) return repsRef.current?.focus();
    onChange({ ...set, weight, done: true });
  }

  return (
    <div className={set.done && mode === 'live' ? 'set-row is-done' : 'set-row'} role="row">
      <span role="cell">
        <button type="button" className="set-num" aria-label={`Set ${n} options`} onClick={onOpenMenu}>
          {n}
        </button>
      </span>
      <span role="cell">
        <NumberField
          ref={weightRef}
          kind="weight"
          label={`Set ${n} weight in pounds`}
          value={set.weight}
          onChange={(weight) => onChange({ ...set, weight })}
        />
      </span>
      <span role="cell">
        <NumberField
          ref={repsRef}
          kind="reps"
          label={`Set ${n} reps`}
          value={set.reps}
          onChange={(reps) => onChange({ ...set, reps })}
        />
      </span>
      {mode === 'live' && (
        <span role="cell">
          <button
            type="button"
            role="checkbox"
            aria-checked={set.done}
            aria-label={`Set ${n} done`}
            className={set.done ? 'check on' : 'check'}
            onClick={toggleDone}
          >
            <CheckIcon size={22} />
          </button>
        </span>
      )}
    </div>
  );
}
