(function () {
  "use strict";

  var TMPL = window.SMP.templates;
  var STORAGE_KEY = "smp-shift-schedule-v3";
  var UPCOMING_DAYS_KEY = "smp-upcoming-days";
  var MINUTES_DISPLAY_KEY = "smp-minutes-display";

  var MONTH_NAMES = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  var MONTH_NAMES_GEN = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  var WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  var EVENT_PRIORITY = { sick: 1, vacation: 2, courses: 3, shift: 4 };

  var viewDate = new Date();
  viewDate.setDate(1);

  var scheduleData = {};
  var selectedKey = null;
  var editingEventIndex = null;
  var templatePickerMode = null; // "edit" или "bulk"

  var editState = {
    startHour: 8, startMinute: 0,
    endHour: 20, endMinute: 0,
    endsNextDay: false,
    overtimeActive: false,
    otHours: 0, otMinutes: 0,
    activeTemplateId: null,
    activeTemplateName: null
  };

  var bulkState = {
    viewDate: new Date(),
    selectedTemplate: null,
    selectedDays: {},
    eventType: "shift"
  };
  bulkState.viewDate.setDate(1);

  function pad(v, len) {
    var s = String(v);
    while (s.length < len) s = "0" + s;
    return s;
  }

  function getUpcomingDaysLimit() {
    try {
      var val = parseInt(localStorage.getItem(UPCOMING_DAYS_KEY), 10);
      if (isNaN(val) || val < 0) return 3;
      if (val > 10) return 10;
      return val;
    } catch (e) { return 3; }
  }

  function getMinutesDisplayMode() {
    try {
      var v = localStorage.getItem(MINUTES_DISPLAY_KEY);
      if (v === "hide-all" || v === "hide-zero" || v === "show-all") return v;
      return "hide-zero";
    } catch (e) { return "hide-zero"; }
  }

  function loadSchedule() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      Object.keys(data).forEach(function (key) {
        var entry = data[key];
        if (!entry.events) data[key] = { events: [entry] };
      });
      scheduleData = data;
    } catch (e) {
      console.warn("Не удалось загрузить график:", e);
      scheduleData = {};
    }
  }

  function saveSchedule() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleData));
    } catch (e) {
      console.warn("Не удалось сохранить график:", e);
      showToast("⚠️ Не удалось сохранить");
    }
  }

  function vibrate(d) {
    if (navigator.vibrate) try { navigator.vibrate(d || 10); } catch (e) {}
  }

  function dateKey(y, m, d) {
    return y + "-" + pad(m + 1, 2) + "-" + pad(d, 2);
  }

  function parseKey(key) {
    var p = key.split("-");
    return { year: +p[0], month: +p[1] - 1, day: +p[2] };
  }

  function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function getFirstWeekdayIndex(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; }

  function formatDuration(mins) {
    if (mins <= 0) return "0 мин";
    var h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return m + " мин";
    if (m === 0) return h + " ч";
    return h + " ч " + m + " мин";
  }

  function computeShiftDuration(sh, sm, eh, em, endsNextDay) {
    var startTotal = sh * 60 + sm, endTotal = eh * 60 + em;
    if (endsNextDay) return 1440 - startTotal + endTotal;
    if (endTotal > startTotal) return endTotal - startTotal;
    if (endTotal === startTotal) return 0;
    return endTotal - startTotal;
  }

  function computeShiftInMonth(sY, sM, sD, sh, sm, eh, em, endsNextDay, tY, tM) {
    var duration = computeShiftDuration(sh, sm, eh, em, endsNextDay);
    if (duration <= 0) return { currentMinutes: 0, transferMinutes: 0, duration: 0 };
    var shiftStart = new Date(sY, sM, sD, sh, sm, 0);
    var shiftEnd = new Date(shiftStart.getTime() + duration * 60000);
    var targetStart = new Date(tY, tM, 1, 0, 0, 0);
    var targetEnd = new Date(tY, tM + 1, 1, 0, 0, 0);
    var overlapStart = shiftStart > targetStart ? shiftStart : targetStart;
    var overlapEnd = shiftEnd < targetEnd ? shiftEnd : targetEnd;
    var current = 0;
    if (overlapStart < overlapEnd) current = Math.round((overlapEnd - overlapStart) / 60000);
    var transfer = 0;
    if (shiftEnd > targetEnd && sY === tY && sM === tM) {
      transfer = Math.round((shiftEnd - targetEnd) / 60000);
    }
    return { duration: duration, currentMinutes: current, transferMinutes: transfer };
  }

  // ===== Проверка пересечений смен =====

  function getShiftRangeInDayMinutes(shift, referenceDayKey, shiftDayKey) {
    // Приводит время смены к минутам относительно referenceDayKey
    var refParsed = parseKey(referenceDayKey);
    var shiftParsed = parseKey(shiftDayKey);

    var refDate = new Date(refParsed.year, refParsed.month, refParsed.day);
    var shiftDate = new Date(shiftParsed.year, shiftParsed.month, shiftParsed.day);

    var dayDiff = Math.round((shiftDate - refDate) / 86400000);

    var start = shift.startHour * 60 + shift.startMinute + dayDiff * 1440;
    var end = shift.endHour * 60 + shift.endMinute + dayDiff * 1440;

    if (shift.endsNextDay) {
      end += 1440;
    } else if (end <= start) {
      end += 1440;
    }

    return { start: start, end: end };
  }

  function checkShiftConflict(key, newShift, scheduleData, ignoreIndex) {
    var newRange = getShiftRangeInDayMinutes(newShift, key, key);
    var parsed = parseKey(key);

    var d = new Date(parsed.year, parsed.month, parsed.day);
    var prevD = new Date(d); prevD.setDate(d.getDate() - 1);
    var nextD = new Date(d); nextD.setDate(d.getDate() + 1);

    var checks = [
      { key: dateKey(prevD.getFullYear(), prevD.getMonth(), prevD.getDate()), label: "с предыдущего дня" },
      { key: key, label: "в этот день" },
      { key: dateKey(nextD.getFullYear(), nextD.getMonth(), nextD.getDate()), label: "со следующего дня" }
    ];

    for (var c = 0; c < checks.length; c++) {
      var checkKey = checks[c].key;
      var entry = scheduleData[checkKey];
      if (!entry || !entry.events) continue;

      for (var i = 0; i < entry.events.length; i++) {
        // Пропускаем редактируемую смену (если это тот же день и тот же индекс)
        if (checkKey === key && ignoreIndex !== null && ignoreIndex !== undefined && i === ignoreIndex) {
          continue;
        }

        var ev = entry.events[i];
        if (ev.type !== "shift") continue;

        var range = getShiftRangeInDayMinutes(ev, key, checkKey);

        if (Math.max(newRange.start, range.start) < Math.min(newRange.end, range.end)) {
          return "Пересечение " + checks[c].label + ": " +
            pad(ev.startHour, 2) + ":" + pad(ev.startMinute, 2) + "–" +
            pad(ev.endHour, 2) + ":" + pad(ev.endMinute, 2);
        }
      }
    }

    return null;
  }

  // ===== Рендеринг =====

  function updateMonthTitle() {
    var el = document.getElementById("monthTitle");
    if (el) el.textContent = MONTH_NAMES[viewDate.getMonth()] + " " + viewDate.getFullYear();
  }

  function renderWeekdays(containerId) {
    var c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = "";
    WEEKDAY_SHORT.forEach(function (n, i) {
      var d = document.createElement("div");
      d.className = "weekday-cell";
      if (i === 5 || i === 6) d.classList.add("weekday-weekend");
      d.textContent = n;
      c.appendChild(d);
    });
  }

  function getHighestPriorityEvent(entry) {
    if (!entry || !entry.events || entry.events.length === 0) return null;
    var best = null, bestPriority = 999;
    entry.events.forEach(function (ev) {
      var p = EVENT_PRIORITY[ev.type] || 999;
      if (p < bestPriority) { bestPriority = p; best = ev; }
    });
    return best;
  }

  function hasOvertime(entry) {
    if (!entry || !entry.events) return false;
    return entry.events.some(function (ev) {
      return ev.type === "shift" && ev.overtimeMinutes > 0;
    });
  }

  function makeTimeLine(h, m) {
    var mode = getMinutesDisplayMode();
    var showMinutes = mode === "show-all" || (mode === "hide-zero" && m !== 0);

    var line = document.createElement("span");
    line.className = "cc-time-line";

    var hour = document.createElement("span");
    hour.className = "cc-hour";
    hour.textContent = pad(h, 2);
    line.appendChild(hour);

    if (showMinutes) {
      var min = document.createElement("span");
      min.className = "cc-min";
      min.textContent = pad(m, 2);
      line.appendChild(min);
    }

    return line;
  }

  function makeMarkerCircle(type) {
    var letter = type === "sick" ? "ЛН" : (type === "vacation" ? "О" : "К");
    var c = document.createElement("span");
    c.className = "cc-marker cc-marker-" + type;
    c.textContent = letter;
    return c;
  }

  function makeBadgesColumn(entry) {
    var hasOT = hasOvertime(entry);
    var extra = entry.events.length - 1;
    if (!hasOT && extra <= 0) return null;

    var col = document.createElement("span");
    col.className = "cc-badges";

    if (hasOT) {
      var ot = document.createElement("span");
      ot.className = "cc-badge cc-badge-ot";
      ot.textContent = "П";
      col.appendChild(ot);
    }
    if (extra > 0) {
      var ex = document.createElement("span");
      ex.className = "cc-badge cc-badge-extra";
      ex.textContent = "+" + extra;
      col.appendChild(ex);
    }
    return col;
  }

  function renderCalendar() {
    var grid = document.getElementById("calendarGrid");
    if (!grid) return;

    updateMonthTitle();

    var year = viewDate.getFullYear();
    var month = viewDate.getMonth();
    var daysInMonth = getDaysInMonth(year, month);
    var firstWeekday = getFirstWeekdayIndex(year, month);

    var today = new Date();
    var todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

    grid.innerHTML = "";

    for (var i = 0; i < firstWeekday; i++) {
      var empty = document.createElement("div");
      empty.className = "calendar-cell calendar-cell-empty";
      grid.appendChild(empty);
    }

    var templates = TMPL.load();

    for (var d = 1; d <= daysInMonth; d++) {
      var key = dateKey(year, month, d);
      var entry = scheduleData[key];
      var dayOfWeek = (firstWeekday + d - 1) % 7;
      var isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "calendar-cell";
      cell.setAttribute("data-key", key);

      if (isWeekend) cell.classList.add("calendar-cell-weekend");
      if (key === todayKey) cell.classList.add("calendar-cell-today");

      var num = document.createElement("span");
      num.className = "calendar-cell-number";
      num.textContent = d;
      cell.appendChild(num);

      var displayEvent = getHighestPriorityEvent(entry);

      if (displayEvent) {
        var body = document.createElement("div");
        body.className = "cc-body";

        if (displayEvent.type === "sick" || displayEvent.type === "vacation" || displayEvent.type === "courses") {
          body.appendChild(makeMarkerCircle(displayEvent.type));
        } else if (displayEvent.type === "shift") {
          var template = displayEvent.templateId ? TMPL.find(templates, displayEvent.templateId) : null;
          var color = template ? TMPL.getColor(template.colorId) : TMPL.getColor("maroon");

          cell.classList.add("calendar-cell-custom");
          cell.style.background = color.bg;
          cell.style.color = color.text;
          cell.style.borderColor = color.bg;

          var timeBlock = document.createElement("div");
          timeBlock.className = "cc-time";
          timeBlock.appendChild(makeTimeLine(displayEvent.startHour, displayEvent.startMinute));
          timeBlock.appendChild(makeTimeLine(displayEvent.endHour, displayEvent.endMinute));
          body.appendChild(timeBlock);
        }

        cell.appendChild(body);

        var badges = makeBadgesColumn(entry);
        if (badges) cell.appendChild(badges);
      }

      grid.appendChild(cell);
    }

    updateStats();
    renderUpcomingShifts();
  }

  function renderUpcomingShifts() {
    var container = document.getElementById("upcomingShiftsList");
    var section = document.querySelector(".upcoming-shifts");
    if (!container) return;

    var limit = getUpcomingDaysLimit();
    if (limit === 0) { if (section) section.hidden = true; return; }
    if (section) section.hidden = false;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = [];
    var templates = TMPL.load();

    for (var dOffset = 0; dOffset < limit && upcoming.length < limit; dOffset++) {
      var date = new Date(today);
      date.setDate(date.getDate() + dOffset);
      var key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
      var entry = scheduleData[key];
      if (entry && entry.events) {
        entry.events.forEach(function (ev) {
          if (ev.type === "shift" && upcoming.length < limit) {
            upcoming.push({ date: date, key: key, event: ev });
          }
        });
      }
    }

    container.innerHTML = "";

    if (upcoming.length === 0) {
      var empty = document.createElement("p");
      empty.className = "upcoming-empty";
      empty.textContent = "Нет запланированных смен";
      container.appendChild(empty);
      return;
    }

    upcoming.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "upcoming-row";

      var template = item.event.templateId ? TMPL.find(templates, item.event.templateId) : null;
      var color = template ? TMPL.getColor(template.colorId) : TMPL.getColor("maroon");
      row.style.borderLeftColor = color.bg;

      var dateEl = document.createElement("div");
      dateEl.className = "upcoming-date";
      var wday = WEEKDAY_SHORT[(item.date.getDay() + 6) % 7];
      dateEl.textContent = wday + ", " + item.date.getDate() + " " + MONTH_NAMES_GEN[item.date.getMonth()];
      row.appendChild(dateEl);

      var infoEl = document.createElement("div");
      infoEl.className = "upcoming-info";

      var timeEl = document.createElement("div");
      timeEl.className = "upcoming-time";
      timeEl.textContent =
        pad(item.event.startHour, 2) + ":" + pad(item.event.startMinute, 2) +
        " – " +
        pad(item.event.endHour, 2) + ":" + pad(item.event.endMinute, 2) +
        (item.event.endsNextDay ? " (завтра)" : "");
      infoEl.appendChild(timeEl);

      if (item.event.templateName) {
        var nameEl = document.createElement("div");
        nameEl.className = "upcoming-template-name";
        nameEl.textContent = item.event.templateName;
        infoEl.appendChild(nameEl);
      }

      row.appendChild(infoEl);
      container.appendChild(row);
    });
  }

  function updateStats() {
    var year = viewDate.getFullYear();
    var month = viewDate.getMonth();

    var totalCurrent = 0, totalTransfer = 0, totalOvertime = 0, totalCourses = 0;

    var prevMonth = month - 1, prevYear = year;
    if (prevMonth < 0) { prevMonth = 11; prevYear = year - 1; }
    var prevLastDay = getDaysInMonth(prevYear, prevMonth);
    var prevKey = dateKey(prevYear, prevMonth, prevLastDay);
    var prevEntry = scheduleData[prevKey];

    if (prevEntry && prevEntry.events) {
      prevEntry.events.forEach(function (ev) {
        if (ev.type === "shift") {
          var r = computeShiftInMonth(
            prevYear, prevMonth, prevLastDay,
            ev.startHour, ev.startMinute, ev.endHour, ev.endMinute,
            !!ev.endsNextDay, year, month
          );
          totalCurrent += r.currentMinutes;
        }
      });
    }

    var daysInMonth = getDaysInMonth(year, month);
    for (var d = 1; d <= daysInMonth; d++) {
      var key = dateKey(year, month, d);
      var entry = scheduleData[key];
      if (!entry || !entry.events) continue;

      entry.events.forEach(function (ev) {
        if (ev.type === "shift") {
          var r = computeShiftInMonth(
            year, month, d,
            ev.startHour, ev.startMinute, ev.endHour, ev.endMinute,
            !!ev.endsNextDay, year, month
          );
          totalCurrent += r.currentMinutes;
          totalTransfer += r.transferMinutes;
          totalOvertime += ev.overtimeMinutes || 0;
        } else if (ev.type === "courses") {
          totalCourses++;
        }
      });
    }

    var statHours = document.getElementById("statHours");
    var statHoursNote = document.getElementById("statHoursNote");
    if (statHours) statHours.textContent = formatDuration(totalCurrent);
    if (statHoursNote) {
      if (totalTransfer > 0) {
        statHoursNote.textContent = formatDuration(totalTransfer) + " переходит на следующий месяц";
        statHoursNote.hidden = false;
      } else statHoursNote.hidden = true;
    }

    var statOvertimeCard = document.getElementById("statOvertimeCard");
    var statOvertime = document.getElementById("statOvertime");
    if (statOvertimeCard) {
      if (totalOvertime > 0) {
        statOvertime.textContent = formatDuration(totalOvertime);
        statOvertimeCard.hidden = false;
      } else statOvertimeCard.hidden = true;
    }

    var statCoursesCard = document.getElementById("statCoursesCard");
    var statCourses = document.getElementById("statCourses");
    if (statCoursesCard) {
      if (totalCourses > 0) {
        statCourses.textContent = totalCourses + " " + coursesWord(totalCourses);
        statCoursesCard.hidden = false;
      } else statCoursesCard.hidden = true;
    }
  }

  function coursesWord(n) {
    var l2 = n % 100, l = n % 10;
    if (l2 >= 11 && l2 <= 14) return "дней";
    if (l === 1) return "день";
    if (l >= 2 && l <= 4) return "дня";
    return "дней";
  }

  // ============ МОДАЛКА ДНЯ ============

  function openDayModal(key) {
    selectedKey = key;
    var parsed = parseKey(key);

    document.getElementById("dayViewMode").hidden = false;
    document.getElementById("dayEditMode").hidden = true;

    var titleEl = document.getElementById("dayViewTitle");
    if (titleEl) titleEl.textContent = parsed.day + " " + MONTH_NAMES_GEN[parsed.month] + " " + parsed.year;

    renderEventsList();

    var modal = document.getElementById("day-modal");
    if (modal) {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function renderEventsList() {
    var list = document.getElementById("eventsList");
    var emptyMsg = document.getElementById("eventsEmpty");
    if (!list) return;
    list.innerHTML = "";

    var entry = scheduleData[selectedKey];
    var events = (entry && entry.events) || [];

    if (events.length === 0) { if (emptyMsg) emptyMsg.hidden = false; return; }
    if (emptyMsg) emptyMsg.hidden = true;

    events.forEach(function (ev, index) {
      var row = document.createElement("div");
      row.className = "event-row";
      row.setAttribute("data-event-index", index);

      var content = document.createElement("div");
      content.className = "event-content";

      var icon = document.createElement("span");
      icon.className = "event-icon";

      var info = document.createElement("div");
      info.className = "event-info";

      var title = document.createElement("div");
      title.className = "event-title";

      var subtitle = document.createElement("div");
      subtitle.className = "event-subtitle";

      if (ev.type === "shift") {
        var templates = TMPL.load();
        var template = ev.templateId ? TMPL.find(templates, ev.templateId) : null;
        var color = template ? TMPL.getColor(template.colorId) : TMPL.getColor("maroon");

        row.style.borderLeftColor = color.bg;
        icon.textContent = "⏰";
        title.textContent = ev.templateName || "Смена";

        var timeText =
          pad(ev.startHour, 2) + ":" + pad(ev.startMinute, 2) +
          " – " +
          pad(ev.endHour, 2) + ":" + pad(ev.endMinute, 2) +
          (ev.endsNextDay ? " (завтра)" : "");

        var extras = [];
        if (ev.overtimeMinutes > 0) extras.push("+переработка " + formatDuration(ev.overtimeMinutes));
        subtitle.textContent = timeText + (extras.length ? " · " + extras.join(", ") : "");
      } else if (ev.type === "vacation") {
        row.style.borderLeftColor = "#2e7d32";
        icon.textContent = "🏖️";
        title.textContent = "Отпуск";
      } else if (ev.type === "sick") {
        row.style.borderLeftColor = "#e68a2e";
        icon.textContent = "📄";
        title.textContent = "Листок нетрудоспособности";
      } else if (ev.type === "courses") {
        row.style.borderLeftColor = "#6a1b9a";
        icon.textContent = "🎓";
        title.textContent = "Курсы";
      }

      info.appendChild(title);
      info.appendChild(subtitle);
      content.appendChild(icon);
      content.appendChild(info);

      var actions = document.createElement("div");
      actions.className = "event-actions";

      if (ev.type === "shift") {
        var editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "event-action-btn event-edit-btn";
        editBtn.setAttribute("data-action", "edit");
        editBtn.setAttribute("data-event-index", index);
        editBtn.textContent = "✎";
        editBtn.setAttribute("aria-label", "Редактировать");
        actions.appendChild(editBtn);
      }

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "event-action-btn event-delete-btn";
      delBtn.setAttribute("data-action", "delete");
      delBtn.setAttribute("data-event-index", index);
      delBtn.textContent = "🗑";
      delBtn.setAttribute("aria-label", "Удалить");
      actions.appendChild(delBtn);

      row.appendChild(content);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function openEditMode(eventIndex, template) {
    editingEventIndex = eventIndex;

    document.getElementById("dayViewMode").hidden = true;
    document.getElementById("dayEditMode").hidden = false;

    var parsed = parseKey(selectedKey);
    var dateEl = document.getElementById("editDate");
    if (dateEl) dateEl.textContent = parsed.day + " " + MONTH_NAMES_GEN[parsed.month] + " " + parsed.year;

    var titleEl = document.getElementById("dayEditTitle");

    var entry = scheduleData[selectedKey];
    var existingEvent = null;
    if (entry && entry.events && eventIndex !== null && entry.events[eventIndex]) {
      existingEvent = entry.events[eventIndex];
    }

    var isEditingExistingShift = !!(existingEvent && existingEvent.type === "shift");

    if (isEditingExistingShift) {
      if (titleEl) titleEl.textContent = "Редактирование смены";
      editState.startHour = existingEvent.startHour;
      editState.startMinute = existingEvent.startMinute;
      editState.endHour = existingEvent.endHour;
      editState.endMinute = existingEvent.endMinute;
      editState.endsNextDay = !!existingEvent.endsNextDay;
      editState.activeTemplateId = existingEvent.templateId || null;
      editState.activeTemplateName = existingEvent.templateName || null;
      editState.overtimeActive = (existingEvent.overtimeMinutes || 0) > 0;
      editState.otHours = Math.floor((existingEvent.overtimeMinutes || 0) / 60);
      editState.otMinutes = (existingEvent.overtimeMinutes || 0) % 60;
    } else if (template) {
      if (titleEl) titleEl.textContent = "Новая смена";
      applyTemplateToState(template);
    } else {
      if (titleEl) titleEl.textContent = "Новая смена";
      resetEditState();
    }

    var overtimeSection = document.getElementById("overtimeSection");
    if (overtimeSection) overtimeSection.hidden = !isEditingExistingShift;

    var otherEventsSection = document.getElementById("otherEventsSection");
    if (otherEventsSection) otherEventsSection.hidden = isEditingExistingShift;

    var otherEventsPanel = document.getElementById("otherEventsPanel");
    var otherEventsBtn = document.getElementById("otherEventsBtn");
    if (otherEventsPanel) otherEventsPanel.hidden = true;
    if (otherEventsBtn) otherEventsBtn.classList.remove("open");

    updateTemplateSelectButton();
    updateEditUI();

    var deleteBtn = document.getElementById("deleteEventBtn");
    if (deleteBtn) deleteBtn.hidden = eventIndex === null;
  }

  function applyTemplateToState(tpl) {
    editState.startHour = tpl.startHour;
    editState.startMinute = tpl.startMinute;
    editState.endHour = tpl.endHour;
    editState.endMinute = tpl.endMinute;
    editState.endsNextDay = !!tpl.endsNextDay;
    editState.activeTemplateId = tpl.id;
    editState.activeTemplateName = tpl.name;
    editState.overtimeActive = false;
    editState.otHours = 0;
    editState.otMinutes = 0;
  }

  function resetEditState() {
    editState.startHour = 8; editState.startMinute = 0;
    editState.endHour = 20; editState.endMinute = 0;
    editState.endsNextDay = false;
    editState.activeTemplateId = null;
    editState.activeTemplateName = null;
    editState.overtimeActive = false;
    editState.otHours = 0; editState.otMinutes = 0;
  }

  function updateTemplateSelectButton() {
    var btn = document.getElementById("templateSelectBtn");
    var label = document.getElementById("templateSelectLabel");
    if (!btn || !label) return;

    if (editState.activeTemplateId) {
      var templates = TMPL.load();
      var tpl = TMPL.find(templates, editState.activeTemplateId);
      if (tpl) {
        var color = TMPL.getColor(tpl.colorId);
        label.textContent =
          tpl.name + " · " +
          pad(tpl.startHour, 2) + ":" + pad(tpl.startMinute, 2) +
          "–" +
          pad(tpl.endHour, 2) + ":" + pad(tpl.endMinute, 2);
        btn.style.background = color.bg;
        btn.style.color = color.text;
        btn.style.borderColor = color.bg;
        return;
      }
    }

    label.textContent = "Шаблон смены";
    btn.style.background = "";
    btn.style.color = "";
    btn.style.borderColor = "";
  }

  function getFieldConfig(field) {
    if (field === "startHour" || field === "endHour" || field === "otHours") {
      return { modulus: 24, step: 1, max: 23, padLength: field === "otHours" ? 1 : 2 };
    }
    return { modulus: 60, step: 5, max: 59, padLength: 2 };
  }

  function getStateValue(field) {
    switch (field) {
      case "startHour": return editState.startHour;
      case "startMinute": return editState.startMinute;
      case "endHour": return editState.endHour;
      case "endMinute": return editState.endMinute;
      case "otHours": return editState.otHours;
      case "otMinutes": return editState.otMinutes;
    }
    return 0;
  }

  function setStateValue(field, val) {
    switch (field) {
      case "startHour":
        editState.startHour = val;
        editState.activeTemplateId = null; editState.activeTemplateName = null; break;
      case "startMinute":
        editState.startMinute = val;
        editState.activeTemplateId = null; editState.activeTemplateName = null; break;
      case "endHour":
        editState.endHour = val;
        editState.activeTemplateId = null; editState.activeTemplateName = null; break;
      case "endMinute":
        editState.endMinute = val;
        editState.activeTemplateId = null; editState.activeTemplateName = null; break;
      case "otHours": editState.otHours = val; break;
      case "otMinutes": editState.otMinutes = val; break;
    }
  }

  function updateTriple(field, value) {
    var cfg = getFieldConfig(field);
    var mainEl = document.getElementById(field + "Main");
    var prevEl = document.getElementById(field + "Prev");
    var nextEl = document.getElementById(field + "Next");

    var prevVal = (value - cfg.step + cfg.modulus) % cfg.modulus;
    var nextVal = (value + cfg.step) % cfg.modulus;

    if (mainEl) mainEl.value = pad(value, cfg.padLength);
    if (prevEl) prevEl.textContent = pad(prevVal, cfg.padLength);
    if (nextEl) nextEl.textContent = pad(nextVal, cfg.padLength);
  }

  function updateEditUI() {
    updateTriple("startHour", editState.startHour);
    updateTriple("startMinute", editState.startMinute);
    updateTriple("endHour", editState.endHour);
    updateTriple("endMinute", editState.endMinute);
    updateTriple("otHours", editState.otHours);
    updateTriple("otMinutes", editState.otMinutes);

    if (!editState.activeTemplateId) {
      var sT = editState.startHour * 60 + editState.startMinute;
      var eT = editState.endHour * 60 + editState.endMinute;
      editState.endsNextDay = (sT === eT) || (eT <= sT);
    }

    var hint = document.getElementById("timeHint");
    if (hint) {
      if (editState.endsNextDay) {
        hint.textContent = "Заканчивается завтра";
        hint.classList.add("time-hint-nextday");
      } else {
        hint.textContent = "Заканчивается сегодня";
        hint.classList.remove("time-hint-nextday");
      }
    }

    var otBlock = document.getElementById("overtimeBlock");
    var otBtn = document.getElementById("toggleOvertimeBtn");
    if (otBlock) otBlock.hidden = !editState.overtimeActive;
    if (otBtn) {
      if (editState.overtimeActive) {
        otBtn.textContent = "⏰ Переработка: " + editState.otHours + " ч " + pad(editState.otMinutes, 2) + " мин";
        otBtn.classList.add("active");
      } else {
        otBtn.textContent = "⏰ Добавить переработку";
        otBtn.classList.remove("active");
      }
    }

    var removeOtBtn = document.getElementById("removeOvertimeBtn");
    if (removeOtBtn) removeOtBtn.hidden = !editState.overtimeActive;

    var summary = document.getElementById("shiftSummary");
    if (summary) {
      var duration = computeShiftDuration(
        editState.startHour, editState.startMinute,
        editState.endHour, editState.endMinute,
        editState.endsNextDay
      );
      summary.textContent = duration === 0
        ? "Время начала и конца совпадают."
        : "Длительность смены: " + formatDuration(duration);
    }
  }

  function adjustTripleField(field, direction) {
    vibrate(8);
    var cfg = getFieldConfig(field);
    var current = getStateValue(field);
    var newVal = direction === "prev"
      ? (current - cfg.step + cfg.modulus) % cfg.modulus
      : (current + cfg.step) % cfg.modulus;
    setStateValue(field, newVal);
    updateTemplateSelectButton();
    updateEditUI();
  }

  function onTimeTyping(inputEl) {
    var raw = inputEl.value.replace(/[^0-9]/g, "");
    if (raw.length > 2) raw = raw.slice(0, 2);
    if (inputEl.value !== raw) inputEl.value = raw;
  }

  function commitTimeField(field, inputEl) {
    var cfg = getFieldConfig(field);
    var raw = inputEl.value.replace(/[^0-9]/g, "");
    var val = parseInt(raw, 10);
    if (isNaN(val)) val = 0;
    if (val > cfg.max) val = cfg.max;
    setStateValue(field, val);
    updateTemplateSelectButton();
    updateEditUI();
  }

  function saveCurrentEvent() {
    if (!selectedKey) return;

    var newShift = {
      startHour: editState.startHour,
      startMinute: editState.startMinute,
      endHour: editState.endHour,
      endMinute: editState.endMinute,
      endsNextDay: editState.endsNextDay
    };

    // Проверка пересечений (игнорируем текущую редактируемую смену)
    var conflict = checkShiftConflict(selectedKey, newShift, scheduleData, editingEventIndex);
    if (conflict) {
      vibrate(30);
      showToast("⚠️ " + conflict);
      return;
    }

    vibrate(15);

    var newEvent = {
      type: "shift",
      startHour: editState.startHour,
      startMinute: editState.startMinute,
      endHour: editState.endHour,
      endMinute: editState.endMinute,
      endsNextDay: editState.endsNextDay,
      templateId: editState.activeTemplateId || null,
      templateName: editState.activeTemplateName || null,
      overtimeMinutes: editState.overtimeActive ? editState.otHours * 60 + editState.otMinutes : 0
    };

    if (!scheduleData[selectedKey]) scheduleData[selectedKey] = { events: [] };

    if (editingEventIndex !== null) {
      scheduleData[selectedKey].events[editingEventIndex] = newEvent;
    } else {
      scheduleData[selectedKey].events.push(newEvent);
    }

    saveSchedule();
    closeDayModal();
    renderCalendar();
    showToast("✅ Сохранено");
  }

  function deleteEventAtIndex(index) {
    if (!selectedKey) return;
    var entry = scheduleData[selectedKey];
    if (!entry || !entry.events) return;

    entry.events.splice(index, 1);

    if (entry.events.length === 0) {
      delete scheduleData[selectedKey];
      saveSchedule();
      closeDayModal();
      renderCalendar();
      showToast("🗑️ День очищен");
      return;
    }

    saveSchedule();
    renderEventsList();
    renderCalendar();
    showToast("🗑️ Событие удалено");
  }

  function closeDayModal() {
    selectedKey = null;
    editingEventIndex = null;
    var modal = document.getElementById("day-modal");
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("modal-open");
  }

  // ============ ВЫБОР ШАБЛОНА (универсальный) ============

  function openTemplatePicker(mode) {
    templatePickerMode = mode;
    renderTemplatePickerList();
    var modal = document.getElementById("template-picker-modal");
    if (modal) {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function closeTemplatePicker() {
    var modal = document.getElementById("template-picker-modal");
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
  }

  function renderTemplatePickerList() {
    var list = document.getElementById("templatePickerList");
    if (!list) return;
    list.innerHTML = "";

    TMPL.load().forEach(function (tpl) {
      var color = TMPL.getColor(tpl.colorId);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "template-chip";
      btn.style.background = color.bg;
      btn.style.color = color.text;

      var name = document.createElement("span");
      name.className = "template-chip-name";
      name.textContent = tpl.name;
      btn.appendChild(name);

      var time = document.createElement("span");
      time.className = "template-chip-time";
      time.textContent =
        pad(tpl.startHour, 2) + ":" + pad(tpl.startMinute, 2) +
        "–" +
        pad(tpl.endHour, 2) + ":" + pad(tpl.endMinute, 2) +
        (tpl.endsNextDay ? " (завтра)" : "");
      btn.appendChild(time);

      btn.addEventListener("click", function () {
        vibrate(10);
        if (templatePickerMode === "bulk") {
          bulkState.selectedTemplate = tpl;
          updateBulkTemplateSelectButton();
          updateBulkHint();
          renderBulkCalendar();
        } else {
          applyTemplateToState(tpl);
          updateTemplateSelectButton();
          updateEditUI();
        }
        closeTemplatePicker();
      });

      list.appendChild(btn);
    });
  }

  // ============ МАССОВОЕ ДОБАВЛЕНИЕ ============

  function updateBulkTemplateSelectButton() {
    var btn = document.getElementById("bulkTemplateSelectBtn");
    var label = document.getElementById("bulkTemplateSelectLabel");
    if (!btn || !label) return;

    if (bulkState.selectedTemplate) {
      var tpl = bulkState.selectedTemplate;
      var color = TMPL.getColor(tpl.colorId);
      label.textContent =
        tpl.name + " · " +
        pad(tpl.startHour, 2) + ":" + pad(tpl.startMinute, 2) +
        "–" +
        pad(tpl.endHour, 2) + ":" + pad(tpl.endMinute, 2);
      btn.style.background = color.bg;
      btn.style.color = color.text;
      btn.style.borderColor = color.bg;
    } else {
      label.textContent = "Шаблон смены";
      btn.style.background = "";
      btn.style.color = "";
      btn.style.borderColor = "";
    }
  }

  function openBulkModalCommon() {
    var modal = document.getElementById("bulk-modal");
    if (modal) {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function openBulkModal() {
    bulkState.eventType = "shift";
    bulkState.viewDate = new Date(viewDate);
    bulkState.selectedTemplate = null;
    bulkState.selectedDays = {};

    var t = document.getElementById("bulkTitle");
    var desc = document.getElementById("bulkDescription");
    var tplSel = document.getElementById("bulkTemplateSelect");
    if (t) t.textContent = "Массовое добавление смен";
    if (desc) desc.textContent = "Выберите шаблон и нажмите на дни в календаре.";
    if (tplSel) tplSel.hidden = false;

    renderBulkCalendar();
    updateBulkTemplateSelectButton();
    updateBulkHint();
    openBulkModalCommon();
  }

  function openQuickAddForType(type) {
    bulkState.eventType = type;
    bulkState.viewDate = new Date(viewDate);
    bulkState.selectedTemplate = null;
    bulkState.selectedDays = {};

    var titles = { vacation: "Отпуск", sick: "Листок нетрудоспособности", courses: "Курсы" };
    var t = document.getElementById("bulkTitle");
    var desc = document.getElementById("bulkDescription");
    var tplSel = document.getElementById("bulkTemplateSelect");
    if (t) t.textContent = titles[type] || "Добавление";
    if (desc) desc.textContent = "Нажмите на дни, чтобы добавить событие.";
    if (tplSel) tplSel.hidden = true;

    renderBulkCalendar();
    updateBulkHint();
    openBulkModalCommon();
  }

  function updateBulkHint() {
    var hint = document.getElementById("bulkHint");
    if (!hint) return;
    var selectedCount = Object.keys(bulkState.selectedDays).length;

    if (bulkState.eventType === "shift") {
      var hasTemplate = !!bulkState.selectedTemplate;
      if (!hasTemplate) hint.textContent = "Сначала выберите шаблон";
      else if (selectedCount === 0) hint.textContent = "Выбран шаблон «" + bulkState.selectedTemplate.name + "». Нажмите на дни.";
      else hint.textContent = "Выбрано дней: " + selectedCount + ". Нажмите «Применить».";
    } else {
      if (selectedCount === 0) hint.textContent = "Нажмите на дни для добавления.";
      else hint.textContent = "Выбрано дней: " + selectedCount + ". Нажмите «Применить».";
    }
  }

  function renderBulkCalendar() {
    var grid = document.getElementById("bulkCalendarGrid");
    var titleEl = document.getElementById("bulkMonthTitle");
    if (!grid) return;

    renderWeekdays("bulkWeekdays");

    var year = bulkState.viewDate.getFullYear();
    var month = bulkState.viewDate.getMonth();
    if (titleEl) titleEl.textContent = MONTH_NAMES[month] + " " + year;

    var daysInMonth = getDaysInMonth(year, month);
    var firstWeekday = getFirstWeekdayIndex(year, month);

    grid.innerHTML = "";

    for (var i = 0; i < firstWeekday; i++) {
      var empty = document.createElement("div");
      empty.className = "calendar-cell calendar-cell-empty";
      grid.appendChild(empty);
    }

    var templates = TMPL.load();

    for (var d = 1; d <= daysInMonth; d++) {
      var key = dateKey(year, month, d);
      var dayOfWeek = (firstWeekday + d - 1) % 7;
      var isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "calendar-cell bulk-cell";
      cell.setAttribute("data-key", key);

      if (isWeekend) cell.classList.add("calendar-cell-weekend");

      // Применяем цвет шаблона к выделенным дням
      if (bulkState.selectedDays[key]) {
        cell.classList.add("bulk-selected");

        if (bulkState.eventType === "shift" && bulkState.selectedTemplate) {
          var color = TMPL.getColor(bulkState.selectedTemplate.colorId);
          cell.style.background = color.bg;
          cell.style.color = color.text;
          cell.style.borderColor = color.bg;
        } else if (
          bulkState.eventType === "vacation" ||
          bulkState.eventType === "sick" ||
          bulkState.eventType === "courses"
        ) {
          var colors = { vacation: "#2e7d32", sick: "#e68a2e", courses: "#6a1b9a" };
          var c = colors[bulkState.eventType];
          cell.style.borderColor = c;
          cell.style.boxShadow = "0 0 0 2px " + c;
          addBulkMarker(cell, bulkState.eventType);
        }
      }

      var num = document.createElement("span");
      num.className = "calendar-cell-number";
      num.textContent = d;
      cell.appendChild(num);

      cell.addEventListener("click", function (event) {
        var target = event.currentTarget;
        var k = target.getAttribute("data-key");
        vibrate(8);
        toggleBulkDay(k, target);
      });

      grid.appendChild(cell);
    }

    updateBulkHint();
  }

  function toggleBulkDay(key, cell) {
    if (bulkState.selectedDays[key]) {
      delete bulkState.selectedDays[key];
      cell.classList.remove("bulk-selected");
      cell.style.background = "";
      cell.style.color = "";
      cell.style.borderColor = "";
      cell.style.boxShadow = "";
      removeBulkMarker(cell);
    } else {
      bulkState.selectedDays[key] = true;
      cell.classList.add("bulk-selected");

      if (bulkState.eventType === "shift" && bulkState.selectedTemplate) {
        var color = TMPL.getColor(bulkState.selectedTemplate.colorId);
        cell.style.background = color.bg;
        cell.style.color = color.text;
        cell.style.borderColor = color.bg;
        cell.style.boxShadow = "";
      } else if (
        bulkState.eventType === "vacation" ||
        bulkState.eventType === "sick" ||
        bulkState.eventType === "courses"
      ) {
        var colors = { vacation: "#2e7d32", sick: "#e68a2e", courses: "#6a1b9a" };
        var c = colors[bulkState.eventType];
        cell.style.borderColor = c;
        cell.style.boxShadow = "0 0 0 2px " + c;
        addBulkMarker(cell, bulkState.eventType);
      }
    }
    updateBulkHint();
  }

  function applyBulk() {
    var keys = Object.keys(bulkState.selectedDays);
    if (keys.length === 0) { showToast("⚠️ Выберите дни"); return; }

    if (bulkState.eventType === "shift" && !bulkState.selectedTemplate) {
      showToast("⚠️ Выберите шаблон");
      return;
    }

    vibrate(15);

    var added = 0;
    var skipped = [];

    keys.forEach(function (key) {
      if (!scheduleData[key]) scheduleData[key] = { events: [] };

      if (bulkState.eventType === "shift") {
        var newShift = {
          startHour: bulkState.selectedTemplate.startHour,
          startMinute: bulkState.selectedTemplate.startMinute,
          endHour: bulkState.selectedTemplate.endHour,
          endMinute: bulkState.selectedTemplate.endMinute,
          endsNextDay: !!bulkState.selectedTemplate.endsNextDay
        };

        var conflict = checkShiftConflict(key, newShift, scheduleData, null);
        if (conflict) {
          skipped.push(key);
          return;
        }

        scheduleData[key].events.push({
          type: "shift",
          startHour: newShift.startHour,
          startMinute: newShift.startMinute,
          endHour: newShift.endHour,
          endMinute: newShift.endMinute,
          endsNextDay: newShift.endsNextDay,
          templateId: bulkState.selectedTemplate.id,
          templateName: bulkState.selectedTemplate.name,
          overtimeMinutes: 0
        });
      } else {
        scheduleData[key].events.push({ type: bulkState.eventType });
      }
      added++;
    });

    saveSchedule();
    closeBulkModal();
    renderCalendar();

    if (skipped.length > 0) {
      showToast("⚠️ Добавлено: " + added + ", пропущено из-за пересечений: " + skipped.length);
    } else {
      showToast("✅ Добавлено: " + added);
    }
  }

  function closeBulkModal() {
    var modal = document.getElementById("bulk-modal");
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("modal-open");
  }

  function clearBulkSelection() {
    bulkState.selectedDays = {};
    renderBulkCalendar();
  }

  // ============ UI BINDINGS ============

  function changeMonth(delta) {
    vibrate(10);
    viewDate.setMonth(viewDate.getMonth() + delta);
    renderCalendar();
  }

  // ===== Маркеры событий в bulk-модалке =====

function addBulkMarker(cell, type) {
  removeBulkMarker(cell);
  var letter = type === "sick" ? "ЛН" : (type === "vacation" ? "О" : "К");
  var marker = document.createElement("span");
  marker.className = "bulk-marker bulk-marker-" + type;
  marker.textContent = letter;
  cell.appendChild(marker);
}

function removeBulkMarker(cell) {
  var old = cell.querySelector(".bulk-marker");
  if (old) old.remove();
}

// ===== Свайпы =====

function attachSwipe(el, onSwipeLeft, onSwipeRight) {
  if (!el) return;
  var startX = 0, startY = 0;

  el.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
  }, { passive: true });

  el.addEventListener("touchend", function (e) {
    if (e.changedTouches.length === 1) {
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
    }
  }, { passive: true });
}

function attachMonthSwipes() {
  // Основной график
  var grid = document.getElementById("calendarGrid");
  attachSwipe(
    grid,
    function () { changeMonth(1); },
    function () { changeMonth(-1); }
  );

  // Календарь в bulk-модалке
  var bulkGrid = document.getElementById("bulkCalendarGrid");
  attachSwipe(
    bulkGrid,
    function () {
      bulkState.viewDate.setMonth(bulkState.viewDate.getMonth() + 1);
      renderBulkCalendar();
    },
    function () {
      bulkState.viewDate.setMonth(bulkState.viewDate.getMonth() - 1);
      renderBulkCalendar();
    }
  );
}

function attachWheelMouse() {
  var wheels = document.querySelectorAll("#dayEditMode .wheel-triple");

  wheels.forEach(function (wheel) {
    var mainEl = wheel.querySelector(".wheel-main-input, .wheel-main");
    if (!mainEl || !mainEl.id) return;

    var field = mainEl.id.replace("Main", "");
    var lastChange = 0;

    wheel.addEventListener("wheel", function (e) {
      // Не даём странице/модалке прокручиваться
      e.preventDefault();

      // Троттлинг: не меняем значение чаще, чем раз в 120 мс
      var now = Date.now();
      if (now - lastChange < 120) return;
      lastChange = now;

      var direction = e.deltaY < 0 ? "next" : "prev";

      // Анимация прокрутки значения
      mainEl.classList.remove("wheel-anim-up", "wheel-anim-down");
      void mainEl.offsetWidth; // перезапуск анимации

      var animClass = direction === "next" ? "wheel-anim-up" : "wheel-anim-down";
      mainEl.classList.add(animClass);

      setTimeout(function () {
        adjustTripleField(field, direction);
      }, 100);

      setTimeout(function () {
        mainEl.classList.remove(animClass);
      }, 260);
    }, { passive: false });
  });
}

function attachWheelSwipe() {
  var wheels = document.querySelectorAll("#dayEditMode .wheel-triple");
  var STEP_PX = 40; // пикселей на одно изменение значения

  wheels.forEach(function (wheel) {
    var mainEl = wheel.querySelector(".wheel-main-input, .wheel-main");
    if (!mainEl || !mainEl.id) return;

    var field = mainEl.id.replace("Main", "");
    var lastY = 0;
    var accum = 0;
    var isDragging = false;

    wheel.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      lastY = e.touches[0].clientY;
      accum = 0;
      isDragging = true;
      mainEl.classList.remove("wheel-anim-up", "wheel-anim-down");
      mainEl.style.transition = "";
    }, { passive: true });

    wheel.addEventListener("touchmove", function (e) {
      if (!isDragging || e.touches.length !== 1) return;

      var currentY = e.touches[0].clientY;
      var dy = currentY - lastY;
      lastY = currentY;
      accum += dy;

      // Визуальный сдвиг значения за пальцем
      var visualOffset = accum;
      if (visualOffset > STEP_PX) visualOffset = STEP_PX;
      if (visualOffset < -STEP_PX) visualOffset = -STEP_PX;

      mainEl.style.transform = "translateY(" + visualOffset + "px)";
      mainEl.style.opacity = String(1 - Math.abs(visualOffset) / (STEP_PX * 2.5));

      // Свайп вверх -> следующее значение
      if (accum <= -STEP_PX) {
        adjustTripleField(field, "next");
        accum += STEP_PX;
        vibrate(5);
      }
      // Свайп вниз -> предыдущее значение
      else if (accum >= STEP_PX) {
        adjustTripleField(field, "prev");
        accum -= STEP_PX;
        vibrate(5);
      }
    }, { passive: true });

    wheel.addEventListener("touchend", function () {
      if (!isDragging) return;
      isDragging = false;

      // Плавный возврат значения на место
      mainEl.style.transition = "transform 0.15s ease, opacity 0.15s ease";
      mainEl.style.transform = "translateY(0)";
      mainEl.style.opacity = "1";

      setTimeout(function () {
        mainEl.style.transition = "";
      }, 160);
    }, { passive: true });

    wheel.addEventListener("touchcancel", function () {
      isDragging = false;
      mainEl.style.transform = "";
      mainEl.style.opacity = "";
      mainEl.style.transition = "";
    }, { passive: true });
  });
}

  function bindUI() {
    var grid = document.getElementById("calendarGrid");
    if (grid) {
      grid.addEventListener("click", function (event) {
        var cell = event.target.closest(".calendar-cell");
        if (!cell || cell.classList.contains("calendar-cell-empty")) return;
        var key = cell.getAttribute("data-key");
        if (!key) return;
        vibrate(10);
        openDayModal(key);
            // Свайпы перелистывания месяцев и прокрутка времени
        attachMonthSwipes();
        attachWheelSwipe();
        attachWheelMouse();
      });
    }

    var prevMonthBtn = document.getElementById("prevMonthBtn");
    var nextMonthBtn = document.getElementById("nextMonthBtn");
    if (prevMonthBtn) prevMonthBtn.addEventListener("click", function () { changeMonth(-1); });
    if (nextMonthBtn) nextMonthBtn.addEventListener("click", function () { changeMonth(1); });

    var addEventBtn = document.getElementById("addEventBtn");
    if (addEventBtn) {
      addEventBtn.addEventListener("click", function () {
        vibrate(10);
        openEditMode(null, null);
      });
    }

    document.addEventListener("click", function (event) {
      var actionBtn = event.target.closest("[data-action]");
      if (!actionBtn) return;
      var action = actionBtn.getAttribute("data-action");
      var idx = parseInt(actionBtn.getAttribute("data-event-index"), 10);
      if (action === "edit") {
        vibrate(10);
        openEditMode(idx, null);
      } else if (action === "delete") {
        vibrate(15);
        if (confirm("Удалить это событие?")) deleteEventAtIndex(idx);
      }
    });

    document.addEventListener("click", function (event) {
      var quickTypeBtn = event.target.closest("[data-quick-type]");
      if (!quickTypeBtn) return;
      var type = quickTypeBtn.getAttribute("data-quick-type");
      vibrate(10);
      closeDayModal();
      openQuickAddForType(type);
    });

    var templateSelectBtn = document.getElementById("templateSelectBtn");
    if (templateSelectBtn) {
      templateSelectBtn.addEventListener("click", function () {
        vibrate(10);
        openTemplatePicker("edit");
      });
    }

    var bulkTemplateSelectBtn = document.getElementById("bulkTemplateSelectBtn");
    if (bulkTemplateSelectBtn) {
      bulkTemplateSelectBtn.addEventListener("click", function () {
        vibrate(10);
        openTemplatePicker("bulk");
      });
    }

    var toggleOvertimeBtn = document.getElementById("toggleOvertimeBtn");
    if (toggleOvertimeBtn) {
      toggleOvertimeBtn.addEventListener("click", function () {
        vibrate(10);
        editState.overtimeActive = !editState.overtimeActive;
        if (!editState.overtimeActive) { editState.otHours = 0; editState.otMinutes = 0; }
        updateEditUI();
      });
    }

    var removeOvertimeBtn = document.getElementById("removeOvertimeBtn");
    if (removeOvertimeBtn) {
      removeOvertimeBtn.addEventListener("click", function () {
        vibrate(10);
        editState.overtimeActive = false;
        editState.otHours = 0;
        editState.otMinutes = 0;
        updateEditUI();
      });
    }

    var otherEventsBtn = document.getElementById("otherEventsBtn");
    var otherEventsPanel = document.getElementById("otherEventsPanel");
    if (otherEventsBtn && otherEventsPanel) {
      otherEventsBtn.addEventListener("click", function () {
        vibrate(8);
        var isHidden = otherEventsPanel.hidden;
        otherEventsPanel.hidden = !isHidden;
        otherEventsBtn.classList.toggle("open", isHidden);
      });
    }

    document.addEventListener("click", function (event) {
      var adjacent = event.target.closest(".wheel-adjacent");
      if (adjacent) {
        var field = adjacent.getAttribute("data-field");
        var direction = adjacent.getAttribute("data-direction");
        adjustTripleField(field, direction);
      }
    });

    var timeInputIds = ["startHour", "startMinute", "endHour", "endMinute", "otHours", "otMinutes"];
    timeInputIds.forEach(function (field) {
      var inputEl = document.getElementById(field + "Main");
      if (!inputEl) return;
      inputEl.addEventListener("input", function () { onTimeTyping(inputEl); });
      inputEl.addEventListener("blur", function () { commitTimeField(field, inputEl); });
      inputEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); inputEl.blur(); }
      });
    });

    var saveEventBtn = document.getElementById("saveEventBtn");
    if (saveEventBtn) saveEventBtn.addEventListener("click", saveCurrentEvent);

    var cancelEditBtn = document.getElementById("cancelEditBtn");
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", function () {
        document.getElementById("dayViewMode").hidden = false;
        document.getElementById("dayEditMode").hidden = true;
        renderEventsList();
      });
    }

    var backToViewBtn = document.getElementById("backToViewBtn");
    if (backToViewBtn) {
      backToViewBtn.addEventListener("click", function () {
        document.getElementById("dayViewMode").hidden = false;
        document.getElementById("dayEditMode").hidden = true;
        renderEventsList();
      });
    }

    var deleteEventBtn = document.getElementById("deleteEventBtn");
    if (deleteEventBtn) {
      deleteEventBtn.addEventListener("click", function () {
        if (editingEventIndex === null) return;
        if (!confirm("Удалить это событие?")) return;
        deleteEventAtIndex(editingEventIndex);
        if (scheduleData[selectedKey] && scheduleData[selectedKey].events.length > 0) {
          document.getElementById("dayViewMode").hidden = false;
          document.getElementById("dayEditMode").hidden = true;
        }
      });
    }

    var addBulkBtn = document.getElementById("addBulkBtn");
    if (addBulkBtn) addBulkBtn.addEventListener("click", openBulkModal);

    var bulkPrev = document.getElementById("bulkPrevMonth");
    var bulkNext = document.getElementById("bulkNextMonth");
    if (bulkPrev) bulkPrev.addEventListener("click", function () {
      bulkState.viewDate.setMonth(bulkState.viewDate.getMonth() - 1);
      renderBulkCalendar();
    });
    if (bulkNext) bulkNext.addEventListener("click", function () {
      bulkState.viewDate.setMonth(bulkState.viewDate.getMonth() + 1);
      renderBulkCalendar();
    });

    var bulkClear = document.getElementById("bulkClearSelection");
    if (bulkClear) bulkClear.addEventListener("click", clearBulkSelection);

    var bulkApply = document.getElementById("bulkApplyBtn");
    if (bulkApply) bulkApply.addEventListener("click", applyBulk);

    var exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        if (window.SMP && typeof window.SMP.exportCalendar === "function") {
          window.SMP.exportCalendar();
        }
      });
    }

    document.addEventListener("click", function (event) {
      if (event.target.matches(".modal-backdrop")) {
        var modal = event.target.closest(".modal");
        if (modal) {
          modal.hidden = true;
          modal.setAttribute("aria-hidden", "true");
          document.body.classList.remove("modal-open");
        }
      }
    });

    document.addEventListener("touchmove", function (e) {
      var target = e.target;
      if (!target || !target.closest) return;
      var inModalBody = target.closest(".modal-body");
      var inModal = target.closest(".modal");
      if (inModal && !inModalBody) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  function showToast(message) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.hidden = false; });
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3500);
  }

    function attachCalendarSwipe() {
    var grid = document.getElementById("calendarGrid");
    if (!grid) return;

    var startX = 0, startY = 0;

    grid.addEventListener("touchstart", function (e) {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    grid.addEventListener("touchend", function (e) {
      if (e.changedTouches.length === 1) {
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;

        // Горизонтальный свайп (значительно больше вертикального)
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) {
            changeMonth(1);   // свайп влево → следующий месяц
          } else {
            changeMonth(-1);  // свайп вправо → предыдущий месяц
          }
        }
      }
    }, { passive: true });
  }

  function init() {
    loadSchedule();
    renderWeekdays("calendarWeekdays");
    renderCalendar();
    bindUI();
    attachCalendarSwipe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.SMP = window.SMP || {};
  window.SMP.scheduleData = scheduleData;
  window.SMP.viewDate = viewDate;
  window.SMP.MONTH_NAMES = MONTH_NAMES;
})();