import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateArmillaryRings } from '../../lib/prng';
import { QUALITY_PRESETS, transientLabState, useLabStore } from '../../store/useLabStore';

const RING_COUNT = 36;
const RING_SEED = 133742;

// Pre-allocated scratch math objects outside the frame loop (zero per-frame GC)
const _scratchMatrix = new THREE.Matrix4();
const _scratchPos = new THREE.Vector3();
const _scratchQuat = new THREE.Quaternion();
const _scratchInitQuat = new THREE.Quaternion();
const _scratchSpinQuat = new THREE.Quaternion();
const _scratchAxis = new THREE.Vector3();
const _scratchScale = new THREE.Vector3();

export function ArmillaryRings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const motionPaused = useLabStore((s) => s.motionPaused);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);

  const ringsData = useMemo(() => generateArmillaryRings(RING_COUNT, RING_SEED), []);
  const preset = QUALITY_PRESETS[effectiveQuality];

  // Build TorusGeometry + per-instance attributes deterministically
  const geometry = useMemo(() => {
    const geom = new THREE.TorusGeometry(
      1.0,
      0.022,
      preset.torusRadialSegments,
      preset.torusTubularSegments,
    );

    const metaArray = new Float32Array(RING_COUNT * 4);
    const axisArray = new Float32Array(RING_COUNT * 3);

    for (let i = 0; i < ringsData.length; i++) {
      const r = ringsData[i];
      if (!r) continue;
      metaArray[i * 4 + 0] = r.phase;
      metaArray[i * 4 + 1] = r.speed;
      metaArray[i * 4 + 2] = r.radius;
      metaArray[i * 4 + 3] = r.profileType;

      axisArray[i * 3 + 0] = r.axis[0];
      axisArray[i * 3 + 1] = r.axis[1];
      axisArray[i * 3 + 2] = r.axis[2];
    }

    geom.setAttribute('aRingMeta', new THREE.InstancedBufferAttribute(metaArray, 4));
    geom.setAttribute('aRingAxis', new THREE.InstancedBufferAttribute(axisArray, 3));
    return geom;
  }, [preset.torusRadialSegments, preset.torusTubularSegments, ringsData]);

  // Standard physical metallic material for Phase 1 (extended with custom liquid shader in Phase 2)
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#d8e4f0'),
      metalness: 0.96,
      roughness: 0.14,
      reflectivity: 1.0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.8,
    });
  }, []);

  // Ensure GPU resources are disposed cleanly when quality changes or component unmounts
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

  // Initialize instance matrices once on mount / geometry swap
  const elapsedRef = useRef(0);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < ringsData.length; i++) {
      const r = ringsData[i];
      if (!r) continue;
      _scratchPos.set(0, 0, 0);
      _scratchInitQuat.set(
        r.initialQuat[0],
        r.initialQuat[1],
        r.initialQuat[2],
        r.initialQuat[3],
      );
      _scratchScale.set(r.radius, r.radius, r.tubeScale);
      _scratchMatrix.compose(_scratchPos, _scratchInitQuat, _scratchScale);
      mesh.setMatrixAt(i, _scratchMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [ringsData, geometry]);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const safeDelta = Math.min(delta, 0.1);
    const speedScale = motionPaused ? 0 : prefersReducedMotion ? 0.18 : 1.0;
    const midBoost = 1.0 + transientLabState.audioBands.mid * 0.85;
    elapsedRef.current += safeDelta * speedScale * midBoost;

    const t = elapsedRef.current;
    const intro = transientLabState.introProgress || 1;

    for (let i = 0; i < ringsData.length; i++) {
      const r = ringsData[i];
      if (!r) continue;

      _scratchInitQuat.set(
        r.initialQuat[0],
        r.initialQuat[1],
        r.initialQuat[2],
        r.initialQuat[3],
      );
      _scratchAxis.set(r.axis[0], r.axis[1], r.axis[2]);
      const angle = t * r.speed + r.phase;
      _scratchSpinQuat.setFromAxisAngle(_scratchAxis, angle);
      _scratchQuat.multiplyQuaternions(_scratchSpinQuat, _scratchInitQuat);

      // Choreographed assembly from chaos (intro: 0 -> 1)
      const chaosFactor = Math.max(0, 1 - intro);
      const radialScatter = 1 + chaosFactor * (1.8 + (i % 5) * 0.45);
      _scratchPos.set(
        r.axis[0] * chaosFactor * 2.6 * Math.sin(r.phase),
        r.axis[1] * chaosFactor * 2.6 * Math.cos(r.phase),
        r.axis[2] * chaosFactor * 2.6,
      );

      const currentRadius = r.radius * radialScatter;
      _scratchScale.set(currentRadius, currentRadius, r.tubeScale);
      _scratchMatrix.compose(_scratchPos, _scratchQuat, _scratchScale);
      mesh.setMatrixAt(i, _scratchMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, RING_COUNT]}
      frustumCulled={false}
    />
  );
}
