const CACHE_NAME = 'cuzdan-pro-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://googleapis.com'
];

// Yükleme: Gerekli dosyaları hafızaya al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Önbellek açıldı; dosyalar kaydediliyor.');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Aktivasyon: Eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski önbellek siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Getirme: Önce önbelleğe bak, yoksa internetten getir
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Önbellekte varsa onu döndür
        if (response) return response;

        // Yoksa internete git
        return fetch(event.request).catch(() => {
          // İnternet yoksa ve bir sayfa isteniyorsa ana sayfayı döndür
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
