/**
 * FEEDBACK — SOM
 * Bipes curtos sintetizados pela Web Audio API. Sem arquivos de
 * áudio: o oscilador é gerado na hora, o que mantém o PWA leve e
 * funcional offline.
 */

let audioCtx = null;

/**
 * @param {number} freq     frequência em Hz (agudo = acerto, grave = erro)
 * @param {OscillatorType} type
 * @param {number} duration duração em segundos
 */
export function playSoundTone(freq = 440, type = 'sine', duration = 0.15) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    // Decaimento exponencial evita o "clique" audível do corte seco.
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    /* AudioContext indisponível (ex.: antes da primeira interação do usuário) */
  }
}
