(function () {
  "use strict";

  function init() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-back]");
      if (!btn) return;

      e.preventDefault();
      var fallback = btn.getAttribute("data-back-fallback");

      // Если fallback указан — переходим туда
      if (fallback) {
        window.location.href = fallback;
        return;
      }

      // Иначе — пытаемся history.back()
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Крайний случай — на главную
        window.location.href = "../index.html";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();