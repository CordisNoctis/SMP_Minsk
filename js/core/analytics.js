/* ===== Веб-аналитика: Google Analytics 4 + Яндекс Метрика =====
 *
 * Подключается автоматически на ВСЕХ страницах приложения
 * (загрузчик — в js/core/sw-register.js).
 *
 * КАК ВКЛЮЧИТЬ: вставьте свои идентификаторы в две константы ниже.
 *   GA4_ID     — из Google Analytics 4 (формат "G-XXXXXXXXXX");
 *   METRIKA_ID — номер счётчика Яндекс Метрики (число в кавычках).
 * Пустая строка "" = соответствующий счётчик выключен.
 *
 * Работает только при интернете: офлайн-запуск ничего не ломает —
 * загрузка внешних скриптов просто не удаётся. Запросы к аналитике
 * в офлайн-кэш приложения не попадают.
 */
(function () {
  "use strict";

  var GA4_ID = "G-7J9LC1EG4R";      // ← вставьте сюда "G-XXXXXXXXXX"
  var METRIKA_ID = "113976097";  // ← вставьте сюда номер счётчика, например "98765432"

  try {
    if (GA4_ID) initGa4();
  } catch (e) { /* аналитика не должна влиять на работу приложения */ }

  try {
    if (METRIKA_ID) initMetrika();
  } catch (e) { /* аналитика не должна влиять на работу приложения */ }

  // Событие «открыто приложение» с номером версии — в отчётах видно,
  // до каких пользователей дошли обновления
  function version() {
    return window.SMP_VERSION || "unknown";
  }

  function initGa4() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(s);

    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);
    window.gtag("event", "app_open", { app_version: version() });
  }

  function initMetrika() {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    window.ym(METRIKA_ID, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true   // запись сессий выключена; при желании поставьте true
    });
    window.ym(METRIKA_ID, "reachGoal", "app_open", { app_version: version() });
  }
})();