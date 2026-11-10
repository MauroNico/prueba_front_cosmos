import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CONTENT } from '../../content';
import { useLabStore } from '../../store/useLabStore';

export function ChoreographedHeader() {
  const preloaderPhase = useLabStore((s) => s.preloaderPhase);
  const prefersReducedMotion = useLabStore((s) => s.prefersReducedMotion);
  const titleContainerRef = useRef<HTMLHeadingElement>(null);
  const hasAnimatedRef = useRef(false);

  const characters = Array.from(CONTENT.project.name);

  useEffect(() => {
    if (preloaderPhase === 'compiling' || hasAnimatedRef.current) return;
    const el = titleContainerRef.current;
    if (!el) return;

    hasAnimatedRef.current = true;
    const charSpans = el.querySelectorAll<HTMLElement>('[data-char]');

    if (prefersReducedMotion || charSpans.length === 0) {
      charSpans.forEach((span) => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0px)';
      });
      return;
    }

    gsap.fromTo(
      charSpans,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.028,
        ease: 'power3.out',
        delay: 0.25,
      },
    );
  }, [prefersReducedMotion, preloaderPhase]);

  return (
    <div className="rounded bg-[var(--color-void)]/75 px-3.5 py-2 backdrop-blur-md">
      <p className="font-telemetry text-[10px] tracking-[0.28em] text-[var(--color-accent-cyan)] uppercase">
        {CONTENT.project.edition}
      </p>
      <h1
        ref={titleContainerRef}
        aria-label={CONTENT.project.name}
        className="font-display-editorial mt-0.5 text-2xl font-light tracking-tight text-[var(--color-text-primary)] md:text-4xl"
      >
        {characters.map((ch, idx) => (
          <span
            key={`${idx}-${ch}`}
            data-char
            aria-hidden="true"
            className="inline-block"
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </h1>
      <p className="font-telemetry mt-0.5 text-[10px] tracking-[0.2em] text-[var(--color-text-secondary)] uppercase">
        {CONTENT.project.subtitle}
      </p>
    </div>
  );
}
