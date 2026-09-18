(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var GROUPS = [
    { id: "E", title: "Глазные реакции (E)",    icon: "👁️", items: [
      {v:4,t:"Глаза открыты, слежение и мигание по команде"},
      {v:3,t:"Глаза открыты, но нет слежения"},
      {v:2,t:"Открываются на громкий звук, но слежения нет"},
      {v:1,t:"Открываются на боль, но слежения нет"},
      {v:0,t:"Остаются закрытыми в ответ на боль"}
    ]},
    { id: "M", title: "Двигательные реакции (M)", icon: "🤚", items: [
      {v:4,t:"Выполняет команды (знак «ОК», кулак, знак мира)"},
      {v:3,t:"Локализует боль"},
      {v:2,t:"Сгибательный ответ на боль"},
      {v:1,t:"Разгибательная поза на боль"},
      {v:0,t:"Нет ответа или миоклонический статус"}
    ]},
    { id: "B", title: "Стволовые рефлексы (B)",  icon: "🧠", items: [
      {v:4,t:"Зрачковый и корнеальный рефлексы сохранены"},
      {v:3,t:"Один зрачок расширен и не реагирует на свет"},
      {v:2,t:"Зрачковый или роговичный рефлексы отсутствуют"},
      {v:1,t:"Оба рефлекса отсутствуют"},
      {v:0,t:"Отсутствуют зрачковый, роговичный и кашлевой"}
    ]},
    { id: "R", title: "Дыхательный паттерн (R)", icon: "🌬️", items: [
      {v:4,t:"Не интубирован, регулярное дыхание"},
      {v:3,t:"Не интубирован, дыхание Чейн–Стокса"},
      {v:2,t:"Не интубирован, нерегулярное дыхание"},
      {v:1,t:"Сопротивляется аппарату ИВЛ"},
      {v:0,t:"Синхронен с ИВЛ или апноэ"}
    ]}
  ];

  // ===== Основные градации (7 уровней) =====
  var RANGES = [
    { min: 16, max: 16, label: "Ясное сознание",      color: "gcs-15" },
    { min: 15, max: 15, label: "Умеренное оглушение", color: "gcs-14" },
    { min: 13, max: 14, label: "Глубокое оглушение",  color: "gcs-11-12" },
    { min: 9,  max: 12, label: "Сопор",               color: "gcs-8-10" },
    { min: 7,  max: 8,  label: "Кома I",              color: "gcs-6-7" },
    { min: 1,  max: 6,  label: "Кома II",             color: "gcs-4-5" },
    { min: 0,  max: 0,  label: "Кома III",            color: "gcs-3" }
  ];

  // ===== Дополнительная тактика (вторая строка) =====
  function getExtra(sum) {
    if (sum === 16) return "Полностью ориентирован. Наблюдение.";
    if (sum >= 13 && sum <= 15) return "Умеренное нарушение сознания. Обследование, контроль динамики.";
    if (sum >= 9 && sum <= 12) return "Глубокое нарушение. Контроль проходимости дыхательных путей.";
    if (sum >= 1 && sum <= 8) return "Обеспечение проходимости ДП / интубация, ИВЛ.";
    return "";
  }

  var REFERENCE = {
    title: "О шкале FOUR",
    paragraphs: [
      "Шкала FOUR (Full Outline of UnResponsiveness) разработана в Mayo Clinic (2005). Позволяет точнее детализировать неврологический статус, распознать синдром запертого человека, оценить рефлексы ствола мозга.",
      "Применима у детей и взрослых. Максимум 16 баллов, минимум 0. Особенно полезна при интубации, когда вербальная оценка по ШКГ невозможна."
    ],
    importantNote: "FOUR — дополнение к ШКГ, а не замена. Используйте обе шкалы для полноты картины.",
    indicationsTitle: "Преимущества FOUR перед шкалой Глазго:",
    indications: [
      "Оценивает стволовые рефлексы — критически важно при подозрении на смерть мозга",
      "Не зависит от вербального ответа — можно использовать у интубированных пациентов",
      "Оценивает паттерн дыхания — помогает в диагностике стволовых нарушений",
      "0 баллов по стволовым рефлексам + апноэ = терминальное состояние"
    ]
  };

  var selections = { E: null, M: null, B: null, R: null };
  var groupsEl, panelEl;

  function total() {
    var vals = [selections.E, selections.M, selections.B, selections.R];
    if (vals.some(function (v) { return v === null; })) return null;
    return vals.reduce(function (s, v) { return s + v; }, 0);
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return null;
  }

  function renderGroups() {
    // Цвета групп как в Глазго
    var colors = { E: "#1f6e9c", M: "#e68a2e", B: "#8b5cf6", R: "#b42323" };
    
    groupsEl.innerHTML = GROUPS.map(function (g) {
      var sel = selections[g.id];
      var color = colors[g.id];
      
      var itemsHtml = g.items.map(function (it) {
        var isChecked = sel === it.v;
        return '<div class="geneva-item geneva-radio-item' + (isChecked ? " checked" : "") + '" data-group="' + g.id + '" data-value="' + it.v + '" role="radio" aria-checked="' + isChecked + '" tabindex="0">' +
          '<span class="geneva-radio-custom"></span>' +
          '<span class="geneva-item-content">' +
            '<span class="geneva-item-title">' + it.t + '</span>' +
            '<span class="geneva-item-points">' + it.v + '</span>' +
          '</span>' +
        '</div>';
      }).join("");

      return '<div class="geneva-category" style="--cat-color: ' + color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">' + g.icon + '</span>' +
            '<span class="geneva-category-title">' + g.title + '</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + (sel !== null ? sel : "Х") + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  // ===== Плашка результата через CU.renderResultPanel (как у Глазго) =====
  function renderResult() {
    var sum = total();
    var filledCount = (selections.E !== null ? 1 : 0) +
                      (selections.M !== null ? 1 : 0) +
                      (selections.B !== null ? 1 : 0) +
                      (selections.R !== null ? 1 : 0);

    // Не показывать подсчёт, пока не заполнены все 4 группы
    if (sum === null) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 16 баллов",
        color: "incomplete",
        title: "Оцените все параметры",
        description: "Заполнено: " + filledCount + " из 4",
        extraDescription: "",
        onReset: resetAll
      });
      return;
    }

    var r = getRange(sum);
    if (!r) return;

    CU.renderResultPanel({
      score: sum,
      scoreLabel: "из 16 баллов",
      color: r.color,
      title: r.label,
      description: "",
      extraDescription: getExtra(sum),
      onReset: resetAll
    });
  }

  function resetAll() {
    selections = { E: null, M: null, B: null, R: null };
    renderGroups();
    renderResult();
  }

  function init() {
    groupsEl = document.getElementById("gcsGroups");
    panelEl = document.getElementById("resultPanel");
    if (!groupsEl || !panelEl) return;

    renderGroups();
    renderResult();

    groupsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".geneva-radio-item");
      if (!item) return;
      selections[item.getAttribute("data-group")] = parseInt(item.getAttribute("data-value"), 10);
      renderGroups();
      renderResult();
    });

    // Поддержка клавиатуры (Enter / Space)
    groupsEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item");
      if (!item) return;
      e.preventDefault();
      selections[item.getAttribute("data-group")] = parseInt(item.getAttribute("data-value"), 10);
      renderGroups();
      renderResult();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  CU.autoPersist("smp-calc-four-v1");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();