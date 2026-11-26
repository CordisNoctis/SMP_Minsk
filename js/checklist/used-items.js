(function () {
  "use strict";

  if (window.__usedItemsInitialized) return;
  window.__usedItemsInitialized = true;

  var STORAGE_KEY = "smp-used-items-v1";
  var editingIndex = null;

  // ===== Хранилище =====

  function loadRecords() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveRecords(records) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (e) {}
  }

  // ===== Утилиты =====

  function showToast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "alert");
    t.setAttribute("aria-live", "assertive");
    t.setAttribute("aria-atomic", "true");
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.hidden = false; });
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3000);
  }

  // Только цифры в поле
  function restrictToDigits(input) {
    input.addEventListener("input", function () {
      var v = input.value.replace(/[^0-9]/g, "");
      if (input.value !== v) input.value = v;
    });
  }

  // ===== Карточка записи (переиспользуется) =====

  function buildRecordCard(rec, index, allowEdit) {
    var card = document.createElement("div");
    card.className = "used-record-card";

    var header = document.createElement("div");
    header.className = "used-record-header";

    var title = document.createElement("div");
    title.className = "used-record-title";
    title.textContent = "Примечание: " + (rec.note || rec.cardNumber || "—");
    header.appendChild(title);

    card.appendChild(header);

    if (rec.items && rec.items.length > 0) {
      var itemsBlock = document.createElement("div");
      itemsBlock.className = "used-record-items";
      rec.items.forEach(function (it) {
        var line = document.createElement("div");
        line.className = "used-record-item-line";
        var nm = document.createElement("span");
        nm.className = "used-record-item-name";
        nm.textContent = it.name;
        var qt = document.createElement("span");
        qt.className = "used-record-item-qty";
        qt.textContent = it.qty || "";
        line.appendChild(nm);
        line.appendChild(qt);
        itemsBlock.appendChild(line);
      });
      card.appendChild(itemsBlock);
    }

    return card;
  }

  function renderRecords() {
    var listEl = document.getElementById("usedRecordsList");
    var emptyEl = document.getElementById("usedRecordsEmpty");
    if (!listEl) return;
    listEl.innerHTML = "";
    var records = loadRecords();
    if (records.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    records.forEach(function (rec, index) {
      listEl.appendChild(buildRecordCard(rec, index, true));
    });
  }

    // Разделение названия для выпадающего списка
  function splitItemNameForDropdown(name) {
    var match = name.match(/\d/);
    if (!match) return { name: name, details: "" };
    
    var index = match.index;
    var itemName = name.substring(0, index).trim();
    var itemDetails = name.substring(index).trim();
    
    if (!itemName) return { name: name, details: "" };
    
    return { name: itemName, details: itemDetails };
  }

  // ===== Форма записи =====

  function addItemRow(name, qty, shouldFocus, openPicker) {
    var container = document.getElementById("recItemsRows");
    if (!container) return;

    var row = document.createElement("div");
    row.className = "used-item-row";

    var autocomplete = document.createElement("div");
    autocomplete.className = "md3-autocomplete";

    var field = document.createElement("div");
    field.className = "md3-field";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "md3-field-input used-item-name";
    input.placeholder = "Начните вводить название...";
    input.value = name || "";
    input.autocomplete = "off";

    var arrow = document.createElement("span");
    arrow.className = "md3-field-arrow";
    arrow.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">' +
      '<path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';

    var dropdown = document.createElement("div");
    dropdown.className = "md3-dropdown";
    dropdown.hidden = true;

    field.appendChild(input);
    field.appendChild(arrow);
    autocomplete.appendChild(field);
    autocomplete.appendChild(dropdown);

    // ===== МОДАЛЬНОЕ ОКНО ВЫБОРА СРЕДСТВА (все устройства) =====
    input.readOnly = true;
    input.style.cursor = "pointer";

    function openPickerForRow() {
      window.MedicalPicker.open({ catalog: window.MEDICAL_CATALOG || [] })
        .then(function (result) {
          if (!result) return;

          var selectedName = result.name;

          // Проверка на дубликат
          var existingRows = document.querySelectorAll("#recItemsRows .used-item-row");
          for (var k = 0; k < existingRows.length; k++) {
            var inp = existingRows[k].querySelector(".used-item-name");
            if (inp && inp !== input &&
                inp.value.trim().toLowerCase() === selectedName.toLowerCase()) {
              showToast("⚠️ Данное средство уже вносилось в эту карту");
              var dupQty = existingRows[k].querySelector(".used-item-qty");
              if (dupQty) dupQty.focus();
              return;
            }
          }

          input.value = selectedName;
          var qty = row.querySelector(".used-item-qty");
          if (qty) qty.focus();
        });
    }

    field.addEventListener("click", function (e) {
      e.preventDefault();
      openPickerForRow();
    });

    // Скрываем стрелку — всё поле открывает окно выбора
    arrow.style.display = "none";
    dropdown.remove();
    // Количество — только цифры
    var qtyInput = document.createElement("input");
    qtyInput.type = "text";
    qtyInput.className = "md3-qty-input used-item-qty";
    qtyInput.placeholder = "Кол-во";
    qtyInput.inputMode = "numeric";
    qtyInput.value = qty || "";
    restrictToDigits(qtyInput);

    var delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "used-item-del";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", function () { row.remove(); });

    row.appendChild(autocomplete);
    row.appendChild(qtyInput);
    row.appendChild(delBtn);
    container.appendChild(row);

    // Автофокус на новое поле
    if (shouldFocus) {
      setTimeout(function () { input.focus(); }, 50);
    }

    // Сразу открыть окно выбора, если запрошено
    if (openPicker) {
      setTimeout(function () { openPickerForRow(); }, 80);
    }
  }

  function openRecordForm(editIndex) {
    editingIndex = (typeof editIndex === "number") ? editIndex : null;

    var titleEl = document.getElementById("recordFormTitle");
    if (titleEl) titleEl.textContent = editingIndex !== null ? "Редактирование записи" : "Новая запись";

    var noteInput = document.getElementById("recNote");
    var rowsContainer = document.getElementById("recItemsRows");

    if (!noteInput || !rowsContainer) return;
    rowsContainer.innerHTML = "";

    if (editingIndex !== null) {
      var records = loadRecords();
      var rec = records[editingIndex];
      if (rec) {
        noteInput.value = rec.note || rec.cardNumber || "";
        if (rec.items && rec.items.length > 0) {
          rec.items.forEach(function (it) { addItemRow(it.name, it.qty); });
        } else {
          addItemRow("", "");
        }
      }
    } else {
      noteInput.value = "";
      addItemRow("", "");
    }

    var modal = document.getElementById("record-form-modal");
    if (modal && window.SMP && window.SMP.modal) {
      window.SMP.modal.open(modal);
    }
  }

  function saveRecord() {
    var note = document.getElementById("recNote").value.trim();

    var rows = document.querySelectorAll("#recItemsRows .used-item-row");
    var items = [];
    rows.forEach(function (row) {
      var nm = row.querySelector(".used-item-name").value.trim();
      var qt = row.querySelector(".used-item-qty").value.trim();
      if (nm) items.push({ name: nm, qty: qt });
    });

    var record = { note: note, items: items };
    var records = loadRecords();
    if (editingIndex !== null) records[editingIndex] = record;
    else records.push(record);

    saveRecords(records);
    var modal = document.getElementById("record-form-modal");
    if (modal && window.SMP && window.SMP.modal) {
      window.SMP.modal.close(modal);
    }
    renderRecords();
    showToast("✅ Запись сохранена");
  }

  // ===== Отчёт (таблица с горизонтальной прокруткой) =====

  function createReport() {
    var records = loadRecords();
    if (records.length === 0) {
      showToast("⚠️ Нет записей для отчета");
      return;
    }

    var totals = {};
    records.forEach(function (rec) {
      (rec.items || []).forEach(function (it) {
        if (!totals[it.name]) totals[it.name] = 0;
        var num = parseFloat(String(it.qty).replace(",", "."));
        if (!isNaN(num)) totals[it.name] += num;
      });
    });

    var wrap = document.getElementById("reportTableWrap");
    if (!wrap) return;
    wrap.innerHTML = "";

    var table = document.createElement("table");
    table.className = "report-table";

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    var th1 = document.createElement("th");
    th1.textContent = "Использованное средство";
    var th2 = document.createElement("th");
    th2.textContent = "Всего использовано";
    headRow.appendChild(th1);
    headRow.appendChild(th2);
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    Object.keys(totals).forEach(function (name) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      td1.textContent = name;
      var td2 = document.createElement("td");
      td2.className = "report-qty-cell";

      var qtyBadge = document.createElement("span");
      qtyBadge.className = "report-qty-badge";
      qtyBadge.textContent = totals[name] > 0 ? String(totals[name]) : "—";

      td2.appendChild(qtyBadge);

      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrap.appendChild(table);
    var modal = document.getElementById("report-modal");
    if (modal && window.SMP && window.SMP.modal) {
      window.SMP.modal.open(modal);
    }
  }

  // ===== Привязки =====

  function bindUI() {
    var addBtn = document.getElementById("addRecordBtn");
    if (addBtn) addBtn.addEventListener("click", function () { openRecordForm(null); });

    var addRowBtn = document.getElementById("addRecItemRowBtn");
    if (addRowBtn) addRowBtn.addEventListener("click", function () {
      addItemRow("", "", false, true);
    });

    var saveRecBtn = document.getElementById("saveRecordBtn");
    if (saveRecBtn) saveRecBtn.addEventListener("click", saveRecord);

    var createReportBtn = document.getElementById("createReportBtn");
    if (createReportBtn) createReportBtn.addEventListener("click", createReport);

    var clearBtn = document.getElementById("clearShiftBtn");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      SMP.confirm("Очистить все записи текущей смены?").then(function (ok) {
        if (!ok) return;
        saveRecords([]);
        renderRecords();
        showToast("🗑️ Смена очищена");
      });
    });

    document.addEventListener("click", function (e) {
      if (e.target.matches(".modal-backdrop")) {
        var modal = e.target.closest(".modal");
        if (modal) {
          if (modal.id === "record-form-modal") editingIndex = null;
          if (window.SMP && window.SMP.modal) {
            window.SMP.modal.close(modal);
          }
        }
      }
    });
  }

  function setupInputScroll() {
    document.addEventListener("focusin", function (e) {
      var target = e.target;
      if (!target || !target.closest) return;

      var tag = target.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;

      var modal = target.closest(".modal");
      if (!modal) return;

      // Даём клавиатуре открыться, затем прокручиваем поле в центр экрана
      setTimeout(function () {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 300);
    });
  }

  function init() {
    renderRecords();
    bindUI();
    setupInputScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();