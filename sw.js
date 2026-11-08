/*
 * SMP Minsk — сервис-воркер (офлайн-кэш и обновления).
 *
 * Как это работает:
 * 1. Весь список файлов приложения и хэш сборки (SW_BUILD) записываются
 *    автоматически в блок между маркерами ===@smp-build-start/end===
 *    (GitHub Action при каждой публикации — файл .github/scripts/sw-build.sh).
 * 2. Кэш называется smp-pwa-<хэш>: любое изменение любого файла на GitHub
 *    меняет хэш → браузер скачивает ЦЕЛИКОМ новую версию в новый кэш.
 * 3. Все запросы сначала идут в кэш текущей версии — версия приложения
 *    всегда цельная, смешивания старых и новых файлов не бывает.
 * 4. Когда новая версия скачана, пользователь видит баннер «Обновить».
 *    После нажатия приложение целиком переключается на новую версию,
 *    старый кэш удаляется.
 */

// ===@smp-build-start===
// ВНИМАНИЕ: этот блок создаётся автоматически (GitHub Action / .github/scripts/sw-build.sh).
// Не редактировать вручную — изменения будут перезаписаны при следующей публикации.
const SW_BUILD = "3bee2868ac";
const PRECACHE_LIST = [
  "./css/base.css",
  "./css/calc-algover.css",
  "./css/calc-apgar.css",
  "./css/calc-ciwa.css",
  "./css/calc-drug-converter.css",
  "./css/calc-fast-ed.css",
  "./css/calc-four.css",
  "./css/calc-geneva.css",
  "./css/calc-glasgow.css",
  "./css/calc-infusomat.css",
  "./css/calc-killip.css",
  "./css/calc-nihss.css",
  "./css/calc-odn.css",
  "./css/calc-pediatric.css",
  "./css/calc-pesi.css",
  "./css/calc-qtc.css",
  "./css/calc-sad-persons.css",
  "./css/calc-sgarbossa.css",
  "./css/calc-shsn.css",
  "./css/calc-vas.css",
  "./css/calculators-common.css",
  "./css/calculators-list.css",
  "./css/calculators.css",
  "./css/changelog.css",
  "./css/cheatsheet.css",
  "./css/checklist.css",
  "./css/components.css",
  "./css/doc-search.css",
  "./css/layout.css",
  "./css/medical-picker.css",
  "./css/mkb10.css",
  "./css/modals.css",
  "./css/ref-markdown.css",
  "./css/result-panel.css",
  "./css/schedule.css",
  "./css/styles.css",
  "./data/content.json",
  "./data/drugs-index.json",
  "./data/drugs.schema.json",
  "./data/drugs/_TEMPLATE.md",
  "./docs/call-card-110.md",
  "./docs/cp-acs.md",
  "./docs/cp-afib.md",
  "./docs/cp-ah.md",
  "./docs/cp-arrhythmic-syndromes.md",
  "./docs/cp-brady.md",
  "./docs/cp-bsk-preg.md",
  "./docs/cp-svt.md",
  "./docs/cp-syncope.md",
  "./docs/cp-vf-vt.md",
  "./docs/cp-xsn.md",
  "./docs/img/cp-acs-app13.svg",
  "./docs/img/cp-acs-app4.svg",
  "./docs/img/cp-acs-app6.svg",
  "./docs/img/cp-acs-app7.svg",
  "./docs/img/cp-acs-app8.svg",
  "./docs/img/cp-ah-app9.svg",
  "./docs/img/cp-bsk-preg-app1.svg",
  "./docs/img/cp-bsk-preg-app10.svg",
  "./docs/img/cp-bsk-preg-app2.svg",
  "./docs/img/cp-bsk-preg-app3.svg",
  "./docs/img/cp-bsk-preg-app4.svg",
  "./docs/img/cp-bsk-preg-app5.svg",
  "./docs/img/cp-bsk-preg-app6.svg",
  "./docs/img/cp-bsk-preg-app7.svg",
  "./docs/img/cp-bsk-preg-app8.svg",
  "./docs/img/cp-bsk-preg-app9.svg",
  "./docs/img/posmertnyj_epikriz.svg",
  "./docs/img/xsn-app1.svg",
  "./docs/img/xsn-app2.svg",
  "./docs/img/xsn-app3.svg",
  "./docs/img/xsn-app4.svg",
  "./docs/img/xsn-app5.svg",
  "./docs/inform-grounds.md",
  "./docs/policlinic.md",
  "./docs/prikaz-713-konstataciya-smerti.md",
  "./docs/suicide-report.md",
  "./docs/unconscious-public.md",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/favicon.ico",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./js/calculators/calc-algover.js",
  "./js/calculators/calc-apgar.js",
  "./js/calculators/calc-ciwa.js",
  "./js/calculators/calc-drug-converter.js",
  "./js/calculators/calc-fast-ed.js",
  "./js/calculators/calc-four.js",
  "./js/calculators/calc-geneva.js",
  "./js/calculators/calc-glasgow.js",
  "./js/calculators/calc-infusomat.js",
  "./js/calculators/calc-killip.js",
  "./js/calculators/calc-nihss.js",
  "./js/calculators/calc-odn.js",
  "./js/calculators/calc-pediatric.js",
  "./js/calculators/calc-pesi.js",
  "./js/calculators/calc-qtc.js",
  "./js/calculators/calc-sad-persons.js",
  "./js/calculators/calc-sgarbossa.js",
  "./js/calculators/calc-shsn.js",
  "./js/calculators/calc-vas.js",
  "./js/calculators/calculator-utils.js",
  "./js/calculators/calculators-list.js",
  "./js/cheats/cheatsheet.js",
  "./js/cheats/drugs-data.js",
  "./js/cheats/drugs-db.js",
  "./js/cheats/markdown.js",
  "./js/cheats/md/mkb10.md",
  "./js/cheats/mkb10-db.js",
  "./js/checklist/equipment-checklist.js",
  "./js/checklist/equipment-data.js",
  "./js/checklist/medical-items.js",
  "./js/checklist/medical-picker.js",
  "./js/checklist/medical-tables.js",
  "./js/checklist/used-items.js",
  "./js/core/analytics.js",
  "./js/core/app.js",
  "./js/core/back.js",
  "./js/core/changelog-render.js",
  "./js/core/changelog.js",
  "./js/core/confirm.js",
  "./js/core/doc-search.js",
  "./js/core/exporter.js",
  "./js/core/global-search.js",
  "./js/core/install-prompt.js",
  "./js/core/modal.js",
  "./js/core/ref-markdown.js",
  "./js/core/settings-backup.js",
  "./js/core/sw-register.js",
  "./js/core/theme-init.js",
  "./js/core/theme.js",
  "./js/core/update-notice.js",
  "./js/core/version.js",
  "./js/references/ref-algover.js",
  "./js/references/ref-apgar.js",
  "./js/references/ref-ciwa.js",
  "./js/references/ref-drug-converter.js",
  "./js/references/ref-fast-ed.js",
  "./js/references/ref-four.js",
  "./js/references/ref-geneva.js",
  "./js/references/ref-glasgow.js",
  "./js/references/ref-infusomat.js",
  "./js/references/ref-killip.js",
  "./js/references/ref-nihss.js",
  "./js/references/ref-odn.js",
  "./js/references/ref-qtc.js",
  "./js/references/ref-sgarbossa.js",
  "./js/references/ref-shsn.js",
  "./js/references/ref-vas.js",
  "./js/schedule/calendar-export.js",
  "./js/schedule/ics-export.js",
  "./js/schedule/shift-schedule.js",
  "./js/schedule/templates-admin.js",
  "./js/schedule/templates.js",
  "./js/schedule/time-picker.js",
  "./manifest.webmanifest",
  "./pages/calc-algover.html",
  "./pages/calc-apgar.html",
  "./pages/calc-ciwa.html",
  "./pages/calc-drug-converter.html",
  "./pages/calc-fast-ed.html",
  "./pages/calc-four.html",
  "./pages/calc-geneva.html",
  "./pages/calc-glasgow.html",
  "./pages/calc-infusomat.html",
  "./pages/calc-killip.html",
  "./pages/calc-nihss.html",
  "./pages/calc-odn.html",
  "./pages/calc-pediatric.html",
  "./pages/calc-pesi.html",
  "./pages/calc-qtc.html",
  "./pages/calc-sad-persons.html",
  "./pages/calc-sgarbossa.html",
  "./pages/calc-shsn.html",
  "./pages/calc-vas.html",
  "./pages/calculators.html",
  "./pages/cheatsheets.html",
  "./pages/coming-soon.html",
  "./pages/doc-md.html",
  "./pages/drug.html",
  "./pages/drugs.html",
  "./pages/equipment-checklist.html",
  "./pages/mkb10-code.html",
  "./pages/mkb10.html",
  "./pages/normative-base.html",
  "./pages/settings.html",
  "./pages/shift-checklist.html",
  "./pages/shift-schedule.html",
  "./pages/templates.html",
  "./pages/used-items.html",
  "./vendor/html2canvas.min.js",
];
// ===@smp-build-end===

