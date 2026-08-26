(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async function () {
    try {
      var path = window.location.pathname;
      var isPagesFolder = path.indexOf("/pages/") !== -1;

      var swUrl = isPagesFolder ? "../sw.js" : "./sw.js";

      await navigator.serviceWorker.register(swUrl);
    } catch (error) {
      console.warn("Не удалось зарегистрировать Service Worker:", error);
    }
  });
})();