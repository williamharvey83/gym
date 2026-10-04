import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Screen from '../components/Screen.tsx';
import Sheet from '../components/Sheet.tsx';
import { CheckIcon } from '../components/icons.tsx';
import { db, SCHEMA_VERSION } from '../db/db.ts';
import { useActiveWorkout } from '../db/activeWorkoutStore.ts';
import { META_LAST_EXPORT, createBackup, recordExport, replaceAllData } from '../db/backupRepo.ts';
import { META_PERSIST, ensurePersistence, type PersistStatus } from '../db/setup.ts';
import { backupFileName, validateBackup, type BackupFile, type BackupSummary } from '../lib/backup.ts';
import { formatDate, formatShortDate, plural } from '../lib/format.ts';

function isInstalled(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function daysAgo(ms: number): string {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function mb(bytes: number): string {
  return bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000))} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function makeFile(backup: BackupFile, now: number): File {
  return new File([JSON.stringify(backup)], backupFileName(now), { type: 'application/json' });
}

export default function SettingsScreen() {
  const persist = useLiveQuery(async () => (await db.meta.get(META_PERSIST))?.value as PersistStatus | undefined, []);
  const lastExport = useLiveQuery(async () => (await db.meta.get(META_LAST_EXPORT))?.value as number | undefined, []);
  const counts = useLiveQuery(
    async () => ({
      workouts: await db.workouts.count(),
      routines: await db.routines.count(),
      exercises: await db.exercises.count(),
    }),
    [],
  );
  const usage = useLiveQuery(async () => (navigator.storage?.estimate ? (await navigator.storage.estimate()).usage : undefined), []);
  const active = useActiveWorkout();

  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [pending, setPending] = useState<{ file: BackupFile; summary: BackupSummary; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const canShareFiles = (() => {
    try {
      return !!navigator.canShare?.({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] });
    } catch {
      return false;
    }
  })();

  async function onExport() {
    setMessage(null);
    const now = Date.now();
    const file = makeFile(await createBackup(db, now), now);
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    await recordExport(now);
    setMessage({ kind: 'ok', text: `Saved ${file.name}. Keep it somewhere off this phone, like iCloud Drive or email.` });
  }

  async function onShare() {
    setMessage(null);
    const now = Date.now();
    const file = makeFile(await createBackup(db, now), now);
    try {
      await navigator.share({ files: [file], title: 'Gym Tracker backup' });
      await recordExport(now);
      setMessage({ kind: 'ok', text: 'Backup shared.' });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setMessage({ kind: 'error', text: 'Sharing failed. Try Export backup instead.' });
    }
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!f) return;
    setMessage(null);
    if (f.size > 50_000_000) {
      setMessage({ kind: 'error', text: 'That file is too large to be a backup from this app.' });
      return;
    }
    const result = validateBackup(await f.text(), SCHEMA_VERSION);
    if (!result.ok) setMessage({ kind: 'error', text: result.error });
    else setPending({ file: result.file, summary: result.summary, name: f.name });
  }

  async function confirmImport() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await replaceAllData(pending.file);
      setPending(null);
      setMessage({ kind: 'ok', text: 'Backup restored. Your data now matches the file.' });
    } catch (err) {
      setPending(null);
      setMessage({ kind: 'error', text: `Import failed and nothing was changed. ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  const installed = isInstalled();
  const s = pending?.summary;

  return (
    <Screen title="Settings">
      {message && (
        <div className={message.kind === 'ok' ? 'notice notice-ok' : 'notice notice-error'} role={message.kind === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </div>
      )}

      <section className="section" aria-labelledby="set-backup" style={{ marginTop: 0 }}>
        <h2 id="set-backup" className="section-title">
          Backup
        </h2>
        <div className="card settings-card">
          <p className="settings-line">
            {lastExport ? (
              <>
                Last backup: <strong>{formatDate(lastExport)}</strong> ({daysAgo(lastExport)})
              </>
            ) : (
              <>
                <strong>No backup yet.</strong> Your data only lives on this phone. Export a backup now and then.
              </>
            )}
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={onExport}>
            Export backup
          </button>
          {canShareFiles && (
            <button type="button" className="btn btn-secondary btn-block" onClick={onShare}>
              Share backup…
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-block"
            disabled={!!active}
            onClick={() => fileInput.current?.click()}
          >
            Import backup
          </button>
          {active && <p className="field-hint">Finish or discard the workout in progress to import a backup.</p>}
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onPickFile}
          />
          <p className="field-hint">Importing replaces everything on this phone with the backup's contents.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="set-storage">
        <h2 id="set-storage" className="section-title">
          Storage
        </h2>
        <div className="card settings-card">
          <div className="status-row">
            <span className={persist?.state === 'granted' ? 'status-dot ok' : 'status-dot warn'} aria-hidden="true">
              {persist?.state === 'granted' && <CheckIcon size={14} />}
            </span>
            <div>
              <p className="status-title">
                {persist?.state === 'granted'
                  ? 'Storage is protected'
                  : persist?.state === 'unsupported'
                    ? 'Protection not available in this browser'
                    : 'Storage is not protected yet'}
              </p>
              <p className="field-hint">
                {persist?.state === 'granted'
                  ? "The browser won't clear your data to free up space."
                  : 'The browser may clear data from apps you rarely open. Keep backups.'}
                {persist && <> Checked {formatShortDate(persist.checkedAt)}.</>}
              </p>
            </div>
          </div>
          {persist?.state !== 'granted' && (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => void ensurePersistence(db)}>
              Ask again
            </button>
          )}
          <p className="settings-tip">
            On iPhone, add this app to your Home Screen (Share → Add to Home Screen) to help protect your data.
            {installed && <strong> You're using the installed app.</strong>}
          </p>
          {usage !== undefined && <p className="field-hint">Using about {mb(usage)} on this device.</p>}
        </div>
      </section>

      <section className="section" aria-labelledby="set-about">
        <h2 id="set-about" className="section-title">
          About
        </h2>
        <div className="card settings-card">
          {counts && (
            <p className="settings-line">
              {plural(counts.workouts, 'workout')} · {plural(counts.routines, 'routine')} ·{' '}
              {plural(counts.exercises, 'exercise')}
            </p>
          )}
          <p className="field-hint">
            Works fully offline. Everything stays on this phone. Nothing is sent anywhere, and there's no account.
          </p>
          <p className="field-hint">
            Version {__APP_VERSION__} · built {formatShortDate(Date.parse(__BUILD_DATE__))}
          </p>
        </div>
      </section>

      <Sheet
        open={!!pending}
        onClose={() => !busy && setPending(null)}
        title="Replace your data?"
        footer={
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger-solid" disabled={busy} onClick={confirmImport}>
              {busy ? 'Importing…' : 'Replace data'}
            </button>
          </div>
        }
      >
        {s && (
          <>
            <p>
              <strong>{pending.name}</strong>
              {s.exportedAt !== null && <> · exported {formatDate(s.exportedAt)}</>}
            </p>
            <ul className="summary-list">
              <li>
                {plural(s.workouts, 'workout')} ({plural(s.sets, 'set')})
                {s.firstWorkout !== null && s.lastWorkout !== null && (
                  <span className="muted">
                    {' '}
                    · {formatShortDate(s.firstWorkout)}, {new Date(s.firstWorkout).getFullYear()} – {formatShortDate(s.lastWorkout)},{' '}
                    {new Date(s.lastWorkout).getFullYear()}
                  </span>
                )}
              </li>
              <li>{plural(s.routines, 'routine')}</li>
              <li>
                {plural(s.exercises, 'exercise')} ({s.customExercises} custom)
              </li>
            </ul>
            {counts && (
              <p className="notice notice-error" style={{ margin: 0 }}>
                This deletes what's on this phone now ({plural(counts.workouts, 'workout')},{' '}
                {plural(counts.routines, 'routine')}) and replaces it with the backup. This can't be undone.
              </p>
            )}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
