import { AlertTriangle, RefreshCw } from 'lucide-react';
import { CONTENT } from '../../content';
import { useLabStore } from '../../store/useLabStore';

interface WebglFallbackViewProps {
  onRestoreRequest: () => void;
}

export function WebglFallbackView({ onRestoreRequest }: WebglFallbackViewProps) {
  const webglStatus = useLabStore((s) => s.webglStatus);
  const variant = useLabStore((s) => s.variant);

  if (webglStatus === 'ok') {
    return null;
  }

  const isContextLost = webglStatus === 'context-lost';

  const gradientPalette: Record<typeof variant, string> = {
    chrome:
      'radial-gradient(circle at 50% 48%, rgba(255, 190, 105, 0.25) 0%, rgba(77, 227, 255, 0.16) 28%, rgba(5, 7, 11, 0.96) 68%)',
    obsidian:
      'radial-gradient(circle at 50% 48%, rgba(255, 123, 28, 0.32) 0%, rgba(30, 22, 36, 0.35) 32%, rgba(5, 7, 11, 0.98) 68%)',
    gold:
      'radial-gradient(circle at 50% 48%, rgba(255, 190, 85, 0.35) 0%, rgba(168, 108, 24, 0.18) 32%, rgba(5, 7, 11, 0.96) 68%)',
    iridescent:
      'radial-gradient(circle at 50% 48%, rgba(92, 242, 255, 0.28) 0%, rgba(201, 139, 255, 0.2) 32%, rgba(5, 7, 11, 0.96) 68%)',
  };

  return (
    <div
      role="alert"
      className="fixed inset-0 z-20 flex flex-col items-center justify-center p-6 text-center"
      style={{ backgroundImage: gradientPalette[variant] }}
    >
      {/* Static CSS concentric armillary rings representation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute flex items-center justify-center"
      >
        <div className="h-72 w-72 rounded-full border border-[var(--color-accent-cyan)]/30 sm:h-96 sm:w-96" />
        <div className="absolute h-60 w-60 rotate-45 rounded-full border border-[var(--color-accent-warm)]/40 sm:h-80 sm:w-80" />
        <div className="absolute h-44 w-44 -rotate-12 rounded-full border border-[var(--color-text-primary)]/25 sm:h-60 sm:w-60" />
        <div className="absolute h-16 w-16 rounded-full bg-[var(--color-accent-warm)]/30 blur-xl" />
      </div>

      <div className="instrument-panel relative z-10 max-w-md rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-glass)] p-5 backdrop-blur-md">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-accent-warm)] bg-[var(--color-void-elevated)]">
          <AlertTriangle aria-hidden="true" className="h-5 w-5 text-[var(--color-accent-warm)]" />
        </div>

        <h2 className="font-telemetry text-xs font-semibold tracking-[0.2em] text-[var(--color-accent-warm)] uppercase">
          {isContextLost
            ? CONTENT.fallbacks.contextLostTitle
            : CONTENT.fallbacks.webglUnavailableTitle}
        </h2>

        <p className="font-telemetry mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          {isContextLost
            ? CONTENT.fallbacks.contextLostBody
            : CONTENT.fallbacks.webglUnavailableBody}
        </p>

        {isContextLost && (
          <button
            type="button"
            onClick={onRestoreRequest}
            className="interactive-target font-telemetry pointer-events-auto mt-4 inline-flex items-center gap-2 rounded border border-[var(--color-accent-cyan)] bg-[var(--color-void-elevated)] px-3.5 py-1.5 text-xs font-semibold tracking-[0.16em] text-[var(--color-text-primary)] uppercase hover:bg-[var(--color-accent-cyan)] hover:text-[var(--color-void)]"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{CONTENT.fallbacks.restoreCta}</span>
          </button>
        )}
      </div>
    </div>
  );
}
