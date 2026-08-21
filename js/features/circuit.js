/**
 * FUNCIONALIDADE — MODO CIRCUITO
 * ---------------------------------------------------------------
 * Encadeia vários exercícios em sequência, cada um com meta de
 * repetições, descanso cronometrado e troca automática.
 *
 * Ciclo de vida:
 *   montar (builder) → iniciar → [exercício → meta batida →
 *   descanso → próximo exercício] → consolidar e salvar
 */

import { circuit as dom, controls, settings } from '../core/dom.js';
import { state } from '../core/state.js';
import { EXERCISES } from '../config/exercises.js';
import { STORAGE_KEY, MAX_STORED_SESSIONS } from '../config/constants.js';
import { showToast } from '../feedback/toast.js';
import { playSoundTone } from '../feedback/audio.js';
import { speak } from '../feedback/speech.js';
import { loadHistoryFromStorage } from './history.js';
import { selectExercise } from '../ui/exercise-selector.js';
import { stopSession } from '../pipeline/etapa1-captura.js';

const restSeconds = () => Math.max(0, parseInt(settings.restSeconds.value, 10) || 0);

/* ═══════════════════════════════════════════════════════════════
   1. MONTADOR DO CIRCUITO
   ═══════════════════════════════════════════════════════════════ */

export function addCircuitStepRow(exerciseKey, reps) {
  const options = Object.entries(EXERCISES)
    .map(([key, ex]) => `<option value="${key}"${key === exerciseKey ? ' selected' : ''}>${ex.label}</option>`)
    .join('');

  const row = document.createElement('div');
  row.className = 'circuit-step-row';
  row.innerHTML = `
    <span class="circuit-step-num"></span>
    <select class="circuit-step-exercise">${options}</select>
    <div class="circuit-step-reps-wrap"><span>reps</span><input type="number" class="circuit-step-reps" min="1" max="50" value="${reps}"></div>
    <button type="button" class="circuit-step-remove" title="Remover">✕</button>
  `;

  row.querySelector('.circuit-step-remove').addEventListener('click', () => {
    row.remove();
    renumberCircuitSteps();
  });

  dom.stepsList.appendChild(row);
  renumberCircuitSteps();
}

function renumberCircuitSteps() {
  const rows = dom.stepsList.querySelectorAll('.circuit-step-row');
  rows.forEach((row, i) => { row.querySelector('.circuit-step-num').textContent = (i + 1) + '.'; });
  dom.stepsCount.textContent = rows.length + (rows.length === 1 ? ' exercício' : ' exercícios');
}

function buildCircuitStepsFromUI() {
  return Array.from(dom.stepsList.querySelectorAll('.circuit-step-row')).map(row => ({
    exercise: row.querySelector('.circuit-step-exercise').value,
    reps: Math.max(1, parseInt(row.querySelector('.circuit-step-reps').value, 10) || 10)
  }));
}

/**
 * Chamado pela ETAPA 1 antes de ligar a câmera.
 * @returns {boolean} false se o circuito está vazio (aborta o início)
 */
