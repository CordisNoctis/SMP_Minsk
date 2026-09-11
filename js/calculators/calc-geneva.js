(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var ITEMS = [
    { id: "age",         title: "Возраст >65 лет", points: 1 },
    { id: "dvt_history", title: "ТГВ или ТЭЛА в анамнезе", points: 3 },
    { id: "surgery",     title: "Операция/перелом нижних конечностей ≤1 мес назад", points: 2 },
    { id: "cancer",      title: "Злокачественное новообразование (активное или ≤1 года)", points: 2 },
    { id: "hemoptysis",  title: "Кровохарканье", points: 2 },
    { id: "leg_pain",    title: "Односторонняя боль в нижней конечности", points: 3 },
    { id: "hr_75_94",    title: "ЧСС 75–94 уд/мин", points: 3, group: "hr" },
    { id: "hr_95_plus",  title: "ЧСС ≥95 уд/мин", points: 5, group: "hr" },
    { id: "dvt_signs",   title: "Односторонний отёк и болезненность по ходу глубоких вен", points: 4 }
  ];

  var RANGES = [
    { min: 0, max: 3,   label: "Низкая вероятность",          color: "success", description: "Определить D-димер. При отрицательном результате — ТЭЛА маловероятна." },
    { min: 4, max: 10,  label: "Промежуточная вероятность",   color: "warning", description: "Определить D-димер. При повышенном уровне — КТ-ангиография лёгочных артерий." },
    { min: 11, max: 999, label: "Высокая вероятность",         color: "error",   description: "Немедленная КТ-ангиография лёгочных артерий без предварительного определения D-димера." }
  ];

  var REFERENCE = {
    title: "Обновлённая Женевская шкала",
    paragraphs: [
      "Обновлённая Женевская шкала — объективный инструмент оценки предтестовой вероятности ТЭЛА. В отличие от шкалы Уэллса, полностью исключает субъективную оценку врача.",
      "Шкала включает 9 клинических параметров. После подсчёта суммы применяется трёхуровневая интерпретация. При низкой вероятности и отрицательном D-димере ТЭЛА может быть безопасно исключена без КТ."
    ],
    importantNote: "При высокой клинической настороженности (одышка + факторы риска) не откладывайте КТ-ангиографию вне зависимости от балла.",
    legalReference: "Протокол диагностики и лечения ТЭЛА, МЗ РБ"
  };

  var checked = {};
  var itemsEl, panelEl;

  function total() {
    var sum = 0;
    for (var id in checked) if (checked[id]) {
      var it = ITEMS.find(function (i) { return i.id === id; });
      if (it) sum += it.points;
    }
    return sum;
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return RANGES[RANGES.length - 1];
  }

  function renderItems() {
    itemsEl.innerHTML = ITEMS.map(function (it) {
      var cls = checked[it.id] ? " checked" : "";
      var grp = it.group ? ' data-group="' + it.group + '"' : "";
      return '<div class="calc-item' + cls + '" data-id="' + it.id + '"' + grp + '>' +
        '<div class="calc-item-checkbox"><span class="check-icon">✓</span></div>' +
        '<div class="calc-item-content"><div class="calc-item-title">' + CU.escapeHtml(it.title) + '</div></div>' +
        '<div class="calc-item-points">+' + it.points + '</div></div>';
    }).join("");
  }

  function renderResult() {
    var sum = total();
    var r = getRange(sum);
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + sum + '</div><div class="result-score-label">' + CU.pluralizePoints(sum) + '</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + r.label + '</div><div class="result-description">' + r.description + '</div></div>' +
      '</div>';
  }

  function init() {
    itemsEl = document.getElementById("calcItems");
    panelEl = document.getElementById("resultPanel");
    if (!itemsEl || !panelEl) return;

    renderItems();
    renderResult();

    itemsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".calc-item");
      if (!item) return;
      var id = item.getAttribute("data-id");
      var group = item.getAttribute("data-group");

      // Если группа — снять выбор с других в группе
      if (group) {
        document.querySelectorAll('.calc-item[data-group="' + group + '"]').forEach(function (other) {
          var oid = other.getAttribute("data-id");
          if (oid !== id && checked[oid]) {
            checked[oid] = false;
          }
        });
      }

      checked[id] = !checked[id];
      renderItems();
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