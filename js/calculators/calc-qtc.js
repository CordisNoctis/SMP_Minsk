(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПОРОГИ QTc (мс) =====
  var THRESHOLDS = {
    male:   { normal: 440, borderline: 460, prolonged: 500 },
    female: { normal: 460, borderline: 480, prolonged: 500 },
    child:  { normal: 460, borderline: 480, prolonged: 500 }
  };

  var NORM_RANGES = {
    male:   { min: 350, max: 440 },
    female: { min: 350, max: 460 },
    child:  { min: 350, max: 460 }
  };

  var CATEGORIES = [
    { id: "male",   label: "Мужчина",  icon: "♂",  color: "#1f6e9c" },
    { id: "female", label: "Женщина",  icon: "♀",  color: "#e68a2e" },
    { id: "child",  label: "Ребёнок",  icon: "👶", color: "#2e8b57" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ =====
  var REFERENCE = {
    title: "QTc по формуле Базетта (Corrected QT Interval — QTc Bazett)",
    paragraphs: [
      "Корригированный интервал QT (QTc) — стандартизированный показатель продолжительности желудочковой реполяризации, приведённый к частоте сердечных сокращений 60 уд/мин. Формула Базетта (1920) остаётся наиболее широко применяемой в клинической практике.",
      "Формула расчёта: QTc (мс) = QT (мс) ÷ √RR (с), где RR = 60 / ЧСС. Пример: QT = 400 мс, ЧСС = 75 уд/мин → RR = 0,80 с → QTc = 400 / √0,80 = 447 мс.",
      "Методика измерения: использовать отведение II или V5; измерять от начала QRS до конца зубца T (метод касательной); усреднить 3–5 циклов; не включать зубец U.",
      "Формула Базетта переоценивает QTc при тахикардии (ЧСС > 90) и недооценивает при брадикардии (ЧСС < 60). При ЧСС 60–80 уд/мин различия с другими формулами минимальны.",
      "Историческая справка: предложена H.C. Bazett в 1920 году. Несмотря на ограничения, остаётся стандартом для автоматического расчёта QTc и диагностики врождённого синдрома удлинённого QT (LQTS) согласно рекомендациям ESC."
    ],
    importantNote: "Норма для женщин несколько выше, чем для мужчин. Женский пол сам по себе является независимым фактором риска лекарственно-индуцированной TdP (риск вдвое выше). Актуальный перечень препаратов: www.crediblemeds.org",
    indicationsTitle: "Нормативные значения и пороги тревоги:",
    indications: [
      "< 440 мс — Норма (большинство источников)",
      "> 450 (муж) / > 460 (жен) — Удлинение QTc; повышенный риск TdP",
      "> 480 мс — Диагностический критерий врождённого синдрома удлинённого QT (ESC)",
      "> 500 мс — Значительное удлинение; основной фактор риска TdP; клинически критический порог",
      "≥ 60 мс от исходного — Значимое нарастание QTc на фоне терапии",
      "< 340 мс — Укорочение QTc; синдром укороченного QT (риск ВСС)"
    ],
    warnings: [
      "Показания: мониторинг препаратов, удлиняющих QT, скрининг LQTS, электролитные нарушения, брадикардия, синкопе, ОИМ, ЧМТ.",
      "Факторы риска TdP: женский пол, возраст > 65 лет, гипокалиемия/гipoмагниемия, брадикардия, приём ≥ 2 препаратов, удлиняющих QT, сердечная недостаточность.",
      "При ЧСС > 90 уд/мин Базетт систематически завышает QTc, что может приводить к гипердиагностике и избыточному лечению.",
      "Ненадёжна при фибрилляции предсердий с вариабельным ответом желудочков. Рекомендована преимущественно при ЧСС 60–80 уд/мин."
    ]
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-qtc-state";
  var state = {
    mode: "assess",
    category: "male",
    assess: { qt: null, hr: null },
    range:  { hr: null }
  };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    if (saved.mode) state.mode = saved.mode;
    if (saved.category) state.category = saved.category;
    if (saved.assess) state.assess = saved.assess;
    if (saved.range) state.range = saved.range;
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function getCategory() {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === state.category) return CATEGORIES[i];
    }
    return CATEGORIES[0];
  }

  function getStatus(qtc) {
    var t = THRESHOLDS[state.category];
    if (qtc >= t.prolonged) return { label: "Удлинён",     color: "gcs-4-5" };
    if (qtc >= t.borderline) return { label: "Пограничный", color: "gcs-11-12" };
    return { label: "Норма", color: "gcs-15" };
  }

  function calcAssess() {
    var a = state.assess;
    if (a.qt === null || a.hr === null || a.hr <= 0) return null;
    var rrSec = 60 / a.hr;
    var qtc = Math.round(a.qt / Math.sqrt(rrSec));
    var rrMs = Math.round(rrSec * 1000);
    return { qt: a.qt, hr: a.hr, rrSec: rrSec, rrMs: rrMs, qtc: qtc, status: getStatus(qtc) };
  }

  function calcRange() {
    var r = state.range;
    if (r.hr === null || r.hr <= 0) return null;
    
    var rrSec = 60 / r.hr;
    var norm = NORM_RANGES[state.category];
    var sqrtRR = Math.sqrt(rrSec);
    
    var qtMin = Math.round(norm.min * sqrtRR);
    var qtMax = Math.round(norm.max * sqrtRR);
    
    return { hr: r.hr, qtMin: qtMin, qtMax: qtMax };
  }

  function msToCells(ms, speed) {
    var mm = speed === 25 ? ms / 40 : ms / 20;
    return {
      mm: mm.toFixed(1),
      big: (mm / 5).toFixed(1)
    };
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderModeSwitcher() {
    return '<div class="qtc-mode-switcher">' +
      '<button type="button" class="qtc-mode-btn' + (state.mode === "assess" ? " active" : "") + '" data-mode="assess">' +
        '<span>📊</span>' +
        '<div class="qtc-mode-label">Оценка QT</div>' +
        '<div class="qtc-mode-desc">Измерил → получил QTc</div>' +
      '</button>' +
      '<button type="button" class="qtc-mode-btn' + (state.mode === "range" ? " active" : "") + '" data-mode="range">' +
        '<span>📏</span>' +
        '<div class="qtc-mode-label">Должный QT</div>' +
        '<div class="qtc-mode-desc">RR → диапазон нормы</div>' +
      '</button>' +
    '</div>';
  }

  function renderCategories() {
    var cat = getCategory();
    var itemsHtml = CATEGORIES.map(function (c) {
      var isChecked = state.category === c.id;
      return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-category="' + c.id + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
        '<span class="geneva-radio-custom"></span>' +
        '<span class="geneva-item-content">' +
          '<span class="geneva-item-title">' + c.icon + ' ' + CU.escapeHtml(c.label) + '</span>' +
        '</span>' +
      '</div>';
    }).join("");

    return '<div class="geneva-category" style="--cat-color: ' + cat.color + ';">' +
      '<div class="geneva-category-header">' +
        '<div class="geneva-category-left">' +
          '<span class="geneva-category-icon">👤</span>' +
          '<span class="geneva-category-title">Категория пациента</span>' +
        '</div>' +
        '<div class="geneva-category-score">' + cat.icon + '</div>' +
      '</div>' +
      '<div class="geneva-category-items">' + itemsHtml + '</div>' +
    '</div>';
  }

  function renderAssessInputs() {
    var cat = getCategory();
    var a = state.assess;
    var res = calcAssess();
    var scoreDisplay = res ? res.qtc + " мс" : "—";

    return '<div class="qtc-category" style="--cat-color: ' + cat.color + ';">' +
      '<div class="qtc-category-header">' +
        '<div class="qtc-category-left">' +
          '<span class="qtc-category-icon">📊</span>' +
          '<span class="qtc-category-title">Оценка измеренного QT</span>' +
        '</div>' +
        '<div class="qtc-category-score">' + scoreDisplay + '</div>' +
      '</div>' +
      '<div class="qtc-category-items">' +
        '<div class="qtc-input-item">' +
          '<label class="qtc-input-label" for="qtInput">📏 Интервал QT</label>' +
          '<div class="qtc-input-row">' +
            '<input type="text" id="qtInput" class="qtc-field" inputmode="decimal" maxlength="3" placeholder="400" value="' + (a.qt !== null ? a.qt : "") + '">' +
            '<span class="qtc-unit">мс</span>' +
          '</div>' +
        '</div>' +
        '<div class="qtc-input-item">' +
          '<label class="qtc-input-label" for="hrInput">❤️ Частота сердечных сокращений</label>' +
          '<div class="qtc-input-row">' +
            '<input type="text" id="hrInput" class="qtc-field" inputmode="decimal" maxlength="3" placeholder="75" value="' + (a.hr !== null ? a.hr : "") + '">' +
            '<span class="qtc-unit">уд/мин</span>' +
          '</div>' +
        '</div>' +
        '<div class="qtc-formula-hint">QTc = QT / √(RR в секундах)</div>' +
      '</div>' +
    '</div>';
  }

  function renderRangeInputs() {
    var cat = getCategory();
    var r = state.range;
    var res = calcRange();
    var scoreDisplay = res ? (res.qtMin + "–" + res.qtMax) : "—";

    return '<div class="qtc-category" style="--cat-color: ' + cat.color + ';">' +
      '<div class="qtc-category-header">' +
        '<div class="qtc-category-left">' +
          '<span class="qtc-category-icon">📏</span>' +
          '<span class="qtc-category-title">Должный диапазон QT</span>' +
        '</div>' +
        '<div class="qtc-category-score">' + scoreDisplay + '</div>' +
      '</div>' +
      '<div class="qtc-category-items">' +
        '<div class="qtc-input-item">' +
          '<label class="qtc-input-label" for="hrInputRange">❤️ Частота сердечных сокращений</label>' +
          '<div class="qtc-input-row">' +
            '<input type="text" id="hrInputRange" class="qtc-field" inputmode="decimal" placeholder="60" value="' + (r.hr !== null ? r.hr : "") + '">' +
            '<span class="qtc-unit">уд/мин</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderAll() {
    bodyEl.innerHTML = renderModeSwitcher() + renderCategories() +
      (state.mode === "assess" ? renderAssessInputs() : renderRangeInputs());
  }

  function renderResult() {
    if (state.mode === "assess") {
      var res = calcAssess();
      if (!res) {
        CU.renderResultPanel({
          score: "—",
          scoreLabel: "QTc (мс)",
          color: "incomplete",
          title: "Заполните оба поля",
          description: "Интервал QT (мс) и ЧСС (уд/мин)",
          extraDescription: "",
          breakdownHtml: "",
          onReset: resetAll
        });
        return;
      }

      // Детали убраны по запросу
      var breakdown = "";

      var warningHtml = "";
      if (res.qtc >= 500) {
        warningHtml = '<div class="medref-alert medref-alert-danger">⚠️ Высокий риск torsades de pointes! Срочная консультация кардиолога.</div>';
      }

      CU.renderResultPanel({
        score: res.qtc,
        scoreLabel: "мс (QTc)",
        color: res.status.color,
        title: res.status.label,
        description: "",
        extraDescription: "",
        breakdownHtml: breakdown + warningHtml,
        onReset: resetAll
      });

    } else {
      var res = calcRange();
      if (!res) {
        CU.renderResultPanel({
          score: "—",
          scoreLabel: "должный QT (мс)",
          color: "incomplete",
          title: "Укажите ЧСС",
          description: "Частота сердечных сокращений (уд/мин)",
          extraDescription: "",
          breakdownHtml: "",
          onReset: resetAll
        });
        return;
      }

      // Все детали (RR, ЧСС, Норма, Категория, Клетки) убраны по запросу
      CU.renderResultPanel({
        score: res.qtMin + "–" + res.qtMax,
        scoreLabel: "должный QT (мс)",
        color: "gcs-15",
        title: "Должный интервал QT",
        description: "",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
    }
  }

  function resetAll() {
    state = {
      mode: "assess",
      category: "male",
      assess: { qt: null, hr: null },
      range: { hr: null }
    };
    saveState();
    renderAll();
    bindInputListeners();
    renderResult();
  }

  function updateHeaderScore() {
    // Обновляем число в шапке текущей категории (без пересоздания DOM)
    var header = document.querySelector(".qtc-category .qtc-category-score");
    if (!header) return;

    if (state.mode === "assess") {
      var res = calcAssess();
      header.textContent = res ? res.qtc + " мс" : "—";
    } else {
      var res = calcRange();
      header.textContent = res ? (res.qtMin + "–" + res.qtMax) : "—";
    }
  }

  function onInputChange() {
    if (state.mode === "assess") {
      var qtEl = document.getElementById("qtInput");
      var hrEl = document.getElementById("hrInput");
      var qt = parseNum(qtEl.value);
      var hr = parseNum(hrEl.value);
      if (qt !== null) qt = Math.max(100, Math.min(800, qt));
      if (hr !== null) hr = Math.max(20, Math.min(250, hr));
      state.assess.qt = qt;
      state.assess.hr = hr;
    } else {
      var hrEl = document.getElementById("hrInputRange");
      var hr = parseNum(hrEl.value);
      if (hr !== null) hr = Math.max(20, Math.min(250, hr));
      state.range.hr = hr;
    }
    saveState();
    updateHeaderScore();
    renderResult();
  }

  function bindInputListeners() {
    var inputs = bodyEl.querySelectorAll(".qtc-field");
    inputs.forEach(function (inp) {
      inp.addEventListener("input", onInputChange);
    });

    var speedBtns = bodyEl.querySelectorAll(".qtc-speed-btn");
    speedBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.range.speed = parseInt(btn.getAttribute("data-speed"), 10);
        saveState();
        renderAll();
        bindInputListeners();
        renderResult();
      });
    });
  }

  function bindListeners() {
    // Режимы
    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".qtc-mode-btn");
      if (modeBtn) {
        state.mode = modeBtn.getAttribute("data-mode");
        saveState();
        renderAll();
        bindInputListeners();
        renderResult();
        return;
      }

      // Категории
      var catItem = e.target.closest(".geneva-radio-item[data-category]");
      if (catItem) {
        state.category = catItem.getAttribute("data-category");
        saveState();
        renderAll();
        bindInputListeners();
        renderResult();
      }
    });

    // Клавиатура
    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var catItem = e.target.closest(".geneva-radio-item[data-category]");
      if (!catItem) return;
      e.preventDefault();
      state.category = catItem.getAttribute("data-category");
      saveState();
      renderAll();
      bindInputListeners();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("qtcGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderAll();
    bindInputListeners();
    bindListeners();
    renderResult();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.qtc && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.qtc });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();