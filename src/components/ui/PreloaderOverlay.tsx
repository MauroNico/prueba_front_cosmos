import { AnimatePresence, motion } from 'motion/react';
import { Disc3 } from 'lucide-react';
import { CONTENT } from '../../content';
import { useLabStore } from '../../store/useLabStore';

export function PreloaderOverlay() {
  const preloaderPhase = useLabStore((s) => s.preloaderPhase);
  const webglStatus = useLabStore((s) => s.webglStatus);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);

  const isVisible = preloaderPhase === 'compiling' && webglStatus === 'ok';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="preloader"
          role="status"
          aria-live="polite"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.45, ease: 'easeOut' }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[var(--color-void)] px-6 text-center"
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-void-elevated)]">
            <Disc3
              aria-hidden="true"
              className="h-9 w-9 text-[var(--color-accent-warm)]"
            />
          </div>

          <p className="font-telemetry mt-5 text-[11px] tracking-[0.28em] text-[var(--color-accent-cyan)] uppercase">
            {CONTENT.project.name}
          </p>
          <p className="font-telemetry mt-2 max-w-md text-xs tracking-[0.2em] text-[var(--color-text-secondary)] uppercase">
            {CONTENT.preloader.statusCompiling}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

