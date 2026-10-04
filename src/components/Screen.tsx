import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BackIcon } from './icons.tsx';

type Props = {
  title: string;
  /** Where Back goes when there is no in-app history (deep link or refresh). */
  backTo?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function Screen({ title, backTo, actions, children }: Props) {
  return (
    <main className="screen">
      {backTo && <BackButton fallback={backTo} />}
      <header className="screen-header">
        <h1 className="screen-title">{title}</h1>
        {actions && <div className="screen-actions">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

/**
 * Goes back one screen, or to `fallback` when the app was opened directly on
 * this screen (deep link or refresh) and there is nothing in-app to go back to.
 */
export function useGoBack(fallback: string): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  // 'default' is the key of the first entry React Router saw.
  const canGoBack = location.key !== 'default';
  return () => (canGoBack ? navigate(-1) : navigate(fallback, { replace: true }));
}

function BackButton({ fallback }: { fallback: string }) {
  const goBack = useGoBack(fallback);
  return (
    <button type="button" className="back-btn" onClick={goBack}>
      <BackIcon size={22} />
      Back
    </button>
  );
}
