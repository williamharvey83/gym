import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Sheet from './Sheet.tsx';
import { CheckIcon, SearchIcon } from './icons.tsx';
import { db } from '../db/db.ts';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_LABELS, type MuscleGroup } from '../db/types.ts';
import { filterExercises } from '../lib/exercises.ts';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen exercise ids, in the order they were tapped. */
  onPick: (ids: string[]) => void;
};

export default function ExercisePicker({ open, onClose, onPick }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Add exercises" tall>
      {/* Remount on each open so the search and selection start fresh. */}
      {open && <PickerBody onClose={onClose} onPick={onPick} />}
    </Sheet>
  );
}

function PickerBody({ onClose, onPick }: Omit<Props, 'open'>) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');
  const [picked, setPicked] = useState<string[]>([]);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const results = useMemo(
    () => (exercises ? filterExercises(exercises, { query, muscle, equipment: 'all' }) : []),
    [exercises, query, muscle],
  );

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="picker">
      <div className="picker-controls">
        <div className="search">
          <SearchIcon size={20} className="search-icon" />
          <input
            className="input"
            type="search"
            placeholder="Search exercises"
            aria-label="Search exercises"
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="select"
          aria-label="Muscle group"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value as MuscleGroup | 'all')}
        >
          <option value="all">All muscles</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>
              {MUSCLE_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <p className="muted picker-empty">No matches. You can create new exercises in the Library tab.</p>
      ) : (
        <ul className="list picker-list">
          {results.map((e) => {
            const on = picked.includes(e.id);
            return (
              <li key={e.id}>
                <button type="button" className="row row-button" aria-pressed={on} onClick={() => toggle(e.id)}>
                  <span className={on ? 'pick-box on' : 'pick-box'} aria-hidden="true">
                    {on && <CheckIcon size={18} />}
                  </span>
                  <span className="row-main">
                    <span className="row-title">{e.name}</span>
                    <span className="row-sub">
                      {MUSCLE_LABELS[e.primary]} · {EQUIPMENT_LABELS[e.equipment]}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="picker-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={picked.length === 0}
          onClick={() => {
            onPick(picked);
            onClose();
          }}
        >
          {picked.length === 0 ? 'Select exercises' : `Add ${picked.length} ${picked.length === 1 ? 'exercise' : 'exercises'}`}
        </button>
      </div>
    </div>
  );
}
