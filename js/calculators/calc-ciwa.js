(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var GROUPS = [
    { id: "nausea",      title: "Тошнота и рвота",                      icon: "🤢", items: [
      {v:0,t:"Нет тошноты"},{v:1,t:"Очень лёгкая"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная"},
      {v:4,t:"Умеренная с позывами на рвоту"},{v:5,t:"Сильная"},{v:6,t:"Сильная с позывами"},{v:7,t:"Постоянная с многократной рвотой"}
    ]},
    { id: "tremor",      title: "Тремор (руки вытянуты, пальцы разведены)", icon: "🤲", items: [
      {v:0,t:"Отсутствует"},{v:1,t:"Не заметен, ощущается кончиками пальцев"},{v:2,t:"Очень лёгкий"},{v:3,t:"Лёгкий"},
      {v:4,t:"Умеренный в покое"},{v:5,t:"Умеренный при вытянутых руках"},{v:6,t:"Выраженный"},{v:7,t:"Грубый, размашистый"}
    ]},
    { id: "sweating",    title: "Пароксизмальные поты",                  icon: "💧", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Едва заметны"},{v:2,t:"Лёгкая влажность ладоней"},{v:3,t:"Испарина на лбу"},
      {v:4,t:"Умеренная потливость"},{v:5,t:"Выраженная на лице"},{v:6,t:"Профузный пот"},{v:7,t:"Профузный по всему телу"}
    ]},
    { id: "anxiety",     title: "Тревога",                              icon: "😰", items: [
      {v:0,t:"Отсутствует, спокоен"},{v:1,t:"Очень лёгкая"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная (дискомфорт)"},
      {v:4,t:"Умеренно выраженная"},{v:5,t:"Выраженная"},{v:6,t:"Сильная"},{v:7,t:"Эквивалент панической атаки"}
    ]},
    { id: "agitation",   title: "Ажитация",                             icon: "🏃", items: [
      {v:0,t:"Нормальная активность"},{v:1,t:"Чуть больше обычной"},{v:2,t:"Лёгкое беспокойство"},{v:3,t:"Умеренное беспокойство"},
      {v:4,t:"Умеренно выраженная"},{v:5,t:"Выраженная"},{v:6,t:"Мечется, меняет позу"},{v:7,t:"Пытается встать с кровати"}
    ]},
    { id: "tactile",     title: "Тактильные нарушения",                 icon: "✋", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Очень лёгкий зуд/парестезии"},{v:2,t:"Лёгкий зуд"},{v:3,t:"Умеренный"},
      {v:4,t:"Умеренно выраженный"},{v:5,t:"Выраженные ощущения"},{v:6,t:"Сильные галлюцинации"},{v:7,t:"Постоянные галлюцинации"}
    ]},
    { id: "auditory",    title: "Слуховые нарушения",                   icon: "👂", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Лёгкая раздражительность к звукам"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная"},
      {v:4,t:"Умеренно выраженные галлюцинации"},{v:5,t:"Выраженные"},{v:6,t:"Постоянные"},{v:7,t:"Угрожающие голоса"}
    ]},
    { id: "visual",      title: "Зрительные нарушения",                 icon: "👁️", items: [
      {v:0,t:"Отсутствуют"},{v:1,t:"Лёгкая светобоязнь"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная светобоязнь"},
      {v:4,t:"Умеренные галлюцинации"},{v:5,t:"Выраженные"},{v:6,t:"Постоянные"},{v:7,t:"Угрожающие видения"}
    ]},
    { id: "headache",    title: "Головная боль",                        icon: "🤕", items: [
      {v:0,t:"Отсутствует"},{v:1,t:"Очень лёгкая"},{v:2,t:"Лёгкая"},{v:3,t:"Умеренная"},
      {v:4,t:"Умеренно выраженная"},{v:5,t:"Выраженная"},{v:6,t:"Сильная"},{v:7,t:"Тяжелейшая мигрень"}
    ]},
    { id: "orientation", title: "Ориентация и ясность сознания",        icon: "🧠", items: [
      {v:0,t:"Полностью ориентирован, серийный счёт"},{v:1,t:"Не может серийный счёт, но ориентирован"},
      {v:2,t:"Дезориентирован в дате"},{v:3,t:"Дезориентирован в месте"},{v:4,t:"Дезориентирован в личности"}
    ]}
  ];

  var RANGES = [
    { min: 0,  max: 7,  label: "Лёгкая абстиненция",    color: "gcs-15",    therapy: "Без фармакотерапии. Наблюдение каждые 8 часов.", description: "Психологическая поддержка." },
    { min: 8,  max: 15, label: "Умеренная абстиненция", color: "gcs-11-12", therapy: "Бензодиазепины по потребности",              description: "Мониторинг каждые 4–8 часов." },
    { min: 16, max: 67, label: "Тяжёлая абстиненция",   color: "gcs-3",     therapy: "Интенсивная седация",                        description: "Риск делирия и судорог. Рассмотреть госпитализацию в ОРИТ." }
  ];

  var REFERENCE = {
    title: "О шкале CIWA-Ar",
    paragraphs: [
      "CIWA-Ar — стандартизированный инструмент оценки алкогольной абстиненции (1989). 10 параметров, большинство 0–7 баллов (ориентация и тактильные нарушения 0–4). Максимум 67 баллов.",
      "Позволяет титровать дозы бензодиазепинов и снизить общую дозу седативных на 50–70% по сравнению с фиксированным дозированием. Оценку проводят каждые 4–8 часов до стабильного снижения ниже 8–10."
    ],
    importantNote: "Шкала не заменяет клиническую оценку. При признаках алкогольного делирия (спутанность, галлюцинации, гипертермия) — экстренная терапия независимо от балла."
  };

  var selections = {};
  var groupsEl, panelEl, progressEl, fillEl;

  function total() {
    var sum = 0;
    for (var k in selections) sum += selections[k];
    return sum;
  }
  function filledCount() { return Object.keys(selections).length; }
  function getRange(s) {
    for (var i = 0; i < RANGES.length; i++)
      if (s >= RANGES[i].min && s <= RANGES[i].max) return RANGES[i];
    return RANGES[RANGES.length - 1];
  }

  function renderGroups() {
    groupsEl.innerHTML = GROUPS.map(function (g) {
      var sel = selections[g.id];
      return '<div class="gcs-group">' +
        '<div class="gcs-group-header"><span>' + g.icon + '</span>' +
        '<span class="gcs-group-title">' + g.title + '</span>' +
        '<span class="gcs-group-value' + (sel != null ? ' has-value' : '') + '">' + (sel != null ? sel : '—') + '</span></div>' +
        '<div class="gcs-group-items ciwa-items">' +
        g.items.map(function (it) {
          return '<div class="gcs-radio-item' + (sel === it.v ? ' selected' : '') + '" data-group="' + g.id + '" data-value="' + it.v + '">' +
            '<div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>' +
            '<div class="gcs-radio-content"><div class="gcs-radio-title">' + it.t + '</div></div>' +
            '<div class="gcs-radio-points">' + it.v + '</div></div>';
        }).join("") +
        '</div></div>';
    }).join("");
  }

  function renderResult() {
    var fc = filledCount();
    if (fc < GROUPS.length) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">неполная оценка</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните все 10 параметров</div><div class="result-description">Осталось: ' + (GROUPS.length - fc) + '</div></div>' +
        '</div>';
      return;
    }
    var s = total();
    var r = getRange(s);
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + s + '</div><div class="result-score-label">из 67 баллов</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
        '<div class="result-label">' + r.label + '</div>' +
        '<div class="result-therapy" style="font-weight:700;margin-bottom:4px;">💊 ' + r.therapy + '</div>' +
        '<div class="result-description">' + r.description + '</div>' +
      '</div></div>';
  }

  function updateProgress() {
    var fc = filledCount();
    var percent = Math.round((fc / GROUPS.length) * 100);
    if (progressEl) progressEl.textContent = fc + " / " + GROUPS.length;
    if (fillEl) fillEl.style.width = percent + "%";
  }

  function init() {
    groupsEl = document.getElementById("gcsGroups");
    panelEl = document.getElementById("resultPanel");
    progressEl = document.getElementById("ciwaProgress");
    fillEl = document.getElementById("ciwaFill");
    if (!groupsEl || !panelEl) return;

    renderGroups();
    renderResult();
    updateProgress();

    groupsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".gcs-radio-item");
      if (!item) return;
      var g = item.getAttribute("data-group");
      var v = parseInt(item.getAttribute("data-value"), 10);
      selections[g] = v;
      renderGroups();
      renderResult();
      updateProgress();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();