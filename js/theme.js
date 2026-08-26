(function () {
  "use strict";

  var MODE_KEY = "smp-theme-mode";
  var START_KEY = "smp-night-start";
  var END_KEY = "smp-night-end";

  var DEFAULT_MODE = "schedule";
  var DEFAULT_START = "21:00";
  var DEFAULT_END = "07:00";

  function getStored(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setStored(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // localStorage может быть недоступен
    }
  }

  function parseTimeToMinutes(value, fallback) {
    if (!value || typeof value !== "string" || value.indexOf(":") === -1) {
      return fallback;
    }

    var parts = value.split(":");
    var hours = parseInt(parts[0], 10);
    var minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return fallback;
    }

    return hours * 60 + minutes;
  }

  function isSystemDark() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function isNightSchedule() {
    var startValue = getStored(START_KEY, DEFAULT_START);
    var endValue = getStored(END_KEY, DEFAULT_END);

    var start = parseTimeToMinutes(startValue, 21 * 60);
    var end = parseTimeToMinutes(endValue, 7 * 60);

    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (start === end) {
      return false;
    }

    if (start < end) {
      return nowMinutes >= start && nowMinutes < end;
    }

    return nowMinutes >= start || nowMinutes < end;
  }

  function shouldUseDarkTheme() {
    var mode = getStored(MODE_KEY, DEFAULT_MODE);

    if (mode === "day") {
      return false;
    }

    if (mode === "night") {
      return true;
    }

    if (mode === "system") {
      return isSystemDark();
    }

    return isNightSchedule();
  }

  function getModeText(mode) {
    if (mode === "system") {
      return "по настройкам устройства";
    }

    if (mode === "schedule") {
      return "по времени";
    }

    if (mode === "day") {
      return "день";
    }

    if (mode === "night") {
      return "ночь";
    }

    return "неизвестный режим";
  }

  function updateThemeText() {
    var mode = getStored(MODE_KEY, DEFAULT_MODE);
    var start = getStored(START_KEY, DEFAULT_START);
    var end = getStored(END_KEY, DEFAULT_END);

    var isDark =
      document.documentElement.getAttribute("data-theme") === "dark";

    var modeText = getModeText(mode);

    var summaryText =
      "Тема: " +
      (isDark ? "ночная" : "дневная") +
      ", " +
      modeText;

    if (mode === "schedule") {
      summaryText += " (" + start + "–" + end + ")";
    }

    var statusText =
      "Сейчас включена " +
      (isDark ? "ночная" : "дневная") +
      " тема. " +
      "Режим: " +
      modeText +
      ". " +
      "Ночной интервал: " +
      start +
      "–" +
      end +
      ".";

    var statusElement = document.getElementById("theme-status");
    var summaryElement = document.getElementById("theme-summary");

    if (statusElement) {
      statusElement.textContent = statusText;
    }

    if (summaryElement) {
      summaryElement.textContent = summaryText;
    }
  }

  function applyTheme() {
    var dark = shouldUseDarkTheme();

    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light"
    );

    var metaTheme = document.querySelector('meta[name="theme-color"]');

    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        dark ? "#40121c" : "#7a1f2b"
      );
    }

    updateThemeText();
  }

  function initSettings() {
    var form = document.getElementById("theme-settings-form");
    var radios = document.querySelectorAll('input[name="theme-mode"]');
    var startInput = document.getElementById("night-start");
    var endInput = document.getElementById("night-end");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    }

    if (!radios.length) {
      updateThemeText();
      return;
    }

    var savedMode = getStored(MODE_KEY, DEFAULT_MODE);

    function disableTimeInputsIfNotSchedule() {
      var currentMode = getStored(MODE_KEY, DEFAULT_MODE);
      var disabled = currentMode !== "schedule";

      if (startInput) {
        startInput.disabled = disabled;
      }

      if (endInput) {
        endInput.disabled = disabled;
      }
    }

    radios.forEach(function (radio) {
      radio.checked = radio.value === savedMode;

      radio.addEventListener("change", function () {
        setStored(MODE_KEY, this.value);
        disableTimeInputsIfNotSchedule();
        applyTheme();
      });
    });

    if (startInput) {
      startInput.value = getStored(START_KEY, DEFAULT_START);

      startInput.addEventListener("change", function () {
        setStored(START_KEY, this.value || DEFAULT_START);
        applyTheme();
      });
    }

    if (endInput) {
      endInput.value = getStored(END_KEY, DEFAULT_END);

      endInput.addEventListener("change", function () {
        setStored(END_KEY, this.value || DEFAULT_END);
        applyTheme();
      });
    }

    disableTimeInputsIfNotSchedule();
    updateThemeText();
  }

  applyTheme();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSettings);
  } else {
    initSettings();
  }

  setInterval(applyTheme, 60000);

  if (window.matchMedia) {
    var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", applyTheme);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(applyTheme);
    }
  }
})();