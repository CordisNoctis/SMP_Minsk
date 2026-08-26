(function () {
  "use strict";

  function initGreetingAndDate() {
    var greetingElement = document.getElementById("greeting");
    var dateElement = document.getElementById("currentDate");

    if (!greetingElement || !dateElement) return;

    function update() {
      var now = new Date();
      var hour = now.getHours();
      var text = "Добро пожаловать";
      if (hour >= 5 && hour < 12) text = "Доброе утро";
      else if (hour >= 12 && hour < 17) text = "Добрый день";
      else if (hour >= 17 && hour < 23) text = "Добрый вечер";
      else text = "Доброй ночи";

      greetingElement.textContent = text;

      var opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
      var d = now.toLocaleDateString("ru-RU", opts);
      dateElement.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    }

    update();
    setInterval(update, 60000);
  }

  function initVersion() {
    var el = document.getElementById("appVersion");
    if (el && window.SMP_VERSION) {
      el.textContent = "v" + window.SMP_VERSION;
    }
  }

  function init() {
    initGreetingAndDate();
    initVersion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();