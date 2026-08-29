const CACHE_NAME = 'emboobate-cache-v30';
// Service worker propio de Embobate (separado de dieta/rutinas desde 2026-07-07).
const ASSETS = [
  './embobate.html',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Manejador fetch: requerido para que la app sea instalable (PWA) y funcione sin conexión.
// HTML/navegación: primero la red (siempre lo más nuevo); si no hay internet, la copia en caché.
// Demás archivos: primero caché, con respaldo en red.
function isHtml(request) {
  return request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.url.endsWith('.html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (isHtml(event.request)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then((c) => c || caches.match('./embobate.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
