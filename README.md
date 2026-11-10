# PRUEBA FRONT COSMOS (`ring-sphere-lab`)

Experiencia interactiva 3D en tiempo real y visualizador de materiales de precisión construido con **Three.js**, **React Three Fiber**, **GLSL** y **Web Audio API**.

## Fase 0 — Propuesta Conceptual y Técnica (10 líneas)

1. **Concepto**: Reliquia astronómica sci-fi suspendida en una cámara anecoica oscura; un instrumento óptico-gravitatorio que combina micro-universo cinético y visualizador de materiales.
2. **Geometría**: 36 anillos concéntricos instanciados en una única llamada (`InstancedMesh`, 1 draw call) con atributos por instancia generados de forma determinista (`mulberry32`: radio, perfil, eje orbital, velocidad y fase).
3. **Paleta y luz**: Cámara oscura abisal (`oklch(0.08 0.012 255)`), fuente emisiva central en ámbar cálido (`oklch(0.83 0.16 75)`) y telemetría/reflejos especulares en cian frío (`oklch(0.82 0.14 210)`).
4. **Shader de distorsión líquida**: `MeshPhysicalMaterial` extendido con `onBeforeCompile` inyectando ruido Simplex 3D con *domain warping*, tensión superficial en crestas y recálculo analítico de normales por diferencias finitas.
5. **Superficie e iridiscencia**: Reflexión de entorno con término Fresnel Schlick, iridiscencia angular de película delgada, rugosidad modulada por ruido 3D y emisión térmica en las crestas.
6. **Iluminación volumétrica**: `GodRays` de `@react-three/postprocessing` alimentado por el núcleo emisivo móvil que persigue al cursor con retardo crítico, usando los anillos como oclusores geométricos reales.
7. **Justificación de `GodRays`**: Proyecta haces crepusculares reales a través de las ranuras de la esfera armilar en *screen-space* con resolución escalable (`0.5×` a `1.0×`) integrada en un único `EffectComposer`.
8. **Partículas GPU**: 50.000+ partículas de polvo cósmico y chispas en un solo `Points` animadas 100% en el *vertex shader* con *curl noise* 3D, pozo gravitatorio del cursor, dispersión por onda de choque y modulación por agudos.
9. **Audio procedural**: Sintetizador Web Audio API sin recursos externos (drone de osciladores detuned + filtro paso-bajo + LFO + reverberación por convolución sintética + pulso sub-grave) y `AnalyserNode` FFT de 3 bandas con envolvente ataque/liberación.
10. **Presupuesto de GPU**: `< 25` draw calls totales en escena completa, `dpr` acotado a `[1, 2]`, 60 FPS sostenidos en desktop y escalado adaptativo mediante `PerformanceMonitor`.
