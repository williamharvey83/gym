import { describe, expect, it } from 'vitest';
import type { ActiveWorkout, DraftSet, Routine, SetEntry } from '../db/types.ts';
import {
  fillBlanksBelow,
  fromDraftExercises,
  moveItem,
  newDraftExercise,
  nextSet,
  routineChanged,
  routineShape,
  setsForExercise,
  setsFromHistory,
  startFromRoutine,
  timesFromInputs,
  toDateInput,
  toDraftExercises,
  toSavedWorkout,
  toTimeInput,
  type LastSession,
} from './workout.ts';

const s = (weight: number, reps: number): SetEntry => ({ weight, reps, done: true });
const d = (weight: number | null, reps: number | null, done = false): DraftSet => ({ key: 'k', weight, reps, done });
const values = (sets: DraftSet[]) => sets.map((x) => [x.weight, x.reps, x.done]);

describe('setsFromHistory', () => {
  const last = [s(135, 8), s(145, 6)];

  it('copies last session set by set, unchecked', () => {
    expect(values(setsFromHistory(last, 2))).toEqual([
      [135, 8, false],
      [145, 6, false],
    ]);
  });

  it('repeats the final set when planning more sets than last time', () => {
    expect(values(setsFromHistory(last, 3))).toEqual([
      [135, 8, false],
      [145, 6, false],
      [145, 6, false],
    ]);
  });

  it('gives blank sets with no history, and at least one set', () => {
    expect(values(setsFromHistory(undefined, 2))).toEqual([
      [null, null, false],
      [null, null, false],
    ]);
    expect(setsFromHistory(undefined, 0)).toHaveLength(1);
  });

  it('gives every set its own key', () => {
    const keys = setsFromHistory(last, 3).map((x) => x.key);
    expect(new Set(keys).size).toBe(3);
  });
});

describe('nextSet', () => {
  it("prefers last session's matching set", () => {
    expect(values([nextSet([d(100, 10)], [s(135, 8), s(145, 6)])])).toEqual([[145, 6, false]]);
  });

  it('copies the set above when last session had fewer sets', () => {
    expect(values([nextSet([d(135, 8), d(150, 5, true)], [s(135, 8)])])).toEqual([[150, 5, false]]);
  });

  it('is blank with nothing to copy', () => {
    expect(values([nextSet([], undefined)])).toEqual([[null, null, false]]);
  });
});

describe('fillBlanksBelow', () => {
  it('copies a checked set into blank sets below it only', () => {
    const sets = [d(null, null), d(135, 8, true), d(null, null), d(140, null), d(null, null, true)];
    expect(values(fillBlanksBelow(sets, 1))).toEqual([
      [null, null, false],
      [135, 8, true],
      [135, 8, false],
      [140, null, false],
      [null, null, true],
    ]);
  });
});

describe('newDraftExercise', () => {
  it('matches last session set count', () => {
    expect(newDraftExercise('x', [s(1, 1), s(1, 1), s(1, 1)]).sets).toHaveLength(3);
    expect(newDraftExercise('x', undefined).sets).toHaveLength(1);
  });
});

describe('startFromRoutine', () => {
  it('builds planned sets prefilled from history', () => {
    const routine: Routine = {
      id: 'r1',
      name: 'Push',
      order: 0,
      createdAt: 0,
      updatedAt: 0,
      exercises: [
        { exerciseId: 'bench', sets: 3 },
        { exerciseId: 'fly', sets: 2 },
      ],
    };
    const last = new Map<string, LastSession>([['bench', { workoutId: 'w', startedAt: 0, sets: [s(185, 5)] }]]);
    const w = startFromRoutine(routine, last, 1000);
    expect(w).toMatchObject({ name: 'Push', routineId: 'r1', startedAt: 1000 });
    expect(values(w.exercises[0]!.sets)).toEqual([
      [185, 5, false],
      [185, 5, false],
      [185, 5, false],
    ]);
    expect(values(w.exercises[1]!.sets)).toEqual([
      [null, null, false],
      [null, null, false],
    ]);
  });
});

