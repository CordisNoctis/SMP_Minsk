(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПАРАМЕТРЫ ШКАЛЫ =====
  var GROUPS = [
    { id: "A", title: "Цвет кожи (Appearance)", icon: "", color: "#e68a2e", items: [
      { value: 0, title: "Генерализованный цианоз или бледность" },
      { value: 1, title: "Акроцианоз (туловище розовое, конечности синюшные)" },
      { value: 2, title: "Полностью розовая окраска кожи" }
    ] },
    { id: "P", title: "Частота сердечных сокращений (Pulse)", icon: "❤️", color: "#b42323", items: [
      { value: 0, title: "Отсутствует (пульс не определяется)" },
      { value: 1, title: "Менее 100 уд/мин (брадикардия)" },
      { value: 2, title: "100 уд/мин и более" }
    ] },
    { id: "G", title: "Рефлекторная возбудимость (Grimace)", icon: "😖", color: "#1f6e9c", items: [
      { value: 0, title: "Нет реакции на раздражение" },
      { value: 1, title: "Гримаса (слабая реакция)" },
      { value: 2, title: "Кашель, чихание, громкий крик" }
    ] },
    { id: "T", title: "Мышечный тонус (Activity)", icon: "💪", color: "#2e8b57", items: [
      { value: 0, title: "Атония (конечности вялые)" },
      { value: 1, title: "Сгибание конечностей (сниженный тонус)" },
      { value: 2, title: "Активные движения, хорошее сгибание" }
    ] },
    { id: "R", title: "Дыхание (Respiration)", icon: "🌬️", color: "#6a5acd", items: [
      { value: 0, title: "Отсутствует (апноэ)" },
      { value: 1, title: "Нерегулярное, поверхностное, слабый крик" },
      { value: 2, title: "Нормальное, громкий крик" }
    ] }
  ];

  // ===== ИНТЕРПРЕТАЦИЯ =====
  var RANGES = [
    { min: 8, max: 10, label: "Нормальное состояние", color: "gcs-15", description: "Ребёнок в удовлетворительном состоянии. Наблюдение." },
    { min: 4, max: 7, label: "Асфиксия средней степени", color: "gcs-11-12", description: "Стимуляция, оксигенотерапия, возможна респираторная поддержка." },
    { min: 1, max: 3, label: "Тяжёлая асфиксия", color: "gcs-4-5", description: "Интенсивная реанимация: ИВЛ, медикаментозная поддержка." },
    { min: 0, max: 0, label: "Крайне тяжёлое состояние", color: "gcs-3", description: "Клиническая смерть. Экстренные реанимационные мероприятия." }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ =====
  var REFERENCE = {
    title: "Шкала Апгар (Apgar Score)",
    paragraphs: [
      "Шкала Апгар — стандартизированный метод оценки состояния новорождённого непосредственно после рождения и реакции на реанимационные мероприятия. Разработана доктором Вирджинией Апгар (Virginia Apgar), анестезиологом Колумбийского университета, в 1952 году.",
      "Является принятым стандартом оценки, одобренным Американской академией педиатрии (AAP) и Американским колледжем акушеров и гинекологов (ACOG). Оценка проводится всем новорождённым на 1-й и 5-й минутах жизни; при сумме баллов < 7 — повторно каждые 5 минут до 20-й минуты жизни или до стабилизации состояния.",
      "Критически важно: реанимационные мероприятия должны начинаться немедленно и не могут откладываться до завершения оценки по шкале Апгар. Реанимация всегда имеет приоритет над расчётом баллов.",
      "Максимальный балл: 10. Большинство здоровых доношенных новорождённых набирают 8–9 баллов — 1–2 балла снижается за счёт акроцианоза как проявления незрелой периферической циркуляции.",
      "Историческая справка: шкала разработана Вирджинией Апгар и опубликована в 1953 году. Аббревиатура APGAR (Appearance, Pulse, Grimace, Activity, Respiration) введена впоследствии как мнемоническое средство. Рекомендации ACOG/AAP по применению шкалы пересматривались в 2006, 2015 годах; Committee Opinion No. 644 подтверждён и переутверждён в 2025 году."
    ],
    importantNote: "Шкала не является диагностическим критерием асфиксии и не должна применяться в этих целях изолированно. Не предсказывает индивидуальный неврологический исход ни у доношенных, ни у недоношенных.",
    indicationsTitle: "Интерпретация суммарного балла:",
    indications: [
      "7–10 баллов — Удовлетворительное состояние; стандартный послеродовой уход",
      "4–6 баллов — Умеренно патологическое состояние; требует внимательного наблюдения и поддерживающих мероприятий",
      "0–3 балла — Критически низкий балл; требует немедленной реанимации"
    ],
    warnings: [
      "Временные точки оценки: 1 минута — отражает состояние при рождении; 5 минут — отражает ответ на реанимацию; 10, 15, 20 минут — при стойком балле ≤ 3 увеличивается риск неблагоприятного неврологического исхода",
      "Прогностическое значение: 5-минутный балл 0–3 коррелирует с риском неонатальной смертности на популяционном уровне, но не предсказывает индивидуальный неврологический исход. 75% детей с церебральным параличом имели нормальный балл на 5-й минуте",
      "Риск смерти в течение 28 дней при 5-минутном балле: 0 — 23,2%; 1–3 — 5,1%; 4–6 — 0,6%; 7–10 — < 0,1%",
      "Факторы, влияющие на результат: гестационный возраст (у недоношенных закономерно более низкие баллы), материнские препараты (анестетики, магния сульфат, опиоиды), врождённые пороки развития, интубация/ИВЛ",
      "Расширенная форма Апгар (Expanded Apgar Score): AAP и ACOG рекомендуют дополнительно фиксировать сопутствующие реанимационные вмешательства на каждой временной точке (тактильная стимуляция, подача кислорода, ВПД, интубация, НМС, введение адреналина). Балл Апгар во время активной реанимации не эквивалентен баллу у новорождённого с самостоятельным дыханием",
      "Ограничения: не валидирована для глубоко недоношенных, не должна использоваться для определения показаний к началу реанимации или выбора конкретных реанимационных вмешательств"
    ]
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-apgar-state";
  var state = {
    currentTime: "1min",
    scores: {
      "1min": { A: null, P: null, G: null, T: null, R: null },
      "5min": { A: null, P: null, G: null, T: null, R: null }
    }
  };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    if (saved.currentTime) state.currentTime = saved.currentTime;
    if (saved.scores) {
      if (saved.scores["1min"]) state.scores["1min"] = saved.scores["1min"];
      if (saved.scores["5min"]) state.scores["5min"] = saved.scores["5min"];
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function calcSum(time) {
    var s = state.scores[time];
    var filled = 0, sum = 0;
    for (var k in s) {
      if (s[k] !== null) { filled++; sum += s[k]; }
    }
    return { filled: filled, sum: (filled === GROUPS.length ? sum : null) };
  }

  function rangeFor(sum) {
    if (sum === null) return null;
    for (var i = 0; i < RANGES.length; i++) {
      if (sum >= RANGES[i].min && sum <= RANGES[i].max) return RANGES[i];
    }
    return RANGES[RANGES.length - 1];
  }

  function getOverallColor() {
    var r1 = calcSum("1min");
    var r5 = calcSum("5min");
    var last = (r5.sum !== null ? r5.sum : r1.sum);
    if (last === null) return "#1f6e9c";
    var range = rangeFor(last);
    if (!range) return "#1f6e9c";
    if (range.color === "gcs-15") return "#1a7a3e";
    if (range.color === "gcs-11-12") return "#b08900";
    if (range.color === "gcs-8-10") return "#d2401e";
    if (range.color === "gcs-4-5") return "#b42323";
    if (range.color === "gcs-3") return "#7a0e1c";
    return "#1f6e9c";
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderTimeSwitcher() {
    var r1 = calcSum("1min"), r5 = calcSum("5min");
    return '<div class="apgar-time-switcher">' +
      '<button type="button" class="apgar-time-btn' + (state.currentTime === "1min" ? " active" : "") + '" data-time="1min">' +
        '<span>️⏱️</span>' +
        '<div class="apgar-time-label">1 минута</div>' +
        '<div class="apgar-time-score">' + (r1.sum !== null ? r1.sum + "/10" : r1.filled + "/5") + '</div>' +
      '</button>' +
      '<button type="button" class="apgar-time-btn' + (state.currentTime === "5min" ? " active" : "") + '" data-time="5min">' +
        '<span>⏱️</span>' +
        '<div class="apgar-time-label">5 минут</div>' +
        '<div class="apgar-time-score">' + (r5.sum !== null ? r5.sum + "/10" : r5.filled + "/5") + '</div>' +
      '</button>' +
    '</div>';
  }

  function renderGroups() {
    var cur = state.scores[state.currentTime];
    var color = getOverallColor();

    var groupsHtml = GROUPS.map(function (g) {
      var sel = cur[g.id];
      var scoreDisplay = sel !== null ? sel : "—";

      var itemsHtml = g.items.map(function (it) {
        var isChecked = sel === it.value;
        return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-group="' + g.id + '" data-value="' + it.value + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
          '<span class="geneva-radio-custom"></span>' +
          '<span class="geneva-item-content">' +
            '<span class="geneva-item-title">' + CU.escapeHtml(it.title) + '</span>' +
            '<span class="geneva-item-points">' + it.value + '</span>' +
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

    bodyEl.innerHTML = renderTimeSwitcher() + groupsHtml;
  }

  function renderResult() {
    var r1 = calcSum("1min"), r5 = calcSum("5min");

    if (r1.filled === 0 && r5.filled === 0) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 10 баллов",
        color: "incomplete",
        title: "Оцените новорождённого",
        description: "Заполните параметры на 1-й и 5-й минутах",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    // Динамика
    var trendHtml = "";
    if (r1.sum !== null && r5.sum !== null) {
      var diff = r5.sum - r1.sum;
      if (diff > 0) {
        trendHtml = '<div class="apgar-trend trend-up">📈 Улучшение на ' + diff + ' балл(а)</div>';
      } else if (diff < 0) {
        trendHtml = '<div class="apgar-trend trend-down">📉 Ухудшение на ' + Math.abs(diff) + ' балл(а)</div>';
      } else {
        trendHtml = '<div class="apgar-trend trend-same">➖ Без динамики</div>';
      }
    }

    // Интерпретация убрана по запросу
    var last = (r5.sum !== null ? r5.sum : r1.sum);
    var range = rangeFor(last);

    var breakdownHtml = trendHtml;

    var score = last !== null ? last : "—";
    var color = range ? range.color : "incomplete";
    var title = range ? range.label : "Оценка";

    CU.renderResultPanel({
      score: score,
      scoreLabel: "из 10 баллов",
      color: color,
      title: title,
      description: "",
      extraDescription: "",
      breakdownHtml: breakdownHtml,
      onReset: resetAll
    });
  }

  function resetAll() {
    state = {
      currentTime: "1min",
      scores: {
        "1min": { A: null, P: null, G: null, T: null, R: null },
        "5min": { A: null, P: null, G: null, T: null, R: null }
      }
    };
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      // Переключатель времени
      var timeBtn = e.target.closest(".apgar-time-btn");
      if (timeBtn) {
        state.currentTime = timeBtn.getAttribute("data-time");
        saveState();
        renderGroups();
        renderResult();
        return;
      }

      // Radio-кнопки параметров
      var item = e.target.closest(".geneva-radio-item[data-group]");
      if (!item) return;
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.scores[state.currentTime][g] = v;
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item[data-group]");
      if (!item) return;
      e.preventDefault();
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.scores[state.currentTime][g] = v;
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("apgarGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.apgar && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.apgar });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();