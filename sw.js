const CACHE_NAME = 'rest-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/app.js',
  './js/api.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  // CORRECCIÓN CRÍTICA: La API de Cache solo soporta GET. 
  // Si la petición es POST, DELETE o PUT, la dejamos pasar directo al servidor sin cachear.
  if (e.request.method !== 'GET') {
    return fetch(e.request);
  }

  const url = new URL(e.request.url);
  
  // Estrategia Network-First para la API, Cache-First para estáticos
  if (url.pathname.includes('/platillos') || url.pathname.includes('/mostrador') || url.pathname.includes('/estadisticas')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
  }
});