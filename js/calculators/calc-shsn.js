(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПАРАМЕТРЫ ШКАЛЫ =====
  var PARAMETERS = [
    { id: "dyspnea", title: "Одышка", icon: "🌬️", color: "#1f6e9c", options: [
      { label: "Нет", points: 0 },
      { label: "При нагрузке", points: 1 },
      { label: "В покое", points: 2 }
    ]},
    { id: "weight", title: "Изменился ли вес за последнюю неделю", icon: "⚖️", color: "#e68a2e", options: [
      { label: "Нет", points: 0 },
      { label: "Увеличился", points: 1 }
    ]},
    { id: "palpitations", title: "Перебои в работе сердца", icon: "💓", color: "#b42323", options: [
      { label: "Нет", points: 0 },
      { label: "Есть", points: 1 }
    ]},
    { id: "position", title: "Положение в постели", icon: "🛏️", color: "#6a5acd", options: [
      { label: "Горизонтальное", points: 0 },
      { label: "+2 подушки", points: 1 },
      { label: "Просыпается от удушья", points: 2 },
      { label: "Сидя", points: 3 }
    ]},
    { id: "jvp", title: "Набухшие шейные вены", icon: "🩸", color: "#0e7490", options: [
      { label: "Нет", points: 0 },
      { label: "Лёжа", points: 1 },
      { label: "Стоя", points: 2 }
    ]},
    { id: "rales", title: "Хрипы в лёгких", icon: "🫁", color: "#2e8b57", options: [
      { label: "Нет", points: 0 },
      { label: "Нижние отделы 1/3", points: 1 },
      { label: "До лопаток 2/3", points: 2 },
      { label: "Над всей поверхностью", points: 3 }
    ]},
    { id: "gallop", title: "Ритм галопа", icon: "👂", color: "#8b5a2b", options: [
      { label: "Нет", points: 0 },
      { label: "Есть", points: 1 }
    ]},
    { id: "liver", title: "Печень", icon: "🩺", color: "#c77700", options: [
      { label: "Не увеличена", points: 0 },
      { label: "До 5 см", points: 1 },
      { label: "Более 5 см", points: 2 }
    ]},
    { id: "edema", title: "Отёки", icon: "💧", color: "#d2401e", options: [
      { label: "Нет", points: 0 },
      { label: "Пастозность", points: 1 },
      { label: "Отёки", points: 2 },
      { label: "Анасарка", points: 3 }
    ]},
    { id: "sbp", title: "Уровень САД (мм рт. ст.)", icon: "📊", color: "#9c1f6e", options: [
      { label: "> 120", points: 0 },
      { label: "100–120", points: 1 },
      { label: "< 100", points: 2 }
    ]}
  ];

  // ===== ФУНКЦИОНАЛЬНЫЕ КЛАССЫ =====
  var RANGES = [
    { min: 0,  max: 0,  label: "Нет признаков СН", color: "gcs-15" },
    { min: 1,  max: 3,  label: "I ФК СН",          color: "gcs-14" },
    { min: 4,  max: 6,  label: "II ФК СН",         color: "gcs-11-12" },
    { min: 7,  max: 8,  label: "III ФК СН",        color: "gcs-8-10" },
    { min: 9,  max: 20, label: "IV ФК СН",         color: "gcs-3" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв, если markdown-файл не подключён) =====
  var REFERENCE = {
    title: "О шкале оценки клинического состояния при ХСН",
    paragraphs: [
      "Шкала оценки клинического состояния при ХСН — 10 параметров по 0–3 балла, максимум 20 баллов. Коррелирует с функциональными классами NYHA, используется для динамического наблюдения за эффективностью терапии."
    ]
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-shsn-state";
  var state = { selections: {} };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && saved.selections) {
      state.selections = saved.selections;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function getParam(paramId) {
    for (var i = 0; i < PARAMETERS.length; i++) {
      if (PARAMETERS[i].id === paramId) return PARAMETERS[i];
    }
    return null;
  }

  function getParamPoints(paramId) {
    if (state.selections[paramId] === undefined) return null;
    var param = getParam(paramId);
    return param ? param.options[state.selections[paramId]].points : null;
  }

  function filledCount() {
    return Object.keys(state.selections).length;
  }

  function total() {
    var sum = 0;
    for (var i = 0; i < PARAMETERS.length; i++) {
      var pts = getParamPoints(PARAMETERS[i].id);
      if (pts !== null) sum += pts;
    }
    return sum;
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
    bodyEl.innerHTML = PARAMETERS.map(function (p) {
      var pts = getParamPoints(p.id);
      var scoreDisplay = (pts !== null) ? pts : "Х";

      var optionsHtml = p.options.map(function (opt, idx) {
        var isChecked = state.selections[p.id] === idx;
        return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-param="' + p.id + '" data-index="' + idx + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
          '<span class="geneva-radio-custom"></span>' +
          '<span class="geneva-item-content">' +
            '<span class="geneva-item-title">' + CU.escapeHtml(opt.label) + '</span>' +
            '<span class="geneva-item-points">' + opt.points + '</span>' +
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
    var answered = filledCount();

    if (answered < PARAMETERS.length) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 20 баллов",
        color: "incomplete",
        title: "Оцените все параметры",
        description: "Заполнено: " + answered + " из " + PARAMETERS.length,
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var s = total();
    var r = getRange(s);

    CU.renderResultPanel({
      score: s,
      scoreLabel: "из 20 баллов",
      color: r.color,
      title: r.label,
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
      var idx = parseInt(item.getAttribute("data-index"), 10);
      state.selections[paramId] = idx;
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
      var idx = parseInt(item.getAttribute("data-index"), 10);
      state.selections[paramId] = idx;
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("shsnGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.shsn && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.shsn });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();