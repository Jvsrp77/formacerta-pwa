/**
 * ═══════════════════════════════════════════════════════════════
 * ETAPA 3 — CÁLCULO BIOMECÂNICO
 * ═══════════════════════════════════════════════════════════════
 * Transforma coordenadas em grandezas cinesiológicas:
 *
 *   • ângulo articular principal (goniometria por 3 pontos)
 *   • ângulo secundário de apoio (tronco / coluna / ombro)
 *   • velocidade angular ω — o "VBT" (Velocity Based Training)
 *   • perda de velocidade em relação à 1ª repetição = fadiga
 *
 * Não desenha nada e não decide nada sobre a execução: apenas
 * mede. Quem julga é a ETAPA 4, quem exibe é a ETAPA 5.
 *
 *   ENTRADA : 33 landmarks (ETAPA 2)
 *   SAÍDA   : objeto de medidas, consumido pelas ETAPAS 4 e 5
 */

import { state } from '../core/state.js';
import { settings } from '../core/dom.js';
import { calculateAngle } from '../core/geometry.js';
import {
  VBT_SAMPLE_INTERVAL,
  VBT_REFERENCE_MIN_SPEED,
  SPARKLINE_POINTS
} from '../config/constants.js';

/**
 * @typedef {Object} MedidasBiomecanicas
 * @property {Object} pA,pB,pC     landmarks do ângulo principal
 * @property {number} angle        ângulo principal em graus (fracionário)
 * @property {number} roundedAngle ângulo arredondado (usado na exibição)
 * @property {{angle:number,name:string}|null} secondary ângulo de apoio
 * @property {boolean} vbtSampled  houve nova amostra de velocidade neste frame
 * @property {number} vbtSpeed     velocidade angular atual em °/s
 * @property {number|null} velocityLoss perda percentual vs. 1ª repetição
 */

/**
 * @param {Array} landmarks
 * @returns {MedidasBiomecanicas|null} null se os marcadores do
 *          exercício atual não estiverem visíveis no frame
 */
export function analisarBiomecanica(landmarks) {
  const exercise = state.currentExercise;

  const pA = landmarks[exercise.points.a];
  const pB = landmarks[exercise.points.b];
  const pC = landmarks[exercise.points.c];
  if (!pA || !pB || !pC) return null;

  const angle = calculateAngle(pA, pB, pC);
  const roundedAngle = Math.round(angle);

  const velocity = calcularVelocidadeAngular(roundedAngle);
  const secondary = calcularAnguloSecundario(landmarks);

  registrarNaTrajetoria(roundedAngle);

  return { pA, pB, pC, angle, roundedAngle, secondary, ...velocity };
}

/* ---------------------------------------------------------------
   3.a — Velocidade angular (VBT) e estimativa de fadiga
   ω = |θ(t) − θ(t−Δt)| / Δt
   --------------------------------------------------------------- */
function calcularVelocidadeAngular(roundedAngle) {
  const now = performance.now();
  const dt = (now - state.lastAngleTime) / 1000;

  // Amostras muito próximas amplificam ruído do rastreamento: só
  // medimos a partir de um intervalo mínimo.
  if (dt <= VBT_SAMPLE_INTERVAL) {
    return { vbtSampled: false, vbtSpeed: state.currentVbtSpeed, velocityLoss: null };
  }

  const deltaAngle = Math.abs(roundedAngle - state.lastAngleValue);
  state.currentVbtSpeed = Math.round(deltaAngle / dt);

  // A 1ª repetição válida define a velocidade de referência do
  // atleta naquela série — a queda em relação a ela indica fadiga.
  if (state.goodRepsCount === 1 && state.firstRepVbtSpeed === 0 && state.currentVbtSpeed > VBT_REFERENCE_MIN_SPEED) {
    state.firstRepVbtSpeed = state.currentVbtSpeed;
  }

  let velocityLoss = null;
  if (state.firstRepVbtSpeed > 0 && state.currentVbtSpeed > 0) {
    velocityLoss = Math.max(
      0,
      Math.round(((state.firstRepVbtSpeed - state.currentVbtSpeed) / state.firstRepVbtSpeed) * 100)
    );
  }

  state.lastAngleTime = now;
  state.lastAngleValue = roundedAngle;

  return { vbtSampled: true, vbtSpeed: state.currentVbtSpeed, velocityLoss };
}

/* ---------------------------------------------------------------
   3.b — Ângulo secundário (tronco, coluna, ombro)
   Base para a checagem de desvio postural da ETAPA 4.
   --------------------------------------------------------------- */
function calcularAnguloSecundario(landmarks) {
  const exercise = state.currentExercise;
  if (!exercise.secondary || !settings.multiAngleToggle.checked) return null;

  const sA = landmarks[exercise.secondary.a];
  const sB = landmarks[exercise.secondary.b];
  const sC = landmarks[exercise.secondary.c];
  if (!sA || !sB || !sC) return null;

  return { angle: calculateAngle(sA, sB, sC), name: exercise.secondary.name };
}

/* ---------------------------------------------------------------
   3.c — Janela deslizante da trajetória angular (gráfico)
   --------------------------------------------------------------- */
function registrarNaTrajetoria(roundedAngle) {
  state.sparklineData.push(roundedAngle);
  if (state.sparklineData.length > SPARKLINE_POINTS) state.sparklineData.shift();
}
