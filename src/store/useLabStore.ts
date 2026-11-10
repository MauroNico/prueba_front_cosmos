import { create } from 'zustand';
import type {
  CameraPresetId,
  InteractionModeId,
  MaterialVariantId,
  QualityTierId,
} from '../content';
import type { DampedVec3State } from '../lib/math';

export type EffectiveQualityTier = 'high' | 'medium' | 'low';
export type WebGLStatus = 'ok' | 'context-lost' | 'unsupported';
export type PreloaderPhase = 'compiling' | 'assembling' | 'ready';

export interface QualityPresetSpec {
  dpr: [number, number];
  particleCount: number;
  godRaysResolutionScale: number;
  multisampling: number;
  enableBloom: boolean;
  enableGodRays: boolean;
  enableChromaticAberration: boolean;
  torusTubularSegments: number;
  torusRadialSegments: number;
}

export const QUALITY_PRESETS: Record<EffectiveQualityTier, QualityPresetSpec> = {
  high: {
    dpr: [1, 2],
    particleCount: 52000,
    godRaysResolutionScale: 0.75,
    multisampling: 4,
    enableBloom: true,
    enableGodRays: true,
    enableChromaticAberration: true,
    torusTubularSegments: 128,
    torusRadialSegments: 24,
  },
  medium: {
    dpr: [1, 1.5],
    particleCount: 28000,
    godRaysResolutionScale: 0.5,
    multisampling: 0,
    enableBloom: true,
    enableGodRays: true,
    enableChromaticAberration: false,
    torusTubularSegments: 96,
    torusRadialSegments: 18,
  },
  low: {
    dpr: [1, 1],
    particleCount: 12000,
    godRaysResolutionScale: 0.35,
    multisampling: 0,
    enableBloom: true,
    enableGodRays: false,
    enableChromaticAberration: false,
    torusTubularSegments: 64,
    torusRadialSegments: 12,
  },
};

export interface ShaderLiveParams {
  noiseAmplitude: number;
  noiseFrequency: number;
  godRaysIntensity: number;
  bloomIntensity: number;
  particleTurbulence: number;
}

export interface TelemetrySnapshot {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  dpr: number;
  particleCount: number;
  godRaysScale: number;
  isSoftwareRenderer: boolean;
  rendererName: string;
  longTasksCount: number;
}

/**
 * Transient state mutated every frame in useFrame without triggering React renders.
 */
export interface TransientLabState {
  pointerTarget3D: { x: number; y: number; z: number };
  pointer3D: DampedVec3State;
  pointerPresence: number;
  pointerPresenceTarget: number;
  lightPos3D: DampedVec3State;
  shockwave: {
    originX: number;
    originY: number;
    originZ: number;
    age: number;
    strength: number;
  };
  audioBands: {
    bass: number;
    mid: number;
    treble: number;
  };
  introProgress: number;
  telemetry: TelemetrySnapshot;
}

export const transientLabState: TransientLabState = {
  pointerTarget3D: { x: 0, y: 0, z: 0 },
  pointer3D: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 },
  pointerPresence: 0,
  pointerPresenceTarget: 0,
  lightPos3D: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 },
  shockwave: {
    originX: 0,
    originY: 0,
    originZ: 0,
    age: 100,
    strength: 0,
  },
  audioBands: {
    bass: 0,
    mid: 0,
    treble: 0,
  },
  introProgress: 0,
  telemetry: {
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    dpr: 1,
    particleCount: 52000,
    godRaysScale: 0.75,
    isSoftwareRenderer: false,
    rendererName: 'WebGL2',
    longTasksCount: 0,
  },
};

export function triggerShockwave(x: number, y: number, z: number, strength = 1.0): void {
  transientLabState.shockwave.originX = x;
  transientLabState.shockwave.originY = y;
  transientLabState.shockwave.originZ = z;
  transientLabState.shockwave.age = 0;
  transientLabState.shockwave.strength = strength;
}

export interface LabStoreState {
  qualityTier: QualityTierId;
  effectiveQuality: EffectiveQualityTier;
  autoDegraded: boolean;
  isMobileViewport: boolean;
  variant: MaterialVariantId;
  cameraPreset: CameraPresetId;
  mode: InteractionModeId;
  audioEnabled: boolean;
  audioMuted: boolean;
  audioVolume: number;
  micEnabled: boolean;
  micError: boolean;
  motionPaused: boolean;
  prefersReducedMotion: boolean;
  isTabHidden: boolean;
  showTechOverlay: boolean;
  webglStatus: WebGLStatus;
  preloaderPhase: PreloaderPhase;
  shaderParams: ShaderLiveParams;

