/**
 * ESTADO DA APLICAÇÃO
 * ---------------------------------------------------------------
 * Uma única fonte de verdade mutável, compartilhada entre as
 * etapas do pipeline. Está agrupada por assunto para deixar claro
 * quem é dono de qual pedaço do estado.
 *
 * Regra: módulos LEEM livremente, mas cada campo é ESCRITO por um
 * dono só (indicado nos comentários). Isso evita que duas etapas
 * disputem o mesmo valor.
 */

import { EXERCISES } from '../config/exercises.js';

export const state = {
  /* --- Sessão (dono: pipeline/etapa1-captura.js) --- */
  isRunning: false,
  isVideoFileMode: false,

  /* --- Exercício ativo (dono: ui/exercise-selector.js / pipeline/etapa3-biomecanica.js) --- */
  currentExerciseKey: 'squat',
  currentExercise: EXERCISES.squat,
  activeSide: 'right', // 'right' | 'left' (lado ativo sob análise)

  /* --- Máquina de estados da repetição (dono: pipeline/etapa4-repeticoes.js) --- */
  repPhase: 'up',          // 'up' = em repouso | 'down' = em esforço
  reachedGoodDepth: false, // atingiu a faixa ideal nesta repetição
  reachedAnyDepth: false,  // saiu do repouso, mas sem atingir a faixa ideal
  goodRepsCount: 0,
  badRepsCount: 0,
  phaseStartTime: performance.now(),

  /* --- Velocidade angular / VBT (dono: pipeline/etapa3-biomecanica.js) --- */
  lastAngleTime: performance.now(),
  lastAngleValue: 0,
  currentVbtSpeed: 0,
  firstRepVbtSpeed: 0,
  sparklineData: [],

  /* --- Desempenho do laço de análise (dono: pipeline/loop.js) --- */
  lastFrameTime: performance.now(),
  frameCount: 0,
  currentFps: 0,

  /* --- Modo Circuito (dono: features/circuit.js) --- */
  circuitModeActive: false, // "Modo Circuito" escolhido no montador (antes de iniciar)
  circuitMode: false,       // circuito realmente em execução
  circuitSteps: [],
  circuitIndex: 0,
  circuitResults: [],
  inRestPeriod: false,
  restTimeLeft: 0,
  restTimerHandle: null,
  skipAutoSaveOnStop: false,

  /* --- Gravação de vídeo (dono: features/recorder.js) --- */
  isRecordingVideo: false,

  /* --- Feedback por voz (dono: feedback/speech.js) --- */
  lastVoiceSpeech: ''
};

/**
 * Zera tudo que é específico de uma série de repetições.
 * Chamado ao trocar de exercício, ao iniciar uma sessão e a cada
 * transição do circuito.
 */
export function resetSeriesState() {
  state.goodRepsCount = 0;
  state.badRepsCount = 0;
  state.repPhase = 'up';
  state.reachedGoodDepth = false;
  state.reachedAnyDepth = false;
  state.sparklineData = [];
  state.firstRepVbtSpeed = 0;
  state.currentVbtSpeed = 0;
  state.activeSide = 'right';
  state.lastVoiceSpeech = '';
}
