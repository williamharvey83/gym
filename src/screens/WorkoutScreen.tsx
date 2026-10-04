import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { DumbbellIcon } from '../components/icons.tsx';

export default function WorkoutScreen() {
  return (
    <Screen title="Workout">
      <EmptyState
        icon={<DumbbellIcon size={40} />}
        title="No workout in progress"
        hint="Start from one of your routines, or start an empty workout and add exercises as you go."
        action={
          <button type="button" className="btn btn-primary btn-block" disabled>
            Start empty workout
          </button>
        }
      />
    </Screen>
  );
}
