(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) {
    return;
  }

  // ===== Всплывающее сообщение =====
  function showToast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.hidden = false; });
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3500);
  }

  // ===== Сообщение после обновления =====
  window.addEventListener("load", function () {
    try {
      if (sessionStorage.getItem("smp-sw-updated")) {
        sessionStorage.removeItem("smp-sw-updated");
        showToast("🔄 Приложение обновлено");
      }
    } catch (e) {}
  });

  window.addEventListener("load", function () {
    var swPath = window.location.pathname.includes("/pages/")
      ? "../sw.js"
      : "./sw.js";

    navigator.serviceWorker
      .register(swPath)
      .then(function (registration) {
        // Проверка обновлений при загрузке страницы
        registration.update();

        // Проверка обновлений каждые 30 минут
        setInterval(function () {
          registration.update();
        }, 30 * 60 * 1000);

        // Обнаружен новый SW
        registration.addEventListener("updatefound", function () {
          var newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", function () {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Активируем новую версию через 3 секунды
              setTimeout(function () {
                newWorker.postMessage("SKIP_WAITING");
              }, 3000);
            }
          });
        });
      })
      .catch(function (err) {
        console.error("SW registration failed:", err);
      });
  });

  // ===== Перезагрузка при активации нового SW =====
  // Не перезагружаем при самом первом запуске (когда SW ещё не было)
  var hadController = !!navigator.serviceWorker.controller;
  var refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (!hadController) {
      hadController = true; // первый запуск — без перезагрузки
      return;
    }
    if (refreshing) return;
    refreshing = true;
    try { sessionStorage.setItem("smp-sw-updated", "1"); } catch (e) {}
    window.location.reload();
  });
})();