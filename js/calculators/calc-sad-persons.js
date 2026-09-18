(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПУНКТЫ ШКАЛЫ =====
  var ITEMS = [
    { id: "sex",    title: "Пол",                                description: "", points: 1 },
    { id: "age",    title: "Возраст до 19 лет или старше 45 лет", description: "", points: 1 },
    { id: "depr",   title: "Депрессия",                           description: "", points: 1 },
    { id: "prev",   title: "Парасуициды в анамнезе",              description: "", points: 1 },
    { id: "alc",    title: "Злоупотребление алкоголем",           description: "", points: 1 },
    { id: "think",  title: "Нарушение рационального мышления",
                   description: "(бред, галлюцинации, фиксация на потере, депрессивное сужение восприятия), шизофрения, расстройство настроения, когнитивные нарушения",
                   points: 1 },
    { id: "soc",    title: "Недостаток социальной поддержки",
                   description: "проживание в одиночестве, тяжелые нарушенные отношения, не принимающее социальное окружение",
                   points: 1 },
    { id: "plan",   title: "Организованный план суицида",         description: "", points: 1 },
    { id: "spouse", title: "Отсутствие супруги (супруга)",
                   description: "разведен, вдовец, живущий отдельно, проживает в одиночестве",
                   points: 1 },
    { id: "sick",   title: "Болезнь",
                   description: "особенно хроническая, инвалидизирующая, тяжелая",
                   points: 1 }
  ];

  // ===== ОСНОВНЫЕ ГРАДАЦИИ =====
  var RANGES = [
    { min: 0,  max: 2,  label: "Низкий риск",          color: "success", extra: "Амбулаторное наблюдение" },
    { min: 3,  max: 4,  label: "Средний риск",         color: "warning", extra: "Амбулаторное наблюдение с частыми встречами (1–3 р/неделю); дневной стационар; рассмотреть возможность госпитализации" },
    { min: 5,  max: 6,  label: "Высокий риск",         color: "error",   extra: "Рекомендовать госпитализацию, если нет уверенности в качественном амбулаторном наблюдении (психиатрическая и социальная служба, родственники)" },
    { min: 7,  max: 10, label: "Очень высокий риск",   color: "critical",extra: "Госпитализация (в том числе принудительная)" }
  ];

  // ===== МОДАЛКА =====
  var REFERENCE = {
    title: "Шкала оценки риска суицида",
    paragraphs: [
      "Шкала оценки риска суицида (ШОРС, The SAD PERSONS Scale, 1983) — предназначена для экспресс-диагностики суицидального риска. Шкала содержит 10 пунктов, характеризующих факторы риска суицида и оцениваемых клиницистом как 0 (отсутствует), либо 1 (присутствует).",
      "Скрининговый инструмент, не заменяет клиническую оценку. При наличии организованного плана суицида с летальным методом госпитализация показана независимо от общего балла."
    ]
  };

  var STORAGE_KEY = "smp-calc-sadpersons-v1";
  var state = {};
  ITEMS.forEach(function (it) { state[it.id] = false; });

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    ITEMS.forEach(function (it) {
      if (typeof saved[it.id] === "boolean") state[it.id] = saved[it.id];
    });
  }

  var bodyEl, panelEl;

  // ===== РЕНДЕР В СТИЛЕ ЖЕНЕВСКОЙ =====
  function renderItems() {
    var sum = 0;
    ITEMS.forEach(function (it) { if (state[it.id]) sum++; });

    var itemsHtml = ITEMS.map(function (it) {
      var isChecked = state[it.id];
      var descHtml = it.description
        ? '<div class="result-description" style="font-size: 0.78rem; opacity: 0.75; margin-top: 3px;">' + CU.escapeHtml(it.description) + '</div>'
        : '';
      return '<div class="geneva-item' + (isChecked ? " checked" : "") + '" data-id="' + it.id + '" role="checkbox" aria-checked="' + isChecked + '" tabindex="0">' +
        '<span class="geneva-checkbox-custom"></span>' +
        '<span class="geneva-item-content">' +
          '<span class="geneva-item-title-wrap" style="flex: 1; min-width: 0;">' +
            '<span class="geneva-item-title">' + CU.escapeHtml(it.title) + '</span>' +
            descHtml +
          '</span>' +
          '<span class="geneva-item-points">' + (isChecked ? 1 : 0) + '</span>' +
        '</span>' +
      '</div>';
    }).join("");

    bodyEl.innerHTML =
      '<div class="geneva-category" style="--cat-color: var(--accent);">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">🩺</span>' +
            '<span class="geneva-category-title">Факторы риска суицида</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + sum + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>';
  }

  function renderResult() {
    var sum = 0;
    ITEMS.forEach(function (it) { if (state[it.id]) sum++; });

    var r = RANGES.find(function (x) { return sum >= x.min && sum <= x.max; }) || RANGES[RANGES.length - 1];

    CU.renderResultPanel({
      score: sum,
      scoreLabel: "из 10 баллов",
      color: r.color,
      title: r.label,
      description: "",
      extraDescription: r.extra,
      onReset: resetAll
    });
  }

  function resetAll() {
    ITEMS.forEach(function (it) { state[it.id] = false; });
    CU.clearCalcState(STORAGE_KEY);
    renderItems();
    renderResult();
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderItems();
    renderResult();

    bodyEl.addEventListener("click", function (e) {
      var item = e.target.closest(".geneva-item");
      if (!item) return;
      var id = item.getAttribute("data-id");
      state[id] = !state[id];
      saveState();
      renderItems();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-item");
      if (!item) return;
      e.preventDefault();
      var id = item.getAttribute("data-id");
      state[id] = !state[id];
      saveState();
      renderItems();
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