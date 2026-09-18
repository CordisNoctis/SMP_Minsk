(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // Пороги QTc для режима оценки (мс)
  var THRESHOLDS = {
    male:    { normal: 440, borderline: 460, prolonged: 500 },
    female:  { normal: 460, borderline: 480, prolonged: 500 },
    child:   { normal: 460, borderline: 480, prolonged: 500 }
  };

  // Должные диапазоны QTc (используются в режиме должного QT)
  var NORM_RANGES = {
    male:   { min: 350, max: 440 },
    female: { min: 350, max: 460 },
    child:  { min: 350, max: 460 }
  };

  var CATEGORIES = [
    { id: "male",   label: "Мужчина",  icon: "♂" },
    { id: "female", label: "Женщина",  icon: "♀" },
    { id: "child",  label: "Ребёнок",  icon: "👶" }
  ];

  var REFERENCE = {
    title: "О расчёте QTc",
    paragraphs: [
      "Формула Базетта (1920) — наиболее распространённая: QTc = QT / √RR (RR в секундах). Несмотря на неточность при экстремальной ЧСС, остаётся стандартом клинической практики.",
      "Нормальные значения QTc: у мужчин ≤440 мс, у женщин и детей ≤460 мс. Значения >500 мс ассоциированы с высоким риском полиморфной желудочковой тахикардии типа torsades de pointes."
    ],
    importantNote: "QTc > 500 мс — высокий риск torsades de pointes. Требуется срочная консультация кардиолога, отмена препаратов удлиняющих QT, коррекция электролитов (K⁺, Mg²⁺, Ca²⁺).",
    indicationsTitle: "📋 Должные значения QTc по категориям:",
    indications: [
      "Мужчины (взрослые): 350–440 мс",
      "Женщины (взрослые): 350–460 мс",
      "Дети (до 18 лет): 350–460 мс",
      "",
      "📏 Измерение RR на ЭКГ:",
      "При 25 мм/с: 1 малая клетка = 40 мс, 1 большая (5 мм) = 200 мс",
      "При 50 мм/с: 1 малая клетка = 20 мс, 1 большая = 100 мс",
      "Измерьте расстояние между двумя зубцами R и умножьте на цену деления."
    ]
  };

  var state = {
    mode: "assess",          // "assess" (оценка) или "range" (должный диапазон)
    category: "male",
    assess: { qt: null, hr: null },
    range:  { rr: 1000, speed: 25 }
  };

  var bodyEl, panelEl;

  function parseNum(el) {
    var v = parseFloat(String(el.value).replace(",", "."));
    return isNaN(v) ? null : v;
  }

  function resetButtonHtml() {
    return '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить">↺</button>';
  }

  // ===== СТАТУС ПО QTc =====

  function getStatus(qtc, category) {
    var t = THRESHOLDS[category];
    if (qtc >= t.prolonged) return { label: "Удлинён",     css: "qtc-status-prolonged", color: "error" };
    if (qtc >= t.borderline) return { label: "Пограничный", css: "qtc-status-borderline", color: "warning" };
    return { label: "Норма", css: "qtc-status-normal", color: "success" };
  }

  // ===== РЕЖИМ 1: ОЦЕНКА ИЗМЕРЕННОГО QT =====

  function renderAssessForm() {
    var a = state.assess;
    return '<div class="qtc-section card">' +
      '<div class="qtc-section-title">📊 Оценка измеренного QT</div>' +

      '<div class="qtc-category-row">' +
        CATEGORIES.map(function (c) {
          var active = state.category === c.id ? ' active' : '';
          return '<button type="button" class="qtc-category-btn' + active + '" data-category="' + c.id + '">' +
            '<span>' + c.icon + '</span>' +
            '<div class="qtc-category-label">' + c.label + '</div>' +
          '</button>';
        }).join("") +
      '</div>' +

      '<div class="qtc-input-group">' +
        '<label class="qtc-input-label">📏 Измеренный интервал QT</label>' +
        '<div class="qtc-input-row">' +
          '<input type="text" id="qtInput" class="qtc-field" inputmode="decimal" placeholder="400" value="' + (a.qt !== null ? a.qt : "") + '">' +
          '<span class="qtc-unit">мс</span>' +
        '</div>' +
      '</div>' +

      '<div class="qtc-input-group">' +
        '<label class="qtc-input-label">❤️ Частота сердечных сокращений</label>' +
        '<div class="qtc-input-row">' +
          '<input type="text" id="hrInput" class="qtc-field" inputmode="decimal" placeholder="75" value="' + (a.hr !== null ? a.hr : "") + '">' +
          '<span class="qtc-unit">уд/мин</span>' +
        '</div>' +
      '</div>' +

      '<div class="qtc-hint">QTc = QT / √(RR в секундах)</div>' +
    '</div>';
  }

  function calculateAssess() {
    var a = state.assess;
    if (a.qt === null || a.hr === null || a.hr <= 0) return null;
    var rrSec = 60 / a.hr;
    var qtc = Math.round(a.qt / Math.sqrt(rrSec));
    var rrMs = Math.round(rrSec * 1000);
    var status = getStatus(qtc, state.category);
    return { qt: a.qt, hr: a.hr, rrSec: rrSec, rrMs: rrMs, qtc: qtc, status: status };
  }

  function renderAssessResult() {
    var res = calculateAssess();
    if (!res) {
      return '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">введите данные</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните оба поля</div><div class="result-description">Интервал QT (мс) и ЧСС (уд/мин)</div></div>' +
        resetButtonHtml() +
      '</div>';
    }

    var warning = res.qtc >= 500 ? '<div class="result-warning">⚠️ Высокий риск torsades de pointes!</div>' : '';
    var th = THRESHOLDS[state.category];

    return '<div class="result-content result-' + res.status.color + ' qtc-result">' +
      '<div class="qtc-main-value">' +
        '<div class="qtc-big-number">' + res.qtc + '</div>' +
        '<div class="qtc-big-label">мс (QTc)</div>' +
        '<div class="' + res.status.css + '" style="font-weight:700;margin-top:4px;font-size:0.95rem;">' + res.status.label + '</div>' +
      '</div>' +
      '<div class="qtc-details">' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">QT измеренный:</span><span class="qtc-detail-value">' + res.qt + ' мс</span></div>' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">RR интервал:</span><span class="qtc-detail-value">' + res.rrMs + ' мс (' + res.rrSec.toFixed(2) + ' с)</span></div>' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">ЧСС:</span><span class="qtc-detail-value">' + res.hr + ' уд/мин</span></div>' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">Пороги (' + state.category + '):</span><span class="qtc-detail-value">норма ≤' + th.normal + ', погран. ≤' + th.borderline + ', удлин. ≥' + th.prolonged + '</span></div>' +
        warning +
      '</div>' +
      resetButtonHtml() +
    '</div>';
  }

  // ===== РЕЖИМ 2: ДОЛЖНЫЙ ДИАПАЗОН QT =====

  function renderRangeForm() {
    var r = state.range;
    return '<div class="qtc-section card">' +
      '<div class="qtc-section-title">📏 Должный диапазон QT для данной ЧСС</div>' +

      '<div class="qtc-category-row">' +
        CATEGORIES.map(function (c) {
          var active = state.category === c.id ? ' active' : '';
          return '<button type="button" class="qtc-category-btn' + active + '" data-category="' + c.id + '">' +
            '<span>' + c.icon + '</span>' +
            '<div class="qtc-category-label">' + c.label + '</div>' +
          '</button>';
        }).join("") +
      '</div>' +

      '<div class="qtc-input-group">' +
        '<label class="qtc-input-label">⏱️ Интервал RR на ЭКГ</label>' +
        '<div class="qtc-input-row">' +
          '<input type="text" id="rrInput" class="qtc-field" inputmode="decimal" placeholder="1000" value="' + (r.rr !== null ? r.rr : "") + '">' +
          '<span class="qtc-unit">мс</span>' +
        '</div>' +
        '<div class="qtc-hint">Расстояние между зубцами R на ЭКГ</div>' +
      '</div>' +

      '<div class="qtc-input-group">' +
        '<label class="qtc-input-label">🎞️ Скорость движения ленты</label>' +
        '<div class="qtc-speed-row">' +
          '<button type="button" class="qtc-speed-btn' + (r.speed === 25 ? ' active' : '') + '" data-speed="25">25 мм/с<br><span style="font-size:0.7rem;opacity:0.7;">(стандарт)</span></button>' +
          '<button type="button" class="qtc-speed-btn' + (r.speed === 50 ? ' active' : '') + '" data-speed="50">50 мм/с</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function msToCells(ms, speed) {
    var mm = speed === 25 ? ms / 40 : ms / 20;
    return {
      mm: mm.toFixed(1),
      small: mm.toFixed(1),
      big: (mm / 5).toFixed(1)
    };
  }

  function formatCellsText(ms, speed, label) {
    var c = msToCells(ms, speed);
    return label + ': ' + ms + ' мс → ' + c.mm + ' мм (' + c.small + ' мал. / ' + c.big + ' бол. клеток)';
  }

  function calculateRange() {
    var r = state.range;
    if (r.rr === null || r.rr <= 0) return null;
    var norm = NORM_RANGES[state.category];
    var sqrtRR = Math.sqrt(r.rr / 1000);
    var qtMin = Math.round(norm.min * sqrtRR);
    var qtMax = Math.round(norm.max * sqrtRR);
    var hr = Math.round(60000 / r.rr);
    return {
      rr: r.rr,
      hr: hr,
      qtMin: qtMin,
      qtMax: qtMax,
      qtcMin: norm.min,
      qtcMax: norm.max,
      speed: r.speed
    };
  }

  function renderRangeResult() {
    var res = calculateRange();
    if (!res) {
      return '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">введите RR</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Укажите интервал RR</div><div class="result-description">Расстояние между зубцами R на ЭКГ (мс)</div></div>' +
        resetButtonHtml() +
      '</div>';
    }

    var cellsHtml =
      '<div class="qtc-cells-block">' +
        '<div class="qtc-cells-title">📏 Перевод в клетки ЭКГ (' + res.speed + ' мм/с):</div>' +
        '<div class="qtc-cell-row">' + formatCellsText(res.rr, res.speed, "RR") + '</div>' +
        '<div class="qtc-cell-row">' + formatCellsText(res.qtMin, res.speed, "QT нижняя граница") + '</div>' +
        '<div class="qtc-cell-row">' + formatCellsText(res.qtMax, res.speed, "QT верхняя граница") + '</div>' +
      '</div>';

    return '<div class="result-content result-success qtc-result">' +
      '<div class="qtc-range-main">' +
        '<div class="qtc-range-title">Должный интервал QT</div>' +
        '<div class="qtc-range-values">' +
          '<div class="qtc-range-value">' + res.qtMin + '</div>' +
          '<div class="qtc-range-sep">—</div>' +
          '<div class="qtc-range-value">' + res.qtMax + '</div>' +
          '<div class="qtc-range-unit">мс</div>' +
        '</div>' +
      '</div>' +
      '<div class="qtc-details">' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">Категория:</span><span class="qtc-detail-value">' + state.category + '</span></div>' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">RR интервал:</span><span class="qtc-detail-value">' + res.rr + ' мс</span></div>' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">ЧСС:</span><span class="qtc-detail-value">' + res.hr + ' уд/мин</span></div>' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">Норма QTc:</span><span class="qtc-detail-value">' + res.qtcMin + '–' + res.qtcMax + ' мс</span></div>' +
      '</div>' +
      cellsHtml +
      resetButtonHtml() +
    '</div>';
  }

  // ===== ОБЩИЕ ФУНКЦИИ =====

  function renderModeSwitcher() {
    return '<div class="qtc-mode-switcher">' +
      '<button type="button" class="qtc-mode-btn' + (state.mode === "assess" ? ' active' : '') + '" data-mode="assess">' +
        '<span>📊</span>' +
        '<div class="qtc-mode-label">Оценка QT</div>' +
        '<div class="qtc-mode-desc">Измерил → получил QTc</div>' +
      '</button>' +
      '<button type="button" class="qtc-mode-btn' + (state.mode === "range" ? ' active' : '') + '" data-mode="range">' +
        '<span>📏</span>' +
        '<div class="qtc-mode-label">Должный QT</div>' +
        '<div class="qtc-mode-desc">RR → диапазон нормы</div>' +
      '</button>' +
    '</div>';
  }

  function fullRender() {
    bodyEl.innerHTML = renderModeSwitcher() +
      (state.mode === "assess" ? renderAssessForm() : renderRangeForm());
    panelEl.innerHTML = state.mode === "assess" ? renderAssessResult() : renderRangeResult();
    bindListeners();
  }

  function bindListeners() {
    if (state.mode === "assess") {
      var qtEl = document.getElementById("qtInput");
      var hrEl = document.getElementById("hrInput");
      if (qtEl) qtEl.addEventListener("input", function () {
        var v = parseNum(qtEl);
        state.assess.qt = v !== null ? Math.max(100, Math.min(800, v)) : null;
        panelEl.innerHTML = renderAssessResult();
      });
      if (hrEl) hrEl.addEventListener("input", function () {
        var v = parseNum(hrEl);
        state.assess.hr = v !== null ? Math.max(20, Math.min(250, v)) : null;
        panelEl.innerHTML = renderAssessResult();
      });
    } else {
      var rrEl = document.getElementById("rrInput");
      if (rrEl) rrEl.addEventListener("input", function () {
        var v = parseNum(rrEl);
        state.range.rr = v !== null ? Math.max(100, Math.min(3000, v)) : null;
        panelEl.innerHTML = renderRangeResult();
      });
    }
  }

  function resetAll() {
    state = {
      mode: "assess",
      category: "male",
      assess: { qt: null, hr: null },
      range: { rr: 1000, speed: 25 }
    };
    fullRender();
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    fullRender();

    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".qtc-mode-btn");
      if (modeBtn) {
        state.mode = modeBtn.getAttribute("data-mode");
        fullRender();
        return;
      }
      var catBtn = e.target.closest(".qtc-category-btn");
      if (catBtn) {
        state.category = catBtn.getAttribute("data-category");
        fullRender();
        return;
      }
      var speedBtn = e.target.closest(".qtc-speed-btn");
      if (speedBtn) {
        state.range.speed = parseInt(speedBtn.getAttribute("data-speed"), 10);
        fullRender();
        return;
      }
    });

    panelEl.addEventListener("click", function (e) {
      if (e.target.closest(".result-reset-big")) resetAll();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  CU.autoPersist("smp-calc-qtc-v1");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();