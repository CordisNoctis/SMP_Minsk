/* =========================================
   cheatsheets-list.js — шпаргалки в том же
   порядке, что нормативная база: одна колонка,
   панель поиск + фильтр-модалка + сортировка
   (А–Я / Дата / № / Недавние), избранное ⭐,
   сводка фильтров, единое пустое состояние.
   Подгруппы сохраняются; без моргания.
   ========================================= */
(function () {
  "use strict";

  var FAV_KEY = "smp-cheats-favorites";
  var USAGE_KEY = "smp-cheats-usage";
  var SORT_KEY = "smp-cheats-sort";
  var SORTS = ["default", "alpha-asc", "alpha-desc", "date-asc", "date-desc", "num-asc", "num-desc", "recent"];
  var MONTHS = {
    "января": 0, "февраля": 1, "марта": 2, "апреля": 3, "мая": 4, "июня": 5,
    "июля": 6, "августа": 7, "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11
  };

  var state = {
    search: "",
    draftGroups: [],
    appliedGroups: [],
    draftFav: false,
    appliedFav: false,
    sort: "default"
  };

  var root = null, groups = [], els = {};
  var favTitle = null, favCont = null;
  var suppress = 0, recollectTimer = null;

  function slice(x) { return Array.prototype.slice.call(x); }
  function text(el) { return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : ""; }
  function isCard(el) { return el && el.nodeType === 1 && el.matches("a.submenu-link"); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

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
    return SORTS.indexOf(saved) !== -1 ? saved : "default";
  }
  function saveSort() {
    try { localStorage.setItem(SORT_KEY, state.sort); } catch (e) {}
  }

  function cardId(card) {
    return card.getAttribute("data-page") || card.getAttribute("href") || "";
  }

  function parseMeta(card) {
    var title = text(card.querySelector(".submenu-main")) || text(card);
    var sub = text(card.querySelector(".submenu-sub"));
    var ts = null, num = null, m;
    m = sub.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (m) ts = new Date(+m[3], +m[2] - 1, +m[1]).getTime();
    if (ts === null) {
      m = sub.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i);
      if (m) ts = new Date(+m[3], MONTHS[m[2].toLowerCase()], +m[1]).getTime();
    }
    m = sub.match(/№\s*(\d+)/);
    if (m) num = parseInt(m[1], 10);
    return {
      id: cardId(card),
      title: title,
      sub: sub,
      hay: (title + " " + sub + " " + cardId(card)).toLowerCase(),
      ts: ts,
      num: num
    };
  }

  function isHeading(el) {
    if (!el || el.nodeType !== 1) return false;
    if (/^H[1-6]$/.test(el.tagName)) return true;
    return /group-title|section-title/.test(el.className || "");
  }
  function findHead(cont) {
    var h = cont.previousElementSibling;
    while (h && !isHeading(h)) h = h.previousElementSibling;
    if (!h && cont.parentElement) {
      h = cont.parentElement.previousElementSibling;
      while (h && !isHeading(h)) h = h.previousElementSibling;
    }
    return h;
  }

  function injectStars() {
    var favorites = loadFavorites();
    groups.forEach(function (g) {
      g.cards.forEach(function (c) {
        if (c.querySelector(".calc-fav-btn")) return;
        var id = c.__nsort.id;
        var fav = favorites.indexOf(id) !== -1;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "calc-fav-btn" + (fav ? " active" : "");
        b.setAttribute("data-fav", id);
        b.setAttribute("aria-pressed", fav ? "true" : "false");
        b.setAttribute("aria-label", fav ? "Убрать из избранного" : "Добавить в избранное");
        b.title = fav ? "Убрать из избранного" : "Добавить в избранное";
        b.textContent = fav ? "★" : "☆";
        c.appendChild(b);
      });
    });
  }

  function refreshStars() {
    var favorites = loadFavorites();
    groups.forEach(function (g) {
      g.cards.forEach(function (c) {
        var b = c.querySelector(".calc-fav-btn");
        if (!b) return;
        var fav = favorites.indexOf(c.__nsort.id) !== -1;
        b.classList.toggle("active", fav);
        b.setAttribute("aria-pressed", fav ? "true" : "false");
        b.setAttribute("aria-label", fav ? "Убрать из избранного" : "Добавить в избранное");
        b.title = fav ? "Убрать из избранного" : "Добавить в избранное";
        b.textContent = fav ? "★" : "☆";
      });
    });
  }

  function collect() {
    var all = slice(root.querySelectorAll("a.submenu-link"));
    all.forEach(function (c) {
      if (c.__group !== undefined) return;
      var cont = c.parentElement;
      if (!cont || cont === favCont) return;
      var idx = -1;
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].cont === cont) { idx = i; break; }
      }
      if (idx === -1) {
        idx = groups.length;
        groups.push({ cont: cont, head: null, cards: [], label: "" });
      }
      c.__group = idx;
    });

    groups.forEach(function (g, gi) {
      g.head = findHead(g.cont);
      g.label = g.head ? text(g.head) : "Документы";
      g.cards = all.filter(function (c) { return c.__group === gi; });
      g.cards.forEach(function (c, i) {
        if (!c.hasAttribute("data-nsort-i")) c.setAttribute("data-nsort-i", String(i));
        if (!c.__nsort) c.__nsort = parseMeta(c);
      });
    });

    if (groups.length && favCont && !favCont.className) {
      favCont.className = groups[0].cont.className || "list-grid";
    }
    injectStars();
  }

  function isVisible(card, favorites) {
    var q = state.search.trim().toLowerCase();
    if (q && card.__nsort.hay.indexOf(q) === -1) return false;
    if (state.appliedGroups.length > 0 && state.appliedGroups.indexOf(card.__group) === -1) return false;
    if (state.appliedFav && favorites.indexOf(card.__nsort.id) === -1) return false;
    return true;
  }

  function cmp(a, b) {
    var A = a.__nsort, B = b.__nsort, r = 0;
    var ia = +a.getAttribute("data-nsort-i"), ib = +b.getAttribute("data-nsort-i");
    if (state.sort === "alpha-asc") r = A.title.localeCompare(B.title, "ru");
    else if (state.sort === "alpha-desc") r = B.title.localeCompare(A.title, "ru");
    else if (state.sort === "date-asc" || state.sort === "date-desc") {
      if (A.ts === null && B.ts === null) r = 0;
      else if (A.ts === null) return 1;
      else if (B.ts === null) return -1;
      else r = state.sort === "date-asc" ? A.ts - B.ts : B.ts - A.ts;
    } else if (state.sort === "num-asc" || state.sort === "num-desc") {
      if (A.num === null && B.num === null) r = 0;
      else if (A.num === null) return 1;
      else if (B.num === null) return -1;
      else r = state.sort === "num-asc" ? A.num - B.num : B.num - A.num;
    } else if (state.sort === "recent") {
      var usage = loadUsage();
      r = (usage[B.id] || 0) - (usage[A.id] || 0);
    }
    if (r === 0) r = ia - ib;
    return r;
  }

  function reconcile(cont, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (cont.children[i] !== arr[i]) cont.appendChild(arr[i]);
    }
  }

  function apply() {
    suppress++;
    var favorites = loadFavorites();
    var totalVisible = 0, favVisible = 0;
    var favAll = [];
    var perGroup = groups.map(function () { return { all: [], visible: 0 }; });

    groups.forEach(function (g, gi) {
      g.cards.forEach(function (c) {
        var vis = isVisible(c, favorites);
        c.hidden = !vis;
        if (vis) totalVisible++;
        if (favorites.indexOf(c.__nsort.id) !== -1) {
          favAll.push(c);
          if (vis) favVisible++;
        } else {
          perGroup[gi].all.push(c);
          if (vis) perGroup[gi].visible++;
        }
      });
    });

    favAll.sort(cmp);
    reconcile(favCont, favAll);
    favTitle.hidden = favVisible === 0;
    favCont.hidden = favVisible === 0;

    groups.forEach(function (g, gi) {
      perGroup[gi].all.sort(cmp);
      reconcile(g.cont, perGroup[gi].all);
      var hide = perGroup[gi].visible === 0;
      g.cont.hidden = hide;
      if (g.head) g.head.hidden = hide;
    });

    els.empty.hidden = totalVisible !== 0;
    updateSummary(totalVisible);
    setTimeout(function () { suppress--; }, 0);
  }

  function updateSummary(totalVisible) {
    var active = state.appliedGroups.length + (state.appliedFav ? 1 : 0);
    els.badge.hidden = active === 0;
    els.badge.textContent = String(active);
    if (active === 0) {
      els.summary.hidden = true;
      return;
    }
    els.summary.hidden = false;
    var parts = [];
    if (state.appliedGroups.length) {
      parts.push(state.appliedGroups.map(function (i) { return groups[i] ? groups[i].label : ""; }).join(", "));
    }
    if (state.appliedFav) parts.push("только избранное");
    els.summaryText.textContent = parts.join(" · ") + " — найдено: " + totalVisible;
  }

  function updateSortBarUI() {
    slice(els.sortBar.querySelectorAll(".calc-sort-chip")).forEach(function (c) {
      var mode = c.getAttribute("data-sort");
      if (mode === "alpha") {
        var onA = state.sort === "alpha-asc" || state.sort === "alpha-desc";
        c.classList.toggle("active", onA);
        c.textContent = state.sort === "alpha-desc" ? "Я–А" : "А–Я";
        c.title = state.sort === "alpha-asc" ? "Сейчас А–Я (клик → Я–А)"
          : state.sort === "alpha-desc" ? "Сейчас Я–А (клик → сброс)"
          : "Сортировка по алфавиту";
      } else if (mode === "date") {
        var onD = state.sort === "date-asc" || state.sort === "date-desc";
        c.classList.toggle("active", onD);
        c.textContent = onD ? (state.sort === "date-asc" ? "Дата ↑" : "Дата ↓") : "Дата";
        c.title = state.sort === "date-asc" ? "Сейчас сначала старые (клик → сначала новые)"
          : state.sort === "date-desc" ? "Сейчас сначала новые (клик → сброс)"
          : "Сортировка по дате";
      } else if (mode === "num") {
        var onN = state.sort === "num-asc" || state.sort === "num-desc";
        c.classList.toggle("active", onN);
        c.textContent = onN ? (state.sort === "num-asc" ? "№ ↑" : "№ ↓") : "№";
        c.title = state.sort === "num-asc" ? "Сейчас по возрастанию номера (клик → по убыванию)"
          : state.sort === "num-desc" ? "Сейчас по убыванию номера (клик → сброс)"
          : "Сортировка по номеру";
      } else if (mode === "recent") {
        c.classList.toggle("active", state.sort === "recent");
        c.title = "Недавно открытые";
      }
    });
  }

  function setSort(mode) {
    if (mode === "alpha") {
      state.sort = state.sort === "default" ? "alpha-asc" : state.sort === "alpha-asc" ? "alpha-desc" : "default";
    } else if (mode === "date") {
      state.sort = state.sort === "date-asc" ? "date-desc" : state.sort === "date-desc" ? "default" : "date-asc";
    } else if (mode === "num") {
      state.sort = state.sort === "num-asc" ? "num-desc" : state.sort === "num-desc" ? "default" : "num-asc";
    } else if (mode === "recent") {
      state.sort = state.sort === "recent" ? "default" : "recent";
    }
    saveSort();
    updateSortBarUI();
    apply();
  }

  function chipHtml(kind, key, emoji, label, active) {
    return '<button type="button" class="filter-chip' + (active ? " active" : "") + '" data-' + kind + '="' + key + '">' +
      '<span class="filter-chip-emoji">' + emoji + '</span>' +
      '<span class="filter-chip-label">' + esc(label) + '</span>' +
      '<span class="filter-chip-check">✓</span>' +
      '</button>';
  }

  function renderFilterChips() {
    els.filterCategories.innerHTML = groups.map(function (g, i) {
      var m = g.label.match(/^([^\sA-Za-zА-Яа-яЁё0-9]+)\s*(.*)$/);
      var emoji = m ? m[1] : "📁";
      var label = m ? m[2] : g.label;
      return chipHtml("group", i, emoji, label, state.draftGroups.indexOf(i) !== -1);
    }).join("");
    els.filterExtra.innerHTML = chipHtml("extra", "fav", "⭐", "Только избранное", state.draftFav);
  }

  function openFilters() {
    state.draftGroups = state.appliedGroups.slice();
    state.draftFav = state.appliedFav;
    renderFilterChips();
    els.modal.hidden = false;
    els.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeFilters() {
    els.modal.hidden = true;
    els.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
  function applyFilters() {
    state.appliedGroups = state.draftGroups.slice();
    state.appliedFav = state.draftFav;
    closeFilters();
    apply();
  }
  function resetDraft() {
    state.draftGroups = [];
    state.draftFav = false;
    renderFilterChips();
  }
  function resetApplied() {
    state.appliedGroups = [];
    state.appliedFav = false;
    state.draftGroups = [];
    state.draftFav = false;
    renderFilterChips();
    apply();
  }

    // ===== Ставим секцию «🚨 Порядок действий и информирование» ПОД панель поиска =====
  function moveActionsSection() {
    var nav = root.querySelector("nav");
    if (!nav) return;

    var heads = slice(root.querySelectorAll(".menu-group-title, h2, h3"));
    var head = null;
    for (var i = 0; i < heads.length; i++) {
      if (/порядок действий/i.test(text(heads[i]))) { head = heads[i]; break; }
    }
    if (!head) return;

    var block = head.closest ? head.closest(".cheats-group") : null;
    if (!block) block = head.parentElement;
    if (!block) return;

    // секция уже стоит прямо перед <nav> — ничего не делаем
    if (nav.previousElementSibling === block) return;

    if (block === root) {
      // заголовок не обёрнут в контейнер: переносим его вместе со списком после него
      var listCont = head.nextElementSibling;
      root.insertBefore(head, nav);
      if (listCont && listCont !== nav) root.insertBefore(listCont, nav);
      return;
    }

    root.insertBefore(block, nav);
  }

  function buildUI() {
    // Теперь панель уже есть в HTML, просто находим элементы
    els.toolbar = root.querySelector(".calc-toolbar");
    els.openFilters = document.getElementById("ctOpenFiltersBtn");
    els.badge = document.getElementById("ctFilterBadge");
    els.search = document.getElementById("ctSearchInput");
    els.searchClear = document.getElementById("ctSearchClearBtn");
    els.sortBar = document.getElementById("ctSortBar");
    els.summary = root.querySelector(".calc-filter-summary");
    els.summaryText = document.getElementById("ctFilterSummaryText");
    els.clearActive = document.getElementById("ctClearActiveFiltersBtn");
    
    favTitle = root.querySelectorAll(".calc-group-title")[0];
    favCont = root.querySelectorAll(".list-grid")[0];
    if (!favCont.className) {
      favCont.className = groups.length ? (groups[0].cont.className || "list-grid") : "list-grid";
    }

    var empty = document.createElement("div");
    empty.className = "calc-empty-state";
    empty.hidden = true;
    empty.innerHTML =
      '<div class="calc-empty-icon">🔍</div>' +
      '<div class="calc-empty-title">Ничего не найдено</div>' +
      '<div class="calc-empty-desc">Попробуйте изменить запрос или сбросить фильтры</div>' +
      '<button type="button" class="btn-secondary" id="ctEmptyResetBtn">Сбросить фильтры</button>';

    root.appendChild(empty);
    els.empty = empty;
    els.emptyReset = empty.querySelector("#ctEmptyResetBtn");

    var modal = document.createElement("div");
    modal.className = "modal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML =
      '<div class="modal-backdrop" id="ctFiltersBackdrop"></div>' +
      '<section class="modal-panel filters-modal-panel" role="dialog" aria-modal="true">' +
        '<header class="modal-header">' +
          '<h2>🔍 Фильтры</h2>' +
          '<button type="button" class="modal-close" id="ctFiltersCloseBtn" aria-label="Закрыть без применения">✕</button>' +
        '</header>' +
        '<div class="modal-body">' +
          '<div class="filters-section">' +
            '<h3 class="filters-section-title"><span>📚</span> Подгруппы</h3>' +
            '<div class="filters-chips" id="ctFilterCategories"></div>' +
          '</div>' +
          '<div class="filters-section">' +
            '<h3 class="filters-section-title"><span>⭐</span> Дополнительно</h3>' +
            '<div class="filters-chips" id="ctFilterExtra"></div>' +
          '</div>' +
          '<div class="filters-hint">💡 Можно выбрать несколько подгрупп — будут показаны документы <strong>любой</strong> из выбранных. «Только избранное» ограничивает список вашими ⭐.</div>' +
        '</div>' +
        '<footer class="modal-footer filters-modal-footer">' +
          '<button type="button" class="btn-secondary" id="ctFiltersResetBtn">Сбросить</button>' +
          '<button type="button" class="btn-primary" id="ctFiltersApplyBtn">Применить</button>' +
        '</footer>' +
      '</section>';
    document.body.appendChild(modal);

    els.modal = modal;
    els.backdrop = modal.querySelector("#ctFiltersBackdrop");
    els.close = modal.querySelector("#ctFiltersCloseBtn");
    els.reset = modal.querySelector("#ctFiltersResetBtn");
    els.applyBtn = modal.querySelector("#ctFiltersApplyBtn");
    els.filterCategories = modal.querySelector("#ctFilterCategories");
    els.filterExtra = modal.querySelector("#ctFilterExtra");
  }

  function bind() {
    els.openFilters.addEventListener("click", openFilters);
    els.close.addEventListener("click", closeFilters);
    els.backdrop.addEventListener("click", closeFilters);
    els.applyBtn.addEventListener("click", applyFilters);
    els.reset.addEventListener("click", resetDraft);
    els.clearActive.addEventListener("click", resetApplied);
    els.emptyReset.addEventListener("click", resetApplied);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !els.modal.hidden) closeFilters();
    });

    els.modal.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;
      if (chip.hasAttribute("data-group")) {
        var gi = +chip.getAttribute("data-group");
        var idx = state.draftGroups.indexOf(gi);
        if (idx !== -1) state.draftGroups.splice(idx, 1);
        else state.draftGroups.push(gi);
      } else if (chip.getAttribute("data-extra") === "fav") {
        state.draftFav = !state.draftFav;
      }
      renderFilterChips();
    });

    els.search.addEventListener("input", function () {
      state.search = els.search.value;
      els.searchClear.hidden = state.search === "";
      apply();
    });
    els.searchClear.addEventListener("click", function () {
      els.search.value = "";
      state.search = "";
      els.searchClear.hidden = true;
      apply();
      els.search.focus();
    });

    els.sortBar.addEventListener("click", function (e) {
      var chip = e.target.closest(".calc-sort-chip");
      if (chip) setSort(chip.getAttribute("data-sort"));
    });

    root.addEventListener("click", function (e) {
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
        refreshStars();
        apply();
        return;
      }
      var card = e.target.closest("a.submenu-link");
      if (card) recordUsage(cardId(card));
    });
  }

  function init() {
    if (!/cheatsheets\.html$/i.test(window.location.pathname)) return;
    root = document.querySelector("main");
    if (!root) return;

    document.documentElement.classList.add("cheats-page");
    moveActionsSection();
    collect();
    buildUI();
    bind();
    state.sort = loadSort();
    updateSortBarUI();
    renderFilterChips();
    apply();

    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        if (suppress > 0) return;
        var relevant = muts.some(function (m) {
          return slice(m.addedNodes).some(function (n) {
            return isCard(n) || (n.nodeType === 1 && n.querySelector && n.querySelector("a.submenu-link"));
          });
        });
        if (!relevant) return;
        clearTimeout(recollectTimer);
        recollectTimer = setTimeout(function () {
          collect();
          moveActionsSection();
          renderFilterChips();
          apply();
        }, 150);
      }).observe(root, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();