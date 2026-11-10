import { Suspense, lazy } from 'react';
import { Activity } from 'lucide-react';
import { CONTENT } from './content';
import { AudioControls } from './components/ui/AudioControls';
import { ChoreographedHeader } from './components/ui/ChoreographedHeader';
import { CoordinateHud } from './components/ui/CoordinateHud';
import { PreloaderOverlay } from './components/ui/PreloaderOverlay';
import { ProductVisualizerDock } from './components/ui/ProductVisualizerDock';
import { QualitySelector } from './components/ui/QualitySelector';
import { TechOverlay } from './components/ui/TechOverlay';
import { useLabStore } from './store/useLabStore';

const SceneCanvas = lazy(() => import('./components/scene/SceneCanvas'));

export function App() {
  const showTechOverlay = useLabStore((s) => s.showTechOverlay);
  const toggleTechOverlay = useLabStore((s) => s.toggleTechOverlay);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--color-void)] text-[var(--color-text-primary)] select-none">
      <a
        href="#instrument-controls"
        className="visually-hidden fixed top-3 left-3 z-50 rounded border border-[var(--color-accent-cyan)] bg-[var(--color-void-elevated)] px-3 py-2 text-xs text-[var(--color-text-primary)]"
      >
        {CONTENT.accessibility.skipToControls}
      </a>

      <PreloaderOverlay />

      <Suspense fallback={null}>
        <SceneCanvas />
      </Suspense>

      <main className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-between p-3 sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <ChoreographedHeader />

          <div id="instrument-controls" className="flex flex-wrap items-center gap-2">
            <AudioControls />
            <QualitySelector />
            <button
              type="button"
              aria-pressed={showTechOverlay}
              aria-label={CONTENT.accessibility.toggleTechOverlay}
              onClick={toggleTechOverlay}
              className="instrument-panel interactive-target font-telemetry pointer-events-auto inline-flex items-center gap-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-glass)] px-2.5 py-1.5 text-[11px] tracking-[0.15em] text-[var(--color-text-primary)] uppercase backdrop-blur-md hover:border-[var(--color-accent-cyan)]"
            >
              <Activity aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent-cyan)]" />
              <span>[D]</span>
            </button>
          </div>
        </header>

        <footer className="flex flex-col gap-2">
          <ProductVisualizerDock />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CoordinateHud />
            <p className="font-telemetry rounded bg-[var(--color-void)]/75 px-2.5 py-1 text-[10px] tracking-[0.22em] text-[var(--color-text-secondary)] uppercase backdrop-blur-sm">
              {CONTENT.project.classification}
            </p>
          </div>
        </footer>
      </main>

      <TechOverlay />
    </div>
  );
}
