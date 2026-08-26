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

  function normalizePath(href) {
    try {
      var a = document.createElement("a");
      a.href = href;
      return a.pathname + a.search;
    } catch (e) {
      return window.location.pathname + window.location.search;
    }
  }

  function getCurrentPath() {
    return window.location.pathname + window.location.search;
  }

  function isSamePage(path1, path2) {
    return normalizePath(path1) === normalizePath(path2);
  }

  // Записываем текущую страницу в стек при загрузке
  function recordCurrentPage() {
    var current = getCurrentPath();
    var stack = getStack();

    // Не добавляем дубль
    if (stack.length > 0 && isSamePage(stack[stack.length - 1], current)) {
      return;
    }

    stack.push(current);
    if (stack.length > MAX_HISTORY) stack.shift();
    saveStack(stack);
  }

  function goBack(fallback) {
    if (isNavigating) return;
    isNavigating = true;

    var stack = getStack();
    var current = getCurrentPath();

    // Убираем текущую страницу
    while (stack.length > 0 && isSamePage(stack[stack.length - 1], current)) {
      stack.pop();
    }

    var prev = stack.pop();
    saveStack(stack);

    if (prev) {
      window.location.href = prev;
    } else {
      window.location.href = fallback || "../index.html";
    }
  }

  // Обработка физической кнопки "Назад" браузера
  function handlePopState() {
    if (isNavigating) {
      isNavigating = false;
      return;
    }

    var stack = getStack();
    var current = getCurrentPath();

    // Убираем текущую страницу из стека (она "закрыта")
    while (stack.length > 0 && isSamePage(stack[stack.length - 1], current)) {
      stack.pop();
    }

    var prev = stack.pop();
    saveStack(stack);

    if (prev) {
      // Переходим на предыдущую страницу из стека
      window.location.href = prev;
    } else {
      // Стек пуст — возвращаем на главную
      window.location.href = "../index.html";
    }
  }

  function init() {
    recordCurrentPage();

    // Клик по кнопке [data-back]
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-back]");
      if (!btn) return;

      e.preventDefault();
      var fallback = btn.getAttribute("data-back-fallback") || "../index.html";
      goBack(fallback);
    });

    // Физическая кнопка "Назад" / жест свайпа назад
    window.addEventListener("popstate", handlePopState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();