describe('toSavedWorkout', () => {
  const active: ActiveWorkout = {
    key: 'current',
    name: '  ',
    routineId: null,
    startedAt: 1000,
    exercises: [
      { key: 'a', exerciseId: 'bench', sets: [d(135, 8, true), d(135, 8, false), d(null, 8, true)] },
      { key: 'b', exerciseId: 'fly', sets: [d(30, 12, false)] },
      { key: 'c', exerciseId: 'bench', sets: [d(95, 12, true)] },
    ],
  };

  it('keeps only checked, complete sets and drops empty exercises', () => {
    const r = toSavedWorkout(active, 'w1', 5000);
    expect(r.savedSets).toBe(2);
    expect(r.skippedSets).toBe(3);
    expect(r.workout).toEqual({
      id: 'w1',
      name: 'Workout',
      routineId: null,
      startedAt: 1000,
      endedAt: 5000,
      exercises: [
        { exerciseId: 'bench', sets: [s(135, 8)] },
        { exerciseId: 'bench', sets: [s(95, 12)] },
      ],
      exerciseIds: ['bench'],
    });
  });

  it('never ends before it starts', () => {
    expect(toSavedWorkout(active, 'w1', 10).workout.endedAt).toBe(1000);
  });
});

describe('setsForExercise', () => {
  it('joins sets across repeated entries', () => {
    const w = { exercises: [{ exerciseId: 'a', sets: [s(1, 1)] }, { exerciseId: 'b', sets: [s(2, 2)] }, { exerciseId: 'a', sets: [s(3, 3)] }] };
    expect(setsForExercise(w, 'a')).toEqual([s(1, 1), s(3, 3)]);
  });
});

describe('routineChanged', () => {
  const planned = [
    { exerciseId: 'a', sets: 3 },
    { exerciseId: 'b', sets: 2 },
  ];

  it('is false when the shape matches', () => {
    const actual = routineShape([
      { key: '1', exerciseId: 'a', sets: [d(1, 1), d(1, 1), d(1, 1)] },
      { key: '2', exerciseId: 'b', sets: [d(1, 1), d(1, 1)] },
    ]);
    expect(routineChanged(planned, actual)).toBe(false);
  });

  it('detects added sets, reordering, and added or removed exercises', () => {
    expect(routineChanged(planned, [{ exerciseId: 'a', sets: 4 }, { exerciseId: 'b', sets: 2 }])).toBe(true);
    expect(routineChanged(planned, [{ exerciseId: 'b', sets: 2 }, { exerciseId: 'a', sets: 3 }])).toBe(true);
    expect(routineChanged(planned, [{ exerciseId: 'a', sets: 3 }])).toBe(true);
    expect(routineChanged(planned, [...planned, { exerciseId: 'c', sets: 1 }])).toBe(true);
  });
});

describe('editing past workouts', () => {
  it('round-trips through the editor form', () => {
    const exercises = [{ exerciseId: 'a', sets: [s(100, 5), s(110, 3)] }];
    const r = fromDraftExercises(toDraftExercises({ exercises }));
    expect(r).toEqual({ ok: true, value: exercises });
  });

  it('rejects sets with missing values', () => {
    const r = fromDraftExercises([{ key: '1', exerciseId: 'a', sets: [d(100, null, true)] }]);
    expect(r.ok).toBe(false);
  });

  it('drops exercises with no sets but requires at least one set overall', () => {
    expect(fromDraftExercises([{ key: '1', exerciseId: 'a', sets: [] }]).ok).toBe(false);
    const r = fromDraftExercises([
      { key: '1', exerciseId: 'a', sets: [] },
      { key: '2', exerciseId: 'b', sets: [d(5, 5, true)] },
    ]);
    expect(r).toEqual({ ok: true, value: [{ exerciseId: 'b', sets: [s(5, 5)] }] });
  });
});

describe('moveItem', () => {
  it('moves up and down, ignoring out-of-range moves', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 2)).toEqual(['a', 'b']);
  });
});

describe('date and time inputs', () => {
  it('round-trips local date and time', () => {
    const ms = new Date(2026, 9, 4, 18, 5).getTime();
    expect(toDateInput(ms)).toBe('2026-10-04');
    expect(toTimeInput(ms)).toBe('18:05');
    expect(timesFromInputs('2026-10-04', '18:05', '19:20')).toEqual({
      startedAt: ms,
      endedAt: new Date(2026, 9, 4, 19, 20).getTime(),
    });
  });

  it('treats an end before the start as past midnight', () => {
    expect(timesFromInputs('2026-10-04', '23:30', '00:45')?.endedAt).toBe(new Date(2026, 9, 5, 0, 45).getTime());
  });

  it('rejects bad input', () => {
    expect(timesFromInputs('', '18:00', '19:00')).toBeNull();
    expect(timesFromInputs('2026-10-04', 'x', '19:00')).toBeNull();
  });
});
