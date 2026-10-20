(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПАРАМЕТРЫ ШКАЛЫ =====
  var GROUPS = [
    { id: "E", title: "Глазные реакции (E)", icon: "👁️", color: "#1f6e9c", items: [
      {v:4,t:"Глаза открыты, слежение и мигание по команде"},
      {v:3,t:"Глаза открыты, но нет слежения"},
      {v:2,t:"Открываются на громкий звук, но слежения нет"},
      {v:1,t:"Открываются на боль, но слежения нет"},
      {v:0,t:"Остаются закрытыми в ответ на боль"}
    ]},
    { id: "M", title: "Двигательные реакции (M)", icon: "🤚", color: "#e68a2e", items: [
      {v:4,t:"Выполняет команды (знак «ОК», кулак, знак мира)"},
      {v:3,t:"Локализует боль"},
      {v:2,t:"Сгибательный ответ на боль"},
      {v:1,t:"Разгибательная поза на боль"},
      {v:0,t:"Нет ответа или миоклонический статус"}
    ]},
    { id: "B", title: "Стволовые рефлексы (B)", icon: "🧠", color: "#8b5cf6", items: [
      {v:4,t:"Зрачковый и корнеальный рефлексы сохранены"},
      {v:3,t:"Один зрачок расширен и не реагирует на свет"},
      {v:2,t:"Зрачковый или роговичный рефлексы отсутствуют"},
      {v:1,t:"Оба рефлекса отсутствуют"},
      {v:0,t:"Отсутствуют зрачковый, роговичный и кашлевой"}
    ]},
    { id: "R", title: "Дыхательный паттерн (R)", icon: "🌬️", color: "#b42323", items: [
      {v:4,t:"Не интубирован, регулярное дыхание"},
      {v:3,t:"Не интубирован, дыхание Чейн–Стокса"},
      {v:2,t:"Не интубирован, нерегулярное дыхание"},
      {v:1,t:"Сопротивляется аппарату ИВЛ"},
      {v:0,t:"Синхронен с ИВЛ или апноэ"}
    ]}
  ];

  // ===== ИНТЕРПРЕТАЦИЯ =====
  var RANGES = [
    { min: 16, max: 16, label: "Ясное сознание",      color: "gcs-15" },
    { min: 15, max: 15, label: "Умеренное оглушение", color: "gcs-14" },
    { min: 13, max: 14, label: "Глубокое оглушение",  color: "gcs-11-12" },
    { min: 9,  max: 12, label: "Сопор",               color: "gcs-8-10" },
    { min: 7,  max: 8,  label: "Кома I",              color: "gcs-6-7" },
    { min: 1,  max: 6,  label: "Кома II",             color: "gcs-4-5" },
    { min: 0,  max: 0,  label: "Кома III",            color: "gcs-3" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв, если markdown-файл не подключён) =====
  var REFERENCE = {
    title: "О шкале FOUR",
    paragraphs: [
      "Шкала FOUR (Full Outline of UnResponsiveness) разработана в Mayo Clinic (2005). Позволяет точнее детализировать неврологический статус, распознать синдром запертого человека, оценить рефлексы ствола мозга.",
      "Применима у детей и взрослых. Максимум 16 баллов, минимум 0. Особенно полезна при интубации, когда вербальная оценка по ШКГ невозможна."
    ],
    importantNote: "FOUR — дополнение к ШКГ, а не замена. Используйте обе шкалы для полноты картины."
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-four-state";
  var state = { selections: { E: null, M: null, B: null, R: null } };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && saved.selections) {
      state.selections = saved.selections;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function total() {
    var vals = [state.selections.E, state.selections.M, state.selections.B, state.selections.R];
    if (vals.some(function (v) { return v === null; })) return null;
    return vals.reduce(function (s, v) { return s + v; }, 0);
  }

  function filledCount() {
    var count = 0;
    if (state.selections.E !== null) count++;
    if (state.selections.M !== null) count++;
    if (state.selections.B !== null) count++;
    if (state.selections.R !== null) count++;
    return count;
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
      var scoreDisplay = (sel !== null) ? sel : "Х";

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
    var filled = filledCount();

    if (sum === null) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 16 баллов",
        color: "incomplete",
        title: "Оцените все параметры",
        description: "Заполнено: " + filled + " из 4",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var r = getRange(sum);

    CU.renderResultPanel({
      score: sum,
      scoreLabel: "из 16 баллов",
      color: r.color,
      title: r.label,
      description: "",
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    state.selections = { E: null, M: null, B: null, R: null };
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      var item = e.target.closest(".geneva-radio-item[data-group]");
      if (!item) return;
      var groupId = item.getAttribute("data-group");
      var value = parseInt(item.getAttribute("data-value"), 10);
      state.selections[groupId] = value;
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item[data-group]");
      if (!item) return;
      e.preventDefault();
      var groupId = item.getAttribute("data-group");
      var value = parseInt(item.getAttribute("data-value"), 10);
      state.selections[groupId] = value;
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("fourGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.four && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.four });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();