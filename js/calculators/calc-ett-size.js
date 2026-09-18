(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // Педиатрическая таблица подбора ЭТТ
  var PEDIATRIC_TABLE = [
    { ageMin: 0, ageMax: 0.1, weightMin: 0, weightMax: 0.7, diam: 2.0, depthOral: 5, catheter: 6, cuff: false },
    { ageMin: 0, ageMax: 0.2, weightMin: 0.7, weightMax: 1.0, diam: 2.5, depthOral: 5.5, catheter: 6, cuff: false },
    { ageMin: 0, ageMax: 0.3, weightMin: 1.5, weightMax: 2.5, diam: 3.0, depthOral: 6, catheter: 7, cuff: false },
    { ageMin: 0, ageMax: 0.4, weightMin: 2.5, weightMax: 3.2, diam: 3.0, depthOral: 8.5, catheter: 7, cuff: false },
    { ageMin: 0, ageMax: 0.5, weightMin: 3.2, weightMax: 4.0, diam: 3.5, depthOral: 9, catheter: 8, cuff: false },
    { ageMin: 0.4, ageMax: 0.8, weightMin: 5, weightMax: 7, diam: 3.5, depthOral: 10, catheter: 8, cuff: false },
    { ageMin: 0.9, ageMax: 1.3, weightMin: 9, weightMax: 11, diam: 4.0, depthOral: 11, catheter: 8, cuff: false },
    { ageMin: 1.8, ageMax: 2.3, weightMin: 11, weightMax: 13, diam: 4.5, depthOral: 12, catheter: 10, cuff: false },
    { ageMin: 2.8, ageMax: 3.3, weightMin: 13, weightMax: 15, diam: 4.5, depthOral: 13, catheter: 10, cuff: false },
    { ageMin: 3.8, ageMax: 4.3, weightMin: 15, weightMax: 17, diam: 5.0, depthOral: 14, catheter: 10, cuff: false },
    { ageMin: 5.5, ageMax: 6.5, weightMin: 18, weightMax: 22, diam: 5.5, depthOral: 15, catheter: 10, cuff: false },
    { ageMin: 7.5, ageMax: 8.5, weightMin: 22, weightMax: 26, diam: 6.0, depthOral: 16, catheter: 10, cuff: false },
    { ageMin: 9.5, ageMax: 10.5, weightMin: 28, weightMax: 33, diam: 6.5, depthOral: 17, catheter: 12, cuff: true },
    { ageMin: 11.5, ageMax: 12.5, weightMin: 35, weightMax: 41, diam: 7.0, depthOral: 18, catheter: 12, cuff: true },
    { ageMin: 12.8, ageMax: 14.2, weightMin: 45, weightMax: 55, diam: 7.5, depthOral: 19, catheter: 12, cuff: true }
  ];

  var REFERENCE = {
    title: "О подборе ЭТТ",
    paragraphs: [
      "Формулы Коула (Cole) — наиболее распространённый метод подбора ЭТТ у детей старше 1 года. Для ЭТТ без манжеты: ID = 4 + возраст/4. Для ЭТТ с манжетой: ID = 3.5 + возраст/4.",
      "У взрослых диаметр зависит от пола и веса: мужчины 7.5–8.5 мм, женщины 7.0–8.0 мм. Глубина оральной интубации: 23 см (М) / 21 см (Ж), назальной +2 см."
    ],
    importantNote: "Всегда готовьте три трубки: расчётного размера, на 0.5 мм больше и на 0.5 мм меньше. Формулы дают ориентировочный размер — окончательный выбор определяется при ларингоскопии.",
    indicationsTitle: "📋 Педиатрическая таблица подбора:",
    indications: [
      "Новорождённые (0–1 мес) — 2.5–3.0 мм, глубина 5–6 см",
      "1–6 мес — 3.0–3.5 мм, глубина 8.5–10 см",
      "6–12 мес — 3.5–4.0 мм, глубина 10–11 см",
      "1–2 года — 4.0–4.5 мм, глубина 11–12 см",
      "2–4 года — 4.5–5.0 мм, глубина 12–14 см",
      "5–7 лет — 5.5–6.0 мм, глубина 15–16 см",
      "8–10 лет — 6.0–6.5 мм, глубина 16–17 см, С манжетой",
      "11–14 лет — 7.0–7.5 мм, глубина 18–19 см, С манжетой",
      "",
      "⚠️ Детям до 8 лет рекомендованы трубки БЕЗ манжеты",
      "⚠️ Вес корректирует диаметр: при ожирении +0.5 мм, при дефиците −0.5 мм"
    ]
  };

  var state = {
    mode: "adult",
    adult: { gender: "male", weight: 70, route: "oral" },
    pediatric: { age: 4, weight: 16, route: "oral" }
  };
  var bodyEl, panelEl;

  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function resetButtonHtml() {
    return '<button type="button" class="result-reset-big" aria-label="Сбросить" title="Сбросить">↺</button>';
  }

  // ===== РАСЧЁТ ВЗРОСЛЫХ =====

  function calculateAdult() {
    var a = state.adult;
    var minDiam, maxDiam;
    if (a.gender === 'male') {
      minDiam = 7.5; maxDiam = 8.5;
    } else {
      minDiam = 7.0; maxDiam = 8.0;
    }

    var lowWeightThreshold = a.gender === 'female' ? 55 : 65;
    var selectedDiam;
    if (a.weight < lowWeightThreshold) {
      selectedDiam = minDiam;
      if (a.weight < 45) selectedDiam = Math.max(6.5, minDiam - 0.5);
    } else if (a.weight > 95) {
      selectedDiam = maxDiam;
      if (a.weight > 120) selectedDiam = Math.min(9.0, maxDiam + 0.5);
    } else {
      selectedDiam = (minDiam + maxDiam) / 2;
      selectedDiam = Math.round(selectedDiam * 2) / 2;
    }
    selectedDiam = Math.round(selectedDiam * 10) / 10;

    var depth;
    if (a.route === 'oral') {
      depth = a.gender === 'male' ? 23 : 21;
    } else {
      depth = a.gender === 'male' ? 25 : 23;
    }
    if (a.weight > 110) depth += 1;

    var catheterText;
    if (selectedDiam <= 7.0) catheterText = "10–12 Fr";
    else if (selectedDiam >= 8.0) catheterText = "14 Fr";
    else catheterText = "12 Fr";

    return {
      diameter: selectedDiam.toFixed(1),
      depth: depth,
      cuff: "С манжетой (стандарт)",
      catheter: catheterText
    };
  }

  // ===== РАСЧЁТ ДЕТЕЙ =====

  function getPediatricMatch(ageYears, weightKg) {
    for (var i = 0; i < PEDIATRIC_TABLE.length; i++) {
      var row = PEDIATRIC_TABLE[i];
      var ageOk = ageYears >= row.ageMin && ageYears <= row.ageMax;
      var weightOk = weightKg >= row.weightMin && weightKg <= row.weightMax;
      if (ageOk && weightOk) return { diam: row.diam, depthOral: row.depthOral, catheter: row.catheter, cuff: row.cuff };
    }
    for (var j = 0; j < PEDIATRIC_TABLE.length; j++) {
      var row2 = PEDIATRIC_TABLE[j];
      if (ageYears <= row2.ageMax + 0.5 && weightKg <= row2.weightMax + 3) {
        return { diam: row2.diam, depthOral: row2.depthOral, catheter: row2.catheter, cuff: row2.cuff };
      }
    }
    var diamFormula = Math.min(8.0, Math.max(2.5, (ageYears / 4) + 4));
    var depthFormula = (ageYears / 2) + 12;
    var cuffRec = ageYears >= 8;
    var cath = diamFormula <= 3.0 ? 6 : diamFormula <= 4.0 ? 8 : diamFormula <= 6.0 ? 10 : 12;
    return { diam: diamFormula, depthOral: depthFormula, catheter: cath, cuff: cuffRec };
  }

  function adjustPediatricDiameterByWeight(baseDiam, ageYears, weightKg) {
    var expectedWeight;
    if (ageYears <= 1) expectedWeight = 3.5 + ageYears * 6;
    else if (ageYears <= 10) expectedWeight = 10 + (ageYears - 1) * 2.5;
    else expectedWeight = 30 + (ageYears - 10) * 4;
    if (expectedWeight < 0.5) expectedWeight = 3;

    var ratio = weightKg / expectedWeight;
    if (ratio > 1.3 && weightKg > 15) return Math.min(8.5, baseDiam + 0.5);
    if (ratio < 0.7 && weightKg < 10 && ageYears > 0.5) return Math.max(2.5, baseDiam - 0.5);
    return baseDiam;
  }

  function calculatePediatric() {
    var p = state.pediatric;
    var age = p.age === null ? 0 : p.age;
    var weight = p.weight === null ? 3.0 : p.weight;
    if (age < 0) age = 0;
    if (weight <= 0) weight = 3.0;

    var match = getPediatricMatch(age, weight);
    var diameter = adjustPediatricDiameterByWeight(match.diam, age, weight);
    if (age < 8) match.cuff = false;
    if (weight < 1.0) diameter = 2.5;
    if (weight < 2.0 && diameter > 3.0) diameter = 3.0;

    var depth;
    if (p.route === 'oral') {
      depth = match.depthOral;
    } else {
      depth = (age / 2) + 15;
      if (depth < 8) depth = 8;
    }

    diameter = Math.round(diameter * 10) / 10;
    depth = Math.round(depth * 10) / 10;

    return {
      diameter: diameter.toFixed(1),
      depth: depth,
      cuff: match.cuff ? "С манжетой" : "Без манжеты",
      catheter: match.catheter ? match.catheter + " Fr" : "—"
    };
  }

  // ===== РЕНДЕРИНГ =====

  function renderModeSwitcher() {
    return '<div class="ett-mode-switcher">' +
      '<button type="button" class="ett-mode-btn' + (state.mode === "adult" ? ' active' : '') + '" data-mode="adult">' +
        '<span>🧑</span><div class="ett-mode-label">Взрослые</div></button>' +
      '<button type="button" class="ett-mode-btn' + (state.mode === "pediatric" ? ' active' : '') + '" data-mode="pediatric">' +
        '<span>👶</span><div class="ett-mode-label">Дети (0–14 лет)</div></button>' +
    '</div>';
  }

  function renderAdultForm() {
    var a = state.adult;
    return '<div class="ett-section card">' +
      '<div class="ett-section-title">🧑 Параметры взрослого пациента</div>' +

      '<div class="ett-input-group">' +
        '<label class="ett-input-label">Пол пациента</label>' +
        '<div class="ett-radio-group">' +
          '<label class="ett-radio-label"><input type="radio" name="gender" value="male"' + (a.gender === "male" ? ' checked' : '') + '> Мужчина</label>' +
          '<label class="ett-radio-label"><input type="radio" name="gender" value="female"' + (a.gender === "female" ? ' checked' : '') + '> Женщина</label>' +
        '</div></div>' +

      '<div class="ett-input-group">' +
        '<label class="ett-input-label">⚖️ Вес (кг)</label>' +
        '<div class="ett-input-row">' +
          '<input type="text" id="adultWeight" class="ett-field" inputmode="decimal" placeholder="70" value="' + (a.weight !== null ? a.weight : "") + '">' +
          '<span class="ett-unit">кг</span></div>' +
        '<div class="ett-hint">Влияет на точный диаметр трубки</div></div>' +

      '<div class="ett-input-group">' +
        '<label class="ett-input-label">🎯 Тип интубации</label>' +
        '<div class="ett-radio-group">' +
          '<label class="ett-radio-label"><input type="radio" name="adultRoute" value="oral"' + (a.route === "oral" ? ' checked' : '') + '> Оральная</label>' +
          '<label class="ett-radio-label"><input type="radio" name="adultRoute" value="nasal"' + (a.route === "nasal" ? ' checked' : '') + '> Назальная</label>' +
        '</div></div>' +

      '<div class="ett-info-note">💡 При низком весе выбирается нижняя граница, при высоком — верхняя. При ожирении (+25 кг от нормы) диаметр +0.5 мм.</div>' +
    '</div>';
  }

  function renderPediatricForm() {
    var p = state.pediatric;
    return '<div class="ett-section card">' +
      '<div class="ett-section-title">👶 Параметры ребёнка</div>' +

      '<div class="ett-input-row-2">' +
        '<div class="ett-input-group" style="flex:1;">' +
          '<label class="ett-input-label">📅 Возраст (лет)</label>' +
          '<input type="text" id="pedAge" class="ett-field" inputmode="decimal" placeholder="4" value="' + (p.age !== null ? p.age : "") + '">' +
          '<div class="ett-hint">Можно дробное: 0.5 = 6 мес</div></div>' +

        '<div class="ett-input-group" style="flex:1;">' +
          '<label class="ett-input-label">⚖️ Вес (кг)</label>' +
          '<input type="text" id="pedWeight" class="ett-field" inputmode="decimal" placeholder="16" value="' + (p.weight !== null ? p.weight : "") + '">' +
          '<div class="ett-hint">Критически важен для новорождённых</div></div>' +
      '</div>' +

      '<div class="ett-input-group">' +
        '<label class="ett-input-label">🎯 Тип интубации</label>' +
        '<div class="ett-radio-group">' +
          '<label class="ett-radio-label"><input type="radio" name="pedRoute" value="oral"' + (p.route === "oral" ? ' checked' : '') + '> Оральная</label>' +
          '<label class="ett-radio-label"><input type="radio" name="pedRoute" value="nasal"' + (p.route === "nasal" ? ' checked' : '') + '> Назальная</label>' +
        '</div></div>' +

      '<div class="ett-info-note">ℹ️ Детям до 8 лет рекомендованы трубки <strong>без манжеты</strong>. Вес корректирует диаметр при несоответствии возрасту.</div>' +
    '</div>';
  }

  function renderResult() {
    var res = state.mode === "adult" ? calculateAdult() : calculatePediatric();
    var modeText = state.mode === "adult" ? "🧑 Взрослый" : "👶 Ребёнок";
    var detailsText = state.mode === "adult"
      ? (state.adult.gender === "male" ? "мужчина" : "женщина") + ", вес " + state.adult.weight + " кг, " + (state.adult.route === "oral" ? "оральная" : "назальная") + " интубация"
      : "возраст " + (state.pediatric.age || 0) + " лет, вес " + (state.pediatric.weight || 0) + " кг, " + (state.pediatric.route === "oral" ? "оральная" : "назальная") + " интубация";

    return '<div class="result-content result-success ett-result">' +
      '<div class="ett-result-grid">' +
        '<div class="ett-result-column">' +
          '<div class="ett-result-type">Диаметр</div>' +
          '<div class="ett-result-main">' + res.diameter + ' мм</div></div>' +
        '<div class="ett-result-divider-v"></div>' +
        '<div class="ett-result-column">' +
          '<div class="ett-result-type">Глубина</div>' +
          '<div class="ett-result-main">' + res.depth + ' см</div></div>' +
        '<div class="ett-result-divider-v"></div>' +
        '<div class="ett-result-column">' +
          '<div class="ett-result-type">Манжета</div>' +
          '<div class="ett-result-main" style="font-size:1.1rem;">' + res.cuff + '</div></div>' +
        '<div class="ett-result-divider-v"></div>' +
        '<div class="ett-result-column">' +
          '<div class="ett-result-type">Катетер</div>' +
          '<div class="ett-result-main" style="font-size:1.2rem;">' + res.catheter + '</div></div>' +
      '</div>' +
      '<div class="ett-result-summary">' + modeText + ': ' + detailsText + '</div>' +
      resetButtonHtml() +
    '</div>';
  }

  function fullRender() {
    bodyEl.innerHTML = renderModeSwitcher() +
      (state.mode === "adult" ? renderAdultForm() : renderPediatricForm());
    panelEl.innerHTML = renderResult();
    bindListeners();
  }

  function bindListeners() {
    if (state.mode === "adult") {
      document.querySelectorAll('input[name="gender"]').forEach(function (r) {
        r.addEventListener("change", function () {
          state.adult.gender = r.value;
          panelEl.innerHTML = renderResult();
        });
      });
      document.querySelectorAll('input[name="adultRoute"]').forEach(function (r) {
        r.addEventListener("change", function () {
          state.adult.route = r.value;
          panelEl.innerHTML = renderResult();
        });
      });
      var wEl = document.getElementById("adultWeight");
      if (wEl) wEl.addEventListener("input", function () {
        var v = parseNum(wEl.value);
        state.adult.weight = v !== null && v >= 30 ? v : (v !== null && v > 0 ? v : 70);
        panelEl.innerHTML = renderResult();
      });
    } else {
      document.querySelectorAll('input[name="pedRoute"]').forEach(function (r) {
        r.addEventListener("change", function () {
          state.pediatric.route = r.value;
          panelEl.innerHTML = renderResult();
        });
      });
      var ageEl = document.getElementById("pedAge");
      var weightEl = document.getElementById("pedWeight");
      if (ageEl) ageEl.addEventListener("input", function () {
        var v = parseNum(ageEl.value);
        state.pediatric.age = v !== null ? Math.max(0, Math.min(14, v)) : null;
        panelEl.innerHTML = renderResult();
      });
      if (weightEl) weightEl.addEventListener("input", function () {
        var v = parseNum(weightEl.value);
        state.pediatric.weight = v !== null ? Math.max(0.5, Math.min(70, v)) : null;
        panelEl.innerHTML = renderResult();
      });
    }
  }

  function resetAll() {
    state = {
      mode: "adult",
      adult: { gender: "male", weight: 70, route: "oral" },
      pediatric: { age: 4, weight: 16, route: "oral" }
    };
    fullRender();
  }

  function init() {
    bodyEl = document.getElementById("calcBody");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    fullRender();

    bodyEl.addEventListener("click", function (e) {
      var modeBtn = e.target.closest(".ett-mode-btn");
      if (modeBtn) {
        state.mode = modeBtn.getAttribute("data-mode");
        fullRender();
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

  CU.autoPersist("smp-calc-ett-v1");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();