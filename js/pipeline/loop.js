/**
 * ═══════════════════════════════════════════════════════════════
 * LAÇO DE ANÁLISE — ORQUESTRAÇÃO DAS ETAPAS
 * ═══════════════════════════════════════════════════════════════
 * Este é o arquivo para ler primeiro: ele mostra, em uma tela, o
 * caminho completo que um frame percorre dentro do sistema.
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  ETAPA 1  câmera/vídeo ──▶ frame                        │
 *   │  ETAPA 2  frame        ──▶ 33 landmarks (BlazePose)     │
 *   │  ETAPA 3  landmarks    ──▶ ângulos, VBT, fadiga         │
 *   │  ETAPA 4  medidas      ──▶ veredito da rep + postura    │
 *   │  ETAPA 5  veredito     ──▶ HUD, som e voz               │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Roda uma vez por quadro, sincronizado com o refresh da tela via
 * requestAnimationFrame.
 */

import { stage } from '../core/dom.js';
import { state } from '../core/state.js';
import { detectPose } from './etapa2-deteccao-pose.js';
import { analisarBiomecanica } from './etapa3-biomecanica.js';
import { avaliarRepeticao, avaliarPostura } from './etapa4-avaliacao.js';
import { exibirMedidas, exibirSemPessoa, comunicarAvaliacao, comunicarPostura } from './etapa5-feedback.js';
import { clearOverlay, drawVideoFrame, syncOverlaySize } from '../render/hud-overlay.js';

/** Dispara o laço. Ele se encerra sozinho quando `state.isRunning` cai. */
export function startAnalysisLoop() {
  requestAnimationFrame(processFrame);
}

function processFrame() {
  if (!state.isRunning) return;

  atualizarFps();

  // readyState >= 2 (HAVE_CURRENT_DATA): já existe um frame decodificado.
  if (stage.video.readyState >= 2) {
    syncOverlaySize();
    analisarFrame();
  }

  requestAnimationFrame(processFrame);
}

function analisarFrame() {
  // ETAPA 2 — visão computacional
  const landmarks = detectPose(stage.video, performance.now());

  clearOverlay();
  // Só copiamos o vídeo para dentro do canvas quando há gravação:
  // é assim que o clipe exportado sai com o HUD embutido.
  if (state.isRecordingVideo) drawVideoFrame();

  if (!landmarks) {
    exibirSemPessoa();
    return;
  }

  // ETAPA 3 — medir
  const medidas = analisarBiomecanica(landmarks);
  if (!medidas) return; // marcadores do exercício fora do enquadramento

  // ETAPA 5.a — mostrar as medidas
  exibirMedidas(medidas, landmarks);

  // ETAPA 4.b + 5.c — postura
  const alertaPostura = avaliarPostura(landmarks, medidas.secondary ? medidas.secondary.angle : null);
  comunicarPostura(alertaPostura);

  // ETAPA 4.a + 5.b — repetições
  comunicarAvaliacao(avaliarRepeticao(medidas.angle));
}

/** Contador de FPS mostrado no HUD (indicador de desempenho do TCC). */
function atualizarFps() {
  const now = performance.now();
  state.frameCount++;

  if (now - state.lastFrameTime >= 1000) {
    state.currentFps = Math.round((state.frameCount * 1000) / (now - state.lastFrameTime));
    stage.fpsValue.textContent = state.currentFps;
    state.frameCount = 0;
    state.lastFrameTime = now;
  }
}
