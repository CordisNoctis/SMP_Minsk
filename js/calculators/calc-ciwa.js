(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПАРАМЕТРЫ ШКАЛЫ =====
  var GROUPS = [
    { id: "nausea", title: "Тошнота и рвота", icon: "🤢", color: "#1f6e9c", items: [
      {v:0,t:"Нет тошноты"},{v:1,t:"Очень лёгкая"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная"},
      {v:4,t:"Умеренная с позывами на рвоту"},{v:5,t:"Сильная"},{v:6,t:"Сильная с позывами"},{v:7,t:"Постоянная с многократной рвотой"}
    ]},
    { id: "tremor", title: "Тремор (руки вытянуты, пальцы разведены)", icon: "🤲", color: "#e68a2e", items: [
      {v:0,t:"Отсутствует"},{v:1,t:"Не заметен, ощущается кончиками пальцев"},{v:2,t:"Очень лёгкий"},{v:3,t:"Лёгкий"},
      {v:4,t:"Умеренный в покое"},{v:5,t:"Умеренный при вытянутых руках"},{v:6,t:"Выраженный"},{v:7,t:"Грубый, размашистый"}
    ]},
    { id: "sweating", title: "Пароксизмальные поты", icon: "💧", color: "#0e7490", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Едва заметны"},{v:2,t:"Лёгкая влажность ладоней"},{v:3,t:"Испарина на лбу"},
      {v:4,t:"Умеренная потливость"},{v:5,t:"Выраженная на лице"},{v:6,t:"Профузный пот"},{v:7,t:"Профузный по всему телу"}
    ]},
    { id: "anxiety", title: "Тревога", icon: "😰", color: "#6a5acd", items: [
      {v:0,t:"Отсутствует, спокоен"},{v:1,t:"Очень лёгкая"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная (дискомфорт)"},
      {v:4,t:"Умеренно выраженная"},{v:5,t:"Выраженная"},{v:6,t:"Сильная"},{v:7,t:"Эквивалент панической атаки"}
    ]},
    { id: "agitation", title: "Ажитация", icon: "🏃", color: "#c77700", items: [
      {v:0,t:"Нормальная активность"},{v:1,t:"Чуть больше обычной"},{v:2,t:"Лёгкое беспокойство"},{v:3,t:"Умеренное беспокойство"},
      {v:4,t:"Умеренно выраженная"},{v:5,t:"Выраженная"},{v:6,t:"Мечется, меняет позу"},{v:7,t:"Пытается встать с кровати"}
    ]},
    { id: "tactile", title: "Тактильные нарушения", icon: "✋", color: "#2e8b57", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Очень лёгкий зуд/парестезии"},{v:2,t:"Лёгкий зуд"},{v:3,t:"Умеренный"},
      {v:4,t:"Умеренно выраженный"},{v:5,t:"Выраженные ощущения"},{v:6,t:"Сильные галлюцинации"},{v:7,t:"Постоянные галлюцинации"}
    ]},
    { id: "auditory", title: "Слуховые нарушения", icon: "👂", color: "#8b5a2b", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Лёгкая раздражительность к звукам"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная"},
      {v:4,t:"Умеренно выраженные галлюцинации"},{v:5,t:"Выраженные"},{v:6,t:"Постоянные"},{v:7,t:"Угрожающие голоса"}
    ]},
    { id: "visual", title: "Зрительные нарушения", icon: "👁️", color: "#b42323", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Лёгкая светобоязнь"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная светобоязнь"},
      {v:4,t:"Умеренные галлюцинации"},{v:5,t:"Выраженные"},{v:6,t:"Постоянные"},{v:7,t:"Угрожающие видения"}
    ]},
    { id: "headache", title: "Головная боль", icon: "🤕", color: "#d2401e", items: [
      {v:0,t:"Отсутствует"},{v:1,t:"Очень лёгкая"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная"},
      {v:4,t:"Умеренно выраженная"},{v:5,t:"Выраженная"},{v:6,t:"Сильная"},{v:7,t:"Тяжелейшая мигрень"}
    ]},
    { id: "orientation", title: "Ориентация и ясность сознания", icon: "🧠", color: "#9c1f6e", items: [
      {v:0,t:"Полностью ориентирован, серийный счёт"},{v:1,t:"Не может серийный счёт, но ориентирован"},
      {v:2,t:"Дезориентирован в дате"},{v:3,t:"Дезориентирован в месте"},{v:4,t:"Дезориентирован в личности"}
    ]}
  ];

  // ===== ИНТЕРПРЕТАЦИЯ =====
  var RANGES = [
    { min: 0,  max: 7,  label: "Лёгкая абстиненция",    color: "gcs-15" },
    { min: 8,  max: 15, label: "Умеренная абстиненция", color: "gcs-11-12" },
    { min: 16, max: 67, label: "Тяжёлая абстиненция",   color: "gcs-3" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ =====
  var REFERENCE = {
    title: "О шкале CIWA-Ar",
    paragraphs: [
      "CIWA-Ar — стандартизированный инструмент оценки алкогольной абстиненции (1989). 10 параметров, большинство 0–7 баллов (ориентация 0–4). Максимум 67 баллов.",
      "Позволяет титровать дозы бензодиазепинов и снизить общую дозу седативных на 50–70% по сравнению с фиксированным дозированием. Оценку проводят каждые 4–8 часов до стабильного снижения ниже 8–10."
    ],
    importantNote: "Шкала не заменяет клиническую оценку. При признаках алкогольного делирия (спутанность, галлюцинации, гипертермия) — экстренная терапия независимо от балла.",
    indicationsTitle: "Тактика терапии по баллу:",
    indications: [
      "0–7 баллов — Лёгкая абстиненция: без фармакотерапии, наблюдение каждые 8 часов, психологическая поддержка",
      "8–15 баллов — Умеренная абстиненция: бензодиазепины по потребности, мониторинг каждые 4–8 часов",
      "16–67 баллов — Тяжёлая абстиненция: интенсивная седация, риск делирия и судорог, рассмотреть госпитализацию в ОРИТ"
    ]
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-ciwa-state";
  var state = { selections: {} };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && saved.selections) {
      state.selections = saved.selections;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function total() {
    var sum = 0;
    for (var k in state.selections) sum += state.selections[k];
    return sum;
  }

  function filledCount() {
    return Object.keys(state.selections).length;
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
      var scoreDisplay = (sel != null) ? sel : "Х";

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
    var fc = filledCount();

    if (fc < GROUPS.length) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 67 баллов",
        color: "incomplete",
        title: "Оцените все параметры",
        description: "Заполнено: " + fc + " из " + GROUPS.length,
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
      scoreLabel: "из 67 баллов",
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
      var item = e.target.closest(".geneva-radio-item[data-group]");
      if (!item) return;
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.selections[g] = v;
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
      state.selections[g] = v;
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("ciwaGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.ciwa && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.ciwa });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();