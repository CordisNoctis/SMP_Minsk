(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var GROUPS = [
    { id: "F", title: "Face (Лицо) — Асимметрия",         icon: "👤", items: [
      {v:0,t:"Норма, симметричные движения"},
      {v:1,t:"Лёгкая асимметрия (сглаженность носогубной складки)"},
      {v:2,t:"Выраженная асимметрия (отчётливый парез)"}
    ]},
    { id: "A", title: "Arms (Руки) — Слабость",           icon: "🤲", items: [
      {v:0,t:"Норма, обе руки удерживает"},
      {v:1,t:"Слабость в одной руке (дрейф, падение)"},
      {v:2,t:"Слабость в обеих руках"}
    ]},
    { id: "S", title: "Speech (Речь) — Нарушения",        icon: "💬", items: [
      {v:0,t:"Норма, чёткая речь"},
      {v:1,t:"Лёгкие нарушения (дизартрия, поиск слов)"},
      {v:2,t:"Выраженные нарушения (афазия, невнятная речь)"}
    ]},
    { id: "T", title: "Time (Время) — От начала симптомов", icon: "⏱️", items: [
      {v:0,t:"Менее 2 часов"},
      {v:1,t:"От 2 до 24 часов"},
      {v:2,t:"Более 24 часов или неизвестно"}
    ]},
    { id: "E", title: "Eyes (Глаза) — Девиация взора",    icon: "👁️", items: [
      {v:0,t:"Норма, взгляд симметричный"},
      {v:1,t:"Вынужденная девиация взора (в сторону очага)"}
    ]}
  ];

  var RANGES = [
    { min: 0, max: 3, label: "Низкая вероятность LVO", color: "gcs-14",    triage: "🏥 Ближайший стационар", description: "Окклюзия крупных сосудов маловероятна. Транспортировка в стационар с инсультным отделением." },
    { min: 4, max: 9, label: "Высокая вероятность LVO", color: "gcs-8-10", triage: "🚑 Сосудистый центр (тромбэктомия)", description: "Высокая вероятность окклюзии крупных сосудов. Транспортировка в центр с тромбэктомией, если время < 24 ч." }
  ];

  var REFERENCE = {
    title: "О шкале FAST-ED",
    paragraphs: [
      "FAST-ED (Field Assessment Stroke Triage for Emergency Destination) разработана в 2017 году для догоспитального выявления пациентов с окклюзией крупных сосудов (LVO).",
      "5 параметров: Face, Arms, Speech, Time, Eyes. Максимум 9 баллов. Порог ≥ 4 балла имеет высокую специфичность для LVO и показаний к тромбэктомии."
    ],
    importantNote: "FAST-ED ≥ 4 балла → направлять в центр с тромбэктомией, если время от начала симптомов < 24 часов."
  };

  var selections = { F: null, A: null, S: null, T: null, E: null };
  var groupsEl, panelEl;

  function total() {
    var vals = [selections.F, selections.A, selections.S, selections.T, selections.E];
    if (vals.some(function (v) { return v === null; })) return null;
    return vals.reduce(function (s, v) { return s + v; }, 0);
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return RANGES[RANGES.length - 1];
  }

  function getBreakdown() {
    var parts = [], missing = [];
    var names = { F:"лицо", A:"руки", S:"речь", T:"время", E:"глаза" };
    ["F","A","S","T","E"].forEach(function (k) {
      if (selections[k] !== null) parts.push(k + selections[k]);
      else missing.push(names[k]);
    });
    return { formula: parts.join("+") || "—", missing: missing };
  }

  function renderGroups() {
    groupsEl.innerHTML = GROUPS.map(function (g) {
      var sel = selections[g.id];
      return '<div class="gcs-group">' +
        '<div class="gcs-group-header"><span>' + g.icon + '</span>' +
        '<span class="gcs-group-title">' + g.title + '</span>' +
        '<span class="gcs-group-value' + (sel != null ? ' has-value' : '') + '">' + (sel != null ? sel : '—') + '</span></div>' +
        '<div class="gcs-group-items">' +
        g.items.map(function (it) {
          return '<div class="gcs-radio-item' + (sel === it.v ? ' selected' : '') + '" data-group="' + g.id + '" data-value="' + it.v + '">' +
            '<div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>' +
            '<div class="gcs-radio-content"><div class="gcs-radio-title">' + it.t + '</div></div>' +
            '<div class="gcs-radio-points">' + it.v + '</div></div>';
        }).join("") +
        '</div></div>';
    }).join("");
  }

  function renderResult() {
    var sum = total();
    var bd = getBreakdown();
    if (sum === null) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">неполная оценка</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните все 5 параметров</div><div class="result-description">Осталось: ' + bd.missing.join(", ") + '</div></div>' +
        '</div>';
      return;
    }
    var r = getRange(sum);
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + sum + '</div><div class="result-score-label">из 9 (' + bd.formula + ')</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
        '<div class="result-label">' + r.label + '</div>' +
        '<div class="result-therapy" style="font-weight:700;margin-bottom:4px;">' + r.triage + '</div>' +
        '<div class="result-description">' + r.description + '</div>' +
      '</div></div>';
  }

  function init() {
    groupsEl = document.getElementById("gcsGroups");
    panelEl = document.getElementById("resultPanel");
    if (!groupsEl || !panelEl) return;

    renderGroups();
    renderResult();

    groupsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".gcs-radio-item");
      if (!item) return;
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      selections[g] = v;
      renderGroups();
      renderResult();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();