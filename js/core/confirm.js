(function () {
  "use strict";

  var overlay = null;
  var titleEl, msgEl, okBtn, cancelBtn;
  var resolver = null;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="confirm-dialog">' +
        '<h2 class="confirm-title" id="confirmTitle">СМП Минск</h2>' +
        '<p class="confirm-message" id="confirmMessage"></p>' +
        '<div class="confirm-actions">' +
          '<button type="button" class="btn-secondary" id="confirmCancelBtn">Отмена</button>' +
          '<button type="button" class="btn-danger-ghost" id="confirmOkBtn">Да</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    titleEl = overlay.querySelector("#confirmTitle");
    msgEl = overlay.querySelector("#confirmMessage");
    okBtn = overlay.querySelector("#confirmOkBtn");
    cancelBtn = overlay.querySelector("#confirmCancelBtn");

    okBtn.addEventListener("click", function () { settle(true); });
    cancelBtn.addEventListener("click", function () { settle(false); });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) settle(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && resolver) settle(false);
    });
  }

  function settle(value) {
    if (!resolver) return;
    var r = resolver;
    resolver = null;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { r(value); }, 120);
  }

  window.SMP = window.SMP || {};

  /**
   * SMP.confirm("Текст вопроса", { title, ok, cancel, danger })
   * Возвращает Promise<boolean>: true — «Да», false — «Отмена»/Esc/фон
   */
  window.SMP.confirm = function (message, opts) {
    opts = opts || {};
    if (!overlay) build();
    titleEl.textContent = opts.title || "СМП Минск";
    msgEl.textContent = message;
    okBtn.textContent = opts.ok || "Да";
    cancelBtn.textContent = opts.cancel || "Отмена";
    okBtn.className = (opts.danger === false) ? "btn-primary" : "btn-danger-ghost";
    return new Promise(function (resolve) {
      resolver = resolve;
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(function () { okBtn.focus(); }, 60);
    });
  };
})();