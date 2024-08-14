self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('road-rover-v1').then((cache) => {
      return cache.addAll([
        '/road-rover/',
        '/road-rover/index.html',
        '/road-rover/manifest.json',
        '/road-rover/icon.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});