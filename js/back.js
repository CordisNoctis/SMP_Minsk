(function () {
  "use strict";

  var HISTORY_KEY = "smp-nav-history-v1";
  var MAX_HISTORY = 20;
  var isNavigating = false;

  function getStack() {
    try {
      var raw = sessionStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveStack(stack) {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(stack));
    } catch (e) {}
  }

  function getCurrentPath() {
    return window.location.pathname + window.location.search;
  }

  // Записываем текущую страницу в стек навигации при загрузке
  function recordCurrentPage() {
    var current = getCurrentPath();
    var stack = getStack();

    // Не добавляем дубль, если страница уже последняя в стеке
    if (stack[stack.length - 1] === current) return;

    stack.push(current);
    if (stack.length > MAX_HISTORY) stack.shift();
    saveStack(stack);
  }

  function goBack(fallback) {
    if (isNavigating) return;
    isNavigating = true;

    var stack = getStack();
    var current = getCurrentPath();

    // Убираем текущую страницу из стека
    if (stack[stack.length - 1] === current) {
      stack.pop();
    }

    // Берём предыдущую страницу
    var prev = stack.pop();
    saveStack(stack);

    if (prev) {
      window.location.href = prev;
    } else {
      // Если предыдущей страницы нет — идём на запасную
      window.location.href = fallback || "../index.html";
    }
  }

  function init() {
    recordCurrentPage();

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-back]");
      if (!btn) return;

      e.preventDefault();
      var fallback = btn.getAttribute("data-back-fallback") || "../index.html";
      goBack(fallback);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();