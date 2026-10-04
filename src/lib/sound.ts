/*
  Short tone generated with Web Audio (no audio file to download or cache).
  iOS only allows audio after a user gesture, so unlockAudio() is called from
  the tap that starts the timer; the alarm can then play later.
*/

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Call from a tap handler. */
export function unlockAudio(): void {
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => {});
  // A silent blip fully unlocks playback on older iOS.
  try {
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

/** Three short rising beeps, about 0.7 s total. */
export function playChime(): void {
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => {});
  const start = c.currentTime + 0.02;
  [880, 988, 1175].forEach((freq, i) => {
    const t = start + i * 0.22;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

/** Vibrates where supported (Android). iOS ignores this. */
export function buzz(): void {
  try {
    navigator.vibrate?.([250, 120, 250, 120, 250]);
  } catch {
    /* ignore */
  }
}
