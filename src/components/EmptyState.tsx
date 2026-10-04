import type { ReactNode } from 'react';

type Props = {
  icon?: ReactNode;
  title: string;
  hint: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, hint, action }: Props) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-title">{title}</p>
      <p className="empty-hint">{hint}</p>
      {action}
    </div>
  );
}
