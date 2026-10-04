import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './App.tsx';
import { db } from './db/db.ts';
import { initDatabase } from './db/setup.ts';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');
const root = createRoot(rootEl);

// Seed the library before first render so screens never see a half-built
// database. This takes a few milliseconds after the first launch.
initDatabase(db)
  .then(() => {
    // HashRouter keeps every route under index.html, so refreshes and deep
    // links never 404 on GitHub Pages.
    root.render(
      <StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </StrictMode>,
    );
  })
  .catch((err: unknown) => {
    console.error(err);
    root.render(
      <main className="screen">
        <h1 className="screen-title">Storage unavailable</h1>
        <p>
          This browser blocked on-device storage, so the app can't save workouts. Private browsing mode often causes
          this. Open the app in a normal browser window, or from your home screen.
        </p>
      </main>,
    );
  });
