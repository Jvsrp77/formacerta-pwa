/**
 * PWA — REGISTRO DO SERVICE WORKER
 * ---------------------------------------------------------------
 * Habilita a instalação do app e o funcionamento offline. A lista
 * de arquivos em cache fica em service-worker.js (APP_SHELL) e
 * precisa ser atualizada sempre que um novo arquivo CSS/JS entrar
 * no projeto.
 *
 * DICA DE DESENVOLVIMENTO: o service worker serve do cache antes da
 * rede. Se uma alteração não aparecer no navegador, use
 * DevTools → Application → Service Workers → "Update on reload",
 * ou incremente o CACHE_NAME em service-worker.js.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .catch(err => console.warn('Service worker não registrado:', err));
  });
}
