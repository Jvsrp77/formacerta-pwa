/**
 * UI — NAVEGAÇÃO POR ABAS
 * ---------------------------------------------------------------
 * Alterna entre Análise Ao Vivo, Desempenho & VBT, Metodologia TCC
 * e Configurações. Cada botão aponta para o id do painel pelo
 * atributo `data-tab`.
 */

import { renderHistoryTable } from '../features/history.js';

export function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      button.classList.add('active');
      document.getElementById(button.dataset.tab)?.classList.add('active');

      // O histórico é relido do localStorage a cada abertura da aba.
      if (button.dataset.tab === 'tab-analytics') renderHistoryTable();
    });
  });
}
