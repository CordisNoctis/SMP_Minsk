(function () {
  "use strict";

  var RANGES = [
    { min: 0, max: 0.7, label: "Норма", bloodLoss: "< 10%", bloodLossMl: "< 500 мл", cls: "Компенсация", color: "gcs-15", therapy: "Наблюдение. Пероральная регидратация при необходимости." },
    { min: 0.71, max: 0.99, label: "Субкомпенсация", bloodLoss: "10–20%", bloodLossMl: "500–1000 мл", cls: "Класс II", color: "gcs-14", therapy: "Венозный доступ. Кристаллоиды до 1000 мл. Мониторинг диуреза." },
    { min: 1.0, max: 1.49, label: "Шок средней тяжести", bloodLoss: "20–40%", bloodLossMl: "1000–2000 мл", cls: "Класс III", color: "gcs-8-10", therapy: "Два венозных доступа. Быстрая инфузия кристаллоидов. Рассмотреть трансфузию. Искать источник кровотечения!" },
    { min: 1.5, max: 2.0, label: "Тяжёлый шок", bloodLoss: "40–50%", bloodLossMl: "2000–2500 мл", cls: "Класс IV", color: "gcs-4-5", therapy: "Массивная трансфузия (эритроциты + СЗП + тромбоциты 1:1:1). Транексамовая кислота. Экстренная хирургия." },
    { min: 2.01, max: 99, label: "Крайне тяжёлый шок", bloodLoss: "> 50%", bloodLossMl: "> 2500 мл", cls: "Терминальный", color: "gcs-3", therapy: "Максимальная реанимация. Прогноз неблагоприятный." }
  ];

  var REFERENCE = {
    title: "Об индексе",
    paragraphs: [
      "Индекс Альговера (Algover Index, Shock Index, SI) — отношение частоты сердечных сокращений (ЧСС) к систолическому артериальному давлению (САД).",
      "У здоровых взрослых индекс составляет 0.5–0.7. Повышение индекса — более чувствительный маркер шока, чем изолированная тахикардия или гипотензия. У детей нормальные значения выше (0.8–1.0 у младенцев, 0.7–0.9 у старших).",
      "Индекс особенно полезен для выявления компенсированного шока, когда АД ещё сохранено, но тахикардия уже указывает на гиповолемию. Широко применяется в травматологии, акушерстве и экстренной медицине."
    ],
    importantNote: "ИА > 1.0 указывает на потерю ≥ 20% ОЦК и требует немедленной инфузионной терапии. ИА > 1.5 — показание к экстренной трансфузии и хирургическому вмешательству."
  };

  var hrEl, sbpEl, markerEl, panelEl;

  function val(el) {
    var v = parseFloat(String(el.value).replace(",", "."));
    return isNaN(v) ? null : v;
  }

  function getRange(si) {
    for (var i = 0; i < RANGES.length; i++) {
      if (si >= RANGES[i].min && si <= RANGES[i].max) return RANGES[i];
    }
    return RANGES[RANGES.length - 1];
  }

  function renderResult(hr, sbp) {
    if (hr === null || sbp === null || sbp <= 0) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">введите данные</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните оба поля</div><div class="result-description">ЧСС (уд/мин) и систолическое АД (мм рт. ст.)</div></div>' +
        "</div>";
      return;
    }
    var si = Math.round((hr / sbp) * 100) / 100;
    var r = getRange(si);
    var warning = si >= 1.0 ? '<div class="result-warning">⚠️ ИА ≥ 1.0 — показана экстренная инфузионная терапия!</div>' : "";
    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + si + '</div><div class="result-score-label">индекс</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
      '<div class="result-label">' + r.label + " · " + r.cls + "</div>" +
      '<div class="result-description">Кровопотеря: ' + r.bloodLoss + " (" + r.bloodLossMl + ")</div>" +
      '<div class="result-therapy">' + r.therapy + "</div>" +
      warning +
      "</div></div>";
  }

  function updateMarker(hr, sbp) {
    if (hr === null || sbp === null || sbp <= 0) { markerEl.style.display = "none"; return; }
    var si = hr / sbp;
    var percent = Math.max(0, Math.min(100, ((si - 0.3) / (2.5 - 0.3)) * 100));
    markerEl.style.display = "block";
    markerEl.style.left = percent + "%";
  }

  function update() {
    var hr = val(hrEl), sbp = val(sbpEl);
    if (hr !== null) hr = Math.max(20, Math.min(250, hr));
    if (sbp !== null) sbp = Math.max(20, Math.min(300, sbp));
    updateMarker(hr, sbp);
    renderResult(hr, sbp);
  }

  function init() {
    hrEl = document.getElementById("hrInput");
    sbpEl = document.getElementById("sbpInput");
    markerEl = document.getElementById("algoverMarker");
    panelEl = document.getElementById("resultPanel");
    if (!hrEl || !sbpEl || !panelEl) return;
    hrEl.addEventListener("input", update);
    sbpEl.addEventListener("input", update);
    update();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn && window.SMP && window.SMP.calcUtils) {
      infoBtn.addEventListener("click", function () {
        window.SMP.calcUtils.openReferenceModal({ reference: REFERENCE });
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();