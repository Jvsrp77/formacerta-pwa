/**
 * FUNCIONALIDADE — LAUDO CINESIOLÓGICO
 * ---------------------------------------------------------------
 * Modal com o resumo da última sessão, formatado para impressão em
 * PDF (ver a regra @media print em css/06-responsive.css, que
 * esconde tudo menos o cartão do laudo).
 */

import { laudo, analytics } from '../core/dom.js';
import { state } from '../core/state.js';
import { loadHistoryFromStorage } from './history.js';

function openLaudoModal() {
  const history = loadHistoryFromStorage();

  // Sem histórico, o laudo usa a sessão em andamento.
  const latest = history[0] || {
    exercise: state.currentExercise.label,
    good: state.goodRepsCount,
    bad: state.badRepsCount,
    accuracy: 100,
    vbtSpeed: state.currentVbtSpeed
  };

  laudo.exerciseName.textContent = latest.exercise;
  laudo.score.textContent = latest.accuracy + '%';
  laudo.reps.textContent = `${latest.good} Válidas / ${latest.bad} Incorretas`;
  laudo.vbt.textContent = (latest.vbtSpeed || 0) + ' °/s';

  laudo.modal.classList.add('active');
}

function closeLaudoModal() {
  laudo.modal.classList.remove('active');
}

export function initReport() {
  analytics.generateLaudoBtn.addEventListener('click', openLaudoModal);
  laudo.closeBtn.addEventListener('click', closeLaudoModal);
  laudo.printBtn.addEventListener('click', () => window.print());
}
