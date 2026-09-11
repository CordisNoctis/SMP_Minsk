(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var DRUGS = {
    norepinephrine: {
      name: "Норадреналин", cat: "Кардиотоники", icon: "🫀", unit: "mcg_kg_min",
      forms: [
        { label: "0.2% — 4 мл", concentration: 0.2, volume: 4, totalMg: 8 },
        { label: "0.2% — 8 мл", concentration: 0.2, volume: 8, totalMg: 16 }
      ],
      presets: [0.05, 0.1, 0.2, 0.3, 0.5],
      range: "0.1–0.3 мкг/кг/мин",
      warning: "Вазопрессор! Только через центральную вену"
    },
    dopamine: {
      name: "Допамин", cat: "Кардиотоники", icon: "🫀", unit: "mcg_kg_min",
      forms: [
        { label: "0.5% — 5 мл", concentration: 0.5, volume: 5, totalMg: 25 },
        { label: "1% — 5 мл",   concentration: 1,   volume: 5, totalMg: 50 },
        { label: "2% — 5 мл",   concentration: 2,   volume: 5, totalMg: 100 },
        { label: "4% — 5 мл",   concentration: 4,   volume: 5, totalMg: 200 }
      ],
      presets: [2, 5, 10, 15, 20],
      range: "2–5–10 мкг/кг/мин, до 15 и более",
      warning: null
    },
    phenylephrine: {
      name: "Мезатон (фенилэфрин)", cat: "Кардиотоники", icon: "📊", unit: "mcg_kg_min",
      forms: [{ label: "1% — 1 мл", concentration: 1, volume: 1, totalMg: 10 }],
      presets: [0.5, 1, 2, 5],
      range: "в/в разовая 5 мг, суточная 25 мг",
      warning: "Альфа-адреномиметик"
    },
    epinephrine: {
      name: "Адреналин (эпинефрин)", cat: "Кардиотоники", icon: "❤️", unit: "mcg_kg_min",
      forms: [{ label: "0.1% — 1 мл", concentration: 0.1, volume: 1, totalMg: 1 }],
      presets: [0.01, 0.05, 0.1, 0.2, 0.3],
      range: "0.01–0.3 мкг/кг/мин",
      warning: "Критический препарат!"
    },
    dobutamine: {
      name: "Добутамин", cat: "Кардиотоники", icon: "🫀", unit: "mcg_kg_min",
      forms: [
        { label: "125 мг / 20 мл", concentration: 0.625, volume: 20, totalMg: 125 },
        { label: "250 мг / 20 мл", concentration: 1.25,  volume: 20, totalMg: 250 },
        { label: "500 мг / 20 мл", concentration: 2.5,   volume: 20, totalMg: 500 }
      ],
      presets: [2.5, 5, 10, 20, 40],
      range: "2.5–10 мкг/кг/мин, при необходимости 20–40",
      warning: null
    },
    propofol: {
      name: "Пропофол", cat: "Гипнотики", icon: "😴", unit: "mg_kg_h",
      forms: [
        { label: "1% — 10 мл", concentration: 1, volume: 10, totalMg: 100 },
        { label: "1% — 20 мл", concentration: 1, volume: 20, totalMg: 200 },
        { label: "1% — 50 мл", concentration: 1, volume: 50, totalMg: 500 }
      ],
      presets: [0.5, 1, 2, 3, 4],
      range: "0.5–4 мг/кг/ч для седации",
      warning: "Гипнотик! Риск угнетения дыхания"
    },
    thiopental: {
      name: "Тиопентал", cat: "Гипнотики", icon: "😴", unit: "mg_kg_h",
      forms: [
        { label: "125 мг / 20 мл", concentration: 0.625, volume: 20, totalMg: 125 },
        { label: "250 мг / 20 мл", concentration: 1.25,  volume: 20, totalMg: 250 },
        { label: "500 мг / 20 мл", concentration: 2.5,   volume: 20, totalMg: 500 },
        { label: "1000 мг / 20 мл", concentration: 5,    volume: 20, totalMg: 1000 }
      ],
      presets: [1, 2, 3, 5],
      range: "1–3 мг/кг/ч",
      warning: "Барбитурат! Риск апноэ"
    },
    midazolam: {
      name: "Мидазолам (дормикум)", cat: "Бензодиазепины", icon: "🧠", unit: "mg_kg_h",
      forms: [
        { label: "0.1% — 2 мл", concentration: 0.1, volume: 2, totalMg: 2 },
        { label: "0.1% — 5 мл", concentration: 0.1, volume: 5, totalMg: 5 },
        { label: "0.5% — 2 мл", concentration: 0.5, volume: 2, totalMg: 10 },
        { label: "0.5% — 3 мл", concentration: 0.5, volume: 3, totalMg: 15 }
      ],
      presets: [0.03, 0.05, 0.1, 0.2, 0.3],
      range: "Нагрузочная 0.1–0.2 мг/кг, поддерживающая 0.03–0.3 мг/кг/ч",
      warning: null
    },
    diazepam: {
      name: "Диазепам (реланиум)", cat: "Бензодиазепины", icon: "🧠", unit: "mg_kg_h",
      forms: [
        { label: "0.5% — 2 мл",  concentration: 0.5, volume: 2,  totalMg: 10 },
        { label: "0.5% — 10 мл", concentration: 0.5, volume: 10, totalMg: 50 }
      ],
      presets: [0.05, 0.1, 0.2],
      range: "0.05–0.1 мг/кг/ч",
      warning: "Медленно! Риск угнетения дыхания"
    }
  };

  var REFERENCE = {
    title: "О калькуляторе инфузомата",
    paragraphs: [
      "Инфузомат (шприцевой насос) обеспечивает точное дозирование препаратов с постоянной скоростью. Формулы:",
      "мкг/кг/мин → мл/ч: (доза × вес × 60) / (концентрация × 1000)",
      "мг/кг/ч → мл/ч: (доза × вес) / концентрация"
    ],
    importantNote: "Калькулятор для врачей ОРИТ. Всегда проверяйте расчёт вручную перед началом инфузии. Учитывайте мёртвый объём инфузионной линии. Мониторируйте витальные функции пациента."
  };

  var state = {
    drug: null, form: null, dilution: 0,
    dose: null, weight: null
  };
  var bodyEl, panelEl;

  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function round2(x) { return Math.round(x * 100) / 100; }
  function round3(x) { return Math.round(x * 1000) / 1000; }

  function renderDrugOptions() {
    var cats = {};
    for (var id in DRUGS) {
      var d = DRUGS[id];
      if (!cats[d.cat]) cats[d.cat] = [];
      cats[d.cat].push({ id: id, name: d.name, icon: d.icon });
    }
    var html = '<option value="">— Выберите препарат —</option>';
    for (var cat in cats) {
      html += '<optgroup label="' + CU.escapeHtml(cat) + '">';
      cats[cat].forEach(function (d) {
        html += '<option value="' + d.id + '"' + (state.drug === d.id ? ' selected' : '') + '>' +
          d.icon + ' ' + CU.escapeHtml(d.name) + '</option>';
      });
      html += '</optgroup>';
    }
    return html;
  }

  function renderDrugInfo() {
    if (!state.drug) return "";
    var d = DRUGS[state.drug];
    var unitLabel = d.unit === "mcg_kg_min" ? "мкг/кг/мин" : "мг/кг/ч";
    var warning = d.warning ? '<div class="drug-info-warning">⚠️ ' + CU.escapeHtml(d.warning) + '</div>' : "";
    return '<div class="infusomat-drug-info">' +
      '<div class="drug-info-header"><span>' + d.icon + '</span><div class="drug-info-name">' + CU.escapeHtml(d.name) + '</div></div>' +
      '<div class="drug-info-details">' +
        '<div class="drug-info-row"><span class="drug-info-label">Диапазон доз:</span><span class="drug-info-value">' + d.range + '</span></div>' +
        '<div class="drug-info-row"><span class="drug-info-label">Единицы:</span><span class="drug-info-value">' + unitLabel + '</span></div>' +
      '</div>' + warning +
    '</div>';
  }

  function renderForms() {
    if (!state.drug) return "";
    var d = DRUGS[state.drug];
    var html = '<div class="infusomat-section card">' +
      '<div class="infusomat-section-title">💊 Форма выпуска</div>' +
      '<div class="infusomat-forms-grid">';
    d.forms.forEach(function (f, idx) {
      var active = state.form === idx ? " active" : "";
      html += '<button type="button" class="infusomat-form-btn' + active + '" data-form="' + idx + '">' +
        '<div class="form-btn-label">' + CU.escapeHtml(f.label) + '</div>' +
        '<div class="form-btn-details">' + f.totalMg + ' мг в ' + f.volume + ' мл</div></button>';
    });
    return html + '</div></div>';
  }

  function renderDilution() {
    if (state.form === null) return "";
    var d = DRUGS[state.drug];
    var form = d.forms[state.form];
    var options = [
      { v: 0,   label: "Без разведения", total: form.volume },
      { v: 10,  label: "До 10 мл",       total: 10 },
      { v: 20,  label: "До 20 мл",       total: 20 },
      { v: 50,  label: "До 50 мл",       total: 50 },
      { v: 100, label: "До 100 мл",      total: 100 }
    ];
    var html = '<div class="infusomat-section card">' +
      '<div class="infusomat-section-title">💧 Объём растворителя</div>' +
      '<div class="infusomat-dilution-grid">';
    options.forEach(function (o) {
      var active = state.dilution === o.v ? " active" : "";
      html += '<button type="button" class="infusomat-dilution-btn' + active + '" data-dilution="' + o.v + '">' +
        '<div class="dilution-btn-label">' + o.label + '</div>' +
        '<div class="dilution-btn-total">Итого: ' + o.total + ' мл</div></button>';
    });
    return html + '</div></div>';
  }

  function renderDose() {
    if (state.form === null) return "";
    var d = DRUGS[state.drug];
    var unitLabel = d.unit === "mcg_kg_min" ? "мкг/кг/мин" : "мг/кг/ч";
    var presetsHtml = d.presets.map(function (p) {
      var active = state.dose === p ? " active" : "";
      return '<button type="button" class="preset-btn' + active + '" data-preset="' + p + '">' + p + '</button>';
    }).join("");

    return '<div class="infusomat-section card">' +
      '<div class="infusomat-section-title">💉 Дозировка и вес пациента</div>' +
      '<div class="infusomat-dose-inputs">' +
        '<div class="dose-input-group"><label class="dose-input-label">Доза (' + unitLabel + ')</label>' +
          '<input type="text" id="doseInput" class="infusomat-field" inputmode="decimal" placeholder="—" value="' + (state.dose !== null ? state.dose : "") + '"></div>' +
        '<div class="dose-input-group"><label class="dose-input-label">Вес пациента (кг)</label>' +
          '<input type="text" id="weightInput" class="infusomat-field" inputmode="decimal" placeholder="—" value="' + (state.weight !== null ? state.weight : "") + '"></div>' +
      '</div>' +
      '<div class="infusomat-dose-presets">' +
        '<div class="presets-label">Быстрый выбор дозы:</div>' +
        '<div class="presets-grid">' + presetsHtml + '</div>' +
      '</div></div>';
  }

  function renderResult() {
    if (!state.drug) return empty("Выберите препарат", "Начните с выбора препарата из списка выше");
    if (state.form === null) return empty("Выберите форму выпуска", "Укажите ампулу или флакон препарата");
    if (state.dose === null || state.weight === null) {
      var missing = [];
      if (state.dose === null) missing.push("дозу");
      if (state.weight === null) missing.push("вес пациента");
      return empty("Введите " + missing.join(" и "), "Заполните оба поля для расчёта скорости");
    }

    var d = DRUGS[state.drug];
    var f = d.forms[state.form];
    var totalVol = state.dilution === 0 ? f.volume : state.dilution;
    var conc = f.totalMg / totalVol; // мг/мл

    var speedH;
    if (d.unit === "mcg_kg_min") {
      speedH = (state.dose * state.weight * 60) / (conc * 1000);
    } else {
      speedH = (state.dose * state.weight) / conc;
    }
    var speedM = speedH / 60;
    var daily = state.dose * state.weight * (d.unit === "mcg_kg_min" ? 60 * 24 / 1000 : 24);
    var hours = totalVol / speedH;

    var warnings = [];
    if (speedH < 0.5) warnings.push("⚠️ Очень низкая скорость! Возможно, концентрация слишком высокая.");
    if (speedH > 100) warnings.push("⚠️ Высокая скорость! Проверьте расчёт и концентрацию.");
    if (speedH > 50)  warnings.push("⚠️ Скорость > 50 мл/ч — используйте инфузомат для растворов, а не шприцевой насос.");
    if (totalVol < 5 && speedH > 0.5 && hours < 2) warnings.push("⚠️ Объём " + totalVol + " мл закончится через " + hours.toFixed(1) + " ч.");

    var unitLabel = d.unit === "mcg_kg_min" ? "мкг/кг/мин" : "мг/кг/ч";
    var dilLabel = state.dilution === 0 ? "без разведения" : "до " + state.dilution + " мл";
    var warningsHtml = warnings.map(function (w) { return '<div class="result-warning">' + w + '</div>'; }).join("");

    return '<div class="result-content result-success infusomat-result">' +
      '<div class="infusomat-result-main">' +
        '<div class="infusomat-result-speed"><div class="speed-value">' + round2(speedH) + '</div><div class="speed-unit">мл/ч</div></div>' +
        '<div class="infusomat-result-alt">= ' + round3(speedM) + ' мл/мин</div>' +
      '</div>' +
      '<div class="infusomat-result-details">' +
        '<div class="result-detail-row"><span class="result-detail-label">Препарат:</span><span class="result-detail-value">' + CU.escapeHtml(d.name) + '</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Форма:</span><span class="result-detail-value">' + CU.escapeHtml(f.label) + '</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Растворитель:</span><span class="result-detail-value">' + dilLabel + '</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Общий объём:</span><span class="result-detail-value">' + totalVol + ' мл</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Концентрация:</span><span class="result-detail-value">' + round3(conc) + ' мг/мл</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Доза:</span><span class="result-detail-value">' + state.dose + ' ' + unitLabel + '</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Вес пациента:</span><span class="result-detail-value">' + state.weight + ' кг</span></div>' +
        '<div class="result-detail-row result-detail-highlight"><span class="result-detail-label">Суточная доза:</span><span class="result-detail-value">' + round2(daily) + ' мг/сут</span></div>' +
        '<div class="result-detail-row result-detail-highlight"><span class="result-detail-label">Хватит на:</span><span class="result-detail-value">' + round2(hours) + ' ч</span></div>' +
      '</div>' + warningsHtml +
    '</div>';
  }

  function empty(label, desc) {
    return '<div class="result-content result-incomplete">' +
      '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">нет данных</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + label + '</div><div class="result-description">' + desc + '</div></div>' +
    '</div>';
  }

  function fullRender() {
    bodyEl.innerHTML =
      '<div class="infusomat-section card">' +
        '<div class="infusomat-section-title">💊 Выбор препарата</div>' +
        '<select id="drugSelect" class="infusomat-select">' + renderDrugOptions() + '</select>' +
        '<div id="drugInfoBox">' + renderDrugInfo() + '</div>' +
      '</div>' +
      '<div id="formsBox">' + renderForms() + '</div>' +
      '<div id="dilutionBox">' + renderDilution() + '</div>' +
      '<div id="doseBox">' + renderDose() + '</div>';
    panelEl.innerHTML = renderResult();
    bindListeners();
  }

  function bindListeners() {
    var sel = document.getElementById("drugSelect");
    if (sel) sel.addEventListener("change", function () {
      state.drug = sel.value || null;
      state.form = null; state.dilution = 0; state.dose = null; state.weight = null;
      fullRender();
    });

    var doseEl = document.getElementById("doseInput");
    var weightEl = document.getElementById("weightInput");
    if (doseEl) doseEl.addEventListener("input", function () {
      state.dose = parseNum(doseEl.value);
      // обновить активный пресет
      document.querySelectorAll(".preset-btn").forEach(function (b) {
        b.classList.toggle("active", parseFloat(b.getAttribute("data-preset")) === state.dose);
      });
      panelEl.innerHTML = renderResult();
    });
    if (weightEl) weightEl.addEventListener("input", function () {
      state.weight = parseNum(weightEl.value);
      panelEl.innerHTML = renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    fullRender();

    bodyEl.addEventListener("click", function (e) {
      var formBtn = e.target.closest(".infusomat-form-btn");
      if (formBtn) {
        state.form = parseInt(formBtn.getAttribute("data-form"), 10);
        state.dilution = 0;
        fullRender();
        return;
      }
      var dilBtn = e.target.closest(".infusomat-dilution-btn");
      if (dilBtn) {
        state.dilution = parseInt(dilBtn.getAttribute("data-dilution"), 10);
        fullRender();
        return;
      }
      var presetBtn = e.target.closest(".preset-btn");
      if (presetBtn) {
        state.dose = parseFloat(presetBtn.getAttribute("data-preset"));
        fullRender();
        return;
      }
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();