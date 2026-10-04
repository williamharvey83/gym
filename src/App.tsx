import { Navigate, Route, Routes } from 'react-router';
import TabBar from './components/TabBar.tsx';
import WorkoutScreen from './screens/WorkoutScreen.tsx';
import RoutinesScreen from './screens/RoutinesScreen.tsx';
import LibraryScreen from './screens/LibraryScreen.tsx';
import ExerciseDetailScreen from './screens/ExerciseDetailScreen.tsx';
import ExerciseEditScreen from './screens/ExerciseEditScreen.tsx';
import ProgressScreen from './screens/ProgressScreen.tsx';
import SettingsScreen from './screens/SettingsScreen.tsx';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/workout" replace />} />
        <Route path="/workout" element={<WorkoutScreen />} />
        <Route path="/routines" element={<RoutinesScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/library/new" element={<ExerciseEditScreen />} />
        <Route path="/library/:id" element={<ExerciseDetailScreen />} />
        <Route path="/library/:id/edit" element={<ExerciseEditScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/workout" replace />} />
      </Routes>
      <TabBar />
    </div>
  );
}
