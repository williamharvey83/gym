import { Navigate, Route, Routes } from 'react-router';
import TabBar from './components/TabBar.tsx';
import WorkoutScreen from './screens/WorkoutScreen.tsx';
import WorkoutDetailScreen from './screens/WorkoutDetailScreen.tsx';
import WorkoutEditScreen from './screens/WorkoutEditScreen.tsx';
import RoutinesScreen from './screens/RoutinesScreen.tsx';
import RoutineEditScreen from './screens/RoutineEditScreen.tsx';
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
        <Route path="/history/:id" element={<WorkoutDetailScreen />} />
        <Route path="/history/:id/edit" element={<WorkoutEditScreen />} />
        <Route path="/routines" element={<RoutinesScreen />} />
        <Route path="/routines/new" element={<RoutineEditScreen />} />
        <Route path="/routines/:id/edit" element={<RoutineEditScreen />} />
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
