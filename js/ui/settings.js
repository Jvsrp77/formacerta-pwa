/**
 * UI — CALIBRAÇÃO GONIOMÉTRICA
 * ---------------------------------------------------------------
 * Permite ajustar a faixa angular considerada correta para o
 * exercício ativo — necessário para praticantes com restrição de
 * mobilidade, em que a amplitude "de livro" não se aplica.
 *
 * Observação: o ajuste altera o exercício em memória e vale até
 * recarregar a página (não é persistido).
 */

import { settings } from '../core/dom.js';
import { state } from '../core/state.js';
import { updateTargetRangeTag } from './exercise-selector.js';

export function initSettings() {
  settings.goodMin.addEventListener('input', () => {
    state.currentExercise.goodMin = parseFloat(settings.goodMin.value) || 70;
    updateTargetRangeTag();
  });

  settings.goodMax.addEventListener('input', () => {
    state.currentExercise.goodMax = parseFloat(settings.goodMax.value) || 100;
    updateTargetRangeTag();
  });
}
