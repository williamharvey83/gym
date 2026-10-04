import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { ListIcon } from '../components/icons.tsx';

export default function RoutinesScreen() {
  return (
    <Screen title="Routines">
      <EmptyState
        icon={<ListIcon size={40} />}
        title="No routines yet"
        hint="Create a routine like Push, Pull, or Legs to start workouts with one tap."
      />
    </Screen>
  );
}
