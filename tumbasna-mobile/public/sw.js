self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Hanya melakukan bypass network request tanpa caching (minimalist PWA requirement)
  event.respondWith(fetch(event.request));
});
