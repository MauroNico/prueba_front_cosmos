import { cva } from 'class-variance-authority';
import { Gauge } from 'lucide-react';
import { CONTENT, type QualityTierId } from '../../content';
import { cn } from '../../lib/cn';
import { useLabStore } from '../../store/useLabStore';

const pillVariants = cva(
  'interactive-target font-telemetry inline-flex items-center justify-center rounded px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.14em] border',
  {
    variants: {
      active: {
        true: 'border-[var(--color-accent-cyan)] bg-[var(--color-void-elevated)] text-[var(--color-text-primary)] font-semibold',
        false:
          'border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

const TIERS: QualityTierId[] = ['auto', 'high', 'medium', 'low'];

export function QualitySelector() {
  const qualityTier = useLabStore((s) => s.qualityTier);
  const effectiveQuality = useLabStore((s) => s.effectiveQuality);
  const setQualityTier = useLabStore((s) => s.setQualityTier);

  return (
    <div
      role="group"
      aria-label={CONTENT.accessibility.qualityGroup}
      className="instrument-panel pointer-events-auto flex flex-wrap items-center gap-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-2 py-1 backdrop-blur-md sm:gap-1.5 sm:px-2.5 sm:py-1.5"
    >
      <span className="font-telemetry mr-0.5 hidden items-center gap-1 text-[10px] tracking-[0.2em] text-[var(--color-text-secondary)] uppercase sm:flex">
        <Gauge aria-hidden="true" className="h-3 w-3 text-[var(--color-accent-cyan)]" />
        {CONTENT.quality.label}
      </span>
      {TIERS.map((tier) => {
        const isActive = qualityTier === tier;
        const label =
          tier === 'auto'
            ? `${CONTENT.quality.tiers.auto} (${CONTENT.quality.tiers[effectiveQuality]})`
            : CONTENT.quality.tiers[tier];
        return (
          <button
            key={tier}
            type="button"
            aria-pressed={isActive}
            onClick={() => setQualityTier(tier)}
            className={cn(pillVariants({ active: isActive }))}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-cyan)]"
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
