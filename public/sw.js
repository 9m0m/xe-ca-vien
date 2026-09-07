// Xe Cá Viên PWA Service Worker
const CACHE_NAME = 'xcv-cache-v2'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  // 1. Strictly ignore non-GET requests (mutations like POST/PUT/DELETE must never touch CacheStorage)
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  // 2. API calls are strictly network-only, never cached or intercepted by SW
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // 3. Navigation and HTML entry points: Network-First with offline cache fallback
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return networkResponse
        })
        .catch(() =>
          caches
            .match('/index.html')
            .then((res) => res || new Response('Ngoại tuyến', { status: 503 })),
        ),
    )
    return
  }

  // 4. Static assets (hashed JS/CSS, images, sounds): Cache-First with background network update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse))
            }
          })
          .catch(() => {})
        return cachedResponse
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse
          }
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          return networkResponse
        })
        .catch(() => {
          return new Response('Ngoại tuyến', { status: 503, statusText: 'Offline' })
        })
    }),
  )
})
