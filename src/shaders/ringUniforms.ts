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
    baseColor: '#dce8f5',
    metalness: 0.98,
    roughness: 0.11,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    transmission: 0.0,
    ior: 2.92,
    thickness: 0.0,
    envMapIntensity: 2.1,
    roughnessNoiseAmp: 0.14,
    iridescenceStrength: 0.35,
    fresnelColor: '#4de3ff',
    fresnelIntensity: 0.85,
    crestEmissiveColor: '#72f2ff',
    crestEmissiveIntensity: 0.55,
  },
  obsidian: {
    baseColor: '#12151e',
    metalness: 0.35,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transmission: 0.0,
    ior: 1.5,
    thickness: 0.2,
    envMapIntensity: 1.5,
    roughnessNoiseAmp: 0.26,
    iridescenceStrength: 0.15,
    fresnelColor: '#ff9e3d',
    fresnelIntensity: 0.7,
    crestEmissiveColor: '#ff7b1c',
    crestEmissiveIntensity: 2.15,
  },
  gold: {
    baseColor: '#ffbe55',
    metalness: 0.99,
    roughness: 0.16,
    clearcoat: 0.55,
    clearcoatRoughness: 0.14,
    transmission: 0.0,
    ior: 1.47,
    thickness: 0.0,
    envMapIntensity: 2.3,
    roughnessNoiseAmp: 0.18,
    iridescenceStrength: 0.22,
    fresnelColor: '#fff0b8',
    fresnelIntensity: 0.9,
    crestEmissiveColor: '#ffaa33',
    crestEmissiveIntensity: 0.75,
  },
  iridescent: {
    baseColor: '#b8ecff',
    metalness: 0.18,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    transmission: 0.78,
    ior: 1.78,
    thickness: 0.65,
    envMapIntensity: 2.4,
    roughnessNoiseAmp: 0.1,
    iridescenceStrength: 0.95,
    fresnelColor: '#5cf2ff',
    fresnelIntensity: 1.35,
    crestEmissiveColor: '#c98bff',
    crestEmissiveIntensity: 1.05,
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
