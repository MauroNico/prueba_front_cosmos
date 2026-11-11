import { useEffect } from 'react';
import { useLabStore } from '../store/useLabStore';

function checkWebglSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('fallback') === 'webgl') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function useEnvironmentListeners(): void {
  const setPrefersReducedMotion = useLabStore((s) => s.setPrefersReducedMotion);
  const setIsTabHidden = useLabStore((s) => s.setIsTabHidden);
  const setIsMobileViewport = useLabStore((s) => s.setIsMobileViewport);
  const setWebglStatus = useLabStore((s) => s.setWebglStatus);
  const setPreloaderPhase = useLabStore((s) => s.setPreloaderPhase);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!checkWebglSupport()) {
      setWebglStatus('unsupported');
      setPreloaderPhase('ready');
    } else if (params.get('fallback') === 'contextlost') {
      setWebglStatus('context-lost');
      setPreloaderPhase('ready');
    }

    // 1. Reduced motion preference
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionMq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionMq.addEventListener('change', onMotionChange);

    // 2. Mobile / coarse pointer viewport detection
    const mobileMq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    setIsMobileViewport(mobileMq.matches);
    const onMobileChange = (e: MediaQueryListEvent) => {
      setIsMobileViewport(e.matches);
    };
    mobileMq.addEventListener('change', onMobileChange);

    // 3. Tab visibility (pause rendering when tab is hidden)
    const onVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      motionMq.removeEventListener('change', onMotionChange);
      mobileMq.removeEventListener('change', onMobileChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    setIsMobileViewport,
    setIsTabHidden,
    setPrefersReducedMotion,
    setPreloaderPhase,
    setWebglStatus,
  ]);
}

