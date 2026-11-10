import { useEffect, useRef } from 'react';
import { Crosshair, Radio } from 'lucide-react';
import { CONTENT } from '../../content';
import { transientLabState, triggerShockwave, useLabStore } from '../../store/useLabStore';

export function CoordinateHud() {
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);
  const autoDegraded = useLabStore((s) => s.autoDegraded);
  const isTabHidden = useLabStore((s) => s.isTabHidden);
  const motionPaused = useLabStore((s) => s.motionPaused);

  const coordXRef = useRef<HTMLSpanElement>(null);
  const coordYRef = useRef<HTMLSpanElement>(null);
  const coordZRef = useRef<HTMLSpanElement>(null);
  const shockRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const updateHud = () => {
      const p = transientLabState.pointer3D;
      if (coordXRef.current) coordXRef.current.textContent = p.x >= 0 ? `+${p.x.toFixed(2)}` : p.x.toFixed(2);
      if (coordYRef.current) coordYRef.current.textContent = p.y >= 0 ? `+${p.y.toFixed(2)}` : p.y.toFixed(2);
      if (coordZRef.current) coordZRef.current.textContent = p.z >= 0 ? `+${p.z.toFixed(2)}` : p.z.toFixed(2);

      if (shockRef.current) {
        const shockEnergy =
          transientLabState.shockwave.age < 3.5
            ? Math.max(0, Math.exp(-transientLabState.shockwave.age * 1.1) * 100)
            : 0;
        shockRef.current.textContent = `${Math.round(shockEnergy)}%`;
      }
    };

    updateHud();
    const id = window.setInterval(updateHud, 100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      aria-label={CONTENT.accessibility.telemetryLandmark}
      className="pointer-events-none flex flex-wrap items-center gap-2"
    >
      <div className="instrument-panel flex items-center gap-3 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-3 py-1.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <Crosshair aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-cyan)]" />
          <span className="font-telemetry text-[10px] tracking-[0.18em] text-[var(--color-text-secondary)] uppercase">
            {CONTENT.hud.coordinatesLabel}
          </span>
        </div>
        <div className="font-telemetry flex items-center gap-2 text-[11px] text-[var(--color-text-primary)]">
          <span>
            X <strong ref={coordXRef}>+0.00</strong>
          </span>
          <span>
            Y <strong ref={coordYRef}>+0.00</strong>
          </span>
          <span>
            Z <strong ref={coordZRef}>+0.00</strong>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          triggerShockwave(
            transientLabState.pointer3D.x,
            transientLabState.pointer3D.y,
            transientLabState.pointer3D.z,
            prefersReducedMotion || motionPaused ? 0.2 : 1.0,
          )
        }
        className="instrument-panel interactive-target font-telemetry pointer-events-auto flex items-center gap-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-3 py-1.5 text-[10px] tracking-[0.18em] text-[var(--color-text-primary)] uppercase backdrop-blur-md hover:border-[var(--color-accent-warm)]"
      >
        <Radio aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-warm)]" />
        <span>{CONTENT.hud.shockwaveLabel}</span>
        <span ref={shockRef} className="font-semibold text-[var(--color-accent-warm)]">
          0%
        </span>
      </button>

      {prefersReducedMotion && (
        <span className="font-telemetry rounded border border-[var(--color-accent-cyan)] bg-[var(--color-void-elevated)] px-2.5 py-1 text-[10px] tracking-[0.16em] text-[var(--color-accent-cyan)] uppercase">
          {CONTENT.hud.reducedMotionBadge}
        </span>
      )}

      {autoDegraded && (
        <span className="font-telemetry rounded border border-[var(--color-accent-warm)] bg-[var(--color-void-elevated)] px-2.5 py-1 text-[10px] tracking-[0.16em] text-[var(--color-accent-warm)] uppercase">
          {CONTENT.hud.autoDegradedBadge}
        </span>
      )}

      {isTabHidden && (
        <span className="font-telemetry rounded border border-[var(--color-border-strong)] bg-[var(--color-void-elevated)] px-2.5 py-1 text-[10px] tracking-[0.16em] text-[var(--color-text-secondary)] uppercase">
          {CONTENT.hud.tabPausedBadge}
        </span>
      )}
    </section>
  );
}
