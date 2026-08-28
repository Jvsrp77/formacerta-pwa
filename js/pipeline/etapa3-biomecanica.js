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

  const rightPts = exercise.rightPoints || exercise.points;
  const leftPts = exercise.leftPoints;

  const rightA = rightPts && landmarks[rightPts.a];
  const rightB = rightPts && landmarks[rightPts.b];
  const rightC = rightPts && landmarks[rightPts.c];
  const hasRight = Boolean(rightA && rightB && rightC);

  const leftA = leftPts && landmarks[leftPts.a];
  const leftB = leftPts && landmarks[leftPts.b];
  const leftC = leftPts && landmarks[leftPts.c];
  const hasLeft = Boolean(leftA && leftB && leftC);

  if (!hasRight && !hasLeft) return null;

  let chosenSide = 'right';

  if (hasRight && !hasLeft) {
    chosenSide = 'right';
  } else if (!hasRight && hasLeft) {
    chosenSide = 'left';
  } else {
    const angleRight = calculateAngle(rightA, rightB, rightC);
    const angleLeft = calculateAngle(leftA, leftB, leftC);

    const standing = exercise.standing || 150;
    const inverted = exercise.direction === 'up';

    const devRight = inverted ? Math.max(0, angleRight - standing) : Math.max(0, standing - angleRight);
    const devLeft = inverted ? Math.max(0, angleLeft - standing) : Math.max(0, standing - angleLeft);

    // Se já iniciou o esforço de uma repetição, trava no mesmo lado até concluir a rep
    if (state.repPhase === 'down' && state.activeSide) {
      chosenSide = state.activeSide === 'left' ? 'left' : 'right';
    } else if (Math.abs(devRight - devLeft) > 10) {
      // Prioriza o lado que está realizando movimento ativo
      chosenSide = devRight > devLeft ? 'right' : 'left';
    } else {
      // Quando ambos em repouso/simétricos, seleciona o lado mais voltado/próximo da câmera (menor Z)
      const zRight = ((rightA.z || 0) + (rightB.z || 0) + (rightC.z || 0)) / 3;
      const zLeft = ((leftA.z || 0) + (leftB.z || 0) + (leftC.z || 0)) / 3;
      chosenSide = zRight <= zLeft ? 'right' : 'left';
    }
  }

  state.activeSide = chosenSide;

  const pA = chosenSide === 'left' ? leftA : rightA;
  const pB = chosenSide === 'left' ? leftB : rightB;
  const pC = chosenSide === 'left' ? leftC : rightC;

  const angle = calculateAngle(pA, pB, pC);
  const roundedAngle = Math.round(angle);

  const velocity = calcularVelocidadeAngular(roundedAngle);
  const secondary = calcularAnguloSecundario(landmarks, chosenSide);

  registrarNaTrajetoria(roundedAngle);

  return { pA, pB, pC, angle, roundedAngle, secondary, side: chosenSide, ...velocity };
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
function calcularAnguloSecundario(landmarks, chosenSide = 'right') {
  const exercise = state.currentExercise;
  if (!settings.multiAngleToggle.checked) return null;

  const sec = chosenSide === 'left'
    ? (exercise.leftSecondary || exercise.secondary)
    : (exercise.rightSecondary || exercise.secondary);

  if (!sec) return null;

  const sA = landmarks[sec.a];
  const sB = landmarks[sec.b];
  const sC = landmarks[sec.c];
  if (!sA || !sB || !sC) return null;

  return { angle: calculateAngle(sA, sB, sC), name: sec.name };
}

/* ---------------------------------------------------------------
   3.c — Janela deslizante da trajetória angular (gráfico)
   --------------------------------------------------------------- */
function registrarNaTrajetoria(roundedAngle) {
  state.sparklineData.push(roundedAngle);
  if (state.sparklineData.length > SPARKLINE_POINTS) state.sparklineData.shift();
}
