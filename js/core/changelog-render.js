(function () {
  "use strict";

  window.SMP = window.SMP || {};

  var MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                     "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Определяет тип изменения с обратной совместимостью
  function resolveType(change) {
    if (change.type) return change.type;
    if (change.icon && window.APP_CHANGELEG_ICON_MAP && window.APP_CHANGELEG_ICON_MAP[change.icon]) {
      return window.APP_CHANGELEG_ICON_MAP[change.icon];
    }
    return "improve"; // по умолчанию
  }

  function getTypeInfo(type) {
    var types = window.APP_CHANGELOG_TYPES || {};
    return types[type] || { icon: "•", label: "", color: "#666" };
  }

  // Парсит дату "DD.MM.YYYY" и возвращает ключ группы "Октябрь 2026"
  function monthKey(dateStr) {
    var parts = (dateStr || "").split(".");
    if (parts.length < 3) return "Без даты";
    var monthNum = parseInt(parts[1], 10);
    var year = parts[2];
    return MONTH_NAMES[monthNum - 1] + " " + year;
  }

  function groupByMonth(versions) {
    var groups = {};
    var order = [];
    versions.forEach(function (v) {
      var key = monthKey(v.date);
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(v);
    });
    return { groups: groups, order: order };
  }

  function countByType(changes) {
    var counts = {};
    changes.forEach(function (c) {
      var t = resolveType(c);
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }

  function renderChangelog(container) {
    if (!container) return;
    if (!window.APP_CHANGELOG) return;

    var versions = window.APP_CHANGELOG;
    var monthGroups = groupByMonth(versions);

    // === Фильтры-чипы: собираем все встречающиеся типы ===
    var allTypes = {};
    versions.forEach(function (v) {
      v.changes.forEach(function (c) { allTypes[resolveType(c)] = true; });
    });

    var filterHtml = '<div class="changelog-filters">';
    filterHtml += '<button type="button" class="changelog-chip active" data-filter="all">Все</button>';
    Object.keys(allTypes).forEach(function (t) {
      var info = getTypeInfo(t);
      filterHtml += '<button type="button" class="changelog-chip" data-filter="' + t + '">' +
        info.icon + " " + info.label + '</button>';
    });
    filterHtml += '</div>';

    // === Версии, сгруппированные по месяцам ===
    var versionsHtml = '';
    monthGroups.order.forEach(function (monthKey) {
      versionsHtml += '<div class="changelog-month-header" data-month="' + monthKey + '">' +
        '<span class="changelog-month-icon">📅</span>' +
        '<span>' + escapeHtml(monthKey) + '</span>' +
        '<span class="changelog-month-toggle">▾</span>' +
        '</div>';
      versionsHtml += '<div class="changelog-month-group" data-month="' + monthKey + '">';

      monthGroups.groups[monthKey].forEach(function (v) {
        var isCurrent = !!v.current;
        var counts = countByType(v.changes);
        var badgesHtml = Object.keys(counts).map(function (t) {
          var info = getTypeInfo(t);
          return '<span class="changelog-badge" style="background:' + info.color + '22; color:' + info.color + ';">' +
            info.icon + " " + counts[t] + '</span>';
        }).join("");

        versionsHtml += '<details class="changelog-version' + (isCurrent ? " is-current" : "") + '" open>' +
          '<summary class="changelog-summary">' +
            '<div class="changelog-summary-left">' +
              '<span class="changelog-version-num">v' + escapeHtml(v.version) + '</span>' +
              '<span class="changelog-version-date">' + escapeHtml(v.date) + '</span>' +
              (isCurrent ? '<span class="changelog-current-badge">● Текущая</span>' : '') +
            '</div>' +
            '<div class="changelog-summary-right">' + badgesHtml +
              '<span class="changelog-summary-arrow">▸</span>' +
            '</div>' +
          '</summary>' +
          '<ul class="changelog-list">';

        v.changes.forEach(function (c) {
          var t = resolveType(c);
          var info = getTypeInfo(t);
          versionsHtml += '<li class="changelog-item changelog-type-' + t + '">' +
            '<span class="changelog-icon" style="color:' + info.color + ';">' + (c.icon || info.icon) + '</span>' +
            '<span class="changelog-text">' + escapeHtml(c.text) + '</span>' +
          '</li>';
        });

        versionsHtml += '</ul></details>';
      });

      versionsHtml += '</div>';
    });

    container.innerHTML = filterHtml + versionsHtml;

    // === Фильтрация ===
    container.querySelectorAll(".changelog-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var filter = this.getAttribute("data-filter");
        container.querySelectorAll(".changelog-chip").forEach(function (c) { c.classList.remove("active"); });
        this.classList.add("active");

        container.querySelectorAll(".changelog-item").forEach(function (item) {
          var typeMatch = item.className.match(/changelog-type-(\w+)/);
          var match = filter === "all" || (typeMatch && typeMatch[1] === filter);
          item.style.display = match ? "" : "none";
        });

        container.querySelectorAll(".changelog-version").forEach(function (ver) {
          var visible = ver.querySelectorAll('.changelog-item:not([style*="display: none"])').length;
          ver.style.display = visible === 0 ? "none" : "";
        });

        container.querySelectorAll(".changelog-month-group").forEach(function (group) {
          var visible = group.querySelectorAll('.changelog-version:not([style*="display: none"])').length;
          var month = group.getAttribute("data-month");
          group.style.display = visible === 0 ? "none" : "";
          var header = container.querySelector('.changelog-month-header[data-month="' + month + '"]');
          if (header) header.style.display = visible === 0 ? "none" : "";
        });
      });
    });

    // === Сворачивание групп месяцев ===
    container.querySelectorAll(".changelog-month-header").forEach(function (header) {
      header.addEventListener("click", function () {
        var month = this.getAttribute("data-month");
        var group = container.querySelector('.changelog-month-group[data-month="' + month + '"]');
        var toggle = this.querySelector(".changelog-month-toggle");
        if (!group) return;
        var isHidden = group.style.display === "none";
        if (isHidden) {
          group.style.display = "";
          toggle.textContent = "▾";
        } else {
          group.style.display = "none";
          toggle.textContent = "▸";
        }
      });
    });
  }

  window.SMP.renderChangelog = renderChangelog;
})();