// Procedural Web Audio API sound effects (zero external assets required)
class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  playRoll() {
    [220, 290, 340, 410].forEach((f, i) => this.playTone(f, 0.06, 'triangle', 0.06, i * 0.055));
  }

  playStep(stepIndex = 0) {
    this.playTone(500 + stepIndex * 36, 0.055, 'sine', 0.05);
  }

  playGain() {
    this.playTone(523.25, 0.1, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.08, 0.08);
  }

  playPay() {
    this.playTone(330, 0.1, 'sawtooth', 0.05, 0);
    this.playTone(247, 0.14, 'sawtooth', 0.05, 0.08);
  }

  playBonus() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.playTone(f, 0.14, 'triangle', 0.09, i * 0.07)
    );
  }

  playAlert() {
    this.playTone(220, 0.15, 'square', 0.05, 0);
    this.playTone(180, 0.22, 'square', 0.05, 0.14);
  }

  playTurnBell() {
    this.playTone(880, 0.14, 'sine', 0.06, 0);
    this.playTone(1318.5, 0.24, 'sine', 0.07, 0.09);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => this.playTone(f, 0.22, 'triangle', 0.09, i * 0.1));
  }
}

export const soundFx = new SoundEngine();
