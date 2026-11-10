import { CONTENT } from './content';

export function App() {
  return (
    <main className="relative flex h-full w-full flex-col justify-between bg-[var(--color-void)] p-6 text-[var(--color-text-primary)] select-none">
      <header className="flex items-start justify-between">
        <div>
          <p className="font-telemetry text-[11px] tracking-[0.28em] text-[var(--color-accent-cyan)] uppercase">
            {CONTENT.project.edition}
          </p>
          <h1 className="font-display-editorial mt-1 text-3xl font-light tracking-tight md:text-5xl">
            {CONTENT.project.name}
          </h1>
          <p className="font-telemetry mt-1 text-xs tracking-[0.2em] text-[var(--color-text-secondary)] uppercase">
            {CONTENT.project.subtitle}
          </p>
        </div>
      </header>
    </main>
  );
}
