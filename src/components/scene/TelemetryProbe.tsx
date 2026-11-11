import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { QUALITY_PRESETS, transientLabState, useLabStore } from '../../store/useLabStore';

declare global {
  interface Window {
    __RING_SPHERE_TELEMETRY__?: typeof transientLabState.telemetry;
  }
}

export function TelemetryProbe() {
  const { gl } = useThree();
  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const frameCountRef = useRef(0);
  const accumTimeRef = useRef(0);

  useEffect(() => {
    window.__RING_SPHERE_TELEMETRY__ = transientLabState.telemetry;
    gl.info.autoReset = false;

    const context = gl.getContext();
    const debugInfo = context.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const unmaskedRenderer =
        (context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string | null) ?? 'WebGL2';
      transientLabState.telemetry.rendererName = unmaskedRenderer;
      transientLabState.telemetry.isSoftwareRenderer =
        /SwiftShader|llvmpipe|Software|Basic Render Driver/i.test(unmaskedRenderer);
    }

    // Track Long Tasks via PerformanceObserver if supported
    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        observer = new PerformanceObserver((list) => {
          transientLabState.telemetry.longTasksCount += list.getEntries().length;
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // Longtask observer not supported in all environments
      }
    }

    return () => {
      observer?.disconnect();
    };
  }, [gl]);

  useFrame((_state, delta) => {
    const frameCalls = gl.info.render.calls;
    const frameTriangles = gl.info.render.triangles;
    gl.info.reset();

    frameCountRef.current += 1;
    accumTimeRef.current += delta;

    if (accumTimeRef.current >= 0.25) {
      const avgDelta = accumTimeRef.current / frameCountRef.current;
      const fps = Math.min(240, Math.round(1 / Math.max(avgDelta, 0.0001)));
      const preset = QUALITY_PRESETS[effectiveQuality];

      transientLabState.telemetry.fps = fps;
      transientLabState.telemetry.frameTimeMs = Number((avgDelta * 1000).toFixed(2));
      transientLabState.telemetry.drawCalls = frameCalls;
      transientLabState.telemetry.triangles = frameTriangles;
      transientLabState.telemetry.geometries = gl.info.memory.geometries;
      transientLabState.telemetry.textures = gl.info.memory.textures;
      transientLabState.telemetry.dpr = Number(gl.getPixelRatio().toFixed(2));
      transientLabState.telemetry.particleCount = preset.particleCount;
      transientLabState.telemetry.godRaysScale = preset.godRaysResolutionScale;

      frameCountRef.current = 0;
      accumTimeRef.current = 0;
    }
  });

  return null;
}

