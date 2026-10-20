(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПАРАМЕТРЫ ШКАЛЫ =====
  var GROUPS = [
    { id: "F", title: "Face (Лицо) — Асимметрия", icon: "👤", color: "#1f6e9c", items: [
      {v:0,t:"Норма, симметричные движения"},
      {v:1,t:"Лёгкая асимметрия (сглаженность носогубной складки)"},
      {v:2,t:"Выраженная асимметрия (отчётливый парез)"}
    ]},
    { id: "A", title: "Arms (Руки) — Слабость", icon: "🤲", color: "#e68a2e", items: [
      {v:0,t:"Норма, обе руки удерживает"},
      {v:1,t:"Слабость в одной руке (дрейф, падение)"},
      {v:2,t:"Слабость в обеих руках"}
    ]},
    { id: "S", title: "Speech (Речь) — Нарушения", icon: "💬", color: "#2e8b57", items: [
      {v:0,t:"Норма, чёткая речь"},
      {v:1,t:"Лёгкие нарушения (дизартрия, поиск слов)"},
      {v:2,t:"Выраженные нарушения (афазия, невнятная речь)"}
    ]},
    { id: "T", title: "Time (Время) — От начала симптомов", icon: "⏱️", color: "#c77700", items: [
      {v:0,t:"Менее 2 часов"},
      {v:1,t:"От 2 до 24 часов"},
      {v:2,t:"Более 24 часов или неизвестно"}
    ]},
    { id: "E", title: "Eyes (Глаза) — Девиация взора", icon: "👁️", color: "#b42323", items: [
      {v:0,t:"Норма, взгляд симметричный"},
      {v:1,t:"Вынужденная девиация взора (в сторону очага)"}
    ]}
  ];

  // ===== ИНТЕРПРЕТАЦИЯ =====
  var RANGES = [
    { min: 0, max: 3, label: "Низкая вероятность LVO", color: "gcs-14" },
    { min: 4, max: 9, label: "Высокая вероятность LVO", color: "gcs-8-10" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв, если markdown-файл не подключён) =====
  var REFERENCE = {
    title: "О шкале FAST-ED",
    paragraphs: [
      "FAST-ED (Field Assessment Stroke Triage for Emergency Destination) разработана в 2017 году для догоспитального выявления пациентов с окклюзией крупных сосудов (LVO).",
      "5 параметров: Face, Arms, Speech, Time, Eyes. Максимум 9 баллов. Порог ≥ 4 балла имеет высокую специфичность для LVO и показаний к тромбэктомии."
    ],
    importantNote: "FAST-ED ≥ 4 балла → направлять в центр с тромбэктомией, если время от начала симптомов < 24 часов."
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-fast-ed-state";
  var state = { selections: { F: null, A: null, S: null, T: null, E: null } };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && saved.selections) {
      state.selections = saved.selections;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function total() {
    var vals = ["F", "A", "S", "T", "E"].map(function (k) { return state.selections[k]; });
    if (vals.some(function (v) { return v === null; })) return null;
    return vals.reduce(function (s, v) { return s + v; }, 0);
  }

  function missingNames() {
    var names = { F: "лицо", A: "руки", S: "речь", T: "время", E: "глаза" };
    var missing = [];
    ["F", "A", "S", "T", "E"].forEach(function (k) {
      if (state.selections[k] === null) missing.push(names[k]);
    });
    return missing;
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++) {
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    }
    return RANGES[RANGES.length - 1];
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderGroups() {
    bodyEl.innerHTML = GROUPS.map(function (g) {
      var sel = state.selections[g.id];
      var scoreDisplay = (sel != null) ? sel : "Х";

      var itemsHtml = g.items.map(function (it) {
        var isChecked = sel === it.v;
        return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-group="' + g.id + '" data-value="' + it.v + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
          '<span class="geneva-radio-custom"></span>' +
          '<span class="geneva-item-content">' +
            '<span class="geneva-item-title">' + CU.escapeHtml(it.t) + '</span>' +
            '<span class="geneva-item-points">' + it.v + '</span>' +
          '</span>' +
        '</div>';
      }).join("");

      return '<div class="geneva-category" style="--cat-color: ' + g.color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">' + g.icon + '</span>' +
            '<span class="geneva-category-title">' + g.title + '</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + scoreDisplay + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  function renderResult() {
    var sum = total();

    if (sum === null) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 9 баллов",
        color: "incomplete",
        title: "Заполните все 5 параметров",
        description: "Осталось: " + missingNames().join(", "),
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var r = getRange(sum);

    CU.renderResultPanel({
      score: sum,
      scoreLabel: "из 9 баллов",
      color: r.color,
      title: r.label,
      description: "",
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    state.selections = { F: null, A: null, S: null, T: null, E: null };
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      var item = e.target.closest(".geneva-radio-item[data-group]");
      if (!item) return;
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.selections[g] = v;
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item[data-group]");
      if (!item) return;
      e.preventDefault();
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.selections[g] = v;
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("fastEdGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.fastEd && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.fastEd });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();