(function () {
  "use strict";

  // ===== Конфигурация =====
  var DEFAULT_SCALE = 2;                  // Retina-качество
  var DEFAULT_FORMAT = "png";             // png | jpg
  var DEFAULT_JPG_QUALITY = 0.92;         // 0..1
  var DEFAULT_BG = "#ffffff";             // светлый фон для картинки
  var TOAST_TIMEOUT = 2800;

  // ===== Вспомогательное: toast =====
  function showToast(message, duration) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () { toast.hidden = false; });

    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration || TOAST_TIMEOUT);
  }

  // ===== Проверка html2canvas =====
  function ensureLib() {
    if (typeof window.html2canvas === "function") return true;
    showToast("⚠️ Библиотека экспорта недоступна. Проверьте подключение к интернету для первой загрузки.");
    return false;
  }

  // ===== Сформировать имя файла =====
  function buildFilename(baseName, format) {
    var d = new Date();
    var iso = d.toISOString().slice(0, 10);           // YYYY-MM-DD
    var time = d.toTimeString().slice(0, 5).replace(":", "-"); // HH-MM
    var safe = (baseName || "export")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "_")
      .trim() || "export";
    return safe + "_" + iso + "_" + time + "." + (format || "png");
  }

  // ===== Скрыть/показать элементы на время экспорта =====
  function hideElements(selectors) {
    var hidden = [];
    if (!selectors || !selectors.length) return hidden;
    selectors.forEach(function (sel) {
      try {
        document.querySelectorAll(sel).forEach(function (el) {
          hidden.push({ el: el, prev: el.style.display });
          el.style.display = "none";
        });
      } catch (e) { /* игнор некорректного селектора */ }
    });
    return hidden;
  }
  function restoreElements(list) {
    list.forEach(function (pair) {
      pair.el.style.display = pair.prev;
    });
  }

  // ===== Сохранение через скачивание =====
  function downloadCanvas(canvas, filename, format, quality) {
    var mime = format === "jpg" ? "image/jpeg" : "image/png";
    var dataUrl = format === "jpg"
      ? canvas.toDataURL(mime, quality || DEFAULT_JPG_QUALITY)
      : canvas.toDataURL(mime);

    var a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); }, 0);
  }

  // ===== Canvas → Blob (нужно для Web Share) =====
  function canvasToBlob(canvas, format, quality) {
    return new Promise(function (resolve, reject) {
      var mime = format === "jpg" ? "image/jpeg" : "image/png";
      try {
        canvas.toBlob(function (blob) {
          blob ? resolve(blob) : reject(new Error("toBlob вернул null"));
        }, mime, format === "jpg" ? (quality || DEFAULT_JPG_QUALITY) : undefined);
      } catch (e) { reject(e); }
    });
  }

  // ===== Поделиться через Web Share API =====
  function tryShare(blob, filename, title) {
    var nav = window.navigator;
    if (!nav || !nav.canShare || !nav.share) return Promise.reject(new Error("no share api"));

    var file = new File([blob], filename, { type: blob.type });
    var data = { files: [file] };
    if (title) data.title = title;
    if (!nav.canShare(data)) return Promise.reject(new Error("share not allowed"));

    return nav.share(data);
  }

  // ===== ГЛАВНАЯ ФУНКЦИЯ =====
  /**
   * Экспортировать DOM-элемент как изображение.
   *
   * @param {HTMLElement|string} target - сам элемент или CSS-селектор
   * @param {Object} [opts]
   * @param {string} [opts.filename]     - базовое имя файла (без расширения)
   * @param {string} [opts.format]       - "png" (по умолч.) или "jpg"
   * @param {number} [opts.quality]      - качество для JPG (0..1)
   * @param {string} [opts.background]   - цвет фона (по умолч. #ffffff)
   * @param {number} [opts.scale]        - масштаб (по умолч. 2)
   * @param {string[]} [opts.hideSelectors] - CSS-селекторы элементов,
   *                                          которые нужно скрыть на картинке
   * @param {boolean} [opts.shareFirst]  - на мобильных: сначала предложить
   *                                          «Поделиться», при отказе — скачать
   * @param {string}  [opts.title]       - заголовок для Web Share
   * @param {boolean} [opts.silent]      - не показывать toast "Готовлю..."
   * @returns {Promise<{shared: boolean, filename: string}>}
   */
  function exportElement(target, opts) {
    opts = opts || {};
    var el = (typeof target === "string") ? document.querySelector(target) : target;

    if (!el) {
      showToast("⚠️ Не найден блок для экспорта");
      return Promise.reject(new Error("target not found"));
    }
    if (!ensureLib()) return Promise.reject(new Error("html2canvas missing"));

    var format = (opts.format === "jpg") ? "jpg" : DEFAULT_FORMAT;
    var filename = buildFilename(opts.filename, format);
    var background = opts.background || DEFAULT_BG;
    var scale = opts.scale || DEFAULT_SCALE;
    var shareFirst = opts.shareFirst !== false; // по умолчанию — да

    if (!opts.silent) showToast("📸 Готовлю изображение…");

    var hidden = hideElements(opts.hideSelectors || []);

    return window.html2canvas(el, {
      backgroundColor: background,
      scale: scale,
      useCORS: true,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight
    })
      .then(function (canvas) {
        restoreElements(hidden);
        hidden = [];

        // Пытаемся поделиться на мобильных
        if (shareFirst) {
          return canvasToBlob(canvas, format, opts.quality)
            .then(function (blob) {
              return tryShare(blob, filename, opts.title)
                .then(function () {
                  if (!opts.silent) showToast("✅ Отправлено");
                  return { shared: true, filename: filename };
                })
                .catch(function (shareErr) {
                  // Пользователь отменил шеринг или API недоступен — скачиваем
                  if (shareErr && shareErr.name === "AbortError") {
                    if (!opts.silent) showToast("↩️ Отменено");
                    return { shared: false, filename: filename, aborted: true };
                  }
                  // Иначе — fallback на скачивание
                  downloadCanvas(canvas, filename, format, opts.quality);
                  if (!opts.silent) showToast("📥 Файл сохранён");
                  return { shared: false, filename: filename };
                });
            })
            .catch(function () {
              // toBlob не сработал — скачиваем через dataURL
              downloadCanvas(canvas, filename, format, opts.quality);
              if (!opts.silent) showToast("📥 Файл сохранён");
              return { shared: false, filename: filename };
            });
        }

        // Прямое скачивание
        downloadCanvas(canvas, filename, format, opts.quality);
        if (!opts.silent) showToast("📥 Файл сохранён");
        return { shared: false, filename: filename };
      })
      .catch(function (err) {
        restoreElements(hidden);
        console.warn("exportElement error:", err);
        showToast("❌ Не удалось создать изображение");
        throw err;
      });
  }

  // ===== Публичный API =====
  window.SMP = window.SMP || {};
  window.SMP.exporter = {
    export: exportElement,
    showToast: showToast
  };
})();