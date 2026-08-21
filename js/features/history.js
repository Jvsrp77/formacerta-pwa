/**
 * FUNCIONALIDADE — HISTÓRICO DE SESSÕES
 * ---------------------------------------------------------------
 * Persistência local (localStorage) e renderização da aba
 * "Desempenho & VBT". Guarda no máximo MAX_STORED_SESSIONS
 * registros, do mais recente para o mais antigo.
 *
 * Formato de um registro:
 *   { id, date, exercise, good, bad, vbtSpeed, accuracy,
 *     type?: 'circuit', steps?: [...] }
 */

import { analytics } from '../core/dom.js';
import { state } from '../core/state.js';
import { STORAGE_KEY, MAX_STORED_SESSIONS } from '../config/constants.js';
import { showToast } from '../feedback/toast.js';

/* ---------------------------------------------------------------
   Leitura e escrita
   --------------------------------------------------------------- */

export function loadHistoryFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return []; // dado corrompido: recomeça vazio em vez de quebrar a aba
  }
}

function persist(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_STORED_SESSIONS)));
}

/** Grava a sessão de exercício único encerrada (chamado pela ETAPA 1). */
export function saveSessionToDatabase() {
  const history = loadHistoryFromStorage();
  const total = state.goodRepsCount + state.badRepsCount;

  history.unshift({
    id: Date.now(),
    date: new Date().toLocaleString('pt-BR'),
    exercise: state.currentExercise.label,
    good: state.goodRepsCount,
    bad: state.badRepsCount,
    vbtSpeed: state.currentVbtSpeed,
    accuracy: Math.round((state.goodRepsCount / total) * 100) || 0
  });

  persist(history);
}

/* ---------------------------------------------------------------
   Renderização da aba
   --------------------------------------------------------------- */

export function renderHistoryTable() {
  const history = loadHistoryFromStorage();

  renderSummaryCards(history);

  if (history.length === 0) {
    analytics.tableBody.innerHTML =
      '<tr><td colspan="7" class="history-empty">Nenhum treino gravado ainda. Realize um exercício na aba "Análise Ao Vivo".</td></tr>';
    return;
  }

  analytics.tableBody.innerHTML = history.map(item => `
    <tr>
      <td style="font-family:var(--font-mono); font-size:12px;">${item.date}</td>
      <td><b>${item.exercise}</b>${renderCircuitBreakdown(item)}</td>
      <td style="color:var(--accent); font-weight:700;">${item.good}</td>
      <td style="color:var(--bad); font-weight:700;">${item.bad}</td>
      <td style="color:var(--cyan); font-weight:700;">${item.vbtSpeed || 0} °/s</td>
      <td style="font-family:var(--font-mono); font-weight:700;">${item.accuracy}%</td>
      <td><button type="button" class="btn btn-danger" data-delete-session="${item.id}" style="padding:4px 8px; font-size:11px;">Excluir</button></td>
    </tr>
  `).join('');
}

/** Linha extra detalhando os exercícios de uma sessão de circuito. */
function renderCircuitBreakdown(item) {
  if (item.type !== 'circuit' || !item.steps) return '';
  const detail = item.steps.map(s => `${s.label} (${s.good}/${s.target})`).join(' → ');
  return `<div style="font-size:11px; color:var(--muted); margin-top:3px;">${detail}</div>`;
}

function renderSummaryCards(history) {
  analytics.totalSessions.textContent = history.length;

  const totalVbt = history.reduce((sum, s) => sum + (s.vbtSpeed || 0), 0);
  const totalAccuracy = history.reduce((sum, s) => sum + (s.accuracy || 0), 0);

  analytics.avgVbt.textContent = (history.length > 0 ? Math.round(totalVbt / history.length) : 0) + ' °/s';
  analytics.accuracyScore.textContent = (history.length > 0 ? Math.round(totalAccuracy / history.length) : 0) + '%';
}

/* ---------------------------------------------------------------
   Ações do usuário
   --------------------------------------------------------------- */

function deleteSession(id) {
  persist(loadHistoryFromStorage().filter(item => item.id !== id));
  renderHistoryTable();
  showToast('Registro excluído.', '🗑');
}

function clearHistory() {
  if (!confirm('Deseja apagar o histórico de treinos VBT?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistoryTable();
  showToast('Histórico limpo.', '🗑');
}

export function initHistory() {
  analytics.clearHistoryBtn.addEventListener('click', clearHistory);

  // Delegação de evento: as linhas são recriadas a cada render, então
  // ouvimos no <tbody>, que é estável.
  analytics.tableBody.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-delete-session]');
    if (btn) deleteSession(Number(btn.dataset.deleteSession));
  });
}
