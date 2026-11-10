import { stepAudioEnvelope } from './math';
import { mulberry32 } from './prng';

export interface AudioBandsSnapshot {
  bass: number;
  mid: number;
  treble: number;
}

/**
 * Pure function that extracts normalized [0..1] Bass, Mid, and Treble energy
 * from an AnalyserNode byte frequency buffer.
 */
export function extractFftBands(
  frequencyData: Uint8Array,
  sampleRate = 48000,
  fftSize = 1024,
): AudioBandsSnapshot {
  const binCount = frequencyData.length;
  if (binCount === 0 || fftSize <= 0 || sampleRate <= 0) {
    return { bass: 0, mid: 0, treble: 0 };
  }

  const hzPerBin = sampleRate / fftSize;

  const sumRange = (minHz: number, maxHz: number): number => {
    const startBin = Math.max(0, Math.floor(minHz / hzPerBin));
    const endBin = Math.min(binCount - 1, Math.ceil(maxHz / hzPerBin));
    if (endBin < startBin) return 0;

    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += (frequencyData[i] ?? 0) / 255;
      count += 1;
    }
    return count > 0 ? Math.min(1, sum / count) : 0;
  };

  // Bass: 25 - 180 Hz, Mid: 180 - 2000 Hz, Treble: 2000 - 9000 Hz
  const bass = sumRange(25, 180);
  const mid = sumRange(180, 2000);
  const treble = sumRange(2000, 9000);

  return {
    bass: Math.min(1, Math.pow(bass, 0.85) * 1.25),
    mid: Math.min(1, Math.pow(mid, 0.85) * 1.4),
    treble: Math.min(1, Math.pow(treble, 0.78) * 1.65),
  };
}

/**
 * 100% Procedural Web Audio API synthesizer + optional microphone input.
 * Never starts automatically; requires explicit user interaction.
 */
