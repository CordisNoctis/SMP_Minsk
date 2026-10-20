(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== РЕЖИМЫ =====
  var MODES = [
    { id: "concentration", label: "Концентр.", icon: "🧪", subtitle: "% ↔ мг/мл" },
    { id: "dose",          label: "По дозе",   icon: "💉", subtitle: "мг → мл" },
    { id: "weight",        label: "По весу",   icon: "⚖️", subtitle: "мг/кг → мл" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв, если markdown-файл не подключён) =====
  var REFERENCE = {
    title: "О калькуляторе",
    paragraphs: [
      "Процентная концентрация (% масс/объём) означает количество граммов вещества в 100 мл раствора.",
      "Формула: 1% = 1 г на 100 мл = 1000 мг на 100 мл = 10 мг на 1 мл. Следовательно: концентрация (мг/мл) = % × 10.",
      "Объём (мл) = доза (мг) / концентрация (мг/мл). При дозировании по массе тела: объём = (доза мг/кг × вес кг) / концентрация."
    ],
    importantNote: "Расчётный объём ориентировочный. Перед введением всегда проверяйте концентрацию на ампуле, срок годности, прозрачность раствора и совместимость."
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-converter-state";
  var state = {
    mode: "dose",
    concPercent: null, concMgMl: null,
    doseMg: null, dosePerKg: null, weightKg: null
  };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    if (saved.mode) state.mode = saved.mode;
    if (typeof saved.concPercent === "number") state.concPercent = saved.concPercent;
    if (typeof saved.concMgMl === "number") state.concMgMl = saved.concMgMl;
    if (typeof saved.doseMg === "number") state.doseMg = saved.doseMg;
    if (typeof saved.dosePerKg === "number") state.dosePerKg = saved.dosePerKg;
    if (typeof saved.weightKg === "number") state.weightKg = saved.weightKg;
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  // Округление объёма (мл): <=9 — 2 знака, 10–99 — 1 знак, >=100 — целое
  function roundVol(n) {
    if (n >= 100) return Math.round(n);
    var r1 = Math.round(n * 10) / 10;
    if (r1 >= 100) return Math.round(n);
    if (n >= 10) return r1;
    var r2 = Math.round(n * 100) / 100;
    if (r2 >= 10) return Math.round(n * 10) / 10;
    return r2;
  }

  // Форматирование объёма для вывода (с правильным числом знаков после запятой)
  function formatVol(n) {
    if (n >= 100) return Math.round(n).toString();
    if (n >= 10)  return n.toFixed(1);
    return n.toFixed(2);
  }

  function calc() {
    if (state.mode === "concentration") {
      if (state.concPercent === null && state.concMgMl === null) return null;
      var p = state.concPercent !== null ? state.concPercent : round2(state.concMgMl / 10);
      var m = state.concMgMl !== null ? state.concMgMl : round2(state.concPercent * 10);
      return { type: "conc", p: p, m: m };
    }
    if (state.mode === "dose") {
      if (state.concMgMl === null || state.concMgMl <= 0 || state.doseMg === null) return null;
      return { type: "vol", vol: roundVol(state.doseMg / state.concMgMl), dose: state.doseMg };
    }
    if (state.mode === "weight") {
      if (state.concMgMl === null || state.concMgMl <= 0 || state.dosePerKg === null || state.weightKg === null) return null;
      var total = round2(state.dosePerKg * state.weightKg);
      return { type: "vol", vol: roundVol(total / state.concMgMl), dose: total };
    }
    return null;
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderModeSwitcher() {
    return '<div class="dc-mode-switcher">' +
      MODES.map(function (m) {
        return '<button type="button" class="dc-mode-btn' + (state.mode === m.id ? " active" : "") + '" data-mode="' + m.id + '">' +
          '<span>' + m.icon + '</span>' +
          '<div class="dc-mode-label">' + m.label + '</div>' +
          '<div class="dc-mode-subtitle">' + m.subtitle + '</div>' +
        '</button>';
      }).join("") +
    '</div>';
  }

  function headerScore() {
    var res = calc();
    if (!res) return "—";
    if (res.type === "conc") return res.m + " мг/мл";
    return formatVol(res.vol) + " мл";
  }

  function renderInputs() {
    var items = "";

    // Концентрация (всегда)
    items += '<div class="dc-input-item">' +
      '<div class="dc-input-label">🧪 Концентрация препарата</div>' +
      '<div class="dc-input-row">' +
        '<input type="text" id="concPercent" class="dc-field" inputmode="decimal" placeholder="—" value="' + (state.concPercent !== null ? state.concPercent : "") + '">' +
        '<span class="dc-unit">%</span>' +
        '<span class="dc-separator">=</span>' +
        '<input type="text" id="concMgMl" class="dc-field" inputmode="decimal" placeholder="—" value="' + (state.concMgMl !== null ? state.concMgMl : "") + '">' +
        '<span class="dc-unit">мг/мл</span>' +
      '</div>' +
    '</div>';

    if (state.mode === "dose") {
      items += '<div class="dc-input-item">' +
        '<div class="dc-input-label">💉 Требуемая доза</div>' +
        '<div class="dc-input-row">' +
          '<input type="text" id="doseMg" class="dc-field" inputmode="decimal" placeholder="—" value="' + (state.doseMg !== null ? state.doseMg : "") + '">' +
          '<span class="dc-unit">мг</span>' +
        '</div>' +
      '</div>';
    }

    if (state.mode === "weight") {
      items += '<div class="dc-input-item">' +
        '<div class="dc-input-label">⚖️ Доза на массу тела</div>' +
        '<div class="dc-input-row">' +
          '<input type="text" id="dosePerKg" class="dc-field" inputmode="decimal" placeholder="—" value="' + (state.dosePerKg !== null ? state.dosePerKg : "") + '">' +
          '<span class="dc-unit">мг/кг</span>' +
        '</div>' +
      '</div>' +
      '<div class="dc-input-item">' +
        '<div class="dc-input-label">👤 Масса тела пациента</div>' +
        '<div class="dc-input-row">' +
          '<input type="text" id="weightKg" class="dc-field" inputmode="decimal" placeholder="—" value="' + (state.weightKg !== null ? state.weightKg : "") + '">' +
          '<span class="dc-unit">кг</span>' +
        '</div>' +
      '</div>';
    }

    bodyEl.innerHTML = renderModeSwitcher() +
      '<div class="dc-category" style="--cat-color: #1f6e9c;">' +
        '<div class="dc-category-header">' +
          '<div class="dc-category-left">' +
            '<span class="dc-category-icon">🧮</span>' +
            '<span class="dc-category-title">Исходные данные</span>' +
          '</div>' +
          '<div class="dc-category-score" id="dcScore">' + headerScore() + '</div>' +
        '</div>' +
        '<div class="dc-category-items">' + items + '</div>' +
        '<div class="dc-hint">1% = 10 мг/мл · Объём = доза / концентрация</div>' +
      '</div>';
  }

  function renderResult() {
    var res = calc();

    if (!res) {
      var hint = state.mode === "concentration" ? "Введите концентрацию (% или мг/мл)"
        : state.mode === "dose" ? "Введите концентрацию и дозу"
        : "Заполните все поля";
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "",
        color: "incomplete",
        title: hint,
        description: "",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    if (res.type === "conc") {
      CU.renderResultPanel({
        score: res.m,
        scoreLabel: "мг/мл",
        color: "gcs-15",
        title: "Концентрация " + res.p + "%",
        description: "",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
    } else {
      CU.renderResultPanel({
        score: formatVol(res.vol),
        scoreLabel: "мл",
        color: "gcs-15",
        title: "Объём для введения",
        description: "",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
    }
  }

  function updateHeaderScore() {
    var el = document.getElementById("dcScore");
    if (el) el.textContent = headerScore();
  }

  function resetAll() {
    state = {
      mode: "dose",
      concPercent: null, concMgMl: null,
      doseMg: null, dosePerKg: null, weightKg: null
    };
    saveState();
    renderInputs();
    bindInputs();
    renderResult();
  }

  // ===== ОБРАБОТЧИКИ ВВОДА =====
  function onConcPercent() {
    var v = parseNum(document.getElementById("concPercent").value);
    state.concPercent = v;
    state.concMgMl = v !== null ? round2(v * 10) : null;
    var cmEl = document.getElementById("concMgMl");
    if (cmEl) cmEl.value = state.concMgMl !== null ? state.concMgMl : "";
    afterChange();
  }

  function onConcMgMl() {
    var v = parseNum(document.getElementById("concMgMl").value);
    state.concMgMl = v;
    state.concPercent = v !== null ? round2(v / 10) : null;
    var cpEl = document.getElementById("concPercent");
    if (cpEl) cpEl.value = state.concPercent !== null ? state.concPercent : "";
    afterChange();
  }

  function onSimple(field, key) {
    var v = parseNum(document.getElementById(field).value);
    state[key] = v;
    afterChange();
  }

  function afterChange() {
    saveState();
    updateHeaderScore();
    renderResult();
  }

  function bindInputs() {
    var cpEl = document.getElementById("concPercent");
    var cmEl = document.getElementById("concMgMl");
    var dmEl = document.getElementById("doseMg");
    var dpkEl = document.getElementById("dosePerKg");
    var wEl = document.getElementById("weightKg");

    if (cpEl) cpEl.addEventListener("input", onConcPercent);
    if (cmEl) cmEl.addEventListener("input", onConcMgMl);
    if (dmEl) dmEl.addEventListener("input", function () { onSimple("doseMg", "doseMg"); });
    if (dpkEl) dpkEl.addEventListener("input", function () { onSimple("dosePerKg", "dosePerKg"); });
    if (wEl) wEl.addEventListener("input", function () { onSimple("weightKg", "weightKg"); });
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".dc-mode-btn");
      if (!modeBtn) return;
      state.mode = modeBtn.getAttribute("data-mode");
      saveState();
      renderInputs();
      bindInputs();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("dcGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderInputs();
    bindInputs();
    bindListeners();
    renderResult();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.drugConverter && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.drugConverter });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();