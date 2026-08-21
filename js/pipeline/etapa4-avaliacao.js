/**
 * ═══════════════════════════════════════════════════════════════
 * ETAPA 4 — AVALIAÇÃO DA EXECUÇÃO
 * ═══════════════════════════════════════════════════════════════
 * O "juiz" do sistema. Recebe as medidas da ETAPA 3 e decide:
 *
 *   4.a  a repetição terminou? foi válida ou incompleta?
 *   4.b  há desvio postural (valgo, tronco, coluna, "roubo")?
 *
 * Esta etapa NÃO toca no DOM, não toca som e não fala. Ela devolve
 * um "descritor de resultado" e a ETAPA 5 é quem comunica isso ao
 * usuário. Essa separação é o que permite testar as regras de
 * avaliação isoladamente, sem navegador.
 *
 *   ENTRADA : medidas biomecânicas (ETAPA 3)
 *   SAÍDA   : descritor { repResult, status, sound, speech } e
 *             alerta de postura — consumidos pela ETAPA 5
 */

import { state } from '../core/state.js';
import { FORM_THRESHOLDS } from '../config/constants.js';

/* ---------------------------------------------------------------
   4.a — Máquina de estados da repetição
   ---------------------------------------------------------------
   Duas fases: 'up' (repouso) e 'down' (esforço). A repetição só é
   contabilizada na VOLTA ao repouso, e sua validade depende de ter
   passado pela faixa angular ideal durante o esforço.

        repouso ──(sai do ângulo `standing`)──▶ esforço
           ▲                                      │
           └──(volta ao `standing`) = conta a rep ─┘
   --------------------------------------------------------------- */

/** Tom agudo = repetição válida. Tom grave = amplitude insuficiente. */
const SOUND_VALID = { freq: 660, type: 'sine', duration: 0.12 };
const SOUND_INVALID = { freq: 220, type: 'triangle', duration: 0.25 };

/**
 * @param {number} angle ângulo principal em graus
 * @returns {{repResult:'good'|'bad'|null, status:{type:string,text:string}|null,
 *            sound:Object|null, speech:string|null}|null}
 *          null quando não há nada a avaliar (descanso do circuito)
 */
export function avaliarRepeticao(angle) {
  // Durante o descanso entre exercícios do circuito, o movimento do
  // atleta não deve contar repetições.
  if (state.inRestPeriod) return null;

  const exercise = state.currentExercise;

  // `direction: 'up'` cobre exercícios em que o ângulo AUMENTA
  // durante o esforço (elevação lateral: ~25° parado → ~90°).
  // O padrão cobre agachamento/flexão/rosca/afundo, que partem de um
  // ângulo alto (membro estendido) e DIMINUEM durante o esforço.
  const inverted = exercise.direction === 'up';
  const atRest = inverted ? angle < exercise.standing : angle > exercise.standing;

  if (atRest) return finalizarRepeticao(exercise);

  // --- Em esforço ---
  if (state.repPhase === 'up') {
    state.repPhase = 'down';
    state.phaseStartTime = performance.now();
  }
  state.reachedAnyDepth = true;

  const inGoodRange = angle >= exercise.goodMin && angle <= exercise.goodMax;
  const pastGoodRange = inverted ? angle > exercise.goodMax : angle < exercise.goodMin;

  if (inGoodRange) {
    state.reachedGoodDepth = true;
    return descritor(null, 'good', exercise.messages.good);
  }
  if (pastGoodRange) {
    return descritor(null, 'warn', exercise.messages.tooDeep);
  }
  return descritor(null, 'warn', exercise.messages.down);
}

/** Volta ao repouso: fecha a repetição em curso, se houver. */
function finalizarRepeticao(exercise) {
  const wasInEffort = state.repPhase === 'down';
  const goodRep = wasInEffort && state.reachedGoodDepth;
  const badRep = wasInEffort && !state.reachedGoodDepth && state.reachedAnyDepth;

  state.repPhase = 'up';
  state.reachedGoodDepth = false;
  state.reachedAnyDepth = false;

  if (goodRep) {
    return descritor('good', 'good', `${exercise.label} Completo! ✓`, SOUND_VALID, 'Repetição válida');
  }
  if (badRep) {
    return descritor('bad', 'bad', exercise.messages.shallow, SOUND_INVALID, 'Repita com mais amplitude');
  }
  return null; // já estava em repouso: nada a comunicar
}

function descritor(repResult, statusType, statusText, sound = null, speech = null) {
  return { repResult, status: { type: statusType, text: statusText }, sound, speech };
}

/* ---------------------------------------------------------------
   4.b — Detecção de desvio postural
   ---------------------------------------------------------------
   Cada exercício liga apenas as regras que fazem sentido para ele
   (ver as flags `check*` em config/exercises.js). A primeira regra
   violada vence — evita empilhar vários alertas na tela ao mesmo
   tempo, o que atrapalharia mais do que ajudaria.
   --------------------------------------------------------------- */

/**
 * @param {Array} landmarks
 * @param {number|null} secondaryAngle ângulo de apoio da ETAPA 3
 * @returns {string|null} mensagem de alerta, ou null se está tudo certo
 */
export function avaliarPostura(landmarks, secondaryAngle) {
  const exercise = state.currentExercise;

  // Valgo dinâmico: joelhos colapsando para dentro da linha dos
  // tornozelos — principal fator de risco no agachamento.
  if (exercise.checkValgus && detectouValgo(landmarks)) {
    return exercise.messages.valgus;
  }

  if (secondaryAngle == null) return null;

  if (exercise.checkPosture && secondaryAngle < FORM_THRESHOLDS.trunkLean) return exercise.messages.posture;
  if (exercise.checkSpine && secondaryAngle < FORM_THRESHOLDS.spineAlignment) return exercise.messages.spine;
  if (exercise.checkCheating && secondaryAngle < FORM_THRESHOLDS.shoulderCheating) return exercise.messages.cheating;

  return null;
}

function detectouValgo(landmarks) {
  const leftKnee = landmarks[25], rightKnee = landmarks[26];
  const leftAnkle = landmarks[27], rightAnkle = landmarks[28];
  if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return false;

  const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
  const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);

  // Tornozelos muito juntos na imagem = atleta de perfil; a medida
  // lateral perde sentido e a checagem é ignorada.
  if (ankleDistance <= FORM_THRESHOLDS.minAnkleDistance) return false;

  return kneeDistance < ankleDistance * FORM_THRESHOLDS.valgusRatio;
}
