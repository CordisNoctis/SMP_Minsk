(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var ITEMS = [
    { id: "concordant_st", title: "Элевация ST ≥ 1 мм, конкордантная с QRS", points: 5 },
    { id: "st_depression_v1v3", title: "Депрессия ST ≥ 1 мм в V1, V2 или V3", points: 3 },
    { id: "discordant_st", title: "Элевация ST ≥ 5 мм, дискордантная с QRS", points: 2 }
  ];

  var PROB_TABLE = [
    { score: 10, prob: "100%" },
    { score: 8,  prob: "92%" },
    { score: 7,  prob: "93%" },
    { score: 5,  prob: "88%" },
    { score: 3,  prob: "66%" },
    { score: 2,  prob: "50%" },
    { score: 0,  prob: "16%" }
  ];

  var REFERENCE = {
    title: "О критериях Сгарбоссы",
    paragraphs: [
      "Критерии Сгарбоссы (1996) — ЭКГ-диагностика ИМ у пациентов с БЛНПГ. Три независимых признака с разным весом.",
      "Сумма ≥3 баллов имеет высокую специфичность (90–98%) для ИМ, но низкую чувствительность. В 2012 Smith et al. модифицировали критерии, заменив абсолютную элевацию на соотношение ST/S ≤ −0.25."
    ],
    importantNote: "Отрицательный результат (0–2 балла) НЕ исключает ИМ. Обязательна оценка тропонина и клинической картины."
  };

  var checked = {};
  var itemsEl, probTableEl, panelEl;

  function total() {
    var sum = 0;
    for (var id in checked) if (checked[id]) {
      var it = ITEMS.find(function (i) { return i.id === id; });
      if (it) sum += it.points;
    }
    return sum;
  }

  function getProb(score) {
    var exact = PROB_TABLE.find(function (r) { return r.score === score; });
    if (exact) return exact.prob;
    if (score >= 10) return "100%";
    if (score >= 8) return "92%";
    if (score >= 7) return "93%";
    if (score >= 5) return "88%";
    if (score >= 3) return "66%";
    if (score >= 2) return "50%";
    return "16%";
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
    }).join('');
  }

  function renderProbTable() {
    var sum = total();
    probTableEl.innerHTML = PROB_TABLE.map(function (r) {
      var active = r.score === sum ? " active" : "";
      return '<div class="sgarbossa-prob-row' + active + '" data-score="' + r.score + '">' +
        '<span class="sgarbossa-prob-score">' + r.score + ' б.</span>' +
        '<span class="sgarbossa-prob-value">' + r.prob + '</span></div>';
    }).join('');
  }

  function renderResult() {
    var sum = total();
    var prob = getProb(sum);
    var positive = sum >= 3;
    var color = positive ? "error" : "warning";
    var desc = positive
      ? "≥3 баллов — высокая специфичность. Показана экстренная реперфузионная терапия."
      : "<3 баллов — низкая чувствительность. ИМ не исключён! Оцените тропонин, ЭхоКГ.";

    panelEl.innerHTML =
      '<div class="result-content result-' + color + '">' +
      '<div class="result-score"><div class="result-score-value">' + sum + '</div><div class="result-score-label">' + pluralize(sum) + '</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">Вероятность ИМ: ' + prob + '</div><div class="result-description">' + desc + '</div></div>' +
      '</div>';
  }

  function init() {
    itemsEl = document.getElementById("calcItems");
    probTableEl = document.getElementById("probTable");
    panelEl = document.getElementById("resultPanel");
    if (!itemsEl || !probTableEl || !panelEl) return;

    renderItems();
    renderProbTable();
    renderResult();

    itemsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".calc-item");
      if (!item) return;
      var id = item.getAttribute("data-id");
      checked[id] = !checked[id];
      renderItems();
      renderProbTable();
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