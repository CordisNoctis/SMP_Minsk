(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== КЛИНИЧЕСКИЕ ПРИЗНАКИ =====
  var SIGNS = [
    // Класс I
    { id: "clear_lungs", text: "Лёгкие чистые, хрипы не выслушиваются", class: "I" },
    { id: "no_jvd", text: "Нет набухания шейных вен", class: "I" },
    { id: "no_edema", text: "Нет периферических отёков", class: "I" },
    { id: "no_gallop", text: "Отсутствие III тона (ритма галопа)", class: "I" },
    { id: "sbp_100", text: "САД ≥ 100 мм рт. ст.", class: "I" },
    
    // Класс II
    { id: "crackles_half", text: "Влажные хрипы в нижних отделах (до 1/2 полей)", class: "II" },
    { id: "jvd", text: "Набухание шейных вен", class: "II" },
    { id: "gallop", text: "III тон сердца (ритм галопа)", class: "II" },
    { id: "tachycardia", text: "Тахикардия", class: "II" },
    
    // Класс III
    { id: "crackles_full", text: "Влажные хрипы над всей поверхностью лёгких", class: "III" },
    { id: "dyspnea", text: "Выраженная одышка, ортопноэ", class: "III" },
    { id: "frothy_sputum", text: "Пенистая мокрота (может быть розовая)", class: "III" },
    { id: "cyanosis", text: "Цианоз, акроцианоз", class: "III" },
    { id: "tachypnea", text: "Тахипноэ", class: "III" },
    { id: "spo2_low", text: "SpO₂ < 90% на воздухе", class: "III" },
    
    // Класс IV
    { id: "sbp_low", text: "САД < 90 мм рт. ст. (или падение на ≥30)", class: "IV" },
    { id: "oliguria", text: "Олигурия (<20 мл/ч), спутанность сознания", class: "IV" },
    { id: "cold_extremities", text: "Холодные конечности, мраморность", class: "IV" },
    { id: "shock_index", text: "Индекс шока Альговера > 1.0", class: "IV" }
  ];

  // ===== ДАННЫЕ КЛАССОВ =====
  var CLASSES = {
    "I": {
      title: "Класс I — Нет признаков СН",
      mortality: "6%", mortalityModern: "2–3%", color: "gcs-15",
      description: "Отсутствие клинических признаков застойной сердечной недостаточности.",
      management: [
        "Стандартная терапия ОИМ",
        "Мониторинг витальных функций",
        "Ранняя реперфузия (ЧКВ/тромболизис)",
        "Наблюдение в ОРИТ/кардиоблоке"
      ]
    },
    "II": {
      title: "Класс II — Лёгкая-умеренная СН",
      mortality: "17%", mortalityModern: "5–8%", color: "gcs-11-12",
      description: "Признаки застоя в малом круге кровообращения без отёка лёгких.",
      management: [
        "Диуретики (фуросемид в/в)",
        "Нитраты (при отсутствии гипотензии)",
        "Кислородотерапия",
        "Мониторинг диуреза и SpO₂",
        "Экстренная реперфузия"
      ]
    },
    "III": {
      title: "Класс III — Отёк лёгких",
      mortality: "38%", mortalityModern: "10–15%", color: "gcs-8-10",
      description: "Острый отёк лёгких с выраженной дыхательной недостаточностью.",
      management: [
        "Неинвазивная ИВЛ (CPAP/BiPAP)",
        "Нитроглицерин в/в (при САД > 110)",
        "Фуросемид в/в болюсно",
        "Морфин в/в (осторожно)",
        "Оксигенотерапия 100%",
        "Экстренная ЧКВ",
        "Готовность к интубации"
      ]
    },
    "IV": {
      title: "Класс IV — Кардиогенный шок",
      mortality: "81%", mortalityModern: "40–50%", color: "gcs-3",
      description: "Кардиогенный шок с гипоперфузией органов и тканей.",
      management: [
        "Вазопрессоры (норадреналин — выбор)",
        "Инотропы (добутамин) при низкой сократимости",
        "Экстренная ЧКВ — улучшает прогноз",
        "ВАКБ при рефрактерном шоке",
        "ECMO при рефрактерном шоке",
        "Интубация и ИВЛ при ДН",
        "Катетеризация центральной вены"
      ]
    }
  };

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ =====
  var REFERENCE = {
    title: "Классификация Killip (Killip Classification)",
    paragraphs: [
      "Классификация Killip — клиническая шкала стратификации риска при остром инфаркте миокарда (ОИМ), основанная на физикальном обследовании и отражающая степень левожелудочковой недостаточности. Предложена Thomas Killip III и John T. Kimball в 1967 году (Am J Cardiol, 1967;20:457–464).",
      "Шкала не требует инструментальных данных и может применяться немедленно при поступлении, что определяет её высокую практическую ценность в условиях скорой и неотложной помощи. Класс Killip входит в состав шкал TIMI и GRACE и рекомендован ESC 2023 по ОКС.",
      "Класс определяется на основании повторного физикального обследования в динамике, а не однократной оценки при поступлении.",
      "Абсолютные значения летальности значительно снизились в эпоху ЧКВ, однако градиент риска между классами сохраняется и Killip ≥ II по-прежнему является независимым предиктором неблагоприятного исхода при ИМпST.",
      "Историческая справка: создана в период становления блоков интенсивного кардиологического наблюдения как инструмент клинической сортировки. Спустя более 50 лет остаётся обязательным компонентом международных рекомендаций ESC и ACC/AHA по ведению ОКС."
    ],
    importantNote: "Killip ≥ II независимо предсказывает неблагоприятный исход при ИМпST даже в эпоху рутинного первичного ЧКВ. В логистическом регрессионном анализе OR для развития осложнений: 2,24 для класса II и 6,48 для класса III по сравнению с классом I.",
    indicationsTitle: "Классификация Killip:",
    indications: [
      "Класс I — Нет признаков СН. Хрипов нет, III тон не выслушивается. PaO₂ норма. Госпитальная летальность: ~6% (1967) → ~10% (совр.)",
      "Класс II — Лёгкая/умеренная СН. Хрипы < 50% полей, III тон, венозная гипертензия. PaO₂ умеренно снижено. Летальность: ~17% → ~8,7%",
      "Класс III — Тяжёлая СН. Острый отёк лёгких: хрипы > 50% полей. PaO₂ патологически снижено. Летальность: ~38% → ~92,6%",
      "Класс IV — Кардиогенный шок: АД сист. < 90, тахикардия, нарушение сознания, похолодание кожи, олигурия. Летальность: ~67% → ~100%"
    ],
    warnings: [
      "Класс Killip в шкале GRACE: I — 0 баллов, II — 20, III — 39, IV — 59 баллов",
      "Ключевые предикторы высокой летальности: пожилой возраст, тахикардия, гипотония (АД сист. < 100), Killip > I, передняя локализация ИМ, повышение креатинина, предшествующая СН, поражение периферических артерий",
      "Сравнение с другими классификациями: Killip — острый ИМ; NYHA — хроническая СН; Forrester — ОИМ в ОРИТ при инвазивном мониторинге; Холодный/тёплый + Влажный/сухой — острая декомпенсированная СН; SCAI (A–E) — кардиогенный шок",
      "Ограничения: субъективность аускультации, не учитывает ЭхоКГ и биомаркеры, разработана до эпохи ЧКВ, не охватывает правожелудочковую недостаточность и механические осложнения ОИМ"
    ]
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-killip-state";
  var state = { selectedSigns: [] };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && Array.isArray(saved.selectedSigns)) {
      state.selectedSigns = saved.selectedSigns;
    }
  }

  // ===== ОПРЕДЕЛЕНИЕ КЛАССА =====
  function determineClass() {
    if (state.selectedSigns.length === 0) return null;
    
    var classOrder = { "I": 1, "II": 2, "III": 3, "IV": 4 };
    var maxClass = "I";
    
    for (var i = 0; i < state.selectedSigns.length; i++) {
      var signId = state.selectedSigns[i];
      var sign = SIGNS.find(function (s) { return s.id === signId; });
      if (sign && classOrder[sign.class] > classOrder[maxClass]) {
        maxClass = sign.class;
      }
    }
    
    return maxClass;
  }

  function getCategoryColor() {
    var cls = determineClass();
    if (!cls) return "#1f6e9c";
    var c = CLASSES[cls];
    if (c.color === "gcs-15") return "#1a7a3e";
    if (c.color === "gcs-11-12") return "#b08900";
    if (c.color === "gcs-8-10") return "#d2401e";
    if (c.color === "gcs-3") return "#b42323";
    return "#1f6e9c";
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderGroups() {
    var color = getCategoryColor();
    var cls = determineClass();
    var scoreDisplay = cls || "—";

    var itemsHtml = SIGNS.map(function (sign) {
      var isChecked = state.selectedSigns.indexOf(sign.id) !== -1;
      return '<div class="geneva-item geneva-checkbox-item' + (isChecked ? " checked" : "") + '" data-sign="' + sign.id + '" role="checkbox" aria-checked="' + isChecked + '" tabindex="0">' +
        '<span class="geneva-checkbox-custom"></span>' +
        '<span class="geneva-item-content">' +
          '<span class="geneva-item-title">' + CU.escapeHtml(sign.text) + '</span>' +
        '</span>' +
      '</div>';
    }).join("");

    bodyEl.innerHTML =
      '<div class="geneva-category" style="--cat-color: ' + color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">🫀</span>' +
            '<span class="geneva-category-title">Клинические признаки</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + scoreDisplay + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>';
  }

  function renderResult() {
    var cls = determineClass();

    if (!cls) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "класс",
        color: "incomplete",
        title: "Отметьте клинические признаки",
        description: "Выберите признаки, присутствующие у пациента",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var c = CLASSES[cls];

    CU.renderResultPanel({
      score: cls,
      scoreLabel: "класс",
      color: c.color,
      title: c.title,
      description: "",
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    state.selectedSigns = [];
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("click", function (e) {
      var item = e.target.closest(".geneva-checkbox-item[data-sign]");
      if (!item) return;
      var signId = item.getAttribute("data-sign");
      var idx = state.selectedSigns.indexOf(signId);
      if (idx === -1) {
        state.selectedSigns.push(signId);
      } else {
        state.selectedSigns.splice(idx, 1);
      }
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-checkbox-item[data-sign]");
      if (!item) return;
      e.preventDefault();
      var signId = item.getAttribute("data-sign");
      var idx = state.selectedSigns.indexOf(signId);
      if (idx === -1) {
        state.selectedSigns.push(signId);
      } else {
        state.selectedSigns.splice(idx, 1);
      }
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("killipGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.killip && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.killip });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();