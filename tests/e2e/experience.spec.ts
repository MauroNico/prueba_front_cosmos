import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MEDIA_DIR = path.resolve(process.cwd(), 'docs', 'media');

interface TelemetryData {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  dpr: number;
  particleCount: number;
  godRaysScale: number;
  isSoftwareRenderer: boolean;
  rendererName: string;
  longTasksCount: number;
}

test.describe('PRUEBA FRONT COSMOS — Full Verification & Video Capture', () => {
  test.beforeAll(() => {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  });

  test('Desktop (1440x900) walkthrough, video recording, 50x leak check, a11y, and telemetry', async ({
    browser,
  }) => {
    const rawVideoDir = path.join(MEDIA_DIR, '.tmp-desktop-video');
    fs.mkdirSync(rawVideoDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: {
        dir: rawVideoDir,
        size: { width: 1440, height: 900 },
      },
    });

    const page = await context.newPage();
    const consoleErrors: string[] = [];
    const shaderOrThreeWarnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      if (
        msg.type() === 'warning' &&
        (/THREE\.WebGLProgram|Shader Error|GL_INVALID/i.test(text))
      ) {
        shaderOrThreeWarnings.push(text);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.addInitScript(() => {
      const vitals = { lcpMs: 0, cls: 0, fcpMs: 0 };
      (window as unknown as { __WEB_VITALS__: typeof vitals }).__WEB_VITALS__ = vitals;

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.lcpMs = Math.max(vitals.lcpMs, entry.startTime);
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          })[]) {
            if (!entry.hadRecentInput && typeof entry.value === 'number') {
              vitals.cls += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcpMs = entry.startTime;
            }
          }
        }).observe({ type: 'paint', buffered: true });
      } catch {
        // Ignore observer errors
      }
    });

    await page.goto('/');

    // Wait for intro and shader compilation
    await page.waitForTimeout(2400);

    // Check zero horizontal overflow
    const overflowDesktop = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflowDesktop).toBe(false);

    // Run Axe accessibility scan on default view
    const axeInitial = await new AxeBuilder({ page }).analyze();
    expect(axeInitial.violations).toEqual([]);

    // Open Technical Telemetry Overlay with key 'D'
    await page.keyboard.press('d');
    await expect(page.getByLabel('TELEMETRÍA DE RENDERIZADO [D]')).toBeVisible();

    await page.waitForTimeout(600);
    const phaseIdleTelemetry = await page.evaluate(
      () => (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__,
    );

    // Phase B: Pointer gravitational well + Click radial shockwave
    await page.mouse.move(720, 450);
    await page.waitForTimeout(300);
    await page.mouse.move(580, 360, { steps: 15 });
    await page.waitForTimeout(300);
    await page.mouse.click(580, 360);
    await page.waitForTimeout(700);

    const phaseInteractionTelemetry = await page.evaluate(
      () => (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__,
    );

    // Capture desktop screenshot
    await page.screenshot({
      path: path.join(MEDIA_DIR, 'desktop-1440-preview.png'),
    });

    // Phase C: Product Visualizer variants, camera presets, and modes
    await page.getByRole('button', { name: 'Obsidiana Emisiva' }).click();
    await page.waitForTimeout(550);
    await page.getByRole('button', { name: 'Cenital' }).click();
    await page.waitForTimeout(650);
    await page.getByRole('button', { name: 'Oro Bruñido' }).click();
    await page.waitForTimeout(550);
    await page.getByRole('button', { name: 'Detalle' }).click();
    await page.waitForTimeout(650);
    await page.getByRole('button', { name: 'Vidrio Iridiscente' }).click();
    await page.waitForTimeout(550);
    await page.getByRole('button', { name: 'Frontal' }).click();
    await page.waitForTimeout(550);
    await page.getByRole('button', { name: 'Exhibición' }).click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Exploración' }).click();

    const phaseVisualizerTelemetry = await page.evaluate(
      () => (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__,
    );

    // Phase D: Procedural Web Audio activation
    await page.getByRole('button', { name: 'Activar sonido' }).click();
    await page.waitForTimeout(700);

    const phaseAudioTelemetry = await page.evaluate(
      () => (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__,
    );

    // Memory Leak Verification: Alternate variants and quality tiers 50 times
    const beforeLeakCheck = await page.evaluate(
      () => ({
        geometries: (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__.geometries,
        textures: (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__.textures,
      }),
    );

    const variantNames = ['Cromo Líquido', 'Obsidiana Emisiva', 'Oro Bruñido', 'Vidrio Iridiscente'];
    const qualityNames = ['Alta', 'Media', 'Baja'];

    for (let i = 0; i < 50; i++) {
      const vName = variantNames[i % variantNames.length]!;
      const qName = qualityNames[i % qualityNames.length]!;
      await page.getByRole('button', { name: vName }).click();
      await page.getByRole('button', { name: qName, exact: true }).click();
    }

    // Restore High quality and wait 400ms for telemetry probe to sample gl.info.memory
    await page.getByRole('button', { name: 'Alta', exact: true }).click();
    await page.getByRole('button', { name: 'Cromo Líquido' }).click();
    await page.waitForTimeout(450);

    const afterLeakCheck = await page.evaluate(
      () => ({
        geometries: (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__.geometries,
        textures: (window as unknown as { __RING_SPHERE_TELEMETRY__: TelemetryData }).__RING_SPHERE_TELEMETRY__.textures,
      }),
    );

    expect(afterLeakCheck.geometries).toBeLessThanOrEqual(beforeLeakCheck.geometries);
    expect(afterLeakCheck.textures).toBeLessThanOrEqual(beforeLeakCheck.textures);

    // Verify WebGL context loss & restoration handling
    await page.getByRole('button', { name: 'Simular pérdida de contexto' }).click();
    await expect(page.getByText('CONTEXTO GRÁFICO INTERRUMPIDO')).toBeVisible();
    await page.getByRole('button', { name: 'Reintentar contexto 3D' }).click();
    await page.waitForTimeout(400);

    // Run Axe with TechOverlay open
    const axeWithOverlay = await new AxeBuilder({ page }).analyze();
    expect(axeWithOverlay.violations).toEqual([]);

    const webVitals = await page.evaluate(
      () =>
        (window as unknown as { __WEB_VITALS__: { lcpMs: number; cls: number; fcpMs: number } })
          .__WEB_VITALS__,
    );
    expect(webVitals.lcpMs).toBeLessThan(2500);
    expect(webVitals.cls).toBeLessThan(0.05);

    expect(consoleErrors).toEqual([]);
    expect(shaderOrThreeWarnings).toEqual([]);

    const video = page.video();
    await context.close();

    if (video) {
      const videoPath = await video.path();
      const targetVideoPath = path.join(MEDIA_DIR, 'desktop-1440.webm');
      fs.copyFileSync(videoPath, targetVideoPath);
      fs.rmSync(rawVideoDir, { recursive: true, force: true });
    }

    // Save telemetry report
    const reportPath = path.join(MEDIA_DIR, 'telemetry-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          webVitals: {
            lcpMs: Number(webVitals.lcpMs.toFixed(2)),
            fcpMs: Number(webVitals.fcpMs.toFixed(2)),
            cls: Number(webVitals.cls.toFixed(4)),
          },
          desktop: {
            idle: phaseIdleTelemetry,
            interaction: phaseInteractionTelemetry,
            visualizer: phaseVisualizerTelemetry,
            audio: phaseAudioTelemetry,
            leakCheck50x: {
              before: beforeLeakCheck,
              after: afterLeakCheck,
            },
          },
        },
        null,
        2,
      ),
    );
  });

  test('Mobile (390x844) walkthrough, video recording, reduced-motion, and static WebGL fallback', async ({
    browser,
  }) => {
    const rawMobileDir = path.join(MEDIA_DIR, '.tmp-mobile-video');
    fs.mkdirSync(rawMobileDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
      recordVideo: {
        dir: rawMobileDir,
        size: { width: 390, height: 844 },
      },
    });

    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1600);

    // Verify reduced motion badge is active
    await expect(page.getByText('MOVIMIENTO REDUCIDO ACTIVO')).toBeVisible();

    // Check zero horizontal overflow on 390px mobile viewport
    const overflowMobile = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflowMobile).toBe(false);

    // Interact with variants and shockwave button on mobile
    await page.getByRole('button', { name: 'Obsidiana Emisiva' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /PULSO RADIAL/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Oro Bruñido' }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(MEDIA_DIR, 'mobile-390-preview.png'),
    });

    const axeMobile = await new AxeBuilder({ page }).analyze();
    expect(axeMobile.violations).toEqual([]);

    // Also test WebGL static fallback view (?fallback=webgl)
    await page.goto('/?fallback=webgl');
    await expect(
      page.getByText('MOTOR WEBGL NO DISPONIBLE EN ESTE DISPOSITIVO'),
    ).toBeVisible();

    const axeFallback = await new AxeBuilder({ page }).analyze();
    expect(axeFallback.violations).toEqual([]);

    const video = page.video();
    await context.close();

    if (video) {
      const videoPath = await video.path();
      const targetVideoPath = path.join(MEDIA_DIR, 'mobile-390.webm');
      fs.copyFileSync(videoPath, targetVideoPath);
      fs.rmSync(rawMobileDir, { recursive: true, force: true });
    }
  });
});

