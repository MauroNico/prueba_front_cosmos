import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { transientLabState, useLabStore } from '../../store/useLabStore';

export function ShaderCompilerAndIntro() {
  const { gl, scene, camera } = useThree();
  const setPreloaderPhase = useLabStore((s) => s.setPreloaderPhase);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);
  const hasCompiledRef = useRef(false);

  useEffect(() => {
    if (hasCompiledRef.current) return;
    hasCompiledRef.current = true;

    let cancelled = false;
    let timeline: gsap.core.Timeline | null = null;

    // Start in scattered chaos state unless reduced motion is active
    transientLabState.introProgress = prefersReducedMotion ? 1 : 0;

    const compileAndRunTimeline = async () => {
      try {
        if ('compileAsync' in gl && typeof gl.compileAsync === 'function') {
          await gl.compileAsync(scene, camera);
        } else {
          gl.compile(scene, camera);
        }
      } catch {
        // Fallback to synchronous compile if compileAsync fails in headless context
        try {
          gl.compile(scene, camera);
        } catch {
          // Ignore compile warning in software fallback
        }
      }

      if (cancelled) return;
      setPreloaderPhase('assembling');

      if (prefersReducedMotion) {
        transientLabState.introProgress = 1;
        setPreloaderPhase('ready');
        return;
      }

      timeline = gsap.timeline({
        onComplete: () => {
          if (!cancelled) {
            setPreloaderPhase('ready');
          }
        },
      });

      timeline.to(transientLabState, {
        introProgress: 1,
        duration: 1.65,
        ease: 'power3.out',
      });
    };

    const rafId = window.requestAnimationFrame(() => {
      void compileAndRunTimeline();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      timeline?.kill();
    };
  }, [camera, gl, prefersReducedMotion, scene, setPreloaderPhase]);

  return null;
}

