const CACHE_NAME = "library-hop-v2";
const TILE_CACHE_NAME = "library-hop-tiles-v1";
const APP_SHELL = ["/", "/manifest.webmanifest"];

const MAP_TILE_HOSTS = ["basemaps.cartocdn.com", "tile.openstreetmap.org"];

const isMapTileRequest = (requestUrl) => {
  return MAP_TILE_HOSTS.some(
    (host) => requestUrl.hostname === host || requestUrl.hostname.endsWith(`.${host}`),
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== TILE_CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (isMapTileRequest(requestUrl)) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((tileCache) => {
        return tileCache.match(event.request).then((cachedTile) => {
          const networkFetch = fetch(event.request)
            .then((response) => {
              if (response && (response.ok || response.type === "opaque")) {
                tileCache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cachedTile);

          return cachedTile || networkFetch;
        });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => cached);
    }),
  );
});
