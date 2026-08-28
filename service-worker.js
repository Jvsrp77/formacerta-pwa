// Service worker do FormaCerta AI — PWA Cache Shell para TCC
//
// IMPORTANTE: ao adicionar um arquivo CSS ou JS novo ao projeto,
// inclua-o em APP_SHELL e incremente CACHE_NAME — senão o app
// instalado continuará servindo a versão antiga do cache.
const CACHE_NAME = 'formacerta-ai-v5';

const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',

  // Estilos
  './css/01-tokens.css',
  './css/02-layout.css',
  './css/03-components.css',
  './css/04-analyzer.css',
  './css/05-pages.css',
  './css/06-responsive.css',

  // Ponto de entrada e configuração
  './js/main.js',
  './js/pwa.js',
  './js/config/exercises.js',
  './js/config/constants.js',

  // Núcleo
  './js/core/dom.js',
  './js/core/state.js',
  './js/core/geometry.js',

  // Etapas do pipeline de análise
  './js/pipeline/loop.js',
  './js/pipeline/etapa1-captura.js',
  './js/pipeline/etapa2-deteccao-pose.js',
  './js/pipeline/etapa3-biomecanica.js',
  './js/pipeline/etapa4-avaliacao.js',
  './js/pipeline/etapa5-feedback.js',

  // Renderização
  './js/render/hud-overlay.js',
  './js/render/skeleton-3d.js',
  './js/render/sparkline.js',
  './js/render/muscle-map.js',

  // Feedback
  './js/feedback/toast.js',
  './js/feedback/audio.js',
  './js/feedback/speech.js',
  './js/feedback/status-panel.js',

  // Funcionalidades
  './js/features/circuit.js',
  './js/features/recorder.js',
  './js/features/voice-commands.js',
  './js/features/history.js',
  './js/features/export.js',
  './js/features/report.js',

  // Interface
  './js/ui/tabs.js',
  './js/ui/exercise-selector.js',
  './js/ui/settings.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
