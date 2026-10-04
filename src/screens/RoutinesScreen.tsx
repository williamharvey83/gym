import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { ActionSheet } from '../components/Sheet.tsx';
import { ListIcon, MoreIcon, PlusIcon } from '../components/icons.tsx';
import { db } from '../db/db.ts';
import { getActiveWorkout } from '../db/activeWorkoutStore.ts';
import { deleteRoutine, duplicateRoutine, listRoutines, moveRoutine } from '../db/routineRepo.ts';
import { startRoutineWorkout } from '../db/workoutRepo.ts';
import type { Routine } from '../db/types.ts';

export default function RoutinesScreen() {
  const navigate = useNavigate();
  const routines = useLiveQuery(() => listRoutines(), []);
  const names = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e.name])), []);
  const [menuId, setMenuId] = useState<string | null>(null);

  const menuIndex = routines?.findIndex((r) => r.id === menuId) ?? -1;
  const menuRoutine = routines?.[menuIndex];

  async function start(r: Routine) {
    if (getActiveWorkout()) {
      if (window.confirm('A workout is already in progress. Go to it now?')) navigate('/workout');
      return;
    }
    await startRoutineWorkout(r);
    navigate('/workout');
  }

  return (
    <Screen
      title="Routines"
      actions={
        <Link to="/routines/new" className="btn btn-primary">
          <PlusIcon size={20} />
          New
        </Link>
      }
    >
      {routines === undefined ? null : routines.length === 0 ? (
        <EmptyState
          icon={<ListIcon size={40} />}
          title="No routines yet"
          hint="Create a routine like Push, Pull, or Legs to start workouts with one tap."
          action={
            <Link to="/routines/new" className="btn btn-primary">
              Create routine
            </Link>
          }
        />
      ) : (
        <ul className="routine-list">
          {routines.map((r) => {
            const sets = r.exercises.reduce((n, e) => n + e.sets, 0);
            return (
              <li key={r.id} className="card routine-card">
                <div className="routine-head">
                  <h2 className="routine-name">{r.name}</h2>
                  <button type="button" className="icon-btn" aria-label={`Options for ${r.name}`} onClick={() => setMenuId(r.id)}>
                    <MoreIcon size={24} />
                  </button>
                </div>
                <p className="row-sub">
                  {r.exercises.length} {r.exercises.length === 1 ? 'exercise' : 'exercises'} · {sets}{' '}
                  {sets === 1 ? 'set' : 'sets'}
                </p>
                {r.exercises.length > 0 && (
                  <p className="routine-preview">
                    {r.exercises.map((e) => names?.get(e.exerciseId) ?? 'Exercise').join(', ')}
                  </p>
                )}
                <button type="button" className="btn btn-primary btn-block" onClick={() => start(r)}>
                  Start workout
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ActionSheet
        open={!!menuRoutine}
        onClose={() => setMenuId(null)}
        title={menuRoutine?.name ?? ''}
        actions={[
          { label: 'Edit', onSelect: () => navigate(`/routines/${menuId}/edit`) },
          { label: 'Duplicate', onSelect: () => menuId && void duplicateRoutine(menuId) },
          { label: 'Move up', disabled: menuIndex <= 0, onSelect: () => menuId && void moveRoutine(menuId, -1) },
          {
            label: 'Move down',
            disabled: menuIndex < 0 || menuIndex >= (routines?.length ?? 0) - 1,
            onSelect: () => menuId && void moveRoutine(menuId, 1),
          },
          {
            label: 'Delete',
            danger: true,
            onSelect: () => {
              if (menuId && window.confirm(`Delete the “${menuRoutine?.name}” routine? Past workouts are kept.`)) {
                void deleteRoutine(menuId);
              }
            },
          },
        ]}
      />
    </Screen>
  );
}
