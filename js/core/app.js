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

      var weekday = now.toLocaleDateString("ru-RU", { weekday: "long" });
      var rest = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      rest = rest.charAt(0).toUpperCase() + rest.slice(1);

      dateElement.innerHTML =
        '<span class="date-weekday">' + weekday + ',</span> ' +
        '<span class="date-rest">' + rest + '</span>';
    }

    update();
    setInterval(update, 60000);
  }

  function initVersion() {
    var el = document.getElementById("appVersion");
    if (el && window.SMP_VERSION) {
      el.textContent = "v" + window.SMP_VERSION;
    }
    var aboutEl = document.getElementById("aboutVersion");
    if (aboutEl && window.SMP_VERSION) {
      aboutEl.textContent = window.SMP_VERSION;
    }
    var footerEl = document.getElementById("footerVersion");
    if (footerEl && window.SMP_VERSION) {
      footerEl.textContent = window.SMP_VERSION;
    }
  }

  function initShare() {
    var btn = document.getElementById("shareAppBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var payload = {
        title: "СМП-103: протоколы и шпаргалки",
        text: "Информационно-справочная база сотрудника скорой медицинской помощи",
        url: "https://cordisnoctis.github.io/SMP_Minsk/index.html"
      };

      if (window.SMP && window.SMP.exporter && window.SMP.exporter.shareText) {
        window.SMP.exporter.shareText(payload);
      } else if (navigator.share) {
        navigator.share(payload).catch(function () {});
      }
    });
  }

  function init() {
    initGreetingAndDate();
    initVersion();
    initShare();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();