const CACHE_NAME = '0.160';
const SCOPE = '/road-rover/';

const ASSETS_TO_CACHE = [
    SCOPE,
    SCOPE + 'index.html',
    SCOPE + 'manifest.json',
    SCOPE + 'icon.png',
    SCOPE + 'main.js',
    SCOPE + 'map.js',
    SCOPE + 'auth.js',
    SCOPE + 'accelerometer.js',
    SCOPE + 'ui.js',
    SCOPE + 'api.js',
    SCOPE + 'styles.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
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

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});