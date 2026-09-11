(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var RANGES = [
    { min: 0,  max: 0,  label: "Нет боли",      face: "😌", color: "vas-0",    description: "Пациент не испытывает болевых ощущений.",                       therapy: "Наблюдение, немедикаментозные методы при необходимости" },
    { min: 1,  max: 3,  label: "Слабая боль",   face: "😐", color: "vas-1-3",  description: "Лёгкий дискомфорт, не нарушающий активность.",                 therapy: "Парацетамол 500–1000 мг, НПВС (ибупрофен 400 мг, кеторолак 30 мг)" },
    { min: 4,  max: 6,  label: "Умеренная боль", face: "😣", color: "vas-4-6",  description: "Боль отвлекает, нарушает концентрацию и сон.",                 therapy: "Слабые опиоиды (трамадол 50–100 мг) + НПВС" },
    { min: 7,  max: 10, label: "Сильная боль",  face: "😫", color: "vas-7-10", description: "Интенсивная боль, нарушающая все функции. Выраженный стресс.", therapy: "Сильные опиоиды (морфин 5–10 мг в/в, фентанил 25–50 мкг в/в) + адъюванты" }
  ];

  var REFERENCE = {
    title: "О шкале ВАШ",
    paragraphs: [
      "Визуально-аналоговая шкала (ВАШ/VAS) — один из наиболее широко используемых инструментов оценки интенсивности боли. В клинической практике чаще используется 10-балльная числовая рейтинговая шкала (NRS).",
      "Обе шкалы имеют высокую корреляцию и валидность. Целевой уровень боли после анальгезии — ≤ 3 баллов."
    ],
    importantNote: "Оценка боли субъективна и зависит от индивидуальных особенностей. У детей, пожилых и пациентов с когнитивными нарушениями предпочтительнее использовать шкалу лиц Wong-Baker или упрощённые вербальные шкалы."
  };

  var painLevel = 0;
  var sliderEl, fillEl, faceEl, scoreEl, labelEl, quickEl, panelEl;

  function getRange() {
    for (var i = 0; i < RANGES.length; i++)
      if (painLevel >= RANGES[i].min && painLevel <= RANGES[i].max) return RANGES[i];
    return RANGES[RANGES.length - 1];
  }

  function renderQuickButtons() {
    var html = "";
    for (var i = 0; i <= 10; i++) {
      html += '<button type="button" class="vas-quick-btn' + (painLevel === i ? ' active' : '') + '" data-value="' + i + '">' + i + '</button>';
    }
    quickEl.innerHTML = html;
  }

  function renderResult() {
    var r = getRange();
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + painLevel + '</div><div class="result-score-label">из 10 баллов</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
        '<div class="result-label">' + r.label + '</div>' +
        '<div class="result-description">' + r.description + '</div>' +
        '<div class="result-therapy">💊 ' + r.therapy + '</div>' +
      '</div></div>';
  }

  function updateUI() {
    var r = getRange();
    if (sliderEl) sliderEl.value = painLevel;
    if (fillEl) fillEl.style.width = (painLevel * 10) + "%";
    if (faceEl) faceEl.textContent = r.face;
    if (scoreEl) scoreEl.textContent = painLevel;
    if (labelEl) labelEl.textContent = r.label;

    quickEl.querySelectorAll(".vas-quick-btn").forEach(function (btn) {
      btn.classList.toggle("active", parseInt(btn.getAttribute("data-value"), 10) === painLevel);
    });

    renderResult();
  }

  function init() {
    sliderEl = document.getElementById("vasSlider");
    fillEl = document.getElementById("vasFill");
    faceEl = document.getElementById("vasFace");
    scoreEl = document.getElementById("vasScore");
    labelEl = document.getElementById("vasLabel");
    quickEl = document.getElementById("vasQuick");
    panelEl = document.getElementById("resultPanel");
    if (!sliderEl || !quickEl || !panelEl) return;

    renderQuickButtons();
    updateUI();

    sliderEl.addEventListener("input", function () {
      painLevel = parseInt(sliderEl.value, 10);
      updateUI();
    });

    quickEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".vas-quick-btn");
      if (!btn) return;
      painLevel = parseInt(btn.getAttribute("data-value"), 10);
      updateUI();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();