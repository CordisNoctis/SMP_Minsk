importScripts("./js/core/version.js");

const VERSION = self.SMP_VERSION || "0.0.0";
const CACHE_NAME = `smp-pwa-${VERSION}`;

const APP_SHELL = [
  // === Корень ===
  "./",
  "./index.html",
  "./manifest.webmanifest",

  // === CSS ===
  "./css/styles.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/schedule.css",
  "./css/checklist.css",
  "./css/medical-picker.css",
  "./css/changelog.css",
  "./css/cheatsheet.css",
  "./css/result-panel.css",

  // === CSS: калькуляторы (общий + страница списка) ===
  "./css/calculators-common.css",
  "./css/calculators-list.css",

  // === CSS: калькуляторы (персональные) ===
  "./css/calc-algover.css",
  "./css/calc-apgar.css",
  "./css/calc-ciwa.css",
  "./css/calc-drug-converter.css",
  "./css/calc-ett-size.css",
  "./css/calc-fast-ed.css",
  "./css/calc-four.css",
  "./css/calc-geneva.css",
  "./css/calc-glasgow.css",
  "./css/calc-killip.css",
  "./css/calc-qtc.css",
  "./css/calc-sgarbossa.css",
  "./css/calc-pesi.css",
  "./css/calc-nihss.css",
  "./css/calc-vas.css",
  "./css/calc-sad-persons.css",
  "./css/calc-shsn.css",
  "./css/calc-infusomat.css",
  "./css/calc-odn.css",
  "./css/calc-pediatric.css",

 // === JS: core ===
  "./js/core/version.js",
  "./js/core/theme-init.js",
  "./js/core/theme.js",
  "./js/core/app.js",
  "./js/core/modal.js",
  "./js/core/back.js",
  "./js/core/exporter.js",
  "./js/core/sw-register.js",
  "./js/core/changelog.js",
  "./js/core/update-notice.js",
  "./js/core/settings-backup.js",
  "./js/core/confirm.js",

  // === JS: schedule ===
  "./js/schedule/templates.js",
  "./js/schedule/shift-schedule.js",
  "./js/schedule/templates-admin.js",
  "./js/schedule/calendar-export.js",
  "./js/schedule/time-picker.js",

  // === JS: checklist ===
  "./js/checklist/equipment-data.js",
  "./js/checklist/equipment-checklist.js",
  "./js/checklist/used-items.js",
  "./js/checklist/medical-picker.js",
  "./js/checklist/medical-items.js",
  "./js/checklist/medical-tables.js",

  // === JS: cheats ===
  "./js/cheats/markdown.js",
  "./js/cheats/cheatsheet.js",
  "./js/cheats/drugs-data.js",
  "./js/cheats/drugs-db.js",

  // === JS: calculators ===
  "./js/calculators/calculators-list.js",
  "./js/calculators/calculator-utils.js",
  "./js/calculators/calc-algover.js",
  "./js/calculators/calc-apgar.js",
  "./js/calculators/calc-ciwa.js",
  "./js/calculators/calc-drug-converter.js",
  "./js/calculators/calc-ett-size.js",
  "./js/calculators/calc-fast-ed.js",
  "./js/calculators/calc-four.js",
  "./js/calculators/calc-geneva.js",
  "./js/calculators/calc-glasgow.js",
  "./js/calculators/calc-killip.js",
  "./js/calculators/calc-qtc.js",
  "./js/calculators/calc-sgarbossa.js",
  "./js/calculators/calc-pesi.js",
  "./js/calculators/calc-nihss.js",
  "./js/calculators/calc-vas.js",
  "./js/calculators/calc-sad-persons.js",
  "./js/calculators/calc-shsn.js",
  "./js/calculators/calc-infusomat.js",
  "./js/calculators/calc-odn.js",
  "./js/calculators/calc-pediatric.js",

  // === Pages ===
  "./pages/calculators.html",
  "./pages/calc-algover.html",
  "./pages/calc-apgar.html",
  "./pages/calc-ciwa.html",
  "./pages/calc-drug-converter.html",
  "./pages/calc-ett-size.html",
  "./pages/calc-fast-ed.html",
  "./pages/calc-four.html",
  "./pages/calc-geneva.html",
  "./pages/calc-glasgow.html",
  "./pages/cheatsheets.html",
  "./pages/settings.html",
  "./pages/shift-schedule.html",
  "./pages/templates.html",
  "./pages/shift-checklist.html",
  "./pages/equipment-checklist.html",
  "./pages/used-items.html",
  "./pages/drug.html",
  "./pages/drugs.html",
  "./pages/coming-soon.html",
  "./pages/policlinic.html",
  "./pages/inform-grounds.html",
  "./pages/unconscious-public.html",
  "./pages/call-card-110.html",
  "./pages/calc-killip.html",
  "./pages/calc-qtc.html",
  "./pages/calc-sgarbossa.html",
  "./pages/calc-pesi.html",
  "./pages/calc-nihss.html",
  "./pages/calc-vas.html",
  "./pages/calc-sad-persons.html",
  "./pages/calc-shsn.html",
  "./pages/calc-infusomat.html",
  "./pages/calc-odn.html",
  "./pages/calc-pediatric.html",

  // === Vendor ===
  "./vendor/html2canvas.min.js"
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
  "./data/drugs-index.json",
  "./data/content.json"              // ← добавьте, если используется в приложении
];

caches.open(CACHE_NAME).then(function (cache) {
  return Promise.all(APP_SHELL.map(function (url) {
    return fetch(url, { cache: "no-cache" })
      .then(function (resp) {
        if (!resp.ok) {
          console.warn("[SW] APP_SHELL пропущен (HTTP " + resp.status + "):", url);
          return null;
        }
        return cache.put(url, resp);
      })
      .catch(function (err) {
        console.warn("[SW] APP_SHELL пропущен (fetch error):", url, err);
        return null;
      });
  }));
}).catch(function (err) {
  console.error("APP_SHELL cache failed:", err);
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

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Данные — network-first с fallback на кэш
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Навигация — network-first с fallback на кэш или index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => {
          return cached || caches.match("./index.html");
        }))
    );
    return;
  }

  // Остальные ресурсы — network-first с fallback на кэш (всегда свежие CSS/JS при сети, офлайн — из кэша)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});