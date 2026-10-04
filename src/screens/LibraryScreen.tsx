import Screen from '../components/Screen.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { BookIcon } from '../components/icons.tsx';

export default function LibraryScreen() {
  return (
    <Screen title="Library">
      <EmptyState
        icon={<BookIcon size={40} />}
        title="Exercise library"
        hint="About 150 common lifts will appear here, searchable by name, muscle, and equipment."
      />
    </Screen>
  );
}