  setQualityTier: (tier: QualityTierId) => void;
  stepPerformanceQuality: (direction: 'degrade' | 'incline') => void;
  setIsMobileViewport: (isMobile: boolean) => void;
  setVariant: (variant: MaterialVariantId) => void;
  setCameraPreset: (preset: CameraPresetId) => void;
  setMode: (mode: InteractionModeId) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setAudioMuted: (muted: boolean) => void;
  setAudioVolume: (volume: number) => void;
  setMicEnabled: (enabled: boolean) => void;
  setMicError: (hasError: boolean) => void;
  toggleMotionPaused: () => void;
  setMotionPaused: (paused: boolean) => void;
  setPrefersReducedMotion: (reduced: boolean) => void;
  setIsTabHidden: (hidden: boolean) => void;
  toggleTechOverlay: () => void;
  setShowTechOverlay: (show: boolean) => void;
  setWebglStatus: (status: WebGLStatus) => void;
  setPreloaderPhase: (phase: PreloaderPhase) => void;
  setShaderParam: <K extends keyof ShaderLiveParams>(key: K, value: ShaderLiveParams[K]) => void;
}

function resolveDefaultEffectiveQuality(
  tier: QualityTierId,
  isMobile: boolean,
): EffectiveQualityTier {
  if (tier === 'auto') {
    return isMobile ? 'medium' : 'high';
  }
  return tier;
}

export const useLabStore = create<LabStoreState>((set) => ({
  qualityTier: 'auto',
  effectiveQuality: 'high',
  autoDegraded: false,
  isMobileViewport: false,
  variant: 'chrome',
  cameraPreset: 'frontal',
  mode: 'exploration',
  audioEnabled: false,
  audioMuted: false,
  audioVolume: 0.7,
  micEnabled: false,
  micError: false,
  motionPaused: false,
  prefersReducedMotion: false,
  isTabHidden: false,
  showTechOverlay: false,
  webglStatus: 'ok',
  preloaderPhase: 'compiling',
  shaderParams: {
    noiseAmplitude: 0.18,
    noiseFrequency: 1.65,
    godRaysIntensity: 0.82,
    bloomIntensity: 1.15,
    particleTurbulence: 1.0,
  },

  setQualityTier: (tier) =>
    set((state) => ({
      qualityTier: tier,
      effectiveQuality: resolveDefaultEffectiveQuality(tier, state.isMobileViewport),
      autoDegraded: false,
    })),

  stepPerformanceQuality: (direction) =>
    set((state) => {
      if (state.qualityTier !== 'auto') {
        return state;
      }
      if (direction === 'degrade') {
        if (state.effectiveQuality === 'high') {
          return { effectiveQuality: 'medium', autoDegraded: true };
        }
        if (state.effectiveQuality === 'medium') {
          return { effectiveQuality: 'low', autoDegraded: true };
        }
      } else {
        const ceiling: EffectiveQualityTier = state.isMobileViewport ? 'medium' : 'high';
        if (state.effectiveQuality === 'low') {
          return { effectiveQuality: 'medium', autoDegraded: ceiling !== 'medium' };
        }
        if (state.effectiveQuality === 'medium' && ceiling === 'high') {
          return { effectiveQuality: 'high', autoDegraded: false };
        }
      }
      return state;
    }),

  setIsMobileViewport: (isMobile) =>
    set((state) => {
      if (state.qualityTier === 'auto' && !state.autoDegraded) {
        return {
          isMobileViewport: isMobile,
          effectiveQuality: isMobile ? 'medium' : 'high',
        };
      }
      return { isMobileViewport: isMobile };
    }),

  setVariant: (variant) => set({ variant }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  setMode: (mode) => set({ mode }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setAudioMuted: (audioMuted) => set({ audioMuted }),
  setAudioVolume: (audioVolume) =>
    set({ audioVolume: Math.max(0, Math.min(1, audioVolume)) }),
  setMicEnabled: (micEnabled) => set({ micEnabled }),
  setMicError: (micError) => set({ micError }),
  toggleMotionPaused: () => set((state) => ({ motionPaused: !state.motionPaused })),
  setMotionPaused: (motionPaused) => set({ motionPaused }),
  setPrefersReducedMotion: (prefersReducedMotion) =>
    set((state) => ({
      prefersReducedMotion,
      mode: prefersReducedMotion ? 'exploration' : state.mode,
    })),
  setIsTabHidden: (isTabHidden) => set({ isTabHidden }),
  toggleTechOverlay: () => set((state) => ({ showTechOverlay: !state.showTechOverlay })),
  setShowTechOverlay: (showTechOverlay) => set({ showTechOverlay }),
  setWebglStatus: (webglStatus) => set({ webglStatus }),
  setPreloaderPhase: (preloaderPhase) => set({ preloaderPhase }),
  setShaderParam: (key, value) =>
    set((state) => ({
      shaderParams: {
        ...state.shaderParams,
        [key]: value,
      },
    })),
}));
