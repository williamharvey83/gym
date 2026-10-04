import { Link } from 'react-router';

/** Overview / History switch at the top of the Progress tab. */
export default function ProgressTabs({ current }: { current: 'overview' | 'history' }) {
  return (
    <nav className="segmented" aria-label="Progress views">
      <Link to="/progress" replace className="segment" aria-current={current === 'overview' ? 'page' : undefined}>
        Overview
      </Link>
      <Link to="/history" replace className="segment" aria-current={current === 'history' ? 'page' : undefined}>
        History
      </Link>
    </nav>
  );
}
