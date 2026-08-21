/**
 * CONSTANTES GLOBAIS
 * ---------------------------------------------------------------
 * Endereços do modelo de IA, chaves de armazenamento e limiares
 * que valem para o sistema inteiro (não para um exercício
 * específico — esses ficam em config/exercises.js).
 */

/* ---------- MediaPipe / modelo de IA ---------- */
export const MEDIAPIPE_VERSION = '0.10.14';
export const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/* ---------- Persistência ---------- */
export const STORAGE_KEY = 'formacerta_sessions_db_v4';
export const MAX_STORED_SESSIONS = 50;

/* ---------- Limiares da análise ---------- */
/** Intervalo mínimo entre amostras de velocidade angular (s). Evita ruído de VBT. */
export const VBT_SAMPLE_INTERVAL = 0.05;
/** Velocidade mínima (°/s) para uma amostra virar referência de fadiga. */
export const VBT_REFERENCE_MIN_SPEED = 30;
/** Quantos pontos o gráfico de trajetória angular mantém em memória. */
export const SPARKLINE_POINTS = 60;

/** Limiares de detecção de desvio postural (em graus, salvo indicado). */
export const FORM_THRESHOLDS = {
  /** Joelhos mais próximos que este fator da distância dos tornozelos = valgo. */
  valgusRatio: 0.55,
  /** Distância mínima entre tornozelos para a checagem de valgo ser confiável. */
  minAnkleDistance: 0.02,
  /** Abaixo destes ângulos secundários, dispara o alerta correspondente. */
  trunkLean: 145,
  spineAlignment: 160,
  shoulderCheating: 150
};

/** Margem acima de goodMin em que o músculo é considerado em pico de esforço. */
export const MUSCLE_PEAK_MARGIN = 15;

/* ---------- Renderização ---------- */
export const HUD_COLORS = {
  primary: '#c8ff4d',
  pivot: '#00f2fe',
  outline: '#07090c',
  panel: 'rgba(7, 9, 12, 0.85)'
};

/** Ossos desenhados no visualizador 3D (pares de índices de landmark). */
export const SKELETON_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28]
];
