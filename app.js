(function () {
  "use strict";

  function initGreetingAndDate() {
    const greetingElement = document.getElementById("greeting");
    const dateElement = document.getElementById("currentDate");

    if (!greetingElement || !dateElement) {
      return;
    }

    function updateDateTime() {
      const now = new Date();
      const hour = now.getHours();

      let greetingText = "Добро пожаловать";

      if (hour >= 5 && hour < 12) {
        greetingText = "Доброе утро";
      } else if (hour >= 12 && hour < 17) {
        greetingText = "Добрый день";
      } else if (hour >= 17 && hour < 23) {
        greetingText = "Добрый вечер";
      } else {
        greetingText = "Доброй ночи";
      }

      greetingElement.textContent = greetingText;

      const options = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      };

      let dateString = now.toLocaleDateString("ru-RU", options);

      dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);

      dateElement.textContent = dateString;
    }

    updateDateTime();

    setInterval(updateDateTime, 60000);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", async function () {
      try {
        await navigator.serviceWorker.register("./sw.js");
      } catch (error) {
        console.warn("Не удалось зарегистрировать Service Worker:", error);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initGreetingAndDate();
    registerServiceWorker();
  });
})();