export function prepareCircuitFromBuilder() {
  const steps = buildCircuitStepsFromUI();
  if (steps.length === 0) {
    showToast('Adicione pelo menos um exercício ao circuito.', '⚠️');
    return false;
  }

  state.circuitSteps = steps;
  state.circuitIndex = 0;
  state.circuitResults = [];
  state.circuitMode = true;

  selectExercise(steps[0].exercise);
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   2. PROGRESSO DURANTE A EXECUÇÃO
   ═══════════════════════════════════════════════════════════════ */

export function showCircuitProgress() {
  dom.builderCard.style.display = 'none';
  dom.progressPanel.style.display = 'block';
  renderCircuitProgress();
}

export function renderCircuitProgress() {
  const finished = state.circuitIndex >= state.circuitSteps.length;

  dom.stepCounter.textContent = finished
    ? 'Circuito completo! 🏆'
    : `Exercício ${state.circuitIndex + 1} de ${state.circuitSteps.length}`;
  dom.skipExerciseBtn.style.display = finished ? 'none' : 'inline-flex';

  dom.progressList.innerHTML = state.circuitSteps.map((step, i) => {
    const done = i < state.circuitIndex;
    const active = i === state.circuitIndex;
    const cssState = done ? 'done' : (active ? 'active' : '');

    let count = 0;
    if (done) count = state.circuitResults[i] ? state.circuitResults[i].good : step.reps;
    else if (active) count = state.goodRepsCount;

    return `<div class="circuit-progress-item ${cssState}">
      <span>${done ? '✓ ' : ''}${EXERCISES[step.exercise].label}</span>
      <span class="badge">${count}/${step.reps}</span>
    </div>`;
  }).join('');
}

/** Devolve o montador quando a sessão é interrompida no meio. */
export function restoreBuilderAfterStop() {
  const finishedSuccessfully = state.circuitMode && state.circuitIndex >= state.circuitSteps.length;
  if (finishedSuccessfully) return; // deixa o checklist completo visível

  dom.progressPanel.style.display = 'none';
  if (state.circuitModeActive) dom.builderCard.style.display = 'block';
}

/* ═══════════════════════════════════════════════════════════════
   3. DESCANSO ENTRE EXERCÍCIOS
   ═══════════════════════════════════════════════════════════════ */

function startRestPeriod(nextStep) {
  const seconds = restSeconds();
  if (seconds <= 0) { endRestPeriod(); return; }

  state.inRestPeriod = true;
  state.restTimeLeft = seconds;

  dom.restNextName.textContent = EXERCISES[nextStep.exercise].label;
  dom.restCountdown.textContent = state.restTimeLeft;
  dom.restOverlay.style.display = 'flex';

  clearInterval(state.restTimerHandle);
  state.restTimerHandle = setInterval(() => {
    state.restTimeLeft--;
    dom.restCountdown.textContent = Math.max(0, state.restTimeLeft);
    // Bipe nos 3 últimos segundos: prepara o atleta para retomar.
    if (state.restTimeLeft > 0 && state.restTimeLeft <= 3) playSoundTone(500, 'sine', 0.08);
    if (state.restTimeLeft <= 0) endRestPeriod();
  }, 1000);
}

export function endRestPeriod() {
  clearInterval(state.restTimerHandle);
  state.restTimerHandle = null;
  state.inRestPeriod = false;
  dom.restOverlay.style.display = 'none';

  const step = state.circuitSteps[state.circuitIndex];
  if (!step) return;

  // Trocar de exercício zera os contadores da série — é o que faz a
  // meta do próximo exercício começar do zero.
  selectExercise(step.exercise);
  renderCircuitProgress();
  playSoundTone(660, 'sine', 0.15);
  speak('Pode começar');
}

/** Desliga o descanso sem avançar nada (usado ao encerrar a sessão). */
export function cancelRestPeriod() {
  if (state.restTimerHandle) {
    clearInterval(state.restTimerHandle);
    state.restTimerHandle = null;
  }
  state.inRestPeriod = false;
  dom.restOverlay.style.display = 'none';
}

/* ═══════════════════════════════════════════════════════════════
   4. AVANÇO E CONCLUSÃO
   ═══════════════════════════════════════════════════════════════ */

export function advanceCircuit() {
  const step = state.circuitSteps[state.circuitIndex];
  if (!step) return;

  state.circuitResults[state.circuitIndex] = {
    exercise: step.exercise,
    label: EXERCISES[step.exercise].label,
    good: state.goodRepsCount,
    bad: state.badRepsCount,
    target: step.reps
  };
  state.circuitIndex++;

  if (state.circuitIndex >= state.circuitSteps.length) {
    finishCircuit();
    return;
  }

  const nextStep = state.circuitSteps[state.circuitIndex];
  showToast(`✅ ${EXERCISES[step.exercise].label} concluído!`, '🎉');
  speak(`Muito bem! Descanse. Próximo: ${EXERCISES[nextStep.exercise].label}`);
  renderCircuitProgress();
  startRestPeriod(nextStep);
}

function finishCircuit() {
  renderCircuitProgress();
  showToast('🏆 Circuito completo!', '🏆');
  speak('Parabéns! Você completou o circuito.');
  saveCircuitSessionToDatabase(state.circuitResults);

  // O consolidado do circuito já foi gravado acima: a flag impede
  // que stopSession() grave uma segunda linha no histórico.
  state.skipAutoSaveOnStop = true;
  stopSession();
  state.skipAutoSaveOnStop = false;
}

function saveCircuitSessionToDatabase(results) {
  const totalGood = results.reduce((sum, r) => sum + r.good, 0);
  const totalBad = results.reduce((sum, r) => sum + r.bad, 0);

  const history = loadHistoryFromStorage();
  history.unshift({
    id: Date.now(),
    date: new Date().toLocaleString('pt-BR'),
    type: 'circuit',
    exercise: `Circuito (${results.length} exercícios)`,
    steps: results,
    good: totalGood,
    bad: totalBad,
    vbtSpeed: state.currentVbtSpeed,
    accuracy: Math.round((totalGood / (totalGood + totalBad)) * 100) || 0
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_STORED_SESSIONS)));
}

/* ═══════════════════════════════════════════════════════════════
   5. LIGAÇÃO COM A INTERFACE
   ═══════════════════════════════════════════════════════════════ */

export function initCircuit() {
  dom.addStepBtn.addEventListener('click', () => addCircuitStepRow('squat', 10));

  dom.skipExerciseBtn.addEventListener('click', () => {
    if (state.inRestPeriod) endRestPeriod(); else advanceCircuit();
  });
  dom.skipRestBtn.addEventListener('click', endRestPeriod);

  // Alternância "Exercício Único" / "Modo Circuito"
  dom.builderCard.style.display = 'none';
  controls.modeTabs.querySelectorAll('.mode-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      controls.modeTabs.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      state.circuitModeActive = btn.dataset.mode === 'circuit';
      controls.singleModeGroup.style.display = state.circuitModeActive ? 'none' : 'flex';
      dom.builderCard.style.display = state.circuitModeActive ? 'block' : 'none';
    });
  });

  // Circuito de exemplo pré-carregado
  addCircuitStepRow('squat', 10);
  addCircuitStepRow('pushup', 10);
  addCircuitStepRow('lunge', 10);
}
