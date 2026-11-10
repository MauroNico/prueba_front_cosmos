import { useEffect, useMemo, useRef } from 'react';
import { Leva, useControls } from 'leva';
import { Activity, Cpu } from 'lucide-react';
import { CONTENT } from '../../content';
import { transientLabState, useLabStore } from '../../store/useLabStore';

export function TechOverlay() {
  const showTechOverlay = useLabStore((s) => s.showTechOverlay);
  const toggleTechOverlay = useLabStore((s) => s.toggleTechOverlay);
  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const qualityTier = useLabStore((s) => s.qualityTier);
  const setShaderParam = useLabStore((s) => s.setShaderParam);

  const isDebugMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return import.meta.env.DEV || params.has('debug');
  }, []);

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

  // Keyboard shortcut 'D' to toggle technical telemetry overlay
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleTechOverlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleTechOverlay]);

  const fpsRef = useRef<HTMLSpanElement>(null);
  const frameTimeRef = useRef<HTMLSpanElement>(null);
  const drawCallsRef = useRef<HTMLSpanElement>(null);
  const trianglesRef = useRef<HTMLSpanElement>(null);
  const geometriesRef = useRef<HTMLSpanElement>(null);
  const texturesRef = useRef<HTMLSpanElement>(null);
  const dprRef = useRef<HTMLSpanElement>(null);
  const particlesRef = useRef<HTMLSpanElement>(null);
  const godRaysRef = useRef<HTMLSpanElement>(null);
  const rendererRef = useRef<HTMLSpanElement>(null);
  const swWarnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTechOverlay) return;

    const updateDom = () => {
      const t = transientLabState.telemetry;
      if (fpsRef.current) fpsRef.current.textContent = `${t.fps}`;
      if (frameTimeRef.current) frameTimeRef.current.textContent = `${t.frameTimeMs.toFixed(1)} ms`;
      if (drawCallsRef.current) drawCallsRef.current.textContent = `${t.drawCalls}`;
      if (trianglesRef.current) trianglesRef.current.textContent = t.triangles.toLocaleString('es-AR');
      if (geometriesRef.current) geometriesRef.current.textContent = `${t.geometries}`;
      if (texturesRef.current) texturesRef.current.textContent = `${t.textures}`;
      if (dprRef.current) dprRef.current.textContent = `${t.dpr}x`;
      if (particlesRef.current)
        particlesRef.current.textContent = t.particleCount.toLocaleString('es-AR');
      if (godRaysRef.current) godRaysRef.current.textContent = `${Math.round(t.godRaysScale * 100)}%`;
      if (rendererRef.current) rendererRef.current.textContent = t.rendererName;
      if (swWarnRef.current) {
        swWarnRef.current.style.display = t.isSoftwareRenderer ? 'block' : 'none';
      }
    };

    updateDom();
    const id = window.setInterval(updateDom, 200);
    return () => window.clearInterval(id);
  }, [showTechOverlay]);

  return (
    <>
      <Leva hidden={!isDebugMode || !showTechOverlay} oneLineLabels flat titleBar={{ title: 'PARAMS EN VIVO' }} />

      {showTechOverlay && (
        <aside
          aria-label={CONTENT.techPanel.title}
          className="instrument-panel pointer-events-auto fixed top-20 right-4 z-30 w-72 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-glass)] p-3.5 backdrop-blur-md"
        >
          <div className="mb-2.5 flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
            <div className="flex items-center gap-1.5">
              <Activity aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-cyan)]" />
              <span className="font-telemetry text-[10px] font-semibold tracking-[0.2em] text-[var(--color-accent-cyan)] uppercase">
                {CONTENT.techPanel.title}
              </span>
            </div>
            <span className="font-telemetry rounded bg-[var(--color-void-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--color-accent-warm)] uppercase">
              {CONTENT.quality.tiers[qualityTier]} → {CONTENT.quality.tiers[effectiveQuality]}
            </span>
          </div>

          <dl className="font-telemetry grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.fps}</dt>
              <dd>
                <span ref={fpsRef} className="font-semibold text-[var(--color-text-primary)]">
                  60
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.frameTime}</dt>
              <dd>
                <span ref={frameTimeRef} className="text-[var(--color-text-primary)]">
                  16.6 ms
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.drawCalls}</dt>
              <dd>
                <span ref={drawCallsRef} className="text-[var(--color-accent-cyan)]">
                  0
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.triangles}</dt>
              <dd>
                <span ref={trianglesRef} className="text-[var(--color-text-primary)]">
                  0
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.geometries}</dt>
              <dd>
                <span ref={geometriesRef} className="text-[var(--color-text-primary)]">
                  0
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.textures}</dt>
              <dd>
                <span ref={texturesRef} className="text-[var(--color-text-primary)]">
                  0
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.dpr}</dt>
              <dd>
                <span ref={dprRef} className="text-[var(--color-text-primary)]">
                  1x
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.godRaysRes}</dt>
              <dd>
                <span ref={godRaysRef} className="text-[var(--color-text-primary)]">
                  75%
                </span>
              </dd>
            </div>
            <div className="col-span-2 flex justify-between border-t border-[var(--color-border-subtle)] pt-1.5">
              <dt className="text-[var(--color-text-muted)]">{CONTENT.techPanel.particles}</dt>
              <dd>
                <span ref={particlesRef} className="text-[var(--color-accent-warm)]">
                  52.000
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-2 flex items-center gap-1.5 border-t border-[var(--color-border-subtle)] pt-2 text-[10px] text-[var(--color-text-secondary)]">
            <Cpu aria-hidden="true" className="h-3 w-3 shrink-0 text-[var(--color-accent-cyan)]" />
            <span ref={rendererRef} className="truncate">
              WebGL2
            </span>
          </div>

          <div
            ref={swWarnRef}
            style={{ display: 'none' }}
            className="mt-2 rounded border border-[var(--color-accent-warm)] bg-[var(--color-void-elevated)] p-1.5 text-[10px] text-[var(--color-accent-warm)]"
          >
            {CONTENT.techPanel.softwareWarning}
          </div>
        </aside>
      )}
    </>
  );
}
