(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ===== Модальное окно со справкой =====
  function openReferenceModal(data) {
    var existing = document.getElementById("reference-modal");
    if (existing) existing.remove();

    var ref = data.reference || {};
    var paragraphs = (ref.paragraphs || []).map(function (p) {
      return "<p>" + escapeHtml(p) + "</p>";
    }).join("");

    var importantNote = ref.importantNote ?
      '<div class="calc-important-note">' +
        '<span style="font-size:20px;">⚠️</span>' +
        '<strong>' + escapeHtml(ref.importantNote) + '</strong>' +
      '</div>' : '';

    var legalReference = ref.legalReference ?
      '<div class="calc-legal-reference" style="margin-top:12px;padding:10px 12px;background:var(--menu-icon-bg);border-radius:8px;font-size:0.85rem;">' +
        '<span style="font-size:16px;">⚖️</span> ' +
        '<em>' + escapeHtml(ref.legalReference) + '</em>' +
      '</div>' : '';

    var modal = document.createElement("div");
    modal.id = "reference-modal";
    modal.className = "reference-modal";
    modal.innerHTML =
      '<div class="reference-modal-backdrop"></div>' +
      '<div class="reference-modal-content">' +
        '<div class="reference-modal-header">' +
          '<h3 class="reference-modal-title">' + escapeHtml(ref.title || 'О шкале') + '</h3>' +
          '<button class="reference-modal-close" aria-label="Закрыть">✕</button>' +
        '</div>' +
        '<div class="reference-modal-body">' +
          paragraphs + importantNote + legalReference +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add("open"); });
    document.body.style.overflow = "hidden";

    function close() {
      modal.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(function () { modal.remove(); }, 250);
    }

    var backdrop = modal.querySelector(".reference-modal-backdrop");
    var closeBtn = modal.querySelector(".reference-modal-close");
    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);

    function escHandler(e) {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    }
    document.addEventListener("keydown", escHandler);
  }

  // ===== Склонение "балл" =====
  function pluralizePoints(n) {
    var lastTwo = n % 100;
    var lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "баллов";
    if (lastOne === 1) return "балл";
    if (lastOne >= 2 && lastOne <= 4) return "балла";
    return "баллов";
  }

  // ===== Простой toast (если глобального нет) =====
  function showToast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.hidden = false; });
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2500);
  }

  window.SMP = window.SMP || {};
  window.SMP.calcUtils = {
    openReferenceModal: openReferenceModal,
    pluralizePoints: pluralizePoints,
    escapeHtml: escapeHtml,
    showToast: showToast
  };
})();