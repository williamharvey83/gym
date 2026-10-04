import { useEffect, useState } from 'react';
import { CloseIcon } from './icons.tsx';
import { adjustRestTimer, startRestTimer, stopRestTimer, useRestTimer } from '../db/restTimerStore.ts';
import { PRESETS, STEP_SECONDS, formatCountdown, progress, remainingMs } from '../lib/timer.ts';

function presetLabel(s: number) {
  return s % 60 === 0 ? `${s / 60}:00` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Rest timer pinned above the tab bar on the workout screen. */
export default function RestTimerBar() {
  const timer = useRestTimer();
  const [now, setNow] = useState(() => Date.now());

  // Redraw a few times a second while running. The values come from
  // timestamps, so a skipped redraw never makes the countdown drift.
  useEffect(() => {
    if (timer.status !== 'running') return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [timer]);

  if (timer.status === 'done') {
    return (
      <div className="rest rest-done" role="region" aria-label="Rest timer">
        <p className="rest-done-text" role="alert">
          Rest over
        </p>
        <button type="button" className="btn rest-dismiss" onClick={stopRestTimer}>
          Dismiss
        </button>
      </div>
    );
  }

  if (timer.status === 'running') {
    const left = remainingMs(timer, now);
    return (
      <div className="rest rest-running" role="region" aria-label="Rest timer">
        <div className="rest-progress" aria-hidden="true">
          <div className="rest-progress-fill" style={{ transform: `scaleX(${progress(timer, now)})` }} />
        </div>
        <button
          type="button"
          className="btn btn-secondary rest-step"
          aria-label={`Subtract ${STEP_SECONDS} seconds`}
          onClick={() => adjustRestTimer(-STEP_SECONDS)}
        >
          −{STEP_SECONDS}
        </button>
        <div className="rest-clock">
          <span className="rest-label">Rest</span>
          <span className="rest-time" role="timer" aria-label={`${formatCountdown(left)} remaining`}>
            {formatCountdown(left)}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary rest-step"
          aria-label={`Add ${STEP_SECONDS} seconds`}
          onClick={() => adjustRestTimer(STEP_SECONDS)}
        >
          +{STEP_SECONDS}
        </button>
        <button type="button" className="icon-btn" aria-label="Stop rest timer" onClick={stopRestTimer}>
          <CloseIcon size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className="rest rest-idle" role="region" aria-label="Rest timer">
      <span className="rest-idle-label">Rest</span>
      <div className="rest-presets">
        {PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn-secondary rest-preset"
            aria-label={`Start ${s} second rest`}
            onClick={() => startRestTimer(s)}
          >
            {presetLabel(s)}
          </button>
        ))}
      </div>
    </div>
  );
}
