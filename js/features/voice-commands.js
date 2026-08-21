/**
 * FUNCIONALIDADE — COMANDOS DE VOZ HANDS-FREE
 * ---------------------------------------------------------------
 * Reconhecimento contínuo em PT-BR (Web Speech API) para operar o
 * sistema sem tocar na tela — essencial quando o atleta está longe
 * do dispositivo, executando o movimento.
 *
 * Comandos: iniciar · parar · gravar · parar gravação · pular ·
 *           nome de qualquer exercício
 */

import { stage, controls, settings } from '../core/dom.js';
import { state } from '../core/state.js';
import { EXERCISES, VOICE_EXERCISE_ALIASES } from '../config/exercises.js';
import { showToast } from '../feedback/toast.js';
import { setSpeechInterruptHooks } from '../feedback/speech.js';
import { startCameraSession, stopSession } from '../pipeline/etapa1-captura.js';
import { startRecordingVideo, stopRecordingVideo } from './recorder.js';
import { endRestPeriod, advanceCircuit } from './circuit.js';
import { selectExercise } from '../ui/exercise-selector.js';

let recognition = null;
let recognitionActive = false;
let pausedForSpeech = false;

/** Remove acentos e caixa: "Começa" e "comeca" viram o mesmo texto. */
function normalizeVoiceText(text) {
  // NFD separa "ç" em "c" + cedilha; \p{Diacritic} então remove os
  // acentos que ficaram soltos.
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/* ---------------------------------------------------------------
   Interpretação dos comandos
   ---------------------------------------------------------------
   A ORDEM das checagens importa: comandos mais específicos vêm
   primeiro, porque "parar gravação" contém a palavra "parar" e não
   pode ser confundido com "encerrar a sessão inteira".
   --------------------------------------------------------------- */
function handleVoiceCommand(rawTranscript) {
  const text = normalizeVoiceText(rawTranscript);
  const sessionRunning = state.isRunning;

  if (/\b(iniciar|comecar|começa)\b/.test(text) && !sessionRunning) {
    showToast('🎙 Comando: iniciar', '🎙');
    if (!controls.startCamBtn.disabled) startCameraSession();
    return;
  }

  if (/\b(parar grava[cç][aã]o|parar de gravar)\b/.test(text) && state.isRecordingVideo) {
    showToast('🎙 Comando: parar gravação', '🎙');
    stopRecordingVideo();
    return;
  }

  if (/\bgravar\b/.test(text) && sessionRunning && !state.isRecordingVideo) {
    showToast('🎙 Comando: gravar vídeo', '🎙');
    startRecordingVideo();
    return;
  }

  if (/\b(parar|encerrar|finalizar)\b/.test(text) && sessionRunning) {
    showToast('🎙 Comando: parar', '🎙');
    stopSession();
    return;
  }

  if (/\b(pular|proximo|avancar|continuar|pronto)\b/.test(text) && state.circuitMode && sessionRunning) {
    showToast('🎙 Comando: pular', '🎙');
    if (state.inRestPeriod) endRestPeriod(); else advanceCircuit();
    return;
  }

  // Com o circuito em execução, a sequência é controlada pelo próprio
  // circuito — trocar de exercício por voz desincronizaria a meta.
  if (state.circuitMode && sessionRunning) return;

  for (const [key, aliases] of Object.entries(VOICE_EXERCISE_ALIASES)) {
    if (key !== state.currentExerciseKey && aliases.some(alias => text.includes(alias))) {
      selectExercise(key);
      showToast(`🎙 Exercício: ${EXERCISES[key].label}`, '🔁');
      return;
    }
  }
}

/* ---------------------------------------------------------------
   Ciclo de vida do reconhecedor
   --------------------------------------------------------------- */
export function initVoiceCommands() {
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    settings.voiceCmdToggle.checked = false;
    settings.voiceCmdToggle.disabled = true;
    settings.voiceCmdDesc.textContent = 'Não suportado neste navegador (use Chrome/Edge).';
    return;
  }

  recognition = new SpeechRecognitionAPI();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    if (last && last[0]) handleVoiceCommand(last[0].transcript);
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      showToast('Permissão de microfone negada para comandos de voz.', '🎙');
      settings.voiceCmdToggle.checked = false;
      stopVoiceCommands();
    }
    // 'no-speech' e 'aborted' são normais na escuta contínua; o
    // onend cuida de religar o reconhecedor.
  };

  recognition.onend = () => {
    if (recognitionActive && !pausedForSpeech) {
      try { recognition.start(); } catch (e) { /* já rodando */ }
    }
  };

  // Enquanto o app fala, o microfone é pausado para ele não ouvir a
  // si mesmo e interpretar a própria fala como comando.
  setSpeechInterruptHooks({
    onSpeechStart: () => {
      if (!recognitionActive || !recognition) return;
      pausedForSpeech = true;
      try { recognition.stop(); } catch (e) { /* já parado */ }
    },
    onSpeechEnd: () => {
      pausedForSpeech = false;
      if (recognitionActive && recognition) {
        try { recognition.start(); } catch (e) { /* já rodando */ }
      }
    }
  });

  settings.voiceCmdToggle.addEventListener('change', () => {
    if (settings.voiceCmdToggle.checked) startVoiceCommands(); else stopVoiceCommands();
  });
}

export function startVoiceCommands() {
  if (!recognition || recognitionActive) return;
  recognitionActive = true;
  try {
    recognition.start();
    stage.voiceCmdBadge.style.display = 'inline-flex';
  } catch (e) { /* já rodando */ }
}

export function stopVoiceCommands() {
  recognitionActive = false;
  if (recognition) {
    try { recognition.stop(); } catch (e) { /* já parado */ }
  }
  stage.voiceCmdBadge.style.display = 'none';
}
