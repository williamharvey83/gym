import { NavLink } from 'react-router';
import type { ComponentType } from 'react';
import { BookIcon, ChartIcon, DumbbellIcon, GearIcon, ListIcon } from './icons.tsx';

const TABS: { to: string; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { to: '/workout', label: 'Workout', Icon: DumbbellIcon },
  { to: '/routines', label: 'Routines', Icon: ListIcon },
  { to: '/library', label: 'Library', Icon: BookIcon },
  { to: '/progress', label: 'Progress', Icon: ChartIcon },
  { to: '/settings', label: 'Settings', Icon: GearIcon },
];

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      <ul className="tabbar-list">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
              <span className="tab-icon">
                <Icon size={22} />
              </span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
