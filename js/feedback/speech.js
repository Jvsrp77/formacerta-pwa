/**
 * FEEDBACK — SÍNTESE DE VOZ (PT-BR)
 * Anuncia repetições e correções posturais em voz alta.
 *
 * Detalhe importante: enquanto o app FALA, o reconhecimento de voz
 * precisa ser pausado — senão ele se ouve e interpreta a própria
 * fala como comando (ex.: "pare" ecoando como "parar").
 *
 * Para não criar dependência circular com features/voice-commands.js,
 * este módulo não conhece o reconhecedor: quem quiser ser avisado
 * registra ganchos via `setSpeechInterruptHooks()`.
 */

import { settings } from '../core/dom.js';
import { state } from '../core/state.js';

let hooks = { onSpeechStart: () => {}, onSpeechEnd: () => {} };

/** Registra quem deve ser pausado/retomado enquanto o app fala. */
export function setSpeechInterruptHooks(newHooks) {
  hooks = { ...hooks, ...newHooks };
}

/**
 * Fala um texto. Repetições consecutivas do mesmo texto são
 * ignoradas para não sobrepor a mesma frase a cada frame.
 */
export function speak(text) {
  if (!settings.voiceToggle.checked) return;
  if (!('speechSynthesis' in window)) return;
  if (text === state.lastVoiceSpeech) return;

  state.lastVoiceSpeech = text;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.05;

  hooks.onSpeechStart();
  utterance.onend = utterance.onerror = () => hooks.onSpeechEnd();

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
