(function () {
  "use strict";

  // ===== Переключение таба =====
  function switchTab(which) {
    var specBlock = document.getElementById("specContent");
    var patBlock = document.getElementById("patContent");
    var tabSpec = document.getElementById("tabSpec");
    var tabPat = document.getElementById("tabPat");

    if (!specBlock || !patBlock || !tabSpec || !tabPat) return;

    if (which === "patient") {
      specBlock.hidden = true;
      patBlock.hidden = false;
      tabSpec.classList.remove("active");
      tabPat.classList.add("active");
    } else {
      specBlock.hidden = false;
      patBlock.hidden = true;
      tabSpec.classList.add("active");
      tabPat.classList.remove("active");
    }
  }

  // ===== Привязка обработчиков =====
  function bindUI() {
    var tabSpec = document.getElementById("tabSpec");
    var tabPat = document.getElementById("tabPat");

    if (tabSpec) {
      tabSpec.addEventListener("click", function () {
        switchTab("specialist");
      });
    }

    if (tabPat) {
      tabPat.addEventListener("click", function () {
        switchTab("patient");
      });
    }
  }

  // ===== Инициализация =====
  function init() {
    // Если препарат не найден — не привязываем обработчики
    if (window.__SMP_DRUG_NOT_FOUND__) return;
    bindUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();