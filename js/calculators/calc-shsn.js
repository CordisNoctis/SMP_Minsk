(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var PARAMETERS = [
    { id: "dyspnea",      title: "Одышка",                       icon: "🌬️", options: [
      { label: "Нет",            points: 0 },
      { label: "При нагрузке",   points: 1 },
      { label: "В покое",        points: 2 }
    ]},
    { id: "weight",       title: "Изменился ли вес за последнюю неделю", icon: "⚖️", options: [
      { label: "Нет",            points: 0 },
      { label: "Увеличился",     points: 1 }
    ]},
    { id: "palpitations", title: "Перебои в работе сердца",      icon: "💓", options: [
      { label: "Нет",            points: 0 },
      { label: "Есть",           points: 1 }
    ]},
    { id: "position",     title: "Положение в постели",           icon: "🛏️", options: [
      { label: "Горизонтальное", points: 0 },
      { label: "+2 подушки",     points: 1 },
      { label: "Просыпается от удушья", points: 2 },
      { label: "Сидя",           points: 3 }
    ]},
    { id: "jvp",          title: "Набухшие шейные вены",         icon: "🩸", options: [
      { label: "Нет",            points: 0 },
      { label: "Лёжа",           points: 1 },
      { label: "Стоя",           points: 2 }
    ]},
    { id: "rales",        title: "Хрипы в лёгких",                icon: "🫁", options: [
      { label: "Нет",            points: 0 },
      { label: "Нижние отделы 1/3", points: 1 },
      { label: "До лопаток 2/3",    points: 2 },
      { label: "Над всей поверхностью", points: 3 }
    ]},
    { id: "gallop",       title: "Ритм галопа",                   icon: "👂", options: [
      { label: "Нет",            points: 0 },
      { label: "Есть",           points: 1 }
    ]},
    { id: "liver",        title: "Печень",                        icon: "🩺", options: [
      { label: "Не увеличена",   points: 0 },
      { label: "До 5 см",        points: 1 },
      { label: "Более 5 см",     points: 2 }
    ]},
    { id: "edema",        title: "Отёки",                         icon: "💧", options: [
      { label: "Нет",            points: 0 },
      { label: "Пастозность",    points: 1 },
      { label: "Отёки",          points: 2 },
      { label: "Анасарка",       points: 3 }
    ]},
    { id: "sbp",          title: "Уровень САД (мм рт. ст.)",      icon: "📊", options: [
      { label: "> 120",          points: 0 },
      { label: "100–120",        points: 1 },
      { label: "< 100",          points: 2 }
    ]}
  ];

  var RANGES = [
    { min: 0,  max: 0,  label: "Нет признаков СН", fc: "—",  color: "gcs-15",    desc: "Признаки сердечной недостаточности отсутствуют." },
    { min: 1,  max: 3,  label: "I ФК СН",           fc: "I",  color: "gcs-14",    desc: "Физическая активность не ограничена существенно." },
    { min: 4,  max: 6,  label: "II ФК СН",          fc: "II", color: "gcs-11-12", desc: "Лёгкое ограничение физической активности." },
    { min: 7,  max: 8,  label: "III ФК СН",         fc: "III", color: "gcs-8-10", desc: "Значительное ограничение физической активности." },
    { min: 9,  max: 20, label: "IV ФК СН",          fc: "IV", color: "gcs-3",     desc: "Терминальная стадия. Максимум 20 баллов." }
  ];

  var REFERENCE = {
    title: "О шкале ШСХН (Матвеева)",
    paragraphs: [
      "Шкала оценки клинического состояния при ХСН (В.Ю. Матвеев, 2000). 10 параметров по 0–3 балла, максимум 20 баллов. Коррелирует с функциональными классами NYHA, используется для динамического наблюдения за эффективностью терапии."
    ]
  };

  var selections = {}; // {paramId: index}
  var groupsEl, panelEl;

  function total() {
    var sum = 0;
    for (var id in selections) {
      var param = PARAMETERS.find(function (p) { return p.id === id; });
      if (param) sum += param.options[selections[id]].points;
    }
    return sum;
  }

  function getParamPoints(paramId) {
    if (selections[paramId] === undefined) return 0;
    var param = PARAMETERS.find(function (p) { return p.id === paramId; });
    return param ? param.options[selections[paramId]].points : 0;
  }

  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return RANGES[RANGES.length - 1];
  }

  function renderGroups() {
    groupsEl.innerHTML = PARAMETERS.map(function (p) {
      var pts = getParamPoints(p.id);
      var hasSel = selections[p.id] !== undefined;
      var optionsHtml = p.options.map(function (opt, idx) {
        var sel = selections[p.id] === idx ? " selected" : "";
        return '<div class="gcs-radio-item' + sel + '" data-param="' + p.id + '" data-index="' + idx + '">' +
          '<div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>' +
          '<div class="gcs-radio-content"><div class="gcs-radio-title">' + CU.escapeHtml(opt.label) + '</div></div>' +
          '<div class="gcs-radio-points">' + opt.points + '</div></div>';
      }).join("");

      return '<div class="gcs-group">' +
        '<div class="gcs-group-header"><span>' + p.icon + '</span>' +
        '<span class="gcs-group-title">' + p.title + '</span>' +
        '<span class="gcs-group-value' + (hasSel && pts > 0 ? ' has-value' : '') + '" id="value-' + p.id + '">' + (hasSel ? pts : '—') + '</span></div>' +
        '<div class="gcs-group-items">' + optionsHtml + '</div>' +
      '</div>';
    }).join("");
  }

  function renderResult() {
    var s = total();
    var r = getRange(s);
    var answered = Object.keys(selections).length;
    var fcText = r.fc !== "—" ? " · ФК " + r.fc : "";

    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + s + '</div><div class="result-score-label">из 20 (' + answered + '/10)</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info"><div class="result-label">' + r.label + fcText + '</div><div class="result-description">' + r.desc + '</div></div>' +
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
      var paramId = item.getAttribute("data-param");
      var idx = parseInt(item.getAttribute("data-index"), 10);
      selections[paramId] = idx;
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