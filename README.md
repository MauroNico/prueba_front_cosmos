# PRUEBA FRONT COSMOS (`ring-sphere-lab`)

Experiencia interactiva 3D de pantalla completa con doble propósito: **micro-universo sci-fi** y **visualizador de materiales de precisión**, construida con **React 19**, **TypeScript (`strict` + `noUncheckedIndexedAccess`)**, **Three.js**, **React Three Fiber**, **GLSL**, **Postprocessing** y **Web Audio API**.

---

## 1. Propuesta Conceptual y Técnica — Fase 0 (10 líneas)

1. **Concepto**: Reliquia astronómica sci-fi suspendida en una cámara anecoica oscura; un instrumento óptico-gravitatorio que combina escultura cinética y visualizador de producto.
2. **Geometría**: 36 anillos concéntricos instanciados en una única llamada (`InstancedMesh`, 1 draw call geométrica) con atributos por instancia generados de forma determinista (`mulberry32`: radio, perfil, eje orbital, velocidad y fase).
3. **Paleta y luz**: Cámara oscura abisal (`oklch(0.08 0.012 255)`), fuente emisiva central en ámbar cálido (`oklch(0.83 0.16 75)`) y telemetría/reflejos especulares en cian frío (`oklch(0.82 0.14 210)`).
4. **Shader de distorsión líquida**: `MeshPhysicalMaterial` extendido con `onBeforeCompile` inyectando ruido Simplex 3D con *domain warping*, tensión superficial aparente en crestas y recálculo analítico de normales por diferencias finitas.
5. **Superficie e iridiscencia**: Reflexión de entorno con término Fresnel Schlick, iridiscencia angular de película delgada, rugosidad modulada por ruido 3D y emisión térmica en las crestas.
6. **Iluminación volumétrica**: `GodRays` de `@react-three/postprocessing` alimentado por el núcleo emisivo móvil que persigue al cursor con retardo crítico, usando los anillos como oclusores geométricos reales.
7. **Justificación de `GodRays`**: Proyecta haces crepusculares reales a través de los huecos de la esfera armilar en *screen-space* con resolución escalable (`0.35×` a `0.75×`) integrada en un único `EffectComposer`.
8. **Partículas GPU**: 52.000 partículas de polvo cósmico y chispas en un solo `Points` animadas 100% en el *vertex shader* con *curl noise* 3D, pozo gravitatorio del cursor, dispersión por onda de choque y modulación por agudos.
9. **Audio procedural**: Sintetizador Web Audio API sin recursos externos (drone de osciladores detuned + filtro paso-bajo + LFO + reverberación por convolución sintética + pulso sub-grave) y `AnalyserNode` FFT de 3 bandas con envolvente ataque/liberación.
10. **Presupuesto de GPU**: `27` draw calls totales incluyendo todos los pases de postprocesado (objetivo `< 60`), `dpr` acotado a `[1, 2]`, `60 FPS` sostenidos en desktop y escalado adaptativo mediante `PerformanceMonitor`.

---

## 2. Decisiones de Arquitectura y Técnicas de Shader

### 2.1 Esfera Armilar Instanciada (`src/components/scene/ArmillaryRings.tsx`)
- Los **36 anillos** se generan de forma determinista con `generateArmillaryRings(36, 133742)` usando el PRNG `mulberry32` en `src/lib/prng.ts`.
- Se renderizan con un único `THREE.InstancedMesh` y dos atributos por instancia (`InstancedBufferAttribute`):
  - `aRingMeta` (`vec4`): `[phase, speed, radius, profileType]`, donde `profileType ∈ {0, 1, 2}` esculpe en el vertex shader perfiles redondos, bandas planas o anillos con muescas micrométricas.
  - `aRingAxis` (`vec3`): eje unitario de rotación distribuido sobre una espiral de Fibonacci esférica.
- Todas las matrices de instancia se actualizan en `useFrame` reutilizando objetos pre-alocados (`_scratchMatrix`, `_scratchQuat`, `_scratchPos`, `_scratchScale`) fuera del bucle de render para garantizar **cero asignaciones de memoria (GC) por frame**.

### 2.2 Shader de Metal Líquido y Diferencias Finitas (`src/shaders/`)
- El código GLSL de ruido vive en un único módulo compartido `src/shaders/common/noise.glsl` importado mediante `#include "./common/noise.glsl"` tanto por el shader de los anillos como por el shader de las partículas GPU (cero duplicación de código GLSL).
- **Desplazamiento líquido (`ringsVertexHead.glsl`)**:
  - Combina ondas viajeras circunferenciales con un campo Simplex 3D con *domain warping* (`warpedLiquidField`).
  - Aplica suavizado de crestas (`rawWave / (1.0 + 0.55 * abs(rawWave))`) para simular tensión superficial elástica y un término de goteo gravitatorio viscoso en la cara inferior de cada anillo.
