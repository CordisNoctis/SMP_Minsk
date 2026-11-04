(function () {
  "use strict";

  // =====================================================
  // Экспорт графика смен в системный календарь (.ics).
  //
  // Формат iCalendar открывается штатным календарём на всех
  // платформах: Android (Google Календарь), iOS/macOS (Календарь),
  // Windows (Outlook / Календарь), Linux (GNOME Calendar и др.).
  //
  // Режимы: все события / текущий месяц / выбранный период.
  // =====================================================

  var STORAGE_KEY = "smp-shift-schedule-v3";
  var MONTH_NAMES = (window.SMP && window.SMP.MONTH_NAMES) || [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  var ALLDAY_TITLES = {
    vacation: "Отпуск",
    sick: "Листок нетрудоспособности",
    courses: "Курсы"
  };

  function pad(v) { return (v < 10 ? "0" : "") + v; }

  function showToast(msg) {
    if (window.SMP && window.SMP.exporter && window.SMP.exporter.showToast) {
      window.SMP.exporter.showToast(msg);
    } else {
      console.log(msg);
    }
  }

  // ===== Чтение графика (тот же формат, что в shift-schedule.js) =====

  function loadSchedule() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      Object.keys(data).forEach(function (key) {
        var entry = data[key];
        if (!entry.events) data[key] = { events: [entry] };
      });
      return data;
    } catch (e) {
      return {};
    }
  }

  // ===== Экранирование и перенос длинных строк (RFC 5545) =====

  function escapeText(s) {
    return String(s)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  // Строки длиннее 75 байт переносятся: продолжение с новой строки через CRLF + пробел.
  // Символы (не байты!) собираем в строки допустимой длины, чтобы не рвать
  // кириллицу и эмодзи — их UTF-8 представление занимает несколько байт.
  function foldLine(line) {
    var chars = Array.from(line);
    var parts = [];
    var cur = "";
    var curLen = 0;
    var limit = 74;

    for (var i = 0; i < chars.length; i++) {
      var byteLen = unescape(encodeURIComponent(chars[i])).length;
      if (curLen + byteLen > limit && cur) {
        parts.push(cur);
        cur = "";
        curLen = 0;
        limit = 73; // у продолжения 1 байт занимает ведущий пробел
      }
      cur += chars[i];
      curLen += byteLen;
    }
    if (cur) parts.push(cur);

    return parts.map(function (p, idx) { return idx === 0 ? p : " " + p; }).join("\r\n");
  }

  // ===== Даты =====

  function icsDate(y, m, d) { // m: 1-12
    return y + pad(m) + pad(d);
  }

  function icsDateTime(y, m, d, h, min) {
    return y + pad(m) + pad(d) + "T" + pad(h) + pad(min) + "00";
  }

  function nowStampUTC() {
    var n = new Date();
    return (
      n.getUTCFullYear() + pad(n.getUTCMonth() + 1) + pad(n.getUTCDate()) +
      "T" + pad(n.getUTCHours()) + pad(n.getUTCMinutes()) + pad(n.getUTCSeconds()) + "Z"
    );
  }

  // ===== Сборка событий =====

  // Собирает массив { uid, dateKey, lines } из графика
  function collectEvents(schedule, fromKey, toKey) {
    var result = [];
    var stamp = nowStampUTC();
    var keys = Object.keys(schedule).sort();

    keys.forEach(function (key) {
      if (fromKey && key < fromKey) return;
      if (toKey && key > toKey) return;

      var entry = schedule[key];
      if (!entry || !entry.events) return;

      entry.events.forEach(function (ev, idx) {
        var lines = [];
        var uid = key.replace(/-/g, "") + "-" + idx + "@smp-minsk-pwa";
        var summary = "";
        var description = "";

        if (ev.type === "shift") {
          var name = ev.eventName || ev.templateName || "Смена";
          summary = name;
          if (ev.overtimeMinutes > 0) {
            var otH = Math.floor(ev.overtimeMinutes / 60);
            var otM = ev.overtimeMinutes % 60;
            description = "Переработка: " + otH + " ч" + (otM ? " " + otM + " мин" : "");
          }

          var endDay = key;
          if (ev.endsNextDay) {
            var p = key.split("-");
            var dt = new Date(+p[0], +p[1] - 1, +p[2]);
            dt.setDate(dt.getDate() + 1);
            endDay = dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate());
          }

          var ep = key.split("-");
          var ed = endDay.split("-");

          lines.push("DTSTART:" + icsDateTime(+ep[0], +ep[1], +ep[2], ev.startHour || 0, ev.startMinute || 0));
          lines.push("DTEND:" + icsDateTime(+ed[0], +ed[1], +ed[2], ev.endHour || 0, ev.endMinute || 0));
        } else {
          // Отпуск / больничный / курсы — событие на весь день
          summary = ev.eventName || ALLDAY_TITLES[ev.type] || "Событие";

          var dp = key.split("-");
          var dNext = new Date(+dp[0], +dp[1] - 1, +dp[2]);
          dNext.setDate(dNext.getDate() + 1); // DTEND — эксклюзивная дата
          lines.push("DTSTART;VALUE=DATE:" + icsDate(+dp[0], +dp[1], +dp[2]));
          lines.push("DTEND;VALUE=DATE:" + icsDate(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate()));
        }

        lines.unshift("DTSTAMP:" + stamp);
        lines.unshift("UID:" + uid);
        lines.push("SUMMARY:" + escapeText(summary));
        if (description) lines.push("DESCRIPTION:" + escapeText(description));

        result.push({ key: key, lines: lines });
      });
    });

    return result;
  }

  function buildIcs(fromKey, toKey) {
    var schedule = loadSchedule();
    var events = collectEvents(schedule, fromKey || null, toKey || null);

    var out = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SMP Minsk//PWA Shift Schedule//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:" + escapeText("График смен — СМП Минск"),
      "X-WR-TIMEZONE:Europe/Minsk"
    ];
    events.forEach(function (ev) {
      out.push("BEGIN:VEVENT");
      out.push.apply(out, ev.lines);
      out.push("END:VEVENT");
    });
    out.push("END:VCALENDAR");

    return { ics: out.map(foldLine).join("\r\n") + "\r\n", count: events.length };
  }

  // ===== Передача файла на устройство =====

  function isIOS() {
    var ua = navigator.userAgent || "";
    return /iP(hone|ad|od)/.test(ua) ||
           (/Mac/i.test(ua) && navigator.maxTouchPoints > 1);
  }

  function transfer(ics, filename) {
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);

    function revokeLater() { setTimeout(function () { URL.revokeObjectURL(url); }, 60000); }

    if (isIOS()) {
      // Safari открывает .ics в предпросмотре с кнопкой «Добавить все в Календарь»
      var w = window.open(url, "_blank");
      if (!w) downloadViaLink(url, filename); // всплывающее окно заблокировано
      revokeLater();
      return;
    }
    downloadViaLink(url, filename);
    revokeLater();
  }

  function downloadViaLink(url, filename) {
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ===== Модалка выбора диапазона =====

  var modalEl, periodEl, monthLabelEl, fromEl, toEl, downloadBtnEl;

  function monthKey() {
    var d = (window.SMP && window.SMP.viewDate) ? window.SMP.viewDate : new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }

  function firstAndLastDayOfMonth() {
    var d = (window.SMP && window.SMP.viewDate) ? window.SMP.viewDate : new Date();
    var y = d.getFullYear(), m = d.getMonth();
    var last = new Date(y, m + 1, 0).getDate();
    return {
      from: y + "-" + pad(m + 1) + "-01",
      to: y + "-" + pad(m + 1) + "-" + pad(last)
    };
  }

  function selectedRange() {
    var mode = document.querySelector('input[name="icsRange"]:checked');
    var value = mode ? mode.value : "all";

    if (value === "month") {
      var range = firstAndLastDayOfMonth();
      return { from: range.from, to: range.to, label: "месяц" };
    }
    if (value === "period") {
      var from = fromEl && fromEl.value ? fromEl.value : null;
      var to = toEl && toEl.value ? toEl.value : null;
      return { from: from, to: to, label: "период" };
    }
    return { from: null, to: null, label: "все события" };
  }

  function doExport() {
    var range = selectedRange();
    if (range.label === "период" && !range.from && !range.to) {
      showToast("⚠️ Укажите даты периода");
      return;
    }
    if (range.from && range.to && range.from > range.to) {
      showToast("⚠️ Дата начала позже даты окончания");
      return;
    }

    var built = buildIcs(range.from, range.to);
    if (built.count === 0) {
      showToast("⚠️ Нет событий для экспорта");
      return;
    }

    var filename;
    if (range.label === "месяц") {
      var r = firstAndLastDayOfMonth();
      filename = "График_смен_" + r.from.slice(0, 7) + ".ics";
    } else if (range.label === "период") {
      filename = "График_смен_" + (range.from || "начало") + "_" + (range.to || "конец") + ".ics";
    } else {
      filename = "График_смен_все.ics";
    }

    transfer(built.ics, filename);
    showToast("📅 Экспортировано событий: " + built.count + ". Откройте файл — календарь предложит добавить их.");
    close();
  }

  function close() {
    if (modalEl) {
      if (window.SMP && window.SMP.modal) window.SMP.modal.close(modalEl);
      else { modalEl.hidden = true; modalEl.setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open"); }
    }
  }

  function open() {
    if (!modalEl) return;
    // Подпись текущего месяца
    if (monthLabelEl) {
      var d = (window.SMP && window.SMP.viewDate) ? window.SMP.viewDate : new Date();
      monthLabelEl.textContent = MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
    }
    // Значения периода по умолчанию — текущий месяц
    if (fromEl && !fromEl.value) fromEl.value = firstAndLastDayOfMonth().from;
    if (toEl && !toEl.value) toEl.value = firstAndLastDayOfMonth().to;
    window.SMP.modal.open(modalEl);
  }

  function init() {
    modalEl = document.getElementById("ics-modal");
    if (!modalEl) return;

    periodEl = document.getElementById("icsPeriodFields");
    monthLabelEl = document.getElementById("icsMonthLabel");
    fromEl = document.getElementById("icsFromDate");
    toEl = document.getElementById("icsToDate");
    downloadBtnEl = document.getElementById("icsDownloadBtn");

    // Показ полей периода только для режима «Выбранный период»
    modalEl.addEventListener("change", function (e) {
      if (!e.target.name || e.target.name !== "icsRange") return;
      if (periodEl) periodEl.hidden = e.target.value !== "period";
    });

    if (downloadBtnEl) downloadBtnEl.addEventListener("click", doExport);

    // Кнопка на странице графика
    var btn = document.getElementById("exportIcsBtn");
    if (btn) btn.addEventListener("click", open);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Экспорт для тестов и внешнего вызова
  window.SMP = window.SMP || {};
  window.SMP.icsExport = {
    open: open,
    build: buildIcs
  };
})();
