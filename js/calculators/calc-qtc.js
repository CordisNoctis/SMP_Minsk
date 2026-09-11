(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var THRESHOLDS = {
    male:   { normal: 440, borderline: 460, prolonged: 500 },
    female: { normal: 460, borderline: 480, prolonged: 500 }
  };

  var REFERENCE = {
    title: "О формуле Базетта",
    paragraphs: [
      "Формула Базетта (1920) — наиболее распространённая: QTc = QT / √RR. Несмотря на неточность при экстремальной ЧСС, остаётся стандартом клинической практики.",
      "Нормальные значения: у мужчин ≤440 мс, у женщин ≤460 мс. Значения >500 мс ассоциированы с высоким риском полиморфной желудочковой тахикардии типа torsades de pointes."
    ],
    importantNote: "QTc > 500 мс — высокий риск torsades de pointes. Требуется срочная консультация кардиолога, отмена препаратов удлиняющих QT, коррекция электролитов (K⁺, Mg²⁺, Ca²⁺)."
  };

  var qtEl, hrEl, panelEl;
  var qtValue = null, hrValue = null;

  function parseNum(el) {
    var v = parseFloat(String(el.value).replace(",", "."));
    return isNaN(v) ? null : v;
  }

  function getStatus(qtc, gender) {
    var t = THRESHOLDS[gender];
    if (qtc >= t.prolonged) return { label: "Удлинён", css: "qtc-status-prolonged", color: "error" };
    if (qtc >= t.borderline) return { label: "Пограничный", css: "qtc-status-borderline", color: "warning" };
    return { label: "Норма", css: "qtc-status-normal", color: "success" };
  }

  function renderResult() {
    if (qtValue === null || hrValue === null || hrValue <= 0) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">введите данные</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните оба поля</div><div class="result-description">Интервал QT (мс) и ЧСС (уд/мин)</div></div>' +
        '</div>';
      return;
    }

    var qt = qtValue, hr = hrValue;
    var rrSec = 60 / hr;
    var qtc = Math.round(qt / Math.sqrt(rrSec));
    var rrMs = Math.round(rrSec * 1000);

    var maleStatus = getStatus(qtc, "male");
    var femaleStatus = getStatus(qtc, "female");
    var worstColor = (maleStatus.color === "error" || femaleStatus.color === "error") ? "error"
      : (maleStatus.color === "warning" || femaleStatus.color === "warning") ? "warning" : "success";

    var warning = qtc >= 500 ? '<div class="result-warning">⚠️ Высокий риск torsades de pointes!</div>' : "";

    panelEl.innerHTML =
      '<div class="result-content result-' + worstColor + ' qtc-result">' +
      '<div class="qtc-main-value">' +
        '<div class="qtc-big-number">' + qtc + '</div>' +
        '<div class="qtc-big-label">мс (QTc)</div>' +
      '</div>' +
      '<div class="result-divider"></div>' +
      '<div class="qtc-details">' +
        '<div class="qtc-detail-row"><span class="qtc-detail-label">RR интервал:</span><span class="qtc-detail-value">' + rrMs + ' мс (' + rrSec.toFixed(2) + ' с)</span></div>' +
        '<div class="qtc-gender-row">' +
          '<div class="qtc-gender-item qtc-gender-male"><span>♂</span><span class="' + maleStatus.css + '">' + maleStatus.label + '</span></div>' +
          '<div class="qtc-gender-item qtc-gender-female"><span>♀</span><span class="' + femaleStatus.css + '">' + femaleStatus.label + '</span></div>' +
        '</div>' +
        warning +
      '</div></div>';
  }

  function update() {
    var q = parseNum(qtEl), h = parseNum(hrEl);
    qtValue = q !== null ? Math.max(100, Math.min(800, q)) : null;
    hrValue = h !== null ? Math.max(20, Math.min(250, h)) : null;
    renderResult();
  }

  function init() {
    qtEl = document.getElementById("qtInput");
    hrEl = document.getElementById("hrInput");
    panelEl = document.getElementById("resultPanel");
    if (!qtEl || !hrEl || !panelEl) return;

    qtEl.addEventListener("input", update);
    hrEl.addEventListener("input", update);
    renderResult();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();