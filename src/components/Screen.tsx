import type { ReactNode } from 'react';

type Props = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function Screen({ title, actions, children }: Props) {
  return (
    <main className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{title}</h1>
        {actions}
      </header>
      {children}
    </main>
  );
}
