import { cva } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, Compass, Layers, Pause, Play } from 'lucide-react';
import {
  CONTENT,
  type CameraPresetId,
  type InteractionModeId,
  type MaterialVariantId,
} from '../../content';
import { cn } from '../../lib/cn';
import { useLabStore } from '../../store/useLabStore';

const controlButtonVariants = cva(
  'interactive-target font-telemetry inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] border',
  {
    variants: {
      active: {
        true: 'border-[var(--color-accent-cyan)] bg-[var(--color-void-elevated)] text-[var(--color-text-primary)] font-semibold',
        false:
          'border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]',
      },
      accent: {
        cyan: '',
        warm: '',
      },
    },
    compoundVariants: [
      {
        active: true,
        accent: 'warm',
        className:
          'border-[var(--color-accent-warm)] bg-[var(--color-void-elevated)] text-[var(--color-accent-warm)]',
      },
    ],
    defaultVariants: {
      active: false,
      accent: 'cyan',
    },
  },
);

export function ProductVisualizerDock() {
  const variant = useLabStore((s) => s.variant);
  const cameraPreset = useLabStore((s) => s.cameraPreset);
  const mode = useLabStore((s) => s.mode);
  const motionPaused = useLabStore((s) => s.motionPaused);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);

  const setVariant = useLabStore((s) => s.setVariant);
  const setCameraPreset = useLabStore((s) => s.setCameraPreset);
  const setMode = useLabStore((s) => s.setMode);
  const toggleMotionPaused = useLabStore((s) => s.toggleMotionPaused);

  const activeVariantMeta =
    CONTENT.variants.find((v) => v.id === variant) ?? CONTENT.variants[0];

  const handleSelectVariant = (id: MaterialVariantId) => {
    setVariant(id);
  };

  const handleSelectCamera = (id: CameraPresetId) => {
    setCameraPreset(id);
  };

  const handleSelectMode = (id: InteractionModeId) => {
    setMode(id);
  };

  return (
    <nav
      aria-label={CONTENT.accessibility.controlsLandmark}
      className="pointer-events-none flex w-full flex-col gap-2"
    >
      {/* Active Material Technical Readout Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeVariantMeta.id}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
            transition={{ duration: 0.18 }}
            className="instrument-panel pointer-events-auto flex flex-wrap items-center gap-2.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-3 py-1.5 backdrop-blur-md"
          >
            <span className="font-telemetry rounded bg-[var(--color-void-elevated)] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--color-accent-warm)]">
              {activeVariantMeta.shortCode} // {activeVariantMeta.formula}
            </span>
            <span className="font-telemetry text-[10px] tracking-[0.16em] text-[var(--color-accent-cyan)]">
              {activeVariantMeta.indexOfRefraction}
            </span>
            <span className="font-telemetry text-[11px] text-[var(--color-text-secondary)]">
              {activeVariantMeta.description}
            </span>
          </motion.div>
        </AnimatePresence>

        <span className="font-telemetry hidden rounded bg-[var(--color-void)]/75 px-2.5 py-1 text-[10px] tracking-[0.18em] text-[var(--color-text-secondary)] uppercase backdrop-blur-sm lg:inline-block">
          {CONTENT.preloader.enterHint}
        </span>
      </div>

      {/* Main Controls Row: Material Variants, Camera Presets, Exploration/Exhibition Mode, Motion Pause */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* 4 Material Variants */}
        <div
          role="group"
          aria-label={CONTENT.accessibility.variantsGroup}
          className="instrument-panel pointer-events-auto flex flex-wrap items-center gap-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-2.5 py-1.5 backdrop-blur-md"
        >
          <span className="font-telemetry mr-1 flex items-center gap-1 text-[10px] tracking-[0.18em] text-[var(--color-text-secondary)] uppercase">
            <Layers aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-warm)]" />
            <span>MATERIAL</span>
          </span>
          {CONTENT.variants.map((item) => {
            const isActive = variant === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelectVariant(item.id)}
                className={cn(controlButtonVariants({ active: isActive, accent: 'warm' }))}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-warm)]"
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Camera Presets + Mode + Pause Motion */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={CONTENT.accessibility.cameraGroup}
            className="instrument-panel pointer-events-auto flex flex-wrap items-center gap-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-2.5 py-1.5 backdrop-blur-md"
          >
            <span className="font-telemetry mr-1 flex items-center gap-1 text-[10px] tracking-[0.18em] text-[var(--color-text-secondary)] uppercase">
              <Camera aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-cyan)]" />
              <span>CÁMARA</span>
            </span>
            {CONTENT.cameras.map((cam) => {
              const isActive = cameraPreset === cam.id;
              return (
                <button
                  key={cam.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectCamera(cam.id)}
                  className={cn(controlButtonVariants({ active: isActive }))}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-cyan)]"
                    />
                  )}
                  <span>{cam.label}</span>
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label={CONTENT.accessibility.modeGroup}
            className="instrument-panel pointer-events-auto flex flex-wrap items-center gap-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-2.5 py-1.5 backdrop-blur-md"
          >
            <Compass aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-cyan)]" />
            {(['exploration', 'exhibition'] as const).map((mKey) => {
              const m = CONTENT.modes[mKey];
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectMode(m.id)}
                  className={cn(controlButtonVariants({ active: isActive }))}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-cyan)]"
                    />
                  )}
                  <span>{m.label}</span>
                </button>
              );
            })}

            {/* Visible Pause / Play Motion Button (no aria-pressed since label changes between Pause and Resume per WCAG 2.2.2 & modern-web-guidance) */}
            <button
              type="button"
              onClick={toggleMotionPaused}
              className="interactive-target font-telemetry ml-1 inline-flex items-center gap-1 rounded border border-[var(--color-border-strong)] bg-[var(--color-void-elevated)] px-2.5 py-1 text-[11px] tracking-[0.14em] text-[var(--color-text-primary)] uppercase hover:border-[var(--color-accent-warm)]"
            >
              {motionPaused ? (
                <>
                  <Play aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-warm)]" />
                  <span>{CONTENT.accessibility.resumeMotion}</span>
                </>
              ) : (
                <>
                  <Pause aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-cyan)]" />
                  <span>{CONTENT.accessibility.pauseMotion}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
