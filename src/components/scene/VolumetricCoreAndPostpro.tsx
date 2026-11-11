import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  GodRays,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { QUALITY_PRESETS, transientLabState, useLabStore } from '../../store/useLabStore';

export function VolumetricCoreAndPostpro() {
  const [coreMesh, setCoreMesh] = useState<THREE.Mesh | null>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const godRaysIntensity = useLabStore((s) => s.shaderParams.godRaysIntensity);
  const bloomIntensity = useLabStore((s) => s.shaderParams.bloomIntensity);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);

  const preset = QUALITY_PRESETS[effectiveQuality];

  const chromaticOffset = useMemo(() => {
    const amount = preset.enableChromaticAberration ? 0.0011 : 0.0;
    return new THREE.Vector2(amount, amount * 0.75);
  }, [preset.enableChromaticAberration]);

  useFrame((state) => {
    const pos = transientLabState.lightPos3D;
    const bass = transientLabState.audioBands.bass;
    const pulse = prefersReducedMotion
      ? 1.0
      : 1.0 + bass * 0.22 + Math.sin(state.clock.elapsedTime * 2.4) * 0.035;

    if (coreMesh) {
      coreMesh.position.set(pos.x, pos.y, pos.z);
      coreMesh.scale.setScalar(pulse);
    }
    if (coreLightRef.current) {
      coreLightRef.current.position.set(pos.x, pos.y, pos.z);
      coreLightRef.current.intensity = 16 * (1.0 + bass * 0.45);
    }
  });

  const effectiveGodRaysWeight = preset.enableGodRays ? godRaysIntensity * 0.34 : 0.0;

  return (
    <>
      {/* Emissive volumetric light source that follows the 3D cursor with critical damping */}
      <mesh ref={setCoreMesh} position={[0, 0, 0]}>
        <sphereGeometry args={[0.21, 24, 24]} />
        <meshBasicMaterial color="#ffb85c" toneMapped={false} />
      </mesh>

      {/* Primary dynamic warm point light co-located with the emissive core */}
      <pointLight
        ref={coreLightRef}
        position={[0, 0, 0]}
        intensity={16}
        color="#ffb35c"
        distance={14}
        decay={2}
      />

      {/* Unified EffectComposer grouping all post-processing passes */}
      {coreMesh && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <GodRays
            sun={coreMesh}
            blendFunction={BlendFunction.SCREEN}
            samples={40}
            density={0.94}
            decay={0.92}
            weight={effectiveGodRaysWeight}
            exposure={0.28}
            clampMax={0.85}
            resolutionScale={0.65}
            blur
          />
          <Bloom
            intensity={bloomIntensity * 0.52}
            luminanceThreshold={0.86}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
          <ChromaticAberration
            offset={chromaticOffset}
            radialModulation
            modulationOffset={0.35}
          />
          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={0.055}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.82} />
        </EffectComposer>
      )}
    </>
  );
}
