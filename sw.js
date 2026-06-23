const CACHE_NAME = "renegades-arena-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./portal.html",
  "./queens.html",
  "./assets/css/style.css",
  "./assets/css/portal.css",
  "./assets/css/queens.css",
  "./assets/css/mlb_tournaments.css",
  "./assets/js/main.js",
  "./assets/js/portal.js",
  "./assets/js/config.js",
  "./assets/js/supabase.js",
  "./assets/js/queens.js",
  "./assets/images/logo.png",
  "./assets/images/logo_women.png"
];

// Install Event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Caching essential assets for offline support");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Clearing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First with Network Fallback
self.addEventListener("fetch", event => {
  if (!event.request.url.startsWith("http")) return;

  // Avoid caching Supabase API requests
  if (event.request.url.includes("supabase.co")) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache, then query network in background to update cache
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
