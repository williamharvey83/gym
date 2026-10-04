import { Link, useLocation } from 'react-router';
import type { ComponentType } from 'react';
import { BookIcon, ChartIcon, DumbbellIcon, GearIcon, ListIcon } from './icons.tsx';
import { useActiveWorkout } from '../db/activeWorkoutStore.ts';

const TABS: { to: string; label: string; Icon: ComponentType<{ size?: number }>; also?: string[] }[] = [
  { to: '/workout', label: 'Workout', Icon: DumbbellIcon },
  { to: '/routines', label: 'Routines', Icon: ListIcon },
  { to: '/library', label: 'Library', Icon: BookIcon },
  // Past workouts belong with history on the Progress tab.
  { to: '/progress', label: 'Progress', Icon: ChartIcon, also: ['/history'] },
  { to: '/settings', label: 'Settings', Icon: GearIcon },
];

export default function TabBar() {
  const { pathname } = useLocation();
  const inProgress = useActiveWorkout() !== null;

  return (
    <nav className="tabbar" aria-label="Main">
      <ul className="tabbar-list">
        {TABS.map(({ to, label, Icon, also = [] }) => {
          const active = [to, ...also].some((p) => pathname === p || pathname.startsWith(`${p}/`));
          const live = to === '/workout' && inProgress;
          return (
            <li key={to}>
              <Link to={to} className={active ? 'tab active' : 'tab'} aria-current={active ? 'page' : undefined}>
                <span className="tab-icon">
                  <Icon size={22} />
                  {live && <span className="tab-dot" />}
                </span>
                {label}
                {live && <span className="visually-hidden"> (in progress)</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
