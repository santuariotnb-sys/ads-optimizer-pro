// Service Worker — Ads.Everest PWA
// Cache offline + Push Notifications

const CACHE_NAME = 'ads-everest-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo-everest.png',
  '/manifest.json',
];

// ═══ INSTALL — precache static assets ═══
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ═══ ACTIVATE — cleanup old caches ═══
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// ═══ FETCH — network first, fallback to cache ═══
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and API calls
  if (request.method !== 'GET') return;
  if (request.url.includes('/functions/') || request.url.includes('supabase.co')) return;
  if (request.url.includes('api.anthropic.com') || request.url.includes('api.openai.com')) return;
  if (request.url.includes('graph.facebook.com')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && (request.url.includes('.js') || request.url.includes('.css') || request.url.includes('.png') || request.url.includes('.woff'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // If HTML request, return cached index.html (SPA)
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ═══ PUSH NOTIFICATIONS ═══
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Nova Venda!';
  const options = {
    body: data.body || '',
    icon: '/logo-everest.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'sale-notification',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    renotify: true,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ═══ NOTIFICATION CLICK ═══
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ═══ SUBSCRIPTION CHANGE ═══
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription?.options).then((subscription) => {
      return fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
    })
  );
});
