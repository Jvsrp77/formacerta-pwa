/**
 * RENDER — MAPA DE SOLICITAÇÃO MUSCULAR
 * Acende os músculos declarados no exercício quando o ângulo atual
 * indica pico de esforço (perto do fundo da amplitude ideal).
 */

import { visualizer } from '../core/dom.js';
import { state } from '../core/state.js';
import { MUSCLE_PEAK_MARGIN } from '../config/constants.js';

const badges = visualizer.muscleBadgesGroup.querySelectorAll('.muscle-badge');

export function updateMuscleHeatmap(angle) {
  const exercise = state.currentExercise;
  const isPeakEffort = angle <= exercise.goodMin + MUSCLE_PEAK_MARGIN;

  badges.forEach(badge => {
    const muscle = badge.dataset.muscle;
    const isRecruited = Boolean(exercise.muscles?.includes(muscle)) && isPeakEffort;
    badge.classList.toggle('active', isRecruited);
  });
}
