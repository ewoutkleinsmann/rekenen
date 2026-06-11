// Lightweight Web Audio sound engine. All sounds are synthesized at runtime,
// so there are no binary audio assets to ship. Provides answer SFX and a
// looping race music track, plus a persisted mute toggle.

const MUTE_KEY = "hw-audio-muted";

type Listener = () => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private listeners = new Set<Listener>();

  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;

  constructor() {
    if (typeof localStorage !== "undefined") {
      this.muted = localStorage.getItem(MUTE_KEY) === "1";
    }
  }

  /** Must be called from a user gesture to satisfy autoplay policies. */
  unlock(): void {
    this.ensureContext();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private ensureContext(): void {
    if (this.ctx || typeof window === "undefined") return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.0;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMuted(): void {
    this.setMuted(!this.muted);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    }
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 1, now + 0.08);
    }
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // --- SFX -----------------------------------------------------------------

  private blip(
    freq: number,
    start: number,
    duration: number,
    type: OscillatorType,
    peak: number,
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playCorrect(): void {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Bright ascending arpeggio (C–E–G–C).
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.blip(f, t + i * 0.07, 0.18, "triangle", 0.5));
  }

  playWrong(): void {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Two-tone descending buzzer.
    this.blip(220, t, 0.16, "sawtooth", 0.32);
    this.blip(155, t + 0.12, 0.26, "sawtooth", 0.32);
  }

  playClick(): void {
    this.unlock();
    if (!this.ctx) return;
    this.blip(660, this.ctx.currentTime, 0.06, "square", 0.18);
  }

  /** Short win fanfare when the race replay finishes successfully. */
  playRaceVictory(): void {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    fanfare.forEach((f, i) =>
      this.blip(f, t + i * 0.11, 0.28, "triangle", 0.42),
    );
    this.blip(1046.5, t + 0.65, 0.45, "sine", 0.35);
  }

  /** Race failed (crash, time, segment lock). */
  playRaceFail(): void {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.blip(180, t, 0.35, "sawtooth", 0.38);
    this.blip(120, t + 0.2, 0.5, "sawtooth", 0.32);
  }

  // --- Music ---------------------------------------------------------------

  // An upbeat looping riff: bass note + lead note per step.
  private static readonly LEAD = [
    659.25, 0, 783.99, 880, 0, 783.99, 659.25, 0, 587.33, 659.25, 783.99, 0,
    880, 987.77, 1046.5, 0,
  ];
  private static readonly BASS = [
    130.81, 130.81, 196.0, 196.0, 174.61, 174.61, 146.83, 146.83,
  ];

  startRaceMusic(): void {
    this.unlock();
    if (!this.ctx || !this.musicGain || this.musicTimer != null) return;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 0.6);
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 60);
  }

  stopMusic(): void {
    if (this.musicTimer != null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    }
  }

  private scheduleMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    const stepDur = 0.16;
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      const lead = AudioEngine.LEAD[this.step % AudioEngine.LEAD.length]!;
      const bass = AudioEngine.BASS[this.step % AudioEngine.BASS.length]!;
      if (lead > 0) this.note(lead, this.nextNoteTime, stepDur * 0.9, "square", 0.16);
      this.note(bass, this.nextNoteTime, stepDur * 1.6, "triangle", 0.22);
      this.nextNoteTime += stepDur;
      this.step++;
    }
  }

  private note(
    freq: number,
    start: number,
    duration: number,
    type: OscillatorType,
    peak: number,
  ): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

export const audio = new AudioEngine();
