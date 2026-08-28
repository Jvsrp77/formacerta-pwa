/**
 * ═══════════════════════════════════════════════════════════════
 * ETAPA 1 — CAPTURA DE IMAGEM
 * ═══════════════════════════════════════════════════════════════
 * Origem dos dados do sistema. Coloca frames dentro do elemento
 * <video>, seja a partir da webcam (getUserMedia) ou de um arquivo
 * MP4/WebM carregado pelo usuário para teste.
 *
 * Também é a etapa dona do ciclo de vida da sessão: quem liga e
 * desliga tudo (iniciar → laço de análise → encerrar → salvar).
 *
 *   ENTRADA : câmera do dispositivo ou arquivo de vídeo
 *   SAÍDA   : frames em <video>, consumidos pela ETAPA 2
 */

import { stage, controls, videoFile, metrics, settings } from '../core/dom.js';
import { state, resetSeriesState } from '../core/state.js';
import { initPoseDetector } from './etapa2-deteccao-pose.js';
import { startAnalysisLoop } from './loop.js';
import { setStatusBanner, setFormAlert } from '../feedback/status-panel.js';
import { showToast } from '../feedback/toast.js';
import { stopRecordingVideo } from '../features/recorder.js';
import { startVoiceCommands } from '../features/voice-commands.js';
import { saveSessionToDatabase } from '../features/history.js';
import {
  prepareCircuitFromBuilder,
  showCircuitProgress,
  cancelRestPeriod,
  restoreBuilderAfterStop
} from '../features/circuit.js';

/* ---------------------------------------------------------------
   Espelhamento — fonte única de verdade pras classes .flipped /
   .unflipped no <video>. O canvas do esqueleto NÃO é espelhado via
   CSS (css/04-analyzer.css força transform:none nele) — em vez
   disso, js/render/hud-overlay.js espelha as coordenadas dos
   pontos ao desenhar (via isVideoFlipped(), que lê essas mesmas
   classes), o que mantém o texto do HUD (ângulo em graus) legível
   em vez de espelhado. Por isso só o vídeo é alterado aqui.
   --------------------------------------------------------------- */
function setMirrored(isMirrored) {
  stage.video.classList.toggle('flipped', isMirrored);
  stage.video.classList.toggle('unflipped', !isMirrored);
}

/* ---------------------------------------------------------------
   1.a — Início pela webcam
   --------------------------------------------------------------- */
export async function startCameraSession() {
  // O circuito precisa estar montado ANTES de ligar a câmera: ele
  // define qual é o primeiro exercício da sequência.
  if (state.circuitModeActive) {
    if (!prepareCircuitFromBuilder()) return;
  } else {
    state.circuitMode = false;
  }

  // O clique é um gesto de usuário válido para pedir permissão de
  // microfone, então aproveitamos para ligar os comandos de voz.
  if (settings.voiceCmdToggle.checked) startVoiceCommands();

  controls.startCamBtn.disabled = true;
  controls.startCamBtn.innerHTML = '<span>⏳</span> Carregando IA...';

  try {
    await initPoseDetector();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' }
    });
    stage.video.srcObject = stream;
    await stage.video.play();

    state.isVideoFileMode = false;
    videoFile.controls.style.display = 'none';

    startSession();
    if (state.circuitMode) showCircuitProgress();
  } catch (err) {
    state.circuitMode = false;
    controls.startCamBtn.disabled = false;
    controls.startCamBtn.innerHTML = '<span>📷</span> Iniciar Câmera';
    showToast('Sem acesso à câmera: ' + err.message, '❌');
  }
}

/* ---------------------------------------------------------------
   1.b — Início por arquivo de vídeo (modo de teste/validação)
   --------------------------------------------------------------- */
export async function startVideoFileSession(file) {
  if (!file) return;
  controls.startCamBtn.disabled = true;

  try {
    await initPoseDetector();

    const url = URL.createObjectURL(file);
    stage.video.srcObject = null;
    stage.video.src = url;
    await stage.video.play();

    state.isVideoFileMode = true;
    if (controls.flipCamBtn) controls.flipCamBtn.style.display = 'none';
    videoFile.controls.style.display = 'flex';

    startSession();
    showToast(`Vídeo "${file.name}" carregado!`, '🎬');
  } catch (err) {
    controls.startCamBtn.disabled = false;
    showToast('Erro ao ler vídeo: ' + err.message, '❌');
  }
}

