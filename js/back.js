(function () {
  "use strict";

  function init() {
    // Клик по кнопке [data-back] — переход на data-back-fallback
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-back]");
      if (!btn) return;

      e.preventDefault();
      var fallback = btn.getAttribute("data-back-fallback") || "../index.html";

      // Обычная навигация — добавляет запись в историю браузера.
      // Физическая кнопка "назад" браузера работает корректно.
      window.location.href = fallback;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();