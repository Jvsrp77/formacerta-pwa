/**
 * ═══════════════════════════════════════════════════════════════
 * ETAPA 5 — FEEDBACK MULTIMODAL
 * ═══════════════════════════════════════════════════════════════
 * A saída do sistema para o usuário. Pega o que a ETAPA 3 mediu e
 * o que a ETAPA 4 julgou, e comunica por três canais simultâneos:
 *
 *   VISUAL  → HUD sobre o vídeo, painel de métricas, gráfico,
 *             visualizador 3D e mapa muscular
 *   SONORO  → bipe agudo (acerto) / grave (amplitude insuficiente)
 *   VOZ     → narração em PT-BR das repetições e correções
 *
 * É a única etapa que escreve no DOM durante a análise.
 *
 *   ENTRADA : medidas (ETAPA 3) + descritor de avaliação (ETAPA 4)
 *   SAÍDA   : tela, som e voz
 */

import { metrics } from '../core/dom.js';
import { state } from '../core/state.js';
import { setStatusBanner, setFormAlert } from '../feedback/status-panel.js';
import { playSoundTone } from '../feedback/audio.js';
import { speak } from '../feedback/speech.js';
import { drawSkeletonSegment, drawAngleBadge } from '../render/hud-overlay.js';
import { render3DSkeleton } from '../render/skeleton-3d.js';
import { drawSparkline } from '../render/sparkline.js';
import { updateMuscleHeatmap } from '../render/muscle-map.js';
import { renderCircuitProgress, advanceCircuit } from '../features/circuit.js';

/* ---------------------------------------------------------------
   5.a — Exibir as medidas do frame (números + desenhos)
   --------------------------------------------------------------- */
export function exibirMedidas(medidas, landmarks) {
  metrics.currentAngle.textContent = medidas.roundedAngle + '°';

  if (medidas.vbtSampled) {
    metrics.vbt.textContent = medidas.vbtSpeed + ' °/s';
    if (medidas.velocityLoss !== null) metrics.fatigue.textContent = medidas.velocityLoss + '%';
  }

  exibirAnguloSecundario(medidas.secondary);

  drawSparkline();
  drawSkeletonSegment(medidas.pA, medidas.pB, medidas.pC);
  drawAngleBadge(medidas.pB, medidas.roundedAngle);
  render3DSkeleton(landmarks);
  updateMuscleHeatmap(medidas.roundedAngle);
}

function exibirAnguloSecundario(secondary) {
  if (!secondary) {
    metrics.secondaryRow.style.display = 'none';
    return;
  }
  metrics.secondaryRow.style.display = 'grid';
  metrics.secondaryLabel.textContent = 'Ângulo Secundário — ' + secondary.name;
  metrics.secondaryValue.textContent = Math.round(secondary.angle) + '°';
}

/** Estado "não há ninguém no enquadramento". */
export function exibirSemPessoa() {
  setStatusBanner('idle', 'Nenhuma pessoa identificada.');
  metrics.currentAngle.textContent = '—';
}

/* ---------------------------------------------------------------
   5.b — Comunicar o veredito da repetição
   --------------------------------------------------------------- */
export function comunicarAvaliacao(descritor) {
  if (!descritor) return;

  if (descritor.repResult === 'good') {
    state.goodRepsCount++;
    metrics.goodReps.textContent = state.goodRepsCount;
  } else if (descritor.repResult === 'bad') {
    state.badRepsCount++;
    metrics.badReps.textContent = state.badRepsCount;
  }

  if (descritor.status) setStatusBanner(descritor.status.type, descritor.status.text);
  if (descritor.sound) playSoundTone(descritor.sound.freq, descritor.sound.type, descritor.sound.duration);
  if (descritor.speech) speak(descritor.speech);

  // No Modo Circuito, uma repetição válida pode significar meta
  // batida — e aí o circuito avança para o próximo exercício.
  if (descritor.repResult === 'good' && state.circuitMode) {
    renderCircuitProgress();
    const step = state.circuitSteps[state.circuitIndex];
    const target = step ? step.reps : Infinity;
    if (state.goodRepsCount >= target) advanceCircuit();
  }
}

/* ---------------------------------------------------------------
   5.c — Comunicar desvio postural
   --------------------------------------------------------------- */
export function comunicarPostura(alerta) {
  setFormAlert(alerta);

  // O `replace` remove o emoji e o espaço do início da mensagem —
  // o sintetizador de voz não deve tentar pronunciá-los.
  if (alerta) speak(alerta.replace(/^[^\wÀ-ſ]+/, ''));
}
