(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var PRACTICAL_NOTES = {
    questions: "Пациента просят назвать свой возраст и текущий месяц. Правильный ответ на оба вопроса — 0 баллов.",
    commands: "Пациента просят открыть и закрыть глаза, затем сжать руку в кулак. Выполнение обеих инструкций — 0 баллов.",
    aphasia: "Лёгкая/умеренная афазия — некоторая потеря беглости или понимания. Тяжёлая — общение фрагментарное. Немая — отсутствие разумной речи."
  };

  var GROUPS = [
    {
      id: "loc", title: "Уровень сознания", icon: "🧠",
      subgroups: [
        { id: "loc_main", label: null, items: [
          { v: 0, t: "Бодрствует, реагирует адекватно" },
          { v: 1, t: "Лёгкая возбудимость, реагирует на минимальную стимуляцию" },
          { v: 2, t: "Заторможенность, требует многократного обращения" },
          { v: 3, t: "Реагирует только на рефлекторные стимулы или арефлексия" }
        ]}
      ]
    },
    {
      id: "questions", title: "Ответы на вопросы (возраст, месяц)", icon: "❓", note: "questions",
      subgroups: [
        { id: "questions_main", label: null, items: [
          { v: 0, t: "Правильный ответ на оба вопроса" },
          { v: 1, t: "Правильный ответ на один вопрос" },
          { v: 2, t: "Ни одного правильного ответа" }
        ]}
      ]
    },
    {
      id: "commands", title: "Выполнение инструкций", icon: "✅", note: "commands",
      subgroups: [
        { id: "commands_main", label: null, items: [
          { v: 0, t: "Выполняет обе инструкции (открыть глаза, сжать кулак)" },
          { v: 1, t: "Выполняет одну инструкцию" },
          { v: 2, t: "Не выполняет ни одной инструкции" }
        ]}
      ]
    },
    {
      id: "gaze", title: "Парез взора", icon: "👀",
      subgroups: [
        { id: "gaze_main", label: null, items: [
          { v: 0, t: "Норма" },
          { v: 1, t: "Частичный паралич, вынужденная девиация отсутствует" },
          { v: 2, t: "Вынужденная девиация или полный паралич" }
        ]}
      ]
    },
    {
      id: "visual", title: "Поля зрения", icon: "🌐",
      subgroups: [
        { id: "visual_main", label: null, items: [
          { v: 0, t: "Сохранены" },
          { v: 1, t: "Частичная гемианопсия" },
          { v: 2, t: "Полная гемианопсия" },
          { v: 3, t: "Слепота (двусторонняя гемианопсия, включая кортикальную)" }
        ]}
      ]
    },
    {
      id: "facial", title: "Парез лицевой мускулатуры", icon: "😐",
      subgroups: [
        { id: "facial_main", label: null, items: [
          { v: 0, t: "Норма, симметричные движения" },
          { v: 1, t: "Незначительный парез (сглаженность носогубной складки)" },
          { v: 2, t: "Частичный парез (отчётливая асимметрия при улыбке)" },
          { v: 3, t: "Полный одно- или двусторонний паралич" }
        ]}
      ]
    },
    {
      id: "arm", title: "Движения в руках", icon: "🤲", dual: true,
      subgroups: [
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
      ]
    },
    {
      id: "leg", title: "Движения в ногах", icon: "🦵", dual: true,
      subgroups: [
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
      ]
    },
    {
      id: "ataxia", title: "Атаксия конечностей", icon: "⚖️",
      subgroups: [
        { id: "ataxia_main", label: null, items: [
          { v: 0, t: "Атаксия отсутствует" },
          { v: 1, t: "Атаксия в одной конечности" },
          { v: 2, t: "Атаксия в двух и более конечностях" }
        ]}
      ]
    },
    {
      id: "sensory", title: "Чувствительность", icon: "✋",
      subgroups: [
        { id: "sensory_main", label: null, items: [
          { v: 0, t: "Норма, симметричная" },
          { v: 1, t: "Умеренная гемигипестезия" },
          { v: 2, t: "Тяжёлая или тотальная гемигипестезия" }
        ]}
      ]
    },
    {
      id: "language", title: "Лучшая функция языка", icon: "💬", note: "aphasia",
      subgroups: [
        { id: "language_main", label: null, items: [
          { v: 0, t: "Афазия отсутствует" },
          { v: 1, t: "Лёгкая или умеренная афазия" },
          { v: 2, t: "Тяжёлая афазия (фрагментарная речь)" },
          { v: 3, t: "Немая (глобальная) афазия" }
        ]}
      ]
    },
    {
      id: "dysarthria", title: "Артикуляция / дизартрия", icon: "🗣️",
      subgroups: [
        { id: "dysarthria_main", label: null, items: [
          { v: 0, t: "Норма, чёткая речь" },
          { v: 1, t: "Лёгкая или умеренная дизартрия" },
          { v: 2, t: "Выраженная дизартрия (речь не поддаётся пониманию)" }
        ]}
      ]
    },
    {
      id: "extinction", title: "Угасание рефлекса / невнимательность", icon: "👁️",
      subgroups: [
        { id: "extinction_main", label: null, items: [
          { v: 0, t: "Отсутствует" },
          { v: 1, t: "Невнимательность в одной модальности" },
          { v: 2, t: "Глубокое игнорирование или угасание в нескольких модальностях" }
        ]}
      ]
    }
  ];

  var RANGES = [
    { min: 0,  max: 0,  label: "Нет неврологического дефицита", color: "gcs-15",    description: "Все функции сохранены. ТИА или лакунарный инсульт?" },
    { min: 1,  max: 4,  label: "Лёгкий инсульт",                color: "gcs-14",    description: "Незначительный дефицит. Рассмотреть тромболизис при наличии показаний." },
    { min: 5,  max: 15, label: "Умеренный инсульт",             color: "gcs-11-12", description: "Чётко выраженный дефицит. Показана тромболитическая терапия в терапевтическом окне." },
    { min: 16, max: 20, label: "Среднетяжёлый-тяжёлый инсульт", color: "gcs-8-10",  description: "Значительный дефицит. Рассмотреть тромбэктомию при окклюзии крупных сосудов." },
    { min: 21, max: 42, label: "Тяжёлый инсульт",               color: "gcs-3",     description: "Тотальный дефицит. Высокий риск малигнизации отёка. ИТ в ОРИТ." }
  ];

  var REFERENCE = {
    title: "О шкале NIHSS",
    paragraphs: [
      "NIHSS (National Institutes of Health Stroke Scale) — международный стандарт количественной оценки тяжести неврологического дефицита при остром ишемическом и геморрагическом инсульте.",
      "11 параметров, максимальная сумма 42 балла. Критически важна для решения о тромболизисе и тромбэктомии: балл ≥ 6 обычно является показанием к тромбэктомии при окклюзии крупных сосудов."
    ],
    importantNote: "Шкала оценивает наилучший ответ пациента. Движения рук и ног оцениваются отдельно для каждой стороны. При невозможности оценки параметра (ампутация, афазия) используйте значение «Невозможно оценить» — оно не засчитывается в сумму."
  };

  var selections = {};
  var groupsEl, panelEl;

  function countSubgroups() {
    var count = 0;
    GROUPS.forEach(function (g) { count += g.subgroups.length; });
    return count;
  }

  function findGroupIdBySubgroupId(sgId) {
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].subgroups.some(function (sg) { return sg.id === sgId; })) {
        return GROUPS[i].id;
      }
    }
    return null;
  }

  function calculateGroupScore(groupId) {
    var group = GROUPS.find(function (g) { return g.id === groupId; });
    if (!group) return 0;
    var sum = 0;
    group.subgroups.forEach(function (sg) {
      if (selections[sg.id] !== undefined) sum += selections[sg.id];
    });
    return sum;
  }

  function total() {
    var sum = 0;
    for (var k in selections) sum += selections[k];
    return sum;
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return RANGES[RANGES.length - 1];
  }

  function renderGroups() {
    groupsEl.innerHTML = GROUPS.map(function (g) {
      var groupScore = calculateGroupScore(g.id);
      var hasValue = groupScore > 0;
      var noteHtml = g.note ? '<div class="nihss-group-note"><span>ℹ️</span>' + CU.escapeHtml(PRACTICAL_NOTES[g.note]) + '</div>' : '';

      var subgroupsHtml = g.subgroups.map(function (sg) {
        var labelHtml = g.dual ? '<div class="nihss-subgroup-label">' + sg.label + '</div>' : '';
        var itemsHtml = sg.items.map(function (it) {
          var sel = selections[sg.id] === it.v ? " selected" : "";
          return '<div class="gcs-radio-item' + sel + '" data-subgroup="' + sg.id + '" data-value="' + it.v + '">' +
            '<div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>' +
            '<div class="gcs-radio-content"><div class="gcs-radio-title">' + it.t + '</div></div>' +
            '<div class="gcs-radio-points">' + it.v + '</div></div>';
        }).join("");
        return labelHtml + itemsHtml;
      }).join("");

      return '<div class="gcs-group">' +
        '<div class="gcs-group-header"><span>' + g.icon + '</span>' +
        '<span class="gcs-group-title">' + g.title + '</span>' +
        '<span class="gcs-group-value' + (hasValue ? ' has-value' : '') + '" id="value-' + g.id + '">' + (hasValue ? groupScore : '—') + '</span></div>' +
        noteHtml +
        '<div class="gcs-group-items">' + subgroupsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  function renderResult() {
    var filled = Object.keys(selections).length;
    var totalSG = countSubgroups();
    if (filled < totalSG) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">неполная оценка</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните все параметры</div><div class="result-description">Осталось: ' + (totalSG - filled) + ' из ' + totalSG + '</div></div>' +
        '</div>';
      return;
    }
    var s = total();
    var r = getRange(s);
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + s + '</div><div class="result-score-label">из 42 баллов</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + r.label + '</div><div class="result-description">' + r.description + '</div></div>' +
      '</div>';
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
      var sgId = item.getAttribute("data-subgroup");
      var v = parseInt(item.getAttribute("data-value"), 10);
      selections[sgId] = v;
      renderGroups();
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