/* ===== Установка PWA: всплывающая инструкция по системам =====
 *
 * Показывается при открытии приложения в обычной вкладке браузера:
 *  - если браузер умеет (Android, Windows/Linux/macOS в Chrome/Edge) —
 *    предлагается нативная установка одной кнопкой;
 *  - для iOS — пошаговая инструкция (Safari не даёт установить программно).
 * Вкладка системы выбирается автоматически.
 *
 * После «Понятно» окно не показывается RE_SHOW_DAYS дней.
 * В установленном приложении (автономный режим) окно не появляется вовсе.
 */
(function () {
  "use strict";

  var DISMISS_KEY = "smp-install-dismissed-at";
  var RE_SHOW_DAYS = 30;
  var SHOW_DELAY_MS = 1500;

  // ===== Инструкции по системам =====

  var OS_TABS = [
    {
      id: "android", tab: "🤖 Android",
      html:
        '<div class="ip-h">Шаг 1. Переход на сайт</div>' +
        "<ol>" +
          "<li>Запустите браузер Google Chrome.</li>" +
          "<li>Перейдите на сайт приложения «СМП Минск».</li>" +
          "<li>Дождитесь полной загрузки страницы.</li>" +
        "</ol>" +
        '<div class="ip-h">Шаг 2. Запуск установки (2 способа)</div>' +
        "<ul>" +
          "<li><b>Способ А (всплывающая подсказка):</b> если сайт полностью оптимизирован, внизу экрана появится баннер «Установить приложение» или «Добавить на главный экран» — просто нажмите на него.</li>" +
          "<li><b>Способ Б (через меню браузера):</b> нажмите на три вертикальные точки в правом верхнем углу Chrome и выберите пункт «Установить приложение» (в некоторых случаях он называется «Добавить на главный экран»).</li>" +
        "</ul>" +
        '<div class="ip-h">Шаг 3. Подтверждение установки</div>' +
        "<ol>" +
          "<li>Появится всплывающее окно с подтверждением.</li>" +
          "<li>Нажмите кнопку «Установить» (или «Добавить»).</li>" +
          "<li>Через несколько секунд вы получите уведомление: «Приложение добавлено на главный экран».</li>" +
        "</ol>" +
        "<p class=\"ip-note\">Иконка появится на рабочем столе. Приложение будет открываться в полноэкранном режиме (без адресной строки) и отображаться в меню запущенных приложений Android как отдельная программа.</p>" +
        '<div class="ip-h">Настройки, уведомления и фоновая работа</div>' +
        '<div class="ip-tip">' +
          "<ul>" +
            "<li><b>Уведомления:</b> при первом запуске приложение предложит включить push-уведомления — нажмите «Разрешить», чтобы получать сообщения вовремя.</li>" +
            "<li><b>Разрешения:</b> доступ к камере, микрофону, геолокации — зажмите иконку приложения на рабочем столе → значок «i» («О приложении») → «Разрешения».</li>" +
            "<li><b>Фоновая работа:</b> чтобы приложение не закрывалось системой для экономии батареи, в «О приложении» → «Батарея» выберите режим «Не ограничено».</li>" +
          "</ul>" +
        "</div>"
    },
    {
      id: "ios", tab: "🍎 iPhone / iPad",
      html:
        '<div class="ip-h">Шаг 1. Переход на сайт в Safari</div>' +
        "<ol>" +
          "<li>Откройте стандартный браузер Safari на вашем iPhone или iPad.</li>" +
          "<li>Перейдите на сайт приложения «СМП Минск».</li>" +
          "<li>Дождитесь полной загрузки страницы.</li>" +
        "</ol>" +
        '<div class="ip-h">Шаг 2. Добавление на домашний экран</div>' +
        "<ol>" +
          "<li>В нижней части экрана (на iPad — в верхней) найдите и нажмите кнопку «Поделиться» (значок в виде квадрата со стрелкой вверх).</li>" +
          "<li>В открывшемся меню прокрутите список доступных действий немного вниз.</li>" +
          "<li>Найдите и нажмите пункт «На экран “Домой”» (рядом со значком «плюс» в квадрате).</li>" +
        "</ol>" +
        '<div class="ip-h">Шаг 3. Подтверждение установки</div>' +
        "<ol>" +
          "<li>В появившемся окне вы увидите будущую иконку приложения.</li>" +
          "<li>При желании вы можете изменить название приложения.</li>" +
          "<li>Нажмите кнопку «Добавить» в правом верхнем углу экрана.</li>" +
        "</ol>" +
        "<p class=\"ip-note\">На рабочем столе появится иконка. При нажатии на неё приложение открывается на весь экран — без адресной строки и кнопок навигации браузера.</p>" +
        '<div class="ip-h">Важные настройки и уведомления для iOS</div>' +
        '<div class="ip-tip">' +
          "<ul>" +
            "<li><b>Push-уведомления:</b> начиная с iOS 16.4 приложение может присылать полноценные push-уведомления. При первом запуске оно может запросить разрешение — нажмите «Разрешить».</li>" +
            "<li><b>Настройка уведомлений:</b> «Настройки» iPhone → «Уведомления» → найдите приложение в списке и настройте его.</li>" +
            "<li><b>Face ID / Touch ID:</b> если сайт поддерживает биометрию, вход по лицу или отпечатку работает так же, как в приложениях из App Store.</li>" +
          "</ul>" +
        "</div>"
    },
    {
      id: "windows", tab: "🪟 Windows",
      html:
        '<div class="ip-h">Браузер Google Chrome</div>' +
        '<div class="ip-step-h">Шаг 1. Переход на сайт</div>' +
        "<ol>" +
          "<li>Запустите браузер Google Chrome.</li>" +
          "<li>Перейдите на сайт приложения «СМП Минск» и дождитесь полной загрузки страницы.</li>" +
        "</ol>" +
        '<div class="ip-step-h">Шаг 2. Запуск установки (2 способа)</div>' +
        "<ul>" +
          "<li><b>Способ А (через адресную строку):</b> в правой части адресной строки (рядом со значком закладок/звёздочкой) найдите иконку в виде монитора со стрелкой вниз (или значок «Плюс»). Нажмите на неё.</li>" +
          "<li><b>Способ Б (через главное меню):</b> нажмите на три вертикальные точки в правом верхнем углу браузера. Перейдите в раздел «Сохранить и поделиться» и выберите пункт «Установить страницу как приложение…».</li>" +
        "</ul>" +
        '<div class="ip-step-h">Шаг 3. Подтверждение установки</div>' +
        "<ol>" +
          "<li>На экране появится окно с вопросом «Установить приложение?».</li>" +
          "<li>При желании отредактируйте название ярлыка.</li>" +
          "<li>Нажмите кнопку «Установить».</li>" +
        "</ol>" +
        "<p class=\"ip-note\">Приложение откроется в отдельном окне без адресной строки. На рабочем столе Windows и в меню «Пуск» появится ярлык.</p>" +
        '<div class="ip-tip">' +
          "<ul>" +
            "<li><b>Закрепить на панели задач:</b> кликните правой кнопкой мыши по иконке запущенного приложения на панели задач и выберите «Закрепить на панели задач».</li>" +
            "<li><b>Автозапуск при включении ПК:</b> в окне приложения нажмите три точки в верхнем правом углу → «Информация о приложении» → «Настройки приложения» → включите тумблер «Запускать при входе в систему».</li>" +
          "</ul>" +
        "</div>" +
        '<div class="ip-h">Браузер Microsoft Edge</div>' +
        '<div class="ip-step-h">Шаг 1. Переход на сайт</div>' +
        "<ol>" +
          "<li>Запустите браузер Microsoft Edge.</li>" +
          "<li>Перейдите на сайт приложения и дождитесь полной загрузки страницы.</li>" +
        "</ol>" +
        '<div class="ip-step-h">Шаг 2. Запуск установки (2 способа)</div>' +
        "<ul>" +
          "<li><b>Способ А (быстрый):</b> в правой части адресной строки (рядом со значком «Избранное»/звёздочкой) найдите иконку в виде трёх квадратов с плюсом («Доступно приложение») или монитора со стрелкой. Нажмите на неё.</li>" +
          "<li><b>Способ Б (через меню):</b> нажмите на три горизонтальные точки («…») в правом верхнем углу. Наведите курсор на раздел «Приложения» и выберите «Установить этот сайт как приложение».</li>" +
        "</ul>" +
        '<div class="ip-step-h">Шаг 3. Подтверждение и параметры интеграции</div>' +
        "<ol>" +
          "<li>В появившемся окне нажмите кнопку «Установить».</li>" +
          "<li>Сайт откроется в отдельном окне. Появится окно настроек Edge с предложением закрепить приложение — отметьте нужные пункты: ярлык на рабочем столе, закрепить на панели задач, закрепить на начальном экране («Пуск»), автоматически запускать при входе в систему.</li>" +
          "<li>Нажмите кнопку «Разрешить».</li>" +
        "</ol>" +
        '<div class="ip-h">Управление приложениями в Edge</div>' +
        '<div class="ip-tip">' +
          "<ul>" +
            "<li>Введите в адресной строке <b>edge://apps</b> (или меню → «Приложения» → «Управление приложениями») — вы увидите список всех установленных приложений.</li>" +
            "<li>Ссылка «Подробности» под приложением: автозапуск, уведомления, права доступа (камера, микрофон, геолокация).</li>" +
          "</ul>" +
        "</div>"
    },
    {
      id: "linux", tab: "🐧 Linux",
      html:
        "<p class=\"ip-note\">Установка выполняется через браузеры на базе Chromium: Google Chrome, Chromium, Яндекс Браузер или Microsoft Edge. Браузер Firefox нативно технологию PWA на компьютерах пока не поддерживает.</p>" +
        '<div class="ip-h">Шаг 1. Открытие сайта</div>' +
        "<ol>" +
          "<li>Запустите ваш браузер на базе Chromium (например, Google Chrome).</li>" +
          "<li>Перейдите на сайт приложения «СМП Минск».</li>" +
          "<li>Дождитесь полной загрузки интерфейса.</li>" +
        "</ol>" +
        '<div class="ip-h">Шаг 2. Запуск установки (2 способа)</div>' +
        "<ul>" +
          "<li><b>Способ А (через адресную строку):</b> в правой части адресной строки нажмите на значок монитора со стрелкой вниз (или значок «Плюс»), который появляется рядом со звёздочкой закладок.</li>" +
          "<li><b>Способ Б (через меню):</b> три вертикальные точки в верхнем правом углу → раздел «Сохранить и поделиться» → «Установить страницу как приложение…».</li>" +
        "</ul>" +
        '<div class="ip-h">Шаг 3. Создание ярлыка в системе</div>' +
        "<ol>" +
          "<li>Во всплывающем окне подтвердите действие кнопкой «Установить».</li>" +
          "<li>Браузер откроет приложение в отдельном окне.</li>" +
          "<li>В меню всех приложений вашего дистрибутива (GNOME, KDE или XFCE) автоматически создастся ярлык — приложение доступно в поиске системы.</li>" +
        "</ol>" +
        '<div class="ip-h">Интеграция в интерфейс (закрепление на панели)</div>' +
        '<div class="ip-tip">' +
          "<ul>" +
            "<li><b>GNOME (Ubuntu по умолчанию):</b> откройте меню приложений (кнопка с девятью точками), найдите приложение, кликните по нему правой кнопкой мыши и выберите «Добавить в избранное».</li>" +
            "<li><b>KDE Plasma:</b> найдите приложение в меню «Запуск приложений», нажмите правой кнопкой мыши и выберите «Закрепить на панели задач».</li>" +
          "</ul>" +
        "</div>" +
        '<div class="ip-h">Автозапуск при старте Linux</div>' +
        '<div class="ip-tip">' +
          "<ol>" +
            "<li>Внутри запущенного окна приложения нажмите на три точки в правом верхнем углу.</li>" +
            "<li>Перейдите в «Информация о приложении» → «Настройки приложения».</li>" +
            "<li>Активируйте переключатель «Запускать при входе в систему».</li>" +
          "</ol>" +
        "</div>"
    },
    {
      id: "macos", tab: "🍏 macOS",
      html:
        "<p class=\"ip-note\">Установить приложение можно двумя способами: через Safari (доступно на macOS Sonoma и новее) либо через Google Chrome / Microsoft Edge.</p>" +
        '<div class="ip-h">Вариант 1. Установка через Safari (macOS Sonoma и новее)</div>' +
        '<div class="ip-step-h">Шаг 1. Открытие сайта</div>' +
        "<ol>" +
          "<li>Откройте встроенный браузер Safari.</li>" +
          "<li>Перейдите на сайт приложения «СМП Минск».</li>" +
        "</ol>" +
        '<div class="ip-step-h">Шаг 2. Добавление в Dock</div>' +
        "<ol>" +
          "<li>В верхнем меню экрана нажмите кнопку «Файл».</li>" +
          "<li>Выберите пункт «Добавить в док…» (альтернатива: значок «Поделиться» на панели Safari → «Добавить в док»).</li>" +
        "</ol>" +
        '<div class="ip-step-h">Шаг 3. Подтверждение</div>' +
        "<ol>" +
          "<li>Проверьте имя приложения (его можно переименовать) и иконку.</li>" +
          "<li>Нажмите кнопку «Добавить».</li>" +
        "</ol>" +
        "<p class=\"ip-note\">Приложение появится на панели Dock снизу и в папке «Программы». У него отдельная песочница: cookie, история и данные изолированы от основного Safari.</p>" +
        '<div class="ip-h">Вариант 2. Через Google Chrome или Microsoft Edge</div>' +
        "<ol>" +
          "<li>Откройте сайт приложения в Google Chrome или Edge.</li>" +
          "<li>В правой части адресной строки нажмите на значок монитора со стрелкой вниз («Установить»). Если значка нет: три точки в углу браузера → «Сохранить и поделиться» (в Chrome) или «Приложения» (в Edge) → «Установить…».</li>" +
          "<li>Нажмите кнопку «Установить» во всплывающем окне.</li>" +
        "</ol>" +
        "<p class=\"ip-note\">Приложение сохранится в папку «Программы Chrome» (Chrome Apps) и запустится в отдельном окне. Иконку можно перетащить на панель Dock для быстрого доступа.</p>" +
        '<div class="ip-h">Настройки и уведомления на Mac</div>' +
        '<div class="ip-tip">' +
          "<ul>" +
            "<li><b>Внешний вид (Safari-версия):</b> откройте приложение, нажмите на его название в верхней строке меню → «Настройки». Доступны: имя, стартовый адрес, иконка, кнопки «Назад/Вперёд».</li>" +
            "<li><b>Уведомления (push):</b> разрешите отправку при первом запросе. Затем «Системные настройки» → «Уведомления» → найдите приложение и включите баннеры, звук или счётчик на значке в Dock.</li>" +
          "</ul>" +
        "</div>"
    }
  ];

  var STYLES =
    "#installPromptModal .modal-panel{" +
      "max-height:calc(100vh - 32px);display:flex;flex-direction:column;}" +
    "#installPromptModal .modal-body{overflow-y:auto;}" +
    "#installPromptTabs{" +
      "display:grid;grid-template-columns:repeat(5,1fr);gap:4px;" +
      "padding:4px;margin:0 0 12px;background:var(--menu-icon-bg);border-radius:10px;}" +
    "#installPromptTabs button{" +
      "border:0;border-radius:8px;background:transparent;color:var(--muted);" +
      "font:inherit;font-weight:700;font-size:0.72rem;padding:8px 2px;cursor:pointer;}" +
    "#installPromptTabs button.active{background:var(--card);color:var(--accent);box-shadow:var(--shadow);}" +
    "#installPromptModal .modal-body > div[data-os-panel] > .ip-h:first-child{margin-top:0;}" +
    ".ip-h{font-weight:800;color:var(--accent);font-size:0.92rem;margin:14px 0 6px;}" +
    ".ip-step-h{font-weight:700;margin:10px 0 4px;font-size:0.86rem;}" +
    ".install-prompt-panel ol,.install-prompt-panel ul{margin:0 0 8px;padding-left:20px;}" +
    ".install-prompt-panel li{margin-bottom:5px;line-height:1.45;font-size:0.85rem;}" +
    ".ip-note{font-size:0.82rem;line-height:1.45;color:var(--muted);margin:0 0 10px;}" +
    ".ip-tip{background:var(--menu-icon-bg);border-left:3px solid var(--accent);" +
      "border-radius:6px;padding:8px 10px;margin:0 0 12px;}" +
    ".ip-tip ul,.ip-tip ol{margin:0;padding-left:18px;}" +
    ".ip-tip li{font-size:0.8rem;}" +
    "#installPromptBtn{" +
      "display:block;width:100%;margin:0 0 14px;padding:12px;" +
      "border:0;border-radius:12px;background:var(--accent);color:#fff;" +
      "font:inherit;font-weight:800;font-size:0.95rem;cursor:pointer;}";

  var activeTab = null;
  var deferredPrompt = null;

  // ===== Состояния: установлено / недавно закрывали =====

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
  }

  function dismissedRecently() {
    try {
      var at = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
      if (!at) return false;
      return (Date.now() - at) < RE_SHOW_DAYS * 24 * 60 * 60 * 1000;
    } catch (e) { return true; }
  }

  function rememberDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  // ===== Нативная установка (Android, Windows, Linux, macOS в Chrome/Edge) =====

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var btn = document.getElementById("installPromptBtn");
    var modal = document.getElementById("installPromptModal");
    if (btn && modal && !modal.hidden) btn.hidden = false;
  });

  window.addEventListener("appinstalled", function () {
    closeModal();
  });

  // ===== Определение системы для стартовой вкладки =====

  function detectOs() {
    var ua = navigator.userAgent || "";
    var isIOS = /iPhone|iPad|iPod/i.test(ua) ||
                (/Mac/i.test(ua) && navigator.maxTouchPoints > 1);
    if (isIOS) return "ios";
    if (/Android/i.test(ua)) return "android";
    if (/Windows/i.test(ua)) return "windows";
    if (/Linux/i.test(ua)) return "linux";
    if (/Mac/i.test(ua)) return "macos";
    return "windows";
  }

  // ===== Разметка =====

  function build() {
    if (document.getElementById("installPromptModal")) return;

    var style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    var detected = detectOs();

    var html = '<div class="modal-backdrop" data-install-close></div>' +
      '<section class="modal-panel" role="dialog" aria-modal="true">' +
        '<header class="modal-header">' +
          '<h2>📲 Установка приложения</h2>' +
          '<button type="button" class="modal-close" data-install-close aria-label="Закрыть">×</button>' +
        '</header>' +
        '<div class="modal-body">' +
          '<p class="ip-note">«СМП Минск» можно установить как обычное приложение: ' +
            'ярлык на экране или в меню, запуск без адресной строки, полноценная работа офлайн. ' +
            'Выберите вашу систему — ниже пошаговая инструкция.</p>' +
          '<button type="button" id="installPromptBtn" hidden>📲 Установить</button>' +
          '<div id="installPromptTabs" role="tablist">';

    OS_TABS.forEach(function (os) {
      html += '<button type="button" role="tab" data-os-tab="' + os.id + '"' +
        (os.id === detected ? ' class="active"' : '') + '>' + os.tab + '</button>';
    });
    html += '</div>';

    OS_TABS.forEach(function (os) {
      html += '<div class="install-prompt-panel" data-os-panel="' + os.id + '"' +
        (os.id === detected ? '' : ' hidden') + '>' + os.html + '</div>';
    });

    html += '</div>' +
        '<footer class="modal-footer">' +
          '<button type="button" class="btn-primary" data-install-close>Понятно</button>' +
        '</footer>' +
      '</section>';

    var modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "installPromptModal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = html;
    document.body.appendChild(modal);

    activeTab = detected;

    // Вкладки
    modal.querySelectorAll("[data-os-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeTab = btn.getAttribute("data-os-tab");
        modal.querySelectorAll("[data-os-tab]").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        modal.querySelectorAll("[data-os-panel]").forEach(function (p) {
          p.hidden = p.getAttribute("data-os-panel") !== activeTab;
        });
      });
    });

    // Нативная установка
    modal.querySelector("#installPromptBtn").addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        if (choice && choice.outcome === "accepted") closeModal();
        deferredPrompt = null;
      }).catch(function () { deferredPrompt = null; });
    });

    // Закрытие: свои обработчики (всплывает не через modal.js)
    modal.querySelectorAll("[data-install-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function openModal() {
    build();
    var modal = document.getElementById("installPromptModal");
    var btn = document.getElementById("installPromptBtn");
    if (btn) btn.hidden = !deferredPrompt;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    var modal = document.getElementById("installPromptModal");
    if (modal && !modal.hidden) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
    rememberDismissed();
  }

  // ===== Показ при открытии приложения =====

  function maybeShow() {
    if (isStandalone() || dismissedRecently()) return;
    // Не выскакиваем поверх окна «Что нового» — ждём его закрытия
    if (document.body.classList.contains("modal-open")) {
      setTimeout(maybeShow, 3500);
      return;
    }
    openModal();
  }

  function init() {
    setTimeout(maybeShow, SHOW_DELAY_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
