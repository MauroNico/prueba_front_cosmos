export type MaterialVariantId = 'chrome' | 'obsidian' | 'gold' | 'iridescent';
export type CameraPresetId = 'frontal' | 'zenith' | 'detail';
export type InteractionModeId = 'exploration' | 'exhibition';
export type QualityTierId = 'auto' | 'high' | 'medium' | 'low';

export interface MaterialVariantContent {
  id: MaterialVariantId;
  label: string;
  shortCode: string;
  formula: string;
  description: string;
  indexOfRefraction: string;
}

export interface CameraPresetContent {
  id: CameraPresetId;
  label: string;
  code: string;
  focalLength: string;
}

export const CONTENT = {
  project: {
    name: 'PRUEBA FRONT COSMOS',
    slug: 'ring-sphere-lab',
    subtitle: 'LABORATORIO DE ESFERA ARMILAR // RELIQUIA DE METAL LÍQUIDO',
    edition: 'REV 04.8 // CÁMARA ANECOICA ORBITAL',
    classification: 'INSTRUMENTO ÓPTICO-GRAVITATORIO DE PRECISIÓN',
  },
  accessibility: {
    skipToControls: 'Saltar a los controles del instrumento',
    canvasAriaLabel:
      'Escena 3D interactiva: esfera armilar de anillos concéntricos de metal líquido suspendida en una cámara oscura con luz volumétrica y polvo cósmico.',
    controlsLandmark: 'Panel de control del instrumento',
    telemetryLandmark: 'Telemetría y coordenadas en tiempo real',
    variantsGroup: 'Selector de variante de material',
    cameraGroup: 'Selector de encuadre de cámara',
    modeGroup: 'Modo de operación de la escena',
    qualityGroup: 'Nivel de calidad gráfica',
    audioGroup: 'Controles de síntesis de audio ambiental',
    pauseMotion: 'Pausar movimiento',
    resumeMotion: 'Reanudar movimiento',
    enableAudio: 'Activar sonido',
    muteAudio: 'Silenciar sonido',
    unmuteAudio: 'Restaurar sonido',
    enableMic: 'Usar micrófono',
    disableMic: 'Sintetizador interno',
    volumeLabel: 'Nivel de volumen maestro',
    toggleTechOverlay: 'Alternar telemetría técnica (Tecla D)',
  },
  preloader: {
    statusCompiling: 'PRECOMPILANDO SHADERS GLSL Y ENTORNOS PROCEDURALES',
    statusAssembling: 'CALIBRANDO ANILLOS ARMILARES Y CAMPO GRAVITATORIO',
    statusReady: 'SISTEMA ÓPTICO EN LÍNEA',
    enterHint: 'ARRASTRÁ PARA ORBITAR · CLIC PARA ONDA DE CHOQUE · TECLA [D] TELEMETRÍA',
  },
  hud: {
    coordinatesLabel: 'VECTOR DE POZO GRAVITATORIO',
    shockwaveLabel: 'PULSO RADIAL',
    audioSpectrumLabel: 'ESPECTRO ACÚSTICO (FFT)',
    bandBass: 'GRAVES',
    bandMid: 'MEDIOS',
    bandTreble: 'AGUDOS',
    ringsCountLabel: 'ANILLOS ACTIVOS',
    particlesCountLabel: 'PARTÍCULAS GPU',
    activeQualityLabel: 'PERFIL GPU',
    reducedMotionBadge: 'MOVIMIENTO REDUCIDO ACTIVO',
    autoDegradedBadge: 'ESCALADO ADAPTATIVO ACTIVO',
    tabPausedBadge: 'SIMULACIÓN EN PAUSA (PESTAÑA OCULTA)',
  },
  modes: {
    exploration: {
      id: 'exploration' as InteractionModeId,
      label: 'Exploración',
      code: 'MOD-EXP',
      description: 'Control orbital libre e interacción gravitatoria directa con el cursor.',
    },
    exhibition: {
      id: 'exhibition' as InteractionModeId,
      label: 'Exhibición',
      code: 'MOD-EXH',
      description: 'Deriva orbital cinemática con composición curada de estudio.',
    },
  },
  variants: [
    {
      id: 'chrome',
      label: 'Cromo Líquido',
      shortCode: 'HG-80',
      formula: 'Hg·Cr [99.4%]',
      description: 'Aleación hiperreflectiva con tensión superficial elástica y borde cian.',
      indexOfRefraction: 'IOR 2.92',
    },
    {
      id: 'obsidian',
      label: 'Obsidiana Emisiva',
      shortCode: 'OB-14',
      formula: 'SiO₂·Fe₃O₄',
      description: 'Vidrio volcánico abisal con fracturas térmicas de magma ámbar.',
      indexOfRefraction: 'IOR 1.50',
    },
    {
      id: 'gold',
      label: 'Oro Bruñido',
      shortCode: 'AU-79',
      formula: 'Au·Cu [24K]',
      description: 'Conductividad solar cálida con micro-rugosidad anisotrópica.',
      indexOfRefraction: 'IOR 0.47',
    },
    {
      id: 'iridescent',
      label: 'Vidrio Iridiscente',
      shortCode: 'BI-83',
      formula: 'Bi₂O₃·SiO₂',
      description: 'Dieléctrico translúcido con dispersión espectral de película delgada.',
      indexOfRefraction: 'IOR 1.78',
    },
  ] satisfies MaterialVariantContent[],
  cameras: [
    {
      id: 'frontal',
      label: 'Frontal',
      code: 'CAM-01',
      focalLength: '38mm EQUIV',
    },
    {
      id: 'zenith',
      label: 'Cenital',
      code: 'CAM-02',
      focalLength: '28mm POLAR',
    },
    {
      id: 'detail',
      label: 'Detalle',
      code: 'CAM-03',
      focalLength: '85mm MACRO',
    },
  ] satisfies CameraPresetContent[],
  quality: {
    label: 'CALIDAD',
    tiers: {
      auto: 'Auto',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    } as Record<QualityTierId, string>,
  },
  audio: {
    sectionTitle: 'RESONANCIA ACÚSTICA',
    activateCta: 'Activar sonido',
    activeLabel: 'Drone Activo',
    mutedLabel: 'Silenciado',
    micActiveLabel: 'Micrófono en vivo',
    micDeniedNotice:
      'Permiso de micrófono denegado o no disponible. Se mantiene el sintetizador procedural interno.',
    blockedNotice:
      'El navegador requiere interacción directa para iniciar el motor Web Audio.',
  },
  techPanel: {
    title: 'TELEMETRÍA DE RENDERIZADO [D]',
    fps: 'FPS',
    frameTime: 'TIEMPO DE FRAME',
    drawCalls: 'DRAW CALLS',
    triangles: 'TRIÁNGULOS',
    geometries: 'GEOMETRÍAS',
    textures: 'TEXTURAS',
    qualityTier: 'NIVEL ACTUAL',
    dpr: 'DPR',
    particles: 'PARTÍCULAS',
    godRaysRes: 'RES. VOLUMÉTRICA',
    rendererMode: 'MOTOR GPU',
    softwareWarning: 'RENDER POR SOFTWARE DETECTADO (SWIFTSHADER / SIN GPU DEDICADA)',
  },
  fallbacks: {
    webglUnavailableTitle: 'MOTOR WEBGL NO DISPONIBLE EN ESTE DISPOSITIVO',
    webglUnavailableBody:
      'Tu navegador o hardware actual no pudo inicializar un contexto gráfico 3D acelerado. Se presenta la vista estática de referencia del instrumento PRUEBA FRONT COSMOS conservando todas las especificaciones técnicas.',
    contextLostTitle: 'CONTEXTO GRÁFICO INTERRUMPIDO',
    contextLostBody:
      'El controlador de GPU reinició la sesión WebGL. Esperando restauración automática o podés forzar la reconexión.',
    restoreCta: 'Reintentar contexto 3D',
    simulateContextLoss: 'Simular pérdida de contexto',
  },
} as const;
