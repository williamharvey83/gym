import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { GearIcon } from '../components/icons.tsx';

export default function SettingsScreen() {
  return (
    <Screen title="Settings">
      <EmptyState
        icon={<GearIcon size={40} />}
        title="Settings"
        hint="Backup, restore, and storage status will live here."
      />
    </Screen>
  );
}
