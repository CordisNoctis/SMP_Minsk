(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // Шкала Кассиля: 6 параметров, каждый 0-4 балла
  var PARAMS = [
    {
      id: "consciousness", title: "Сознание", icon: "🧠",
      options: [
        { v: 0, t: "Ясное (норма)", degree: "Норма" },
        { v: 1, t: "Ясное (ОДН I)", degree: "I" },
        { v: 2, t: "Возбуждение, агрессивность", degree: "II" },
        { v: 3, t: "Спутанность, оглушение", degree: "III" },
        { v: 4, t: "Гипоксическая кома, судороги", degree: "IV" }
      ]
    },
    {
      id: "respRate", title: "Частота дыхания (ЧДД, /мин)", icon: "🌬️",
      options: [
        { v: 0, t: "12–16 (норма)", degree: "Норма" },
        { v: 1, t: "14–20 (ОДН I)", degree: "I" },
        { v: 2, t: "20–30 (ОДН II)", degree: "II" },
        { v: 3, t: "30–40 (ОДН III)", degree: "III" },
        { v: 4, t: ">40 или <8 (ОДН IV)", degree: "IV" }
      ]
    },
    {
      id: "skinColor", title: "Цвет кожных покровов", icon: "🩵",
      options: [
        { v: 0, t: "Обычной окраски", degree: "Норма" },
        { v: 1, t: "Бледность, умеренный цианоз (I)", degree: "I" },
        { v: 2, t: "Цианоз (II)", degree: "II" },
        { v: 3, t: "Выраженный цианоз (III)", degree: "III" },
        { v: 4, t: "«Мраморный» цианоз (IV)", degree: "IV" }
      ]
    },
    {
      id: "heartRate", title: "Частота сердечных сокращений (ЧСС)", icon: "❤️",
      options: [
        { v: 0, t: "Норма (60–90)", degree: "Норма" },
        { v: 1, t: "100–110/мин (ОДН I)", degree: "I" },
        { v: 2, t: "110–120/мин (ОДН II)", degree: "II" },
        { v: 3, t: "120–140/мин (ОДН III)", degree: "III" },
        { v: 4, t: ">140 или <60, аритмия (ОДН IV)", degree: "IV" }
      ]
    },
    {
      id: "bp", title: "Артериальное давление (систолическое)", icon: "📈",
      options: [
        { v: 0, t: "Норма (ОДН 0)", degree: "Норма" },
        { v: 1, t: "Норма / умеренная гипертензия (I)", degree: "I" },
        { v: 2, t: "Умеренная гипертензия (II)", degree: "II" },
        { v: 3, t: "Гипертензия (III)", degree: "III" },
        { v: 4, t: "Гипотензия (IV)", degree: "IV" }
      ]
    },
    {
      id: "spo2", title: "SpO₂ на фоне оксигенотерапии", icon: "🫧",
      options: [
        { v: 0, t: "96–99% (норма)", degree: "Норма" },
        { v: 1, t: "92–95% (ОДН I)", degree: "I" },
        { v: 2, t: "90–92% (ОДН II)", degree: "II" },
        { v: 3, t: "85–90% (ОДН III)", degree: "III" },
        { v: 4, t: "<85% (ОДН IV)", degree: "IV" }
      ]
    }
  ];

  // Степени ОДН по максимуму баллов
  var DEGREES = [
    {
      v: 0, label: "Норма", color: "success", icon: "✅",
      desc: "Нормальные показатели. Дыхательная недостаточность отсутствует.",
      action: "Специальная терапия не требуется. Наблюдение."
    },
    {
      v: 1, label: "ОДН I степени (лёгкая)", color: "warning", icon: "⚠️",
      desc: "Компенсированная стадия.",
      action: "Оксигенотерапия, контроль SpO₂. Наблюдение в профильном отделении."
    },
    {
      v: 2, label: "ОДН II степени (средняя)", color: "warning-strong", icon: "⚠️",
      desc: "Субкомпенсированная ОДН.",
      action: "Госпитализация в ОРИТ/пульмонологию. NIV, высокопоточная оксигенация. Мониторинг газов крови."
    },
    {
      v: 3, label: "ОДН III степени (тяжёлая)", color: "error", icon: "🚨",
      desc: "Декомпенсированная дыхательная недостаточность.",
      action: "Экстренная госпитализация в ОРИТ. Высокий риск перехода на ИВЛ. Тщательный мониторинг."
    },
    {
      v: 4, label: "ОДН IV степени (крайне тяжёлая)", color: "critical", icon: "🆘",
      desc: "Угрожающее жизни состояние!",
      action: "Немедленная интубация, ИВЛ. Реанимационные мероприятия. Вазопрессорная поддержка. ОРИТ."
    }
  ];

  var REFERENCE = {
    title: "О шкале Кассиля",
    paragraphs: [
      "Шкала Кассиля — классический метод оценки степени острой дыхательной недостаточности (ОДН) по 6 клиническим параметрам.",
      "Степень ОДН определяется как МАКСИМУМ баллов среди всех 6 параметров (не сумма!). Это позволяет выделить самый тяжёлый симптом."
    ],
    importantNote: "Шкала применима в условиях СМП для быстрой оценки и определения тактики. При ОДН III–IV степени показана экстренная госпитализация в ОРИТ.",
    indicationsTitle: "📋 6 параметров шкалы:",
    indications: [
      "🧠 Сознание: от ясного до гипоксической комы",
      "🌬️ ЧДД: 12–16 (норма) до >40 или <8 (IV степень)",
      "🩵 Цвет кожи: от обычного до «мраморного» цианоза",
      "❤️ ЧСС: 60–90 (норма) до >140, <60 или аритмии",
      "📈 АД сист: от нормы до гипотензии",
      "🫧 SpO₂ на фоне оксигенотерапии: 96–99% до <85%"
    ]
  };

  var selections = {};
  PARAMS.forEach(function (p) { selections[p.id] = null; });

  var bodyEl, panelEl;

  function resetButtonHtml() {
    return '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить">↺</button>';
  }

  function getDegree() {
    var vals = PARAMS.map(function (p) { return selections[p.id]; });
    if (vals.some(function (v) { return v === null; })) return null;
    return Math.max.apply(null, vals);
  }

  function getMissing() {
    return PARAMS.filter(function (p) { return selections[p.id] === null; })
      .map(function (p) { return p.title.split(' ')[0]; });
  }

  function getDegreeInfo(d) {
    for (var i = 0; i < DEGREES.length; i++) {
      if (DEGREES[i].v === d) return DEGREES[i];
    }
    return DEGREES[0];
  }

  function getOptionText(paramId, value) {
    var p = PARAMS.find(function (x) { return x.id === paramId; });
    if (!p) return "—";
    var opt = p.options.find(function (o) { return o.v === value; });
    return opt ? opt.t : "—";
  }

  function renderBody() {
    bodyEl.innerHTML = PARAMS.map(function (p) {
      var sel = selections[p.id];
      var optsHtml = p.options.map(function (o) {
        var active = sel === o.v ? ' selected' : '';
        return '<div class="odn-option' + active + '" data-param="' + p.id + '" data-value="' + o.v + '">' +
          '<div class="odn-option-circle"><div class="odn-option-dot"></div></div>' +
          '<div class="odn-option-text">' + CU.escapeHtml(o.t) + '</div>' +
          '<div class="odn-option-score">' + o.v + '</div>' +
        '</div>';
      }).join("");

      return '<div class="odn-param-card">' +
        '<div class="odn-param-header">' +
          '<span class="odn-param-icon">' + p.icon + '</span>' +
          '<span class="odn-param-title">' + p.title + '</span>' +
          (sel !== null ? '<span class="odn-param-value">' + sel + '</span>' : '') +
        '</div>' +
        '<div class="odn-options-grid">' + optsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  function renderResult() {
    var d = getDegree();

    if (d === null) {
      var missing = getMissing();
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">неполная оценка</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните все параметры</div><div class="result-description">Осталось: ' + missing.join(", ") + '</div></div>' +
        resetButtonHtml() +
        '</div>';
      return;
    }

    var info = getDegreeInfo(d);

    // Сводка всех параметров
    var summaryHtml = '<div class="odn-summary-grid">' +
      PARAMS.map(function (p) {
        var v = selections[p.id];
        return '<div class="odn-summary-item">' +
          '<div class="odn-summary-icon">' + p.icon + '</div>' +
          '<div class="odn-summary-text">' + CU.escapeHtml(getOptionText(p.id, v)) + '</div>' +
        '</div>';
      }).join("") +
    '</div>';

    panelEl.innerHTML =
      '<div class="result-content result-' + info.color + ' odn-result">' +
      '<div class="odn-result-main">' +
        '<div class="odn-degree-icon">' + info.icon + '</div>' +
        '<div class="odn-degree-text">' + info.label + '</div>' +
      '</div>' +
      summaryHtml +
      '<div class="odn-result-desc">' + info.desc + '</div>' +
      '<div class="odn-result-action">📋 ' + info.action + '</div>' +
      resetButtonHtml() +
      '</div>';
  }

  function resetAll() {
    PARAMS.forEach(function (p) { selections[p.id] = null; });
    fullRender();
  }

  function fullRender() {
    renderBody();
    renderResult();
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    fullRender();

    bodyEl.addEventListener("click", function (e) {
      var opt = e.target.closest(".odn-option");
      if (!opt) return;
      var paramId = opt.getAttribute("data-param");
      var value = parseInt(opt.getAttribute("data-value"), 10);
      selections[paramId] = value;
      fullRender();
    });

    panelEl.addEventListener("click", function (e) {
      if (e.target.closest(".result-reset-big")) resetAll();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }
  
  CU.autoPersist("smp-calc-odn-v1");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();