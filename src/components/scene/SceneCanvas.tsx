import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CONTENT } from '../../content';
import { QUALITY_PRESETS, useLabStore } from '../../store/useLabStore';
import { ArmillaryRings } from './ArmillaryRings';
import { CosmicParticles } from './CosmicParticles';
import { InteractionRig } from './InteractionRig';
import { ProceduralEnvironment } from './ProceduralEnvironment';
import { TelemetryProbe } from './TelemetryProbe';
import { VolumetricCoreAndPostpro } from './VolumetricCoreAndPostpro';

export default function SceneCanvas() {
  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const isTabHidden = useLabStore((s) => s.isTabHidden);
  const stepPerformanceQuality = useLabStore((s) => s.stepPerformanceQuality);
  const setWebglStatus = useLabStore((s) => s.setWebglStatus);

  const preset = QUALITY_PRESETS[effectiveQuality];

  return (
    <div
      role="img"
      aria-label={CONTENT.accessibility.canvasAriaLabel}
      className="absolute inset-0 h-full w-full touch-none"
    >
      <Canvas
        dpr={preset.dpr}
        frameloop={isTabHidden ? 'never' : 'always'}
        camera={{ position: [0, 0.15, 5.8], fov: 42, near: 0.1, far: 45 }}
        gl={{
          antialias: preset.multisampling > 0,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault();
              setWebglStatus('context-lost');
            },
            false,
          );
          canvas.addEventListener(
            'webglcontextrestored',
            () => {
              setWebglStatus('ok');
            },
            false,
          );
        }}
      >
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => stepPerformanceQuality('degrade')}
          onIncline={() => stepPerformanceQuality('incline')}
        />

        <ProceduralEnvironment />
        <ArmillaryRings />
        <CosmicParticles />
        <VolumetricCoreAndPostpro />
        <InteractionRig />
        <TelemetryProbe />
      </Canvas>
    </div>
  );
}
