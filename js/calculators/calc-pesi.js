(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var ITEMS = [
    { id: "male",          title: "Мужской пол",                              points: 10 },
    { id: "cancer",        title: "Злокачественное новообразование",           points: 30 },
    { id: "chf",           title: "Хроническая сердечная недостаточность",      points: 10 },
    { id: "copd",          title: "Хроническое заболевание лёгких",           points: 10 },
    { id: "hr",            title: "ЧСС > 110 уд/мин",                          points: 20 },
    { id: "sbp",           title: "САД < 100 мм рт. ст.",                      points: 30 },
    { id: "rr",            title: "ЧДД > 30 в минуту",                          points: 20 },
    { id: "temp",          title: "Температура тела < 36 °C",                  points: 20 },
    { id: "consciousness", title: "Нарушение сознания",                        points: 60 },
    { id: "spo2",          title: "SpO₂ < 90 %",                                points: 20 }
  ];

  var RANGES = [
    { min: 0,   max: 65,  label: "Класс I — Очень низкий риск",    mortality: "0–1.6 %",   description: "Возможно амбулаторное лечение или ранняя выписка.", color: "pesi-1" },
    { min: 66,  max: 85,  label: "Класс II — Низкий риск",         mortality: "1.7–3.5 %", description: "Возможно лечение в стационаре кратковременного пребывания.", color: "pesi-2" },
    { min: 86,  max: 105, label: "Класс III — Умеренный риск",     mortality: "3.2–7.1 %", description: "Требуется госпитализация в стационар.",                color: "pesi-3" },
    { min: 106, max: 125, label: "Класс IV — Высокий риск",        mortality: "4.0–11.4 %", description: "Требуется лечение в специализированном отделении.",    color: "pesi-4" },
    { min: 126, max: 999, label: "Класс V — Очень высокий риск",   mortality: "10–24.5 %", description: "Показано лечение в ОРИТ.",                              color: "pesi-5" }
  ];

  var REFERENCE = {
    title: "О шкале PESI",
    paragraphs: [
      "PESI (Pulmonary Embolism Severity Index) — 11 параметров для прогнозирования 30-дневной летальности при подтверждённой ТЭЛА. 5 классов риска (I–V).",
      "Пациенты классов I–II могут быть кандидатами для амбулаторного лечения при наличии условий. Классы III–V требуют стационарного наблюдения."
    ],
    importantNote: "Шкала применяется ТОЛЬКО после подтверждения диагноза ТЭЛА.",
    legalReference: "Протокол диагностики и лечения ТЭЛА, МЗ РБ, 2026"
  };

  var checked = {};
  var ageValue = 0;
  var itemsEl, panelEl;

  function total() {
    var sum = ageValue;
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

  function pluralize(n) {
    var lastTwo = n % 100, lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "баллов";
    if (lastOne === 1) return "балл";
    if (lastOne >= 2 && lastOne <= 4) return "балла";
    return "баллов";
  }

  function renderItems() {
    var html =
      '<div class="calc-item calc-item-input">' +
        '<div class="calc-item-checkbox" style="background:var(--accent);border-color:var(--accent);">' +
          '<span class="check-icon" style="color:#fff;">👤</span>' +
        '</div>' +
        '<div class="calc-item-content"><div class="calc-item-title">Возраст (в годах)</div></div>' +
        '<div class="calc-age-wrapper">' +
          '<input type="text" id="ageInput" class="calc-age-input" inputmode="numeric" maxlength="3" placeholder="—" value="' + (ageValue > 0 ? ageValue : '') + '">' +
          '<span class="calc-age-unit">лет</span>' +
        '</div>' +
      '</div>';

    html += ITEMS.map(function (it) {
      var cls = checked[it.id] ? " checked" : "";
      return '<div class="calc-item' + cls + '" data-id="' + it.id + '">' +
        '<div class="calc-item-checkbox"><span class="check-icon">✓</span></div>' +
        '<div class="calc-item-content"><div class="calc-item-title">' + CU.escapeHtml(it.title) + '</div></div>' +
        '<div class="calc-item-points">+' + it.points + '</div></div>';
    }).join("");

    itemsEl.innerHTML = html;

    // Восстановить слушатель возраста
    var ageEl = document.getElementById("ageInput");
    if (ageEl) {
      ageEl.addEventListener("input", function () {
        var v = parseInt(String(ageEl.value).replace(/[^\d]/g, ""), 10);
        if (isNaN(v)) v = 0;
        if (v < 0) v = 0;
        if (v > 120) v = 120;
        ageValue = v;
        renderResult();
      });
    }
  }

  function renderResult() {
    var sum = total();
    var r = getRange(sum);
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + sum + '</div><div class="result-score-label">' + pluralize(sum) + '</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
        '<div class="result-label">' + r.label + '</div>' +
        '<div class="result-mortality">☠️ Смертность: ' + r.mortality + '</div>' +
        '<div class="result-description">' + r.description + '</div>' +
      '</div></div>';
  }

  function init() {
    itemsEl = document.getElementById("calcItems");
    panelEl = document.getElementById("resultPanel");
    if (!itemsEl || !panelEl) return;

    renderItems();
    renderResult();

    itemsEl.addEventListener("click", function (e) {
      var item = e.target.closest(".calc-item[data-id]");
      if (!item) return;
      var id = item.getAttribute("data-id");
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