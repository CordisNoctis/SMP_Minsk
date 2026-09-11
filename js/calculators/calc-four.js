(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var GROUPS = [
    { id: "E", title: "Глазные реакции (E)",    icon: "👁️", items: [
      {v:4,t:"Глаза открыты, слежение и мигание по команде"},
      {v:3,t:"Глаза открыты, но нет слежения"},
      {v:2,t:"Открываются на громкий звук, но слежения нет"},
      {v:1,t:"Открываются на боль, но слежения нет"},
      {v:0,t:"Остаются закрытыми в ответ на боль"}
    ]},
    { id: "M", title: "Двигательные реакции (M)", icon: "🤚", items: [
      {v:4,t:"Выполняет команды (знак «ОК», кулак, знак мира)"},
      {v:3,t:"Локализует боль"},
      {v:2,t:"Сгибательный ответ на боль"},
      {v:1,t:"Разгибательная поза на боль"},
      {v:0,t:"Нет ответа или миоклонический статус"}
    ]},
    { id: "B", title: "Стволовые рефлексы (B)",  icon: "🧠", items: [
      {v:4,t:"Зрачковый и корнеальный рефлексы сохранены"},
      {v:3,t:"Один зрачок расширен и не реагирует на свет"},
      {v:2,t:"Зрачковый или роговичный рефлексы отсутствуют"},
      {v:1,t:"Оба рефлекса отсутствуют"},
      {v:0,t:"Отсутствуют зрачковый, роговичный и кашлевой"}
    ]},
    { id: "R", title: "Дыхательный паттерн (R)", icon: "🌬️", items: [
      {v:4,t:"Не интубирован, регулярное дыхание"},
      {v:3,t:"Не интубирован, дыхание Чейн–Стокса"},
      {v:2,t:"Не интубирован, нерегулярное дыхание"},
      {v:1,t:"Сопротивляется аппарату ИВЛ"},
      {v:0,t:"Синхронен с ИВЛ или апноэ"}
    ]}
  ];

  var RANGES = [
    { min: 16, max: 16, label: "Ясное сознание",         color: "gcs-15",    description: "Все функции сохранены." },
    { min: 15, max: 15, label: "Умеренное оглушение",     color: "gcs-14",    description: "Незначительное снижение уровня бодрствования." },
    { min: 13, max: 14, label: "Глубокое оглушение",      color: "gcs-11-12", description: "Выраженная заторможенность, сонливость." },
    { min: 9,  max: 12, label: "Сопор",                   color: "gcs-8-10",  description: "Глубокое угнетение сознания, реакция только на сильные стимулы." },
    { min: 7,  max: 8,  label: "Кома I (умеренная)",      color: "gcs-6-7",   description: "Нет реакции на голос, сохранена реакция на боль." },
    { min: 1,  max: 6,  label: "Кома II (глубокая)",      color: "gcs-4-5",   description: "Реакция только на болевые стимулы." },
    { min: 0,  max: 0,  label: "Кома III (запредельная)", color: "gcs-3",     description: "Гибель коры. Отсутствие всех реакций." }
  ];

  var REFERENCE = {
    title: "О шкале FOUR",
    paragraphs: [
      "Шкала FOUR разработана в Mayo Clinic (2005). Позволяет точнее детализировать неврологический статус, распознать синдром запертого человека, оценить рефлексы ствола мозга.",
      "Применима у детей и взрослых. Максимум 16 баллов, минимум 0. Особенно полезна при интубации, когда вербальная оценка по ШКГ невозможна."
    ],
    importantNote: "FOUR — дополнение к ШКГ, а не замена. Используйте обе шкалы для полноты картины."
  };

  var selections = { E: null, M: null, B: null, R: null };
  var groupsEl, panelEl;

  function total() {
    var vals = [selections.E, selections.M, selections.B, selections.R];
    if (vals.some(function (v) { return v === null; })) return null;
    return vals.reduce(function (s, v) { return s + v; }, 0);
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return null;
  }

  function getBreakdown() {
    var parts = [], missing = [];
    var names = { E:"глаза", M:"движение", B:"рефлексы", R:"дыхание" };
    ["E","M","B","R"].forEach(function (k) {
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
        '<div class="result-info"><div class="result-label">Выберите все 4 параметра</div><div class="result-description">Заполните: ' + bd.missing.join(", ") + '</div></div>' +
        '</div>';
      return;
    }
    var r = getRange(sum);
    if (!r) return;
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + sum + '</div><div class="result-score-label">из 16 (' + bd.formula + ')</div></div>' +
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