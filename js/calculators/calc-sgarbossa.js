(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== КРИТЕРИИ =====
  var ITEMS = [
    { id: "concordant_st", title: "Элевация ST ≥ 1 мм, конкордантная с QRS", points: 5 },
    { id: "st_depression_v1v3", title: "Депрессия ST ≥ 1 мм в V1, V2 или V3", points: 3 },
    { id: "discordant_st", title: "Элевация ST ≥ 5 мм, дискордантная с QRS", points: 2 }
  ];

  // ===== ТАБЛИЦА ВЕРОЯТНОСТЕЙ =====
  var PROB_TABLE = [
    { score: 10, prob: "100%" },
    { score: 8,  prob: "92%" },
    { score: 7,  prob: "93%" },
    { score: 5,  prob: "88%" },
    { score: 3,  prob: "66%" },
    { score: 2,  prob: "50%" },
    { score: 0,  prob: "16%" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв, если markdown-файл не подключён) =====
  var REFERENCE = {
    title: "О критериях Сгарбоссы",
    paragraphs: [
      "Критерии Сгарбоссы (1996) — ЭКГ-диагностика ИМ у пациентов с БЛНПГ. Три независимых признака с разным весом.",
      "Сумма ≥3 баллов имеет высокую специфичность (90–98%) для ИМ, но низкую чувствительность. В 2012 Smith et al. модифицировали критерии, заменив абсолютную элевацию на соотношение ST/S ≤ −0.25."
    ],
    importantNote: "Отрицательный результат (0–2 балла) НЕ исключает ИМ. Обязательна оценка тропонина и клинической картины."
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-sgarbossa-state";
  var state = { checked: {} };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && saved.checked) {
      state.checked = saved.checked;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function total() {
    var sum = 0;
    for (var i = 0; i < ITEMS.length; i++) {
      if (state.checked[ITEMS[i].id]) sum += ITEMS[i].points;
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

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderGroups() {
    var sum = total();
    var catColor = sum >= 3 ? "#b42323" : "#1f6e9c";

    var itemsHtml = ITEMS.map(function (it) {
      var isChecked = !!state.checked[it.id];
      return '<div class="geneva-item geneva-checkbox-item' + (isChecked ? " checked" : "") + '" data-id="' + it.id + '" role="checkbox" aria-checked="' + isChecked + '" tabindex="0">' +
        '<span class="geneva-checkbox-custom"></span>' +
        '<span class="geneva-item-content">' +
          '<span class="geneva-item-title">' + CU.escapeHtml(it.title) + '</span>' +
          '<span class="geneva-item-points">+' + it.points + '</span>' +
        '</span>' +
      '</div>';
    }).join("");

    var probHtml =
      '<div class="card sgarbossa-probability-card">' +
        '<div style="padding: 10px 14px 6px; font-weight: 700; font-size: 0.9rem;">Вероятность ИМ по баллам</div>' +
        '<div class="sgarbossa-probability-table">' +
        PROB_TABLE.map(function (r) {
          var active = r.score === sum ? " active" : "";
          return '<div class="sgarbossa-prob-row' + active + '">' +
            '<span class="sgarbossa-prob-score">' + r.score + ' б.</span>' +
            '<span class="sgarbossa-prob-value">' + r.prob + '</span></div>';
        }).join("") +
        '</div>' +
      '</div>';

    bodyEl.innerHTML =
      '<div class="geneva-category" style="--cat-color: ' + catColor + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">📈</span>' +
            '<span class="geneva-category-title">Критерии Сгарбоссы (ЭКГ с БЛНПГ)</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + sum + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>' +
      probHtml;
  }

  function renderResult() {
    var sum = total();
    var prob = getProb(sum);
    var positive = sum >= 3;

    CU.renderResultPanel({
      score: sum,
      scoreLabel: pluralize(sum),
      color: positive ? "gcs-4-5" : "gcs-11-12",
      title: "Вероятность ИМ: " + prob,
      description: "",
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    state.checked = {};
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      var item = e.target.closest(".geneva-checkbox-item[data-id]");
      if (!item) return;
      var id = item.getAttribute("data-id");
      state.checked[id] = !state.checked[id];
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-checkbox-item[data-id]");
      if (!item) return;
      e.preventDefault();
      var id = item.getAttribute("data-id");
      state.checked[id] = !state.checked[id];
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("sgarbossaGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.sgarbossa && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.sgarbossa });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();