(function () {
  "use strict";

  function showToast(message) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.hidden = false;
    });

    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2500);
  }

  function exportCalendar() {
    if (typeof window.html2canvas !== "function") {
      showToast(
        "⚠️ Библиотека экспорта недоступна. Проверьте подключение к интернету для первой загрузки."
      );
      return;
    }

    if (!window.SMP || !window.SMP.viewDate) {
      showToast("Нет данных для экспорта");
      return;
    }

    var viewDate = window.SMP.viewDate;
    var monthNames = window.SMP.MONTH_NAMES || [];
    var monthName = monthNames[viewDate.getMonth()] || "Месяц";
    var year = viewDate.getFullYear();

    var calendarCard = document.querySelector(".schedule-month-card");
    var actionButtons = document.querySelector(".schedule-actions");

    if (!calendarCard) {
      showToast("Не найден блок календаря");
      return;
    }

    if (actionButtons) {
      actionButtons.style.display = "none";
    }

    showToast("📸 Создаю картинку...");

    window
      .html2canvas(calendarCard, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      })
      .then(function (canvas) {
        var link = document.createElement("a");
        link.download =
          "График_смен_" + monthName + "_" + year + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        showToast("📥 Картинка сохранена");
      })
      .catch(function (err) {
        console.warn("Ошибка экспорта:", err);
        showToast("❌ Не удалось сохранить картинку");
      })
      .finally(function () {
        if (actionButtons) {
          actionButtons.style.display = "";
        }
      });
  }

  window.SMP = window.SMP || {};
  window.SMP.exportCalendar = exportCalendar;
})();