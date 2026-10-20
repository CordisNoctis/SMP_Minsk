(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ПОДСКАЗКИ (можно перенести в markdown-справку) =====
  var PRACTICAL_NOTES = {
    questions: "Пациента просят назвать свой возраст и текущий месяц. Правильный ответ на оба вопроса — 0 баллов.",
    commands: "Пациента просят открыть и закрыть глаза, затем сжать руку в кулак. Выполнение обеих инструкций — 0 баллов.",
    aphasia: "Лёгкая/умеренная афазия — некоторая потеря беглости или понимания. Тяжёлая — общение фрагментарное. Немая — отсутствие разумной речи."
  };

  // ===== ПАРАМЕТРЫ ШКАЛЫ =====
  var GROUPS = [
    { id: "loc", title: "Уровень сознания", icon: "🧠", color: "#1f6e9c", subgroups: [
      { id: "loc_main", label: null, items: [
        { v: 0, t: "Бодрствует, реагирует адекватно" },
        { v: 1, t: "Лёгкая возбудимость, реагирует на минимальную стимуляцию" },
        { v: 2, t: "Заторможенность, требует многократного обращения" },
        { v: 3, t: "Реагирует только на рефлекторные стимулы или арефлексия" }
      ]}
    ]},
    { id: "questions", title: "Ответы на вопросы (возраст, месяц)", icon: "❓", color: "#e68a2e", note: "questions", subgroups: [
      { id: "questions_main", label: null, items: [
        { v: 0, t: "Правильный ответ на оба вопроса" },
        { v: 1, t: "Правильный ответ на один вопрос" },
        { v: 2, t: "Ни одного правильного ответа" }
      ]}
    ]},
    { id: "commands", title: "Выполнение инструкций", icon: "✅", color: "#2e8b57", note: "commands", subgroups: [
      { id: "commands_main", label: null, items: [
        { v: 0, t: "Выполняет обе инструкции (открыть глаза, сжать кулак)" },
        { v: 1, t: "Выполняет одну инструкцию" },
        { v: 2, t: "Не выполняет ни одной инструкции" }
      ]}
    ]},
    { id: "gaze", title: "Парез взора", icon: "👀", color: "#6a5acd", subgroups: [
      { id: "gaze_main", label: null, items: [
        { v: 0, t: "Норма" },
        { v: 1, t: "Частичный паралич, вынужденная девиация отсутствует" },
        { v: 2, t: "Вынужденная девиация или полный паралич" }
      ]}
    ]},
    { id: "visual", title: "Поля зрения", icon: "🌐", color: "#8b5a2b", subgroups: [
      { id: "visual_main", label: null, items: [
        { v: 0, t: "Сохранены" },
        { v: 1, t: "Частичная гемианопсия" },
        { v: 2, t: "Полная гемианопсия" },
        { v: 3, t: "Слепота (двусторонняя гемианопсия, включая кортикальную)" }
      ]}
    ]},
    { id: "facial", title: "Парез лицевой мускулатуры", icon: "😐", color: "#b42323", subgroups: [
      { id: "facial_main", label: null, items: [
        { v: 0, t: "Норма, симметричные движения" },
        { v: 1, t: "Незначительный парез (сглаженность носогубной складки)" },
        { v: 2, t: "Частичный парез (отчётливая асимметрия при улыбке)" },
        { v: 3, t: "Полный одно- или двусторонний паралич" }
      ]}
    ]},
    { id: "arm", title: "Движения в руках", icon: "🤲", color: "#0e7490", dual: true, subgroups: [
      { id: "arm_left", label: "Левая рука", items: [
        { v: 0, t: "Нет пареза (удерживает 10 сек)" },
        { v: 1, t: "Дрейфует, но не ударяется о опору" },
        { v: 2, t: "Некоторое усилие против силы тяжести" },
        { v: 3, t: "Не удерживает, падает" },
        { v: 4, t: "Полное отсутствие движений" }
      ]},
      { id: "arm_right", label: "Правая рука", items: [
        { v: 0, t: "Нет пареза (удерживает 10 сек)" },
        { v: 1, t: "Дрейфует, но не ударяется о опору" },
        { v: 2, t: "Некоторое усилие против силы тяжести" },
        { v: 3, t: "Не удерживает, падает" },
        { v: 4, t: "Полное отсутствие движений" }
      ]}
    ]},
    { id: "leg", title: "Движения в ногах", icon: "🦵", color: "#c77700", dual: true, subgroups: [
      { id: "leg_left", label: "Левая нога", items: [
        { v: 0, t: "Нет пареза (удерживает 5 сек)" },
        { v: 1, t: "Дрейфует, но не ударяется о опору" },
        { v: 2, t: "Падает, но прилагает усилия против силы тяжести" },
        { v: 3, t: "Не удерживает, падает" },
        { v: 4, t: "Полное отсутствие движений" }
      ]},
      { id: "leg_right", label: "Правая нога", items: [
        { v: 0, t: "Нет пареза (удерживает 5 сек)" },
        { v: 1, t: "Дрейфует, но не ударяется о опору" },
        { v: 2, t: "Падает, но прилагает усилия против силы тяжести" },
        { v: 3, t: "Не удерживает, падает" },
        { v: 4, t: "Полное отсутствие движений" }
      ]}
    ]},
    { id: "ataxia", title: "Атаксия конечностей", icon: "⚖️", color: "#9c1f6e", subgroups: [
      { id: "ataxia_main", label: null, items: [
        { v: 0, t: "Атаксия отсутствует" },
        { v: 1, t: "Атаксия в одной конечности" },
        { v: 2, t: "Атаксия в двух и более конечностях" }
      ]}
    ]},
    { id: "sensory", title: "Чувствительность", icon: "✋", color: "#1f6e9c", subgroups: [
      { id: "sensory_main", label: null, items: [
        { v: 0, t: "Норма, симметричная" },
        { v: 1, t: "Умеренная гемигипестезия" },
        { v: 2, t: "Тяжёлая или тотальная гемигипестезия" }
      ]}
    ]},
    { id: "language", title: "Лучшая функция языка", icon: "💬", color: "#e68a2e", note: "aphasia", subgroups: [
      { id: "language_main", label: null, items: [
        { v: 0, t: "Афазия отсутствует" },
        { v: 1, t: "Лёгкая или умеренная афазия" },
        { v: 2, t: "Тяжёлая афазия (фрагментарная речь)" },
        { v: 3, t: "Немая (глобальная) афазия" }
      ]}
    ]},
    { id: "dysarthria", title: "Артикуляция / дизартрия", icon: "🗣️", color: "#2e8b57", subgroups: [
      { id: "dysarthria_main", label: null, items: [
        { v: 0, t: "Норма, чёткая речь" },
        { v: 1, t: "Лёгкая или умеренная дизартрия" },
        { v: 2, t: "Выраженная дизартрия (речь не поддаётся пониманию)" }
      ]}
    ]},
    { id: "extinction", title: "Угасание рефлекса / невнимательность", icon: "👁️", color: "#b42323", subgroups: [
      { id: "extinction_main", label: null, items: [
        { v: 0, t: "Отсутствует" },
        { v: 1, t: "Невнимательность в одной модальности" },
        { v: 2, t: "Глубокое игнорирование или угасание в нескольких модальностях" }
      ]}
    ]}
  ];

  // ===== ИНТЕРПРЕТАЦИЯ =====
  var RANGES = [
    { min: 0,  max: 0,  label: "Нет неврологического дефицита", color: "gcs-15" },
    { min: 1,  max: 4,  label: "Лёгкий инсульт",                color: "gcs-14" },
    { min: 5,  max: 15, label: "Умеренный инсульт",             color: "gcs-11-12" },
    { min: 16, max: 20, label: "Среднетяжёлый-тяжёлый инсульт", color: "gcs-8-10" },
    { min: 21, max: 42, label: "Тяжёлый инсульт",               color: "gcs-3" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв) =====
  var REFERENCE = {
    title: "О шкале NIHSS",
    paragraphs: [
      "NIHSS — международный стандарт количественной оценки тяжести неврологического дефицита при остром инсульте.",
      "11 параметров (с разделением на стороны для моторики), максимальная сумма 42 балла. Критически важна для решения о тромболизисе и тромбэктомии."
    ],
    importantNote: "Шкала оценивает наилучший ответ пациента. При невозможности оценки параметра (ампутация, афазия) используйте значение «Невозможно оценить»."
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-nihss-state";
  var state = { selections: {} };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && saved.selections) {
      state.selections = saved.selections;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function countSubgroups() {
    var count = 0;
    GROUPS.forEach(function (g) { count += g.subgroups.length; });
    return count;
  }

  function calculateGroupScore(groupId) {
    var group = GROUPS.find(function (g) { return g.id === groupId; });
    if (!group) return 0;
    var sum = 0;
    group.subgroups.forEach(function (sg) {
      if (state.selections[sg.id] !== undefined) sum += state.selections[sg.id];
    });
    return sum;
  }

  function isGroupFilled(group) {
    return group.subgroups.every(function (sg) {
      return state.selections[sg.id] !== undefined;
    });
  }

  function total() {
    var sum = 0;
    for (var k in state.selections) sum += state.selections[k];
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
    bodyEl.innerHTML = GROUPS.map(function (g) {
      var isFilled = isGroupFilled(g);
      var groupScore = calculateGroupScore(g.id);
      var scoreDisplay = isFilled ? groupScore : "Х";

      var subgroupsHtml = g.subgroups.map(function (sg) {
        var labelHtml = g.dual ? '<div class="nihss-subgroup-label">' + sg.label + '</div>' : '';
        
        var itemsHtml = sg.items.map(function (it) {
          var isChecked = state.selections[sg.id] === it.v;
          return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-subgroup="' + sg.id + '" data-value="' + it.v + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
            '<span class="geneva-radio-custom"></span>' +
            '<span class="geneva-item-content">' +
              '<span class="geneva-item-title">' + CU.escapeHtml(it.t) + '</span>' +
              '<span class="geneva-item-points">' + it.v + '</span>' +
            '</span>' +
          '</div>';
        }).join("");
        
        return labelHtml + itemsHtml;
      }).join("");

      var noteHtml = g.note ? '<div class="nihss-group-note"><span>ℹ️</span>' + CU.escapeHtml(PRACTICAL_NOTES[g.note]) + '</div>' : '';

      return '<div class="geneva-category" style="--cat-color: ' + g.color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">' + g.icon + '</span>' +
            '<span class="geneva-category-title">' + g.title + '</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + scoreDisplay + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + noteHtml + subgroupsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  function renderResult() {
    var totalSG = countSubgroups();
    var filledCount = Object.keys(state.selections).length;

    if (filledCount < totalSG) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 42 баллов",
        color: "incomplete",
        title: "Оцените все параметры",
        description: "Заполнено: " + filledCount + " из " + totalSG,
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
      scoreLabel: "из 42 баллов",
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
      var item = e.target.closest(".geneva-radio-item[data-subgroup]");
      if (!item) return;
      var sgId = item.getAttribute("data-subgroup");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.selections[sgId] = v;
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item[data-subgroup]");
      if (!item) return;
      e.preventDefault();
      var sgId = item.getAttribute("data-subgroup");
      var v = parseInt(item.getAttribute("data-value"), 10);
      state.selections[sgId] = v;
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("nihssGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.nihss && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.nihss });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();