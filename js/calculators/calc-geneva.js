(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== КАТЕГОРИИ ПАРАМЕТРОВ =====
  var CATEGORIES = [
    {
      id: "risk",
      title: "Предрасполагающие факторы",
      icon: "⚠️",
      color: "#e68a2e",
      items: [
        { id: "age",     title: "Возраст > 65 лет",                             points: 1 },
        { id: "vte",     title: "ВТЭО в анамнезе (тромбоз глубоких вен или ТЭЛА)",               points: 3 },
        { id: "surgery", title: "Хирургическое вмешательство или перелом в течение последнего месяца", points: 2 },
        { id: "cancer",  title: "Онкологическое заболевание в активной фазе",         points: 2 }
      ]
    },
    {
      id: "symptoms",
      title: "Симптомы",
      icon: "💬",
      color: "#1f6e9c",
      items: [
        { id: "calf_pain",  title: "Боль в одной из ног", points: 3 },
        { id: "hemoptysis", title: "Кровохарканье",                points: 2 }
      ]
    },
    {
      id: "signs",
      title: "Клинические признаки",
      icon: "🩺",
      color: "#b42323",
      items: [
        { id: "hr",     title: "Частота сердечных сокращений",  type: "hr", points: 0 },
        { id: "dvt",    title: "Боль при пальпации глубоких вен нижней конечности или отек одной из ног", points: 4 }
      ]
    }
  ];

  // ===== ИНТЕРПРЕТАЦИЯ (revised Geneva Score) =====
  var RANGES = [
    { min: 0, max: 3, label: "Низкая вероятность", color: "success", therapy: "" },
    { min: 4, max: 10, label: "Промежуточная вероятность", color: "warning", therapy: "" },
    { min: 11, max: 99, label: "Высокая вероятность", color: "error", therapy: "" }
  ];

  var REFERENCE = {
    title: "Обновлённая Женевская шкала",
    paragraphs: [
      "Обновлённая Женевская шкала — это клинический инструмент, разработанный для оценки предтестовой вероятности тромбоэмболии лёгочной артерии (ТЭЛА) у пациентов с острым началом одышки, болью в груди или другими симптомами, подозрительными на ТЭЛА. Шкала была создана как объективная альтернатива шкале Уэллса: в ней полностью исключена субъективная оценка врача, что делает её особенно полезной в экстренных отделениях и при многоцентровых протоколах.",
      "Обновлённая версия Женевской шкалы включает девять клинических параметров, каждый из которых имеет строго заданный вес в баллах. Компоненты шкалы охватывают анамнез (возраст, предшествующий ТЭЛА или хирургическое вмешательство), активные заболевания (онкология), клинические симптомы (боль, отёк, кровохарканье) и объективные данные (частота пульса).",
      "После подсчёта суммы баллов применяется одна из двух схем интерпретации — трёхуровневая или двухуровневая. Выбор зависит от клинической ситуации и протокола учреждения. При низкой вероятности по шкале и отрицательном результате D-димера, ТЭЛА может быть безопасно исключена без проведения КТ-ангиографии."
    ]
  };

    var state = {};
  CATEGORIES.forEach(function (cat) {
    cat.items.forEach(function (it) {
      state[it.id] = it.type === "hr" ? null : false;
    });
  });

  var STORAGE_KEY = "smp-calc-geneva-v1";

  function saveState() {
    CU.saveCalcState(STORAGE_KEY, state);
  }

  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    for (var key in saved) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        state[key] = saved[key];
      }
    }
  }

  var bodyEl, panelEl;

  // ===== ПОДСЧЁТ =====
  function categoryScore(catId) {
    var cat = CATEGORIES.find(function (c) { return c.id === catId; });
    if (!cat) return 0;
    var sum = 0;
    cat.items.forEach(function (it) {
      if (it.type === "hr") {
        var v = state[it.id];
        if (v === "mid") sum += 3;
        else if (v === "high") sum += 5;
      } else if (state[it.id]) {
        sum += it.points;
      }
    });
    return sum;
  }

  function total() {
    var sum = 0;
    CATEGORIES.forEach(function (c) { sum += categoryScore(c.id); });
    return sum;
  }

  function rangeFor(sum) {
    for (var i = 0; i < RANGES.length; i++) {
      if (sum >= RANGES[i].min && sum <= RANGES[i].max) return RANGES[i];
    }
    return RANGES[RANGES.length - 1];
  }

  // ===== РЕНДЕР КАТЕГОРИЙ =====
  function renderCategories() {
    bodyEl.innerHTML = CATEGORIES.map(function (cat) {
      var score = categoryScore(cat.id);
      var itemsHtml = cat.items.map(function (it) {
        if (it.type === "hr") {
          var val = state[it.id];
          return '<div class="geneva-item geneva-item-hr">' +
            '<div class="geneva-item-title"><span class="geneva-item-icon">❤️</span>' + CU.escapeHtml(it.title) + '</div>' +
            '<div class="geneva-hr-group">' +
              '<label class="geneva-hr-option' + (val === "low" ? " active" : "") + '">' +
                '<input type="radio" name="hr" value="low"' + (val === "low" ? " checked" : "") + '>' +
                '<span class="hr-label">&lt; 75</span><span class="hr-points">0</span>' +
              '</label>' +
              '<label class="geneva-hr-option' + (val === "mid" ? " active" : "") + '">' +
                '<input type="radio" name="hr" value="mid"' + (val === "mid" ? " checked" : "") + '>' +
                '<span class="hr-label">75–94</span><span class="hr-points">+3</span>' +
              '</label>' +
              '<label class="geneva-hr-option' + (val === "high" ? " active" : "") + '">' +
                '<input type="radio" name="hr" value="high"' + (val === "high" ? " checked" : "") + '>' +
                '<span class="hr-label">≥ 95</span><span class="hr-points">+5</span>' +
              '</label>' +
            '</div>' +
          '</div>';
        } else {
          var checked = state[it.id];
          return '<label class="geneva-item' + (checked ? " checked" : "") + '">' +
            '<input type="checkbox" data-id="' + it.id + '"' + (checked ? " checked" : "") + '>' +
            '<span class="geneva-checkbox-custom"></span>' +
            '<span class="geneva-item-content">' +
              '<span class="geneva-item-title">' + CU.escapeHtml(it.title) + '</span>' +
              '<span class="geneva-item-points">+' + it.points + '</span>' +
            '</span>' +
          '</label>';
        }
      }).join("");

      return '<div class="geneva-category" style="--cat-color: ' + cat.color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">' + cat.icon + '</span>' +
            '<span class="geneva-category-title">' + cat.title + '</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + score + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  // ===== РЕНДЕР РЕЗУЛЬТАТА =====
  function renderResult() {
    var sum = total();
    var r = rangeFor(sum);

    // Используем универсальный рендер: баллы слева, сброс справа, без лишних текстов
    CU.renderResultPanel({
      score: sum,
      scoreLabel: "баллов",
      color: r.color,
      title: r.label,
      description: sum <= 5 ? "ТЭЛА невозможна" : "ТЭЛА возможна",
      extraDescription: "",
      therapy: "",              // Убрана терапия
      onReset: resetAll
    });
  }

  // ===== СБРОС =====
  function resetAll() {
    CATEGORIES.forEach(function (cat) {
      cat.items.forEach(function (it) {
        state[it.id] = it.type === "hr" ? null : false;
      });
    });
    CU.clearCalcState(STORAGE_KEY);
    fullRender();
  }

  function fullRender() {
    renderCategories();
    renderResult();
    saveState();
  }

  // ===== ОБРАБОТЧИКИ =====
  function bindListeners() {
    bodyEl.addEventListener("change", function (e) {
      var cb = e.target.closest("input[type=checkbox][data-id]");
      if (cb) {
        state[cb.getAttribute("data-id")] = cb.checked;
        fullRender();
        return;
      }
      if (e.target.name === "hr") {
        state.hr = e.target.value;
        fullRender();
      }
    });
    
    // Обработчик сброса теперь автоматически добавляется внутри CU.renderResultPanel
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    fullRender();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();