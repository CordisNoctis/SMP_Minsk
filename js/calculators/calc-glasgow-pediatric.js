(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var GROUPS = [
    { id: "E", title: "Открывание глаз (E)",  icon: "👁️", items: [
      {v:4,t:"Произвольное"},
      {v:3,t:"Реакция на голос"},
      {v:2,t:"Реакция на боль"},
      {v:1,t:"Отсутствует"}
    ]},
    { id: "V", title: "Речевая реакция (V)",   icon: "👶", items: [
      {v:5,t:"Улыбается, ориентируется на звук, следит за объектами, интерактивен"},
      {v:4,t:"При плаче можно успокоить, интерактивность неполная"},
      {v:3,t:"При плаче успокаивается ненадолго, стонет"},
      {v:2,t:"Не успокаивается при плаче, беспокоен"},
      {v:1,t:"Плач и интерактивность отсутствуют"}
    ]},
    { id: "M", title: "Двигательная реакция (M)", icon: "🤚", items: [
      {v:6,t:"Выполнение движений по голосовой команде"},
      {v:5,t:"Целенаправленное движение в ответ на боль (отталкивание)"},
      {v:4,t:"Отдёргивание в ответ на боль"},
      {v:3,t:"Патологическое сгибание (декортикация)"},
      {v:2,t:"Патологическое разгибание (децеребрация)"},
      {v:1,t:"Отсутствие движений"}
    ]}
  ];

  var RANGES = [
    { min: 15, max: 15, label: "Ясное сознание",        color: "gcs-15",    description: "Ребёнок активен, интерактивен, адекватен возрасту." },
    { min: 14, max: 14, label: "Лёгкое оглушение",      color: "gcs-14",    description: "Незначительная заторможенность, реакция сохранена." },
    { min: 13, max: 13, label: "Умеренное оглушение",   color: "gcs-11-12", description: "Заторможенность, ответы замедленные." },
    { min: 11, max: 12, label: "Глубокое оглушение",    color: "gcs-11-12", description: "Выраженная заторможенность, сонливость." },
    { min: 8,  max: 10, label: "Сопор",                 color: "gcs-8-10",  description: "Глубокое угнетение сознания. При GCS ≤ 8 показана интубация." },
    { min: 6,  max: 7,  label: "Умеренная кома",        color: "gcs-6-7",   description: "Нет реакции на голос, сохраняется реакция на боль." },
    { min: 4,  max: 5,  label: "Глубокая кома",         color: "gcs-4-5",   description: "Реакция только на болевые стимулы." },
    { min: 3,  max: 3,  label: "Запредельная кома",     color: "gcs-3",     description: "Атония, арефлексия, отсутствие всех реакций." }
  ];

  var REFERENCE = {
    title: "О детской ШКГ",
    paragraphs: [
      "Pediatric Glasgow Coma Scale (pGCS) — модификация классической шкалы для детей младше 4 лет, ещё не владеющих полноценной речью.",
      "Ключевое отличие — оценка вербального ответа (V): оцениваются плач, способность к успокоению, интерактивность и слежение за объектами. E и M идентичны взрослой шкале."
    ],
    importantNote: "Если ребёнок интубирован или ещё не умеет говорить, наиболее важна двигательная реакция — оценивайте её особенно тщательно. Баллы начисляются за наилучшее наблюдение."
  };

  var selections = { E: null, V: null, M: null };
  var groupsEl, panelEl;

  function total() {
    if (selections.E === null || selections.V === null || selections.M === null) return null;
    return selections.E + selections.V + selections.M;
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return null;
  }

  function getBreakdown() {
    var parts = [], missing = [];
    var names = { E:"глаза", V:"речь", M:"движение" };
    ["E","V","M"].forEach(function (k) {
      if (selections[k] !== null) parts.push(k + selections[k]);
      else missing.push(names[k]);
    });
    return { formula: parts.join(" + ") || "—", missing: missing };
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
        '<div class="result-info"><div class="result-label">Выберите все 3 параметра</div><div class="result-description">Заполните: ' + bd.missing.join(", ") + '</div></div>' +
        '</div>';
      return;
    }
    var r = getRange(sum);
    if (!r) return;
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + sum + '</div><div class="result-score-label">из 15 (' + bd.formula + ')</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + r.label + '</div><div class="result-description">' + r.description + '</div></div>' +
      '</div>';
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