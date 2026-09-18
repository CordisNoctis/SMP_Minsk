(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ===== Модальное окно со справкой =====
  function openReferenceModal(data) {
    var existing = document.getElementById("reference-modal");
    if (existing) existing.remove();

    var ref = data.reference || {};
    var paragraphs = (ref.paragraphs || []).map(function (p) {
      return "<p>" + escapeHtml(p) + "</p>";
    }).join("");

    var importantNote = ref.importantNote ?
      '<div class="calc-important-note">' +
        '<span style="font-size:20px;">⚠️</span>' +
        '<strong>' + escapeHtml(ref.importantNote) + '</strong>' +
      '</div>' : '';

    var legalReference = ref.legalReference ?
      '<div class="calc-legal-reference" style="margin-top:12px;padding:10px 12px;background:var(--menu-icon-bg);border-radius:8px;font-size:0.85rem;">' +
        '<span style="font-size:16px;">⚖️</span> ' +
        '<em>' + escapeHtml(ref.legalReference) + '</em>' +
      '</div>' : '';

    var indicationsHtml = '';
    if (ref.indications && ref.indications.length) {
      var items = ref.indications.map(function (x) {
        return '<li style="margin-bottom:4px;">' + escapeHtml(x) + '</li>';
      }).join("");
      indicationsHtml =
        '<div style="margin-top:14px;padding:12px 14px;background:var(--menu-icon-bg);border-radius:8px;border-left:3px solid var(--accent);">' +
          '<div style="font-weight:700;margin-bottom:8px;font-size:1rem;">' + escapeHtml(ref.indicationsTitle || "Показания:") + '</div>' +
          '<ul style="margin:0;padding-left:20px;font-size:0.95rem;line-height:1.5;list-style-type:disc;">' + items + '</ul>' +
        '</div>';
    }

    var modal = document.createElement("div");
    modal.id = "reference-modal";
    modal.className = "reference-modal";
    modal.innerHTML =
      '<div class="reference-modal-backdrop"></div>' +
      '<div class="reference-modal-content">' +
        '<div class="reference-modal-header">' +
          '<h3 class="reference-modal-title">' + escapeHtml(ref.title || 'О шкале') + '</h3>' +
          '<button class="reference-modal-close" aria-label="Закрыть">✕</button>' +
        '</div>' +
        '<div class="reference-modal-body">' +
          paragraphs + importantNote + indicationsHtml + legalReference +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add("open"); });
    
    // Блокируем прокрутку фона
    var scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = -scrollY + "px";
    document.body.style.width = "100%";

    var isClosed = false;

    function closeModal() {
      if (isClosed) return;
      isClosed = true;
      
      modal.classList.remove("open");
      var savedScrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY || "0") * -1);
      }
      setTimeout(function () { modal.remove(); }, 250);

      // Убираем запись модалки из истории браузера, если она там есть
      if (window.history && window.history.replaceState) {
        if (window.history.state && window.history.state.modalOpen) {
          window.history.replaceState(null, '');
        }
      }
    }

    // Добавляем запись в историю для обработки кнопки "Назад"
    if (window.history && window.history.pushState) {
      window.history.pushState({ modalOpen: true }, '');
      
      window.addEventListener('popstate', function onPopState() {
        closeModal();
        window.removeEventListener('popstate', onPopState);
      });
    }

    var backdrop = modal.querySelector(".reference-modal-backdrop");
    var closeBtn = modal.querySelector(".reference-modal-close");
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    function escHandler(e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    }
    document.addEventListener("keydown", escHandler);
  }

  // ===== Склонение "балл" =====
  function pluralizePoints(n) {
    var lastTwo = n % 100;
    var lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "баллов";
    if (lastOne === 1) return "балл";
    if (lastOne >= 2 && lastOne <= 4) return "балла";
    return "баллов";
  }

  // ===== Простой toast =====
  function showToast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.hidden = false; });
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2500);
  }

  // ===== УНИВЕРСАЛЬНЫЙ РЕНДЕР ПЛАШКИ РЕЗУЛЬТАТА =====
  function renderResultPanel(options) {
    var panelEl = document.getElementById("resultPanel");
    if (!panelEl) return;

    var score = options.score != null ? options.score : "—";
    var scoreLabel = options.scoreLabel || "";
    var color = options.color || "incomplete";
    var title = options.title || "";
    var description = options.description || "";
    var extraDesc = options.extraDescription || "";
    var therapy = options.therapy || "";
    var warnings = options.warnings || [];
    var breakdownHtml = options.breakdownHtml || ""; // <-- ДОБАВЛЕНО

    var warningsHtml = "";
    if (warnings.length > 0) {
      warningsHtml = '<div class="result-warning">' + warnings.map(function(w) { return escapeHtml(w); }).join("<br>") + '</div>';
    }

    var therapyHtml = "";
    if (therapy) {
      therapyHtml = '<div class="result-therapy">🏥 ' + escapeHtml(therapy) + '</div>';
    }

    var extraDescHtml = "";
    if (extraDesc) {
      extraDescHtml = '<div class="result-description-extra">' + escapeHtml(extraDesc) + '</div>';
    }

    var html = 
      '<div class="result-content result-' + color + '">' +
        '<div class="result-score">' +
          '<div class="result-score-value">' + score + '</div>' +
          (scoreLabel ? '<div class="result-score-label">' + escapeHtml(scoreLabel) + '</div>' : '') +
        '</div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info">' +
          (title ? '<div class="result-label">' + escapeHtml(title) + '</div>' : '') +
          (description ? '<div class="result-description">' + escapeHtml(description) + '</div>' : '') +
          extraDescHtml +
          breakdownHtml + // <-- ДОБАВЛЕНО (разбивка по категориям)
          therapyHtml +
          warningsHtml +
        '</div>' +
        '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить">↺</button>' +
      '</div>';

    panelEl.innerHTML = html;

    var resetBtn = panelEl.querySelector(".result-reset-big");
    if (resetBtn) {
      resetBtn.style.cursor = "pointer";
      resetBtn.style.pointerEvents = "auto";
      resetBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof options.onReset === "function") {
          options.onReset();
        }
      });
    }
  }

  // ===== Универсальное сохранение состояния калькулятора =====
  function saveCalcState(key, state) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }

  function loadCalcState(key) {
    try {
      var saved = localStorage.getItem(key);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }

    // ===== Универсальное сохранение ввода (снимок UI) =====
  var CLICKABLE_SELECTOR = [
    ".calc-item",
    ".gcs-radio-item",
    ".odn-radio-item",
    ".odn-option",
    ".geneva-hr-option",
    ".vas-quick-btn",
    ".qtc-category-btn",
    ".qtc-speed-btn",
    ".killip-class",
    ".apgar-time-btn",
    ".qtc-mode-btn",
    ".ett-mode-btn",
    ".infusomat-form-btn",
    ".infusomat-dilution-btn",
    ".ne-dilution-btn",
    ".preset-btn",
    ".mode-btn",
    ".drug-mode-btn"
  ].join(",");

  var ACTIVE_CLASSES = ["checked", "selected", "active"];

  function isActiveEl(el) {
    for (var i = 0; i < ACTIVE_CLASSES.length; i++) {
      if (el.classList.contains(ACTIVE_CLASSES[i])) return true;
    }
    return false;
  }

  function autoPersist(key) {
    var saveTimer = null;

    function snapshot() {
      var root = document.getElementById("calcBody") || document;
      var data = { on: [], inputs: [] };
      var clickables = root.querySelectorAll(CLICKABLE_SELECTOR);
      for (var i = 0; i < clickables.length; i++) {
        if (isActiveEl(clickables[i])) data.on.push(i);
      }
      var fields = root.querySelectorAll("input, select, textarea");
      for (var j = 0; j < fields.length; j++) {
        var f = fields[j];
        if (f.type === "checkbox" || f.type === "radio") continue;
        data.inputs.push({ id: f.id || ("idx" + j), value: f.value });
      }
      saveCalcState(key, data);
    }

    function replay() {
      var saved = loadCalcState(key);
      if (!saved) return;
      var root = document.getElementById("calcBody") || document;

      // ВАЖНО: перезапрашиваем список перед каждым кликом,
      // т.к. клик может вызвать перерисовку (innerHTML) и старые элементы отвяжутся от DOM
      for (var i = 0; i < (saved.on || []).length; i++) {
        var list = root.querySelectorAll(CLICKABLE_SELECTOR);
        var el = list[saved.on[i]];
        if (el) el.click();
      }

      for (var j = 0; j < (saved.inputs || []).length; j++) {
        var rec = saved.inputs[j];
        var f = rec.id ? document.getElementById(rec.id) : null;
        if (!f) {
          var fields = root.querySelectorAll("input, select, textarea");
          f = fields[j];
        }
        if (f && f.value !== rec.value) {
          f.value = rec.value;
          f.dispatchEvent(new Event("input", { bubbles: true }));
          f.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }

    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(snapshot, 0);
    }

    document.addEventListener("click", scheduleSave);
    document.addEventListener("input", scheduleSave);
    document.addEventListener("change", scheduleSave);

    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(replay, 0); // после init всех калькуляторов
    });
  }

    function clearCalcState(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

    var resetTimers = [];
  function clearResetTimers() {
    for (var i = 0; i < resetTimers.length; i++) clearTimeout(resetTimers[i]);
    resetTimers = [];
  }
  // ===== Глобальная анимация кнопки сброса («призрак») =====
  // Создаётся в фазе capture — ДО перерисовки плашки, поэтому
  // анимация видна на любом устройстве (мобильные, планшеты, ПК)
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".result-reset-big");
    if (!btn) return;

    var rect = btn.getBoundingClientRect();
    var color = window.getComputedStyle(btn).color;

        // Удаляем старые призраки (защита от дублей при быстрых кликах)
    var oldGhosts = document.querySelectorAll(".reset-ghost");
    for (var i = 0; i < oldGhosts.length; i++) {
      if (oldGhosts[i].parentNode) oldGhosts[i].parentNode.removeChild(oldGhosts[i]);
    }
    var ghost = document.createElement("div");
    ghost.className = "reset-ghost";
    ghost.textContent = "↺";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    ghost.style.width = rect.width + "px";
    ghost.style.height = rect.height + "px";
    ghost.style.color = color;
    document.body.appendChild(ghost);

    // Сбрасываем таймеры прошлого клика — его «возврат» не прервёт новую анимацию
    clearResetTimers();

    // Прячем нажатую кнопку мгновенно
    btn.style.transition = "none";
    btn.style.opacity = "0";

    resetTimers.push(setTimeout(function () {
      var lives = document.querySelectorAll(".result-reset-big");
      for (var i = 0; i < lives.length; i++) {
        lives[i].style.transition = "none";
        lives[i].style.opacity = "0";
      }
      resetTimers.push(setTimeout(function () {
        var all = document.querySelectorAll(".result-reset-big");
        for (var j = 0; j < all.length; j++) {
          all[j].style.opacity = "";
          all[j].style.transition = "none";
          resetTimers.push(setTimeout(function (el) { el.style.transition = ""; }, 60, all[j]));
        }
      }, 660));
    }, 0));

    setTimeout(function () {
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    }, 700);
  }, true);

  // ===== Экспорт API — ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ в этом IIFE =====
  window.SMP = window.SMP || {};
  window.SMP.calcUtils = {
    openReferenceModal: openReferenceModal,
    pluralizePoints: pluralizePoints,
    escapeHtml: escapeHtml,
    showToast: showToast,
    renderResultPanel: renderResultPanel,
    saveCalcState: saveCalcState,
    loadCalcState: loadCalcState,
    clearCalcState: clearCalcState,
    autoPersist: autoPersist
  };
})();