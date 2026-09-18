(function () {
  "use strict";

  var RANGES = [
    { min: 0,    max: 0.49, label: "Низкий индекс",      bloodLoss: "Кровопотеря маловероятна", bloodLossMl: "—",          color: "gcs-15",    therapy: "Оцените клиническую картину комплексно. Возможна брадикардия или гипертензия." },
    { min: 0.5,  max: 0.7,  label: "Норма",              bloodLoss: "до 10%",                   bloodLossMl: "< 500 мл",    color: "gcs-15",    therapy: "Гемодинамика стабильна. Наблюдение." },
    { min: 0.71, max: 0.79, label: "Пограничное",        bloodLoss: "~10%",                     bloodLossMl: "500–750 мл",  color: "gcs-14",    therapy: "Возможна скрытая кровопотеря. Мониторинг, повторная оценка." },
    { min: 0.8,  max: 1.0,  label: "Лёгкий шок (1 ст.)", bloodLoss: "10–20%",                   bloodLossMl: "750–1000 мл", color: "gcs-11-12", therapy: "Два периферических катетера. Кристаллоиды до 1000 мл. Обязательная госпитализация." },
    { min: 1.01, max: 1.4,  label: "Средний шок (2 ст.)", bloodLoss: "20–30%",                  bloodLossMl: "1000–1500 мл",color: "gcs-8-10",  therapy: "Инфузия, контроль диуреза. Рассмотреть трансфузию. Госпитализация в ОРИТ." },
    { min: 1.41, max: 2.0,  label: "Тяжёлый шок (3 ст.)", bloodLoss: "30–40%",                  bloodLossMl: "1500–2000 мл",color: "gcs-4-5",   therapy: "Массивная трансфузия (1:1:1). Транексамовая кислота. Экстренная хирургия." },
    { min: 2.01, max: 99,   label: "Крайне тяжёлый шок",  bloodLoss: "> 40–50%",                bloodLossMl: "> 2000 мл",   color: "gcs-3",     therapy: "Максимальная реанимация. Прогноз неблагоприятный." }
  ];

  var REFERENCE = {
    title: "Об индексе Альговера",
    paragraphs: [
      "Индекс Альговера (Shock Index, SI) — отношение ЧСС к САД. Норма 0.5–0.7. Повышение — более чувствительный маркер шока, чем изолированная тахикардия или гипотензия.",
      "Особенно полезен для выявления компенсированного шока, когда АД ещё сохранено, но тахикардия уже указывает на гиповолемию."
    ],
    importantNote: "ИА ≥ 0.8 — два венозных доступа + начало инфузии. ИА ≥ 1.0 — обязательная госпитализация в стационар с реанимацией. ИА > 1.5 — экстренная трансфузия.",
    warnings: [
      "Не применяется у детей (нормальные значения выше: 0.8–1.0 у младенцев)",
      "Не применяется при брадиаритмиях и приёме β-блокаторов",
      "Расчёт — после первичной оценки ABC и остановки наружного кровотечения"
    ]
  };

  var hrEl, sbpEl, panelEl;

  function resetButtonHtml() {
    return '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить">↺</button>';
  }

  function resetAll() {
    hrEl.value = "";
    sbpEl.value = "";
    update();
  }

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
        resetButtonHtml() +
        '</div>';
      return;
    }

    var si = Math.round((hr / sbp) * 100) / 100;
    var r = getRange(si);

    var warnings = [];
    if (si >= 0.8) warnings.push("⚠️ ИА ≥ 0.8 — два венозных доступа, начало инфузии!");
    if (si >= 1.0) warnings.push("🚨 ИА ≥ 1.0 — обязательная госпитализация в реанимацию!");
    if (si > 1.5) warnings.push("🆘 ИА > 1.5 — экстренная трансфузия!");
    var warningHtml = warnings.length ? '<div class="result-warning">' + warnings.join("<br>") + '</div>' : "";

    panelEl.innerHTML =
      '<div class="result-content result-' + r.color + '">' +
      '<div class="result-score"><div class="result-score-value">' + si + '</div><div class="result-score-label">индекс</div></div>' +
      '<div class="result-divider"></div>' +
      '<div class="result-info">' +
      '<div class="result-label">' + r.label + '</div>' +
      '<div class="result-description">Кровопотеря: ' + r.bloodLoss + ' (' + r.bloodLossMl + ')</div>' +
      '<div class="result-therapy">🏥 ' + r.therapy + '</div>' +
      warningHtml +
      '</div>' +
      resetButtonHtml() +
      '</div>';
  }

  function update() {
    var hr = val(hrEl), sbp = val(sbpEl);
    if (hr !== null) hr = Math.max(20, Math.min(250, hr));
    if (sbp !== null) sbp = Math.max(20, Math.min(300, sbp));
    renderResult(hr, sbp);
  }

  function init() {
    hrEl = document.getElementById("hrInput");
    sbpEl = document.getElementById("sbpInput");
    panelEl = document.getElementById("resultPanel");
    if (!hrEl || !sbpEl || !panelEl) return;

    hrEl.addEventListener("input", update);
    sbpEl.addEventListener("input", update);

    panelEl.addEventListener("click", function (e) {
      if (e.target.closest(".result-reset-big")) resetAll();
    });

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      window.SMP.calcUtils.openReferenceModal({ reference: REFERENCE });
    });

    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  CU.autoPersist("smp-calc-algover-v1");

})();