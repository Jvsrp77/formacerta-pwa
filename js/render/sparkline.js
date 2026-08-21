/**
 * RENDER — GRÁFICO DE TRAJETÓRIA ANGULAR
 * Mini-gráfico (sparkline) do ângulo principal ao longo do tempo.
 * Mostra visualmente a amplitude e a cadência das repetições.
 */

import { metrics } from '../core/dom.js';
import { state } from '../core/state.js';
import { HUD_COLORS } from '../config/constants.js';

const canvas = metrics.sparklineCanvas;
const ctx = canvas.getContext('2d');

/** Faixa angular mapeada na altura do gráfico: 30° (base) a 180° (topo). */
const MIN_DEG = 30;
const RANGE_DEG = 150;

export function drawSparkline() {
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const data = state.sparklineData;
  if (data.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = HUD_COLORS.primary;
  ctx.lineWidth = 2;

  data.forEach((value, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((value - MIN_DEG) / RANGE_DEG) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });

  ctx.stroke();
}
