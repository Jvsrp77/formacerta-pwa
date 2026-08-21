/**
 * ═══════════════════════════════════════════════════════════════
 * ETAPA 2 — DETECÇÃO DE POSE (VISÃO COMPUTACIONAL)
 * ═══════════════════════════════════════════════════════════════
 * Única parte do sistema que fala com o modelo de IA. Carrega o
 * MediaPipe Pose Landmarker (BlazePose) via WebAssembly e converte
 * cada frame em 33 marcadores anatômicos normalizados (x, y, z).
 *
 * Todo o processamento acontece no dispositivo: nenhum frame de
 * vídeo é enviado a servidor algum.
 *
 *   ENTRADA : frame do <video> (ETAPA 1)
 *   SAÍDA   : array de 33 landmarks, consumido pela ETAPA 3
 */

import { PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
import { MEDIAPIPE_WASM_URL, POSE_MODEL_URL } from '../config/constants.js';
import { showToast } from '../feedback/toast.js';

let poseLandmarker = null;

/**
 * Carrega o modelo uma única vez (idempotente). É a operação mais
 * cara do sistema — por isso roda sob o estado "Carregando IA...".
 */
export async function initPoseDetector() {
  if (poseLandmarker) return poseLandmarker;

  try {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1
    });

    return poseLandmarker;
  } catch (err) {
    showToast('Erro ao carregar IA: ' + err.message, '❌');
    throw err;
  }
}

/**
 * Roda a inferência em um frame.
 * @param {HTMLVideoElement} video
 * @param {number} timestamp marca de tempo monotônica (performance.now())
 * @returns {Array|null} os 33 landmarks da primeira pessoa, ou null
 *                       se nenhuma pessoa foi identificada
 */
export function detectPose(video, timestamp) {
  if (!poseLandmarker) return null;

  const results = poseLandmarker.detectForVideo(video, timestamp);
  return (results.landmarks && results.landmarks[0]) || null;
}
