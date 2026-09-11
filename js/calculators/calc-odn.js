(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var GROUPS = [
    {
      id: "clinical", title: "Клинические признаки", icon: "🩺",
      items: [
        { id: "dyspnea", title: "Одышка", type: "radio", options: [
          { v: 0, t: "Нет", p: 0 },
          { v: 1, t: "При нагрузке", p: 1 },
          { v: 2, t: "В покое", p: 2 },
          { v: 3, t: "Выраженная, не может говорить", p: 3 }
        ]},
        { id: "accessory", title: "Вспомогательная мускулатура", type: "radio", options: [
          { v: 0, t: "Не участвует", p: 0 },
          { v: 1, t: "Умеренное участие", p: 1 },
          { v: 2, t: "Выраженное участие", p: 2 },
          { v: 3, t: "Парадоксальное дыхание", p: 3 }
        ]},
        { id: "cyanosis", title: "Цианоз", type: "radio", options: [
          { v: 0, t: "Нет", p: 0 },
          { v: 1, t: "Акроцианоз", p: 1 },
          { v: 2, t: "Диффузный цианоз", p: 2 }
        ]},
        { id: "consciousness", title: "Сознание", type: "radio", options: [
          { v: 0, t: "Ясное", p: 0 },
          { v: 1, t: "Возбуждение/тревога", p: 1 },
          { v: 2, t: "Спутанность/сонливость", p: 2 },
          { v: 3, t: "Кома", p: 3 }
        ]}
      ]
    },
    {
      id: "vitals", title: "Витальные показатели", icon: "📊",
      items: [
        { id: "rr", title: "Частота дыхания (ЧД)", type: "number", unit: "/мин", min: 5, max: 60, ranges: [
          { min: 0,  max: 12, label: "Брадикапноэ",        p: 2, color: "warning" },
          { min: 12, max: 20, label: "Норма",              p: 0, color: "success" },
          { min: 20, max: 30, label: "Тахипноэ",           p: 1, color: "warning" },
          { min: 30, max: 40, label: "Выраженное тахипноэ", p: 2, color: "error" },
          { min: 40, max: 100, label: "Критическое",        p: 3, color: "error" }
        ]},
        { id: "hr", title: "Частота сердечных сокращений (ЧСС)", type: "number", unit: "уд/мин", min: 30, max: 250, ranges: [
          { min: 0,   max: 60,  label: "Брадикардия",           p: 1, color: "warning" },
          { min: 60,  max: 100, label: "Норма",                 p: 0, color: "success" },
          { min: 100, max: 140, label: "Тахикардия",            p: 1, color: "warning" },
          { min: 140, max: 300, label: "Выраженная тахикардия", p: 2, color: "error" }
        ]},
        { id: "spo2", title: "Сатурация кислорода (SpO₂)", type: "number", unit: "%", min: 50, max: 100, ranges: [
          { min: 95, max: 100, label: "Норма",                 p: 0, color: "success" },
          { min: 90, max: 95,  label: "Лёгкая гипоксемия",     p: 1, color: "warning" },
          { min: 85, max: 90,  label: "Умеренная гипоксемия",  p: 2, color: "warning" },
          { min: 50, max: 85,  label: "Тяжёлая гипоксемия",    p: 3, color: "error" }
        ]}
      ]
    },
    {
      id: "bloodgas", title: "Газы артериальной крови", icon: "🩸",
      items: [
        { id: "pao2", title: "PaO₂ (парциальное давление O₂)", type: "number", unit: "мм рт. ст.", min: 20, max: 600, ranges: [
          { min: 80, max: 100, label: "Норма",                p: 0, color: "success" },
          { min: 60, max: 80,  label: "Лёгкая гипоксемия",    p: 1, color: "warning" },
          { min: 40, max: 60,  label: "Умеренная гипоксемия", p: 2, color: "warning" },
          { min: 20, max: 40,  label: "Тяжёлая гипоксемия",   p: 3, color: "error" }
        ]},
        { id: "paco2", title: "PaCO₂ (парциальное давление CO₂)", type: "number", unit: "мм рт. ст.", min: 10, max: 120, ranges: [
          { min: 35, max: 45, label: "Норма",                     p: 0, color: "success" },
          { min: 25, max: 35, label: "Гипокапния",                p: 1, color: "warning" },
          { min: 45, max: 60, label: "Умеренная гиперкапния",     p: 1, color: "warning" },
          { min: 60, max: 80, label: "Выраженная гиперкапния",    p: 2, color: "error" },
          { min: 80, max: 200, label: "Критическая гиперкапния",  p: 3, color: "error" }
        ]},
        { id: "fio2", title: "FiO₂ (фракция кислорода во вдыхаемом воздухе)", type: "number", unit: "%", min: 21, max: 100, hint: "21% — воздух, 100% — чистый O₂", noPoints: true }
      ]
    }
  ];

  var SEVERITY = [
    { min: 0,  max: 3,   label: "Нет ОДН / Лёгкая",  color: "success",  desc: "Компенсированное состояние.",                          action: "👀 Наблюдение, мониторинг SpO₂" },
    { min: 4,  max: 7,   label: "Умеренная ОДН",      color: "warning",  desc: "Субкомпенсация. Требуется кислородотерапия.",          action: "🫁 O₂ через маску/назальные канюли, контроль газов крови" },
    { min: 8,  max: 11,  label: "Тяжёлая ОДН",        color: "error",    desc: "Декомпенсация. Показана респираторная поддержка.",      action: "😷 NIV/CPAP, подготовка к интубации, ОРИТ" },
    { min: 12, max: 100, label: "Критическая ОДН / ARDS", color: "critical", desc: "Угрожающее жизни состояние. Необходима ИВЛ.",      action: "🚨 Экстренная интубация, ИВЛ, ОРИТ" }
  ];

  var REQUIRED = ["dyspnea", "accessory", "cyanosis", "consciousness", "rr", "hr", "spo2"];
  var LABELS = {
    dyspnea: "одышка", accessory: "вспом. мускулатура", cyanosis: "цианоз", consciousness: "сознание",
    rr: "ЧД", hr: "ЧСС", spo2: "SpO₂", pao2: "PaO₂", paco2: "PaCO₂", fio2: "FiO₂"
  };

  var REFERENCE = {
    title: "Об оценке ОДН",
    paragraphs: [
      "Острая дыхательная недостаточность (ОДН) — синдром, при котором система дыхания не может обеспечить адекватный газообмен.",
      "Оценка включает клинические признаки, частоту дыхания и ЧСС, сатурацию и газы крови. Индекс Horowitz (PaO₂/FiO₂) — ключевой показатель: >300 — норма, 200–300 — лёгкая ОДН/ALI, <200 — тяжёлая ОДН/ARDS."
    ],
    importantNote: "Критерии ARDS (Berlin Definition 2012): острое начало, PaO₂/FiO₂ ≤ 300 при PEEP ≥ 5 см H₂O, двусторонние инфильтраты на КТ/рентгене, отсутствие признаков сердечной недостаточности."
  };

  var selections = {};
  var groupsEl, panelEl;

  function total() {
    var sum = 0;
    GROUPS.forEach(function (g) {
      g.items.forEach(function (it) {
        if (it.type === "radio" && selections[it.id] !== undefined) {
          var opt = it.options.find(function (o) { return o.v === selections[it.id]; });
          if (opt) sum += opt.p;
        } else if (it.type === "number" && selections[it.id] !== null && !it.noPoints) {
          var r = it.ranges.find(function (r) { return selections[it.id] >= r.min && selections[it.id] < r.max; });
          if (r) sum += r.p;
        }
      });
    });
    return sum;
  }

  function isAllFilled() {
    return REQUIRED.every(function (k) { return selections[k] !== null && selections[k] !== undefined; });
  }

  function getMissing() {
    return REQUIRED.filter(function (k) { return selections[k] === null || selections[k] === undefined; })
      .map(function (k) { return LABELS[k]; });
  }

  function horowitz() {
    if (selections.pao2 != null && selections.fio2 != null && selections.fio2 > 0) {
      return Math.round(selections.pao2 / (selections.fio2 / 100));
    }
    return null;
  }

  function horowitzStatus(idx) {
    if (idx > 300) return "Норма";
    if (idx > 200) return "ALI / Лёгкий ARDS";
    if (idx > 100) return "Умеренный ARDS";
    return "Тяжёлый ARDS";
  }

  function getSeverity(s) {
    for (var i = 0; i < SEVERITY.length; i++)
      if (s >= SEVERITY[i].min && s <= SEVERITY[i].max) return SEVERITY[i];
    return SEVERITY[SEVERITY.length - 1];
  }

  function groupTotal(groupId) {
    var g = GROUPS.find(function (x) { return x.id === groupId; });
    if (!g) return 0;
    var sum = 0;
    g.items.forEach(function (it) {
      if (it.type === "radio" && selections[it.id] !== undefined) {
        var opt = it.options.find(function (o) { return o.v === selections[it.id]; });
        if (opt) sum += opt.p;
      } else if (it.type === "number" && selections[it.id] !== null && !it.noPoints) {
        var r = it.ranges.find(function (r) { return selections[it.id] >= r.min && selections[it.id] < r.max; });
        if (r) sum += r.p;
      }
    });
    return sum;
  }

  function groupHasValue(groupId) {
    var g = GROUPS.find(function (x) { return x.id === groupId; });
    if (!g) return false;
    return g.items.some(function (it) {
      return selections[it.id] !== null && selections[it.id] !== undefined;
    });
  }

  function renderGroups() {
    groupsEl.innerHTML = GROUPS.map(function (g) {
      var sum = groupTotal(g.id);
      var hasVal = groupHasValue(g.id);
      var valueText = hasVal ? sum : "—";

      var itemsHtml = g.items.map(function (it) {
        if (it.type === "radio") {
          var opts = it.options.map(function (o) {
            var sel = selections[it.id] === o.v ? " selected" : "";
            return '<div class="odn-radio-item' + sel + '" data-item="' + it.id + '" data-value="' + o.v + '">' +
              '<div class="odn-radio-circle"><div class="odn-radio-dot"></div></div>' +
              '<div class="odn-radio-content"><div class="odn-radio-title">' + CU.escapeHtml(o.t) + '</div></div>' +
              '<div class="odn-radio-points">' + o.p + '</div></div>';
          }).join("");
          return '<div class="odn-radio-group"><div class="odn-radio-label">' + CU.escapeHtml(it.title) + '</div><div class="odn-radio-options">' + opts + '</div></div>';
        } else {
          var val = selections[it.id] !== null && selections[it.id] !== undefined ? selections[it.id] : "";
          var status = "";
          if (!it.noPoints && val !== "") {
            var r = it.ranges.find(function (r) { return val >= r.min && val < r.max; });
            if (r) status = '<span class="odn-status-badge status-' + r.color + '">' + r.label + '</span>';
          }
          var hint = it.hint ? '<div class="odn-number-hint">' + CU.escapeHtml(it.hint) + '</div>' : "";
          return '<div class="odn-number-item">' +
            '<div class="odn-number-label">' + CU.escapeHtml(it.title) + '</div>' +
            '<div class="odn-number-input-row">' +
              '<input type="text" class="odn-number-field" data-item="' + it.id + '" inputmode="decimal" placeholder="—" value="' + val + '">' +
              '<span class="odn-number-unit">' + it.unit + '</span>' +
            '</div>' + hint +
            '<div class="odn-number-status">' + status + '</div>' +
          '</div>';
        }
      }).join("");

      return '<div class="odn-group">' +
        '<div class="odn-group-header"><span>' + g.icon + '</span>' +
        '<span class="odn-group-title">' + g.title + '</span>' +
        '<span class="odn-group-value' + (hasVal ? ' has-value' : '') + '" id="value-' + g.id + '">' + valueText + '</span></div>' +
        '<div class="odn-group-items">' + itemsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  function renderResult() {
    if (!isAllFilled()) {
      var m = getMissing();
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">неполная оценка</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните обязательные параметры</div><div class="result-description">Осталось: ' + m.join(", ") + '</div></div>' +
        '</div>';
      return;
    }

    var s = total();
    var sv = getSeverity(s);
    var h = horowitz();
    var horowitzHtml = "";
    if (h !== null) {
      horowitzHtml =
        '<div class="odn-horowitz">' +
          '<div class="odn-horowitz-value">' + h + '</div>' +
          '<div class="odn-horowitz-label">PaO₂/FiO₂</div>' +
          '<div class="odn-horowitz-status">' + horowitzStatus(h) + '</div>' +
        '</div>';
    }

    panelEl.innerHTML =
      '<div class="result-content result-' + sv.color + ' odn-result">' +
      '<div class="odn-result-main">' +
        '<div class="odn-result-score"><div class="odn-result-score-value">' + s + '</div><div class="odn-result-score-label">баллов</div></div>' +
        horowitzHtml +
      '</div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
        '<div class="result-label">' + sv.label + '</div>' +
        '<div class="result-description">' + sv.desc + '</div>' +
        '<div class="result-action">' + sv.action + '</div>' +
      '</div></div>';
  }

  function init() {
    groupsEl = document.getElementById("odnGroups");
    panelEl = document.getElementById("resultPanel");
    if (!groupsEl || !panelEl) return;

    renderGroups();
    renderResult();

    groupsEl.addEventListener("click", function (e) {
      var radio = e.target.closest(".odn-radio-item");
      if (radio) {
        var itemId = radio.getAttribute("data-item");
        var v = parseInt(radio.getAttribute("data-value"), 10);
        selections[itemId] = v;
        renderGroups();
        renderResult();
      }
    });

    groupsEl.addEventListener("input", function (e) {
      var input = e.target.closest(".odn-number-field");
      if (!input) return;
      var itemId = input.getAttribute("data-item");
      var v = parseNum(input.value);

      // Найти item
      var item = null;
      GROUPS.forEach(function (g) {
        g.items.forEach(function (i) { if (i.id === itemId) item = i; });
      });
      if (!item) return;

      if (v === null || input.value.trim() === "") {
        selections[itemId] = null;
      } else {
        if (v < item.min) v = item.min;
        if (v > item.max) v = item.max;
        selections[itemId] = v;
      }
      renderGroups();
      renderResult();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();