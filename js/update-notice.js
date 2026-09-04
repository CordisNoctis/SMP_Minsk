(function () {
  "use strict";

  var STORAGE_KEY = "smp-last-seen-version";
  var MODAL_ID = "update-notice-modal";

  function getLastSeenVersion() {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch (e) { return ""; }
  }

  function setLastSeenVersion(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }

  function compareVersions(a, b) {
    var pa = String(a).split(".").map(Number);
    var pb = String(b).split(".").map(Number);
    for (var i = 0; i < 3; i++) {
      var na = pa[i] || 0;
      var nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  function getCurrentVersion() {
    // Единый источник версии — js/version.js (window.SMP_VERSION)
    if (window.SMP_VERSION) return window.SMP_VERSION;
    var log = window.APP_CHANGELOG || [];
    if (log.length) return log[0].version;
    return "0.0.0";
  }

  function collectNewChanges(lastSeen) {
    var changelog = window.APP_CHANGELOG || [];
    if (!changelog.length) return [];

    // Первый запуск — показываем только последнюю версию
    if (!lastSeen) return [changelog[0]];

    var result = [];
    for (var i = 0; i < changelog.length; i++) {
      if (compareVersions(changelog[i].version, lastSeen) > 0) {
        result.push(changelog[i]);
      }
    }
    return result;
  }

  // ===== Отрисовка блоков журнала (общая для модалки и истории) =====
  function renderChangelogBlocks(container, entries) {
    container.innerHTML = "";

    entries.forEach(function (entry) {
      var block = document.createElement("div");
      block.className = "changelog-version-block";

      var header = document.createElement("div");
      header.className = "changelog-version-header";
      header.innerHTML =
        '<span class="changelog-version">Версия ' + entry.version + '</span>' +
        '<span class="changelog-date">' + (entry.date || "") + '</span>';
      block.appendChild(header);

      var list = document.createElement("ul");
      list.className = "changelog-list";
      (entry.changes || []).forEach(function (change) {
        var li = document.createElement("li");
        li.className = "changelog-item";
        li.innerHTML =
          '<span class="changelog-icon" aria-hidden="true">' + change.icon + '</span>' +
          '<span class="changelog-text">' + change.text + '</span>';
        list.appendChild(li);
      });
      block.appendChild(list);

      container.appendChild(block);
    });
  }

  // ===== Модалка «Что нового» (главная страница) =====
  function renderModal(newChanges) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "modal";
      modal.id = MODAL_ID;
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML =
        '<div class="modal-backdrop" data-modal-close></div>' +
        '<section class="modal-panel" role="dialog" aria-modal="true">' +
          '<header class="modal-header">' +
            '<h2>🎉 Что нового</h2>' +
            '<button type="button" class="modal-close" data-modal-close aria-label="Закрыть">×</button>' +
          '</header>' +
          '<div class="modal-body">' +
            '<div id="updateNoticeContent"></div>' +
          '</div>' +
          '<footer class="modal-footer update-notice-footer">' +
            '<button type="button" class="btn-primary" data-modal-close>Понятно</button>' +
          '</footer>' +
        '</section>';
      document.body.appendChild(modal);
    }

    var content = modal.querySelector("#updateNoticeContent");
    renderChangelogBlocks(content, newChanges);

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    var closeButtons = modal.querySelectorAll("[data-modal-close]");
    closeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      });
    });
  }

  function check() {
    // Показываем «Что нового» только на главной странице
    var path = window.location.pathname;
    var isHome = path === "/" || path.endsWith("/index.html");
    if (!isHome) return;

    var current = getCurrentVersion();
    if (!current || current === "0.0.0") return;

    var lastSeen = getLastSeenVersion();
    var newChanges = collectNewChanges(lastSeen);

    if (newChanges.length === 0) return;

    // Помечаем версию просмотренной ДО показа — защита от повторного показа
    setLastSeenVersion(current);

    renderModal(newChanges);
  }

  // ===== История обновлений в настройках =====
  function initSettingsChangelog() {
    var content = document.getElementById("changelogContent");
    if (!content) return; // мы не в настройках
    renderChangelogBlocks(content, window.APP_CHANGELOG || []);
  }

  function fillFooterVersion() {
    var el = document.getElementById("footerVersion");
    if (el) el.textContent = getCurrentVersion();
  }

  function init() {
    check();
    initSettingsChangelog();
    fillFooterVersion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();