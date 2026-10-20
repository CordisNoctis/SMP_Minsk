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
        { id: "age",     title: "Возраст > 65 лет", points: 1 },
        { id: "vte",     title: "ВТЭО в анамнезе (ТГВ или ТЭЛА)", points: 3 },
        { id: "surgery", title: "Хирургия или перелом за последний месяц", points: 2 },
        { id: "cancer",  title: "Онкологическое заболевание в активной фазе", points: 2 }
      ]
    },
    {
      id: "symptoms",
      title: "Симптомы",
      icon: "💬",
      color: "#1f6e9c",
      items: [
        { id: "calf_pain",  title: "Боль в одной из ног", points: 3 },
        { id: "hemoptysis", title: "Кровохарканье", points: 2 }
      ]
    },
    {
      id: "signs",
      title: "Клинические признаки",
      icon: "🩺",
      color: "#b42323",
      items: [
        { id: "hr",     title: "Частота сердечных сокращений", type: "hr", points: 0 },
        { id: "dvt",    title: "Боль при пальпации глубоких вен или отёк одной ноги", points: 4 }
      ]
    }
  ];

  // ===== ИНТЕРПРЕТАЦИЯ =====
  var RANGES = [
    { min: 0, max: 3, label: "Низкая вероятность", color: "gcs-15" },
    { min: 4, max: 10, label: "Промежуточная вероятность", color: "gcs-11-12" },
    { min: 11, max: 99, label: "Высокая вероятность", color: "gcs-4-5" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ (резерв) =====
  var REFERENCE = {
    title: "Обновлённая Женевская шкала",
    paragraphs: [
      "Обновлённая Женевская шкала — клинический инструмент для оценки предтестовой вероятности ТЭЛА. Исключает субъективную оценку врача.",
      "Включает 9 параметров: возраст, анамнез ВТЭО, хирургия/перелом, онкология, боль в ноге, кровохарканье, ЧСС, боль/отёк при пальпации."
    ],
    importantNote: "При низкой вероятности и отрицательном D-димере ТЭЛА может быть безопасно исключена без КТ-ангиографии."
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-geneva-state";
  var state = {};
  CATEGORIES.forEach(function (cat) {
    cat.items.forEach(function (it) {
      state[it.id] = it.type === "hr" ? null : false;
    });
  });

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (!saved) return;
    for (var key in saved) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        state[key] = saved[key];
      }
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
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

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderCategories() {
    bodyEl.innerHTML = CATEGORIES.map(function (cat) {
      var score = categoryScore(cat.id);
      var itemsHtml = cat.items.map(function (it) {
        if (it.type === "hr") {
          var val = state[it.id];
          return '<div class="geneva-item geneva-item-hr">' +
            '<div class="geneva-item-title" style="margin-bottom: 8px;"><span class="geneva-item-icon">❤️</span> ' + CU.escapeHtml(it.title) + '</div>' +
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
          return '<label class="geneva-item geneva-checkbox-item' + (checked ? " checked" : "") + '">' +
            '<input type="checkbox" data-id="' + it.id + '"' + (checked ? " checked" : "") + ' style="position:absolute;opacity:0;pointer-events:none;">' +
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

  function renderResult() {
    var sum = total();
    var r = rangeFor(sum);

    CU.renderResultPanel({
      score: sum,
      scoreLabel: "баллов",
      color: r.color,
      title: r.label,
      description: "",
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    CATEGORIES.forEach(function (cat) {
      cat.items.forEach(function (it) {
        state[it.id] = it.type === "hr" ? null : false;
      });
    });
    saveState();
    renderCategories();
    renderResult();
  }

  function fullRender() {
    renderCategories();
    renderResult();
  }

  function bindListeners() {
    bodyEl.addEventListener("change", function (e) {
      var cb = e.target.closest("input[type=checkbox][data-id]");
      if (cb) {
        state[cb.getAttribute("data-id")] = cb.checked;
        saveState();
        fullRender();
        return;
      }
      if (e.target.name === "hr") {
        state.hr = e.target.value;
        saveState();
        fullRender();
      }
    });
  }

  function init() {
    bodyEl = document.getElementById("genevaGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    fullRender();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.geneva && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.geneva });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();