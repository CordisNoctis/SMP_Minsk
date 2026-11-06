(function () {
  "use strict";

  // =====================================================
  // Глобальный поиск по приложению (кнопка 🔍 на главной).
  //
  // Ищет по: разделам приложения, калькуляторам,
  // документам нормативной базы, шпаргалкам.
  //
  // Индекс строится при первом открытии:
  //   - разделы и шпаргалки — встроенный список;
  //   - калькуляторы — из js/calculators/calculators-list.js
  //     (подгружается динамически, только данные);
  //   - документы — из ссылок pages/normative-base.html,
  //     поэтому новые протоколы попадают в поиск автоматически.
  // =====================================================

  var MIN_QUERY = 2;
  var MAX_RESULTS = 25;

  var SECTIONS = [
    { title: "Чек-лист смены", sub: "Рабочие инструменты", href: "pages/shift-checklist.html", emoji: "✅" },
    { title: "График смен", sub: "Рабочие инструменты · экспорт в календарь", href: "pages/shift-schedule.html", emoji: "🗓️" },
    { title: "Шпаргалки", sub: "Справочники", href: "pages/cheatsheets.html", emoji: "📋" },
    { title: "Клинические калькуляторы и шкалы", sub: "Справочники", href: "pages/calculators.html", emoji: "🧮" },
    { title: "Нормативная база", sub: "Справочники · приказы и протоколы", href: "pages/normative-base.html", emoji: "📚" },
    { title: "Инструкции лекарственных средств", sub: "Шпаргалки · препараты", href: "pages/drugs.html", emoji: "💊" },
    { title: "Коды МКБ-10", sub: "Шпаргалки · классификатор", href: "pages/mkb10.html", emoji: "🏷️" },
    { title: "Настройки", sub: "Система", href: "pages/settings.html", emoji: "⚙️" }
  ];

  var STYLES =
    "#globalSearchModal .modal-panel{max-width:560px;display:flex;flex-direction:column;max-height:calc(100vh - 32px);}" +
    "#globalSearchModal .modal-body{padding:0;display:flex;flex-direction:column;min-height:0;}" +
    ".gs-input-wrap{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--border);}" +
    ".gs-input-wrap .gs-icon{font-size:1.05rem;flex:0 0 auto;}" +
    ".gs-input{flex:1;min-width:0;min-height:42px;border:1px solid var(--border);border-radius:10px;" +
      "background:var(--bg);color:var(--text);font:inherit;font-size:0.98rem;padding:6px 12px;}" +
    ".gs-input:focus{outline:none;border-color:var(--accent);}" +
    ".gs-results{overflow-y:auto;padding:6px 8px 10px;}" +
    ".gs-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 10px;border:0;" +
      "border-radius:10px;background:transparent;color:var(--text);font:inherit;text-align:left;cursor:pointer;}" +
    ".gs-item:hover,.gs-item.gs-active{background:var(--menu-icon-bg);}" +
    ".gs-item-emoji{flex:0 0 auto;width:36px;height:36px;display:grid;place-items:center;font-size:1.1rem;" +
      "border-radius:10px;background:var(--menu-icon-bg);}" +
    ".gs-item.gs-active .gs-item-emoji{background:var(--card);}" +
    ".gs-item-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}" +
    ".gs-item-title{font-size:0.9rem;font-weight:700;line-height:1.3;}" +
    ".gs-item-title b{color:var(--accent);}" +
    ".gs-item-sub{font-size:0.76rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
    ".gs-item-arrow{flex:0 0 auto;color:var(--accent);font-size:1.1rem;}" +
    ".gs-empty{padding:26px 16px;text-align:center;color:var(--muted);font-size:0.88rem;line-height:1.5;}" +
    ".gs-hint{padding:8px 16px 10px;font-size:0.75rem;color:var(--muted);border-top:1px solid var(--border);}";

  var modalEl = null, inputEl = null, resultsEl = null, hintEl = null;
  var index = null;         // массив {title, sub, href, emoji}
  var indexPromise = null;
  var results = [];
  var activeIdx = -1;

  // ===== Построение индекса =====

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function calculatorsIndex() {
    if (window.SMP && window.SMP.CALCULATORS) return Promise.resolve();
    return loadScript("js/calculators/calculators-list.js").catch(function () {});
  }

  function docsIndex() {
    return fetch("pages/normative-base.html")
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var links = doc.querySelectorAll('a[href^="doc-md.html?file="]');
        var out = [];
        links.forEach(function (a) {
          var main = a.querySelector(".submenu-main");
          var sub = a.querySelector(".submenu-sub");
          var title = (main ? main.textContent : a.textContent).trim();
          if (!title) return;
          out.push({
            title: title,
            sub: (sub ? sub.textContent.trim() : "Документ"),
            href: "pages/" + a.getAttribute("href"),
            emoji: "📄"
          });
        });
        return out;
      })
      .catch(function () { return []; });
  }

  function buildIndex() {
    if (index) return Promise.resolve(index);
    if (indexPromise) return indexPromise;

    indexPromise = calculatorsIndex()
      .then(function () { return docsIndex(); })
      .then(function (docs) {
        var items = SECTIONS.slice();
        if (window.SMP && window.SMP.CALCULATORS) {
          window.SMP.CALCULATORS.forEach(function (c) {
            items.push({
              title: c.title,
              sub: "Калькулятор · " + (c.categories && c.categories.join(", ") || ""),
              href: "pages/" + c.page,
              emoji: c.emoji || "🧮"
            });
          });
        }
        index = items.concat(docs);
        return index;
      });

    return indexPromise;
  }

  // ===== Поиск =====

  function highlightText(text, q) {
    var pos = text.toLowerCase().indexOf(q);
    if (pos === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, pos)) + "<b>" + escapeHtml(text.slice(pos, pos + q.length)) +
      "</b>" + escapeHtml(text.slice(pos + q.length));
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function search(query) {
    var q = query.trim().toLowerCase();
    if (q.length < MIN_QUERY || !index) return [];

    var starts = [], contains = [];
    index.forEach(function (item) {
      var t = item.title.toLowerCase();
      var s = (item.sub || "").toLowerCase();
      if (t.indexOf(q) === 0) starts.push(item);
      else if (t.indexOf(q) !== -1 || s.indexOf(q) !== -1) contains.push(item);
    });
    return starts.concat(contains).slice(0, MAX_RESULTS);
  }

  // ===== Рендер =====

  function render(query) {
    results = search(query);
    activeIdx = results.length ? 0 : -1;

    if (query.trim().length < MIN_QUERY) {
      resultsEl.innerHTML = '<div class="gs-empty">Введите запрос — минимум ' + MIN_QUERY + ' символа.<br>Поиск охватывает разделы, калькуляторы, протоколы и приказы.</div>';
      updateHint(query);
      return;
    }

    if (!results.length) {
      resultsEl.innerHTML = '<div class="gs-empty">По запросу «' + escapeHtml(query.trim()) + '» ничего не найдено</div>';
      updateHint(query);
      return;
    }

    var q = query.trim().toLowerCase();
    var html = results.map(function (item, i) {
      return '<button type="button" class="gs-item' + (i === activeIdx ? " gs-active" : "") + '" data-idx="' + i + '">' +
        '<span class="gs-item-emoji" aria-hidden="true">' + item.emoji + "</span>" +
        '<span class="gs-item-text">' +
          '<span class="gs-item-title">' + highlightText(item.title, q) + "</span>" +
          (item.sub ? '<span class="gs-item-sub">' + escapeHtml(item.sub) + "</span>" : "") +
        "</span>" +
        '<span class="gs-item-arrow" aria-hidden="true">›</span>' +
      "</button>";
    }).join("");

    resultsEl.innerHTML = html;
    updateHint(query);
  }

  function updateHint(query) {
    if (!hintEl) return;
    if (!index) { hintEl.textContent = "Индекс формируется…"; return; }
    hintEl.textContent = query.trim().length >= MIN_QUERY
      ? ("Найдено: " + results.length + (results.length === MAX_RESULTS ? "+" : "") + " · ↑↓ выбор · Enter открыть")
      : "↑↓ выбор · Enter открыть · Esc закрыть";
  }

  function setActive(idx) {
    if (!results.length) return;
    if (idx < 0) idx = results.length - 1;
    if (idx >= results.length) idx = 0;
    activeIdx = idx;
    var items = resultsEl.querySelectorAll(".gs-item");
    items.forEach(function (el, i) { el.classList.toggle("gs-active", i === idx); });
    var el = items[idx];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }

  function go(idx) {
    if (!results[idx]) return;
    window.location.href = results[idx].href;
  }

  // ===== Модалка =====

  function ensureModal() {
    if (modalEl) return;

    var style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    modalEl = document.createElement("div");
    modalEl.className = "modal";
    modalEl.id = "globalSearchModal";
    modalEl.hidden = true;
    modalEl.setAttribute("aria-hidden", "true");
    modalEl.innerHTML =
      '<div class="modal-backdrop" data-gs-close></div>' +
      '<section class="modal-panel" role="dialog" aria-modal="true">' +
        '<header class="modal-header">' +
          "<h2>🔍 Поиск по приложению</h2>" +
          '<button type="button" class="modal-close" data-gs-close aria-label="Закрыть">×</button>' +
        "</header>" +
        '<div class="modal-body">' +
          '<div class="gs-input-wrap">' +
            '<span class="gs-icon" aria-hidden="true">🔍</span>' +
            '<input type="search" id="globalSearchInput" class="gs-input" placeholder="Протокол, шкала, раздел…" autocomplete="off" autocapitalize="off" spellcheck="false">' +
          "</div>" +
          '<div class="gs-results" id="globalSearchResults" role="listbox"></div>' +
        "</div>" +
        '<footer class="modal-footer gs-hint-footer" style="padding:0;">' +
          '<div class="gs-hint" id="globalSearchHint"></div>' +
        "</footer>" +
      "</section>";
    document.body.appendChild(modalEl);

    inputEl = modalEl.querySelector("#globalSearchInput");
    resultsEl = modalEl.querySelector("#globalSearchResults");
    hintEl = modalEl.querySelector("#globalSearchHint");

    inputEl.addEventListener("input", function () { render(inputEl.value); });

    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - 1); }
      if (e.key === "Enter") { e.preventDefault(); go(activeIdx); }
      if (e.key === "Escape") { e.preventDefault(); close(); }
    });

    resultsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".gs-item");
      if (item) go(parseInt(item.getAttribute("data-idx"), 10));
    });

    modalEl.querySelectorAll("[data-gs-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modalEl.hidden) close();
    });
  }

  function open() {
    ensureModal();
    modalEl.hidden = false;
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    updateHint("");
    setTimeout(function () { inputEl.focus(); }, 60);
    buildIndex().then(function () {
      // индекс мог построиться после первого рендера — обновляем
      if (inputEl.value.trim()) render(inputEl.value);
      else updateHint("");
    });
  }

  function close() {
    if (!modalEl || modalEl.hidden) return;
    modalEl.hidden = true;
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function init() {
    var btn = document.getElementById("globalSearchBtn");
    if (btn) btn.addEventListener("click", open);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.SMP = window.SMP || {};
  window.SMP.globalSearch = { open: open };
})();
