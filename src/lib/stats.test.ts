import { describe, expect, it } from 'vitest';
import type { MuscleGroup, Workout } from '../db/types.ts';
import {
  addWeeks,
  dayKey,
  epley1RM,
  exerciseSeries,
  exercisesByRecency,
  heatLevel,
  setsPerDay,
  startOfWeek,
  topSet,
  volume,
  volumeByMuscle,
  weekStreaks,
  workoutCounts,
  workoutVolume,
} from './stats.ts';

// Dates are built in local time so the tests pass in any time zone.
const at = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h).getTime();
const s = (weight: number, reps: number) => ({ weight, reps, done: true });

function workout(id: string, startedAt: number, exercises: Workout['exercises']): Workout {
  return { id, name: id, routineId: null, startedAt, endedAt: startedAt + 3_600_000, exercises, exerciseIds: [...new Set(exercises.map((e) => e.exerciseId))] };
}

describe('epley1RM', () => {
  it('uses weight × (1 + reps / 30)', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.333, 3);
    expect(epley1RM(225, 5)).toBeCloseTo(262.5, 6);
    expect(epley1RM(200, 1)).toBeCloseTo(206.667, 3);
    expect(epley1RM(315, 30)).toBe(630);
  });

  it('is zero for zero reps or zero weight', () => {
    expect(epley1RM(100, 0)).toBe(0);
    expect(epley1RM(0, 12)).toBe(0);
  });
});

describe('topSet', () => {
  it('picks the heaviest set, breaking ties by reps', () => {
    expect(topSet([s(135, 10), s(185, 3), s(185, 5), s(155, 8)])).toEqual(s(185, 5));
    expect(topSet([])).toBeNull();
    expect(topSet([s(100, 0)])).toBeNull();
  });
});

describe('exerciseSeries', () => {
  it('makes one point per workout, oldest first, with the best e1RM of any set', () => {
    const ws = [
      workout('b', at(2026, 9, 10), [{ exerciseId: 'bench', sets: [s(185, 5), s(155, 12)] }]),
      workout('a', at(2026, 9, 3), [{ exerciseId: 'bench', sets: [s(175, 5)] }]),
      workout('c', at(2026, 9, 12), [{ exerciseId: 'squat', sets: [s(225, 5)] }]),
    ];
    const series = exerciseSeries(ws, 'bench');
    expect(series.map((p) => p.workoutId)).toEqual(['a', 'b']);
    expect(series[1]).toMatchObject({ topWeight: 185, topReps: 5 });
    // 155 × 12 -> 217 beats 185 × 5 -> 215.83
    expect(series[1]!.e1rm).toBeCloseTo(217, 6);
  });
});

describe('volume', () => {
  it('sums sets × reps × weight', () => {
    expect(volume([s(135, 10), s(135, 8), s(0, 12)])).toBe(2430);
    expect(volume([])).toBe(0);
    expect(workoutVolume({ exercises: [{ exerciseId: 'a', sets: [s(100, 5)] }, { exerciseId: 'b', sets: [s(50, 10)] }] })).toBe(1000);
  });

  it('groups by primary muscle within the week, highest first', () => {
    const primary: Record<string, MuscleGroup> = { bench: 'chest', fly: 'chest', squat: 'quads', row: 'upperBack' };
    const week = startOfWeek(at(2026, 9, 30));
    const ws = [
      workout('1', at(2026, 9, 28), [{ exerciseId: 'bench', sets: [s(100, 10)] }, { exerciseId: 'squat', sets: [s(200, 5), s(200, 5)] }]),
      workout('2', at(2026, 10, 2), [{ exerciseId: 'fly', sets: [s(30, 10)] }, { exerciseId: 'ghost', sets: [s(999, 9)] }]),
      workout('3', at(2026, 10, 6), [{ exerciseId: 'row', sets: [s(100, 10)] }]), // next week
    ];
    expect(volumeByMuscle(ws, (id) => primary[id], week, addWeeks(week, 1))).toEqual([
      { muscle: 'quads', volume: 2000, sets: 2 },
      { muscle: 'chest', volume: 1300, sets: 2 },
    ]);
  });
});

describe('weeks', () => {
  it('start on Monday', () => {
    expect(startOfWeek(at(2026, 10, 4))).toBe(at(2026, 9, 28, 0)); // Sunday -> previous Monday
    expect(startOfWeek(at(2026, 9, 28))).toBe(at(2026, 9, 28, 0)); // Monday -> same day
    expect(startOfWeek(at(2026, 10, 5, 0))).toBe(at(2026, 10, 5, 0));
  });

  it('stay on Mondays across daylight saving changes', () => {
    // US clocks fall back on Nov 1, 2026.
    const w = startOfWeek(at(2026, 10, 26));
    expect(new Date(addWeeks(w, 1)).getDay()).toBe(1);
    expect(new Date(addWeeks(w, 1)).getHours()).toBe(0);
    expect(dayKey(addWeeks(w, 1))).toBe('2026-11-02');
  });
});

describe('weekStreaks', () => {
  const now = at(2026, 10, 7); // Wednesday

  it('is zero with no workouts', () => {
    expect(weekStreaks([], now)).toEqual({ current: 0, longest: 0 });
  });

  it('counts consecutive weeks including this one', () => {
    const starts = [at(2026, 10, 6), at(2026, 9, 30), at(2026, 9, 29), at(2026, 9, 22)];
    expect(weekStreaks(starts, now)).toEqual({ current: 3, longest: 3 });
  });

  it("keeps the streak alive when this week hasn't had a workout yet", () => {
    expect(weekStreaks([at(2026, 9, 30), at(2026, 9, 22)], now)).toEqual({ current: 2, longest: 2 });
  });

  it('breaks after a full week with no workout', () => {
    expect(weekStreaks([at(2026, 9, 22), at(2026, 9, 15)], now)).toEqual({ current: 0, longest: 2 });
  });

  it('finds the longest run anywhere in history', () => {
    const starts = [at(2026, 10, 6), at(2026, 6, 1), at(2026, 6, 8), at(2026, 6, 15), at(2026, 6, 22)];
    expect(weekStreaks(starts, now)).toEqual({ current: 1, longest: 4 });
  });
});

describe('workoutCounts', () => {
  it('counts this week, this month, and total', () => {
    const now = at(2026, 10, 4);
    const starts = [at(2026, 10, 4, 7), at(2026, 10, 1), at(2026, 9, 29), at(2026, 9, 27), at(2025, 1, 1)];
    expect(workoutCounts(starts, now)).toEqual({ week: 3, month: 2, total: 5 });
  });
});

describe('calendar', () => {
  it('sums sets per local day and shades by level', () => {
    const ws = [
      workout('a', at(2026, 10, 4, 7), [{ exerciseId: 'x', sets: [s(1, 1), s(1, 1)] }]),
      workout('b', at(2026, 10, 4, 19), [{ exerciseId: 'y', sets: [s(1, 1)] }]),
    ];
    expect(setsPerDay(ws).get('2026-10-04')).toBe(3);
    expect([0, 1, 9, 10, 19, 20, 40].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it('lists exercises most recent first', () => {
    const ws = [
      workout('a', at(2026, 9, 1), [{ exerciseId: 'bench', sets: [s(1, 1)] }]),
      workout('b', at(2026, 9, 5), [{ exerciseId: 'squat', sets: [s(1, 1)] }]),
      workout('c', at(2026, 9, 3), [{ exerciseId: 'bench', sets: [s(1, 1)] }]),
    ];
    expect(exercisesByRecency(ws)).toEqual(['squat', 'bench']);
  });
});
