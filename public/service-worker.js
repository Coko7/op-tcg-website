// Service Worker pour PWA avec mise à jour automatique
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `op-booster-${CACHE_VERSION}`;

// Fichiers à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/strawhat.svg'
];

// URLs à ne jamais mettre en cache
const NO_CACHE_URLS = [
  '/api/',
  'chrome-extension://'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des fichiers essentiels');
      return cache.addAll(PRECACHE_URLS);
    })
    // Ne PAS appeler skipWaiting() automatiquement
    // Attendre que l'utilisateur confirme la mise à jour
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du Service Worker version:', CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    // Ne PAS appeler clients.claim() automatiquement
    // Le nouveau SW prendra le contrôle après le rechargement confirmé par l'utilisateur
  );
});

// Stratégie de mise en cache: Network First avec fallback sur cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas mettre en cache certaines URLs
  if (NO_CACHE_URLS.some(pattern => url.href.includes(pattern))) {
    return;
  }

  // Pour les requêtes API: toujours réseau, pas de cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Vous êtes hors ligne' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Pour les autres ressources: Network First avec fallback sur cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la réponse est valide, la mettre en cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, utiliser le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Si pas de cache et page HTML, retourner index.html
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }

          return new Response('Ressource non disponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Écouter les messages du client pour vérifier les mises à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Message reçu: SKIP_WAITING');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('[SW] Vérification des mises à jour...');
    // Le client peut demander une vérification de mise à jour
    event.ports[0].postMessage({
      type: 'UPDATE_AVAILABLE',
      version: CACHE_VERSION
    });
  }
});
