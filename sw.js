const CACHE_NAME = 'kasa-pro-v3';
const BASE = '/cuzdanpro3';
const urlsToCache = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap'
];

// ── Kurulum ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting(); // Yeni SW hemen devreye girsin
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Bazı kaynaklar cache\'e eklenemedi:', err);
      });
    })
  );
});

// ── Aktivasyon ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Eski cache siliniyor:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: Network First ──────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Hiçbir şey yoksa offline sayfası göster
          return new Response(
            `<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f0f7ff;">
              <h2 style="color:#1c65ff;">📡 İnternet Bağlantısı Yok</h2>
              <p style="color:#627d98;">Lütfen bağlantınızı kontrol edin.</p>
              <button onclick="location.reload()" style="margin-top:20px;padding:12px 24px;background:#1c65ff;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;">
                Tekrar Dene
              </button>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
  );
});

// ── Push Bildirimleri (opsiyonel) ─────────────────────────────
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Kasa Pro bildirimi',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231c65ff" width="192" height="192"/><text x="50%" y="50%" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">₺</text></svg>',
    tag: 'kasa-pro-notification',
    requireInteraction: false
  };
  event.waitUntil(self.registration.showNotification('Kasa Pro', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(BASE) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(BASE + '/');
    })
  );
});
