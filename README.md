# Gym Tracker

A personal resistance-training tracker that runs as an installable web app (PWA) on your phone. It works fully offline, keeps every byte of data on the device, and has no accounts, backend, or analytics.

**Live app:** https://williamharvey83.github.io/gym/

## Features

- **Exercise library** — 165 preloaded lifts with muscles, equipment, and form cues. Search (understands shorthand like `db`, `bb`, `rdl`, `ohp`), filter by primary muscle and equipment, edit any lift, add your own.
- **Routines** — create, edit, reorder, duplicate, and delete templates like Push / Pull / Legs.
- **Live workout logger** — start from a routine or empty. Add, remove, and reorder exercises and sets. Each exercise shows what you did last time and prefills new sets so you can confirm with one tap. Every keystroke is saved, so a closed or crashed app comes back exactly where you left it.
- **Rest timer** — manual start with 1:00 / 1:30 / 2:00 / 3:00 presets and ±15 s. Timestamp-based, so it stays accurate when the phone locks. Tone and vibration (where supported) at the end.
- **Progress** — top set and estimated 1RM (Epley) per exercise, weekly volume by primary muscle, a 12-month calendar, week streaks, summary counts, and a full history you can edit.
- **Backup** — export everything to one JSON file and restore it later.

Units are pounds throughout, in 0.5 lb steps.

## Local development

Requires Node.js 24 or newer.

```bash
npm ci            # install exact dependency versions
npm run dev       # dev server at http://localhost:5173/gym/
npm test          # unit tests (Vitest)
npm run build     # type-check and build to dist/
npm run preview   # serve the production build at http://localhost:4173/gym/
```

The service worker only runs in the production build, so use `npm run build && npm run preview` to test offline behavior and installation.

### Project layout

```
src/
  db/          Dexie schema, seed data, and data access (workouts, routines, backup, stores)
  lib/         Pure logic with unit tests: stats, backup validation, timer, workout helpers
  components/  Shared UI: sheets, number fields, workout editor, charts
  screens/     One file per screen
  index.css    Color tokens and all styles
```

### Changing the database schema

The schema is versioned in `src/db/db.ts`. Never edit a released version. To change it:

1. Add `this.version(n + 1).stores({...})` with only the changed tables, plus `.upgrade(tx => ...)` if existing rows need reshaping.
2. Bump `SCHEMA_VERSION` to `n + 1`.
3. Add a matching step to `migrate()` in `src/lib/backup.ts` so older backup files still import.

To add preloaded exercises, append rows in `src/db/seedExercises.ts` (never rename existing ones; ids come from names) and bump `SEED_VERSION`. Existing installs receive the new lifts without losing edits.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which installs, runs the tests, builds, and publishes `dist/` to GitHub Pages. A failing test blocks the deploy.

One-time setup (already done for this repo): **Settings → Pages → Build and deployment → Source: GitHub Actions.**

The site is served from the `/gym/` subpath. If you rename the repository, change `BASE` in `vite.config.ts` to match. That one constant sets the asset paths, the manifest `start_url`/`scope`/`id`, and the service worker scope. Routes use hash URLs (`/gym/#/progress`), so refreshes and deep links never 404 on Pages.

After a deploy, an installed app picks up the new version the next time it's opened (sometimes it takes two launches: one to download, one to apply).

## Install on your phone

- **iPhone (Safari):** open the live link → Share → **Add to Home Screen**.
- **Android (Chrome):** open the live link → menu → **Install app**.

Installing matters on iPhone: Safari can clear website data for sites you haven't visited in a while, and home-screen apps get stronger protection. Settings shows whether the browser has granted persistent storage.

## Back up and restore

Your data lives only in this browser on this phone. Back it up regularly and keep the file somewhere else (iCloud Drive, Google Drive, email to yourself).

**Back up:** Settings → **Export backup** (downloads `gym-backup-YYYY-MM-DD.json`) or **Share backup…** (opens the share sheet, so you can save to Files, AirDrop, or email it). Settings shows the date of your last backup.

**Restore:** Settings → **Import backup** → choose the file.

1. The whole file is validated first: format, version, every exercise, routine, workout, and set, and that every reference points to something in the file.
2. If anything is wrong, you get a message saying what and where, and **nothing changes**.
3. If it's valid, you see a summary (workouts, sets, date range, routines, exercises) and what will be replaced.
4. **Replace data** swaps everything in one database transaction. If anything fails midway, your existing data is left exactly as it was. There is no partial import.

Notes:

- Import **replaces** all exercises, routines, and workouts; it does not merge.
- Finish or discard any workout in progress before importing.
- A backup from a newer version of the app is refused; update the app first. Older backups are upgraded automatically.
- To move to a new phone: export on the old one, install on the new one, import.

### Backup file format

```json
{
  "app": "gym-tracker",
  "format": 1,
  "schemaVersion": 1,
  "exportedAt": "2026-10-04T18:00:00.000Z",
  "seedVersion": 1,
  "data": { "exercises": [], "routines": [], "workouts": [] }
}
```

## Known limits

- **iPhone rest-timer alerts:** iOS doesn't allow web apps to vibrate, and pauses them in the background, so the end-of-rest tone only plays while the app is on screen and the ringer is on. The countdown itself is always correct when you return.
- **Volume** counts each exercise's primary muscle only. Bodyweight lifts log *added* load, so a plain pull-up adds 0 lb.
- **Estimated 1RM** uses Epley (`weight × (1 + reps / 30)`) for every set, including singles.

## Design and accessibility

Colors are CSS variables in `src/index.css`:

| Token | Hex | Use |
|---|---|---|
| Background | `#F6F5F1` | page |
| Iron | `#14181F` | text, structure, nav |
| Flow | `#004C99` | primary actions, active states, primary chart series |
| Tonal Step | `#3D7BC4` | secondary chart series, progress visuals (large text / graphics only) |
| Signal | `#E2581C` | accent only: rest-timer finish, highlight badges (always with Iron text) |

`src/lib/contrast.test.ts` checks every text/background pair against WCAG AA, so a color change that breaks contrast fails the build. Tap targets are at least 48 px, and weight/rep fields open the numeric keypad. The app was audited with axe-core (WCAG 2.2 AA) on every screen, the live workout, and its sheets, with no violations.
