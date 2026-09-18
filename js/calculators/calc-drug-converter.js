(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var PRESETS = [
    { name: "Адреналин 0.1%",       percent: 0.1,   icon: "❤️",  warning: "В/в медленно! Критический препарат" },
    { name: "Анальгин 50%",          percent: 50,    icon: "💊",  warning: "Риск анафилаксии!" },
    { name: "Атропин 0.1%",          percent: 0.1,   icon: "💊" },
    { name: "Дексаметазон 0.4%",     percent: 0.4,   icon: "💉" },
    { name: "Димедрол 1%",           percent: 1,     icon: "🧠" },
    { name: "Диазепам 0.5%",         percent: 0.5,   icon: "😴",  warning: "Медленно в/в, риск угнетения дыхания" },
    { name: "Допамин 4%",            percent: 4,     icon: "💓",  warning: "Только через инфузомат!" },
    { name: "Кальция глюконат 10%",  percent: 10,    icon: "🦴" },
    { name: "Кетамин 5%",            percent: 5,     icon: "😴",  warning: "Диссоциативная анестезия" },
    { name: "Лидокаин 2%",           percent: 2,     icon: "💊" },
    { name: "Лидокаин 10%",          percent: 10,    icon: "💊",  warning: "Для аритмий!" },
    { name: "Магния сульфат 25%",    percent: 25,    icon: "🧪" },
    { name: "Мидазолам 0.5%",        percent: 0.5,   icon: "😴" },
    { name: "Морфин 1%",             percent: 1,     icon: "💊",  warning: "Наркотический анальгетик!" },
    { name: "Нитроглицерин 0.1%",    percent: 0.1,   icon: "💓",  warning: "Только через инфузомат!" },
    { name: "Норэпинефрин 0.2%",     percent: 0.2,   icon: "📈",  warning: "Только через ЦВК!" },
    { name: "Новокаин 0.5%",         percent: 0.5,   icon: "💊" },
    { name: "Преднизолон 3%",        percent: 3,     icon: "💉" },
    { name: "Супрастин 2%",          percent: 2,     icon: "🤧" },
    { name: "Трамадол 5%",           percent: 5,     icon: "💊" },
    { name: "Фентанил 0.005%",       percent: 0.005, icon: "💊",  warning: "Сильный опиоид! 50 мкг/мл" },
    { name: "Фуросемид 1%",          percent: 1,     icon: "💧" },
    { name: "Эуфиллин 2.4%",         percent: 2.4,   icon: "🫁" },
    { name: "Глюкоза 40%",           percent: 40,    icon: "🩸",  warning: "Только в центральную вену!" },
    { name: "Глюкоза 5%",            percent: 5,     icon: "💧" },
    { name: "NaCl 0.9%",             percent: 0.9,   icon: "💧" }
  ];

  var MODES = [
    { id: "concentration", label: "Концентр.", icon: "🧪", subtitle: "% ↔ мг/мл" },
    { id: "dose",          label: "По дозе",   icon: "💉", subtitle: "мг → мл" },
    { id: "weight",        label: "По весу",   icon: "⚖️", subtitle: "мг/кг → мл" }
  ];

  var REFERENCE = {
    title: "О калькуляторе",
    paragraphs: [
      "Процентная концентрация (% масс/объём) означает количество граммов вещества в 100 мл раствора.",
      "Формула: 1% = 1 г на 100 мл = 1000 мг на 100 мл = 10 мг на 1 мл. Следовательно: концентрация (мг/мл) = % × 10.",
      "Объём (мл) = доза (мг) / концентрация (мг/мл). При дозировании по массе тела: объём = (доза мг/кг × вес кг) / концентрация."
    ],
    importantNote: "Расчётный объём ориентировочный. Перед введением всегда проверяйте концентрацию на ампуле, срок годности, прозрачность раствора и совместимость.",
    indicationsTitle: "💊 Часто используемые концентрации препаратов:",
    indications: [
      "Адреналин — 0.1% (1 мг/мл)",
      "Анальгин — 50% (500 мг/мл)",
      "Атропин — 0.1% (1 мг/мл)",
      "Дексаметазон — 0.4% (4 мг/мл)",
      "Допамин — 0.5% (5 мг/мл), 4% (40 мг/мл)",
      "Кальция глюконат — 10% (100 мг/мл)",
      "Кетамин — 5% (50 мг/мл)",
      "Лидокаин — 1% (10 мг/мл), 2% (20 мг/мл), 10% (100 мг/мл)",
      "Магния сульфат — 25% (250 мг/мл)",
      "Мидазолам — 0.5% (5 мг/мл)",
      "Морфин — 1% (10 мг/мл)",
      "Нитроглицерин — 0.1% (1 мг/мл)",
      "Новокаин — 0.5% (5 мг/мл), 2% (20 мг/мл)",
      "Норэпинефрин — 0.2% (2 мг/мл)",
      "Преднизолон — 3% (30 мг/мл)",
      "Сибазон (диазепам) — 0.5% (5 мг/мл)",
      "Трамадол — 5% (50 мг/мл)",
      "Фентанил — 0.005% (0.05 мг/мл = 50 мкг/мл)",
      "Эуфиллин — 2.4% (24 мг/мл)"
    ]
  };

  var state = {
    mode: "dose",
    concPercent: null, concMgMl: null,
    doseMg: null, dosePerKg: null, weightKg: null
  };
  var bodyEl, panelEl;

  function parseNum(el) {
    var v = parseFloat(String(el.value).replace(",", "."));
    return isNaN(v) ? null : v;
  }

  function resetButtonHtml() {
    return '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить">↺</button>';
  }

  function renderBody() {
    var mode = state.mode;
    bodyEl.innerHTML =
      '<div class="drug-mode-switcher">' +
      MODES.map(function (m) {
        return '<button type="button" class="drug-mode-btn' + (mode === m.id ? ' active' : '') + '" data-mode="' + m.id + '">' +
          '<span>' + m.icon + '</span>' +
          '<div class="drug-mode-label">' + m.label + '</div>' +
          '<div class="drug-mode-subtitle">' + m.subtitle + '</div></button>';
      }).join("") +
      '</div>' +

      '<details class="drug-presets card" open>' +
        '<summary class="drug-presets-summary"><span>📦</span><span>Популярные препараты</span></summary>' +
        '<div class="drug-presets-grid">' +
        PRESETS.map(function (p, idx) {
          return '<button type="button" class="drug-preset-btn" data-preset="' + idx + '">' +
            '<span>' + p.icon + '</span>' +
            '<div>' + CU.escapeHtml(p.name) + '</div></button>';
        }).join("") +
        '</div></details>' +

      '<div class="card drug-input-card">' +
        '<div class="drug-input-title">🧪 Концентрация препарата</div>' +
        '<div class="drug-input-row">' +
          '<input type="text" id="concPercent" class="drug-field" inputmode="decimal" placeholder="—">' +
          '<span class="drug-unit">%</span>' +
          '<span class="drug-separator">=</span>' +
          '<input type="text" id="concMgMl" class="drug-field" inputmode="decimal" placeholder="—">' +
          '<span class="drug-unit">мг/мл</span>' +
        '</div>' +
        '<div class="drug-hint">1% = 10 мг/мл</div>' +
      '</div>' +

      (mode === "dose" ?
        '<div class="card drug-input-card">' +
          '<div class="drug-input-title">💉 Требуемая доза</div>' +
          '<div class="drug-input-row">' +
            '<input type="text" id="doseMg" class="drug-field" inputmode="decimal" placeholder="—">' +
            '<span class="drug-unit">мг</span>' +
          '</div></div>' : "") +

      (mode === "weight" ?
        '<div class="card drug-input-card">' +
          '<div class="drug-input-title">⚖️ Доза на массу тела</div>' +
          '<div class="drug-input-row">' +
            '<input type="text" id="dosePerKg" class="drug-field" inputmode="decimal" placeholder="—">' +
            '<span class="drug-unit">мг/кг</span>' +
          '</div></div>' +
        '<div class="card drug-input-card">' +
          '<div class="drug-input-title">👤 Масса тела пациента</div>' +
          '<div class="drug-input-row">' +
            '<input type="text" id="weightKg" class="drug-field" inputmode="decimal" placeholder="—">' +
            '<span class="drug-unit">кг</span>' +
          '</div></div>' : "");
  }

  function renderResult() {
    var mode = state.mode;
    var cp = state.concPercent, cm = state.concMgMl;
    var dm = state.doseMg, dpk = state.dosePerKg, w = state.weightKg;

    // Режим 1: только концентрация
    if (mode === "concentration") {
      if (cp === null && cm === null) return renderEmpty("Введите концентрацию", "% или мг/мл");
      var p = cp !== null ? cp : (cm !== null ? Math.round((cm / 10) * 100) / 100 : null);
      var m = cm !== null ? cm : (cp !== null ? Math.round(cp * 10 * 100) / 100 : null);
      panelEl.innerHTML =
        '<div class="result-content result-success drug-result">' +
        '<div class="drug-result-main">' +
          '<div class="drug-result-big">' + p + '%</div>' +
          '<div class="drug-result-eq">=</div>' +
          '<div class="drug-result-big">' + m + ' мг/мл</div>' +
        '</div>' +
        resetButtonHtml() +
        '</div>';
      return;
    }

    // Режим 2: доза в мг
    if (mode === "dose") {
      if (cm === null || dm === null || cm === 0) return renderEmpty("Введите концентрацию и дозу", "для расчёта объёма");
      var vol = dm / cm;
      return renderVolume(vol, dm, false);
    }

    // Режим 3: доза по весу
    if (mode === "weight") {
      if (cm === null || dpk === null || w === null || cm === 0) return renderEmpty("Заполните все поля", "концентрация, мг/кг, вес");
      var td = dpk * w;
      var vol2 = td / cm;
      return renderVolume(vol2, td, true);
    }
  }

  function renderEmpty(label, desc) {
    panelEl.innerHTML =
      '<div class="result-content result-incomplete">' +
      '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">нет данных</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + label + '</div><div class="result-description">' + desc + '</div></div>' +
      resetButtonHtml() +
      '</div>';
  }

  function renderVolume(vol, doseMg, fromWeight) {
    var vr = Math.round(vol * 100) / 100;
    var dr = Math.round(doseMg * 100) / 100;

    var warnings = [];
    if (vr > 20)  warnings.push("⚠️ Большой объём (" + vr + " мл). Проверьте концентрацию!");
    if (vr < 0.1) warnings.push("⚠️ Очень малый объём — используйте более разведённый раствор.");
    if (vr > 100) warnings.push("⚠️ Экстремально большой объём! Проверьте расчёт.");

    var ampoules = [0.5, 1, 2, 5, 10].map(function (a) {
      var count = (vol / a).toFixed(1);
      return '<div class="drug-ampoule-item"><div class="drug-ampoule-count">' + count + '</div><div class="drug-ampoule-label">× ' + a + ' мл</div></div>';
    }).join("");

    panelEl.innerHTML =
      '<div class="result-content result-success drug-result">' +
      '<div class="drug-result-main">' +
        '<div class="drug-result-big">' + vr + '</div>' +
        '<div class="drug-result-unit">мл</div>' +
      '</div>' +
      '<div class="drug-result-details" style="width:100%;margin-top:10px;">' +
        '<div class="drug-result-row"><span class="drug-result-label">Суммарная доза:</span><span class="drug-result-value">' + dr + ' мг</span></div>' +
        (fromWeight ? '<div class="drug-result-row"><span class="drug-result-label">Расчёт:</span><span class="drug-result-value">' + state.dosePerKg + ' мг/кг × ' + state.weightKg + ' кг</span></div>' : "") +
        '<div class="drug-result-row"><span class="drug-result-label">Концентрация:</span><span class="drug-result-value">' + (state.concPercent !== null ? state.concPercent : "?") + '% (' + state.concMgMl + ' мг/мл)</span></div>' +
      '</div>' +
      '<div class="drug-ampoules" style="width:100%;margin-top:10px;">' +
        '<div class="drug-ampoules-title">Это соответствует:</div>' +
        '<div class="drug-ampoules-grid">' + ampoules + '</div>' +
      '</div>' +
      warnings.map(function (w) { return '<div class="result-warning" style="margin-top:8px;">' + w + '</div>'; }).join("") +
      resetButtonHtml() +
      '</div>';
  }

  function syncConcInputs(source) {
    var cpEl = document.getElementById("concPercent");
    var cmEl = document.getElementById("concMgMl");
    if (!cpEl || !cmEl) return;
    if (source === "percent") {
      var v = parseNum(cpEl);
      state.concPercent = v;
      state.concMgMl = v !== null ? Math.round(v * 10 * 100) / 100 : null;
      cmEl.value = state.concMgMl !== null ? state.concMgMl : "";
    } else if (source === "mgml") {
      var v2 = parseNum(cmEl);
      state.concMgMl = v2;
      state.concPercent = v2 !== null ? Math.round((v2 / 10) * 100) / 100 : null;
      cpEl.value = state.concPercent !== null ? state.concPercent : "";
    }
  }

  function bindInputs() {
    var cpEl = document.getElementById("concPercent");
    var cmEl = document.getElementById("concMgMl");
    var dmEl = document.getElementById("doseMg");
    var dpkEl = document.getElementById("dosePerKg");
    var wEl = document.getElementById("weightKg");

    if (cpEl) cpEl.addEventListener("input", function () { syncConcInputs("percent"); renderResult(); });
    if (cmEl) cmEl.addEventListener("input", function () { syncConcInputs("mgml"); renderResult(); });
    if (dmEl) dmEl.addEventListener("input", function () { state.doseMg = parseNum(dmEl); renderResult(); });
    if (dpkEl) dpkEl.addEventListener("input", function () { state.dosePerKg = parseNum(dpkEl); renderResult(); });
    if (wEl) wEl.addEventListener("input", function () { state.weightKg = parseNum(wEl); renderResult(); });

    if (cpEl && state.concPercent !== null) cpEl.value = state.concPercent;
    if (cmEl && state.concMgMl !== null) cmEl.value = state.concMgMl;
    if (dmEl && state.doseMg !== null) dmEl.value = state.doseMg;
    if (dpkEl && state.dosePerKg !== null) dpkEl.value = state.dosePerKg;
    if (wEl && state.weightKg !== null) wEl.value = state.weightKg;
  }

  function fullRender() {
    renderBody();
    bindInputs();
    renderResult();
  }

  function resetAll() {
    state = {
      mode: "dose",
      concPercent: null, concMgMl: null,
      doseMg: null, dosePerKg: null, weightKg: null
    };
    fullRender();
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    fullRender();

    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".drug-mode-btn");
      if (modeBtn) {
        state.mode = modeBtn.getAttribute("data-mode");
        fullRender();
        return;
      }
      var presetBtn = e.target.closest(".drug-preset-btn");
      if (presetBtn) {
        var p = PRESETS[parseInt(presetBtn.getAttribute("data-preset"), 10)];
        if (p.percent !== undefined) {
          state.concPercent = p.percent;
          state.concMgMl = Math.round(p.percent * 10 * 100) / 100;
        } else if (p.mgMl !== undefined) {
          state.concMgMl = p.mgMl;
          state.concPercent = Math.round((p.mgMl / 10) * 100) / 100;
        }
        if (state.mode === "concentration") state.mode = "dose";
        fullRender();
        if (p.warning) CU.showToast("⚠️ " + p.warning);
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

  CU.autoPersist("smp-calc-converter-v1");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();