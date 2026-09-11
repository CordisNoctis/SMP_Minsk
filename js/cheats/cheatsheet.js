(function () {
  "use strict";

  function getDrugId() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id") || "salbutamol";
  }

  function renderDrug() {
    // Если препарат не найден в базе — заглушка уже показана в HTML
    if (window.__SMP_DRUG_NOT_FOUND__) return;

    var id = getDrugId();
    var drug = (window.SMP.drugs && window.SMP.drugs.get(id)) || null;

    if (!drug) {
      document.body.innerHTML = "<p>Препарат не найден.</p>";
      return;
    }

    var titleEl = document.getElementById("drugTitle");
    if (titleEl) titleEl.textContent = drug.title;

    var tabs = document.getElementById("drugTabs");
    var specBlock = document.getElementById("specContent");
    var patBlock = document.getElementById("patContent");

    if (drug.specialist && drug.patient) {
      tabs.hidden = false;
      specBlock.innerHTML = window.SMP.markdown.parse(drug.specialist);
      patBlock.innerHTML = window.SMP.markdown.parse(drug.patient);
      patBlock.hidden = true;
    } else {
      tabs.hidden = true;
      specBlock.innerHTML = window.SMP.markdown.parse(drug.specialist || drug.patient || "");
      patBlock.hidden = true;
    }
  }

  function switchTab(which) {
    var specBlock = document.getElementById("specContent");
    var patBlock = document.getElementById("patContent");
    var tabSpec = document.getElementById("tabSpec");
    var tabPat = document.getElementById("tabPat");

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

  function bindUI() {
    var tabSpec = document.getElementById("tabSpec");
    var tabPat = document.getElementById("tabPat");
    if (tabSpec) tabSpec.addEventListener("click", function () { switchTab("specialist"); });
    if (tabPat) tabPat.addEventListener("click", function () { switchTab("patient"); });
  }

  function init() {
    renderDrug();
    bindUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();