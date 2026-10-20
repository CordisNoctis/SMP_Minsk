(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПАРАМЕТРЫ ШКАЛЫ =====
  var PARAMS = [
    { id: "consciousness", title: "Сознание", icon: "🧠", color: "#1f6e9c", options: [
      { v: 0, t: "Ясное (норма)" },
      { v: 1, t: "Ясное (ОДН I)" },
      { v: 2, t: "Возбуждение, агрессивность" },
      { v: 3, t: "Спутанность, оглушение" },
      { v: 4, t: "Гипоксическая кома, судороги" }
    ]},
    { id: "respRate", title: "Частота дыхания (ЧДД, /мин)", icon: "🌬️", color: "#e68a2e", options: [
      { v: 0, t: "12–16 (норма)" },
      { v: 1, t: "14–20 (ОДН I)" },
      { v: 2, t: "20–30 (ОДН II)" },
      { v: 3, t: "30–40 (ОДН III)" },
      { v: 4, t: ">40 или <8 (ОДН IV)" }
    ]},
    { id: "skinColor", title: "Цвет кожных покровов", icon: "🩵", color: "#2e8b57", options: [
      { v: 0, t: "Обычной окраски" },
      { v: 1, t: "Бледность, умеренный цианоз (I)" },
      { v: 2, t: "Цианоз (II)" },
      { v: 3, t: "Выраженный цианоз (III)" },
      { v: 4, t: "«Мраморный» цианоз (IV)" }
    ]},
    { id: "heartRate", title: "Частота сердечных сокращений (ЧСС)", icon: "❤️", color: "#b42323", options: [
      { v: 0, t: "Норма (60–90)" },
      { v: 1, t: "100–110/мин (ОДН I)" },
      { v: 2, t: "110–120/мин (ОДН II)" },
      { v: 3, t: "120–140/мин (ОДН III)" },
      { v: 4, t: ">140 или <60, аритмия (ОДН IV)" }
    ]},
    { id: "bp", title: "Артериальное давление (систолическое)", icon: "📈", color: "#6a5acd", options: [
      { v: 0, t: "Норма (ОДН 0)" },
      { v: 1, t: "Норма / умеренная гипертензия (I)" },
      { v: 2, t: "Умеренная гипертензия (II)" },
      { v: 3, t: "Гипертензия (III)" },
      { v: 4, t: "Гипотензия (IV)" }
    ]},
    { id: "spo2", title: "SpO₂ на фоне оксигенотерапии", icon: "🫧", color: "#8b5a2b", options: [
      { v: 0, t: "96–99% (норма)" },
      { v: 1, t: "92–95% (ОДН I)" },
      { v: 2, t: "90–92% (ОДН II)" },
      { v: 3, t: "85–90% (ОДН III)" },
      { v: 4, t: "<85% (ОДН IV)" }
    ]}
  ];

  // ===== СТЕПЕНИ ОДН =====
  var DEGREES = [
    { v: 0, label: "Норма", color: "gcs-15" },
    { v: 1, label: "ОДН I степени", color: "gcs-14" },
    { v: 2, label: "ОДН II степени", color: "gcs-11-12" },
    { v: 3, label: "ОДН III степени", color: "gcs-6-7" },
    { v: 4, label: "ОДН IV степени", color: "gcs-3" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв) =====
  var REFERENCE = {
    title: "О шкале Кассиля",
    paragraphs: [
      "Шкала Кассиля — классический метод оценки степени острой дыхательной недостаточности (ОДН) по 6 клиническим параметрам.",
      "Степень ОДН определяется как МАКСИМУМ баллов среди всех 6 параметров (не сумма!). Это позволяет выделить самый тяжёлый симптом."
    ],
    importantNote: "Шкала применима в условиях СМП для быстрой оценки. При ОДН III–IV степени показана экстренная госпитализация в ОРИТ."
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-odn-state";
  var state = { selections: {} };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && saved.selections) {
      state.selections = saved.selections;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function getDegree() {
    var vals = PARAMS.map(function (p) { return state.selections[p.id]; });
    if (vals.some(function (v) { return v === undefined || v === null; })) return null;
    return Math.max.apply(null, vals);
  }

  function filledCount() {
    var count = 0;
    PARAMS.forEach(function (p) {
      if (state.selections[p.id] !== undefined && state.selections[p.id] !== null) count++;
    });
    return count;
  }

  function getDegreeInfo(d) {
    for (var i = 0; i < DEGREES.length; i++) {
      if (DEGREES[i].v === d) return DEGREES[i];
    }
    return DEGREES[0];
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderGroups() {
    bodyEl.innerHTML = PARAMS.map(function (p) {
      var sel = state.selections[p.id];
      var scoreDisplay = (sel !== undefined && sel !== null) ? sel : "Х";

      var optionsHtml = p.options.map(function (o) {
        var isChecked = sel === o.v;
        return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-param="' + p.id + '" data-value="' + o.v + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
          '<span class="geneva-radio-custom"></span>' +
          '<span class="geneva-item-content">' +
            '<span class="geneva-item-title">' + CU.escapeHtml(o.t) + '</span>' +
            '<span class="geneva-item-points">' + o.v + '</span>' +
          '</span>' +
        '</div>';
      }).join("");

      return '<div class="geneva-category" style="--cat-color: ' + p.color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">' + p.icon + '</span>' +
            '<span class="geneva-category-title">' + p.title + '</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + scoreDisplay + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + optionsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  function renderResult() {
    var filled = filledCount();

    if (filled < PARAMS.length) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "",
        color: "incomplete",
        title: "Оцените все параметры",
        description: "Заполнено: " + filled + " из " + PARAMS.length,
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var d = getDegree();
    var info = getDegreeInfo(d);

    CU.renderResultPanel({
      score: d,
      scoreLabel: "балл (максимум)",
      color: info.color,
      title: info.label,
      description: "",
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    state.selections = {};
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      var item = e.target.closest(".geneva-radio-item[data-param]");
      if (!item) return;
      var paramId = item.getAttribute("data-param");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.selections[paramId] = v;
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item[data-param]");
      if (!item) return;
      e.preventDefault();
      var paramId = item.getAttribute("data-param");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.selections[paramId] = v;
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("odnGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.odn && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.odn });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();