export class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private synthBus: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private fftBuffer: Uint8Array<ArrayBuffer> | null = null;
  private smoothedBands: AudioBandsSnapshot = { bass: 0, mid: 0, treble: 0 };
  private isStarted = false;
  private isMuted = false;
  private volume = 0.7;

  public async start(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.65;
      this.analyser = analyser;
      this.fftBuffer = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

      const synthBus = ctx.createGain();
      synthBus.gain.value = 0.85;
      this.synthBus = synthBus;

      const masterGain = ctx.createGain();
      masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain = masterGain;

      // Build procedural convolution reverb impulse response (no external audio files)
      const convolver = ctx.createConvolver();
      convolver.buffer = this.createSyntheticReverbBuffer(ctx, 2.6, 2.2);

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.45;
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.7;

      // Low-pass filter modulated by slow LFO
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      filter.Q.value = 3.2;

      const filterLfo = ctx.createOscillator();
      filterLfo.type = 'sine';
      filterLfo.frequency.value = 0.14;
      const filterLfoGain = ctx.createGain();
      filterLfoGain.gain.value = 210;
      filterLfo.connect(filterLfoGain);
      filterLfoGain.connect(filter.frequency);
      filterLfo.start();

      // Drone oscillator 1: Deep sawtooth A1 (55 Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 55.0;
      const osc1Gain = ctx.createGain();
      osc1Gain.gain.value = 0.24;
      osc1.connect(osc1Gain).connect(filter);
      osc1.start();

      // Drone oscillator 2: Detuned fifth E2 (82.41 Hz + detune)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 82.41;
      osc2.detune.value = 9;
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.22;
      osc2.connect(osc2Gain).connect(filter);
      osc2.start();

      // Drone oscillator 3: High harmonic shimmer A4 (440 Hz) + C5 (523.25 Hz)
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = 2616.25; // High crystalline harmonic in treble band
      const shimmerGate = ctx.createGain();
      shimmerGate.gain.value = 0.08;
      const shimmerLfo = ctx.createOscillator();
      shimmerLfo.type = 'sine';
      shimmerLfo.frequency.value = 0.37;
      const shimmerLfoGain = ctx.createGain();
      shimmerLfoGain.gain.value = 0.07;
      shimmerLfo.connect(shimmerLfoGain).connect(shimmerGate.gain);
      osc3.connect(shimmerGate).connect(synthBus);
      osc3.start();
      shimmerLfo.start();

      // Rhythmic sub-bass pulse (D1 = 36.71 Hz + 73.42 Hz) gated by 0.55 Hz pulse LFO
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.value = 65.41;
      const subGate = ctx.createGain();
      subGate.gain.value = 0.26;
      const pulseLfo = ctx.createOscillator();
      pulseLfo.type = 'sine';
      pulseLfo.frequency.value = 0.52;
      const pulseLfoGain = ctx.createGain();
      pulseLfoGain.gain.value = 0.24;
      pulseLfo.connect(pulseLfoGain).connect(subGate.gain);
      subOsc.connect(subGate).connect(synthBus);
      subOsc.start();
      pulseLfo.start();

      filter.connect(dryGain).connect(synthBus);
      filter.connect(convolver).connect(wetGain).connect(synthBus);

      // Route synthBus -> analyser -> masterGain -> destination
      synthBus.connect(analyser);
      analyser.connect(masterGain);
      masterGain.connect(ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isStarted = true;
    this.applyVolumeState();
    return true;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.applyVolumeState();
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.applyVolumeState();
  }

  private applyVolumeState(): void {
    if (!this.ctx || !this.masterGain) return;
    const target = !this.isStarted || this.isMuted ? 0 : this.volume;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06);
  }

  public async setMicrophoneEnabled(enabled: boolean): Promise<boolean> {
    if (!this.ctx || !this.analyser || !this.synthBus) {
      const ok = await this.start();
      if (!ok || !this.ctx || !this.analyser || !this.synthBus) return false;
    }

    if (!enabled) {
      this.cleanupMic();
      this.synthBus.gain.setTargetAtTime(0.85, this.ctx.currentTime, 0.08);
      return true;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      this.cleanupMic();
      this.micStream = stream;
      this.micSource = this.ctx.createMediaStreamSource(stream);
      // Lower internal synth so microphone drives the FFT analyser without feedback
      this.synthBus.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.08);
      this.micSource.connect(this.analyser);
      return true;
    } catch {
      return false;
    }
  }

  private cleanupMic(): void {
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.micSource = null;
    }
    if (this.micStream) {
      for (const track of this.micStream.getTracks()) {
        track.stop();
      }
      this.micStream = null;
    }
  }

  public sampleBands(dt: number): AudioBandsSnapshot {
    if (!this.isStarted || this.isMuted || !this.analyser || !this.fftBuffer || !this.ctx) {
      this.smoothedBands.bass = stepAudioEnvelope(this.smoothedBands.bass, 0, 14, 5, dt);
      this.smoothedBands.mid = stepAudioEnvelope(this.smoothedBands.mid, 0, 14, 5, dt);
      this.smoothedBands.treble = stepAudioEnvelope(this.smoothedBands.treble, 0, 14, 5, dt);
      return this.smoothedBands;
    }

    this.analyser.getByteFrequencyData(this.fftBuffer);
    const raw = extractFftBands(this.fftBuffer, this.ctx.sampleRate, this.analyser.fftSize);

    // Smooth with attack/release envelope (fast attack = 16, smooth release = 4.5)
    this.smoothedBands.bass = stepAudioEnvelope(this.smoothedBands.bass, raw.bass, 16, 4.5, dt);
    this.smoothedBands.mid = stepAudioEnvelope(this.smoothedBands.mid, raw.mid, 14, 4.5, dt);
    this.smoothedBands.treble = stepAudioEnvelope(
      this.smoothedBands.treble,
      raw.treble,
      18,
      5.5,
      dt,
    );

    return this.smoothedBands;
  }

  private createSyntheticReverbBuffer(
    ctx: AudioContext,
    durationSeconds: number,
    decayRate: number,
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSeconds);
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const rand = mulberry32(42099);

    for (let ch = 0; ch < 2; ch++) {
      const channelData = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.pow(1 - t, decayRate);
        channelData[i] = (rand() * 2 - 1) * envelope * 0.35;
      }
    }
    return buffer;
  }
}

export const sharedAudioEngine = new ProceduralAudioEngine();
