const CACHE_NAME = 'kasa-pro-v2.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap'
];

// Service Worker Kurulum
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Kasa Pro Cache açıldı');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Bazı kaynaklar cache\'e eklenemedi:', err);
          // Hata olsa da devam etsin
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker Aktivasyon
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network First Strategy - İnternet varsa ağdan al, yoksa cache'den
self.addEventListener('fetch', event => {
  // Sadece GET isteklerini handle et
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı response'u cache'e kaydet
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // İnternet yoksa cache'den döndür
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Cache'de de yoksa offline sayfası döndür
            return new Response(
              '<html><body style="font-family: Nunito, sans-serif; text-align: center; padding: 20px; background: #f0f7ff;">' +
              '<h2 style="color: #1c65ff;">📡 İnternet Bağlantısı Yok</h2>' +
              '<p>Lütfen bağlantınızı kontrol edin veya cache\'lenmiş sayfayı kullanın.</p>' +
              '</body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
      })
  );
});

// Background Sync (opsiyonel - gelecekte kullanabilirsiniz)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Senkronizasyon işlemleri burada yapılır
      Promise.resolve()
    );
  }
});

// Push Notifications (opsiyonel)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Kasa Pro bildirim',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231c65ff" width="192" height="192"/><text x="50%" y="50%" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">₺</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231c65ff" width="192" height="192"/></svg>',
    tag: 'kasa-pro-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Kasa Pro', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
