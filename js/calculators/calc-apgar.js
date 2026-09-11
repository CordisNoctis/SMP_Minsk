(function () {
  "use strict";

  var GROUPS = [
    { id: "A", title: "Цвет кожи", icon: "🎨", items: [
      { value: 0, title: "Генерализованный цианоз или бледность" },
      { value: 1, title: "Акроцианоз (туловище розовое, конечности синюшные)" },
      { value: 2, title: "Полностью розовая окраска кожи" }
    ] },
    { id: "P", title: "Частота сердечных сокращений", icon: "❤️", items: [
      { value: 0, title: "Отсутствует (пульс не определяется)" },
      { value: 1, title: "Менее 100 уд/мин (брадикардия)" },
      { value: 2, title: "100 уд/мин и более" }
    ] },
    { id: "G", title: "Рефлекторная возбудимость", icon: "😖", items: [
      { value: 0, title: "Нет реакции на раздражение" },
      { value: 1, title: "Гримаса (слабая реакция)" },
      { value: 2, title: "Кашель, чихание, громкий крик" }
    ] },
    { id: "T", title: "Мышечный тонус", icon: "💪", items: [
      { value: 0, title: "Атония (конечности вялые)" },
      { value: 1, title: "Сгибание конечностей (сниженный тонус)" },
      { value: 2, title: "Активные движения, хорошее сгибание" }
    ] },
    { id: "R", title: "Дыхание", icon: "🌬️", items: [
      { value: 0, title: "Отсутствует (апноэ)" },
      { value: 1, title: "Нерегулярное, поверхностное, слабый крик" },
      { value: 2, title: "Нормальное, громкий крик" }
    ] }
  ];

  var RANGES = [
    { min: 8, max: 10, label: "Нормальное состояние", color: "gcs-15", description: "Ребёнок в удовлетворительном состоянии. Наблюдение." },
    { min: 4, max: 7, label: "Асфиксия средней степени", color: "gcs-11-12", description: "Стимуляция, оксигенотерапия, возможна респираторная поддержка." },
    { min: 1, max: 3, label: "Тяжёлая асфиксия", color: "gcs-4-5", description: "Интенсивная реанимация: ИВЛ, медикаментозная поддержка." },
    { min: 0, max: 0, label: "Крайне тяжёлое состояние", color: "gcs-3", description: "Клиническая смерть. Экстренные реанимационные мероприятия." }
  ];

  var REFERENCE = {
    title: "О шкале",
    paragraphs: [
      "Шкала Апгар предложена анестезиологом Вирджинией Апгар в 1952 году. Оценка проводится на 1-й и 5-й минуте жизни; при ≤7 баллов на 5-й минуте дополнительно оценивают на 10, 15 и 20-й минутах.",
      "Пять параметров (Appearance, Pulse, Grimace, Activity, Respiration) оцениваются от 0 до 2 баллов каждый, максимум 10 баллов.",
      "Шкала не прогнозирует долгосрочный неврологический исход. Важна динамика: низкий балл на 1-й минуте часто нормализуется к 5-й при адекватной реанимации."
    ],
    importantNote: "Оценка 0–3 баллов на 5-й минуте при отсутствии динамики — показание к продолжению расширенной реанимации и обсуждению дальнейшей тактики."
  };

  var scores = {
    "1min": { A: null, P: null, G: null, T: null, R: null },
    "5min": { A: null, P: null, G: null, T: null, R: null }
  };
  var currentTime = "1min";
  var switcherEl, groupsEl, panelEl;

  function calcSum(time) {
    var s = scores[time], filled = 0, sum = 0;
    for (var k in s) {
      if (s[k] !== null) { filled++; sum += s[k]; }
    }
    return { filled: filled, sum: (filled === GROUPS.length ? sum : null) };
  }

  function rangeFor(sum) {
    for (var i = 0; i < RANGES.length; i++) {
      if (sum >= RANGES[i].min && sum <= RANGES[i].max) return RANGES[i];
    }
    return RANGES[RANGES.length - 1];
  }

  function renderSwitcher() {
    var r1 = calcSum("1min"), r5 = calcSum("5min");
    switcherEl.innerHTML =
      '<button type="button" class="apgar-time-btn' + (currentTime === "1min" ? " active" : "") + '" data-time="1min">' +
      '<span>⏱️</span><div class="apgar-time-content"><div class="apgar-time-label">1 минута</div>' +
      '<div class="apgar-time-score">' + (r1.sum !== null ? r1.sum + "/10" : r1.filled + "/5") + "</div></div></button>" +
      '<button type="button" class="apgar-time-btn' + (currentTime === "5min" ? " active" : "") + '" data-time="5min">' +
      '<span>⏱️</span><div class="apgar-time-content"><div class="apgar-time-label">5 минут</div>' +
      '<div class="apgar-time-score">' + (r5.sum !== null ? r5.sum + "/10" : r5.filled + "/5") + "</div></div></button>";
  }

  function renderGroups() {
    var cur = scores[currentTime];
    groupsEl.innerHTML = GROUPS.map(function (g) {
      var sel = cur[g.id];
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
    var r1 = calcSum("1min"), r5 = calcSum("5min");

    if (r1.filled === 0 && r5.filled === 0) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">нет данных</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Оцените новорождённого</div><div class="result-description">Заполните параметры на 1-й и 5-й минутах</div></div>' +
        "</div>";
      return;
    }

    var trend = "";
    if (r1.sum !== null && r5.sum !== null) {
      var diff = r5.sum - r1.sum;
      if (diff > 0) trend = '<div class="apgar-trend trend-up">📈 Улучшение на ' + diff + " балл(а)</div>";
      else if (diff < 0) trend = '<div class="apgar-trend trend-down">📉 Ухудшение на ' + Math.abs(diff) + " балл(а)</div>";
      else trend = '<div class="apgar-trend trend-same">➖ Без динамики</div>';
    }

    var last = (r5.sum !== null ? r5.sum : r1.sum);
    var range = rangeFor(last);

    panelEl.innerHTML =
      '<div class="result-content result-' + range.color + '">' +
      '<div class="apgar-result-grid">' +
      '<div class="apgar-result-cell ' + (r1.filled === 5 ? "filled" : "partial") + '"><div class="apgar-cell-label">1 минута</div><div class="apgar-cell-value">' + (r1.sum !== null ? r1.sum : "—") + '</div><div class="apgar-cell-range">' + r1.filled + "/5</div></div>" +
      '<div class="apgar-result-divider">→</div>' +
      '<div class="apgar-result-cell ' + (r5.filled === 5 ? "filled" : "partial") + '"><div class="apgar-cell-label">5 минут</div><div class="apgar-cell-value">' + (r5.sum !== null ? r5.sum : "—") + '</div><div class="apgar-cell-range">' + r5.filled + "/5</div></div>" +
      "</div>" +
      trend +
      '<div class="apgar-interpretation"><strong>' + range.label + ":</strong> " + range.description + "</div>" +
      "</div>";
  }

  function updateAll() {
    renderSwitcher();
    renderGroups();
    renderResult();
  }

  function init() {
    switcherEl = document.getElementById("apgarSwitcher");
    groupsEl = document.getElementById("apgarGroups");
    panelEl = document.getElementById("resultPanel");
    if (!switcherEl || !groupsEl || !panelEl) return;

    updateAll();

    switcherEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".apgar-time-btn");
      if (!btn) return;
      currentTime = btn.getAttribute("data-time");
      updateAll();
    });

    groupsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".gcs-radio-item");
      if (!item) return;
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      scores[currentTime][g] = v;
      updateAll();
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