- **Recálculo de normales (`ringsVertexMain.glsl`)**:
  - Construye una base ortonormal tangente `(tangentT, bitangentB)` perpendicular a `objectNormal`.
  - Evalúa el desplazamiento en `P0`, `P0 + tangentT * eps` y `P0 + bitangentB * eps`, recalculando `objectNormal = normalize(cross(dispT - disp0, dispB - disp0))` antes de `<defaultnormal_vertex>` para que la luz física y los reflejos del entorno respondan fielmente a cada onda y al pozo gravitatorio.
- **Superficie física (`ringsFragmentRoughness.glsl` & `ringsFragmentEmissive.glsl`)**:
  - Modula `roughnessFactor` por ruido 3D y tensión de cresta.
  - Añade reflexión de borde Fresnel Schlick (`pow(1.0 - NdotV, 3.4)`), iridiscencia espectral de película delgada (`thinFilmIridescence`) y radiancia emisiva en las crestas modulada por los agudos del audio.

### 2.3 Iluminación Volumétrica y Postprocesado (`src/components/scene/VolumetricCoreAndPostpro.tsx`)
- **Técnica elegida**: `GodRays` de `@react-three/postprocessing` (motor `postprocessing`) combinado con un núcleo emisivo móvil (`sphereGeometry` + `pointLight` cálida co-localizada) que persigue al puntero 3D con amortiguamiento crítico (`omega = 4.5`).
- **Por qué se eligió**: Aprovecha directamente el pase de profundidad donde el `InstancedMesh` de los anillos actúa como oclusor geométrico real. De este modo, los rayos crepusculares se filtran dinámicamente por las ranuras entre los anillos con costo constante en espacio de pantalla y se fusionan con `Bloom` (`mipmapBlur`), `ChromaticAberration`, `Noise` (grano de película) y `Vignette` dentro de un único `<EffectComposer multisampling={0} enableNormalPass={false}>`.

### 2.4 Partículas GPU (`src/components/scene/CosmicParticles.tsx`)
- `52.000` partículas pre-alocadas una sola vez en GPU (`BufferGeometry`) y reguladas dinámicamente según el nivel de calidad (`52.000` en Alta, `28.000` en Media, `12.000` en Baja) mediante `geometry.setDrawRange(0, preset.particleCount)` sin recrear buffers ni causar tirones.
- Animadas íntegramente en `particlesVertex.glsl` mediante **Curl Noise 3D** libre de divergencia, atracción al pozo gravitatorio del cursor, dispersión radial por onda de choque y tamaño atenuado por profundidad. En `particlesFragment.glsl`, el color transiciona por velocidad desde cian frío hasta ámbar cálido e incandescencia blanca.

### 2.5 Audio 100% Procedural (`src/lib/audioEngine.ts`)
- Sintetizado en tiempo real con **Web Audio API** tras gesto explícito del usuario (`Activar sonido`):
  - Osciladores detuned (`55 Hz` A1 sawtooth + `82.41 Hz` E2 triangle + armónico cristalino `2616.25 Hz`) filtrados por un `BiquadFilterNode` paso-bajo modulado por LFO (`0.14 Hz`).
  - Pulso sub-grave rítmico (`65.41 Hz`) modulado por LFO (`0.52 Hz`).
  - Reverberación por convolución (`ConvolverNode`) con respuesta al impulso estéreo generada algorítmicamente (`createSyntheticReverbBuffer`, sin archivos externos).
  - Extracción FFT en 3 bandas (`Graves 25–180 Hz`, `Medios 180–2000 Hz`, `Agudos 2000–9000 Hz`) suavizadas con envolvente ataque/liberación independiente de los FPS (`stepAudioEnvelope`).

---

## 3. Cómo Ejecutar y Ajustar Parámetros

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Verificación estática y build de producción
npm run lint
npm run typecheck
npm run build

