(function () {
  "use strict";

  function formatTime(value) {
    if (!value) {
      return "--:--";
    }

    return value;
  }

  function syncTimeControl(control) {
    if (!control) {
      return;
    }

    const input = control.querySelector('input[type="time"]');
    const valueElement = control.querySelector(".time-control-value");

    if (!input || !valueElement) {
      return;
    }

    valueElement.textContent = formatTime(input.value);
  }

  function syncAllTimeControls() {
    const controls = document.querySelectorAll(".time-control");

    controls.forEach(function (control) {
      syncTimeControl(control);
    });
  }

  function openTimePicker(input) {
    if (!input || input.disabled) {
      return;
    }

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch (error) {
      // Если браузер не разрешил showPicker, используем запасной вариант.
    }

    input.focus();
    input.click();
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-time-control]");

    if (!button) {
      return;
    }

    const control = button.closest(".time-control");

    if (!control) {
      return;
    }

    const input = control.querySelector('input[type="time"]');

    if (!input || input.disabled) {
      return;
    }

    event.preventDefault();

    openTimePicker(input);
  });

  document.addEventListener("change", function (event) {
    if (event.target.matches('.time-control input[type="time"]')) {
      const control = event.target.closest(".time-control");
      syncTimeControl(control);
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.matches('.time-control input[type="time"]')) {
      const control = event.target.closest(".time-control");
      syncTimeControl(control);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncAllTimeControls);
  } else {
    syncAllTimeControls();
  }
})();