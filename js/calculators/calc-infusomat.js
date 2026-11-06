(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ДАННЫЕ =====
  var INFUSOMAT_DRUGS = {
    norepinephrine: { name: "Норадреналин", cat: "Кардиотоники", icon: "🫀", unit: "mcg_kg_min", forms: [{ label: "0.2% — 4 мл", concentration: 0.2, volume: 4, totalMg: 8 }, { label: "0.2% — 8 мл", concentration: 0.2, volume: 8, totalMg: 16 }], presets: [0.05, 0.1, 0.2, 0.3, 0.5], range: "0.1–0.3 мкг/кг/мин" },
    dopamine: { name: "Допамин", cat: "Кардиотоники", icon: "🫀", unit: "mcg_kg_min", forms: [{ label: "0.5% — 5 мл", concentration: 0.5, volume: 5, totalMg: 25 }, { label: "1% — 5 мл", concentration: 1, volume: 5, totalMg: 50 }, { label: "2% — 5 мл", concentration: 2, volume: 5, totalMg: 100 }, { label: "4% — 5 мл", concentration: 4, volume: 5, totalMg: 200 }], presets: [2, 5, 10, 15, 20], range: "2–5–10 мкг/кг/мин" },
    phenylephrine: { name: "Мезатон (фенилэфрин)", cat: "Кардиотоники", icon: "📊", unit: "mcg_kg_min", forms: [{ label: "1% — 1 мл", concentration: 1, volume: 1, totalMg: 10 }], presets: [0.5, 1, 2, 5], range: "в/в разовая 5 мг" },
    epinephrine: { name: "Адреналин", cat: "Кардиотоники", icon: "❤️", unit: "mcg_kg_min", forms: [{ label: "0.1% — 1 мл", concentration: 0.1, volume: 1, totalMg: 1 }], presets: [0.01, 0.05, 0.1, 0.2, 0.3], range: "0.01–0.3 мкг/кг/мин" },
    dobutamine: { name: "Добутамин", cat: "Кардиотоники", icon: "🫀", unit: "mcg_kg_min", forms: [{ label: "125 мг / 20 мл", concentration: 0.625, volume: 20, totalMg: 125 }, { label: "250 мг / 20 мл", concentration: 1.25, volume: 20, totalMg: 250 }, { label: "500 мг / 20 мл", concentration: 2.5, volume: 20, totalMg: 500 }], presets: [2.5, 5, 10, 20, 40], range: "2.5–10 мкг/кг/мин" },
    propofol: { name: "Пропофол", cat: "Гипнотики", icon: "😴", unit: "mg_kg_h", forms: [{ label: "1% — 10 мл", concentration: 1, volume: 10, totalMg: 100 }, { label: "1% — 20 мл", concentration: 1, volume: 20, totalMg: 200 }, { label: "1% — 50 мл", concentration: 1, volume: 50, totalMg: 500 }], presets: [0.5, 1, 2, 3, 4], range: "0.5–4 мг/кг/ч" },
    thiopental: { name: "Тиопентал", cat: "Гипнотики", icon: "😴", unit: "mg_kg_h", forms: [{ label: "125 мг / 20 мл", concentration: 0.625, volume: 20, totalMg: 125 }, { label: "250 мг / 20 мл", concentration: 1.25, volume: 20, totalMg: 250 }, { label: "500 мг / 20 мл", concentration: 2.5, volume: 20, totalMg: 500 }, { label: "1000 мг / 20 мл", concentration: 5, volume: 20, totalMg: 1000 }], presets: [1, 2, 3, 5], range: "1–3 мг/кг/ч" },
    midazolam: { name: "Мидазолам", cat: "Бензодиазепины", icon: "🧠", unit: "mg_kg_h", forms: [{ label: "0.1% — 2 мл", concentration: 0.1, volume: 2, totalMg: 2 }, { label: "0.1% — 5 мл", concentration: 0.1, volume: 5, totalMg: 5 }, { label: "0.5% — 2 мл", concentration: 0.5, volume: 2, totalMg: 10 }, { label: "0.5% — 3 мл", concentration: 0.5, volume: 3, totalMg: 15 }], presets: [0.03, 0.05, 0.1, 0.2, 0.3], range: "0.03–0.3 мг/кг/ч" },
    diazepam: { name: "Диазепам", cat: "Бензодиазепины", icon: "🧠", unit: "mg_kg_h", forms: [{ label: "0.5% — 2 мл", concentration: 0.5, volume: 2, totalMg: 10 }, { label: "0.5% — 10 мл", concentration: 0.5, volume: 10, totalMg: 50 }], presets: [0.05, 0.1, 0.2], range: "0.05–0.1 мг/кг/ч" }
  };

  var CATHETERS = [
    { gauge: "G24", color: "жёлтый", maxMlMin: 20, desc: "Новорождённые, дети" },
    { gauge: "G22", color: "голубой", maxMlMin: 35, desc: "Дети, пожилые" },
    { gauge: "G20", color: "розовый", maxMlMin: 60, desc: "Стандарт для взрослых" },
    { gauge: "G18", color: "зелёный", maxMlMin: 100, desc: "Быстрые инфузии" },
    { gauge: "G16", color: "серый", maxMlMin: 200, desc: "Массивные инфузии" }
  ];

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-infusomat-state";
  var state = {
    mode: "infusomat",
    drug: null, form: null, dilution: 0, dose: null, weight: null
  };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    if (saved.mode) state.mode = saved.mode;
    if (saved.drug !== undefined) state.drug = saved.drug;
    if (saved.form !== undefined) state.form = saved.form;
    if (saved.dilution !== undefined) state.dilution = saved.dilution;
    if (saved.dose !== undefined) state.dose = saved.dose;
    if (saved.weight !== undefined) state.weight = saved.weight;

    // Разведение должно быть из набора текущего режима (наборы разные:
    // у инфузомата «Без разведения/10/20/50/100», у капельницы — флаконы
    // 100/250/500/1000). В старых сохранениях могли остаться недопустимые
    // значения — заменяем на стандартный для режима.
    if (state.drug !== null && state.form !== null) {
      var validDil = dilOptionsFor(state.mode).some(function (o) { return o.v === state.dilution; });
      if (!validDil) state.dilution = defaultDilution();
    } else {
      state.dilution = defaultDilution();
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }
  function round2(x) { return Math.round(x * 100) / 100; }
  function round3(x) { return Math.round(x * 1000) / 1000; }

  function formatHours(h) {
    var hours = Math.floor(h);
    var minutes = Math.round((h - hours) * 60);
    if (hours === 0) return minutes + ' мин';
    if (minutes === 0) return hours + ' ч';
    return hours + ' ч ' + minutes + ' мин';
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderModeSwitcher() {
    return '<div class="inf-mode-switcher">' +
      '<button type="button" class="inf-mode-btn' + (state.mode === "infusomat" ? " active" : "") + '" data-mode="infusomat">' +
        '<span>💊</span><div class="inf-mode-label">Инфузомат</div><div class="inf-mode-desc">Шприцевой насос</div></button>' +
      '<button type="button" class="inf-mode-btn' + (state.mode === "drip" ? " active" : "") + '" data-mode="drip">' +
        '<span>💧</span><div class="inf-mode-label">Капельница</div><div class="inf-mode-desc">Стандартная система</div></button>' +
    '</div>';
  }

  // ===== Общие блоки для режимов «Инфузомат» и «Капельница» =====

  function renderDrugCategory() {
    var d = state.drug ? INFUSOMAT_DRUGS[state.drug] : null;
    var unitLabel = d ? (d.unit === "mcg_kg_min" ? "мкг/кг/мин" : "мг/кг/ч") : "";

    var drugsHtml = '';
    for (var id in INFUSOMAT_DRUGS) {
      var drug = INFUSOMAT_DRUGS[id];
      var isActive = state.drug === id ? ' active' : '';
      drugsHtml += '<button type="button" class="inf-drug-card' + isActive + '" data-drug="' + id + '">' +
        '<div class="inf-drug-card-icon">' + drug.icon + '</div>' +
        '<div class="inf-drug-card-info">' +
          '<div class="inf-drug-card-name">' + CU.escapeHtml(drug.name) + '</div>' +
          '<div class="inf-drug-card-cat">' + CU.escapeHtml(drug.cat) + '</div>' +
          '<div class="inf-drug-card-range">' + drug.range + '</div>' +
        '</div>' +
      '</button>';
    }

    return '<div class="geneva-category" style="--cat-color: #1f6e9c;">' +
      '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">💊</span><span class="geneva-category-title">Выбор препарата</span></div></div>' +
      '<div class="geneva-category-items" style="padding: 12px 16px;">' +
        '<div class="inf-drugs-grid">' + drugsHtml + '</div>' +
        (d ? '<div class="inf-drug-info" style="margin-top: 12px;">' +
          '<div class="inf-drug-info-row"><span class="inf-drug-info-label">Диапазон:</span><span class="inf-drug-info-value">' + d.range + '</span></div>' +
          '<div class="inf-drug-info-row"><span class="inf-drug-info-label">Единицы:</span><span class="inf-drug-info-value">' + unitLabel + '</span></div>' +
        '</div>' : '') +
      '</div></div>';
  }

  function renderFormCategory() {
    var d = INFUSOMAT_DRUGS[state.drug];
    var formsHtml = d.forms.map(function (f, idx) {
      var active = state.form === idx ? " active" : "";
      return '<button type="button" class="inf-grid-btn' + active + '" data-form="' + idx + '">' +
        '<div class="inf-grid-btn-label">' + CU.escapeHtml(f.label) + '</div>' +
        '<div class="inf-grid-btn-desc">' + f.totalMg + ' мг в ' + f.volume + ' мл</div></button>';
    }).join("");

    return '<div class="geneva-category" style="--cat-color: #e68a2e;">' +
      '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">📦</span><span class="geneva-category-title">Форма выпуска</span></div></div>' +
      '<div class="geneva-category-items" style="padding: 12px 16px;"><div class="inf-grid">' + formsHtml + '</div></div></div>';
  }

  function renderDilutionCategory(dilOptions) {
    var dilHtml = dilOptions.map(function (o) {
      var active = state.dilution === o.v ? " active" : "";
      return '<button type="button" class="inf-grid-btn' + active + '" data-dilution="' + o.v + '">' +
        '<div class="inf-grid-btn-label">' + o.label + '</div>' +
        '<div class="inf-grid-btn-desc">Итого: ' + o.total + ' мл</div></button>';
    }).join("");

    return '<div class="geneva-category" style="--cat-color: #2e8b57;">' +
      '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">💧</span><span class="geneva-category-title">Объём растворителя</span></div></div>' +
      '<div class="geneva-category-items" style="padding: 12px 16px;"><div class="inf-grid">' + dilHtml + '</div></div></div>';
  }

  function renderDoseCategory() {
    var d = INFUSOMAT_DRUGS[state.drug];
    var unitLabel = d.unit === "mcg_kg_min" ? "мкг/кг/мин" : "мг/кг/ч";

    var presetsHtml = d.presets.map(function (p) {
      var active = state.dose === p ? " active" : "";
      return '<button type="button" class="inf-preset-btn' + active + '" data-preset="' + p + '">' + p + '</button>';
    }).join("");

    return '<div class="geneva-category" style="--cat-color: #b42323;">' +
      '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">⚖️</span><span class="geneva-category-title">Дозировка и вес</span></div></div>' +
      '<div class="geneva-category-items" style="padding: 12px 16px;">' +
        '<div class="inf-input-row">' +
          '<div class="inf-input-group"><label class="inf-input-label">Доза (' + unitLabel + ')</label><input type="text" id="infDose" class="inf-field" inputmode="decimal" placeholder="—" value="' + (state.dose !== null ? state.dose : "") + '"></div>' +
          '<div class="inf-input-group"><label class="inf-input-label">Вес пациента (кг)</label><input type="text" id="infWeight" class="inf-field" inputmode="decimal" placeholder="—" value="' + (state.weight !== null ? state.weight : "") + '"></div>' +
        '</div>' +
        '<div style="margin-top: 12px;"><label class="inf-input-label">Быстрый выбор дозы:</label><div class="inf-presets">' + presetsHtml + '</div></div>' +
      '</div></div>';
  }

  // Варианты разведения.
  // Капельница: только флаконы 100/250/500/1000 мл (объём растворителя + объём лекарства).
  // Инфузомат: малые объёмы шприца (10/20/50/100 мл) + "Без разведения".
  function dilOptionsFor(mode) {
    var f = INFUSOMAT_DRUGS[state.drug].forms[state.form];

    if (mode === "drip") {
      return [
        { v: 100, label: "100 мл", total: 100 + f.volume },
        { v: 250, label: "250 мл", total: 250 + f.volume },
        { v: 500, label: "500 мл", total: 500 + f.volume },
        { v: 1000, label: "1000 мл", total: 1000 + f.volume }
      ];
    } else {
      var opts = [{ v: 0, label: "Без разведения", total: f.volume }];
      [10, 20, 50, 100].forEach(function (v) {
        opts.push({ v: v, label: "До " + v + " мл", total: v });
      });
      return opts;
    }
  }

  function getDilutionTotal() {
    var f = INFUSOMAT_DRUGS[state.drug].forms[state.form];
    var opts = dilOptionsFor(state.mode);
    var found = opts.find(function(o) { return o.v === state.dilution; });
    return found ? found.total : f.volume;
  }

  // Разведение по умолчанию для текущего режима:
  // в капельнице нет «Без разведения» — сразу флакон 100 мл
  function defaultDilution() {
    return state.mode === "drip" ? 100 : 0;
  }

  function renderInfusomatInputs() {
    var html = renderDrugCategory();
    if (!state.drug) return html;
    html += renderFormCategory();
    if (state.form === null) return html;
    html += renderDilutionCategory(dilOptionsFor("infusomat"));
    html += renderDoseCategory();
    return html;
  }

  function renderDripInputs() {
    var html = renderDrugCategory();
    if (!state.drug) return html;
    html += renderFormCategory();
    if (state.form === null) return html;
    html += renderDilutionCategory(dilOptionsFor("drip"));
    html += renderDoseCategory();
    return html;
  }

  function renderResult() {
    if (state.mode === "infusomat") {
      if (!state.drug) {
        return CU.renderResultPanel({ score: "—", scoreLabel: "", color: "incomplete", title: "Выберите препарат", description: "Начните с выбора препарата из списка", extraDescription: "", breakdownHtml: "", onReset: resetAll });
      }
      if (state.form === null) {
        return CU.renderResultPanel({ score: "—", scoreLabel: "", color: "incomplete", title: "Выберите форму выпуска", description: "Укажите ампулу или флакон", extraDescription: "", breakdownHtml: "", onReset: resetAll });
      }
      if (state.dose === null || state.weight === null) {
        var missing = (state.dose === null && state.weight === null) ? "дозу и вес"
          : (state.dose === null ? "дозу" : "вес пациента");
        return CU.renderResultPanel({ score: "—", scoreLabel: "", color: "incomplete", title: "Введите " + missing, description: "Заполните поле для расчёта", extraDescription: "", breakdownHtml: "", onReset: resetAll });
      }

      var d = INFUSOMAT_DRUGS[state.drug];
      var f = d.forms[state.form];
      var totalVol = getDilutionTotal();
      var conc = f.totalMg / totalVol;

      var speedH = d.unit === "mcg_kg_min" ? (state.dose * state.weight * 60) / (conc * 1000) : (state.dose * state.weight) / conc;

      panelEl.innerHTML =
        '<div class="result-content result-success" style="padding: 16px 20px;">' +
          '<div style="display: flex; align-items: baseline; justify-content: space-between; width: 100%;">' +
            '<div style="display: flex; align-items: baseline; gap: 8px;">' +
              '<div style="font-size: 2.8rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; color: #fff;">' + round2(speedH) + '</div>' +
              '<div style="font-size: 1.1rem; color: rgba(255,255,255,0.9); font-weight: 600;">мл/ч</div>' +
            '</div>' +
            '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить" style="margin: 0;">↺</button>' +
          '</div>' +
        '</div>';

    } else {
      // Режим капельницы
      if (!state.drug) {
        return CU.renderResultPanel({ score: "—", scoreLabel: "", color: "incomplete", title: "Выберите препарат", description: "Начните с выбора препарата из списка", extraDescription: "", breakdownHtml: "", onReset: resetAll });
      }
      if (state.form === null) {
        return CU.renderResultPanel({ score: "—", scoreLabel: "", color: "incomplete", title: "Выберите форму выпуска", description: "Укажите ампулу или флакон", extraDescription: "", breakdownHtml: "", onReset: resetAll });
      }
      if (state.dose === null || state.weight === null) {
        var missingDrip = (state.dose === null && state.weight === null) ? "дозу и вес"
          : (state.dose === null ? "дозу" : "вес пациента");
        return CU.renderResultPanel({ score: "—", scoreLabel: "", color: "incomplete", title: "Введите " + missingDrip, description: "Заполните поле для расчёта", extraDescription: "", breakdownHtml: "", onReset: resetAll });
      }

      var d = INFUSOMAT_DRUGS[state.drug];
      var f = d.forms[state.form];
      var totalVol = getDilutionTotal();
      var conc = f.totalMg / totalVol;

      var speedH = d.unit === "mcg_kg_min" ? (state.dose * state.weight * 60) / (conc * 1000) : (state.dose * state.weight) / conc;
      var speedMin = speedH / 60;
      var dropsMin = speedMin * 20;
      var hours = totalVol / speedH;

      panelEl.innerHTML =
        '<div class="result-content result-success" style="padding: 14px 16px; position: relative;">' +
          '<div style="display: flex; align-items: baseline; justify-content: space-between; width: 100%;">' +
            '<div style="display: flex; align-items: baseline; gap: 8px;">' +
              '<div style="font-size: 2.8rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; color: #fff;">' + (dropsMin >= 10 ? Math.round(dropsMin) : round2(dropsMin)) + '</div>' +
              '<div style="font-size: 1.1rem; color: rgba(255,255,255,0.9); font-weight: 600;">капель/мин</div>' +
            '</div>' +
            '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить" style="margin: 0;">↺</button>' +
          '</div>' +
        '</div>';
    }
  }

  function resetAll() {
    state = { mode: state.mode, drug: null, form: null, dilution: defaultDilution(), dose: null, weight: null };
    saveState();
    renderGroups();
    bindInputs();
    renderResult();
  }

  function renderGroups() {
    bodyEl.innerHTML = renderModeSwitcher() + (state.mode === "infusomat" ? renderInfusomatInputs() : renderDripInputs());
  }

  function bindClickHandlers() {
    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".inf-mode-btn");
      if (modeBtn) {
        state.mode = modeBtn.getAttribute("data-mode");
        state.dilution = defaultDilution(); // наборы опций в режимах разные
        saveState();
        renderGroups();
        bindInputs();
        renderResult();
        return;
      }

      var drugCard = e.target.closest(".inf-drug-card");
      if (drugCard) {
        state.drug = drugCard.getAttribute("data-drug");
        state.form = null;
        state.dilution = defaultDilution();
        state.dose = null;
        saveState();
        renderGroups();
        bindInputs();
        renderResult();
        return;
      }

      var formBtn = e.target.closest(".inf-grid-btn[data-form]");
      if (formBtn) {
        state.form = parseInt(formBtn.getAttribute("data-form"), 10);
        state.dilution = defaultDilution();
        saveState();
        renderGroups();
        bindInputs();
        renderResult();
        return;
      }

      var dilBtn = e.target.closest(".inf-grid-btn[data-dilution]");
      if (dilBtn) {
        state.dilution = parseInt(dilBtn.getAttribute("data-dilution"), 10);
        saveState();
        renderGroups();
        bindInputs();
        renderResult();
        return;
      }

      var presetBtn = e.target.closest(".inf-preset-btn");
      if (presetBtn) {
        state.dose = parseFloat(presetBtn.getAttribute("data-preset"));
        saveState();
        renderGroups();
        bindInputs();
        renderResult();
        return;
      }
    });

    panelEl.addEventListener("click", function (e) {
      if (e.target.closest(".result-reset-big")) {
        resetAll();
      }
    });
  }

  function bindInputs() {
    var doseEl = document.getElementById("infDose");
    var weightEl = document.getElementById("infWeight");

    if (doseEl) doseEl.addEventListener("input", function () { state.dose = parseNum(doseEl.value); saveState(); renderResult(); });
    if (weightEl) weightEl.addEventListener("input", function () { state.weight = parseNum(weightEl.value); saveState(); renderResult(); });
  }

  function init() {
    bodyEl = document.getElementById("infusomatGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    bindClickHandlers();
    bindInputs();
    renderResult();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.infusomat && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.infusomat });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();