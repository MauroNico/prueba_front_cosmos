import { describe, expect, it, beforeEach } from 'vitest';
import { extractFftBands } from '../../src/lib/audioEngine';
import {
  dampScalar,
  stepAudioEnvelope,
  stepCriticallyDamped1D,
  stepCriticallyDamped3DInPlace,
} from '../../src/lib/math';
import { generateArmillaryRings, mulberry32 } from '../../src/lib/prng';
import {
  transientLabState,
  triggerShockwave,
  useLabStore,
} from '../../src/store/useLabStore';

describe('Deterministic PRNG & Armillary Ring Generator', () => {
  it('produces identical sequences for the same seed', () => {
    const genA = mulberry32(133742);
    const genB = mulberry32(133742);

    const seqA = Array.from({ length: 20 }, () => genA());
    const seqB = Array.from({ length: 20 }, () => genB());

    expect(seqA).toEqual(seqB);
  });

  it('generates deterministic armillary rings within [24, 48] with normalized axes', () => {
    const ringsA = generateArmillaryRings(36, 133742);
    const ringsB = generateArmillaryRings(36, 133742);

    expect(ringsA).toHaveLength(36);
    expect(ringsA).toEqual(ringsB);

    for (const ring of ringsA) {
      expect(ring.radius).toBeGreaterThanOrEqual(1.0);
      expect(ring.radius).toBeLessThanOrEqual(2.5);
      expect([0, 1, 2]).toContain(ring.profileType);

      const axisLen = Math.hypot(ring.axis[0], ring.axis[1], ring.axis[2]);
      expect(axisLen).toBeCloseTo(1.0, 5);
      expect(Math.abs(ring.speed)).toBeGreaterThan(0.1);
    }

    expect(generateArmillaryRings(10, 42)).toHaveLength(24);
    expect(generateArmillaryRings(99, 42)).toHaveLength(48);
  });
});

describe('Frame-rate Independent Critical Damping & Envelopes', () => {
  it('converges identically across 30fps, 60fps, and 120fps for 1D critical damping', () => {
    let state30 = { position: 0, velocity: 0 };
    let state60 = { position: 0, velocity: 0 };
    let state120 = { position: 0, velocity: 0 };

    const target = 3.5;
    const omega = 10.0;

    for (let i = 0; i < 15; i++) {
      state30 = stepCriticallyDamped1D(state30, target, omega, 1 / 30);
    }
    for (let i = 0; i < 30; i++) {
      state60 = stepCriticallyDamped1D(state60, target, omega, 1 / 60);
    }
    for (let i = 0; i < 60; i++) {
      state120 = stepCriticallyDamped1D(state120, target, omega, 1 / 120);
    }

    expect(state30.position).toBeCloseTo(state60.position, 4);
    expect(state60.position).toBeCloseTo(state120.position, 4);
  });

  it('converges identically in 3D in-place critical damping across frame rates', () => {
    const vec30 = { x: -1, y: 2, z: 0.5, vx: 0, vy: 0, vz: 0 };
    const vec120 = { x: -1, y: 2, z: 0.5, vx: 0, vy: 0, vz: 0 };

    for (let i = 0; i < 15; i++) {
      stepCriticallyDamped3DInPlace(vec30, 1.5, -0.8, 2.0, 12.0, 1 / 30);
    }
    for (let i = 0; i < 60; i++) {
      stepCriticallyDamped3DInPlace(vec120, 1.5, -0.8, 2.0, 12.0, 1 / 120);
    }

    expect(vec30.x).toBeCloseTo(vec120.x, 4);
    expect(vec30.y).toBeCloseTo(vec120.y, 4);
    expect(vec30.z).toBeCloseTo(vec120.z, 4);
  });

  it('applies faster attack than release in audio envelope follower', () => {
    const attacked = stepAudioEnvelope(0, 1, 16, 4, 0.05);
    const released = stepAudioEnvelope(1, 0, 16, 4, 0.05);

    expect(attacked).toBeGreaterThan(0.5);
    expect(1 - released).toBeLessThan(attacked);
    expect(dampScalar(0, 10, 5, 0.1)).toBeCloseTo(10 * (1 - Math.exp(-0.5)), 5);
  });
});

describe('FFT Audio Band Extraction', () => {
  it('separates bass, mid, and treble frequency bins accurately', () => {
    const fftSize = 1024;
    const sampleRate = 48000; // ~46.875 Hz per bin
    const bins = new Uint8Array(fftSize / 2);

    // Populate only bass bins (~46 Hz to 140 Hz -> bins 1..3)
    bins[1] = 255;
    bins[2] = 255;
    bins[3] = 255;

    const bassOnly = extractFftBands(bins, sampleRate, fftSize);
    expect(bassOnly.bass).toBeGreaterThan(0.8);
    expect(bassOnly.mid).toBe(0);
    expect(bassOnly.treble).toBe(0);

    // Populate treble bins (~4687 Hz -> bin 100)
    bins.fill(0);
    for (let i = 60; i <= 140; i++) {
      bins[i] = 220;
    }
    const trebleOnly = extractFftBands(bins, sampleRate, fftSize);
    expect(trebleOnly.treble).toBeGreaterThan(0.5);
    expect(trebleOnly.bass).toBe(0);
  });
});

describe('Zustand Lab Store & Transient State', () => {
  beforeEach(() => {
    useLabStore.setState({
      qualityTier: 'auto',
      effectiveQuality: 'high',
      autoDegraded: false,
      isMobileViewport: false,
      variant: 'chrome',
      cameraPreset: 'frontal',
      mode: 'exploration',
      prefersReducedMotion: false,
      motionPaused: false,
    });
  });

  it('degrades and recovers quality smoothly in auto mode', () => {
    const store = useLabStore.getState();
    store.stepPerformanceQuality('degrade');
    expect(useLabStore.getState().effectiveQuality).toBe('medium');
    expect(useLabStore.getState().autoDegraded).toBe(true);

    store.stepPerformanceQuality('degrade');
    expect(useLabStore.getState().effectiveQuality).toBe('low');

    store.stepPerformanceQuality('incline');
    expect(useLabStore.getState().effectiveQuality).toBe('medium');
  });

  it('forces exploration mode when prefersReducedMotion is enabled and triggers shockwaves', () => {
    const store = useLabStore.getState();
    store.setMode('exhibition');
    expect(useLabStore.getState().mode).toBe('exhibition');

    store.setPrefersReducedMotion(true);
    expect(useLabStore.getState().mode).toBe('exploration');

    triggerShockwave(1.2, -0.5, 0.3, 0.85);
    expect(transientLabState.shockwave.originX).toBeCloseTo(1.2);
    expect(transientLabState.shockwave.age).toBe(0);
    expect(transientLabState.shockwave.strength).toBeCloseTo(0.85);
  });
});

