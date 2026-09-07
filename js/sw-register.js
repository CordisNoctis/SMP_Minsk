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
    t.setAttribute("role", "alert");
    t.setAttribute("aria-live", "assertive");
    t.setAttribute("aria-atomic", "true");
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
              // Показываем баннер вместо автоматического обновления
              showUpdateBanner(newWorker);
            }
          });
        });
      })
      .catch(function (err) {
        console.error("SW registration failed:", err);
      });
  });

  // ===== Показ баннера обновления =====
  function showUpdateBanner(newWorker) {
    var banner = document.getElementById("pwaUpdateBanner");
    var btn = document.getElementById("pwaUpdateBtn");
    if (!banner || !btn) return;

    banner.hidden = false;

    btn.addEventListener("click", function () {
      try { sessionStorage.setItem("smp-sw-updated", "1"); } catch (e) {}
      newWorker.postMessage("SKIP_WAITING");
      banner.hidden = true;
    });
  }

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
    window.location.reload();
  });
})();