const VERSION = "1.0.0";
const CACHE_NAME = `smp-pwa-${VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest"
];

const OPTIONAL_ASSETS = [
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const DATA_ASSETS = [
  "./data/content.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all([
          cache.addAll(APP_SHELL).catch(() => {}),
          Promise.allSettled(
            OPTIONAL_ASSETS.map((url) => cache.add(url))
          ),
          Promise.allSettled(
            DATA_ASSETS.map((url) => cache.add(url))
          )
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  // Версию не кэшируем жёстко, чтобы видеть обновления
  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Контент: сначала сеть, если нет сети — кэш
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Открытие приложения
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html")
        .then((cached) => {
          return cached || fetch(request);
        })
    );
    return;
  }

  // Остальные файлы: сначала кэш, параллельно обновляем из сети
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok && response.type === "basic") {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, copy);
              });
            }
            return response;
          })
          .catch(() => cached);

        return cached || network;
      })
  );
});