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

  function applyInitialTheme() {
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
  }

  try {
    applyInitialTheme();
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();