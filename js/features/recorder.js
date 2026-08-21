/**
 * FUNCIONALIDADE — GRAVAÇÃO DE VÍDEO COM HUD
 * ---------------------------------------------------------------
 * Grava o CANVAS, não a câmera. Como a ETAPA 5 desenha o vídeo e o
 * HUD no mesmo canvas durante a gravação, o arquivo exportado sai
 * com esqueleto, ângulos e marcadores já embutidos na imagem —
 * material pronto para a defesa do TCC.
 */

import { stage, controls } from '../core/dom.js';
import { state } from '../core/state.js';
import { showToast } from '../feedback/toast.js';

let mediaRecorder = null;
let recordedChunks = [];

export function startRecordingVideo() {
  try {
    const stream = stage.overlayCanvas.captureStream(30);
    recordedChunks = [];

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = downloadRecording;
    mediaRecorder.start();

    state.isRecordingVideo = true;
    controls.recordVideoBtn.classList.add('recording');
    controls.recordVideoBtn.innerHTML = '<span>⏹</span> Parar Gravação';
    showToast('Gravação de vídeo iniciada.', '🔴');
  } catch (err) {
    showToast('Erro ao gravar vídeo: ' + err.message, '❌');
  }
}

export function stopRecordingVideo() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();

  state.isRecordingVideo = false;
  controls.recordVideoBtn.classList.remove('recording');
  controls.recordVideoBtn.innerHTML = '<span>🔴</span> Gravar Vídeo HUD';
}

function downloadRecording() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `formacerta_${state.currentExerciseKey}_${Date.now()}.webm`;
  link.click();

  URL.revokeObjectURL(url);
  showToast('Vídeo com HUD salvo!', '💾');
}

export function initRecorder() {
  controls.recordVideoBtn.addEventListener('click', () => {
    if (state.isRecordingVideo) stopRecordingVideo(); else startRecordingVideo();
  });
}
