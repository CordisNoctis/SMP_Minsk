(function () {
  "use strict";

  // ===== MedicalPicker — универсальное модальное окно выбора средства =====
  // API: window.MedicalPicker.open({ catalog: [...] }) -> Promise<result | null>

  var overlay = null;
  var panel = null;
  var searchInput = null;
  var listEl = null;
  var emptyEl = null;
  var clearBtn = null;
  var catalog = [];
  var resolvePromise = null;

  function isTouchDevice() {
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 900
    );
  }

  function ensureDom() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "picker-overlay";
    overlay.hidden = true;

    panel = document.createElement("div");
    panel.className = "picker-panel";

    // Шапка
    var header = document.createElement("div");
    header.className = "picker-header";

    var title = document.createElement("div");
    title.className = "picker-title";
    title.textContent = "Выберите средство";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "Закрыть");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", function () {
      close(null);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Поиск
    var searchWrap = document.createElement("div");
    searchWrap.className = "picker-search-wrap";

    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "picker-search-input";
    searchInput.placeholder = "Поиск по названию...";
    searchInput.autocomplete = "off";

    clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "picker-search-clear";
    clearBtn.innerHTML = "✕";
    clearBtn.hidden = true;

    searchInput.addEventListener("input", function () {
      if (clearBtn) clearBtn.hidden = !searchInput.value;
      renderList(searchInput.value);
    });

    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      clearBtn.hidden = true;
      renderList("");
      searchInput.focus();
    });

    searchWrap.appendChild(searchInput);
    searchWrap.appendChild(clearBtn);

    // Список
    listEl = document.createElement("div");
    listEl.className = "picker-list";

    // Пустое состояние (внутри списка)
    emptyEl = document.createElement("div");
    emptyEl.className = "picker-empty";
    emptyEl.textContent = "Ничего не найдено";
    emptyEl.hidden = true;
    listEl.appendChild(emptyEl);

    panel.appendChild(header);
    panel.appendChild(searchWrap);
    panel.appendChild(listEl);

    overlay.appendChild(panel);

    // Клик по затемнению закрывает
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close(null);
    });

    document.body.appendChild(overlay);
  }

  function renderList(filter) {
    if (!listEl || !emptyEl) return;

    // Очищаем список, сохраняя emptyEl
    var items = listEl.querySelectorAll(".picker-item");
    for (var k = 0; k < items.length; k++) {
      items[k].parentNode.removeChild(items[k]);
    }

    var q = (filter || "").toLowerCase().trim();
    var matches = [];
    var seen = {};

    for (var i = 0; i < catalog.length; i++) {
      var item = catalog[i];

      // Исключаем оснащение автомобиля
      if (item.group === "vehicle") continue;

      var key = item.name.toLowerCase().trim();
      if (seen[key]) continue;
      if (!q || key.indexOf(q) !== -1) {
        seen[key] = true;
        matches.push(item);
      }
      if (matches.length >= 50) break;
    }

    if (matches.length === 0) {
      emptyEl.hidden = false;
      listEl.style.maxHeight = "15vh";
      return;
    }

    emptyEl.hidden = true;

    matches.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "picker-item";
      row.setAttribute("role", "button");
      row.tabIndex = 0;

      var parts = splitName(item.name);

      var nameEl = document.createElement("div");
      nameEl.className = "picker-item-name";
      nameEl.textContent = parts.name;

      row.appendChild(nameEl);

      if (parts.details) {
        var detailsEl = document.createElement("div");
        detailsEl.className = "picker-item-details";
        detailsEl.textContent = parts.details;
        row.appendChild(detailsEl);
      }

      function select() {
        close({ name: item.name, details: parts.details });
      }

      row.addEventListener("click", select);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });

      listEl.appendChild(row);
    });

    // Автоматическое уменьшение высоты списка при малом количестве результатов
    var itemCount = listEl.querySelectorAll(".picker-item").length;
    if (itemCount > 0) {
      listEl.style.maxHeight = Math.min(60, 10 + itemCount * 7) + "vh";
    } else {
      listEl.style.maxHeight = "15vh";
    }
  }

  function splitName(name) {
    var match = name.match(/\d/);
    if (!match) return { name: name, details: "" };
    var index = match.index;
    var itemName = name.substring(0, index).trim();
    var itemDetails = name.substring(index).trim();

    // Убираем висячие в конце знаки: скобки, запятые, дефисы, слеши
    itemName = itemName.replace(/[\s,;:(\/\-]+$/g, "").trim();

    if (!itemName) return { name: name, details: "" };
    return { name: itemName, details: itemDetails };
  }

  function open(options) {
    ensureDom();
    options = options || {};
    catalog = options.catalog || window.MEDICAL_CATALOG || [];

    searchInput.value = "";
    if (clearBtn) clearBtn.hidden = true;

    renderList("");

    overlay.hidden = false;
    document.body.classList.add("modal-open");

    return new Promise(function (resolve) {
      resolvePromise = resolve;
      setTimeout(function () {
        if (searchInput) searchInput.focus();
      }, 100);
    });
  }

  function close(value) {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
    if (resolvePromise) {
      var r = resolvePromise;
      resolvePromise = null;
      r(value || null);
    }
  }

  window.MedicalPicker = {
    open: open,
    isTouchDevice: isTouchDevice
  };
})();