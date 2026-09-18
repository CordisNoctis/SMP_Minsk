(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== КАТЕГОРИИ ПАРАМЕТРОВ (Структура как у Женевской шкалы) =====
  var GROUPS_ADULT = [
    { id: "E", title: "Открывание глаз (E, Eye response)", icon: "👁️", color: "#1f6e9c", items: [
      { id: "E4", title: "Произвольное", points: 4 },
      { id: "E3", title: "На звук", points: 3 },
      { id: "E2", title: "На болевое раздражение", points: 2 },
      { id: "E1", title: "Отсутствует", points: 1 }
    ]},
    { id: "V", title: "Речевая реакция (V, Verbal response)", icon: "🗣️", color: "#e68a2e", items: [
      { id: "V5", title: "Ориентирован, говорит правильно", points: 5 },
      { id: "V4", title: "Спутанность сознания, дезориентирован", points: 4 },
      { id: "V3", title: "Неадекватные слова", points: 3 },
      { id: "V2", title: "Нечленораздельные звуки", points: 2 },
      { id: "V1", title: "Отсутствует", points: 1 }
    ]},
    { id: "M", title: "Двигательная реакция (M, Motor response)", icon: "💪", color: "#b42323", items: [
      { id: "M6", title: "Выполняет команды", points: 6 },
      { id: "M5", title: "Локализует боль", points: 5 },
      { id: "M4", title: "Отдёргивает конечность (нормальное сгибание)", points: 4 },
      { id: "M3", title: "Патологическое сгибание (декортикация)", points: 3 },
      { id: "M2", title: "Патологическое разгибание (децеребрация)", points: 2 },
      { id: "M1", title: "Отсутствует", points: 1 }
    ]}
  ];

  var GROUPS_INFANT = [
    { id: "E", title: "Открывание глаз (E, Eye response)", icon: "👁️", color: "#1f6e9c", items: [
      { id: "E4", title: "Произвольное", points: 4 },
      { id: "E3", title: "На звук", points: 3 },
      { id: "E2", title: "На болевое раздражение", points: 2 },
      { id: "E1", title: "Отсутствует", points: 1 }
    ]},
    { id: "V", title: "Речевая реакция (V, Verbal response, до 1 года)", icon: "🗣️", color: "#e68a2e", items: [
      { id: "V5", title: "Гулит, улыбается или проявляет неудовольствие", points: 5 },
      { id: "V4", title: "Эпизодический крик, плач спонтанно", points: 4 },
      { id: "V3", title: "Постоянный крик или плач", points: 3 },
      { id: "V2", title: "Стон на боль", points: 2 },
      { id: "V1", title: "Нет ответа", points: 1 }
    ]},
    { id: "M", title: "Двигательная реакция (M, Motor response, до 1 года)", icon: "💪", color: "#b42323", items: [
      { id: "M6", title: "На звук", points: 6 },
      { id: "M5", title: "На боль", points: 5 },
      { id: "M4", title: "Вялая двигательная реакция на боль", points: 4 },
      { id: "M3", title: "Патологическое сгибание (декортикация)", points: 3 },
      { id: "M2", title: "Разгибание (децеребрация)", points: 2 },
      { id: "M1", title: "Нет ответа", points: 1 }
    ]}
  ];

  var GROUPS_PED = [
    { id: "E", title: "Открывание глаз (E, Eye response)", icon: "👁️", color: "#1f6e9c", items: [
      { id: "E4", title: "Произвольное", points: 4 },
      { id: "E3", title: "Реакция на голос", points: 3 },
      { id: "E2", title: "Реакция на боль", points: 2 },
      { id: "E1", title: "Отсутствует", points: 1 }
    ]},
    { id: "V", title: "Речевая реакция (V, Verbal response, 1–4 года)", icon: "🗣️", color: "#e68a2e", items: [
      { id: "V5", title: "Улыбается, ориентируется на звук, следит за объектами", points: 5 },
      { id: "V4", title: "При плаче можно успокоить, интерактивность неполная", points: 4 },
      { id: "V3", title: "При плаче успокаивается ненадолго, стонет", points: 3 },
      { id: "V2", title: "Не успокаивается при плаче, беспокоен", points: 2 },
      { id: "V1", title: "Плач и интерактивность отсутствуют", points: 1 }
    ]},
    { id: "M", title: "Двигательная реакция (M, Motor response, 1–4 года)", icon: "💪", color: "#b42323", items: [
      { id: "M6", title: "Выполнение движений по голосовой команде", points: 6 },
      { id: "M5", title: "Целенаправленное движение в ответ на боль", points: 5 },
      { id: "M4", title: "Отдёргивание в ответ на боль", points: 4 },
      { id: "M3", title: "Патологическое сгибание (декортикация)", points: 3 },
      { id: "M2", title: "Патологическое разгибание (децеребрация)", points: 2 },
      { id: "M1", title: "Отсутствие движений", points: 1 }
    ]}
  ];

  var RANGES_ADULT = [
    { min: 15, max: 15, label: "Ясное сознание", color: "gcs-15", extraDescription: "Полностью ориентирован. Наблюдение." },
    { min: 13, max: 14, label: "Оглушение", color: "gcs-14", extraDescription: "Умеренное нарушение сознания. Обследование, контроль динамики." },
    { min: 9, max: 12, label: "Сопор", color: "gcs-8-10", extraDescription: "Глубокое нарушение. Контроль проходимости дыхательных путей." },
    { min: 4, max: 8, label: "Кома", color: "gcs-4-5", extraDescription: "Обеспечение проходимости ДП / интубация, ИВЛ." },
    { min: 3, max: 3, label: "Глубокая кома", color: "gcs-3", extraDescription: "Терминальное состояние. Реанимационные мероприятия." }
  ];
  var RANGES_PED = RANGES_ADULT; // Интерпретация одинаковая

  var STORAGE_KEY = "smp-gcs-state";

  var state = {
    mode: "adult",
    adult: { E: null, V: null, M: null },
    infant: { E: null, V: null, M: null },
    pediatric: { E: null, V: null, M: null }
  };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    if (saved.mode) state.mode = saved.mode;
    if (saved.adult) state.adult = saved.adult;
    if (saved.infant) state.infant = saved.infant;
    if (saved.pediatric) state.pediatric = saved.pediatric;
  }

  function getCurrentGroups() {
    if (state.mode === "adult") return GROUPS_ADULT;
    if (state.mode === "infant") return GROUPS_INFANT;
    return GROUPS_PED;
  }
  function getCurrentRanges() { return state.mode === "adult" ? RANGES_ADULT : RANGES_PED; }
  function getCurrentState() {
    if (state.mode === "adult") return state.adult;
    if (state.mode === "infant") return state.infant;
    return state.pediatric;
  }

  var bodyEl, panelEl;

  function renderModeSwitcher() {
    return '<div class="gcs-mode-switcher">' +
      '<button type="button" class="gcs-mode-btn' + (state.mode === "adult" ? ' active' : '') + '" data-mode="adult">' +
        '<span>🧑</span><div class="gcs-mode-label">Взрослые</div></button>' +
      '<button type="button" class="gcs-mode-btn' + (state.mode === "pediatric" ? ' active' : '') + '" data-mode="pediatric">' +
        '<span>🧒</span><div class="gcs-mode-label">Дети 1–4 года</div></button>' +
      '<button type="button" class="gcs-mode-btn' + (state.mode === "infant" ? ' active' : '') + '" data-mode="infant">' +
        '<span>👶</span><div class="gcs-mode-label">Дети до 1 года</div></button>' +
    '</div>';
  }

  function renderGroups() {
    var groups = getCurrentGroups();
    var st = getCurrentState();

    var html = groups.map(function (cat) {
      var score = st[cat.id] || 0;
      var itemsHtml = cat.items.map(function (it) {
        var isChecked = st[cat.id] === it.points;
        return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-group="' + cat.id + '" data-value="' + it.points + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
          '<span class="geneva-radio-custom"></span>' +
          '<span class="geneva-item-content">' +
            '<span class="geneva-item-title">' + CU.escapeHtml(it.title) + '</span>' +
            '<span class="geneva-item-points">' + it.points + '</span>' +
          '</span>' +
        '</div>';
      }).join("");

      return '<div class="geneva-category" style="--cat-color: ' + cat.color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">' + cat.icon + '</span>' +
            '<span class="geneva-category-title">' + cat.title + '</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + (score || "Х") + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>';
    }).join("");

    bodyEl.innerHTML = renderModeSwitcher() + html;
  }

  function renderResult() {
    var st = getCurrentState();
    var allFilled = st.E !== null && st.V !== null && st.M !== null;

    // Не показывать подсчёт, пока не выбраны все 3 группы
    if (!allFilled) {
      var filledCount = (st.E !== null ? 1 : 0) + (st.V !== null ? 1 : 0) + (st.M !== null ? 1 : 0);
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 15 баллов",
        color: "incomplete",
        title: "Оцените все параметры",
        description: "Заполнено: " + filledCount + " из 3",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var sum = st.E + st.V + st.M;
    var r = getCurrentRanges().find(function(range) { return sum >= range.min && sum <= range.max; }) || getCurrentRanges()[getCurrentRanges().length - 1];

    CU.renderResultPanel({
      score: sum,
      scoreLabel: "из 15 баллов",
      color: r.color,
      title: r.label,
      description: "",
      extraDescription: r.extraDescription,
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    var st = getCurrentState();
    st.E = null; st.V = null; st.M = null;
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".gcs-mode-btn");
      if (modeBtn) {
        state.mode = modeBtn.getAttribute("data-mode");
        saveState();
        renderGroups();
        renderResult();
        return;
      }

      var item = e.target.closest(".geneva-radio-item");
      if (item) {
        getCurrentState()[item.getAttribute("data-group")] = parseInt(item.getAttribute("data-value"), 10);
        saveState();
        renderGroups();
        renderResult();
      }
    });

    // Поддержка клавиатуры (Enter / Space)
    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item");
      if (!item) return;
      e.preventDefault();
      getCurrentState()[item.getAttribute("data-group")] = parseInt(item.getAttribute("data-value"), 10);
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("gcsGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: {
        title: "О шкале Глазго",
        paragraphs: [
          "Шкала комы Глазго (GCS) — стандартизированный метод оценки уровня сознания, предложена в 1974 году для оценки уровня сознания. Состоит из трёх тестов: открывание глаз (E, 1–4), речевая реакция (V, 1–5), двигательная реакция (M, 1–6). Максимум 15 баллов, минимум 3.",
          "Детская модификация (pGCS) применяется для детей до 4 лет. Ключевое отличие — оценка вербального ответа: оцениваются плач, способность к успокоению, интерактивность и слежение за объектами. Для детей до 1 года используется специальная шкала с учётом возрастных особенностей."
        ],
        importantNote: "ШКГ ≤ 8 баллов — кома: показаны интубация и ИВЛ.",
        indicationsTitle: "Важно:",
        indications: [
          "Оценку проводят до введения седативных препаратов",
          "Оценивайте лучший ответ пациента",
          "При асимметрии моторного ответа учитывать лучшую сторону",
          "У интубированных пациентов наиболее важна двигательная реакция",
          "У интубированных пациентов необходимо дополнительно провести оценку по шкале комы FOUR"
        ]
      }});
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();