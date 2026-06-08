// A short notification "ping" synthesised with the Web Audio API. No audio file
// to ship, and it works offline. Browsers block audio until a user gesture, so
// the context is created lazily and `unlockAudio` is called from real clicks.

let context: AudioContext | null = null;

function getContext(): AudioContext {
  if (context === null) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio API is not available");
    context = new Ctor();
  }
  return context;
}

/** Resume audio in response to a user gesture so later beeps are allowed. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx.state === "suspended") void ctx.resume();
}

/** Play a two-note ping. Safe to call from the scheduling loop. */
export function playBeep(): void {
  const ctx = getContext();
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  playTone(ctx, 880, now, 0.18);
  playTone(ctx, 1320, now + 0.2, 0.22);
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  // Short attack and decay so the tone does not click.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
