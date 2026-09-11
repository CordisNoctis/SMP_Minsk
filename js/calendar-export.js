(function () {
  "use strict";

  var MONTH_NAMES = (window.SMP && window.SMP.MONTH_NAMES) || [
    "Январь","Февраль","Март","Апрель","Май","Июнь",
    "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
  ];

  function exportCalendar() {
    if (!window.SMP || !window.SMP.viewDate) {
      (window.SMP.exporter || { showToast: console.warn }).showToast("Нет данных для экспорта");
      return;
    }

    var viewDate = window.SMP.viewDate;
    var monthName = MONTH_NAMES[viewDate.getMonth()] || "Месяц";
    var year = viewDate.getFullYear();

    var card = document.querySelector(".schedule-month-card");
    if (!card) {
      (window.SMP.exporter || { showToast: console.warn }).showToast("Не найден блок календаря");
      return;
    }

    window.SMP.exporter.export(card, {
      filename: "График_смен_" + monthName + "_" + year,
      format: "png",
      background: "#ffffff",
      hideSelectors: [".schedule-actions"],
      shareFirst: true,
      title: "График смен: " + monthName + " " + year
    }).catch(function () { /* toast уже показан */ });
  }

  window.SMP = window.SMP || {};
  window.SMP.exportCalendar = exportCalendar;
})();