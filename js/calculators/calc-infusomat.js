(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var INFUSOMAT_DRUGS = {
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

  var CATHETERS = [
    { gauge: "G24", color: "жёлтый", maxMlMin: 20, maxMlHour: 1200, desc: "Новорождённые, дети, мелкие вены" },
    { gauge: "G22", color: "голубой", maxMlMin: 35, maxMlHour: 2100, desc: "Дети, пожилые, стандартные инфузии" },
    { gauge: "G20", color: "розовый", maxMlMin: 60, maxMlHour: 3600, desc: "Стандартный, большинство взрослых" },
    { gauge: "G18", color: "зелёный", maxMlMin: 100, maxMlHour: 6000, desc: "Быстрые инфузии, травматология" },
    { gauge: "G16", color: "серый", maxMlMin: 200, maxMlHour: 12000, desc: "Массивные инфузии, реанимация" }
  ];

  var REFERENCE = {
    title: "О калькуляторе скорости инфузии",
    paragraphs: [
      "Калькулятор объединяет два инструмента:",
      "1. Инфузомат — для точного дозирования критических препаратов (вазопрессоры, седативные) через шприцевой насос.",
      "2. Капельница — для расчёта скорости обычных инфузий (кристаллоиды, растворы) через стандартную систему."
    ],
    importantNote: "Всегда проверяйте расчёт вручную перед началом инфузии. Учитывайте мёртвый объём инфузионной линии. Мониторируйте витальные функции пациента.",
    indicationsTitle: "💧 Формулы расчёта:",
    indications: [
      "ИНФУЗОМАТ (шприцевой насос):",
      "мкг/кг/мин → мл/ч: (доза × вес × 60) / (концентрация × 1000)",
      "мг/кг/ч → мл/ч: (доза × вес) / концентрация",
      "",
      "КАПЕЛЬНИЦА (стандартная система 20 капель/мл):",
      "Капли/мин = (Объём мл × 20) ÷ Время (мин)",
      "мл/ч = (Объём мл ÷ Время мин) × 60",
      "",
      "ПОДБОР КАТЕТЕРА (максимальные скорости):",
      "G24 (жёлтый) — 20 мл/мин (1200 мл/ч) — новорождённые, дети",
      "G22 (голубой) — 35 мл/мин (2100 мл/ч) — дети, пожилые",
      "G20 (розовый) — 60 мл/мин (3600 мл/ч) — стандарт для взрослых",
      "G18 (зелёный) — 100 мл/мин (6000 мл/ч) — быстрые инфузии",
      "G16 (серый) — 200 мл/мин (12000 мл/ч) — массивные инфузии",
      "",
      "⚠️ Превышение максимальной скорости катетера может привести к повреждению вены и экстравазации"
    ]
  };

  var state = {
    mode: "infusomat",
    infusomat: { drug: null, form: null, dilution: 0, dose: null, weight: null },
    drip: { volume: 250, timeValue: 60, timeUnit: "minutes" }
  };
  var bodyEl, panelEl;

  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function round2(x) { return Math.round(x * 100) / 100; }
  function round3(x) { return Math.round(x * 1000) / 1000; }

  function resetButtonHtml() {
    return '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить">↺</button>';
  }

  // ===== РЕНДЕРИНГ РЕЖИМОВ =====

  function renderModeSwitcher() {
    return '<div class="infusomat-section card">' +
      '<div class="infusomat-mode-switcher">' +
        '<button type="button" class="mode-btn' + (state.mode === "infusomat" ? ' active' : '') + '" data-mode="infusomat">' +
          '<span>💊</span><div class="mode-btn-label">Инфузомат</div>' +
          '<div class="mode-btn-desc">Шприцевой насос</div>' +
        '</button>' +
        '<button type="button" class="mode-btn' + (state.mode === "drip" ? ' active' : '') + '" data-mode="drip">' +
          '<span>💧</span><div class="mode-btn-label">Капельница</div>' +
          '<div class="mode-btn-desc">Стандартная система</div>' +
        '</button>' +
      '</div></div>';
  }

  // ===== ИНФУЗОМАТ =====

  function renderInfusomatDrugOptions() {
    var cats = {};
    for (var id in INFUSOMAT_DRUGS) {
      var d = INFUSOMAT_DRUGS[id];
      if (!cats[d.cat]) cats[d.cat] = [];
      cats[d.cat].push({ id: id, name: d.name, icon: d.icon });
    }
    var html = '<option value="">— Выберите препарат —</option>';
    for (var cat in cats) {
      html += '<optgroup label="' + CU.escapeHtml(cat) + '">';
      cats[cat].forEach(function (d) {
        html += '<option value="' + d.id + '"' + (state.infusomat.drug === d.id ? ' selected' : '') + '>' +
          d.icon + ' ' + CU.escapeHtml(d.name) + '</option>';
      });
      html += '</optgroup>';
    }
    return html;
  }

  function renderInfusomatDrugInfo() {
    var s = state.infusomat;
    if (!s.drug) return "";
    var d = INFUSOMAT_DRUGS[s.drug];
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

  function renderInfusomatForms() {
    var s = state.infusomat;
    if (!s.drug) return "";
    var d = INFUSOMAT_DRUGS[s.drug];
    var html = '<div class="infusomat-section card">' +
      '<div class="infusomat-section-title">💊 Форма выпуска</div>' +
      '<div class="infusomat-forms-grid">';
    d.forms.forEach(function (f, idx) {
      var active = s.form === idx ? " active" : "";
      html += '<button type="button" class="infusomat-form-btn' + active + '" data-form="' + idx + '">' +
        '<div class="form-btn-label">' + CU.escapeHtml(f.label) + '</div>' +
        '<div class="form-btn-details">' + f.totalMg + ' мг в ' + f.volume + ' мл</div></button>';
    });
    return html + '</div></div>';
  }

  function renderInfusomatDilution() {
    var s = state.infusomat;
    if (s.form === null) return "";
    var d = INFUSOMAT_DRUGS[s.drug];
    var form = d.forms[s.form];
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
      var active = s.dilution === o.v ? " active" : "";
      html += '<button type="button" class="infusomat-dilution-btn' + active + '" data-dilution="' + o.v + '">' +
        '<div class="dilution-btn-label">' + o.label + '</div>' +
        '<div class="dilution-btn-total">Итого: ' + o.total + ' мл</div></button>';
    });
    return html + '</div></div>';
  }

  function renderInfusomatDose() {
    var s = state.infusomat;
    if (s.form === null) return "";
    var d = INFUSOMAT_DRUGS[s.drug];
    var unitLabel = d.unit === "mcg_kg_min" ? "мкг/кг/мин" : "мг/кг/ч";
    var presetsHtml = d.presets.map(function (p) {
      var active = s.dose === p ? " active" : "";
      return '<button type="button" class="preset-btn' + active + '" data-preset="' + p + '">' + p + '</button>';
    }).join("");

    return '<div class="infusomat-section card">' +
      '<div class="infusomat-section-title">💉 Дозировка и вес пациента</div>' +
      '<div class="infusomat-dose-inputs">' +
        '<div class="dose-input-group"><label class="dose-input-label">Доза (' + unitLabel + ')</label>' +
          '<input type="text" id="doseInput" class="infusomat-field" inputmode="decimal" placeholder="—" value="' + (s.dose !== null ? s.dose : "") + '"></div>' +
        '<div class="dose-input-group"><label class="dose-input-label">Вес пациента (кг)</label>' +
          '<input type="text" id="weightInput" class="infusomat-field" inputmode="decimal" placeholder="—" value="' + (s.weight !== null ? s.weight : "") + '"></div>' +
      '</div>' +
      '<div class="infusomat-dose-presets">' +
        '<div class="presets-label">Быстрый выбор дозы:</div>' +
        '<div class="presets-grid">' + presetsHtml + '</div>' +
      '</div></div>';
  }

  function renderInfusomatResult() {
    var s = state.infusomat;
    if (!s.drug) return empty("Выберите препарат", "Начните с выбора препарата из списка выше");
    if (s.form === null) return empty("Выберите форму выпуска", "Укажите ампулу или флакон препарата");
    if (s.dose === null || s.weight === null) {
      var missing = [];
      if (s.dose === null) missing.push("дозу");
      if (s.weight === null) missing.push("вес пациента");
      return empty("Введите " + missing.join(" и "), "Заполните оба поля для расчёта скорости");
    }

    var d = INFUSOMAT_DRUGS[s.drug];
    var f = d.forms[s.form];
    var totalVol = s.dilution === 0 ? f.volume : s.dilution;
    var conc = f.totalMg / totalVol;

    var speedH = d.unit === "mcg_kg_min"
      ? (s.dose * s.weight * 60) / (conc * 1000)
      : (s.dose * s.weight) / conc;
    var speedM = speedH / 60;
    var daily = s.dose * s.weight * (d.unit === "mcg_kg_min" ? 60 * 24 / 1000 : 24);
    var hours = totalVol / speedH;

    var warnings = [];
    if (speedH < 0.5) warnings.push("⚠️ Очень низкая скорость! Возможно, концентрация слишком высокая.");
    if (speedH > 100) warnings.push("⚠️ Высокая скорость! Проверьте расчёт и концентрацию.");
    if (speedH > 50)  warnings.push("⚠️ Скорость > 50 мл/ч — используйте инфузомат для растворов, а не шприцевой насос.");
    if (totalVol < 5 && speedH > 0.5 && hours < 2) warnings.push("⚠️ Объём " + totalVol + " мл закончится через " + hours.toFixed(1) + " ч.");

    var unitLabel = d.unit === "mcg_kg_min" ? "мкг/кг/мин" : "мг/кг/ч";
    var dilLabel = s.dilution === 0 ? "без разведения" : "до " + s.dilution + " мл";
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
        '<div class="result-detail-row"><span class="result-detail-label">Доза:</span><span class="result-detail-value">' + s.dose + ' ' + unitLabel + '</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Вес пациента:</span><span class="result-detail-value">' + s.weight + ' кг</span></div>' +
        '<div class="result-detail-row result-detail-highlight"><span class="result-detail-label">Суточная доза:</span><span class="result-detail-value">' + round2(daily) + ' мг/сут</span></div>' +
        '<div class="result-detail-row result-detail-highlight"><span class="result-detail-label">Хватит на:</span><span class="result-detail-value">' + round2(hours) + ' ч</span></div>' +
      '</div>' + warningsHtml +
      resetButtonHtml() +
    '</div>';
  }

  // ===== КАПЕЛЬНИЦА =====

  function renderDripForm() {
    var d = state.drip;
    return '<div class="infusomat-section card">' +
      '<div class="infusomat-section-title">💧 Параметры инфузии</div>' +
      '<div class="drip-input-group">' +
        '<label class="drip-input-label">Объём раствора (мл)</label>' +
        '<input type="text" id="dripVolume" class="infusomat-field" inputmode="decimal" placeholder="250" value="' + (d.volume !== null ? d.volume : "") + '">' +
      '</div>' +
      '<div class="drip-input-row">' +
        '<div class="drip-input-group" style="flex:2;">' +
          '<label class="drip-input-label">⏱️ Время введения</label>' +
          '<input type="text" id="dripTimeValue" class="infusomat-field" inputmode="decimal" placeholder="60" value="' + (d.timeValue !== null ? d.timeValue : "") + '">' +
        '</div>' +
        '<div class="drip-input-group" style="flex:1;">' +
          '<label class="drip-input-label">📅 Единица</label>' +
          '<select id="dripTimeUnit" class="infusomat-field">' +
            '<option value="minutes"' + (d.timeUnit === "minutes" ? ' selected' : '') + '>минуты</option>' +
            '<option value="hours"' + (d.timeUnit === "hours" ? ' selected' : '') + '>часы</option>' +
          '</select>' +
        '</div>' +
      '</div></div>';
  }

  function calculateDrip() {
    var d = state.drip;
    var volume = d.volume;
    var timeValue = d.timeValue;
    var timeUnit = d.timeUnit;

    if (volume === null || timeValue === null || timeValue === 0) return null;

    var timeInMinutes = timeUnit === "hours" ? timeValue * 60 : timeValue;
    var dropsPerMin = (volume * 20) / timeInMinutes;
    var mlPerHour = (volume / timeInMinutes) * 60;
    var mlPerMin = volume / timeInMinutes;

    return { dropsPerMin: dropsPerMin, mlPerHour: mlPerHour, mlPerMin: mlPerMin, timeInMinutes: timeInMinutes };
  }

  function renderDripResult() {
    var d = state.drip;
    if (d.volume === null || d.timeValue === null) {
      return empty("Введите объём и время", "Укажите объём раствора и время введения");
    }

    var calc = calculateDrip();
    if (!calc) return empty("Ошибка расчёта", "Проверьте введённые данные");

    var dropsRounded = calc.dropsPerMin >= 1 ? Math.round(calc.dropsPerMin) : calc.dropsPerMin.toFixed(2);
    var dropsPerSec = calc.dropsPerMin / 60;
    var dropsSecRounded = dropsPerSec < 0.1 ? dropsPerSec.toFixed(3) : dropsPerSec.toFixed(1);

    var speedDisplay = calc.mlPerHour >= 1
      ? calc.mlPerHour.toFixed(1) + ' мл/ч (' + calc.mlPerMin.toFixed(1) + ' мл/мин)'
      : calc.mlPerMin.toFixed(2) + ' мл/мин (' + calc.mlPerHour.toFixed(2) + ' мл/ч)';

    var warnings = [];
    if (calc.dropsPerMin > 200) warnings.push("⚠️ Очень высокая скорость капель!");

    // Подбор катетера
    var suitableCatheters = CATHETERS.filter(function (c) { return calc.mlPerMin <= c.maxMlMin; });
    var catheterHtml = '<div class="catheters-section">' +
      '<div class="catheters-title">🩸 Рекомендации по выбору катетера:</div>' +
      '<div class="catheters-grid">';

    CATHETERS.forEach(function (c) {
      var isSuitable = suitableCatheters.indexOf(c) !== -1;
      var exceeded = calc.mlPerMin > c.maxMlMin && calc.mlPerMin > 0;
      var cls = isSuitable ? 'catheter-card suitable' : 'catheter-card';
      if (exceeded) cls += ' exceeded';

      var maxDrops = Math.round(c.maxMlMin * 20);
      var warningText = exceeded ? '<div class="catheter-warning">⚠️ Превышение!</div>' : '';

      catheterHtml +=
        '<div class="' + cls + '">' +
          '<div class="catheter-gauge">' + c.gauge + ' (' + c.color + ')</div>' +
          '<div class="catheter-desc">' + c.desc + '</div>' +
          '<div class="catheter-flow">📈 Макс: ' + c.maxMlMin + ' мл/мин</div>' +
          '<div class="catheter-max">⚡ ' + c.maxMlMin + ' мл/мин (' + c.maxMlHour + ' мл/ч)</div>' +
          '<div class="catheter-drops"><div class="catheter-drops-value">' + maxDrops + '</div><div class="catheter-drops-label">макс. капель/мин</div></div>' +
          warningText +
        '</div>';
    });

    catheterHtml += '</div>';
    if (suitableCatheters.length === 0 && calc.mlPerMin > 0) {
      catheterHtml += '<div class="result-warning">⚠️ Ни один катетер не подходит! Скорость слишком высокая.</div>';
    }
    catheterHtml += '</div>';

    var warningsHtml = warnings.map(function (w) { return '<div class="result-warning">' + w + '</div>'; }).join("");

    return '<div class="result-content result-success drip-result">' +
      '<div class="drip-result-main">' +
        '<div class="drip-result-item">' +
          '<div class="drip-result-value">' + dropsRounded + '</div>' +
          '<div class="drip-result-unit">капель/мин</div>' +
        '</div>' +
        '<div class="drip-result-item">' +
          '<div class="drip-result-value">' + dropsSecRounded + '</div>' +
          '<div class="drip-result-unit">капель/сек</div>' +
        '</div>' +
      '</div>' +
      '<div class="drip-result-details">' +
        '<div class="result-detail-row"><span class="result-detail-label">💧 Скорость инфузии:</span><span class="result-detail-value">' + speedDisplay + '</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Объём:</span><span class="result-detail-value">' + d.volume + ' мл</span></div>' +
        '<div class="result-detail-row"><span class="result-detail-label">Время:</span><span class="result-detail-value">' + d.timeValue + ' ' + (d.timeUnit === "hours" ? "ч" : "мин") + '</span></div>' +
      '</div>' +
      catheterHtml +
      warningsHtml +
      resetButtonHtml() +
    '</div>';
  }

  // ===== ОБЩИЕ ФУНКЦИИ =====

  function empty(label, desc) {
    return '<div class="result-content result-incomplete">' +
      '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">нет данных</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + label + '</div><div class="result-description">' + desc + '</div></div>' +
      resetButtonHtml() +
    '</div>';
  }

  function renderBody() {
    var html = renderModeSwitcher();

    if (state.mode === "infusomat") {
      html += '<div class="infusomat-section card">' +
        '<div class="infusomat-section-title">💊 Выбор препарата</div>' +
        '<select id="drugSelect" class="infusomat-select">' + renderInfusomatDrugOptions() + '</select>' +
        '<div id="drugInfoBox">' + renderInfusomatDrugInfo() + '</div>' +
      '</div>' +
      '<div id="formsBox">' + renderInfusomatForms() + '</div>' +
      '<div id="dilutionBox">' + renderInfusomatDilution() + '</div>' +
      '<div id="doseBox">' + renderInfusomatDose() + '</div>';
    } else {
      html += renderDripForm();
    }

    bodyEl.innerHTML = html;
  }

  function renderResult() {
    if (state.mode === "infusomat") {
      panelEl.innerHTML = renderInfusomatResult();
    } else {
      panelEl.innerHTML = renderDripResult();
    }
  }

  function fullRender() {
    renderBody();
    renderResult();
    bindListeners();
  }

  function bindListeners() {
    if (state.mode === "infusomat") {
      var sel = document.getElementById("drugSelect");
      if (sel) sel.addEventListener("change", function () {
        state.infusomat.drug = sel.value || null;
        state.infusomat.form = null;
        state.infusomat.dilution = 0;
        state.infusomat.dose = null;
        state.infusomat.weight = null;
        fullRender();
      });

      var doseEl = document.getElementById("doseInput");
      var weightEl = document.getElementById("weightInput");
      if (doseEl) doseEl.addEventListener("input", function () {
        state.infusomat.dose = parseNum(doseEl.value);
        document.querySelectorAll(".preset-btn").forEach(function (b) {
          b.classList.toggle("active", parseFloat(b.getAttribute("data-preset")) === state.infusomat.dose);
        });
        renderResult();
      });
      if (weightEl) weightEl.addEventListener("input", function () {
        state.infusomat.weight = parseNum(weightEl.value);
        renderResult();
      });
    } else {
      var volEl = document.getElementById("dripVolume");
      var timeValEl = document.getElementById("dripTimeValue");
      var timeUnitEl = document.getElementById("dripTimeUnit");

      if (volEl) volEl.addEventListener("input", function () {
        state.drip.volume = parseNum(volEl.value);
        renderResult();
      });
      if (timeValEl) timeValEl.addEventListener("input", function () {
        state.drip.timeValue = parseNum(timeValEl.value);
        renderResult();
      });
      if (timeUnitEl) timeUnitEl.addEventListener("change", function () {
        state.drip.timeUnit = timeUnitEl.value;
        renderResult();
      });
    }
  }

  function resetAll() {
    if (state.mode === "infusomat") {
      state.infusomat = { drug: null, form: null, dilution: 0, dose: null, weight: null };
    } else {
      state.drip = { volume: 250, timeValue: 60, timeUnit: "minutes" };
    }
    fullRender();
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    fullRender();

    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".mode-btn");
      if (modeBtn) {
        state.mode = modeBtn.getAttribute("data-mode");
        fullRender();
        return;
      }

      if (state.mode === "infusomat") {
        var formBtn = e.target.closest(".infusomat-form-btn");
        if (formBtn) {
          state.infusomat.form = parseInt(formBtn.getAttribute("data-form"), 10);
          state.infusomat.dilution = 0;
          fullRender();
          return;
        }
        var dilBtn = e.target.closest(".infusomat-dilution-btn");
        if (dilBtn) {
          state.infusomat.dilution = parseInt(dilBtn.getAttribute("data-dilution"), 10);
          fullRender();
          return;
        }
        var presetBtn = e.target.closest(".preset-btn");
        if (presetBtn) {
          state.infusomat.dose = parseFloat(presetBtn.getAttribute("data-preset"));
          fullRender();
          return;
        }
      }
    });

    panelEl.addEventListener("click", function (e) {
      if (e.target.closest(".result-reset-big")) resetAll();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  CU.autoPersist("smp-calc-infusomat-v1");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();