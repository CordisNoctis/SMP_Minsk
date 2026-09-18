(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  var LIMITS = {
    weight: { min: 1, max: 120, warnThreshold: 60 },
    height: { min: 40, max: 200, warnThreshold: 170 },
    age:    { min: 0, max: 18,  warnThreshold: 14 }
  };

  // ===== Нормы ВОЗ (из эталона): возраст → вес / рост =====
  var AGE_WEIGHT = [
    [0, 3.5], [0.25, 4.5], [0.5, 6.5], [1, 9], [2, 12], [3, 14], [4, 16], [5, 18],
    [6, 20], [7, 22], [8, 25], [9, 28], [10, 31], [11, 34], [12, 38], [13, 42],
    [14, 47], [15, 52], [16, 56]
  ];
  var AGE_HEIGHT = [
    [0, 50], [0.25, 55], [0.5, 64], [1, 75], [2, 86], [3, 96], [4, 103], [5, 110],
    [6, 116], [7, 122], [8, 128], [9, 133], [10, 138], [11, 144], [12, 150],
    [13, 156], [14, 162], [15, 168], [16, 172]
  ];

  function interp(table, x) {
    if (x <= table[0][0]) return table[0][1];
    for (var i = 1; i < table.length; i++) {
      if (x <= table[i][0]) {
        var t = (x - table[i - 1][0]) / (table[i][0] - table[i - 1][0]);
        return table[i - 1][1] + t * (table[i][1] - table[i - 1][1]);
      }
    }
    return table[table.length - 1][1];
  }

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
      doseMgKg: 0.02, minDoseMg: 0.1, maxDoseMg: 0.5, route: "В/в",
      repeatInterval: "Повтор через 3–5 мин; общая максимальная доза 1 мг",
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
      dilutionDesc: "1–2 мг/кг разово (по эталону). Расчёт по 2 мг/кг (острые состояния, астма, круп)",
      doseMgKg: 2, maxDoseMg: 120, route: "В/в струйно",
      warning: "Контроль АД после введения", useDiluted: false
    },
    dexamethasone: {
      name: "Дексаметазон 0.4% — 1 мл", icon: "💊", cat: "vasoactive",
      ampouleConc: 4, ampouleVol: 1,
      dilutionDesc: "Эквивалент преднизолону 1:7",
      doseMgKg: 0.2, maxDoseMg: 16, route: "В/в, в/м",
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
      ampouleConc: 5, ampouleVol: 1,
      dilutionDesc: "Ректально: 0.3–0.5 мг/кг",
      doseMgKg: 0.1, maxDoseMg: 10, route: "В/в, в/м, ректально",
      warning: "Альтернатива диазепаму", useDiluted: false
    },
    ketamine: {
      name: "Кетамин 5% — 1 мл", icon: "😴", cat: "anesthetic",
      ampouleConc: 50, ampouleVol: 1,
      dilutionDesc: "В/в 1–2 мг/кг, в/м 3–4 мг/кг",
      doseMgKg: 1, maxDoseMg: 100, route: "В/в медленно (1 мин)",
      warning: "Диссоциативная анестезия! Гиперсаливация — сочетать с атропином", useDiluted: false
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
      doseMgKg: 1, maxDoseMg: 100, route: "В/в, в/м",
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
    fentanyl: {
      name: "Фентанил 0.005% — 1 мл", icon: "💊", cat: "analgesic",
      ampouleConc: 0.05, ampouleVol: 1,
      dilutionDesc: "1 мкг/кг = 0.001 мг/кг (50 мкг/мл)",
      doseMgKg: 0.001, maxDoseMg: 0.1, route: "В/в медленно",
      repeatInterval: "Каждые 30–60 мин",
      warning: "Сильный опиоид! Угнетение дыхания. Не рекомендуется < 1 года", useDiluted: false
    },
    dimedrol: {
      name: "Димедрол 1% — 1 мл", icon: "🤧", cat: "antihistamine",
      ampouleConc: 10, ampouleVol: 1,
      dilutionDesc: "7–12 мес: 3–5 мг | 1–3 г: 5–10 мг | 4–6 л: 10–15 мг | 7–14 л: 15–30 мг",
      doseMgKg: 0.5, maxDoseMg: 50, route: "В/м, в/в медленно",
      repeatInterval: "Каждые 6–8 часов, 1–3 раза/сут",
      warning: "Макс. суточная 200 мг. >14 лет: 10–50 мг", useDiluted: false
    },
    suprastin: {
      name: "Супрастин 2% — 1 мл", icon: "🤧", cat: "antihistamine",
      ampouleConc: 20, ampouleVol: 1,
      dilutionDesc: "Хлоропирамин. 0.3 мг/кг (по эталону)",
      doseMgKg: 0.3, maxDoseMg: 20, route: "В/м, в/в медленно",
      warning: "Альтернатива димедролу. Седативный эффект", useDiluted: false
    },
    drotaverine: {
      name: "Дротаверин 2% — 2 мл", icon: "💊", cat: "spasmolytic",
      ampouleConc: 20, ampouleVol: 2,
      dilutionDesc: "Дети: 10–20 мг (0.5–1 мл). Взрослые: 40–80 мг (2–4 мл)",
      doseMgKg: 0.5, maxDoseMg: 80, route: "В/м, в/в медленно",
      repeatInterval: "1–3 раза/сут",
      warning: "В/в вводить медленно! Риск коллапса", useDiluted: false
    },
    platifilline: {
      name: "Платифиллин 0.2% — 1 мл", icon: "💊", cat: "spasmolytic",
      ampouleConc: 2, ampouleVol: 1,
      dilutionDesc: "Спазмолитик. 0.02 мг/кг (по эталону)",
      doseMgKg: 0.02, maxDoseMg: 4, route: "П/к, в/в медленно",
      warning: "Альтернатива дротаверину", useDiluted: false
    },
    metoclopramide: {
      name: "Метоклопрамид 0.5% — 1 мл", icon: "🤢", cat: "antiemetic",
      ampouleConc: 5, ampouleVol: 1,
      dilutionDesc: "0.15 мг/кг (по эталону)",
      doseMgKg: 0.15, maxDoseMg: 10, route: "В/в медленно, в/м",
      repeatInterval: "Макс. 3 раза/сут",
      warning: "⛔ До 1 года и <10 кг не рекомендуется! Риск экстрапирамидных расстройств", useDiluted: false
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
      warning: "⚠️ Дозирование для небулайзера обычно выполняется в мл по возрасту/весу. Проверьте по инструкции и протоколу. Расчёт мг/кг может не совпадать с практическим объёмом ингаляции.", useDiluted: false
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
    ettCuffed:    { name: "ЭТТ с манжетой (после 1 г.)", icon: "🌬️", unit: "мм (ID)" },
    ngTube:       { name: "Назогастральный зонд / Катетер Фолея", icon: "🔬", unit: "Fr" },
    cvc:          { name: "Центральный венозный катетер", icon: "🩸", unit: "Fr" },
    laryngoscope: { name: "Клинок ларингоскопа", icon: "👁️", unit: "размер" },
    mask:         { name: "Маска ИВЛ", icon: "😷", unit: "размер" },
    lma:          { name: "Ларингеальная маска (LMA)", icon: "🎭", unit: "№" },
    tidalVolume:  { name: "ИВЛ — дыхательный объём", icon: "🫁", unit: "мл" },
    ventRR:       { name: "ИВЛ — частота дыханий", icon: "⏱️", unit: "/мин" },
    collar:       { name: "Шейный воротник (по Jerome)", icon: "🦺", unit: "" }
  };

  // ===== Таблица Броселоу (Harborview): 13 колонок =====
  var BROSELOW = [
    { w: 3,  age: "Новорожд.",  ageNum: 0,    color: "#9e9e9e", label: "Серая",      text: "#fff",
      hr: [100,160], rr: [30,60], sbpMin: 40, ett: ["3.0","2.5"], ng: "5 Fr",    cvc: "3.5–5 Fr (UVC)",
      vt: [24,36],   vrr: [24,30], collar: "P-0", bolus: 60,  maint: 12 },
    { w: 4,  age: "Новорожд.",  ageNum: 0,    color: "#9e9e9e", label: "Серая",      text: "#fff",
      hr: [100,160], rr: [30,60], sbpMin: 40, ett: ["3.0","2.5"], ng: "5 Fr",    cvc: "3.5–5 Fr (UVC)",
      vt: [32,48],   vrr: [24,30], collar: "P-0", bolus: 80,  maint: 16 },
    { w: 5,  age: "2 мес",      ageNum: 0.17, color: "#9e9e9e", label: "Серая",      text: "#fff",
      hr: [100,160], rr: [30,60], sbpMin: 50, ett: ["3.5","3.0"], ng: "5 Fr",    cvc: "3 Fr",
      vt: [40,60],   vrr: [24,30], collar: "P-0", bolus: 100, maint: 20 },
    { w: 6,  age: "4 мес",      ageNum: 0.33, color: "#ffb6c1", label: "Розовая",    text: "#333",
      hr: [100,160], rr: [30,60], sbpMin: 60, ett: ["3.5","3.0"], ng: "5–8 Fr",  cvc: "3–4 Fr",
      vt: [48,72],   vrr: [20,25], collar: "P-0", bolus: 120, maint: 28 },
    { w: 8,  age: "8 мес",      ageNum: 0.67, color: "#ff4d4d", label: "Красная",    text: "#fff",
      hr: [100,160], rr: [30,60], sbpMin: 60, ett: ["3.5","3.0"], ng: "8 Fr",    cvc: "3–4 Fr",
      vt: [64,96],   vrr: [20,25], collar: "P-1", bolus: 160, maint: 35 },
    { w: 10, age: "1 год",      ageNum: 1,    color: "#dda0dd", label: "Фиолетовая", text: "#333",
      hr: [90,150],  rr: [24,40], sbpMin: 70, ett: ["4.0","3.5"], ng: "8–10 Fr", cvc: "3–4 Fr",
      vt: [80,120],  vrr: [15,25], collar: "P-1", bolus: 200, maint: 40 },
    { w: 13, age: "2 года",     ageNum: 2,    color: "#ffff99", label: "Жёлтая",     text: "#333",
      hr: [90,150],  rr: [24,40], sbpMin: 70, ett: ["4.5","4.0"], ng: "10 Fr",   cvc: "3–4 Fr",
      vt: [104,156], vrr: [15,25], collar: "P-1", bolus: 260, maint: 45 },
    { w: 16, age: "4 года",     ageNum: 4,    color: "#ffffff", label: "Белая",      text: "#333",
      hr: [80,140],  rr: [22,34], sbpMin: 80, ett: ["5.0","4.5"], ng: "10 Fr",   cvc: "4 Fr",
      vt: [128,192], vrr: [15,25], collar: "P-2", bolus: 320, maint: 55 },
    { w: 20, age: "5–6 лет",    ageNum: 5.5,  color: "#87ceeb", label: "Голубая",    text: "#333",
      hr: [70,120],  rr: [18,30], sbpMin: 80, ett: ["5.5","5.0"], ng: "12 Fr",   cvc: "4 Fr",
      vt: [160,240], vrr: [12,20], collar: "P-2", bolus: 400, maint: 65 },
    { w: 26, age: "7–8 лет",    ageNum: 7.5,  color: "#ffa500", label: "Оранжевая",  text: "#333",
      hr: [70,120],  rr: [18,30], sbpMin: 80, ett: ["6.0","5.5"], ng: "14 Fr",   cvc: "4–5 Fr",
      vt: [208,312], vrr: [12,20], collar: "P-2", bolus: 520, maint: 70 },
    { w: 32, age: "9–10 лет",   ageNum: 9.5,  color: "#2e8b57", label: "Зелёная",    text: "#fff",
      hr: [70,120],  rr: [18,30], sbpMin: 90, ett: ["6.5","6.0"], ng: "14 Fr",   cvc: "4–5 Fr",
      vt: [256,384], vrr: [12,20], collar: "P-3", bolus: 640, maint: 75 },
    { w: 40, age: "12 лет",     ageNum: 12,   color: "#cfcfcf", label: "Без цвета",  text: "#333",
      hr: [60,100],  rr: [12,24], sbpMin: 90, ett: ["6.5","6.0"], ng: "14 Fr",   cvc: "5+ Fr",
      vt: [320,480], vrr: [12,16], collar: "взрослый", bolus: 800, maint: 100 },
    { w: 45, age: "13 лет",     ageNum: 13,   color: "#cfcfcf", label: "Без цвета",  text: "#333",
      hr: [60,100],  rr: [12,20], sbpMin: 90, ett: ["7.0","6.5"], ng: "16 Fr",   cvc: "5+ Fr",
      vt: [360,540], vrr: [12,16], collar: "взрослый", bolus: 900, maint: 115 }
  ];

  var REFERENCE = {
    title: "О калькуляторе",
    paragraphs: [
      "Лента Broselow (Broselow tape) — цветная измерительная лента для быстрой оценки веса ребёнка по росту и определения дозировок и размеров оборудования.",
      "Если вес не введён, он оценивается по таблицам ВОЗ: по возрасту или по росту (линейная интерполяция между опорными точками). Дозы по рекомендованиям PALS и European Resuscitation Council."
    ],
    importantNote: "Калькулятор для экстренных ситуаций, когда точное взвешивание невозможно. При возможности используйте реальный вес. Дозы ориентировочные — корректируйте по клинической ситуации.",
    indicationsTitle: "📋 Нормы ВОЗ (вес / рост по возрасту):",
    indications: [
      "1 год — 9 кг / 75 см",
      "3 года — 14 кг / 96 см",
      "5 лет — 18 кг / 110 см",
      "7 лет — 22 кг / 122 см",
      "10 лет — 31 кг / 138 см",
      "12 лет — 38 кг / 150 см",
      "15 лет — 52 кг / 168 см",
      "",
      "🎭 Ларингеальная маска (LMA) по весу:",
      "< 5 кг — № 1 (неонатальная) | 5–10 кг — № 1.5 | 10–20 кг — № 2 | 20–30 кг — № 2.5 | 30–50 кг — № 3 | ≥ 50 кг — № 4 (взрослая)",
      "",
      "🫁 Дыхательный объём: 6–8 мл/кг (расчёт минутной вентиляции по 7 мл/кг × ЧД)",
      "💧 Промывание желудка: порция 10 мл/кг, общий объём до 50 мл/кг или 1000 мл"
    ]
  };

  var state = {
    weight: null, height: null, age: null,
    norepinephrineDilution: 50
  };
  var weightEl, heightEl, ageEl, warningEl, panelEl;
  var PED_STORAGE_KEY = "smp-calc-pediatric-v1";

  function parseNum(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function normalizeSavedNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return isNaN(value) ? null : value;
    return parseNum(value);
  }

  function savePedState() {
    try {
      localStorage.setItem(PED_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function loadPedState() {
    try {
      var raw = localStorage.getItem(PED_STORAGE_KEY);
      if (!raw) return;

      var saved = JSON.parse(raw);

      if (!saved || typeof saved !== "object") {
        clearPedState();
        return;
      }

      var hasValues = ("weight" in saved) || ("height" in saved) || ("age" in saved);
      if (!hasValues) {
        clearPedState();
        return;
      }

      state.weight = normalizeSavedNumber(saved.weight);
      state.height = normalizeSavedNumber(saved.height);
      state.age    = normalizeSavedNumber(saved.age);

      // 0 кг и 0 см считаем некорректными значениями.
      // 0 лет оставляем — это новорождённый.
      if (state.weight === 0) state.weight = null;
      if (state.height === 0) state.height = null;

      if (
        saved.norepinephrineDilution === 20 ||
        saved.norepinephrineDilution === 50 ||
        saved.norepinephrineDilution === 100
      ) {
        state.norepinephrineDilution = saved.norepinephrineDilution;
      }
    } catch (e) {
      clearPedState();
    }
  }

  function clearPedState() {
    try {
      localStorage.removeItem(PED_STORAGE_KEY);
    } catch (e) {}
  }

  function round2(x) { return Math.round(x * 100) / 100; }
  function round3(x) { return Math.round(x * 1000) / 1000; }
  function round1(x) { return Math.round(x * 10) / 10; }

  // ===== Оценка веса по таблицам ВОЗ (исправлено по эталону) =====
  function estimateWeightByAge(age) {
    return round1(interp(AGE_WEIGHT, age));
  }

    // ===== Нормы АД по возрасту (САД / ДАД) =====
  var BP_TABLE = [
    { a: 0.003, s: [60, 76],   d: [31, 46] },  // 1 день
    { a: 0.011, s: [67, 84],   d: [35, 54] },  // 4 дня
    { a: 0.038, s: [72, 89],   d: [39, 57] },  // 2 недели
    { a: 0.083, s: [73, 93],   d: [37, 56] },  // 1 мес
    { a: 0.125, s: [76, 95],   d: [40, 58] },  // 1,5 мес
    { a: 0.167, s: [79, 99],   d: [43, 60] },  // 2 мес
    { a: 0.25,  s: [79, 102],  d: [44, 65] },  // 3 мес
    { a: 0.375, s: [82, 103],  d: [45, 65] },  // 4,5 мес
    { a: 0.5,   s: [84, 104],  d: [46, 67] },  // 6 мес
    { a: 0.75,  s: [84, 104],  d: [44, 65] },  // 9 мес
    { a: 1,     s: [85, 104],  d: [37, 66] },  // 12 мес
    { a: 1.5,   s: [76, 99],   d: [30, 54] },
    { a: 2,     s: [77, 100],  d: [31, 55] },
    { a: 2.5,   s: [79, 102],  d: [33, 57] },
    { a: 3,     s: [80, 103],  d: [35, 58] },
    { a: 3.5,   s: [81, 104],  d: [37, 60] },
    { a: 4,     s: [82, 104],  d: [39, 62] },
    { a: 4.5,   s: [83, 105],  d: [41, 64] },
    { a: 5,     s: [84, 106],  d: [43, 66] },
    { a: 5.5,   s: [85, 107],  d: [45, 68] },
    { a: 6,     s: [85, 107],  d: [46, 69] },
    { a: 6.5,   s: [86, 108],  d: [46, 69] },
    { a: 7,     s: [87, 109],  d: [46, 69] },
    { a: 7.5,   s: [88, 110],  d: [47, 70] },
    { a: 8,     s: [89, 111],  d: [47, 71] },
    { a: 8.5,   s: [90, 112],  d: [48, 71] },
    { a: 9,     s: [90, 112],  d: [48, 72] },
    { a: 9.5,   s: [91, 113],  d: [49, 73] },
    { a: 10,    s: [92, 114],  d: [49, 73] },
    { a: 10.5,  s: [93, 115],  d: [50, 74] },
    { a: 11,    s: [94, 116],  d: [50, 75] },
    { a: 11.5,  s: [95, 117],  d: [51, 76] },
    { a: 12,    s: [96, 118],  d: [51, 76] },
    { a: 12.5,  s: [97, 119],  d: [52, 77],  cap: true },
    { a: 13,    s: [100, 120], d: [53, 78],  cap: true },
    { a: 13.5,  s: [100, 121], d: [54, 78],  cap: true },
    { a: 14,    s: [101, 122], d: [54, 79],  cap: true },
    { a: 14.5,  s: [101, 122], d: [54, 79],  cap: true },
    { a: 15,    s: [102, 123], d: [55, 79],  cap: true },
    { a: 15.5,  s: [102, 124], d: [55, 80],  cap: true },
    { a: 16,    s: [103, 124], d: [56, 80],  cap: true },
    { a: 16.5,  s: [103, 125], d: [56, 80],  cap: true },
    { a: 17,    s: [104, 126], d: [56, 80],  cap: true },
    { a: 17.5,  s: [105, 127], d: [57, 81],  cap: true },
    { a: 18,    s: [107, 128], d: [58, 82],  cap: true }
  ];

  // ===== Оценка роста =====

    // ===== ЧД по возрасту (норма + медиана) =====
  var RR_TABLE = [
    { a: 0,     r: [25, 60], med: 44 },  // новорождённый
    { a: 0.083, r: [25, 60], med: 42 },  // 1 мес
    { a: 0.167, r: [25, 60], med: 40 },  // 2 мес
    { a: 0.25,  r: [25, 60], med: 38 },  // 3 мес
    { a: 0.5,   r: [20, 55], med: 35 },
    { a: 0.75,  r: [20, 50], med: 32 },
    { a: 1,     r: [20, 45], med: 30 },
    { a: 1.5,   r: [20, 43], med: 28 },
    { a: 2,     r: [20, 40], med: 26 },
    { a: 3,     r: [20, 35], med: 24 },
    { a: 4,     r: [17, 30], med: 24 },
    { a: 5,     r: [17, 30], med: 23 },
    { a: 6,     r: [16, 30], med: 22 },
    { a: 7,     r: [16, 30], med: 21 },
    { a: 8,     r: [16, 30], med: 20 },
    { a: 9,     r: [15, 28], med: 20 },
    { a: 10,    r: [15, 25], med: 19 },
    { a: 11,    r: [15, 25], med: 19 },
    { a: 12,    r: [15, 25], med: 18 },
    { a: 14,    r: [14, 25], med: 17 },
    { a: 16,    r: [14, 25], med: 16 },
    { a: 17,    r: [14, 25], med: 15 }
  ];

    // ===== Склонение: 1 год / 2 года / 5 лет =====
  function plural(n, forms) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
    return forms[2];
  }

  // ===== Возраст: «6 лет 0 месяцев», «4 года 6 месяцев» =====
  function formatAgeFull(years) {
    if (years === null) return "—";
    var totalMonths = Math.round(years * 12);
    if (totalMonths < 1) return "новорождённый";
    var y = Math.floor(totalMonths / 12);
    var m = totalMonths % 12;
    if (y === 0) return m + " " + plural(m, ["месяц", "месяца", "месяцев"]);
    return y + " " + plural(y, ["год", "года", "лет"]) + " " + m + " " + plural(m, ["месяц", "месяца", "месяцев"]);
  }

    // ===== ЧСС по возрасту =====
  var HR_TABLE = [
    { a: 0,     hr: [120, 170] },  // новорождённый
    { a: 0.083, hr: [120, 170] },  // 1 мес
    { a: 0.167, hr: [118, 170] },  // 2 мес
    { a: 0.25,  hr: [115, 170] },  // 3 мес
    { a: 0.375, hr: [113, 170] },  // 4,5 мес
    { a: 0.5,   hr: [110, 170] },  // 6 мес
    { a: 0.75,  hr: [108, 160] },  // 9 мес
    { a: 1,     hr: [105, 150] },
    { a: 1.5,   hr: [100, 150] },
    { a: 2,     hr: [95, 150] },
    { a: 3,     hr: [88, 150] },
    { a: 4,     hr: [80, 150] },
    { a: 5,     hr: [78, 145] },
    { a: 6,     hr: [75, 140] },
    { a: 7,     hr: [73, 135] },
    { a: 8,     hr: [70, 130] },
    { a: 9,     hr: [65, 130] },
    { a: 10,    hr: [60, 130] },
    { a: 11,    hr: [63, 125] },
    { a: 12,    hr: [65, 120] },
    { a: 13,    hr: [63, 118] },
    { a: 14,    hr: [60, 115] },
    { a: 15,    hr: [60, 115] },
    { a: 16,    hr: [60, 115] },
    { a: 17,    hr: [60, 115] }
  ];

  function getHR(age) {
    if (age === null) return null;
    var best = HR_TABLE[0], bd = Infinity;
    for (var i = 0; i < HR_TABLE.length; i++) {
      var d = Math.abs(age - HR_TABLE[i].a);
      if (d < bd) { bd = d; best = HR_TABLE[i]; }
    }
    return best;
  }

  function getRR(age) {
    if (age === null) return null;
    var best = RR_TABLE[0], bd = Infinity;
    for (var i = 0; i < RR_TABLE.length; i++) {
      var d = Math.abs(age - RR_TABLE[i].a);
      if (d < bd) { bd = d; best = RR_TABLE[i]; }
    }
    return best;
  }

  function getBP(age) {
    if (age === null) return null;
    var best = BP_TABLE[0], bd = Infinity;
    for (var i = 0; i < BP_TABLE.length; i++) {
      var d = Math.abs(age - BP_TABLE[i].a);
      if (d < bd) { bd = d; best = BP_TABLE[i]; }
    }
    return best;
  }

    // ===== Лента Broselow: зоны по весу и длине/росту =====
  var BROSELOW_TAPE = [
    { label: "Серая",     color: "#9e9e9e", text: "#fff", wMin: 3,  wMax: 5,   hMin: 46.8,  hMax: 59.2 },
    { label: "Розовая",   color: "#ffb6c1", text: "#333", wMin: 6,  wMax: 7,   hMin: 59.2,  hMax: 66.9 },
    { label: "Красная",   color: "#ff4d4d", text: "#fff", wMin: 8,  wMax: 9,   hMin: 66.9,  hMax: 74.2 },
    { label: "Фиолетовая",color: "#dda0dd", text: "#333", wMin: 10, wMax: 11,  hMin: 74.2,  hMax: 83.1 },
    { label: "Жёлтая",    color: "#ffff99", text: "#333", wMin: 12, wMax: 14,  hMin: 83.1,  hMax: 95.3 },
    { label: "Белая",     color: "#ffffff", text: "#333", wMin: 15, wMax: 18,  hMin: 95.3,  hMax: 107.9 },
    { label: "Синяя",     color: "#87ceeb", text: "#333", wMin: 19, wMax: 23,  hMin: 107.9, hMax: 120.9 },
    { label: "Оранжевая", color: "#ffa500", text: "#333", wMin: 24, wMax: 29,  hMin: 120.9, hMax: 131.5 },
    { label: "Зелёная",   color: "#2e8b57", text: "#fff", wMin: 30, wMax: 36,  hMin: 131.5, hMax: 143.5 },
    { label: "Без цвета", color: "#cfcfcf", text: "#333", wMin: 37, wMax: 999, hMin: 143.5, hMax: 999 }
  ];

  function getTapeZoneByWeight(w) {
    // Границы зон непрерывные: середина промежутка между соседними диапазонами
    for (var i = 0; i < BROSELOW_TAPE.length; i++) {
      var z = BROSELOW_TAPE[i];
      var lo = i === 0 ? 0 : (BROSELOW_TAPE[i - 1].wMax + z.wMin) / 2;
      var hi = i === BROSELOW_TAPE.length - 1 ? Infinity : (z.wMax + BROSELOW_TAPE[i + 1].wMin) / 2;
      if (w >= lo && w < hi) return z;
    }
    return BROSELOW_TAPE[BROSELOW_TAPE.length - 1];
  }

  function getTapeZoneByHeight(h) {
    for (var i = 0; i < BROSELOW_TAPE.length; i++) {
      if (h >= BROSELOW_TAPE[i].hMin && h < BROSELOW_TAPE[i].hMax) return BROSELOW_TAPE[i];
    }
    return h < 46.8 ? BROSELOW_TAPE[0] : BROSELOW_TAPE[BROSELOW_TAPE.length - 1];
  }

  // Оценка веса по росту: линейно внутри зоны ленты
  function estimateWeightByTapeHeight(h) {
    var z = getTapeZoneByHeight(h);
    var hTop = Math.min(z.hMax, 200);
    var wTop = Math.min(z.wMax, 60);
    var t = (h - z.hMin) / (hTop - z.hMin);
    t = Math.max(0, Math.min(1, t));
    return round1(z.wMin + t * (wTop - z.wMin));
  }

  function getColumnByWeight(w) {
    var best = BROSELOW[0], bd = Infinity;
    for (var i = 0; i < BROSELOW.length; i++) {
      var d = Math.abs(w - BROSELOW[i].w);
      if (d < bd || (d === bd && BROSELOW[i].w > best.w)) { bd = d; best = BROSELOW[i]; }
    }
    return best;
  }

  function getEffectiveAge() {
    if (state.age !== null) return state.age;
    if (state.weight !== null) return getColumnByWeight(state.weight).ageNum;
    if (state.height !== null) return getColumnByWeight(estimateWeightByTapeHeight(state.height)).ageNum;
    return null;
  }

  function validate() {
    var warnings = [];
    if (state.weight !== null) {
      if (state.weight > LIMITS.weight.max) {
        state.weight = LIMITS.weight.max;
        if (weightEl && document.activeElement !== weightEl) weightEl.value = LIMITS.weight.max;
        warnings.push("⚠️ Вес ограничен максимумом " + LIMITS.weight.max + " кг");
      }
      if (state.weight < LIMITS.weight.min) {
        state.weight = LIMITS.weight.min;
        if (weightEl && document.activeElement !== weightEl) weightEl.value = LIMITS.weight.min;
      }
      if (state.weight >= LIMITS.weight.warnThreshold) {
        warnings.push("👤 Вес " + state.weight.toFixed(1) + " кг — возможна взрослая масса тела");
      }
    }
    if (state.height !== null) {
      if (state.height > LIMITS.height.max) {
        state.height = LIMITS.height.max;
        if (heightEl && document.activeElement !== heightEl) heightEl.value = LIMITS.height.max;
        warnings.push("⚠️ Рост ограничен максимумом " + LIMITS.height.max + " см");
      }
      if (state.height < LIMITS.height.min) {
        state.height = LIMITS.height.min;
        if (heightEl && document.activeElement !== heightEl) heightEl.value = LIMITS.height.min;
      }
      if (state.height >= LIMITS.height.warnThreshold) {
        warnings.push("👤 Рост " + state.height.toFixed(0) + " см — параметры подростка");
      }
    }
    if (state.age !== null) {
      if (state.age > LIMITS.age.max) {
        state.age = LIMITS.age.max;
        if (ageEl && document.activeElement !== ageEl) ageEl.value = LIMITS.age.max;
        warnings.push("⚠️ Возраст ограничен " + LIMITS.age.max + " годами");
      }
      if (state.age < LIMITS.age.min) {
        state.age = LIMITS.age.min;
        if (ageEl && document.activeElement !== ageEl) ageEl.value = LIMITS.age.min;
      }
      if (state.age >= LIMITS.age.warnThreshold) {
        warnings.push("👤 Возраст " + state.age.toFixed(1) + " лет — подросток, учитывайте взрослые дозировки");
      }
    }
    if (!warningEl) return;
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
    var minDose = d.minDoseMg || 0;
    var isAdult = calc > d.maxDoseMg;
    var doseMg = Math.min(Math.max(calc, minDose), d.maxDoseMg);
    var weightForMax = d.maxDoseMg / d.doseMgKg;

    var vol = d.useDiluted && d.dilutedConc
      ? doseMg / d.dilutedConc
      : doseMg / d.ampouleConc;

    var doseR = round2(doseMg);
    var mlR = vol < 0.1 ? round3(vol) : round2(vol);

    // Количество ампул считаем по исходному препарату, а не по разведённому объёму
    var mgPerAmpoule = d.ampouleConc * d.ampouleVol;
    var amp = mgPerAmpoule > 0 ? Math.ceil((doseMg / mgPerAmpoule) * 10) / 10 : 0;

    // Возрастные противопоказания (приоритет: вес → возраст → рост)
    var ageWarning = "";
    var effAge = getEffectiveAge();
    if (effAge !== null) {
      if (id === "ibuprofen" && effAge < 0.5) {
        ageWarning = '<div class="drug-age-warning">⛔ Противопоказан до 6 мес!</div>';
      }
      if (id === "morphine" && effAge < 1) {
        ageWarning = '<div class="drug-age-warning">⛔ Не рекомендуется до 1 года!</div>';
      }
      if (id === "fentanyl" && effAge < 1) {
        ageWarning = '<div class="drug-age-warning">⛔ Не рекомендуется до 1 года!</div>';
      }
      if (id === "metoclopramide" && effAge < 1) {
        ageWarning = '<div class="drug-age-warning">⛔ Не рекомендуется до 1 года и <10 кг!</div>';
      }
      if (id === "analgin" && effAge < 0.25) {
        ageWarning = '<div class="drug-age-warning">⛔ До 3 мес. не применять!</div>';
      } else if (id === "analgin" && effAge < 0.92) {
        ageWarning = '<div class="drug-age-warning">⚠️ 3–11 мес. — только в/м!</div>';
      }
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
        '<div class="drug-detail max-dose-info"><span class="drug-label">Макс. разовая:</span><span class="drug-value">' + d.maxDoseMg + " мг</span></div>" +
        '<div class="drug-detail ampoules-info"><span class="drug-label">Нужно ампул/флаконов:</span><span class="drug-value">' + amp + " × " + d.ampouleVol + " мл</span></div>" +
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
        '<div class="ne-titration-desc">Шаг: +' + d.titrationStep + '–' + (d.titrationStep * 2) + ' мкг/кг/мин (= +' + titrH.toFixed(2) + '–' + (titrH * 2).toFixed(2) + ' мл/ч)<br>До достижения АД > 25-го процентиля</div>' +
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

  function renderEquipment(id, w, col) {
    var e = EQUIPMENT[id];
    var value = "", details = "", warning = "", extraInfo = "";

    if (id === "ettUncuffed") {
      value = col.ett[0] + " мм";
      details = "Броселоу: " + col.label + ", " + col.w + " кг";
    }

    else if (id === "ettCuffed") {
      value = col.ett[1] + " мм";
      details = "С манжетой · после 1 года · Броселоу " + col.w + " кг";
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

    // ===== НОВОЕ: ларингеальная маска по эталону =====
    else if (id === "lma") {
      if (w === null) { value = "—"; details = "Укажите вес"; }
      else if (w < 5)  { value = "№ 1";   details = "Неонатальная · < 5 кг"; }
      else if (w < 10) { value = "№ 1.5"; details = "5–10 кг"; }
      else if (w < 20) { value = "№ 2";   details = "10–20 кг"; }
      else if (w < 30) { value = "№ 2.5"; details = "20–30 кг"; }
      else if (w < 50) { value = "№ 3";   details = "30–50 кг"; }
      else             { value = "№ 4";   details = "≥ 50 кг (взрослая)"; }
    }

    else if (id === "tidalVolume") {
      value = Math.round(w * 6) + "–" + Math.round(w * 8) + " мл";
      details = "6–8 мл/кг";
    }

    else if (id === "ngTube") {
      value = col.ng;
      details = "Броселоу: " + col.label + ", " + col.w + " кг";
    }

    else if (id === "cvc") {
      value = col.cvc;
      details = "Броселоу: " + col.label + ", " + col.w + " кг";
    }

    else if (id === "ventRR") {
      value = col.vrr[0] + "–" + col.vrr[1] + " /мин";
      details = "Частота дыханий ИВЛ (Броселоу)";
    }

    else if (id === "collar") {
      value = col.collar;
      details = "По Jerome · Броселоу " + col.w + " кг";
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
        '<div class="geneva-category" style="--cat-color: var(--accent);">' +
          '<div class="geneva-category-items" style="padding: 28px 16px !important; text-align: center;">' +
            '<div style="font-size: 2.2rem; margin-bottom: 6px;">🧒</div>' +
            '<div style="font-weight: 800; color: var(--text); margin-bottom: 4px;">Заполните параметры</div>' +
            '<div style="font-size: 0.85rem; color: var(--muted); line-height: 1.4;">Введите вес, рост или возраст ребёнка —<br>всё остальное рассчитается автоматически</div>' +
          '</div>' +
        '</div>';
      return;
    }

    var w = state.weight;
    if (w === null) {
      w = state.age !== null ? estimateWeightByAge(state.age) : estimateWeightByTapeHeight(state.height);
    }
    var tape = getTapeZoneByWeight(w);
    if (state.weight === null && state.age !== null) {
      w = round1((tape.wMin + Math.min(tape.wMax, 60)) / 2);
    }
    var wTag = state.weight === null ? (state.age !== null ? "среднее по ленте Broselow" : "оценка") : "";
    var col = getColumnByWeight(w);
    var zone = tape;
    var effAge = getEffectiveAge();

    var weightValue = state.weight !== null ? w.toFixed(1)
      : (tape.wMax >= 999 ? "≥ " + tape.wMin : tape.wMin + "–" + tape.wMax);
    var heightValue = state.height !== null ? String(Math.round(state.height))
      : (tape.hMax >= 999 ? "≥ " + tape.hMin : tape.hMin + "–" + tape.hMax);
    var weightLabel = (state.weight !== null ? "Вес" : "Вес (оценочный)") + ", кг";
    var heightLabel = (state.height !== null ? "Рост" : "Рост (оценочный)") + ", см";
    var ageLabel = state.age !== null ? "Возраст" : "Возраст (оценочный)";
    var ageValue = formatAgeFull(effAge);

    var bp = getBP(effAge);
    var rr = getRR(effAge);
    var hrAge = getHR(effAge);
    var vitalsHtml =
      '<div class="summary-row"><span class="summary-label">ЧСС, в мин.:</span><span class="summary-value">' + (hrAge ? hrAge.hr[0] + "–" + hrAge.hr[1] : "—") + '</span></div>' +
      '<div class="summary-row"><span class="summary-label">ЧД (норма), в мин.:</span><span class="summary-value">' + (rr ? rr.r[0] + "–" + rr.r[1] : "—") + '</span></div>' +
      '<div class="summary-row"><span class="summary-label">Минимальное систолическое АД, мм.рт.ст.:</span><span class="summary-value">' + col.sbpMin + '</span></div>' +
      (bp
        ? '<div class="summary-row"><span class="summary-label">Нормальные значения АД, мм.рт.ст.:</span><span class="summary-value">' + bp.s[0] + "–" + bp.s[1] + " / " + bp.d[0] + "–" + bp.d[1] + '</span></div>' +
          (bp.cap ? '<div class="summary-row"><span class="summary-label">Верхняя граница, мм.рт.ст.:</span><span class="summary-value">&lt; 120/80</span></div>' : '')
        : '<div class="summary-row"><span class="summary-label">Нормальные значения АД, мм.рт.ст.:</span><span class="summary-value">укажите возраст</span></div>');

    // ===== Сводка по зоне Broselow =====
    var html =
      '<div class="geneva-category" style="--cat-color: ' + zone.color + '; margin-bottom: 12px;">' +
        '<div class="geneva-category-header" style="background: linear-gradient(135deg, ' + zone.color + '20 0%, ' + zone.color + '40 100%);">' +
          '<div class="broselow-zone-badge" style="background:' + zone.color + '; color:' + zone.text + '; border:1px solid rgba(0,0,0,0.15);"><span class="broselow-zone-label">' + CU.escapeHtml(zone.label) + '</span></div>' +
          '<div class="broselow-weight">' + w.toFixed(1) + ' кг' + (wTag ? '<div class="broselow-weight-note">' + wTag + '</div>' : '') + '</div>' +
        '</div>' +
        '<div class="geneva-category-items" style="padding: 0 !important;"><div class="pediatric-summary-grid">' +
          '<div class="summary-column broselow-column">' +
            '<div class="summary-column-title"><span>🎨</span> Лента Broselow</div>' +
            '<div class="summary-row"><span class="summary-label">' + weightLabel + ':</span><span class="summary-value">' + weightValue + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">' + heightLabel + ':</span><span class="summary-value">' + heightValue + '</span></div>' +
            '<div class="summary-row"><span class="summary-label">' + ageLabel + ':</span><span class="summary-value">' + ageValue + '</span></div>' +
          '</div>' +
          '<div class="summary-column norms-column">' +
            '<div class="summary-column-title"><span>💓</span> Возрастные нормы</div>' +
            vitalsHtml +
          '</div>' +
        '</div></div>' +
      '</div>';

    // ===== Экстренные препараты =====
    html +=
      '<div class="geneva-category" style="--cat-color: #b42323; margin-bottom: 12px;">' +
        '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">🚨</span><span class="geneva-category-title">Экстренные препараты</span></div></div>' +
        '<div class="geneva-category-items" style="padding: 10px !important;"><div class="pediatric-drugs-grid">' +
          renderDrug("epinephrine", w) +
          renderDrug("amiodarone", w) +
          renderDrug("atropine", w) +
          renderDrug("prednisolone", w) +
          renderNorepinephrine(w) +
        '</div></div>' +
      '</div>';

    // ===== Остальные препараты (спойлер) =====
    html +=
      '<details class="drugs-spoiler card">' +
        '<summary class="drugs-spoiler-summary">' +
          '<div class="spoiler-left"><span>📦</span><span class="spoiler-title">Остальные препараты</span><span class="spoiler-count">20</span></div>' +
          '<span class="spoiler-arrow">▼</span>' +
        '</summary>' +
        '<div class="drugs-spoiler-content">' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>📈</span> Вазоактивные и диуретики</div><div class="pediatric-drugs-grid">' +
            renderDrug("dexamethasone", w) + renderDrug("furosemide", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🧠</span> Противосудорожные / Седация</div><div class="pediatric-drugs-grid">' +
            renderDrug("lidocaine", w) + renderDrug("diazepam", w) + renderDrug("midazolam", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>💊</span> Анальгетики и анестетики</div><div class="pediatric-drugs-grid">' +
            renderDrug("analgin", w) + renderDrug("tramadol", w) + renderDrug("morphine", w) + renderDrug("ketamine", w) + renderDrug("fentanyl", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🤧</span> Антигистаминные и спазмолитики</div><div class="pediatric-drugs-grid">' +
            renderDrug("dimedrol", w) + renderDrug("suprastin", w) + renderDrug("drotaverine", w) + renderDrug("platifilline", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🤢</span> Противорвотные</div><div class="pediatric-drugs-grid">' +
            renderDrug("metoclopramide", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🌡️</span> Жаропонижающие</div><div class="pediatric-drugs-grid">' +
            renderDrug("paracetamol", w) + renderDrug("ibuprofen", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>🌬️</span> Бронхолитики</div><div class="pediatric-drugs-grid">' +
            renderDrug("berodual", w) + '</div></div>' +
          '<div class="spoiler-category"><div class="spoiler-category-title"><span>💉</span> Антибиотики (менингококк, сепсис)</div><div class="pediatric-drugs-grid">' +
            renderDrug("ceftriaxone", w) + renderDrug("cefotaxime", w) + '</div></div>' +
        '</div></details>';

    // ===== Дефибрилляция =====
    html +=
      '<div class="geneva-category" style="--cat-color: #7a0e1c; margin-bottom: 12px;">' +
        '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">⚡</span><span class="geneva-category-title">Дефибрилляция (ФЖ/ЖТ без пульса)</span></div></div>' +
        '<div class="geneva-category-items" style="padding: 10px !important;"><div class="pediatric-defib-card card" style="box-shadow: none;">' + renderDefib(w) + '</div></div>' +
      '</div>';

    // ===== Оборудование =====
    html +=
      '<div class="geneva-category" style="--cat-color: #1f6e9c; margin-bottom: 12px;">' +
        '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">🔧</span><span class="geneva-category-title">Оборудование</span></div></div>' +
        '<div class="geneva-category-items" style="padding: 10px !important;"><div class="pediatric-equipment-grid">' +
          renderEquipment("ettUncuffed", w, col) +
          renderEquipment("ettCuffed", w, col) +
          renderEquipment("ngTube", w, col) +
          renderEquipment("cvc", w, col) +
          renderEquipment("laryngoscope", w, col) +
          renderEquipment("mask", w, col) +
          renderEquipment("lma", w, col) +
          renderEquipment("tidalVolume", w, col) +
          renderEquipment("ventRR", w, col) +
          renderEquipment("collar", w, col) +
        '</div></div>' +
      '</div>';

    // ===== Инфузионная терапия =====
    html +=
      '<div class="geneva-category" style="--cat-color: #03A9F4; margin-bottom: 12px;">' +
        '<div class="geneva-category-header"><div class="geneva-category-left"><span class="geneva-category-icon">💧</span><span class="geneva-category-title">Инфузионная терапия</span></div></div>' +
        '<div class="geneva-category-items" style="padding: 10px !important;"><div class="pediatric-infusion-card card" style="box-shadow: none;">' +
          '<div class="infusion-bolus">' +
            '<div class="infusion-title">Болюс (при шоке, дегидратации)</div>' +
            '<div class="infusion-value">' + col.bolus + ' мл</div>' +
            '<div class="infusion-subtitle">Болюс 20 мл/кг (колонка Броселоу ' + col.w + ' кг)</div>' +
          '</div>' +
          '<div class="infusion-maintenance">' +
            '<div class="infusion-title">Поддерживающая скорость</div>' +
            '<div class="infusion-value">' + col.maint + ' мл/ч</div>' +
            '<div class="infusion-subtitle">Поддержание по таблице Броселоу (колонка ' + col.w + ' кг)</div>' +
          '</div>' +
        '</div></div>' +
      '</div>';

    panelEl.innerHTML = html;
  }

  function onInput() {
    var w = parseNum(weightEl.value);
    var h = parseNum(heightEl.value);
    var a = parseNum(ageEl.value);

    // 0 кг и 0 см — некорректные значения, считаем пустым полем.
    // 0 лет — допустимо (новорождённый).
    state.weight = (w === 0 ? null : w);
    state.height = (h === 0 ? null : h);
    state.age    = a;

    validate();
    savePedState();
    renderAll();
  }

  function resetAll() {
    state = { weight: null, height: null, age: null, norepinephrineDilution: 50 };
    if (weightEl) weightEl.value = "";
    if (heightEl) heightEl.value = "";
    if (ageEl)    ageEl.value = "";
    if (warningEl) warningEl.hidden = true;
    clearPedState();
    renderAll();
  }

  function init() {
    weightEl  = document.getElementById("weightInput");
    heightEl  = document.getElementById("heightInput");
    ageEl     = document.getElementById("ageInput");
    warningEl = document.getElementById("limitsWarning");
    panelEl   = document.getElementById("calcBody");
    if (!panelEl) return;

    loadPedState();

    if (weightEl) weightEl.value = state.weight === null ? "" : String(state.weight);
    if (heightEl) heightEl.value = state.height === null ? "" : String(state.height);
    if (ageEl)    ageEl.value    = state.age === null ? "" : String(state.age);

    validate();
    savePedState();

    if (weightEl) weightEl.addEventListener("input", onInput);
    if (heightEl) heightEl.addEventListener("input", onInput);
    if (ageEl)    ageEl.addEventListener("input", onInput);

    var resetBtn = document.getElementById("pedResetBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetAll);

    panelEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".ne-dilution-btn");
      if (btn) {
        state.norepinephrineDilution = parseInt(btn.getAttribute("data-dilution"), 10);
        savePedState();
        renderAll();
      }
    });

    renderAll();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      CU.openReferenceModal({ reference: REFERENCE });
    });
  }

  // CU.autoPersist("smp-calc-pediatric-v1"); // используем своё сохранение в localStorage
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();