# Tests unitarios (Vitest) y verificación E2E con grabación de video (Playwright)
npm run test
npm run test:e2e
```

### Controles y Parámetros en Vivo
- **Tecla `D` (o botón `[D]`)**: Abre/cierra el overlay de **Telemetría de Renderizado** (FPS, tiempo de frame, draw calls acumulados, triángulos, geometrías, texturas, DPR, partículas activas, resolución volumétrica y GPU detectada).
- **Panel Leva en vivo (`?debug` o modo `dev`)**: Al abrir la aplicación en desarrollo o con `?debug` en la URL y activar el overlay con `D`, aparece el panel interactivo **Leva (`PARAMS EN VIVO`)** para ajustar en tiempo real:
  - `noiseAmplitude` (`0.00 – 0.55`): Amplitud de deformación líquida de los anillos.
  - `noiseFrequency` (`0.40 – 4.00`): Frecuencia espacial del campo Simplex 3D con domain warping.
  - `godRaysIntensity` (`0.00 – 1.50`): Peso de dispersión de los rayos volumétricos.
  - `bloomIntensity` (`0.00 – 3.00`): Intensidad del resplandor HDR mipmap.
  - `particleTurbulence` (`0.10 – 3.00`): Intensidad del campo *curl noise* sobre las 52.000 partículas.
- **Simulación de estados por URL**:
  - `?fallback=webgl`: Fuerza la vista estática de respaldo con gradientes CSS y anillos concéntricos manteniendo toda la jerarquía tipográfica.
  - `?fallback=contextlost`: Fuerza el estado de pérdida de contexto WebGL con botón de reconexión.

---

## 4. Métricas Medidas y Verificación (`docs/media/`)

Las pruebas automatizadas con Playwright (`tests/e2e/experience.spec.ts`) se ejecutaron sobre GPU dedicada real:
- **GPU detectada**: `ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)` (`isSoftwareRenderer: false`)
- **Videos generados**:
  - Desktop (`1440×900`): `docs/media/desktop-1440.webm` y captura `docs/media/desktop-1440-preview.png`
  - Mobile (`390×844`): `docs/media/mobile-390.webm` y captura `docs/media/mobile-390-preview.png`
- **Reporte crudo**: `docs/media/telemetry-report.json`

| Fase de la Experiencia | FPS Medidos | Tiempo de Frame | Draw Calls (Total Frame) | Triángulos | Geometrías | Texturas | Partículas GPU |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Entrada / Reposo (Alta)** | `60 FPS` | `16.64 ms` | `27` | `163.511` | `9` | `30` | `52.000` |
| **2. Interacción (Pozo + Onda)** | `60 FPS` | `16.64 ms` | `27` | `163.511` | `9` | `30` | `52.000` |
| **3. Visualizador (4 Variantes)** | `60 FPS` | `16.69 ms` | `27` | `163.511` | `9` | `31` | `52.000` |
| **4. Reactividad al Audio FFT** | `60 FPS` | `16.66 ms` | `27` | `163.511` | `9` | `31` | `52.000` |

### Prueba de Fugas de Memoria (50 iteraciones de Variantes + Calidades)
- **Antes de 50 cambios**: `9` geometrías, `31` texturas.
- **Después de 50 cambios**: `9` geometrías, `31` texturas (**crecimiento `0`**, sin fugas de recursos WebGL).
- **Core Web Vitals y Presupuesto de Carga**:
  - **Shell inicial**: `33.89 kB` gzip (`index.html` `0.76 kB` + `index.css` `8.19 kB` + `index.js` `24.94 kB`, objetivo `< 150 kB` gzip).
  - **LCP (Largest Contentful Paint)**: `596 ms` (`0.60 s`, objetivo `< 2.5 s`).
  - **FCP (First Contentful Paint)**: `596 ms`.
  - **CLS (Cumulative Layout Shift)**: `0` (objetivo `~0`).
- **Auditoría de Accesibilidad (`@axe-core/playwright`)**: `0` violaciones en vista principal Desktop (`1440×900`), vista con panel técnico abierto (`[D]`), vista Mobile (`390×844`) con `prefers-reduced-motion: reduce` y vista de fallback sin WebGL (`?fallback=webgl`).

---

## 5. Licencias y Recursos

- **Geometría, Entorno HDRI (`Lightformers`), Shaders y Síntesis de Audio**: 100% procedurales, creados específicamente para este proyecto (Licencia MIT).
- **Algoritmo Simplex Noise 3D (`src/shaders/common/noise.glsl`)**: Basado en la implementación de referencia de Ian McEwan y Stefan Gustavson (Ashima Arts /webgl-noise), bajo **MIT License**.
- **Tipografías Autoalojadas**:
  - `Fraunces Variable` (`@fontsource-variable/fraunces`) — **SIL Open Font License 1.1 (OFL-1.1)**.
  - `JetBrains Mono Variable` (`@fontsource-variable/jetbrains-mono`) — **SIL Open Font License 1.1 (OFL-1.1)**.
