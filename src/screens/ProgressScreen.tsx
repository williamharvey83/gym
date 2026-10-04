import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { ChartIcon } from '../components/icons.tsx';

export default function ProgressScreen() {
  return (
    <Screen title="Progress">
      <EmptyState
        icon={<ChartIcon size={40} />}
        title="No workouts logged yet"
        hint="Finish your first workout and your charts, streaks, and history will show up here."
      />
    </Screen>
  );
}
