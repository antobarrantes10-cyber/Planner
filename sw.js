/* Service worker: permite usar el planificador sin conexión.
   Si cambias algún archivo de la app, sube el número de VERSION para que el teléfono se actualice. */
const VERSION = 'v1';
const CACHE = 'planificador-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
const CDN = [
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700&family=Figtree:wght@400;500;600&display=swap'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(CORE).then(function () {
      return Promise.allSettled(CDN.map(function (u) {
        return fetch(u, { mode: 'no-cors' }).then(function (r) { return cache.put(u, r); });
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var same = new URL(req.url).origin === self.location.origin;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: same }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error()); });
      // Archivos propios: muestra lo guardado y actualiza en segundo plano. CDN y fuentes: primero lo guardado.
      return hit || net;
    });
  }));
});
