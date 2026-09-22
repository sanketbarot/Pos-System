// Crust & Chilly - Service Worker for PWA Support
const CACHE_NAME = "cc-pos-v4.5";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css?v=4.5",
  "./logo.jpg",
  "./app.js?v=4.5",
  "./js/db.js?v=4.5",
  "./js/dashboard.js?v=4.5",
  "./js/pos.js?v=4.5",
  "./js/orders.js?v=4.5",
  "./js/menu.js?v=4.5",
  "./js/reports.js?v=4.5",
  "./js/counter.js?v=4.5",
  "./manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA Service Worker] Caching core static assets");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[PWA Service Worker] Asset pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[PWA Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always use network directly for Firebase, Firestore, and live cloud sync APIs
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("gstatic.com") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Network with Cache Fallback / Background Cache Update
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