const CACHE_NAME = "smp-pwa-" + SW_BUILD;

// ===== Установка: заранее скачиваем все файлы приложения в новый кэш =====
// (выполняется один раз при появлении новой версии, а не при каждом запуске)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_LIST.map((url) =>
          fetch(url, { cache: "reload" })
            .then((resp) => {
              if (resp.ok) return cache.put(url, resp);
              console.warn("[SW] пропущен (HTTP " + resp.status + "):", url);
            })
            .catch((err) => console.warn("[SW] не удалось скачать:", url, err))
        )
      )
    )
  );
});

// ===== Активация: удаляем кэши всех старых версий =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ===== Команда от баннера обновления =====
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ===== Запросы: кэш текущей версии → сеть → офлайн-заглушка =====
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Документы: network-first с fallback на кэш (всегда свежие при сети)
  const isDocument = url.pathname.indexOf("/js/documents/") !== -1 ||
                     url.pathname.indexOf("/pages/inform-") !== -1;

  if (isDocument) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          // Обновляем кэш свежей копией
          if (response.ok && response.type === "basic") {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone()).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Загрузка из сети с сохранением в кэш; офлайн — заглушка
  const fromNetwork = (cache) =>
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Сети нет и в кэше нет: для страницы показываем главную,
        // для остальных файлов — ошибку.
        if (request.mode === "navigate") {
          return cache.match("./index.html").then((page) => page || Response.error());
        }
        return Response.error();
      });

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        // Файл есть в кэше текущей версии — отдаём мгновенно.
        if (cached) return cached;

        // Переход на страницу с параметрами (например, doc-md.html?file=…)
        // ищем в кэше без учёта части после «?»
        if (request.mode === "navigate") {
          return cache
            .match(request, { ignoreSearch: true })
            .then((page) => page || fromNetwork(cache));
        }
        return fromNetwork(cache);
      })
    )
  );
});
