/* =========================================
   user-agreement.js — показ текста ПС, учёт
   согласия/несогласия, блокировка до выбора,
   авто-повтор при изменении текста соглашения
   ========================================= */
(function () {
  "use strict";

  var LS_KEY = "smp_ua_consent";
  var UA_REV = "1.0";                 // ↑ ручное принудительное пере-согласие
  var DOC_URL = "docs/user-agreement.md";

  var overlay = null;
  var els = {};
  var mode = null;                    // "consent" (блокирующий) | "view" (чтение с правом выбора)
  var scrolled = false;
  var currentHash = null;             // хеш загруженного текста
  var decision = read();

  /* ---------- хранилище ---------- */

  function read() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(decision));
    } catch (e) { /* приватный режим — молча пропускаем */ }
  }

  function save(dec) {
    decision = { rev: UA_REV, decision: dec, ts: new Date().toISOString(), hash: currentHash || (decision && decision.hash) || null };
    persist();
  }

  function isAccepted() {
    return !!(decision && decision.decision === "accepted" && decision.rev === UA_REV);
  }

  function fmtTs(ts) {
    try {
      return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return "";
    }
  }

  /* ---------- хеш текста (FNV-1a) ---------- */

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x16777619) >>> 0;
    }
    return h.toString(16);
  }

  /* ---------- построение оверлея ---------- */

  function build() {
    if (overlay) return;

    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="ua-overlay" id="uaOverlay" hidden role="dialog" aria-modal="true" aria-labelledby="uaTitle">' +
        '<div class="ua-backdrop" id="uaBackdrop"></div>' +
        '<section class="ua-panel">' +
          '<header class="ua-head">' +
            '<h2 id="uaTitle">📄 Пользовательское соглашение</h2>' +
            '<button type="button" class="ua-close" id="uaCloseBtn" aria-label="Закрыть" hidden>×</button>' +
          '</header>' +
          '<div class="ua-body drug-content" id="uaBody" tabindex="0"></div>' +
          '<div class="ua-hint" id="uaHint"></div>' +
          '<footer class="ua-foot" id="uaFoot">' +
            '<button type="button" class="ua-decline" id="uaDeclineBtn">НЕ СОГЛАСЕН</button>' +
            '<button type="button" class="ua-accept" id="uaAcceptBtn">СОГЛАСЕН</button>' +
          '</footer>' +
        '</section>' +
      '</div>';

    overlay = wrap.firstChild;
    document.body.appendChild(overlay);

    els.backdrop = overlay.querySelector("#uaBackdrop");
    els.close    = overlay.querySelector("#uaCloseBtn");
    els.body     = overlay.querySelector("#uaBody");
    els.hint     = overlay.querySelector("#uaHint");
    els.foot     = overlay.querySelector("#uaFoot");
    els.decline  = overlay.querySelector("#uaDeclineBtn");
    els.accept   = overlay.querySelector("#uaAcceptBtn");

    els.body.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    /* Закрытие фоном и Esc — только в режиме просмотра */
    els.backdrop.addEventListener("click", function () {
      if (mode === "view") close();
    });
    els.close.addEventListener("click", function () {
      if (mode === "view") close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mode === "view") close();
    });

    els.accept.addEventListener("click", function () {
      save("accepted");
      close();
      updatePlate();
    });

    els.decline.addEventListener("click", function () {
      save("declined");
      /* Окно НЕ закрывается никогда: переходим в блокирующий режим */
      mode = "consent";
      els.close.hidden = true;
      els.hint.textContent = "Вы отклонили соглашение. Использование приложения без принятия условий невозможно, окно останется открытым.";
      els.hint.className = "ua-hint is-declined";
      updatePlate();
    });
  }

  /* ---------- дочитывание до конца (только первичное согласие) ---------- */

  function checkScroll() {
    if (mode !== "consent" || scrolled) return;
    var b = els.body;
    if (!b) return;

    var reached = b.scrollTop + b.clientHeight >= b.scrollHeight - 8;
    if (reached) {
      scrolled = true;
      els.accept.disabled = false;
      els.decline.disabled = false;
      els.hint.textContent = "Готово! Теперь вы можете сделать выбор.";
      els.hint.className = "ua-hint is-done";
    }
  }

  /* ---------- загрузка текста ---------- */

  function loadDoc() {
    els.body.innerHTML = '<p class="ua-loading">Загрузка текста соглашения…</p>';

    fetch(DOC_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (md) {
        currentHash = fnv1a(md);
        var html = (window.SMP && window.SMP.markdown)
          ? window.SMP.markdown.parse(md)
          : "<pre>" + md + "</pre>";
        els.body.innerHTML = html;
        els.body.scrollTop = 0;
        checkScroll();   // вдруг текст влез без прокрутки (большой экран)
      })
      .catch(function () {
        els.body.innerHTML =
          '<p class="ua-loading">Не удалось загрузить текст соглашения.<br>Проверьте подключение и повторите попытку.</p>' +
          '<p style="text-align:center"><button type="button" class="btn-primary ua-retry" id="uaRetryBtn">Повторить</button></p>';
        var retry = els.body.querySelector("#uaRetryBtn");
        if (retry) retry.addEventListener("click", loadDoc);
      });
  }

  /* ---------- открытие / закрытие ---------- */

  function open(m) {
    build();
    mode = m;
    scrolled = false;

    var consent = (m === "consent");

    /* Кнопки видны ВСЕГДА. В режиме согласия они заблокированы до дочитывания,
       в режиме повторного открытия — активны сразу. */
    els.accept.disabled = consent;
    els.decline.disabled = consent;
    els.close.hidden = consent;
    els.foot.hidden = false;

    if (consent) {
      els.hint.className = "ua-hint";
      els.hint.textContent = "Пролистайте текст соглашения до конца, чтобы активировать кнопки выбора.";
    } else {
      els.hint.className = "ua-hint is-done";
      els.hint.textContent = "Соглашение принято: " + fmtTs(decision && decision.ts) + ". Вы можете прочитать текст и изменить своё решение.";
    }

    overlay.hidden = false;
    document.body.classList.add("ua-locked");
    loadDoc();
    els.body.focus({ preventScroll: true });
  }

  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    mode = null;
    document.body.classList.remove("ua-locked");
  }

  /* ---------- плашка на главной ---------- */

  function updatePlate() {
    var sub = document.getElementById("uaPlateSub");
    if (!sub) return;
    sub.textContent = isAccepted()
      ? "Принято " + fmtTs(decision.ts) + " — нажмите, чтобы прочитать или изменить решение"
      : "Нажмите, чтобы ознакомиться с условиями использования";
  }

  /* ---------- проверка изменения текста ПС ---------- */

  function verifyTextUnchanged() {
    fetch(DOC_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (md) {
        var h = fnv1a(md);
        if (!decision.hash) {
          /* Старая запись без хеша — просто дописываем хеш, не тревожа пользователя */
          decision.hash = h;
          persist();
          return;
        }
        if (h !== decision.hash) {
          /* Текст соглашения изменился — требуем повторного согласия */
          open("consent");
        }
      })
      .catch(function () {
        /* Офлайн или ошибка сети — не блокируем пользователя, решение остаётся в силе */
      });
  }

  /* ---------- старт ---------- */

  function init() {
    var plate = document.getElementById("uaPlateBtn");
    if (plate) {
      plate.addEventListener("click", function () {
        open(isAccepted() ? "view" : "consent");
      });
    }
    updatePlate();

    if (!isAccepted()) {
      open("consent");
    } else {
      verifyTextUnchanged();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();