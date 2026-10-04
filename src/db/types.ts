export const MUSCLE_GROUPS = [
  'chest',
  'upperBack',
  'lats',
  'lowerBack',
  'traps',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  upperBack: 'Upper Back',
  lats: 'Lats',
  lowerBack: 'Lower Back',
  traps: 'Traps',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
};

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
  other: 'Other',
};

export const MAX_CUES = 4;

export type Exercise = {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  equipment: Equipment;
  cues: string[];
  /** True for preloaded lifts. Built-ins can be edited and restored. */
  builtIn: boolean;
  /** True once a built-in has been edited, so seed updates never overwrite it. */
  edited: boolean;
  createdAt: number;
  updatedAt: number;
};

export type RoutineExercise = {
  exerciseId: string;
  sets: number;
};

export type Routine = {
  id: string;
  name: string;
  /** Sort position on the Routines screen. */
  order: number;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
};

export type SetEntry = {
  /** Pounds, in 0.5 lb steps. For bodyweight lifts this is added load. */
  weight: number;
  reps: number;
  done: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: SetEntry[];
};

export type Workout = {
  id: string;
  name: string;
  routineId: string | null;
  /** Epoch ms. */
  startedAt: number;
  endedAt: number;
  exercises: WorkoutExercise[];
  /** Denormalized for the multi-entry index used by exercise history. */
  exerciseIds: string[];
};

/** The workout being logged right now. Stored on every change for crash recovery. */
export type ActiveWorkout = {
  key: 'current';
  name: string;
  routineId: string | null;
  startedAt: number;
  exercises: WorkoutExercise[];
};

export type MetaRow = { key: string; value: unknown };
