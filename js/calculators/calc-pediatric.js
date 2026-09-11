(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var LIMITS = {
    weight: { min: 1, max: 120, warnThreshold: 60 },
    height: { min: 40, max: 200, warnThreshold: 170 },
    age:    { min: 0, max: 18,  warnThreshold: 14 }
  };

  var DRUGS = {
    epinephrine: {
      name: "Адреналин 0.182% — 1 мл", icon: "❤️", cat: "resuscitation",
      ampouleConc: 1, ampouleVol: 1, dilutedConc: 0.1,
      dilutionDesc: "1 мл + 9 мл NaCl 0.9% = 10 мл (1:10000)",
      doseMgKg: 0.01, maxDoseMg: 1, route: "В/в, внутрикостно",
      repeatInterval: "Каждые 3–5 мин",
      warning: "Макс. 1 мг (вес > 40 кг). Не превышать разовую дозу!",
      useDiluted: true
    },
    amiodarone: {
      name: "Амиодарон 5% — 3 мл", icon: "💓", cat: "resuscitation",
      ampouleConc: 50, ampouleVol: 3,
      dilutionDesc: "Разводить только в глюкозе 5%",
      doseMgKg: 5, maxDoseMg: 300, route: "В/в, внутрикостно",
      repeatInterval: "Повторить до макс. 15 мг/кг",
      warning: "Риск АВ-блокады! Off-label до 3 лет", useDiluted: false
    },
    lidocaine: {
      name: "Лидокаин 10% — 2 мл", icon: "💓", cat: "resuscitation",
      ampouleConc: 100, ampouleVol: 2,
      dilutionDesc: "Альтернатива амиодарону. Также есть форма 2% (20 мг/мл)",
      doseMgKg: 1, maxDoseMg: 100, route: "В/в струйно",
      repeatInterval: "Титрование 20–50 мкг/кг/мин",
      warning: "При ФЖ/ЖТ без пульса", useDiluted: false
    },
    atropine: {
      name: "Атропин 0.1% — 1 мл", icon: "💔", cat: "resuscitation",
      ampouleConc: 1, ampouleVol: 1,
      doseMgKg: 0.02, maxDoseMg: 1, route: "В/в",
      repeatInterval: "Повтор через 5 мин",
      warning: "Только при ваготонии, ФОС-отравлениях!", useDiluted: false
    },
    norepinephrine: {
      name: "Норадреналин 0.2% — 4 мл", icon: "📈", cat: "vasoactive",
      ampouleConc: 2, ampouleVol: 4, totalMgPerAmpoule: 8,
      startDoseMcgKgMin: 0.1, maxDoseMcgKgMin: 0.3, titrationStep: 0.05,
      route: "В/в капельно (только ЦВК!)",
      dilutionDesc: "2 мл + 48 мл глюкозы 5% (шприц) или 20 мл + 480 мл (капельница)",
      protocolNote: "При некупирующейся артериальной гипотензии (АД < 10-го процентиля). Скорость 10–20 кап/мин.",
      warning: "Только через ЦВК! Титровать до АД > 25-го процентиля",
      useDiluted: false, isInfusomat: true
    },
    prednisolone: {
      name: "Преднизолон 3% — 1 мл", icon: "💊", cat: "vasoactive",
      ampouleConc: 30, ampouleVol: 1,
      dilutionDesc: "На 10–20 мл NaCl 0.9%",
      doseMgKg: 2, maxDoseMg: 120, route: "В/в струйно",
      warning: "Контроль АД после введения", useDiluted: false
    },
    dexamethasone: {
      name: "Дексаметазон 0.4% — 1 мл", icon: "💊", cat: "vasoactive",
      ampouleConc: 4, ampouleVol: 1,
      dilutionDesc: "Эквивалент преднизолону 1:7",
      doseMgKg: 0.15, maxDoseMg: 16, route: "В/в, в/м",
      warning: "Альтернатива преднизолону", useDiluted: false
    },
    furosemide: {
      name: "Фуросемид 1% — 2 мл", icon: "💧", cat: "vasoactive",
      ampouleConc: 10, ampouleVol: 2,
      dilutionDesc: "Дети: 0.5–1.5 мг/кг/сут",
      doseMgKg: 1, maxDoseMg: 20, route: "В/в, в/м медленно",
      repeatInterval: "Повтор через 20 мин при неэффективности",
      warning: "Макс. суточная 20 мг! В/в детям до 15 лет — только в исключительных случаях", useDiluted: false
    },
    diazepam: {
      name: "Диазепам 0.5% — 2 мл", icon: "🧠", cat: "anticonvulsant",
      ampouleConc: 5, ampouleVol: 2,
      dilutionDesc: "Судороги: 0.3–0.4 мг/кг. Столбняк: 0.1–0.3 мг/кг",
      doseMgKg: 0.3, maxDoseMg: 10, route: "В/в медленно (3–5 мин)",
      repeatInterval: "Повтор через 10 мин при необходимости",
      warning: "Риск апноэ! Скорость ≤ 5 мг/мин. Макс. 10 мг на дозу", useDiluted: false
    },
    midazolam: {
      name: "Мидазолам 0.5% — 1 мл", icon: "🧠", cat: "anticonvulsant",
      ampouleConc: 5, ampouleVol: 3,
      dilutionDesc: "Ректально: 0.3–0.5 мг/кг",
      doseMgKg: 0.1, maxDoseMg: 10, route: "В/в, в/м, ректально",
      warning: "Альтернатива диазепаму", useDiluted: false
    },
    analgin: {
      name: "Анальгин 50% — 2 мл", icon: "💊", cat: "analgesic",
      ampouleConc: 500, ampouleVol: 2,
      dilutionDesc: "8–16 мг/кг (для t°: 10 мг/кг). Начало через 30 мин",
      doseMgKg: 10, maxDoseMg: 1000, route: "В/в медленно, в/м",
      repeatInterval: "До 4 раз/сут, интервал 6–8 ч",
      warning: "⛔ До 3 мес. не применять! 3–11 мес. только в/м! Риск агранулоцитоза", useDiluted: false
    },
    tramadol: {
      name: "Трамадол 5% — 1 мл", icon: "💊", cat: "analgesic",
      ampouleConc: 50, ampouleVol: 1,
      dilutionDesc: "Дети 1–14 лет: 1–2 мг/кг. Макс. суточная 4–8 мг/кг",
      doseMgKg: 1.5, maxDoseMg: 100, route: "В/в, в/м",
      repeatInterval: "Каждые 4–6 часов",
      warning: "Слабый опиоид. >14 лет: 50–100 мг, макс. 400 мг/сут", useDiluted: false
    },
    morphine: {
      name: "Морфин 1% — 1 мл", icon: "💊", cat: "analgesic",
      ampouleConc: 10, ampouleVol: 1,
      dilutionDesc: "П/к: 0.05–0.2 мг/кг. В/в: 0.05–0.1 мг/кг. Инфузия: 0.01–0.02 мг/кг/ч",
      doseMgKg: 0.1, maxDoseMg: 10, route: "В/в медленно, п/к",
      repeatInterval: "Каждые 4–6 часов",
      warning: "⛔ Не рекомендуется < 1 года! Наркотический анальгетик!", useDiluted: false
    },
    dimedrol: {
      name: "Димедрол 1% — 1 мл", icon: "🤧", cat: "antihistamine",
      ampouleConc: 10, ampouleVol: 1,
      dilutionDesc: "7–12 мес: 3–5 мг | 1–3 г: 5–10 мг | 4–6 л: 10–15 мг | 7–14 л: 15–30 мг",
      doseMgKg: 0.5, maxDoseMg: 50, route: "В/м, в/в медленно",
      repeatInterval: "Каждые 6–8 часов, 1–3 раза/сут",
      warning: "Макс. суточная 200 мг. >14 лет: 10–50 мг", useDiluted: false
    },
    drotaverine: {
      name: "Дротаверин 2% — 2 мл", icon: "💊", cat: "spasmolytic",
      ampouleConc: 20, ampouleVol: 2,
      dilutionDesc: "Дети: 10–20 мг (0.5–1 мл). Взрослые: 40–80 мг (2–4 мл)",
      doseMgKg: 0.5, maxDoseMg: 80, route: "В/м, в/в медленно",
      repeatInterval: "1–3 раза/сут",
      warning: "В/в вводить медленно! Риск коллапса", useDiluted: false
    },
    paracetamol: {
      name: "Парацетамол 1% — 100 мл", icon: "🌡️", cat: "antipyretic",
      ampouleConc: 10, ampouleVol: 100,
      dilutionDesc: "Сироп 30 мг/мл, свечи, инфузия 10 мг/мл",
      doseMgKg: 15, maxDoseMg: 1000, route: "В/в, внутрь, ректально",
      repeatInterval: "Каждые 4–6 часов, макс. 4 раза/сут",
      warning: "Макс. суточная 60 мг/кг", useDiluted: false
    },
    ibuprofen: {
      name: "Ибупрофен (суспензия)", icon: "🌡️", cat: "antipyretic",
      ampouleConc: 20, ampouleVol: 100,
      doseMgKg: 10, maxDoseMg: 400, route: "Внутрь",
      repeatInterval: "Каждые 6–8 часов",
      warning: "С 6 месяцев жизни", useDiluted: false
    },
    berodual: {
      name: "Беродуал (фенотерол/ипратропия)", icon: "🌬️", cat: "bronchodilator",
      ampouleConc: 0.75, ampouleVol: 2,
      dilutionDesc: "<6 лет (<22 кг): 0.5 мл | 6–12 лет: 0.5–1 мл | >12 лет: 1 мл",
      doseMgKg: 0.015, maxDoseMg: 1, route: "Ингаляции через небулайзер",
      repeatInterval: "Каждые 20 мин × 3 в 1-й час",
      warning: "Концентрация: 500 мкг фенотерола + 250 мкг ипратропия/мл", useDiluted: false
    },
    ceftriaxone: {
      name: "Цефтриаксон", icon: "💉", cat: "antibiotic",
      ampouleConc: 100, ampouleVol: 10,
      dilutionDesc: "Развести в воде для инъекций",
      doseMgKg: 50, maxDoseMg: 2000, route: "В/в капельно (30+ мин)",
      repeatInterval: "1 раз в сутки",
      warning: "При менингите: 100 мг/кг", useDiluted: false
    },
    cefotaxime: {
      name: "Цефотаксим", icon: "💉", cat: "antibiotic",
      ampouleConc: 100, ampouleVol: 10,
      dilutionDesc: "4–6 разовых доз в сутки",
      doseMgKg: 50, maxDoseMg: 2000, route: "В/в, в/м",
      repeatInterval: "При менингите — высшие дозы",
      warning: "Альтернатива цефтриаксону", useDiluted: false
    }
  };

  var EQUIPMENT = {
    ettUncuffed:  { name: "ЭТТ без манжеты", icon: "🌬️", unit: "мм (ID)" },
    ettCuffed:    { name: "ЭТТ с манжетой",  icon: "🌬️", unit: "мм (ID)", minCuff: 20, maxCuff: 25 },
    laryngoscope: { name: "Клинок ларингоскопа", icon: "👁️", unit: "размер" },
    mask:         { name: "Маска ИВЛ", icon: "😷", unit: "размер" },
    gastricTube:  { name: "Зонд для промывания желудка", icon: "🔬", unit: "Fr", route: "Орогастрально" },
    tidalVolume:  { name: "Дыхательный объём", icon: "🫁", unit: "мл" }
  };

  var ZONES = [
    { min: 0,  max: 5,  color: "#E91E63", label: "Розовая",          age: "0–3 мес" },
    { min: 5,  max: 7,  color: "#9C27B0", label: "Фиолетовая",       age: "3–6 мес" },
    { min: 7,  max: 9,  color: "#3F51B5", label: "Синяя",            age: "6–12 мес" },
    { min: 9,  max: 11, color: "#03A9F4", label: "Голубая",          age: "1–2 года" },
    { min: 11, max: 14, color: "#00BCD4", label: "Бирюзовая",        age: "2–3 года" },
    { min: 14, max: 16, color: "#4CAF50", label: "Зелёная",          age: "3–4 года" },
    { min: 16, max: 19, color: "#8BC34A", label: "Светло-зелёная",   age: "4–5 лет" },
    { min: 19, max: 23, color: "#FFEB3B", label: "Жёлтая",           age: "5–6 лет" },
    { min: 23, max: 27, color: "#FFC107", label: "Оранжевая",        age: "6–8 лет" },
    { min: 27, max: 36, color: "#FF9800", label: "Тёмно-оранжевая",  age: "8–10 лет" }
  ];

  var REFERENCE = {
    title: "О калькуляторе",
    paragraphs: [
      "Лента Брослоу (Broselow tape) — цветная измерительная лента для быстрой оценки веса ребёнка по росту и определения дозировок и размеров оборудования.",
      "Формула Best для 1–10 лет: Вес = 3 × возраст + 7. Дозы по рекомендациям PALS и European Resuscitation Council."
    ],
    importantNote: "Калькулятор для экстренных ситуаций, когда точное взвешивание невозможно. При возможности используйте реальный вес. Дозы ориентировочные — корректируйте по клинической ситуации."
  };

  var state = {
    weight: null, height: null, age: null,
    norepinephrineDilution: 50
  };
  var weightEl, heightEl, ageEl, warningEl, panelEl;

  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function round2(x) { return Math.round(x * 100) / 100; }
  function round3(x) { return Math.round(x * 1000) / 1000; }
  function round1(x) { return Math.round(x * 10) / 10; }

  function estimateWeightByAge(age) {
    if (age <= 1) return 3 + age * 12 * 0.5;
    if (age <= 10) return 3 * age + 7;
    return 3 * age + 7 + (age - 10) * 2;
  }

  function estimateWeightByHeight(h) {
    if (h < 100) return (h - 50) * 0.3;
    return (h - 100) * 0.9;
  }

  function getZone(w) {
    for (var i = 0; i < ZONES.length; i++)
      if (w >= ZONES[i].min && w < ZONES[i].max) return ZONES[i];
    return ZONES[ZONES.length - 1];
  }

  function getEffectiveAge() {
    if (state.age !== null) return state.age;
    if (state.weight !== null) {
      var w = state.weight;
      if (w <= 4.5) return Math.max(0, (w - 3) / 0.5 / 12);
      if (w <= 37) return Math.max(1, (w - 7) / 3);
      return Math.min(18, (w + 13) / 5);
    }
    if (state.height !== null) {
      var h = state.height;
      if (h < 75) return Math.max(0, (h - 50) / 25);
      if (h < 100) return 1 + (h - 75) / 6;
      if (h < 140) return 4 + (h - 100) / 6;
      if (h < 160) return 10 + (h - 140) / 5;
      return Math.min(18, 14 + (h - 160) / 3);
    }
    return null;
  }

  function getVitals(age) {
    if (age === null) return null;
    var hr, rr, sbp, dbp;
    if (age < 0.08) {
      hr = [120, 160]; rr = [30, 60]; sbp = [60, 90]; dbp = [40, 60];
    } else if (age < 1) {
      hr = [100, 160]; rr = [25, 50]; sbp = [70, 100]; dbp = [45, 70];
    } else if (age <= 3) {
      hr = [90, 140]; rr = [24, 40]; sbp = [70 + 2*age, 100 + 2*age]; dbp = [50, 70];
    } else if (age <= 6) {
      hr = [80, 120]; rr = [22, 34]; sbp = [70 + 2*age, 110]; dbp = [55, 75];
    } else if (age <= 12) {
      hr = [70, 110]; rr = [18, 30]; sbp = [70 + 2*age, 120]; dbp = [60, 80];
    } else {
      hr = [60, 100]; rr = [12, 20]; sbp = [90, 130]; dbp = [60, 85];
    }
    return { hr: hr, rr: rr, sbp: sbp, dbp: dbp };
  }

  function validate() {
    var warnings = [];
    if (state.weight !== null) {
      if (state.weight > LIMITS.weight.max + 10) {
        state.weight = LIMITS.weight.max;
        if (weightEl && document.activeElement !== weightEl) weightEl.value = LIMITS.weight.max;
        warnings.push("⚠️ Вес ограничен максимумом " + LIMITS.weight.max + " кг");
      }
      if (state.weight < LIMITS.weight.min && state.weight !== 0) {
        state.weight = LIMITS.weight.min;
        if (weightEl && document.activeElement !== weightEl) weightEl.value = LIMITS.weight.min;
      }
      if (state.weight >= LIMITS.weight.warnThreshold) {
        warnings.push("👤 Вес " + state.weight.toFixed(1) + " кг — возможна взрослая масса тела");
      }
    }
    if (state.height !== null) {
      if (state.height > LIMITS.height.max + 10) {
        state.height = LIMITS.height.max;
        if (heightEl && document.activeElement !== heightEl) heightEl.value = LIMITS.height.max;
        warnings.push("⚠️ Рост ограничен максимумом " + LIMITS.height.max + " см");
      }
      if (state.height < LIMITS.height.min && state.height !== 0) {
        state.height = LIMITS.height.min;
        if (heightEl && document.activeElement !== heightEl) heightEl.value = LIMITS.height.min;
      }
      if (state.height >= LIMITS.height.warnThreshold) {
        warnings.push("👤 Рост " + state.height.toFixed(0) + " см — параметры подростка");
      }
    }
    if (state.age !== null) {
      if (state.age > LIMITS.age.max + 2) {
        state.age = LIMITS.age.max;
        if (ageEl && document.activeElement !== ageEl) ageEl.value = LIMITS.age.max;
        warnings.push("⚠️ Возраст ограничен " + LIMITS.age.max + " годами");
      }
      if (state.age < LIMITS.age.min && state.age !== 0) {
        state.age = LIMITS.age.min;
        if (ageEl && document.activeElement !== ageEl) ageEl.value = LIMITS.age.min;
      }
      if (state.age >= LIMITS.age.warnThreshold) {
        warnings.push("👤 Возраст " + state.age.toFixed(1) + " лет — подросток, учитывайте взрослые дозировки");
      }
    }
    if (warnings.length === 0) {
      warningEl.hidden = true;
    } else {
      warningEl.hidden = false;
      warningEl.innerHTML =
        '<div class="limits-warning-header"><span>⚠️</span><span>Внимание</span></div>' +
        '<ul class="limits-warning-list">' +
          warnings.map(function (w) { return "<li>" + w + "</li>"; }).join("") +
        '</ul>';
    }
  }

  function renderDrug(id, w) {
    var d = DRUGS[id];
    if (!d) return "";

    var calc = d.doseMgKg * w;
    var isAdult = calc > d.maxDoseMg;
    var doseMg = Math.min(calc, d.maxDoseMg);
    var weightForMax = d.maxDoseMg / d.doseMgKg;

    var vol = d.useDiluted && d.dilutedConc
      ? doseMg / d.dilutedConc
      : doseMg / d.ampouleConc;

    var doseR = round2(doseMg);
    var mlR = vol < 0.1 ? round3(vol) : round2(vol);
    var amp = Math.ceil((vol / d.ampouleVol) * 10) / 10;

    var ageWarning = "";
    if (id === "ibuprofen" && state.age !== null && state.age < 0.5) {
      ageWarning = '<div class="drug-age-warning">⛔ Противопоказан до 6 мес!</div>';
    }

    var adultBanner = isAdult
      ? '<div class="adult-dose-banner"><span>👤</span><div><div class="adult-dose-title">Взрослая дозировка</div><div class="adult-dose-subtitle">Достигается при весе ' + weightForMax.toFixed(0) + ' кг и выше</div></div></div>'
      : "";

    var specialInfo = d.specialUnit
      ? '<div class="drug-detail"><span class="drug-label">Дозировка:</span><span class="drug-value">' + d.specialDose + " " + d.specialUnit + "</span></div>"
      : '<div class="drug-detail"><span class="drug-label">Дозировка:</span><span class="drug-value">' + d.doseMgKg + " мг/кг</span></div>";

    var limited = isAdult
      ? '<div class="drug-detail limited"><span class="drug-label">Расчётная доза:</span><span class="drug-value">' + Math.round(calc) + " мг → ограничена</span></div>"
      : "";

    var diluted = d.useDiluted && d.dilutedConc
      ? '<div class="drug-detail highlight"><span class="drug-label">Конц. развед.:</span><span class="drug-value">' + d.dilutedConc + " мг/мл</span></div>"
      : "";

    var dilutionDesc = d.dilutionDesc
      ? '<div class="drug-detail"><span class="drug-label">Разведение:</span><span class="drug-value">' + CU.escapeHtml(d.dilutionDesc) + "</span></div>"
      : "";

    var repeat = d.repeatInterval
      ? '<div class="drug-detail"><span class="drug-label">Повтор:</span><span class="drug-value">' + CU.escapeHtml(d.repeatInterval) + "</span></div>"
      : "";

    var doseNote = d.useDiluted ? '<div class="drug-dose-note">объём разведённого раствора</div>' : "";

    var warning = d.warning ? '<div class="drug-warning">⚠️ ' + CU.escapeHtml(d.warning) + "</div>" : "";

    return '<div class="pediatric-drug-card' + (isAdult ? " adult-dose-card" : "") + '">' +
      '<div class="drug-header"><span>' + d.icon + '</span><div class="drug-name">' + CU.escapeHtml(d.name) + "</div></div>" +
      adultBanner +
      '<div class="drug-dose-section">' +
        '<div class="drug-dose-label">' + (isAdult ? "Взрослая разовая доза:" : "Разовая доза:") + "</div>" +
        '<div class="drug-doses">' +
          '<div class="drug-dose-item"><div class="drug-dose-main">' + doseR + '</div><div class="drug-dose-unit">мг</div></div>' +
          '<div class="drug-dose-separator">=</div>' +
          '<div class="drug-dose-item"><div class="drug-dose-volume">' + mlR + '</div><div class="drug-dose-unit">мл</div></div>' +
        '</div>' + doseNote +
      '</div>' +
      '<div class="drug-details">' +
        specialInfo + limited +
        '<div class="drug-detail"><span class="drug-label">Конц. ампулы:</span><span class="drug-value">' + d.ampouleConc + " мг/мл (" + d.ampouleVol + " мл)</span></div>" +
        diluted + dilutionDesc +
        '<div class="drug-detail"><span class="drug-label">Путь:</span><span class="drug-value">' + CU.escapeHtml(d.route) + "</span></div>" +
        repeat +
        '<div class="drug-detail max-dose-info"><span class="drug-label">Макс. (взрослая):</span><span class="drug-value">' + d.maxDoseMg + " мг</span></div>" +
        '<div class="drug-detail ampoules-info"><span class="drug-label">Нужно ампул:</span><span class="drug-value">' + amp + " × " + d.ampouleVol + " мл</span></div>" +
      '</div>' +
      ageWarning + warning +
    '</div>';
  }

  function renderNorepinephrine(w) {
    var d = DRUGS.norepinephrine;
    var dil = state.norepinephrineDilution;
    var totalMg = d.totalMgPerAmpoule;
    var totalMcg = totalMg * 1000;
    var concMcgMl = totalMcg / dil;

    var start = d.startDoseMcgKgMin;
    var speedH = (start * w * 60) / concMcgMl;
    var speedM = speedH / 60;
    var drops = speedM * 20;
    var titrH = (d.titrationStep * w * 60) / concMcgMl;

    return '<div class="pediatric-drug-card norepinephrine-card">' +
      '<div class="drug-header"><span>' + d.icon + '</span><div class="drug-name">' + CU.escapeHtml(d.name) + "</div></div>" +
      '<div class="ne-dilution-section">' +
        '<div class="ne-dilution-label">Объём разведения (инфузомат):</div>' +
        '<div class="ne-dilution-options">' +
          [20, 50, 100].map(function (v) {
            return '<button type="button" class="ne-dilution-btn' + (state.norepinephrineDilution === v ? ' active' : '') + '" data-dilution="' + v + '">' + v + " мл</button>";
          }).join("") +
        '</div>' +
      '</div>' +
      '<div class="ne-concentration"><span class="ne-conc-label">Концентрация:</span><span class="ne-conc-value">' + Math.round(concMcgMl) + ' мкг/мл</span><span class="ne-conc-detail">(' + totalMg + " мг / " + dil + " мл)</span></div>" +
      '<div class="ne-speed-section">' +
        '<div class="ne-speed-title">Стартовая скорость (' + start + " мкг/кг/мин):</div>" +
        '<div class="ne-speed-grid">' +
          '<div class="ne-speed-item"><div class="ne-speed-value">' + speedH.toFixed(2) + '</div><div class="ne-speed-unit">мл/ч</div></div>' +
          '<div class="ne-speed-separator">=</div>' +
          '<div class="ne-speed-item"><div class="ne-speed-value">' + speedM.toFixed(3) + '</div><div class="ne-speed-unit">мл/мин</div></div>' +
          '<div class="ne-speed-separator">=</div>' +
          '<div class="ne-speed-item"><div class="ne-speed-value">' + drops.toFixed(1) + '</div><div class="ne-speed-unit">кап/мин</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="ne-titration">' +
        '<div class="ne-titration-title"><span>🎛️</span> Титрование</div>' +
        '<div class="ne-titration-desc">Шаг: +' + d.titrationStep + "–" + (d.titrationStep*2) + " мкг/кг/мин (= +" + titrH.toFixed(2) + "–" + (titrH*2).toFixed(2) + " мл/ч)<br>До достижения АД > 25-го процентиля</div>" +
      '</div>' +
      '<div class="drug-details">' +
        '<div class="drug-detail"><span class="drug-label">Диапазон дозы:</span><span class="drug-value">' + d.startDoseMcgKgMin + "–" + d.maxDoseMcgKgMin + " мкг/кг/мин</span></div>" +
        '<div class="drug-detail"><span class="drug-label">Ампула:</span><span class="drug-value">' + d.ampouleConc + " мг/мл × " + d.ampouleVol + " мл</span></div>" +
        '<div class="drug-detail"><span class="drug-label">Растворитель:</span><span class="drug-value">Глюкоза 5% или NaCl 0.9%</span></div>' +
        '<div class="drug-detail"><span class="drug-label">Скорость:</span><span class="drug-value">10–20 кап/мин</span></div>' +
      '</div>' +
      '<div class="drug-warning">⚠️ ' + CU.escapeHtml(d.warning) + '</div>' +
    '</div>';
  }

  function renderDefib(w) {
    var MAX = 360;
    var s1 = Math.min(Math.round(w * 4), MAX);
    var s2 = s1, s3 = s1;
    var s4 = Math.min(Math.round(w * 6), MAX);
    var s5 = Math.min(Math.round(w * 8), MAX);
    var hitMax1 = w * 4 >= MAX;
    var hitMax4 = w * 6 >= MAX;

    var epi = Math.min(w * 0.01, 1).toFixed(2);
    var amio = Math.min(w * 5, 300);
    var lido = Math.min(w * 1, 100);

    return '<div class="defib-header">' +
      '<div class="defib-main"><div class="defib-value">' + s1 + ' Дж</div><div class="defib-label">Первый разряд (4 Дж/кг)</div></div>' +
      '<div class="defib-legend">' +
        '<div class="defib-legend-item"><span class="defib-legend-dot" style="background:#b42323"></span><span>Немедленный разряд → компрессии</span></div>' +
        '<div class="defib-legend-item"><span class="defib-legend-dot" style="background:var(--accent)"></span><span>СЛР 2 мин → оценка ритма</span></div>' +
        '<div class="defib-legend-item"><span class="defib-legend-dot" style="background:#c77700"></span><span>Введение препаратов</span></div>' +
      '</div></div>' +
      '<div class="defib-timeline">' +
        '<div class="defib-step shock"><div class="defib-step-num">1</div><div class="defib-step-content"><div class="defib-step-title">Разряд ' + s1 + ' Дж</div><div class="defib-step-desc">Немедленно при выявлении ФЖ/ЖТ. Сразу продолжить компрессии!</div>' + (hitMax1 ? '<div class="defib-max-note">⚠️ Достигнут максимум дефибриллятора</div>' : '') + '</div></div>' +
        '<div class="defib-step cpr"><div class="defib-step-num"><span>❤️</span></div><div class="defib-step-content"><div class="defib-step-title">СЛР 2 минуты</div><div class="defib-step-desc">Даже при восстановлении ритма — сердце не поддерживает гемодинамику ≥1 мин</div></div></div>' +
        '<div class="defib-step shock"><div class="defib-step-num">2</div><div class="defib-step-content"><div class="defib-step-title">Разряд ' + s2 + ' Дж (4 Дж/кг)</div><div class="defib-step-desc">Повтор при сохранении ФЖ/ЖТ</div></div></div>' +
        '<div class="defib-step cpr"><div class="defib-step-num"><span>❤️</span></div><div class="defib-step-content"><div class="defib-step-title">СЛР 2 минуты</div><div class="defib-step-desc">Оценка ритма и пульса</div></div></div>' +
        '<div class="defib-step drug"><div class="defib-step-num">💊</div><div class="defib-step-content"><div class="defib-step-title">Эпинефрин ' + epi + ' мг (10 мкг/кг)</div><div class="defib-step-desc">В/в или внутрикостно. Повторять каждые 3–5 мин</div></div></div>' +
        '<div class="defib-step shock"><div class="defib-step-num">3</div><div class="defib-step-content"><div class="defib-step-title">Разряд ' + s3 + ' Дж (4 Дж/кг)</div><div class="defib-step-desc">Сразу после введения эпинефрина</div></div></div>' +
        '<div class="defib-step cpr"><div class="defib-step-num"><span>❤️</span></div><div class="defib-step-content"><div class="defib-step-title">СЛР 2 минуты</div></div></div>' +
        '<div class="defib-step drug"><div class="defib-step-num">💓</div><div class="defib-step-content"><div class="defib-step-title">Антиаритмический препарат</div><div class="defib-step-desc"><strong>Амиодарон ' + amio + ' мг</strong> (5 мг/кг, макс 300) — предпочтительно<br><em>или</em> Лидокаин ' + lido + ' мг (1 мг/кг, макс 100)</div></div></div>' +
        '<div class="defib-step shock"><div class="defib-step-num">4</div><div class="defib-step-content"><div class="defib-step-title">Разряд ' + s4 + ' Дж (6 Дж/кг)</div><div class="defib-step-desc">Повышенная энергия</div>' + (hitMax4 && !hitMax1 ? '<div class="defib-max-note">⚠️ Достигнут максимум дефибриллятора</div>' : '') + '</div></div>' +
        '<div class="defib-step cpr"><div class="defib-step-num"><span>❤️</span></div><div class="defib-step-content"><div class="defib-step-title">СЛР 2 минуты</div></div></div>' +
        '<div class="defib-step max-shock"><div class="defib-step-num">5+</div><div class="defib-step-content"><div class="defib-step-title">Максимальный разряд: ' + s5 + ' Дж (8 Дж/кг)</div><div class="defib-step-desc">При неэффективности первых 5 разрядов.' + (s5 >= MAX ? ' <strong>Ограничено максимумом 360 Дж.</strong>' : '') + '</div></div></div>' +
      '</div>' +
      '<div class="defib-footer"><div class="defib-footer-note"><span>ℹ️</span> Цикл повторяется: СЛР 2 мин → разряд → препараты каждые 3–5 мин</div></div>';
  }

  function renderEquipment(id, w) {
    var e = EQUIPMENT[id];
    var value = "", details = "", warning = "", extraInfo = "";

    if (id === "ettUncuffed") {
      var age = state.age;
      if (age !== null && age > 1) {
        var size = round1(4 + age / 4);
        var depth = round1(3 * size);
        var depthAlt = round1(12 + age / 2);
        var stylet = size <= 4 ? "6 Fr" : (size <= 5.5 ? "10 Fr" : "14 Fr");
        value = size + " " + e.unit;
        details = "Формула Коула: 4 + возраст/4";
        extraInfo =
          '<div class="ett-details"><div class="ett-additional">' +
            '<div class="ett-additional-item"><span>📏</span><span class="ett-additional-label">Глубина:</span><span class="ett-additional-value">' + depth + ' см (от губ)</span></div>' +
            '<div class="ett-additional-item ett-additional-alt"><span>↔️</span><span class="ett-additional-label">Альтернативно:</span><span class="ett-additional-value">' + depthAlt + ' см (12 + возраст/2)</span></div>' +
            '<div class="ett-additional-item"><span>📐</span><span class="ett-additional-label">Стилет:</span><span class="ett-additional-value">' + stylet + '</span></div>' +
          '</div><div class="ett-safety-notes">' +
            '<div class="safety-note"><span>ℹ️</span><span>Классический выбор для детей < 8 лет</span></div>' +
            '<div class="safety-note"><span>✅</span><span>Верификация: аускультация + капнография</span></div>' +
          '</div></div>';
      } else if (age !== null && age <= 1) {
        var sz = age < 0.08 ? "3.0" : (age < 0.5 ? "3.5" : "3.5–4.0");
        var dpt = age < 0.08 ? "9" : (age < 0.5 ? "10" : "11");
        value = sz + " " + e.unit;
        details = age < 0.08 ? "новорождённый" : age.toFixed(1) + " лет";
        extraInfo =
          '<div class="ett-details"><div class="ett-additional">' +
            '<div class="ett-additional-item"><span>📏</span><span class="ett-additional-label">Глубина:</span><span class="ett-additional-value">' + dpt + ' см (от губ)</span></div>' +
          '</div><div class="ett-safety-notes">' +
            '<div class="safety-note"><span>✅</span><span>Предпочтительный вариант для детей < 1 года</span></div>' +
          '</div></div>';
      } else { value = "—"; details = "Укажите возраст"; }
    }

    else if (id === "ettCuffed") {
      var ageC = state.age;
      if (ageC !== null && ageC > 1) {
        var sizeC = round1(3.5 + ageC / 4);
        var depthC = round1(3 * sizeC);
        var depthCAlt = round1(12 + ageC / 2);
        var styletC = sizeC <= 4 ? "6 Fr" : (sizeC <= 5.5 ? "10 Fr" : "14 Fr");
        var cuffVol = sizeC <= 4 ? "2–3" : (sizeC <= 5 ? "3–5" : (sizeC <= 6 ? "5–7" : "7–10"));
        value = sizeC + " " + e.unit;
        details = "Формула: 3.5 + возраст/4";
        extraInfo =
          '<div class="ett-details"><div class="ett-additional">' +
            '<div class="ett-additional-item"><span>📏</span><span class="ett-additional-label">Глубина:</span><span class="ett-additional-value">' + depthC + ' см (от губ)</span></div>' +
            '<div class="ett-additional-item ett-additional-alt"><span>↔️</span><span class="ett-additional-label">Альтернативно:</span><span class="ett-additional-value">' + depthCAlt + ' см (12 + возраст/2)</span></div>' +
            '<div class="ett-additional-item"><span>🎯</span><span class="ett-additional-label">Давление манжеты:</span><span class="ett-additional-value">' + e.minCuff + "–" + e.maxCuff + ' см H₂O</span></div>' +
            '<div class="ett-additional-item"><span>💧</span><span class="ett-additional-label">Объём манжеты:</span><span class="ett-additional-value">' + cuffVol + ' мл воздуха</span></div>' +
            '<div class="ett-additional-item"><span>📐</span><span class="ett-additional-label">Стилет:</span><span class="ett-additional-value">' + styletC + '</span></div>' +
          '</div><div class="ett-safety-notes">' +
            '<div class="safety-note"><span>ℹ️</span><span>Современные манжеты высокого объёма/низкого давления безопасны в любом возрасте</span></div>' +
            '<div class="safety-note safety-warning"><span>⚠️</span><span>Контроль давления манжеты каждые 4–6 часов</span></div>' +
            '<div class="safety-note"><span>✅</span><span>Верификация: аускультация + капнография</span></div>' +
          '</div></div>';
      } else if (ageC !== null && ageC <= 1) {
        value = "—"; details = "Не применяется до 1 года";
        extraInfo = '<div class="ett-details"><div class="ett-safety-notes"><div class="safety-note safety-warning"><span>⚠️</span><span>У детей < 1 года используйте ЭТТ без манжеты</span></div></div></div>';
      } else { value = "—"; details = "Укажите возраст"; }
    }

    else if (id === "laryngoscope") {
      if (w === null) { value = "—"; details = "Укажите вес"; }
      else if (w < 3)  { value = "0"; details = "Прямой (Miller) · < 3 кг"; }
      else if (w < 5)  { value = "0"; details = "Прямой (Miller) · 3–5 кг"; }
      else if (w < 10) { value = "1"; details = "Прямой (Miller) · 5–10 кг"; }
      else if (w < 20) { value = "2"; details = "Прямой/Изогнутый · 10–20 кг"; }
      else if (w < 40) { value = "2"; details = "Изогнутый (Macintosh) · 20–40 кг"; }
      else             { value = "3"; details = "Изогнутый (Macintosh) · > 40 кг"; }
    }

    else if (id === "mask") {
      if (w === null) { value = "—"; details = "Укажите вес"; }
      else if (w < 3)  { value = "0"; details = "Новорождённый · < 3 кг"; }
      else if (w < 5)  { value = "1"; details = "Младенец · 3–5 кг"; }
      else if (w < 10) { value = "2"; details = "Ребёнок · 5–10 кг"; }
      else if (w < 20) { value = "3"; details = "Ребёнок · 10–20 кг"; }
      else if (w < 40) { value = "4"; details = "Подросток · 20–40 кг"; }
      else             { value = "5"; details = "Взрослая · > 40 кг"; }
    }

    else if (id === "tidalVolume") {
      if (w === null) { value = "—"; details = "Укажите вес"; }
      else { value = Math.round(w * 6) + "–" + Math.round(w * 8) + " " + e.unit; details = "6–8 мл/кг"; }
    }

    else if (id === "gastricTube") {
      var ageG = state.age;
      var maxVol = 300;
      var volPer = w ? Math.min(Math.round(w * 10), maxVol) : 0;

      if (ageG === null && w === null) {
        value = "—"; details = "Укажите возраст или вес";
        extraInfo = '<div class="ett-details"><div class="ett-safety-notes"><div class="safety-note"><span>ℹ️</span><span>Введите возраст или вес ребёнка</span></div></div></div>';
      } else if (ageG !== null && ageG < 1) {
        value = "—"; details = "Не рекомендуется";
        warning = "⛔ До 1 года крупнокалиберный зонд может вызвать брадикардию и ларингоспазм";
        extraInfo = '<div class="equip-alternative">Альтернатива: активированный уголь (при показаниях) + консультация токсиколога</div>';
      } else {
        var sizeRange = "";
        if      (ageG !== null && ageG < 4)  sizeRange = "18–20";
        else if (ageG !== null && ageG < 8)  sizeRange = "20–22";
        else if (ageG !== null && ageG < 13) sizeRange = "22–24";
        else if (ageG !== null)              sizeRange = "26–28";
        else if (w >= 10 && w < 16) sizeRange = "18–20";
        else if (w >= 16 && w < 23) sizeRange = "20–22";
        else if (w >= 23 && w < 41) sizeRange = "22–24";
        else if (w >= 41)           sizeRange = "26–28";
        else { value = "—"; details = "Недостаточно данных"; }

        if (sizeRange) {
          value = sizeRange + " " + e.unit;
          details = (ageG !== null ? ageG.toFixed(1) + " лет" : w.toFixed(0) + " кг");
          extraInfo =
            '<div class="ett-details">' +
              '<div class="safety-note safety-highlight"><span>🧮</span><span>Объём порции: <strong>' + volPer + " мл</strong> (" + (w ? w.toFixed(1) : "?") + " кг × 10 мл/кг)</span></div>" +
              '<div class="safety-note"><span>✅</span><span><strong>Орогастрально</strong> (не назально)</span></div>' +
              '<div class="safety-note"><span>🛏️</span><span>Положение Тренделенбурга на левом боку</span></div>' +
              '<div class="safety-note"><span>💧</span><span>Промывать тёплым физраствором до чистых вод</span></div>' +
              '<div class="safety-note"><span>⏱️</span><span>Показания: ≤1–2 ч после приёма токсина</span></div>' +
              '<div class="safety-note safety-warning"><span>⚠️</span><span>При нарушенном сознании — <strong>только после интубации!</strong></span></div>' +
              '<div class="safety-note"><span>✅</span><span>Верификация: аспирация желудочного содержимого</span></div>' +
            '</div>';
        }
      }
    }

    return '<div class="pediatric-equip-card' + (id === "gastricTube" ? ' equip-wide' : '') + '">' +
      '<div class="equip-icon"><span>' + e.icon + '</span></div>' +
      '<div class="equip-content">' +
        '<div class="equip-name">' + CU.escapeHtml(e.name) + "</div>" +
        '<div class="equip-value">' + value + "</div>" +
        '<div class="equip-details">' + CU.escapeHtml(details) + "</div>" +
        (e.route ? '<div class="equip-route">' + CU.escapeHtml(e.route) + "</div>" : "") +
        (warning ? '<div class="equip-warning">' + warning + "</div>" : "") +
        extraInfo +
      '</div></div>';
  }

  function renderAll() {
    if (state.weight === null && state.height === null && state.age === null) {
      panelEl.innerHTML =
        '<div class="result-content result-incomplete">' +
        '<div class="result-score"><div class="result-score-value">—</div><div class="result-score-label">нет данных</div></div>' +
        '<div class="result-divider"></div>' +
        '<div class="result-info"><div class="result-label">Заполните параметры</div><div class="result-description">Введите вес, рост или возраст ребёнка</div></div>' +
        '</div>';
      return;
    }

    var w = state.weight;
    if (w === null) {
      w = state.age !== null ? estimateWeightByAge(state.age) : estimateWeightByHeight(state.height);
    }
    var isEstimated = state.weight === null;
    var zone = getZone(w);
    var effAge = getEffectiveAge();
    var vitals = getVitals(effAge);

    var maintenanceMlH;
    if (w <= 10) maintenanceMlH = w * 4;
    else if (w <= 20) maintenanceMlH = 40 + (w - 10) * 2;
    else maintenanceMlH = 60 + (w - 20) * 1;

    var ageDisplay = state.age !== null
      ? state.age.toFixed(1) + " лет"
      : (effAge !== null ? "~" + effAge.toFixed(1) + " лет (оценка)" : "—");

    var heightDisplay = state.height !== null ? state.height.toFixed(0) + " см" : "—";

    var vitalsHtml = vitals
      ? '<div class="summary-row"><span class="summary-label">АД:</span><span class="summary-value">' + Math.round(vitals.sbp[0]) + "–" + Math.round(vitals.sbp[1]) + " / " + Math.round(vitals.dbp[0]) + "–" + Math.round(vitals.dbp[1]) + '</span></div>' +
        '<div class="summary-row"><span class="summary-label">ЧСС:</span><span class="summary-value">' + Math.round(vitals.hr[0]) + "–" + Math.round(vitals.hr[1]) + ' уд/мин</span></div>' +
        '<div class="summary-row"><span class="summary-label">ЧД:</span><span class="summary-value">' + Math.round(vitals.rr[0]) + "–" + Math.round(vitals.rr[1]) + ' /мин</span></div>'
      : '<div class="summary-row"><span class="summary-label">—</span><span class="summary-value">Укажите возраст</span></div>';

    var html =
      '<div class="pediatric-summary card" style="border-color: ' + zone.color + ';">' +
        '<div class="pediatric-summary-header" style="background: linear-gradient(135deg, ' + zone.color + '20 0%, ' + zone.color + '40 100%);">' +
          '<div class="broselow-zone-badge" style="background:' + zone.color + '; color:#fff;"><span class="broselow-zone-label">' + CU.escapeHtml(zone.label) + '</span></div>' +
          '<div class="broselow-weight">' + w.toFixed(1) + ' кг' + (isEstimated ? '<span class="estimated-badge">оценка</span>' : '') + '</div>' +
        '</div>' +
        '<div class="pediatric-summary-grid">' +
          '<div class="summary-column broselaw-column" style="border-left: 4px solid ' + zone.color + ';">' +
            '<div class="summary-column-title"><span>🎨</span> Лента Брослоу</div>' +
            '<div class="summary-row"><span class="summary-label">Цветовая зона:</span><span class="summary-value" style="color:' + zone.color + '; font-weight:600;">' + CU.escapeHtml(zone.label) + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">Вес:</span><span class="summary-value">' + w.toFixed(1) + ' кг ' + (isEstimated ? '(оценка)' : '') + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">Возраст:</span><span class="summary-value">' + ageDisplay + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">Рост:</span><span class="summary-value">' + heightDisplay + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">Группа:</span><span class="summary-value">' + CU.escapeHtml(zone.age) + '</span></div>' +
          '</div>' +
          '<div class="summary-column norms-column">' +
            '<div class="summary-column-title"><span>💓</span> Возрастные нормы</div>' +
            vitalsHtml +
          '</div>' +
        '</div>' +
      '</div>';

    // Экстренные препараты
    html +=
      '<div class="pediatric-section">' +
        '<div class="pediatric-section-title"><span>🚨</span> Экстренные препараты</div>' +
        '<div class="pediatric-drugs-grid">' +
          renderDrug("epinephrine", w) +
          renderDrug("amiodarone", w) +
          renderDrug("atropine", w) +
          renderDrug("prednisolone", w) +
          renderNorepinephrine(w) +
        '</div>' +
      '</div>';

    // Спойлер остальных
    html +=
      '<details class="drugs-spoiler card">' +
        '<summary class="drugs-spoiler-summary">' +
          '<div class="spoiler-left"><span>📦</span><span class="spoiler-title">Остальные препараты</span><span class="spoiler-count">15</span></div>' +
          '<span class="spoiler-arrow">▼</span>' +
        '</summary>' +
        '<div class="drugs-spoiler-content">' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>📈</span> Вазоактивные и диуретики</div><div class="pediatric-drugs-grid">' +
            renderDrug("dexamethasone", w) + renderDrug("furosemide", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🧠</span> Противосудорожные / Седация</div><div class="pediatric-drugs-grid">' +
            renderDrug("lidocaine", w) + renderDrug("diazepam", w) + renderDrug("midazolam", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>💊</span> Анальгетики</div><div class="pediatric-drugs-grid">' +
            renderDrug("analgin", w) + renderDrug("tramadol", w) + renderDrug("morphine", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🤧</span> Антигистаминные и спазмолитики</div><div class="pediatric-drugs-grid">' +
            renderDrug("dimedrol", w) + renderDrug("drotaverine", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🌡️</span> Жаропонижающие</div><div class="pediatric-drugs-grid">' +
            renderDrug("paracetamol", w) + renderDrug("ibuprofen", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🌬️</span> Бронхолитики</div><div class="pediatric-drugs-grid">' +
            renderDrug("berodual", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>💉</span> Антибиотики (менингококк, сепсис)</div><div class="pediatric-drugs-grid">' +
            renderDrug("ceftriaxone", w) + renderDrug("cefotaxime", w) + '</div></div>' +
        '</div></details>';

    // Дефибрилляция
    html +=
      '<div class="pediatric-section">' +
        '<div class="pediatric-section-title"><span>⚡</span> Дефибрилляция (ФЖ/ЖТ без пульса)</div>' +
        '<div class="pediatric-defib-card card">' + renderDefib(w) + '</div>' +
      '</div>';

    // Оборудование
    html +=
      '<div class="pediatric-section">' +
        '<div class="pediatric-section-title"><span>🔧</span> Оборудование</div>' +
        '<div class="pediatric-equipment-grid">' +
          renderEquipment("ettUncuffed", w) +
          renderEquipment("ettCuffed", w) +
          renderEquipment("laryngoscope", w) +
          renderEquipment("mask", w) +
          renderEquipment("tidalVolume", w) +
          renderEquipment("gastricTube", w) +
        '</div>' +
      '</div>';

    // Инфузионная терапия
    html +=
      '<div class="pediatric-section">' +
        '<div class="pediatric-section-title"><span>💧</span> Инфузионная терапия</div>' +
        '<div class="pediatric-infusion-card card">' +
          '<div class="infusion-bolus">' +
            '<div class="infusion-title">Болюс (при шоке, дегидратации)</div>' +
            '<div class="infusion-value">' + Math.round(w * 10) + "–" + Math.round(w * 20) + ' мл</div>' +
            '<div class="infusion-subtitle">NaCl 0.9% или Рингер (10–20 мл/кг за 20–30 мин)</div>' +
          '</div>' +
          '<div class="infusion-maintenance">' +
            '<div class="infusion-title">Поддерживающая скорость</div>' +
            '<div class="infusion-value">' + Math.round(maintenanceMlH) + ' мл/ч</div>' +
            '<div class="infusion-subtitle">По правилу 4-2-1 (для веса ' + w.toFixed(1) + ' кг)</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    panelEl.innerHTML = html;
  }

  function onInput() {
    state.weight = parseNum(weightEl.value);
    state.height = parseNum(heightEl.value);
    state.age    = parseNum(ageEl.value);
    validate();
    renderAll();
  }

  function init() {
    weightEl  = document.getElementById("weightInput");
    heightEl  = document.getElementById("heightInput");
    ageEl     = document.getElementById("ageInput");
    warningEl = document.getElementById("limitsWarning");
    panelEl   = document.getElementById("resultPanel");
    if (!panelEl) return;

    if (weightEl) weightEl.addEventListener("input", onInput);
    if (heightEl) heightEl.addEventListener("input", onInput);
    if (ageEl)    ageEl.addEventListener("input", onInput);

    panelEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".ne-dilution-btn");
      if (btn) {
        state.norepinephrineDilution = parseInt(btn.getAttribute("data-dilution"), 10);
        renderAll();
      }
    });

    renderAll();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();