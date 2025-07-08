// Service worker to cache static assets and handle offline mode
self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('markeet-v1').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/icon.png',
          '/favicon.ico',
          '/static/js/bundle.js', // Adjust based on build output
          '/static/css/main.css'  // Adjust based on build output
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