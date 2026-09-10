(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) {
    return;
  }

  var pendingWorker = null;
  var POSTPONE_KEY = "smp-update-postponed";
  var UPDATED_KEY = "smp-sw-updated";

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

  // ===== Проверка: отложено ли обновление в этой сессии =====
  function isPostponed() {
    try { return sessionStorage.getItem(POSTPONE_KEY) === "1"; } catch (e) { return false; }
  }

  // ===== Создание баннера обновления (работает на любой странице) =====
  function createUpdateBanner() {
    var existing = document.getElementById("pwaUpdateBanner");
    if (existing) return existing;

    var banner = document.createElement("div");
    banner.className = "pwa-update-banner";
    banner.id = "pwaUpdateBanner";
    banner.hidden = true;
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "polite");

    var content = document.createElement("div");
    content.className = "pwa-update-banner-content";

    var icon = document.createElement("span");
    icon.className = "pwa-update-banner-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🆕";

    var text = document.createElement("span");
    text.className = "pwa-update-banner-text";
    text.textContent = "Доступна новая версия приложения";

    var postponeBtn = document.createElement("button");
    postponeBtn.type = "button";
    postponeBtn.className = "pwa-update-banner-btn-secondary";
    postponeBtn.id = "pwaPostponeBtn";
    postponeBtn.textContent = "Отложить";

    var updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.className = "pwa-update-banner-btn";
    updateBtn.id = "pwaUpdateBtn";
    updateBtn.textContent = "Обновить";

    content.appendChild(icon);
    content.appendChild(text);
    content.appendChild(postponeBtn);
    content.appendChild(updateBtn);
    banner.appendChild(content);
    document.body.appendChild(banner);

    return banner;
  }

  // ===== Показ баннера обновления =====
  function showUpdateBanner(newWorker) {
    pendingWorker = newWorker;

    var banner = createUpdateBanner();
    var updateBtn = document.getElementById("pwaUpdateBtn");
    var postponeBtn = document.getElementById("pwaPostponeBtn");
    if (!banner || !updateBtn || !postponeBtn) return;

    banner.hidden = false;

    // Кнопка «Обновить» — применяем обновление
    if (!updateBtn.dataset.bound) {
      updateBtn.dataset.bound = "1";
      updateBtn.addEventListener("click", function () {
        if (!pendingWorker) return;
        try {
          sessionStorage.setItem(UPDATED_KEY, "1");
          sessionStorage.removeItem(POSTPONE_KEY);
        } catch (e) {}
        banner.hidden = true;
        pendingWorker.postMessage("SKIP_WAITING");
      });
    }

    // Кнопка «Отложить» — скрываем до следующего запуска
    if (!postponeBtn.dataset.bound) {
      postponeBtn.dataset.bound = "1";
      postponeBtn.addEventListener("click", function () {
        try { sessionStorage.setItem(POSTPONE_KEY, "1"); } catch (e) {}
        banner.hidden = true;
      });
    }
  }

  // ===== Сообщение после обновления =====
  window.addEventListener("load", function () {
    try {
      if (sessionStorage.getItem(UPDATED_KEY)) {
        sessionStorage.removeItem(UPDATED_KEY);
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

        // Если новый SW скачан в прошлой сессии — показываем баннер сразу,
        // но не беспокоим повторно, если пользователь отложил в этой сессии
        if (registration.waiting && navigator.serviceWorker.controller && !isPostponed()) {
          showUpdateBanner(registration.waiting);
        }

        // Обнаружен новый SW
        registration.addEventListener("updatefound", function () {
          var newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", function () {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateBanner(newWorker);
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
    window.location.reload();
  });
})();