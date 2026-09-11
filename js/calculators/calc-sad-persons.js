(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var ITEMS = [
    { id: "sex",        title: "S — Sex (Пол мужской)",                                      points: 1 },
    { id: "age",        title: "A — Age (< 19 или > 45 лет)",                                points: 1 },
    { id: "depression", title: "D — Depression (депрессия)",                                  points: 1 },
    { id: "previous",   title: "P — Previous attempt (парасуициды в анамнезе)",                points: 1 },
    { id: "ethanol",    title: "E — Ethanol abuse (злоупотребление алкоголем)",               points: 1 },
    { id: "rational",   title: "R — Rational thinking loss (бред, галлюцинации)",              points: 1 },
    { id: "social",     title: "S — Social support lacking (одиночество)",                    points: 1 },
    { id: "plan",       title: "O — Organized plan (план с летальным методом)",              points: 1 },
    { id: "spouse",     title: "N — No spouse (нет супруга/супруги)",                         points: 1 },
    { id: "sickness",   title: "S — Sickness (тяжёлое хроническое заболевание)",             points: 1 }
  ];

  var RANGES = [
    { min: 0,  max: 2,  label: "Низкий риск",       color: "success", description: "Амбулаторное наблюдение." },
    { min: 3,  max: 4,  label: "Средний риск",      color: "warning", description: "Амбулаторное наблюдение с частыми встречами (1–3 р/нед); дневной стационар; рассмотреть госпитализацию." },
    { min: 5,  max: 6,  label: "Высокий риск",      color: "pesi-4",  description: "Рекомендовать госпитализацию, если нет уверенности в качественном амбулаторном наблюдении." },
    { min: 7,  max: 10, label: "Очень высокий риск", color: "error",   description: "Госпитализация, в том числе принудительная." }
  ];

  var REFERENCE = {
    title: "О шкале SAD PERSONS",
    paragraphs: [
      "Шкала оценки риска суицида (ШОРС, 1983). 10 пунктов оцениваются 0/1. Аббревиатура из английских названий факторов: Sex, Age, Depression, Previous attempt, Ethanol, Rational thinking loss, Social support lacking, Organized plan, No spouse, Sickness."
    ],
    importantNote: "Скрининговый инструмент, не заменяет клиническую оценку. При наличии организованного плана суицида с летальным методом госпитализация показана независимо от общего балла.",
    legalReference: "Приказ МЗ РБ № 480 от 22.04.2020 «О мерах по оптимизации профилактики суицидов в РБ»."
  };

  var checked = {};
  var itemsEl, panelEl;

  function total() {
    var sum = 0;
    for (var id in checked) if (checked[id]) {
      var it = ITEMS.find(function (i) { return i.id === id; });
      if (it) sum += it.points;
    }
    return sum;
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return RANGES[RANGES.length - 1];
  }

  function pluralize(n) {
    var lastTwo = n % 100, lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "баллов";
    if (lastOne === 1) return "балл";
    if (lastOne >= 2 && lastOne <= 4) return "балла";
    return "баллов";
  }

  function renderItems() {
    itemsEl.innerHTML = ITEMS.map(function (it) {
      var cls = checked[it.id] ? " checked" : "";
      return '<div class="calc-item' + cls + '" data-id="' + it.id + '">' +
        '<div class="calc-item-checkbox"><span class="check-icon">✓</span></div>' +
        '<div class="calc-item-content"><div class="calc-item-title">' + CU.escapeHtml(it.title) + '</div></div>' +
        '<div class="calc-item-points">+' + it.points + '</div></div>';
    }).join("");
  }

  function renderResult() {
    var s = total();
    var r = getRange(s);
    var hasPlan = !!checked.plan;
    var warningHtml = hasPlan ? '<div class="result-warning">⚠️ Есть план суицида — госпитализация показана независимо от балла</div>' : '';

    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + s + '</div><div class="result-score-label">' + pluralize(s) + '</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + r.label + '</div><div class="result-description">' + r.description + '</div>' + warningHtml + '</div>' +
      '</div>';
  }

  function init() {
    itemsEl = document.getElementById("calcItems");
    panelEl = document.getElementById("resultPanel");
    if (!itemsEl || !panelEl) return;

    renderItems();
    renderResult();

    itemsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".calc-item");
      if (!item) return;
      var id = item.getAttribute("data-id");
      checked[id] = !checked[id];
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