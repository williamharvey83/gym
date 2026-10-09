import { MinusIcon, PlusIcon } from './icons.tsx';
import { saveGoals, useGoals } from '../db/weeklySets.ts';
import { DEFAULT_GOALS, MAX_GOAL, MIN_GOAL, TARGET_GROUPS, TARGET_LABELS, type Goals } from '../lib/muscleTargets.ts';

/** Steppers for each group's weekly set goal. Saves on every tap. */
export default function GoalsEditor() {
  const goals = useGoals();
  if (!goals) return null;

  const set = (next: Goals) => void saveGoals(next);
  const isDefault = TARGET_GROUPS.every((g) => goals[g] === DEFAULT_GOALS[g]);

  return (
    <div className="card settings-card">
      <p className="field-hint">
        Checked sets count toward the exercise's primary muscle. Lats, upper back, and lower back count together as Back.
        Weeks reset Monday at 12:00 AM.
      </p>
      <ul className="goal-list">
        {TARGET_GROUPS.map((g) => (
          <li key={g} className="goal-row">
            <span className="goal-name" id={`goal-${g}`}>
              {TARGET_LABELS[g]}
            </span>
            <div className="stepper" role="group" aria-labelledby={`goal-${g}`}>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Lower ${TARGET_LABELS[g]} goal`}
                disabled={goals[g] <= MIN_GOAL}
                onClick={() => set({ ...goals, [g]: goals[g] - 1 })}
              >
                <MinusIcon size={20} />
              </button>
              <span className="stepper-value" aria-live="polite">
                {goals[g]} {goals[g] === 1 ? 'set' : 'sets'}
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Raise ${TARGET_LABELS[g]} goal`}
                disabled={goals[g] >= MAX_GOAL}
                onClick={() => set({ ...goals, [g]: goals[g] + 1 })}
              >
                <PlusIcon size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-secondary btn-block" disabled={isDefault} onClick={() => set({ ...DEFAULT_GOALS })}>
        Reset to defaults (Chest and Back 12, others 6)
      </button>
    </div>
  );
}
