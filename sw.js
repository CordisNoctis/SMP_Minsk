const VERSION = "1.11.3";
const CACHE_NAME = `smp-pwa-${VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/schedule.css",
  "./css/checklist.css",
  "./js/version.js",
  "./js/theme-init.js",
  "./js/theme.js",
  "./js/templates.js",
  "./js/app.js",
  "./js/modal.js",
  "./js/back.js",
  "./js/time-picker.js",
  "./js/shift-schedule.js",
  "./js/templates-admin.js",
  "./js/calendar-export.js",
  "./js/settings-backup.js",
  "./js/medical-catalog.js",
  "./js/equipment-data.js",
  "./js/equipment-checklist.js",
  "./js/used-items.js",
  "./js/sw-register.js",
  "./manifest.webmanifest",
  "./pages/cheatsheets.html",
  "./pages/settings.html",
  "./pages/shift-schedule.html",
  "./pages/templates.html",
  "./pages/shift-checklist.html",
  "./pages/equipment-checklist.html",
  "./pages/used-items.html",
  "./css/medical-picker.css",
  "./js/medical-picker.js",
  "./js/medical-items.js",
  "./js/medical-tables.js",
  "./js/changelog.js",
  "./js/update-notice.js",
  "./css/changelog.css",
];

const OPTIONAL_ASSETS = [
  "./icons/apple-touch-icon.png",
  "./icons/favicon.svg",
  "./icons/favicon.ico",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
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

// Приём команды "обновить все клиенты" от страницы
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
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

  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .catch(() => caches.match(request))
    );
    return;
  }

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

  if (request.mode === "navigate") {
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
        .catch(() => caches.match(request).then((cached) => {
          return cached || caches.match("./index.html");
        }))
    );
    return;
  }

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