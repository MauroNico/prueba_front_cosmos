import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/prng';
import particlesFragment from '../../shaders/particlesFragment.glsl';
import particlesVertex from '../../shaders/particlesVertex.glsl';
import { QUALITY_PRESETS, transientLabState, useLabStore } from '../../store/useLabStore';

const MAX_PARTICLES = 52000;
const PARTICLE_SEED = 908172;

export function CosmicParticles() {
  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const motionPaused = useLabStore((s) => s.motionPaused);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);
  const particleTurbulence = useLabStore((s) => s.shaderParams.particleTurbulence);

  const preset = QUALITY_PRESETS[effectiveQuality];

  // Allocate the 52,000-particle BufferGeometry ONCE on mount (zero JS per-frame updates, zero quality-switch leaks)
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const seeds = new Float32Array(MAX_PARTICLES * 4);
    const rand = mulberry32(PARTICLE_SEED);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Distribute in spherical shells around and inside the armillary rings (r in [0.95, 5.2])
      const u = rand();
      const v = rand();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 0.95 + Math.pow(rand(), 0.78) * 4.25;

      const sinPhi = Math.sin(phi);
      positions[i * 3 + 0] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const phase = rand() * Math.PI * 2.0;
      const speed = (rand() > 0.5 ? 1 : -1) * (0.08 + rand() * 0.32);
      const baseSize = 0.28 + Math.pow(rand(), 2.2) * 1.15;
      const layer = rand();

      seeds[i * 4 + 0] = phase;
      seeds[i * 4 + 1] = speed;
      seeds[i * 4 + 2] = baseSize;
      seeds[i * 4 + 3] = layer;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aParticleSeed', new THREE.BufferAttribute(seeds, 4));
    geom.setDrawRange(0, QUALITY_PRESETS.high.particleCount);
    return geom;
  }, []);

  // Adjust active GPU vertex count cleanly via setDrawRange when quality changes
  useEffect(() => {
    geometry.setDrawRange(0, preset.particleCount);
  }, [geometry, preset.particleCount]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: particlesVertex,
      fragmentShader: particlesFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uTurbulence: { value: 1.0 },
        uPointerPos: { value: new THREE.Vector3(0, 0, 0) },
        uPointerPresence: { value: 0 },
        uShockwaveOrigin: { value: new THREE.Vector3(0, 0, 0) },
        uShockwaveAge: { value: 100 },
        uShockwaveStrength: { value: 0 },
        uAudioBass: { value: 0 },
        uAudioMid: { value: 0 },
        uAudioTreble: { value: 0 },
        uReducedMotion: { value: 0 },
      },
    });
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const speedScale = motionPaused ? 0 : prefersReducedMotion ? 0.18 : 1.0;
    elapsedRef.current += safeDelta * speedScale;

    const u = material.uniforms;
    if (!u) return;

    if (u.uTime) u.uTime.value = elapsedRef.current;
    if (u.uTurbulence) u.uTurbulence.value = particleTurbulence;
    if (u.uPointerPos) {
      (u.uPointerPos.value as THREE.Vector3).set(
        transientLabState.pointer3D.x,
        transientLabState.pointer3D.y,
        transientLabState.pointer3D.z,
      );
    }
    if (u.uPointerPresence) u.uPointerPresence.value = transientLabState.pointerPresence;
    if (u.uShockwaveOrigin) {
      (u.uShockwaveOrigin.value as THREE.Vector3).set(
        transientLabState.shockwave.originX,
        transientLabState.shockwave.originY,
        transientLabState.shockwave.originZ,
      );
    }
    if (u.uShockwaveAge) u.uShockwaveAge.value = transientLabState.shockwave.age;
    if (u.uShockwaveStrength) u.uShockwaveStrength.value = transientLabState.shockwave.strength;
    if (u.uAudioBass) u.uAudioBass.value = transientLabState.audioBands.bass;
    if (u.uAudioMid) u.uAudioMid.value = transientLabState.audioBands.mid;
    if (u.uAudioTreble) u.uAudioTreble.value = transientLabState.audioBands.treble;
    if (u.uReducedMotion) u.uReducedMotion.value = prefersReducedMotion || motionPaused ? 1.0 : 0.0;
  });

  return <points geometry={geometry} material={material} renderOrder={2} frustumCulled={false} />;
}