/* ---------------------------------------------------------------
   1.c — Ligar a sessão: troca a UI e dispara o laço de análise
   --------------------------------------------------------------- */
function startSession() {
  stage.placeholder.style.display = 'none';
  stage.video.style.display = 'block';

  // Espelha a câmera ao vivo (efeito "espelho", como o usuário se vê
  // na tela) — mas não um vídeo de arquivo carregado, cujo lado
  // esquerdo/direito já é o real e não deve ser invertido.
  setMirrored(!state.isVideoFileMode);

  stage.overlayCanvas.width = stage.video.videoWidth || 640;
  stage.overlayCanvas.height = stage.video.videoHeight || 480;

  controls.stopBtn.style.display = 'inline-flex';
  controls.recordVideoBtn.style.display = 'inline-flex';
  if (!state.isVideoFileMode && controls.flipCamBtn) {
    controls.flipCamBtn.style.display = 'inline-flex';
  }
  controls.startCamBtn.style.display = 'none';
  controls.videoFileInput.parentElement.style.display = 'none';

  stage.statusBadge.className = 'hud-badge recording';
  stage.statusText.textContent = 'Analisando Movimento';
  stage.fpsBadge.style.display = 'inline-flex';

  state.isRunning = true;
  resetCounters();
  startAnalysisLoop();
}

/* ---------------------------------------------------------------
   1.d — Encerrar a sessão: desliga tudo e persiste o resultado
   --------------------------------------------------------------- */
export function stopSession() {
  if (state.isRecordingVideo) stopRecordingVideo();
  cancelRestPeriod();

  state.isRunning = false;

  if (stage.video.srcObject) {
    stage.video.srcObject.getTracks().forEach(track => track.stop());
    stage.video.srcObject = null;
  }

  stage.video.style.display = 'none';
  stage.placeholder.style.display = 'flex';
  stage.overlayCanvas
    .getContext('2d')
    .clearRect(0, 0, stage.overlayCanvas.width, stage.overlayCanvas.height);

  controls.stopBtn.style.display = 'none';
  controls.recordVideoBtn.style.display = 'none';
  if (controls.flipCamBtn) controls.flipCamBtn.style.display = 'none';
  controls.startCamBtn.style.display = 'inline-flex';
  controls.startCamBtn.disabled = false;
  controls.startCamBtn.innerHTML = '<span>📷</span> Iniciar Câmera';
  controls.videoFileInput.parentElement.style.display = 'inline-block';
  videoFile.controls.style.display = 'none';

  stage.statusBadge.className = 'hud-badge offline';
  stage.statusText.textContent = 'Câmera Desligada';
  stage.fpsBadge.style.display = 'none';

  // O circuito grava o próprio consolidado ao terminar; nesse caso
  // `skipAutoSaveOnStop` evita uma segunda linha no histórico.
  if (!state.skipAutoSaveOnStop && state.goodRepsCount + state.badRepsCount > 0) {
    saveSessionToDatabase();
    showToast('Sessão salva nos relatórios VBT!', '💾');
  }

  setStatusBanner('idle', 'Sessão encerrada.');
  restoreBuilderAfterStop();
  state.circuitMode = false;
}

/* ---------------------------------------------------------------
   1.e — Zerar a série (troca de exercício, novo início, circuito)
   --------------------------------------------------------------- */
export function resetCounters() {
  resetSeriesState();

  metrics.goodReps.textContent = 0;
  metrics.badReps.textContent = 0;
  metrics.vbt.textContent = '0 °/s';
  metrics.fatigue.textContent = '0%';
  metrics.secondaryRow.style.display = 'none';

  setFormAlert(null);
  setStatusBanner('idle', 'Aguardando início do movimento');
}

/* ---------------------------------------------------------------
   Ligação com os controles da interface
   --------------------------------------------------------------- */
export function bindCaptureControls() {
  controls.startCamBtn.addEventListener('click', startCameraSession);
  controls.stopBtn.addEventListener('click', stopSession);
  controls.videoFileInput.addEventListener('change', (event) => {
    startVideoFileSession(event.target.files[0]);
  });
  if (controls.flipCamBtn) {
    controls.flipCamBtn.addEventListener('click', () => {
      const nowMirrored = !stage.video.classList.contains('flipped');
      setMirrored(nowMirrored);
      showToast(nowMirrored ? 'Espelhamento ativado' : 'Espelhamento desativado', '🪞');
    });
  }
}
