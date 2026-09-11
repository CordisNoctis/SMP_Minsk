(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var REFERENCE = {
    title: "О расчёте ЭТТ",
    paragraphs: [
      "Формулы Коула (Cole) — наиболее распространённый метод подбора ЭТТ у детей старше 1 года. Для ЭТТ без манжеты: ID = 4 + возраст/4. Для ЭТТ с манжетой: ID = 3.5 + возраст/4.",
      "Для грудных детей до 1 года: без манжеты 3.5 мм, с манжетой 3.0 мм (при массе > 3.5 кг)."
    ],
    importantNote: "Всегда готовьте три трубки: расчётного размера, на 0.5 мм больше и на 0.5 мм меньше. Формула даёт ориентировочный размер — окончательный выбор определяется при ларингоскопии."
  };

  var ageValue = null;
  var ageEl, panelEl;

  function roundHalf(x) { return Math.round(x * 2) / 2; }

  function renderResult() {
    if (ageValue === null || ageValue < 0) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">введите возраст</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Укажите возраст ребёнка</div><div class="result-description">От 0 до 16 лет (поддерживаются десятичные значения)</div></div>' +
        '</div>';
      return;
    }

    var a = ageValue, uc, cc, note = "";
    if (a < 1) { uc = 3.5; cc = 3.0; note = "Для детей < 1 года — фиксированные размеры"; }
    else { uc = roundHalf(4 + a / 4); cc = roundHalf(3.5 + a / 4); }

    var ucRange = [uc - 0.5, uc, uc + 0.5];
    var ccRange = [cc - 0.5, cc, cc + 0.5];

    function renderRange(arr, main) {
      return arr.map(function (v, i) {
        return '<span' + (i === 1 ? ' class="ett-highlight"' : '') + '>' + v.toFixed(1) + '</span>';
      }).join(' · ');
    }

    panelEl.innerHTML =
      '<div class="result-content result-success ett-result">' +
      '<div class="ett-result-grid">' +
        '<div class="ett-result-column">' +
          '<div class="ett-result-type">Без манжеты</div>' +
          '<div class="ett-result-main">' + uc.toFixed(1) + ' мм</div>' +
          '<div class="ett-result-range">' + renderRange(ucRange) + '</div>' +
        '</div>' +
        '<div class="ett-result-divider-v"></div>' +
        '<div class="ett-result-column">' +
          '<div class="ett-result-type">С манжетой</div>' +
          '<div class="ett-result-main">' + cc.toFixed(1) + ' мм</div>' +
          '<div class="ett-result-range">' + renderRange(ccRange) + '</div>' +
        '</div>' +
      '</div>' +
      (note ? '<div class="ett-result-note">' + note + '</div>' : '') +
      '<div class="ett-result-tip">🔧 Готовьте 3 трубки: −0.5, расчётная, +0.5</div>' +
      '</div>';
  }

  function init() {
    ageEl = document.getElementById("ageInput");
    panelEl = document.getElementById("resultPanel");
    if (!ageEl || !panelEl) return;

    renderResult();

    ageEl.addEventListener("input", function () {
      var v = parseFloat(String(ageEl.value).replace(",", "."));
      if (isNaN(v) || ageEl.value.trim() === "") ageValue = null;
      else {
        if (v < 0) v = 0;
        if (v > 16) v = 16;
        ageValue = v;
      }
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