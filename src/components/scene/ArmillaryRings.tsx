import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { dampScalar } from '../../lib/math';
import { generateArmillaryRings } from '../../lib/prng';
import {
  createRingShaderUniforms,
  MATERIAL_VARIANT_SPECS,
  type RingShaderUniforms,
} from '../../shaders/ringUniforms';
import ringsFragmentEmissive from '../../shaders/ringsFragmentEmissive.glsl';
import ringsFragmentHead from '../../shaders/ringsFragmentHead.glsl';
import ringsFragmentRoughness from '../../shaders/ringsFragmentRoughness.glsl';
import ringsVertexHead from '../../shaders/ringsVertexHead.glsl';
import ringsVertexMain from '../../shaders/ringsVertexMain.glsl';
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
const _targetBaseColor = new THREE.Color();
const _targetFresnelColor = new THREE.Color();
const _targetCrestColor = new THREE.Color();

export function ArmillaryRings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const isMobileViewport = useLabStore((s) => s.isMobileViewport);
  const variant = useLabStore((s) => s.variant);
  const motionPaused = useLabStore((s) => s.motionPaused);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);
  const noiseAmplitude = useLabStore((s) => s.shaderParams.noiseAmplitude);
  const noiseFrequency = useLabStore((s) => s.shaderParams.noiseFrequency);

  const ringsData = useMemo(() => generateArmillaryRings(RING_COUNT, RING_SEED), []);
  const preset = QUALITY_PRESETS[effectiveQuality];

  const uniformsRef = useRef<RingShaderUniforms>(createRingShaderUniforms());

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

  // Real PBR MeshPhysicalMaterial extended with onBeforeCompile for liquid metal distortion
  const material = useMemo(() => {
    const spec = MATERIAL_VARIANT_SPECS.chrome;
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(spec.baseColor),
      metalness: spec.metalness,
      roughness: spec.roughness,
      reflectivity: 1.0,
      clearcoat: spec.clearcoat,
      clearcoatRoughness: spec.clearcoatRoughness,
      ior: spec.ior,
      transmission: 0.0,
      thickness: 0.0,
      envMapIntensity: spec.envMapIntensity,
    });

    mat.customProgramCacheKey = () => 'armillary-liquid-rings-v1';
    mat.onBeforeCompile = (shader) => {
      const u = uniformsRef.current;
      shader.uniforms.uTime = u.uTime;
      shader.uniforms.uNoiseAmplitude = u.uNoiseAmplitude;
      shader.uniforms.uNoiseFrequency = u.uNoiseFrequency;
      shader.uniforms.uPointerPos = u.uPointerPos;
      shader.uniforms.uPointerPresence = u.uPointerPresence;
      shader.uniforms.uShockwaveOrigin = u.uShockwaveOrigin;
      shader.uniforms.uShockwaveAge = u.uShockwaveAge;
      shader.uniforms.uShockwaveStrength = u.uShockwaveStrength;
      shader.uniforms.uAudioBass = u.uAudioBass;
      shader.uniforms.uAudioMid = u.uAudioMid;
      shader.uniforms.uAudioTreble = u.uAudioTreble;
      shader.uniforms.uReducedMotion = u.uReducedMotion;
      shader.uniforms.uRoughnessNoiseAmp = u.uRoughnessNoiseAmp;
      shader.uniforms.uIridescenceStrength = u.uIridescenceStrength;
      shader.uniforms.uFresnelColor = u.uFresnelColor;
      shader.uniforms.uFresnelIntensity = u.uFresnelIntensity;
      shader.uniforms.uCrestEmissiveColor = u.uCrestEmissiveColor;
      shader.uniforms.uCrestEmissiveIntensity = u.uCrestEmissiveIntensity;

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${ringsVertexHead}`)
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${ringsVertexMain}`);

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${ringsFragmentHead}`)
        .replace('#include <roughnessmap_fragment>', ringsFragmentRoughness)
        .replace('#include <emissivemap_fragment>', ringsFragmentEmissive);
    };

    return mat;
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
    const u = uniformsRef.current;
    const targetSpec = MATERIAL_VARIANT_SPECS[variant];

    // Smoothly interpolate PBR material & shader uniforms toward target variant (no hard jumps)
    const colorAlpha = 1 - Math.exp(-5.5 * safeDelta);
    _targetBaseColor.set(targetSpec.baseColor);
    material.color.lerp(_targetBaseColor, colorAlpha);
    material.metalness = dampScalar(material.metalness, targetSpec.metalness, 5.5, safeDelta);
    material.roughness = dampScalar(material.roughness, targetSpec.roughness, 5.5, safeDelta);
    material.clearcoat = dampScalar(material.clearcoat, targetSpec.clearcoat, 5.5, safeDelta);
    material.clearcoatRoughness = dampScalar(
      material.clearcoatRoughness,
      targetSpec.clearcoatRoughness,
      5.5,
      safeDelta,
    );
    material.envMapIntensity = dampScalar(
      material.envMapIntensity,
      targetSpec.envMapIntensity,
      5.5,
      safeDelta,
    );

    // Disable heavy transmission on mobile or low quality tier to protect GPU budget
    const allowTransmission = !isMobileViewport && effectiveQuality !== 'low';
    const targetTransmission = allowTransmission ? targetSpec.transmission : 0.0;
    material.transmission = dampScalar(material.transmission, targetTransmission, 5.5, safeDelta);
    material.ior = dampScalar(material.ior, targetSpec.ior, 5.5, safeDelta);
    material.thickness = dampScalar(material.thickness, targetSpec.thickness, 5.5, safeDelta);

    u.uTime.value = t;
    u.uNoiseAmplitude.value = noiseAmplitude;
    u.uNoiseFrequency.value = noiseFrequency;
    u.uPointerPos.value.set(
      transientLabState.pointer3D.x,
      transientLabState.pointer3D.y,
      transientLabState.pointer3D.z,
    );
    u.uPointerPresence.value = transientLabState.pointerPresence;
    u.uShockwaveOrigin.value.set(
      transientLabState.shockwave.originX,
      transientLabState.shockwave.originY,
      transientLabState.shockwave.originZ,
    );
    u.uShockwaveAge.value = transientLabState.shockwave.age;
    u.uShockwaveStrength.value = transientLabState.shockwave.strength;
    u.uAudioBass.value = transientLabState.audioBands.bass;
    u.uAudioMid.value = transientLabState.audioBands.mid;
    u.uAudioTreble.value = transientLabState.audioBands.treble;
    u.uReducedMotion.value = prefersReducedMotion || motionPaused ? 1.0 : 0.0;

    u.uRoughnessNoiseAmp.value = dampScalar(
      u.uRoughnessNoiseAmp.value,
      targetSpec.roughnessNoiseAmp,
      5.5,
      safeDelta,
    );
    u.uIridescenceStrength.value = dampScalar(
      u.uIridescenceStrength.value,
      targetSpec.iridescenceStrength,
      5.5,
      safeDelta,
    );
    u.uFresnelIntensity.value = dampScalar(
      u.uFresnelIntensity.value,
      targetSpec.fresnelIntensity,
      5.5,
      safeDelta,
    );
    u.uCrestEmissiveIntensity.value = dampScalar(
      u.uCrestEmissiveIntensity.value,
      targetSpec.crestEmissiveIntensity,
      5.5,
      safeDelta,
    );

    _targetFresnelColor.set(targetSpec.fresnelColor);
    u.uFresnelColor.value.lerp(_targetFresnelColor, colorAlpha);
    _targetCrestColor.set(targetSpec.crestEmissiveColor);
    u.uCrestEmissiveColor.value.lerp(_targetCrestColor, colorAlpha);

    const intro = transientLabState.introProgress;

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
