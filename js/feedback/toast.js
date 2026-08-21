/**
 * FEEDBACK — TOAST
 * Notificação flutuante e temporária no canto da tela.
 */

import { toast } from '../core/dom.js';

let hideTimeout = null;

export function showToast(message, icon = 'ℹ️') {
  toast.message.textContent = message;
  toast.icon.textContent = icon;
  toast.root.classList.add('show');

  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => toast.root.classList.remove('show'), 3000);
}
