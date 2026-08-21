/**
 * FEEDBACK — PAINÉIS DE STATUS
 * Escreve nas faixas coloridas do painel de métricas: o status da
 * execução e o alerta de desvio postural.
 */

import { metrics } from '../core/dom.js';

const STATUS_ICONS = { good: '✓', bad: '⚠️', warn: '⚠️', idle: 'ℹ️' };

/**
 * @param {'good'|'bad'|'warn'|'idle'} type
 * @param {string} text
 */
export function setStatusBanner(type, text) {
  metrics.statusBanner.className = 'status-banner ' + type;
  metrics.statusBanner.innerHTML = `<span>${STATUS_ICONS[type] || STATUS_ICONS.idle}</span> ${text}`;
}

/**
 * Mostra ou limpa o alerta de postura. Passar `null` volta ao
 * estado "OK".
 * @param {string|null} text
 */
export function setFormAlert(text) {
  if (text) {
    metrics.formAlertBanner.style.display = 'flex';
    metrics.formAlertText.textContent = text;
    metrics.posture.textContent = 'ALERTA';
    metrics.posture.style.color = 'var(--bad)';
  } else {
    metrics.formAlertBanner.style.display = 'none';
    metrics.posture.textContent = 'OK';
    metrics.posture.style.color = 'var(--accent)';
  }
}
