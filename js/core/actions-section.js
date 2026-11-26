/* =========================================
   actions-section.js — раздел «🚨 Порядок
   действий и информирование» живёт в шпаргалках.
   На нормативной базе раздел удаляется,
   на шпаргалках — вставляется первым блоком
   с исходными карточками и ссылками.
   ========================================= */
(function () {
  "use strict";

  var TITLE_RE = /Порядок действий и информирование/i;
  var WRAP_CLASS = "cheats-actions";

  function slice(x) { return Array.prototype.slice.call(x); }

  function isHeading(el) {
    if (!el || el.nodeType !== 1) return false;
    if (/^H[1-6]$/.test(el.tagName)) return true;
    return /group-title|section-title/.test(el.className || "");
  }

  function findGroup(doc) {
    var heads = slice(doc.querySelectorAll("h1,h2,h3,h4,h5,h6,.menu-group-title,.checklist-section-title"));
    for (var i = 0; i < heads.length; i++) {
      var head = heads[i];
      if (!TITLE_RE.test(head.textContent || "")) continue;

      var cont = head.nextElementSibling;
      while (cont && !cont.querySelector("a.submenu-link")) cont = cont.nextElementSibling;
      if (!cont) return null;

      var parent = head.parentElement;
      if (parent && parent !== doc.body && parent.contains(cont) &&
          slice(parent.children).every(function (ch) { return ch === head || ch === cont; })) {
        return { unit: parent, wrapped: true };
      }
      return { unit: null, head: head, cont: cont, wrapped: false };
    }
    return null;
  }

  function removeFromNormative() {
    var nav = document.querySelector('nav[aria-label="Список нормативных документов"]');
    if (!nav) return;
    var found = findGroup(nav);
    if (!found) return;
    if (found.wrapped) {
      found.unit.parentNode.removeChild(found.unit);
    } else {
      found.head.parentNode.removeChild(found.head);
      found.cont.parentNode.removeChild(found.cont);
    }
  }

  function injectIntoCheats(htmlText) {
    if (document.querySelector("." + WRAP_CLASS)) return;
    var doc = new DOMParser().parseFromString(htmlText, "text/html");
    var found = findGroup(doc);
    if (!found) return;

    var node;
    if (found.wrapped) {
      node = document.importNode(found.unit, true);
    } else {
      node = document.createElement("div");
      node.appendChild(document.importNode(found.head, true));
      node.appendChild(document.importNode(found.cont, true));
    }
    node.classList.add(WRAP_CLASS);

    var main = document.querySelector("main");
    if (!main) return;

    // Вставляем не в самое начало, а ПЕРЕД списком <nav>:
    // тогда секция встаёт под панель поиска/фильтров и под
    // контейнер избранных, а не сверху над ними.
    var nav = main.querySelector("nav");
    if (nav) {
      main.insertBefore(node, nav);
    } else {
      main.insertBefore(node, main.firstChild);
    }
  }

  function loadAndInject() {
    fetch("normative-base.html", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(injectIntoCheats)
      .catch(function () {
        if (window.caches && caches.match) {
          caches.match("normative-base.html").then(function (resp) {
            if (resp) return resp.text().then(injectIntoCheats);
          }).catch(function () {});
        }
      });
  }

  function init() {
    if (document.querySelector('nav[aria-label="Список нормативных документов"]')) {
      removeFromNormative();
      return;
    }
    if (/cheatsheets\.html$/i.test(window.location.pathname)) {
      loadAndInject();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();