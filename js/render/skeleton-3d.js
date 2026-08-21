/**
 * RENDER — VISUALIZADOR 3D ROTACIONÁVEL
 * Reprojeta os landmarks usando a coordenada z (profundidade) do
 * BlazePose, permitindo girar o esqueleto em 360° com o slider.
 * Serve para conferir visualmente a estimativa de profundidade.
 */

import { visualizer } from '../core/dom.js';
import { SKELETON_CONNECTIONS, HUD_COLORS } from '../config/constants.js';
import { rotateAroundY } from '../core/geometry.js';

const canvas = visualizer.canvas3D;
const ctx = canvas.getContext('2d');

export function render3DSkeleton(landmarks) {
  // O canvas é redimensionado a cada frame porque sua largura em CSS
  // é fluida (100% da coluna) e muda com o layout responsivo.
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const rotationDeg = parseFloat(visualizer.rotationSlider.value) || 45;
  const rad = rotationDeg * (Math.PI / 180);
  const cos = Math.cos(rad), sin = Math.sin(rad);

  ctx.strokeStyle = HUD_COLORS.pivot;
  ctx.lineWidth = 2;

  SKELETON_CONNECTIONS.forEach(([i1, i2]) => {
    const p1 = landmarks[i1], p2 = landmarks[i2];
    if (!p1 || !p2) return;

    ctx.beginPath();
    ctx.moveTo(rotateAroundY(p1, cos, sin) * w, p1.y * h);
    ctx.lineTo(rotateAroundY(p2, cos, sin) * w, p2.y * h);
    ctx.stroke();
  });
}
