(function () {
  "use strict";

  // ===== КОНСТАНТЫ =====
  var CATEGORIES = [
    { id: "Реанимация и ИТ",         emoji: "🫀" },
    { id: "Неврология",               emoji: "🧠" },
    { id: "Кардиология",              emoji: "🩺" },
    { id: "Педиатрия",                emoji: "👶" },
    { id: "Хирургия и травматология", emoji: "🦴" },
    { id: "Акушерство и гинекология", emoji: "🤰" },
    { id: "Пульмонология",            emoji: "🫁" },
    { id: "Психиатрия",               emoji: "💭" },
    { id: "Фармакология",             emoji: "💊" }
  ];

  var state = {
    search: "",
    draftCategories: [],   // временные (в модалке, не применены)
    appliedCategories: []  // применённые
  };

  // ===== DOM =====
  var listEl, emptyEl, filterSummaryEl, filterSummaryText, filterBadge;
  var openFiltersBtn, searchInput, searchClearBtn, clearActiveFiltersBtn, emptyResetBtn;
  var modal, backdrop, closeBtn, resetBtn, applyBtn;
  var filterCategoriesEl;

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
      // Поиск по тексту
      if (q) {
        var titleMatch = calc.title.toLowerCase().indexOf(q) !== -1;
        var idMatch = calc.id.toLowerCase().indexOf(q) !== -1;
        if (!titleMatch && !idMatch) return false;
      }

      // Фильтр по категориям (AND — должны совпасть ВСЕ выбранные категории)
      if (state.appliedCategories.length > 0) {
        var hasAllCategories = state.appliedCategories.every(function (selectedCat) {
          return calc.categories && calc.categories.indexOf(selectedCat) !== -1;
        });
        if (!hasAllCategories) return false;
      }

      return true;
    });
  }

  function renderList() {
    var filtered = filterList();

    if (filtered.length === 0) {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;
    listEl.innerHTML = filtered.map(function (calc) {
      var catsText = (calc.categories || []).slice(0, 2).join(" · ");
      return '<a class="calc-compact-card" href="' + calc.page + '" data-id="' + calc.id + '">' +
        '<div class="calc-compact-icon"><span>' + calc.emoji + '</span></div>' +
        '<div class="calc-compact-title">' +
          '<div class="calc-card-main">' + calc.title + '</div>' +
          '<div class="calc-card-meta">' +
            '<span class="calc-card-cats">' + catsText + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="calc-compact-arrow">›</div>' +
      '</a>';
    }).join("");
  }

  // ===== СВОДКА ФИЛЬТРОВ =====
  function updateFilterSummary() {
    var totalActive = state.appliedCategories.length;

    // Бейдж на кнопке
    if (totalActive === 0) {
      filterBadge.hidden = true;
    } else {
      filterBadge.hidden = false;
      filterBadge.textContent = totalActive;
    }

    // Сводка под панелью
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

    // Первый рендер
    renderList();
    updateFilterSummary();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();