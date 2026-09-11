(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var CLASSES = [
    {
      id: "I", title: "Класс I — Нет признаков СН",
      mortality: "6%", mortalityModern: "2–3%", color: "gcs-15",
      description: "Отсутствие клинических признаков застойной сердечной недостаточности.",
      signs: [
        "Лёгкие чистые, хрипы не выслушиваются",
        "Нет набухания шейных вен",
        "Нет периферических отёков",
        "Отсутствие III тона (ритма галопа)",
        "САД ≥ 100 мм рт. ст."
      ],
      management: [
        "Стандартная терапия ОИМ",
        "Мониторинг витальных функций",
        "Ранняя реперфузия (ЧКВ/тромболизис)",
        "Наблюдение в ОРИТ/кардиоблоке"
      ]
    },
    {
      id: "II", title: "Класс II — Лёгкая-умеренная СН",
      mortality: "17%", mortalityModern: "5–8%", color: "gcs-11-12",
      description: "Признаки застоя в малом круге кровообращения без отёка лёгких.",
      signs: [
        "Влажные хрипы в нижних отделах (до 1/2 полей)",
        "Набухание шейных вен",
        "III тон сердца (ритм галопа)",
        "Может быть тахикардия",
        "САД ≥ 100 мм рт. ст."
      ],
      management: [
        "Диуретики (фуросемид в/в)",
        "Нитраты (при отсутствии гипотензии)",
        "Кислородотерапия",
        "Мониторинг диуреза и SpO₂",
        "Экстренная реперфузия"
      ]
    },
    {
      id: "III", title: "Класс III — Отёк лёгких",
      mortality: "38%", mortalityModern: "10–15%", color: "gcs-8-10",
      description: "Острый отёк лёгких с выраженной дыхательной недостаточностью.",
      signs: [
        "Влажные хрипы над всей поверхностью лёгких",
        "Выраженная одышка, ортопноэ",
        "Пенистая мокрота (может быть розовая)",
        "Цианоз, акроцианоз",
        "Тахикардия, тахипноэ",
        "SpO₂ < 90% на воздухе"
      ],
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
    {
      id: "IV", title: "Класс IV — Кардиогенный шок",
      mortality: "81%", mortalityModern: "40–50%", color: "gcs-3",
      description: "Кардиогенный шок с гипоперфузией органов и тканей.",
      signs: [
        "САД < 90 мм рт. ст. (или падение на ≥30)",
        "Олигурия (<20 мл/ч), спутанность сознания",
        "Холодные конечности, мраморность",
        "Может сочетаться с отёком лёгких",
        "Индекс шока Альговера > 1.0",
        "СИ < 2.2 л/мин/м² (при мониторинге)"
      ],
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
  ];

  var REFERENCE = {
    title: "О классификации Killip",
    paragraphs: [
      "Классификация Killip (1967) стратифицирует риск у пациентов с ОИМ по клиническим признакам СН. Классы взаимоисключающие: пациент относится только к одному классу на момент оценки.",
      "Историческая 30-дневная летальность (Killip и Kimball, 1967): I — 6%, II — 17%, III — 38%, IV — 81%. В современной практике с тромболизисом и ЧКВ летальность значительно ниже."
    ],
    importantNote: "Killip применяется преимущественно при ОИМ. Для хронической СН используйте NYHA или шкалу Матвеева (ШСХН).",
    legalReference: null
  };

  var selected = null;
  var classesEl, panelEl;

  function renderClasses() {
    classesEl.innerHTML = CLASSES.map(function (c) {
      var sel = selected === c.id ? " selected" : "";
      return '<div class="killip-class' + sel + '" data-class="' + c.id + '">' +
        '<div class="killip-class-header">' +
          '<div class="killip-class-badge ' + c.color + '">' + c.id + '</div>' +
          '<div class="killip-class-title">' + CU.escapeHtml(c.title) + '</div>' +
        '</div>' +
        '<div class="killip-class-description">' + CU.escapeHtml(c.description) + '</div>' +
        '<div class="killip-section">' +
          '<div class="killip-section-title">🩺 Клинические признаки</div>' +
          '<ul class="killip-list">' + c.signs.map(function (s) { return '<li>' + CU.escapeHtml(s) + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        '<div class="killip-section">' +
          '<div class="killip-section-title">🏥 Тактика лечения</div>' +
          '<ul class="killip-list killip-list-management">' + c.management.map(function (m) { return '<li>' + CU.escapeHtml(m) + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        '<div class="killip-mortality">' +
          '<div class="killip-mortality-item"><div class="killip-mortality-label">Историческая</div><div class="killip-mortality-value">' + c.mortality + '</div></div>' +
          '<div class="killip-mortality-item"><div class="killip-mortality-label">Современная</div><div class="killip-mortality-value">' + c.mortalityModern + '</div></div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderResult() {
    if (!selected) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">не выбрано</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Выберите класс Killip</div><div class="result-description">Нажмите на карточку, соответствующую состоянию пациента</div></div>' +
        '</div>';
      return;
    }
    var c = CLASSES.find(function (x) { return x.id === selected; });
    panelEl.innerHTML =
      '<div class="result-content result-' + c.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + c.id + '</div><div class="result-score-label">класс</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
        '<div class="result-label">' + c.title + '</div>' +
        '<div class="result-description">' + c.description +
          '<div style="margin-top:6px;font-weight:600;">Летальность: ' + c.mortality + ' (истор.) → ' + c.mortalityModern + ' (совр.)</div>' +
        '</div>' +
      '</div></div>';
  }

  function init() {
    classesEl = document.getElementById("killipClasses");
    panelEl = document.getElementById("resultPanel");
    if (!classesEl || !panelEl) return;

    renderClasses();
    renderResult();

    classesEl.addEventListener("click", function (e) {
      var card = e.target.closest(".killip-class");
      if (!card) return;
      var id = card.getAttribute("data-class");
      selected = (selected === id) ? null : id;
      renderClasses();
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