(function () {
  "use strict";

  // =====================================================
  // Поиск внутри документа (doc-md.html): подсветка
  // совпадений и переход по ним кнопками ▲ ▼.
  //
  // Работает по текстовым узлам контента (TreeWalker),
  // совпадения оборачиваются в <mark class="docmd-mark">.
  // =====================================================

  var MIN_QUERY = 2;

  var panelEl, inputEl, counterEl, prevBtn, nextBtn, closeBtn, toggleBtn;
  var contentEls = []; // один блок (doc-md) или несколько (инструкция: специалист + пациент)

  var marks = [];
  var current = -1;
  var debounceTimer = null;

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Блок с вкладками (инструкция препарата): перед переходом к совпадению
  // в скрытом блоке показываем нужную вкладку
  function revealMark(mark) {
    var container = mark.closest(".drug-content");
    if (!container || !container.hidden) return;
    var isPatient = container.id === "patContent";
    var tabBtn = document.getElementById(isPatient ? "tabPat" : "tabSpec");
    if (tabBtn) tabBtn.click();
  }

  // ===== Очистка предыдущей подсветки =====

  function clearMarks() {
    contentEls.forEach(function (contentEl) {
      var old = contentEl.querySelectorAll("mark.docmd-mark");
      Array.prototype.forEach.call(old, function (m) {
        var parent = m.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
    });
    marks = [];
    current = -1;
  }

  // ===== Подсветка совпадений в текстовых узлах =====

  function highlight(query) {
    clearMarks();
    if (!contentEls.length || query.length < MIN_QUERY) return 0;

    var re = new RegExp(escapeRegExp(query), "gi");

    contentEls.forEach(function (contentEl) {
      var walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = node.parentNode;
          if (!p || p.nodeName === "SCRIPT" || p.nodeName === "STYLE") return NodeFilter.FILTER_REJECT;
          if (!re.test(node.nodeValue)) { re.lastIndex = 0; return NodeFilter.FILTER_REJECT; }
          re.lastIndex = 0;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (node) {
        var text = node.nodeValue;
        var frag = document.createDocumentFragment();
        var last = 0;
        var m;
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mark = document.createElement("mark");
          mark.className = "docmd-mark";
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
          if (m[0].length === 0) re.lastIndex++; // защита от пустых совпадений
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });

      Array.prototype.push.apply(marks,
        Array.prototype.slice.call(contentEl.querySelectorAll("mark.docmd-mark")));
    });

    return marks.length;
  }

  // ===== Навигация по совпадениям =====

  function setCurrent(idx, scroll) {
    if (!marks.length) { updateCounter(); return; }
    if (idx < 0) idx = marks.length - 1;
    if (idx >= marks.length) idx = 0;
    current = idx;
    marks.forEach(function (m, i) { m.classList.toggle("docmd-mark-current", i === current); });
    if (scroll !== false) {
      revealMark(marks[current]);
      marks[current].scrollIntoView({ block: "center", behavior: "smooth" });
    }
    updateCounter();
  }

  function updateCounter() {
    if (!counterEl) return;
    if (!inputEl || inputEl.value.trim().length < MIN_QUERY) {
      counterEl.textContent = inputEl && inputEl.value.trim() ? "≥" + MIN_QUERY + " симв." : "";
      return;
    }
    counterEl.textContent = marks.length ? (current + 1) + "/" + marks.length : "0";
  }

  function runSearch() {
    var q = (inputEl.value || "").trim();
    if (q.length < MIN_QUERY) { clearMarks(); updateCounter(); return; }
    highlight(q);
    setCurrent(0, marks.length > 0);
  }

  // ===== Панель поиска =====

  function isOpen() { return panelEl && !panelEl.hidden; }

  function open() {
    if (!panelEl) return;
    panelEl.hidden = false;
    if (toggleBtn) toggleBtn.classList.add("docmd-search-btn-active");
    setTimeout(function () { if (inputEl) inputEl.focus(); }, 50);
  }

  function close() {
    if (!panelEl) return;
    clearMarks();
    if (inputEl) inputEl.value = "";
    updateCounter();
    panelEl.hidden = true;
    if (toggleBtn) toggleBtn.classList.remove("docmd-search-btn-active");
  }

  function toggle() { isOpen() ? close() : open(); }

  function init() {
    panelEl = document.getElementById("docmdSearchBar");
    inputEl = document.getElementById("docmdSearchInput");
    counterEl = document.getElementById("docmdSearchCount");
    prevBtn = document.getElementById("docmdSearchPrev");
    nextBtn = document.getElementById("docmdSearchNext");
    closeBtn = document.getElementById("docmdSearchClose");
    toggleBtn = document.getElementById("docSearchBtn");

    // Контейнеры: документ (doc-md) и/или инструкция препарата (drug.html)
    ["docMdContent", "specContent", "patContent"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) contentEls.push(el);
    });

    if (!panelEl || !inputEl || !contentEls.length) return;
    // Панель липнет под шапкой: синхронизируем top с высотой шапки
    // (шапка может менять высоту при переносе длинного заголовка)
    var headerEl = document.querySelector(".page-header");
    function syncBarTop() {
      if (!headerEl || !panelEl) return;
      panelEl.style.top = headerEl.offsetHeight + "px";
    }
    syncBarTop();
    window.addEventListener("resize", syncBarTop);
    if (window.ResizeObserver && headerEl) {
      new ResizeObserver(syncBarTop).observe(headerEl);
    }

    if (toggleBtn) toggleBtn.addEventListener("click", toggle);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { setCurrent(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { setCurrent(current + 1); });

    inputEl.addEventListener("input", function () {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runSearch, 180);
    });

    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) setCurrent(current - 1); else setCurrent(current + 1);
      }
      if (e.key === "Escape") { e.preventDefault(); close(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
