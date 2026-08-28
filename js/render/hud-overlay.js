/**
 * RENDER — HUD SOBREPOSTO AO VÍDEO
 * Desenha no canvas que fica por cima do <video>: o segmento
 * articular em análise, os marcadores e o valor do ângulo.
 *
 * O vídeo só é copiado para dentro do canvas quando há gravação
 * em andamento — é o que permite exportar o clipe já com o HUD
 * "queimado" na imagem, sem custo de desenho durante o uso normal.
 */

import { stage } from '../core/dom.js';
import { HUD_COLORS } from '../config/constants.js';

const canvas = stage.overlayCanvas;
const ctx = canvas.getContext('2d');

/** Ajusta o canvas à resolução real do vídeo, se ela mudou. */
export function syncOverlaySize() {
  if (canvas.width !== stage.video.videoWidth || canvas.height !== stage.video.videoHeight) {
    canvas.width = stage.video.videoWidth;
    canvas.height = stage.video.videoHeight;
  }
}

export function clearOverlay() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function isVideoFlipped() {
  if (stage.video.classList.contains('unflipped')) return false;
  return stage.video.classList.contains('flipped') || !stage.video.currentSrc;
}

/** Copia o frame atual do vídeo para o canvas (usado na gravação). */
export function drawVideoFrame() {
  if (isVideoFlipped()) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(stage.video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.drawImage(stage.video, 0, 0, canvas.width, canvas.height);
  }
}

/** Traça o segmento A→B→C e destaca a articulação-pivô (B). */
export function drawSkeletonSegment(pA, pB, pC) {
  const w = canvas.width, h = canvas.height;
  const flipped = isVideoFlipped();
  const getX = (p) => (flipped ? (1 - p.x) : p.x) * w;

  ctx.lineWidth = 5;
  ctx.strokeStyle = HUD_COLORS.primary;
  ctx.beginPath();
  ctx.moveTo(getX(pA), pA.y * h);
  ctx.lineTo(getX(pB), pB.y * h);
  ctx.lineTo(getX(pC), pC.y * h);
  ctx.stroke();

  [pA, pB, pC].forEach((p, idx) => {
    const isPivot = idx === 1;
    ctx.fillStyle = isPivot ? HUD_COLORS.pivot : HUD_COLORS.primary;
    ctx.beginPath();
    ctx.arc(getX(p), p.y * h, isPivot ? 9 : 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = HUD_COLORS.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

/** Etiqueta com o ângulo em graus, ancorada ao lado da articulação. */
export function drawAngleBadge(pB, angleValue) {
  const w = canvas.width, h = canvas.height;
  const flipped = isVideoFlipped();
  const bx = (flipped ? (1 - pB.x) : pB.x) * w;
  const by = pB.y * h;
  const label = angleValue + '°';

  ctx.font = '700 14px "JetBrains Mono", monospace';
  const textWidth = ctx.measureText(label).width;

  let badgeX = bx + 12;
  if (badgeX + textWidth + 16 > w) {
    badgeX = bx - textWidth - 28;
  }

  ctx.fillStyle = HUD_COLORS.panel;
  ctx.beginPath();
  ctx.roundRect(badgeX, by - 16, textWidth + 16, 26, 6);
  ctx.fill();
  ctx.strokeStyle = HUD_COLORS.pivot;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = HUD_COLORS.pivot;
  ctx.fillText(label, badgeX + 8, by + 2);
}
