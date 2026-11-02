(function () {
  "use strict";

  // ===== ДАННЫЕ КАЛЬКУЛЯТОРОВ (Приоритет убран) =====
  window.SMP = window.SMP || {};
  window.SMP.CALCULATORS = [
    { id: "geneva-score",   title: "Клиническая оценка вероятности ТЭЛА (Женевская шкала)",  emoji: "🫀", categories: ["Кардиология", "Реанимация и ИТ"], page: "calc-geneva.html" },
    { id: "glasgow-coma",   title: "Шкала комы Глазго (ШКГ)",                                emoji: "🧠", categories: ["Неврология", "Реанимация и ИТ", "Хирургия и травматология", "Педиатрия"], page: "calc-glasgow.html" },
    { id: "four-score",     title: "Шкала комы FOUR",                                        emoji: "🧠", categories: ["Неврология", "Реанимация и ИТ"], page: "calc-four.html" },
    { id: "sad-persons",    title: "Шкала оценки риска суицида (SAD PERSONS)",                emoji: "💭", categories: ["Психиатрия", "Реанимация и ИТ"], page: "calc-sad-persons.html" },
    { id: "pediatric",      title: "Педиатрические калькуляторы (основаны на ленте Broselow)",            emoji: "👶", categories: ["Педиатрия", "Реанимация и ИТ"], page: "calc-pediatric.html" },
    { id: "apgar",          title: "Шкала Апгар",                                            emoji: "👶", categories: ["Педиатрия", "Акушерство и гинекология", "Реанимация и ИТ"], page: "calc-apgar.html" },
    { id: "ciwa-ar",        title: "Шкала оценки отмены алкоголя (CIWA-Ar)",                  emoji: "💭", categories: ["Психиатрия", "Реанимация и ИТ"], page: "calc-ciwa.html" },
    { id: "nihss",          title: "Шкала инсульта NIHSS",                                   emoji: "🧠", categories: ["Неврология", "Реанимация и ИТ"], page: "calc-nihss.html" },
    { id: "killip",         title: "Тяжесть сердечной недостаточности (Killip)",             emoji: "🫀", categories: ["Кардиология", "Реанимация и ИТ"], page: "calc-killip.html" },
    { id: "vas",            title: "Шкала ВАШ (визуально-аналоговая шкала боли)",             emoji: "😣", categories: ["Реанимация и ИТ", "Хирургия и травматология", "Неврология"], page: "calc-vas.html" },
    { id: "fast-ed",        title: "Усечённая шкала FAST-ED",                                emoji: "🧠", categories: ["Неврология", "Реанимация и ИТ"], page: "calc-fast-ed.html" },
    { id: "algover",        title: "Индекс Альговера (шоковый индекс)",                       emoji: "🩸", categories: ["Реанимация и ИТ", "Хирургия и травматология", "Акушерство и гинекология"], page: "calc-algover.html" },
    { id: "drug-converter", title: "Перевод мг ↔ мл ↔ %",                                     emoji: "💊", categories: ["Реанимация и ИТ", "Фармакология"], page: "calc-drug-converter.html" },
    { id: "pesi-score",     title: "Шкала PESI (тяжесть ТЭЛА)",                              emoji: "🫀", categories: ["Кардиология", "Реанимация и ИТ"], page: "calc-pesi.html" },
    { id: "infusomat",      title: "Расчёт скорости инфузии",                                emoji: "💉", categories: ["Реанимация и ИТ", "Фармакология"], page: "calc-infusomat.html" },
    { id: "odn-scale",      title: "Шкала Кассиля (степень ОДН)",                            emoji: "🫁", categories: ["Реанимация и ИТ", "Пульмонология"], page: "calc-odn.html" },
    { id: "shsn-scale",     title: "Шкала оценки клинического состояния при ХСН",             emoji: "🫀", categories: ["Кардиология", "Реанимация и ИТ"], page: "calc-shsn.html" },
    { id: "sgarbossa",      title: "Критерии Сгарбосса (ИМ при БЛНПГ)",                       emoji: "📈", categories: ["Кардиология", "Реанимация и ИТ"], page: "calc-sgarbossa.html" },
    { id: "qtc-bazett",     title: "Коррекция интервала QT (QTc по Bazett)",                  emoji: "📈", categories: ["Кардиология", "Реанимация и ИТ"], page: "calc-qtc.html" }
  ];

  // ===== КОНСТАНТЫ =====
  var CATEGORIES = [
    { id: "Реанимация и ИТ",         emoji: "" },
    { id: "Неврология",               emoji: "🧠" },
    { id: "Кардиология",              emoji: "🩺" },
    { id: "Педиатрия",                emoji: "👶" },
    { id: "Хирургия и травматология", emoji: "🦴" },
    { id: "Акушерство и гинекология", emoji: "" },
    { id: "Пульмонология",            emoji: "🫁" },
    { id: "Психиатрия",               emoji: "💭" },
    { id: "Фармакология",             emoji: "💊" }
  ];

  var state = {
    search: "",
    draftCategories: [],  // временные (в модалке, не применены)
    appliedCategories: [], // применённые
    sort: "default"
  };

  // ===== ИЗБРАННОЕ / НЕДАВНИЕ / СОРТИРОВКА (хранение) =====
  var FAV_KEY = "smp-calc-favorites";
  var USAGE_KEY = "smp-calc-usage";
  var SORT_KEY = "smp-calc-sort";

  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function saveFavorites(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function loadUsage() {
    try { return JSON.parse(localStorage.getItem(USAGE_KEY)) || {}; } catch (e) { return {}; }
  }
  function recordUsage(id) {
    var usage = loadUsage();
    usage[id] = Date.now();
    try { localStorage.setItem(USAGE_KEY, JSON.stringify(usage)); } catch (e) {}
  }
  function loadSort() {
    var saved = null;
    try { saved = localStorage.getItem(SORT_KEY); } catch (e) {}
    return ["default", "alpha", "recent"].indexOf(saved) !== -1 ? saved : "default";
  }

  // ===== DOM =====
  var listEl, emptyEl, filterSummaryEl, filterSummaryText, filterBadge;
  var openFiltersBtn, searchInput, searchClearBtn, clearActiveFiltersBtn, emptyResetBtn;
  var modal, backdrop, closeBtn, resetBtn, applyBtn;
  var filterCategoriesEl, sortBar;

  // ===== РЕНДЕР ЧИПСОВ В МОДАЛКЕ =====
  function renderFilterChips() {
    filterCategoriesEl.innerHTML = CATEGORIES.map(function (c) {
      var active = state.draftCategories.indexOf(c.id) !== -1 ? " active" : "";
      return '<button type="button" class="filter-chip' + active + '" data-cat="' + c.id + '">' +
        '<span class="filter-chip-emoji">' + c.emoji + '</span>' +
        '<span class="filter-chip-label">' + c.id + '</span>' +
        '<span class="filter-chip-check">✓</span>' +
      '</button>';
    }).join("");
  }

  // ===== РЕНДЕР СПИСКА КАЛЬКУЛЯТОРОВ =====
  function filterList() {
    var list = window.SMP.CALCULATORS || [];
    var q = state.search.trim().toLowerCase();

    return list.filter(function (calc) {
      // 1. Поиск по тексту
      if (q) {
        var titleMatch = calc.title.toLowerCase().indexOf(q) !== -1;
        var idMatch = calc.id.toLowerCase().indexOf(q) !== -1;
        if (!titleMatch && !idMatch) return false;
      }

      // 2. Фильтр по категориям (AND — должны совпасть ВСЕ выбранные категории)
      if (state.appliedCategories.length > 0) {
        var hasAllCategories = state.appliedCategories.every(function (selectedCat) {
          return calc.categories && calc.categories.indexOf(selectedCat) !== -1;
        });
        if (!hasAllCategories) return false;
      }

      return true;
    });
  }

  // ===== Сортировка списка =====
  function sortList(list) {
    var arr = list.slice();
    if (state.sort === "alpha") {
      arr.sort(function (a, b) { return a.title.localeCompare(b.title, "ru"); });
    } else if (state.sort === "recent") {
      var usage = loadUsage();
      arr.sort(function (a, b) { return (usage[b.id] || 0) - (usage[a.id] || 0); });
    }
    return arr; // "default" — порядок из общего списка
  }

  function renderCards(list, favorites) {
    return list.map(function (calc) {
      var fav = favorites.indexOf(calc.id) !== -1;
      var catsText = (calc.categories || []).slice(0, 2).join(" · ");
      return '<a class="calc-compact-card" href="' + calc.page + '" data-id="' + calc.id + '">' +
        '<div class="calc-compact-icon"><span>' + calc.emoji + '</span></div>' +
        '<div class="calc-compact-title">' +
          '<div class="calc-card-main">' + calc.title + '</div>' +
          '<div class="calc-card-meta">' +
            '<span class="calc-card-cats">' + catsText + '</span>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="calc-fav-btn' + (fav ? " active" : "") + '" data-fav="' + calc.id + '"' +
          ' aria-label="' + (fav ? "Убрать из избранного" : "Добавить в избранное") + '"' +
          ' title="' + (fav ? "Убрать из избранного" : "Добавить в избранное") + '">' +
          (fav ? "★" : "☆") +
        '</button>' +
        '<div class="calc-compact-arrow">›</div>' +
      '</a>';
    }).join("");
  }

  function renderList() {
    var filtered = filterList();

    if (filtered.length === 0) {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;

    var favorites = loadFavorites();
    var isFav = function (calc) { return favorites.indexOf(calc.id) !== -1; };

    var favCards = filtered.filter(isFav);
    var restCards = filtered.filter(function (c) { return !isFav(c); });

    var html = "";
    if (favCards.length > 0) {
      html += '<div class="calc-group-title">⭐ Избранные</div>';
      html += renderCards(favCards, favorites);
      if (restCards.length > 0) {
        html += '<div class="calc-group-title">Все калькуляторы</div>';
      }
    }
    html += renderCards(sortList(restCards), favorites);

    listEl.innerHTML = html;
  }

  // ===== СВОДКА ФИЛЬТРОВ =====
  function updateFilterSummary() {
    var totalActive = state.appliedCategories.length;

    if (totalActive === 0) {
      filterBadge.hidden = true;
    } else {
      filterBadge.hidden = false;
      filterBadge.textContent = totalActive;
    }

    if (totalActive === 0) {
      filterSummaryEl.hidden = true;
      return;
    }

    filterSummaryEl.hidden = false;
    var parts = [];
    if (state.appliedCategories.length > 0) {
      parts.push(state.appliedCategories.join(", "));
    }

    var filtered = filterList();
    filterSummaryText.textContent = parts.join(" · ") + " — найдено: " + filtered.length;
  }

  // ===== МОДАЛКА =====
  function openFilters() {
    state.draftCategories = state.appliedCategories.slice();
    renderFilterChips();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeFiltersNoApply() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function applyFilters() {
    state.appliedCategories = state.draftCategories.slice();
    closeFiltersNoApply();
    renderList();
    updateFilterSummary();
  }

  function resetFilters() {
    state.draftCategories = [];
    renderFilterChips();
  }

  function resetAppliedFilters() {
    state.appliedCategories = [];
    state.draftCategories = [];
    renderFilterChips();
    renderList();
    updateFilterSummary();
  }

  // ===== ПОИСК =====
  function onSearchInput() {
    state.search = searchInput.value;
    searchClearBtn.hidden = state.search === "";
    renderList();
    updateFilterSummary();
  }

  function clearSearch() {
    searchInput.value = "";
    state.search = "";
    searchClearBtn.hidden = true;
    renderList();
    updateFilterSummary();
  }

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  function init() {
    listEl = document.getElementById("calculatorsList");
    emptyEl = document.getElementById("calcEmptyState");
    filterSummaryEl = document.getElementById("filterSummary");
    filterSummaryText = document.getElementById("filterSummaryText");
    filterBadge = document.getElementById("filterBadge");
    openFiltersBtn = document.getElementById("openFiltersBtn");
    searchInput = document.getElementById("calcSearchInput");
    searchClearBtn = document.getElementById("searchClearBtn");
    clearActiveFiltersBtn = document.getElementById("clearActiveFiltersBtn");
    emptyResetBtn = document.getElementById("emptyResetBtn");

    modal = document.getElementById("filters-modal");
    backdrop = document.getElementById("filtersBackdrop");
    closeBtn = document.getElementById("filtersCloseBtn");
    resetBtn = document.getElementById("filtersResetBtn");
    applyBtn = document.getElementById("filtersApplyBtn");
    filterCategoriesEl = document.getElementById("filterCategories");

    if (!listEl) return;

    // Обработчики кнопок
    openFiltersBtn.addEventListener("click", openFilters);
    closeBtn.addEventListener("click", closeFiltersNoApply);
    backdrop.addEventListener("click", closeFiltersNoApply);
    applyBtn.addEventListener("click", applyFilters);
    resetBtn.addEventListener("click", resetFilters);
    clearActiveFiltersBtn.addEventListener("click", resetAppliedFilters);
    emptyResetBtn.addEventListener("click", resetAppliedFilters);

    // Поиск
    searchInput.addEventListener("input", onSearchInput);
    searchClearBtn.addEventListener("click", clearSearch);

    // Escape закрывает модалку
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeFiltersNoApply();
    });

    // Клик по чипсам
    modal.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;

      var catId = chip.getAttribute("data-cat");
      if (catId) {
        var idx = state.draftCategories.indexOf(catId);
        if (idx !== -1) state.draftCategories.splice(idx, 1);
        else state.draftCategories.push(catId);
      }
      renderFilterChips();
    });

    // Сортировка (чипсы над списком)
    sortBar = document.getElementById("calcSortBar");
    state.sort = loadSort();
    if (sortBar) {
      sortBar.querySelectorAll(".calc-sort-chip").forEach(function (chip) {
        chip.classList.toggle("active", chip.getAttribute("data-sort") === state.sort);
      });
      sortBar.addEventListener("click", function (e) {
        var chip = e.target.closest(".calc-sort-chip");
        if (!chip) return;
        state.sort = chip.getAttribute("data-sort");
        try { localStorage.setItem(SORT_KEY, state.sort); } catch (err) {}
        sortBar.querySelectorAll(".calc-sort-chip").forEach(function (c) {
          c.classList.toggle("active", c === chip);
        });
        renderList();
      });
    }

    // Звёздочка избранного + учёт недавно открытых
    listEl.addEventListener("click", function (e) {
      var favBtn = e.target.closest(".calc-fav-btn");
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        var id = favBtn.getAttribute("data-fav");
        var favorites = loadFavorites();
        var idx = favorites.indexOf(id);
        if (idx !== -1) favorites.splice(idx, 1);
        else favorites.push(id);
        saveFavorites(favorites);
        renderList();
        return;
      }

      var card = e.target.closest("a.calc-compact-card");
      if (card) recordUsage(card.getAttribute("data-id"));
    });

    // Первый рендер
    renderList();
    updateFilterSummary();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();