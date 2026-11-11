import * as THREE from 'three';
import type { MaterialVariantId } from '../content';

export interface RingShaderUniforms {
  uTime: THREE.IUniform<number>;
  uNoiseAmplitude: THREE.IUniform<number>;
  uNoiseFrequency: THREE.IUniform<number>;
  uPointerPos: THREE.IUniform<THREE.Vector3>;
  uPointerPresence: THREE.IUniform<number>;
  uShockwaveOrigin: THREE.IUniform<THREE.Vector3>;
  uShockwaveAge: THREE.IUniform<number>;
  uShockwaveStrength: THREE.IUniform<number>;
  uAudioBass: THREE.IUniform<number>;
  uAudioMid: THREE.IUniform<number>;
  uAudioTreble: THREE.IUniform<number>;
  uReducedMotion: THREE.IUniform<number>;
  uRoughnessNoiseAmp: THREE.IUniform<number>;
  uIridescenceStrength: THREE.IUniform<number>;
  uFresnelColor: THREE.IUniform<THREE.Color>;
  uFresnelIntensity: THREE.IUniform<number>;
  uCrestEmissiveColor: THREE.IUniform<THREE.Color>;
  uCrestEmissiveIntensity: THREE.IUniform<number>;
}

export interface MaterialVariantTargetSpec {
  baseColor: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  thickness: number;
  envMapIntensity: number;
  roughnessNoiseAmp: number;
  iridescenceStrength: number;
  fresnelColor: string;
  fresnelIntensity: number;
  crestEmissiveColor: string;
  crestEmissiveIntensity: number;
}

export const MATERIAL_VARIANT_SPECS: Record<MaterialVariantId, MaterialVariantTargetSpec> = {
  chrome: {
    baseColor: '#b8cadb',
    metalness: 0.96,
    roughness: 0.14,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    transmission: 0.0,
    ior: 2.92,
    thickness: 0.0,
    envMapIntensity: 1.15,
    roughnessNoiseAmp: 0.14,
    iridescenceStrength: 0.35,
    fresnelColor: '#38d9f5',
    fresnelIntensity: 0.38,
    crestEmissiveColor: '#5ce6ff',
    crestEmissiveIntensity: 0.24,
  },
  obsidian: {
    baseColor: '#10131c',
    metalness: 0.38,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transmission: 0.0,
    ior: 1.5,
    thickness: 0.2,
    envMapIntensity: 0.9,
    roughnessNoiseAmp: 0.24,
    iridescenceStrength: 0.15,
    fresnelColor: '#ff922b',
    fresnelIntensity: 0.45,
    crestEmissiveColor: '#ff6b18',
    crestEmissiveIntensity: 1.15,
  },
  gold: {
    baseColor: '#e8a838',
    metalness: 0.98,
    roughness: 0.18,
    clearcoat: 0.55,
    clearcoatRoughness: 0.14,
    transmission: 0.0,
    ior: 1.47,
    thickness: 0.0,
    envMapIntensity: 1.25,
    roughnessNoiseAmp: 0.16,
    iridescenceStrength: 0.2,
    fresnelColor: '#ffe08a',
    fresnelIntensity: 0.4,
    crestEmissiveColor: '#ff9f1c',
    crestEmissiveIntensity: 0.32,
  },
  iridescent: {
    baseColor: '#8cdbff',
    metalness: 0.22,
    roughness: 0.09,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    transmission: 0.72,
    ior: 1.78,
    thickness: 0.55,
    envMapIntensity: 1.25,
    roughnessNoiseAmp: 0.1,
    iridescenceStrength: 0.92,
    fresnelColor: '#4de3ff',
    fresnelIntensity: 0.58,
    crestEmissiveColor: '#b57cff',
    crestEmissiveIntensity: 0.44,
  },
};

export function createRingShaderUniforms(): RingShaderUniforms {
  const initial = MATERIAL_VARIANT_SPECS.chrome;
  return {
    uTime: { value: 0 },
    uNoiseAmplitude: { value: 0.18 },
    uNoiseFrequency: { value: 1.65 },
    uPointerPos: { value: new THREE.Vector3(0, 0, 0) },
    uPointerPresence: { value: 0 },
    uShockwaveOrigin: { value: new THREE.Vector3(0, 0, 0) },
    uShockwaveAge: { value: 100 },
    uShockwaveStrength: { value: 0 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioTreble: { value: 0 },
    uReducedMotion: { value: 0 },
    uRoughnessNoiseAmp: { value: initial.roughnessNoiseAmp },
    uIridescenceStrength: { value: initial.iridescenceStrength },
    uFresnelColor: { value: new THREE.Color(initial.fresnelColor) },
    uFresnelIntensity: { value: initial.fresnelIntensity },
    uCrestEmissiveColor: { value: new THREE.Color(initial.crestEmissiveColor) },
    uCrestEmissiveIntensity: { value: initial.crestEmissiveIntensity },
  };
}
