(function () {
  "use strict";
  var CU = window.SMP.calcUtils;

  // ===== ДИАПАЗОНЫ БОЛИ =====
  var RANGES = [
    { min: 0,  max: 0,  label: "Нет боли",      color: "vas-0",    description: "Пациент не испытывает болевых ощущений." },
    { min: 1,  max: 3,  label: "Слабая боль",   color: "vas-1-3",  description: "Лёгкий дискомфорт, не нарушающий активность." },
    { min: 4,  max: 6,  label: "Умеренная боль", color: "vas-4-6",  description: "Боль отвлекает, нарушает концентрацию и сон." },
    { min: 7,  max: 10, label: "Сильная боль",  color: "vas-7-10", description: "Интенсивная боль, нарушающая все функции. Выраженный стресс." }
  ];

  // ===== СПРАВОЧНАЯ ИНФОРМАЦИЯ =====
  var REFERENCE = {
    title: "Шкала ВАШ (Визуально-аналоговая шкала боли, Visual Analogue Scale — VAS)",
    paragraphs: [
      "Визуально-аналоговая шкала (ВАШ) — один из наиболее широко применяемых инструментов субъективной оценки интенсивности боли. Впервые описана Hayes и Patterson в 1921 году.",
      "Представляет собой горизонтальную (реже вертикальную) линию длиной 10 см, на левом конце которой обозначено «нет боли» (0), на правом — «невыносимая боль» (10 / 100 мм). Пациент самостоятельно отмечает точку, соответствующую его текущим болевым ощущениям.",
      "Шкала применяется как для острой, так и для хронической боли во всех клинических специальностях, включая скорую медицинскую помощь, хирургию, онкологию и реабилитацию.",
      "Методика проведения: предъявить пациенту линейку или бланк с 10-сантиметровой линией; объяснить полюса шкалы («0 — боли нет совсем, 10 — невыносимая боль»); попросить пациента сделать отметку без подсказок; измерить расстояние от левого края до отметки в мм или см; зафиксировать результат с указанием времени.",
      "Шкала впервые предложена Hayes M.H.S. и Patterson D.G. в 1921 году. В клиническую практику для оценки боли широко введена в 1970–1980-х годах. В настоящее время входит в стандарты оценки боли большинства национальных и международных клинических рекомендаций как инструмент с подтверждённой надёжностью и валидностью."
    ],
    importantNote: "Минимальное клинически значимое изменение (МКЗИ / MCID): для острой боли — снижение на 10–13 мм (абсолютное) или ~30% (относительное) от исходного уровня. Для хронической боли — ~10 мм на 100 мм шкале. Изменение менее 9–10 мм клинически незначимо.",
    indicationsTitle: "Интерпретация результатов:",
    indications: [
      "0 мм — Боли нет",
      "1–30 мм (0–3) — Слабая боль, не нарушает повседневную активность",
      "31–54 мм (3–5) — Умеренная боль, частично ограничивает активность",
      "55–74 мм (5–7) — Сильная боль, значительно нарушает активность",
      "75–100 мм (7–10) — Нестерпимая боль, полностью нарушает активность; требует немедленного вмешательства"
    ],
    warnings: [
      "Надёжность (тест-ретест): ICC = 0,97 при измерении острой боли с интервалом 1 минута; 90% повторных измерений воспроизводятся с погрешностью ≤ 9 мм",
      "Надёжность (электронная vs бумажная версия): ICC = 0,86; среднее различие результатов 0,18 единицы — клинически незначимо",
      "Валидность подтверждена в многочисленных исследованиях для острой и хронической боли различной этиологии; сопоставима с NRS и BPI-PS",
      "Требует понимания абстрактного аналогового принципа — затруднена у пожилых, пациентов с когнитивными нарушениями и детей младше 8 лет",
      "Субъективность: на результат влияют психоэмоциональное состояние, культурный контекст, предшествующий болевой опыт",
      "Не применима при нарушениях сознания и у некоммуникабельных пациентов",
      "Одномерный инструмент: отражает только интенсивность боли, но не её качество, локализацию и влияние на функцию",
      "При умеренных уровнях боли воспроизводимость несколько ниже, чем при крайних значениях шкалы"
    ],
    extraSections: [
      {
        title: "📊 Сравнение с другими шкалами боли",
        items: [
          "ВАШ (VAS) — линия 100 мм, возраст ≥ 8 лет, требуется грамотность, высокая чувствительность",
          "ЧРШ (NRS, 0–10) — числовая шкала, возраст ≥ 8 лет, требуется грамотность, высокая чувствительность",
          "ВРШ (вербальная) — словесная шкала, любой возраст, грамотность не требуется, умеренная чувствительность",
          "Шкала лиц (FPS-R) — изображения, возраст ≥ 4 лет, грамотность не требуется, умеренная чувствительность",
          "FLACC — поведенческая шкала, 0–7 лет / некоммуникабельные, грамотность не применима, умеренная чувствительность"
        ]
      },
      {
        title: "✅ Клиническое применение",
        items: [
          "Первичная оценка интенсивности боли при поступлении",
          "Динамический мониторинг эффективности обезболивания",
          "Оценка ответа на анальгезию в скорой и неотложной помощи",
          "Документирование болевого синдрома в до- и послеоперационном периоде",
          "Клинические исследования как первичная или вторичная конечная точка",
          "Скрининг хронической боли в амбулаторной практике"
        ]
      }
    ]
  };

  // ===== СОСТОЯНИЕ =====
  var STORAGE_KEY = "smp-vas-state";
  var state = { score: null };

  function saveState() { CU.saveCalcState(STORAGE_KEY, state); }
  function loadState() {
    var saved = CU.loadCalcState(STORAGE_KEY);
    if (saved && typeof saved.score === "number") {
      state.score = saved.score;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  function getRange() {
    if (state.score === null) return null;
    for (var i = 0; i < RANGES.length; i++) {
      if (state.score >= RANGES[i].min && state.score <= RANGES[i].max) {
        return RANGES[i];
      }
    }
    return RANGES[RANGES.length - 1];
  }

  function getGroupColor() {
    if (state.score === null) return "#1f6e9c";
    if (state.score === 0) return "#1a7a3e";
    if (state.score <= 3) return "#b08900";
    if (state.score <= 6) return "#e68a2e";
    return "#b42323";
  }

  function getPainLabel(score) {
    var labels = [
      "Нет боли", "Очень слабая", "Слабая", "Дискомфорт",
      "Умеренная", "Заметная", "Отвлекающая",
      "Сильная", "Очень сильная", "Интенсивная", "Невыносимая"
    ];
    return labels[score] || "";
  }

  // ===== РЕНДЕРИНГ =====
  var bodyEl, panelEl;

  function renderVisualScale() {
    var currentScore = state.score !== null ? state.score : 0;
    var markerPosition = (currentScore / 10) * 100;
    
    return '<div class="vas-visual-scale">' +
      '<div class="vas-scale-header">' +
        '<span class="vas-scale-icon">😣</span>' +
        '<span class="vas-scale-title">Интенсивность боли</span>' +
        '<span class="vas-scale-current">' + (state.score !== null ? state.score : "—") + '</span>' +
      '</div>' +
      '<div class="vas-scale-track" id="vasScaleTrack">' +
        '<div class="vas-scale-marker" id="vasScaleMarker" style="left: ' + markerPosition + '%;"></div>' +
      '</div>' +
      '<div class="vas-scale-labels">' +
        '<span class="vas-scale-label-start">0 — Нет боли</span>' +
        '<span>5 — Умеренная</span>' +
        '<span class="vas-scale-label-end">10 — Невыносимая</span>' +
      '</div>' +
    '</div>';
  }

  // ===== ЦВЕТА ДЛЯ КАЖДОГО ЗНАЧЕНИЯ 0-10 =====
  function getItemColor(score) {
    var colors = [
      "#1a7a3e", // 0  — зелёный
      "#3d8a3e", // 1  — светло-зелёный
      "#5f9a2e", // 2  — жёлто-зелёный
      "#8fa828", // 3  — жёлто-оливковый
      "#b08900", // 4  — жёлтый
      "#c77700", // 5  — оранжевый
      "#d06018", // 6  — тёмно-оранжевый
      "#c94a1a", // 7  — оранжево-красный
      "#b42323", // 8  — красный
      "#99192b", // 9  — тёмно-красный
      "#7a0e1c"  // 10 — бордовый
    ];
    return colors[score] || "#1f6e9c";
  }

  function renderGroups() {
    var color = getGroupColor();
    var itemsHtml = "";

    for (var i = 0; i <= 10; i++) {
      var isChecked = state.score === i;
      var label = getPainLabel(i);
      var itemColor = getItemColor(i);
      itemsHtml += '<div class="geneva-item geneva-radio-item vas-item' + (isChecked ? " checked" : "") + '" data-value="' + i + '" role="radio" aria-checked="' + isChecked + '" tabindex="0" style="--item-color: ' + itemColor + ';">' +
        '<span class="geneva-radio-custom"></span>' +
        '<span class="geneva-item-content">' +
          '<span class="geneva-item-title">' + i + ' — ' + CU.escapeHtml(label) + '</span>' +
          '<span class="geneva-item-points">' + i + '</span>' +
        '</span>' +
      '</div>';
    }

    bodyEl.innerHTML = renderVisualScale() +
      '<div class="geneva-category" style="--cat-color: ' + color + ';">' +
        '<div class="geneva-category-header">' +
          '<div class="geneva-category-left">' +
            '<span class="geneva-category-icon">📊</span>' +
            '<span class="geneva-category-title">Выберите значение</span>' +
          '</div>' +
          '<div class="geneva-category-score">' + (state.score !== null ? state.score : "Х") + '</div>' +
        '</div>' +
        '<div class="geneva-category-items">' + itemsHtml + '</div>' +
      '</div>';
  }

  function renderResult() {
    if (state.score === null) {
      CU.renderResultPanel({
        score: "—",
        scoreLabel: "из 10 баллов",
        color: "incomplete",
        title: "Оцените интенсивность боли",
        description: "Выберите значение от 0 до 10",
        extraDescription: "",
        breakdownHtml: "",
        onReset: resetAll
      });
      return;
    }

    var r = getRange();
    CU.renderResultPanel({
      score: state.score,
      scoreLabel: "из 10 баллов",
      color: r.color,
      title: r.label,
      description: r.description,
      extraDescription: "",
      breakdownHtml: "",
      onReset: resetAll
    });
  }

  function resetAll() {
    state.score = null;
    saveState();
    renderGroups();
    renderResult();
  }

  function bindListeners() {
    // Клик по визуальной шкале
    bodyEl.addEventListener("click", function (e) {
      var track = e.target.closest("#vasScaleTrack");
      if (track) {
        var rect = track.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var percentage = x / rect.width;
        var score = Math.round(percentage * 10);
        score = Math.max(0, Math.min(10, score));
        
        state.score = score;
        saveState();
        renderGroups();
        renderResult();
        return;
      }

      var item = e.target.closest(".geneva-radio-item");
      if (!item) return;
      state.score = parseInt(item.getAttribute("data-value"), 10);
      saveState();
      renderGroups();
      renderResult();
    });

    bodyEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var item = e.target.closest(".geneva-radio-item");
      if (!item) return;
      e.preventDefault();
      state.score = parseInt(item.getAttribute("data-value"), 10);
      saveState();
      renderGroups();
      renderResult();
    });
  }

  function init() {
    bodyEl = document.getElementById("vasGroups");
    panelEl = document.getElementById("resultPanel");
    if (!bodyEl || !panelEl) return;

    loadState();
    renderGroups();
    renderResult();
    bindListeners();

    var infoBtn = document.getElementById("calcInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      if (window.SMP.references && window.SMP.references.vas && window.SMP.openRefMarkdownModal) {
        window.SMP.openRefMarkdownModal({ markdown: window.SMP.references.vas });
      } else {
        CU.openReferenceModal({ reference: REFERENCE });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();