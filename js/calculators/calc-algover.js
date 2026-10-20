(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ДИАПАЗОНЫ =====
  var RANGES = [
    { min: 0,    max: 0.49, label: "Низкий индекс",       bloodLoss: "Кровопотеря маловероятна",   bloodLossMl: "—",            color: "gcs-15" },
    { min: 0.5,  max: 0.7,  label: "Норма",               bloodLoss: "до 10%",                     bloodLossMl: "< 500 мл",      color: "gcs-15" },
    { min: 0.71, max: 0.79, label: "Пограничное",         bloodLoss: "~10%",                       bloodLossMl: "500–750 мл",    color: "gcs-14" },
    { min: 0.8,  max: 1.0,  label: "Лёгкий шок (1 ст.)",  bloodLoss: "10–20%",                     bloodLossMl: "750–1000 мл",   color: "gcs-11-12" },
    { min: 1.01, max: 1.4,  label: "Средний шок (2 ст.)", bloodLoss: "20–30%",                     bloodLossMl: "1000–1500 мл",  color: "gcs-8-10" },
    { min: 1.41, max: 2.0,  label: "Тяжёлый шок (3 ст.)", bloodLoss: "30–40%",                     bloodLossMl: "1500–2000 мл",  color: "gcs-4-5" },
    { min: 2.01, max: 99,   label: "Крайне тяжёлый шок",  bloodLoss: "> 40–50%",                   bloodLossMl: "> 2000 мл",     color: "gcs-3" }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ =====
  var REFERENCE = {
    title: "Индекс Альговера (Шоковый индекс, Shock Index)",
    paragraphs: [
      "Шоковый индекс (ШИ) был предложен Allgöwer и Burri в 1967 году как простой инструмент для ранней диагностики тяжёлого циркуляторного коллапса при гиповолемических состояниях.",
      "Индекс отражает соотношение частоты сердечных сокращений и систолического артериального давления, интегрируя оба показателя в единую физиологическую величину, которая чувствительнее к ранним нарушениям гемодинамики, чем каждый из них в отдельности.",
      "Формула расчёта: ШИ = ЧСС (уд/мин) ÷ АД сист. (мм рт. ст.)",
      "ЧСС и АД по отдельности ненадёжны в компенсаторной фазе шока и могут искажаться медикаментами (гипотензивные препараты, хронотропные средства). ШИ точнее отражает состояние пациента, поскольку связан с функцией желудочков и циркулирующим объёмом крови.",
      "Индекс был первоначально описан Allgöwer M. и Burri C. в 1967 году в статье «Schockindex» (Dtsch Med Wochenschr, 1967;92:1947–1950) для оценки гиповолемии при септическом и геморрагическом шоке. Впоследствии подтверждён крупными ретроспективными исследованиями как инструмент стратификации риска при травме, необходимости трансфузии и исходах."
    ],
    importantNote: "ШИ используется как дополнительный инструмент, но не может заменить комплексную клиническую оценку.",
    indicationsTitle: "Интерпретация результатов:",
    indications: [
      "0,5 – 0,7 — Норма",
      "> 0,7 — Начальные признаки гиповолемии; порог для скрининга острой кровопотери",
      "> 0,9 — Декомпенсированный шок; ассоциирован с повышенной летальностью",
      "> 1,0 — Маркер 40% летальности; порог для активации протокола массивной трансфузии",
      "≥ 1,21 — Оптимальный порог по ROC-анализу для выявления пациентов, требующих немедленной реанимации (специфичность 85,1%, чувствительность 40,3%)"
    ],
    warnings: [
      "Отсутствуют проспективные рандомизированные исследования, валидирующие ШИ в клинической практике",
      "Сниженная чувствительность у пожилых пациентов и при акушерских кровотечениях",
      "Искажение результатов при кардиостимуляторе, нейрогенном шоке, приёме хронотропных препаратов, гипотермии, сильном болевом синдроме",
      "При пороге ≥ 1,0: специфичность 93%, но чувствительность 20–29% у взрослых — значительная доля тяжёлых пациентов остаётся нераспознанной",
      "Диагностическая точность: при пороге > 0,7 — чувствительность 87,5%, специфичность 73,8% для выявления значимого кровотечения (≥ 2 доз эритроцитарной массы за 24 ч)",
      "При пороге > 1,0: чувствительность 67,7%, специфичность 81,3% для прогнозирования необходимости массивной трансфузии; AUROC 0,83",
      "В прогнозировании летальности: AUC 0,62 (ШИ) vs 0,60 (изолированное АД сист.) — преимущество ШИ статистически незначимо, однако калибровка и чистая клиническая польза ШИ выше",
      "Модификации: Стандартный ШИ (ЧСС / АД сист.), Модифицированный ШИ (ЧСС / АД ср.), Возрастной ШИ (Возраст × ЧСС / АД сист., порог ≥ 48,8 для пациентов > 55 лет), Педиатрический ШИ SIPA (пороги по возрасту: 4–6 лет > 1,22; 7–12 лет > 1,0; 13–16 лет > 0,9)"
    ]
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-algover-state";
  var state = { hr: null, sbp: null };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved) {
      if (typeof saved.hr === "number") state.hr = saved.hr;
      if (typeof saved.sbp === "number") state.sbp = saved.sbp;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ =====
  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function getRange(si) {
    for (var i = 0; i < RANGES.length; i++) {
      if (si >= RANGES[i].min && si <= RANGES[i].max) return RANGES[i];
    }
    return RANGES[RANGES.length - 1];
  }

  function calcSI() {
    if (state.hr === null || state.sbp === null || state.sbp <= 0) return null;
    return Math.round((state.hr / state.sbp) * 100) / 100;
  }

  function getMarkerPosition(si) {
    if (si === null) return null;
    if (si < 0.5) return 2;
    if (si > 2.0) return 98;
    if (si <= 0.7) return 10;
    if (si <= 1.0) return 20 + ((si - 0.7) / 0.3) * 20;
    if (si <= 1.5) return 40 + ((si - 1.0) / 0.5) * 20;
    if (si <= 2.0) return 60 + ((si - 1.5) / 0.5) * 20;
    return 90;
  }

  function getCategoryColor(si) {
    if (si === null) return "#1f6e9c";
    if (si < 0.5) return "#1a7a3e";
    if (si <= 0.7) return "#1a7a3e";
    if (si <= 1.0) return "#8ba82a";
    if (si <= 1.5) return "#c77700";
    if (si <= 2.0) return "#b42323";
    return "#7a0e1c";
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderInputs() {
    var si = calcSI();
    var color = getCategoryColor(si);
    var scoreDisplay = si !== null ? si : "—";

    bodyEl.innerHTML =
      '<div class="algover-category" style="--cat-color: ' + color + ';">' +
        '<div class="algover-category-header">' +
          '<div class="algover-category-left">' +
            '<span class="algover-category-icon">🫀</span>' +
            '<span class="algover-category-title">Параметры гемодинамики</span>' +
          '</div>' +
          '<div class="algover-category-score" id="algoverScoreDisplay">' + scoreDisplay + '</div>' +
        '</div>' +
        '<div class="algover-items">' +
          '<div class="algover-input-item">' +
            '<label class="algover-input-label" for="hrInput">❤️ Частота сердечных сокращений</label>' +
            '<div class="algover-input-row">' +
              '<input type="text" id="hrInput" class="algover-field" inputmode="numeric" maxlength="3" placeholder="—" value="' + (state.hr !== null ? state.hr : "") + '">' +
              '<span class="algover-unit">уд/мин</span>' +
            '</div>' +
          '</div>' +
          '<div class="algover-input-item">' +
            '<label class="algover-input-label" for="sbpInput">🩸 Систолическое АД</label>' +
            '<div class="algover-input-row">' +
              '<input type="text" id="sbpInput" class="algover-field" inputmode="numeric" maxlength="3" placeholder="—" value="' + (state.sbp !== null ? state.sbp : "") + '">' +
              '<span class="algover-unit">мм рт. ст.</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="algover-scale-card">' +
        '<div class="algover-scale-title">Шкала индекса шока</div>' +
        '<div class="algover-scale">' +
          '<div class="algover-scale-segment seg-normal"><div class="seg-label">0.5–0.7</div><div class="seg-title">Норма</div></div>' +
          '<div class="algover-scale-segment seg-sub"><div class="seg-label">0.7–1.0</div><div class="seg-title">Субкомп.</div></div>' +
          '<div class="algover-scale-segment seg-mod"><div class="seg-label">1.0–1.5</div><div class="seg-title">Средний</div></div>' +
          '<div class="algover-scale-segment seg-sev"><div class="seg-label">1.5–2.0</div><div class="seg-title">Тяжёлый</div></div>' +
          '<div class="algover-scale-segment seg-crit"><div class="seg-label">>2.0</div><div class="seg-title">Крит.</div></div>' +
          '<div class="algover-scale-marker" id="algoverMarker"' + (si !== null ? ' style="left: ' + getMarkerPosition(si) + '%; display: block;"' : '') + '></div>' +
        '</div>' +
        '<div class="algover-formula-hint">ИА = ЧСС / САД · Норма: 0.5–0.7</div>' +
      '</div>';
  }

  function updateHeaderScore() {
    var si = calcSI();
    var scoreEl = document.getElementById("algoverScoreDisplay");
    if (scoreEl) {
      scoreEl.textContent = si !== null ? si : "—";
    }
    
    // Обновляем цвет шапки категории
    var categoryEl = document.querySelector(".algover-category");
    if (categoryEl) {
      categoryEl.style.setProperty("--cat-color", getCategoryColor(si));
    }
  }

  function renderResult() {
    var si = calcSI();

    if (si === null) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "индекс",
        color: "incomplete",
        title: "Заполните оба поля",
        description: "ЧСС (уд/мин) и систолическое АД (мм рт. ст.)",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var r = getRange(si);

    CU.renderResultPanel({
      score: si,
      scoreLabel: "индекс",
      color: r.color,
      title: r.label,
      description: "",
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    state.hr = null;
    state.sbp = null;
    saveState();
    renderInputs();
    bindInputListeners();
    renderResult();
  }

  function onInputChange() {
    var hrEl = document.getElementById("hrInput");
    var sbpEl = document.getElementById("sbpInput");
    
    var hr = parseNum(hrEl.value);
    var sbp = parseNum(sbpEl.value);
    
    if (hr !== null) hr = Math.max(20, Math.min(250, hr));
    if (sbp !== null) sbp = Math.max(20, Math.min(300, sbp));
    
    state.hr = hr;
    state.sbp = sbp;
    
    saveState();
    updateHeaderScore();
    updateMarker();
    renderResult();
  }

  function updateMarker() {
    var si = calcSI();
    var marker = document.getElementById("algoverMarker");
    if (!marker) return;
    
    if (si !== null) {
      marker.style.left = getMarkerPosition(si) + "%";
      marker.style.display = "block";
    } else {
      marker.style.display = "none";
    }
  }

  function bindInputListeners() {
    var hrEl = document.getElementById("hrInput");
    var sbpEl = document.getElementById("sbpInput");
    
    if (hrEl) hrEl.addEventListener("input", onInputChange);
    if (sbpEl) sbpEl.addEventListener("input", onInputChange);
  }

  function init() {
    bodyEl = document.getElementById("algoverInputs");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderInputs();
    bindInputListeners();
    renderResult();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.algover && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.algover });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();