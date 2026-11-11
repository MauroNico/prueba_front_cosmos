import { Leva, useControls } from 'leva';
import { useLabStore } from '../../store/useLabStore';

export default function DebugLevaControls({ hidden }: { hidden: boolean }) {
  const setShaderParam = useLabStore((s) => s.setShaderParam);

  useControls(
    'Shader & Postpro',
    () => ({
      noiseAmplitude: {
        value: 0.18,
        min: 0.0,
        max: 0.55,
        step: 0.01,
        onChange: (v: number) => setShaderParam('noiseAmplitude', v),
      },
      noiseFrequency: {
        value: 1.65,
        min: 0.4,
        max: 4.0,
        step: 0.05,
        onChange: (v: number) => setShaderParam('noiseFrequency', v),
      },
      godRaysIntensity: {
        value: 0.82,
        min: 0.0,
        max: 1.5,
        step: 0.02,
        onChange: (v: number) => setShaderParam('godRaysIntensity', v),
      },
      bloomIntensity: {
        value: 1.15,
        min: 0.0,
        max: 3.0,
        step: 0.05,
        onChange: (v: number) => setShaderParam('bloomIntensity', v),
      },
      particleTurbulence: {
        value: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.05,
        onChange: (v: number) => setShaderParam('particleTurbulence', v),
      },
    }),
    [setShaderParam],
  );

  return <Leva hidden={hidden} oneLineLabels flat titleBar={{ title: 'PARAMS EN VIVO' }} />;
}

