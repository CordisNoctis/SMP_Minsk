(function () {
  "use strict";

  var GROUPS = [
    { id: "E", title: "Открывание глаз", icon: "👁️", items: [
      { value: 4, title: "Спонтанное" },
      { value: 3, title: "На голос / обращение" },
      { value: 2, title: "На болевое раздражение" },
      { value: 1, title: "Отсутствует" }
    ] },
    { id: "V", title: "Речевая реакция", icon: "💬", items: [
      { value: 5, title: "Ориентированная речь" },
      { value: 4, title: "Спутанная речь (дезориентация)" },
      { value: 3, title: "Отдельные неуместные слова" },
      { value: 2, title: "Нечленораздельные звуки" },
      { value: 1, title: "Отсутствует" }
    ] },
    { id: "M", title: "Двигательная реакция", icon: "🤚", items: [
      { value: 6, title: "Выполняет команды" },
      { value: 5, title: "Локализует боль" },
      { value: 4, title: "Отдёргивание от боли" },
      { value: 3, title: "Сгибание в ответ на боль (декортикация)" },
      { value: 2, title: "Разгибание в ответ на боль (децеребрация)" },
      { value: 1, title: "Отсутствует" }
    ] }
  ];

  var RANGES = [
    { min: 15, max: 15, label: "Ясное сознание", color: "gcs-15", description: "Полностью ориентирован. Наблюдение." },
    { min: 13, max: 14, label: "Оглушение", color: "gcs-14", description: "Умеренное нарушение сознания. Обследование, контроль динамики." },
    { min: 9, max: 12, label: "Сопор", color: "gcs-8-10", description: "Глубокое нарушение. Контроль проходимости дыхательных путей, госпитализация." },
    { min: 4, max: 8, label: "Кома", color: "gcs-4-5", description: "Обеспечение проходимости ДП / интубация, ИВЛ. ОРИТ." },
    { min: 3, max: 3, label: "Глубокая кома, терминальное состояние", color: "gcs-3", description: "Критическое состояние. Реанимационные мероприятия." }
  ];

  var REFERENCE = {
    title: "О шкале",
    paragraphs: [
      "Шкала комы Глазго (GCS) предложена в 1974 году в Глазго для оценки уровня сознания при черепно-мозговой травме. Состоит из трёх тестов: открывание глаз (E, 1–4), речевая реакция (V, 1–5), двигательная реакция (M, 1–6).",
      "Сумма баллов: максимум 15 (ясное сознание), минимум 3 (глубокая кома). Оценка 8 и ниже соответствует коме и является показанием к защите дыхательных путей.",
      "Оценку повторяют в динамике: ухудшение на 2 и более балла требует немедленного пересмотра тактики и повторного обследования."
    ],
    importantNote: "ШКГ ≤ 8 баллов — кома: показаны интубация и ИВЛ. Оценивайте лучший ответ пациента; при асимметрии моторного ответа учитывайте лучшую сторону."
  };

  var state = { E: null, V: null, M: null };
  var groupsEl, panelEl;

  function rangeFor(sum) {
    for (var i = 0; i < RANGES.length; i++) {
      if (sum >= RANGES[i].min && sum <= RANGES[i].max) return RANGES[i];
    }
    return RANGES[RANGES.length - 1];
  }

  function renderGroups() {
    groupsEl.innerHTML = GROUPS.map(function (g) {
      var sel = state[g.id];
      return '<div class="gcs-group">' +
        '<div class="gcs-group-header"><span>' + g.icon + "</span>" +
        '<span class="gcs-group-title">' + g.title + "</span>" +
        '<span class="gcs-group-value' + (sel !== null ? " has-value" : "") + '">' + (sel !== null ? sel : "—") + "</span></div>" +
        '<div class="gcs-group-items">' +
        g.items.map(function (it) {
          return '<div class="gcs-radio-item' + (sel === it.value ? " selected" : "") + '" data-group="' + g.id + '" data-value="' + it.value + '">' +
            '<div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>' +
            '<div class="gcs-radio-content"><div class="gcs-radio-title">' + it.title + "</div></div>" +
            '<div class="gcs-radio-points">' + it.value + "</div></div>";
        }).join("") +
        "</div></div>";
    }).join("");
  }

  function renderResult() {
    var filled = 0, sum = 0;
    GROUPS.forEach(function (g) {
      if (state[g.id] !== null) { filled++; sum += state[g.id]; }
    });

    if (filled < GROUPS.length) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">нет данных</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Оцените все параметры</div><div class="result-description">Осталось заполнить: ' + (GROUPS.length - filled) + "</div></div>" +
        "</div>";
      return;
    }

    var r = rangeFor(sum);
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + sum + '</div><div class="result-score-label">из 15 баллов</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
      '<div class="result-label">' + r.label + "</div>" +
      '<div class="result-description">E' + state.E + " + V" + state.V + " + M" + state.M + ". " + r.description + "</div>" +
      "</div></div>";
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
      state[g] = v;
      renderGroups();
      renderResult();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn && window.SMP && window.SMP.calcUtils) {
      infoBtn.addEventListener("click", function () {
        window.SMP.calcUtils.openReferenceModal({ reference: REFERENCE });
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();