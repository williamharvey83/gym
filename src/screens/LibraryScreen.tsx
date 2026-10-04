import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { ChevronIcon, PlusIcon, SearchIcon } from '../components/icons.tsx';
import { db } from '../db/db.ts';
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type Equipment,
  type MuscleGroup,
} from '../db/types.ts';
import { filterExercises } from '../lib/exercises.ts';

function asMuscle(v: string | null): MuscleGroup | 'all' {
  return v && (MUSCLE_GROUPS as readonly string[]).includes(v) ? (v as MuscleGroup) : 'all';
}

function asEquipment(v: string | null): Equipment | 'all' {
  return v && (EQUIPMENT as readonly string[]).includes(v) ? (v as Equipment) : 'all';
}

export default function LibraryScreen() {
  // Filters live in the URL so they survive opening an exercise and coming back.
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const muscle = asMuscle(params.get('muscle'));
  const equipment = asEquipment(params.get('equip'));

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const results = useMemo(
    () => (exercises ? filterExercises(exercises, { query, muscle, equipment }) : []),
    [exercises, query, muscle, equipment],
  );

  function setParam(key: string, value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  const filtered = query !== '' || muscle !== 'all' || equipment !== 'all';

  return (
    <Screen
      title="Library"
      actions={
        <Link to="/library/new" className="btn btn-primary">
          <PlusIcon size={20} />
          Add
        </Link>
      }
    >
      <div className="search">
        <label htmlFor="lib-search" className="visually-hidden">
          Search exercises
        </label>
        <SearchIcon size={20} className="search-icon" />
        <input
          id="lib-search"
          className="input"
          type="search"
          placeholder="Search exercises"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setParam('q', e.target.value)}
        />
      </div>

      <div className="filters">
        <div>
          <label htmlFor="lib-muscle" className="visually-hidden">
            Muscle group
          </label>
          <select id="lib-muscle" className="select" value={muscle} onChange={(e) => setParam('muscle', e.target.value)}>
            <option value="all">All muscles</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>
                {MUSCLE_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lib-equip" className="visually-hidden">
            Equipment
          </label>
          <select id="lib-equip" className="select" value={equipment} onChange={(e) => setParam('equip', e.target.value)}>
            <option value="all">All equipment</option>
            {EQUIPMENT.map((q) => (
              <option key={q} value={q}>
                {EQUIPMENT_LABELS[q]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {exercises === undefined ? null : exercises.length === 0 ? (
        <EmptyState
          title="Your library is empty"
          hint="Tap Add to create your first exercise."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="No matches"
          hint="Try a different word, or clear the filters."
          action={
            <button type="button" className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <p className="result-count" aria-live="polite">
            {results.length} {results.length === 1 ? 'exercise' : 'exercises'}
            {filtered && ' found'}
          </p>
          <ul className="list">
            {results.map((e) => (
              <li key={e.id}>
                <Link to={`/library/${encodeURIComponent(e.id)}`} className="row">
                  <div className="row-main">
                    <div className="row-title">{e.name}</div>
                    <div className="row-sub">
                      {MUSCLE_LABELS[e.primary]} · {EQUIPMENT_LABELS[e.equipment]}
                      {!e.builtIn && ' · Custom'}
                    </div>
                  </div>
                  <ChevronIcon size={20} className="row-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}
