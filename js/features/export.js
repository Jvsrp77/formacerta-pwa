/**
 * FUNCIONALIDADE — EXPORTAÇÃO DE DADOS
 * ---------------------------------------------------------------
 * Gera CSV (para planilha / análise estatística no TCC) e JSON
 * (para reprocessamento) a partir do histórico salvo.
 */

import { analytics } from '../core/dom.js';
import { showToast } from '../feedback/toast.js';
import { loadHistoryFromStorage } from './history.js';

const CSV_HEADER = ['Data', 'Exercicio', 'RepsValidas', 'RepsComFalha', 'VBT', 'Precisao'];

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/** Aspas duplicadas conforme RFC 4180 — protege vírgulas na data. */
function toCsvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function exportHistoryCsv() {
  const history = loadHistoryFromStorage();
  if (history.length === 0) { showToast('Nenhum treino para exportar.', '⚠️'); return; }

  const rows = history.map(s => [s.date, s.exercise, s.good, s.bad, s.vbtSpeed || 0, s.accuracy]);
  const csv = [CSV_HEADER, ...rows].map(row => row.map(toCsvCell).join(',')).join('\n');

  downloadBlob(csv, 'formacerta_historico.csv', 'text/csv');
  showToast('Histórico exportado em CSV.', '📥');
}

function exportHistoryJson() {
  const history = loadHistoryFromStorage();
  if (history.length === 0) { showToast('Nenhum treino para exportar.', '⚠️'); return; }

  downloadBlob(JSON.stringify(history, null, 2), 'formacerta_historico.json', 'application/json');
  showToast('Histórico exportado em JSON.', '📄');
}

export function initExport() {
  analytics.exportCsvBtn.addEventListener('click', exportHistoryCsv);
  analytics.exportJsonBtn.addEventListener('click', exportHistoryJson);
}
