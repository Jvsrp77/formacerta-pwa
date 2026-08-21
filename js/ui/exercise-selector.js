/**
 * UI — SELEÇÃO DE EXERCÍCIO
 * ---------------------------------------------------------------
 * Troca o exercício ativo e propaga a mudança para toda a
 * interface: rótulos, dica de posicionamento, plano anatômico,
 * limiares de calibração e contadores.
 *
 * É o ponto único de troca — o seletor da tela, os comandos de voz
 * e o Modo Circuito passam todos por `selectExercise()`.
 */

import { controls, metrics, stage, settings } from '../core/dom.js';
import { state } from '../core/state.js';
import { EXERCISES } from '../config/exercises.js';
import { resetCounters } from '../pipeline/etapa1-captura.js';

/** Atualiza a etiqueta "Alvo: X° - Y°" acima do gráfico. */
export function updateTargetRangeTag() {
  const ex = state.currentExercise;
  metrics.targetRange.textContent = `Alvo: ${ex.goodMin}° - ${ex.goodMax}°`;
}

function applyExercise(key) {
  const exercise = EXERCISES[key];
  if (!exercise) return;

  state.currentExerciseKey = key;
  state.currentExercise = exercise;

  metrics.angleLabel.textContent = exercise.angleLabel;
  metrics.plane.textContent = exercise.plane;
  stage.instructionHint.textContent = exercise.instruction;

  // Os campos de calibração passam a refletir os limiares deste
  // exercício (o usuário pode ajustá-los na aba Configurações).
  settings.goodMin.value = exercise.goodMin;
  settings.goodMax.value = exercise.goodMax;
  updateTargetRangeTag();

  resetCounters();
}

/** Troca o exercício ativo, mantendo o <select> em sincronia. */
export function selectExercise(key) {
  controls.exerciseSelect.value = key;
  applyExercise(key);
}

export function initExerciseSelector() {
  controls.exerciseSelect.addEventListener('change', () => {
    applyExercise(controls.exerciseSelect.value);
  });

  // Aplica o exercício inicial marcado no HTML.
  applyExercise(controls.exerciseSelect.value);
}
