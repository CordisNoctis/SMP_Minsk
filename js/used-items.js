(function () {
  "use strict";

  if (window.__usedItemsInitialized) return;
  window.__usedItemsInitialized = true;

  var STORAGE_KEY = "smp-used-items-v1";
  var SHIFTS_KEY = "smp-saved-shifts-v1";
  var editingIndex = null;
  var viewingShiftId = null;

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

  function loadSavedShifts() {
    try {
      var raw = localStorage.getItem(SHIFTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveSavedShifts(shifts) {
    try { localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts)); } catch (e) {}
  }

  // ===== Утилиты =====

  function showToast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.hidden = false; });
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3000);
  }

  function openModal(id) {
    var m = document.getElementById(id);
    if (m) {
      m.hidden = false;
      m.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) {
      m.hidden = true;
      m.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("modal-open");
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
    title.textContent = "Карта № " + (rec.cardNumber || "—");
    header.appendChild(title);

    if (allowEdit && typeof index === "number") {
      var actions = document.createElement("div");
      actions.className = "used-record-actions";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "used-record-btn";
      editBtn.textContent = "✎";
      editBtn.addEventListener("click", function () { openRecordForm(index); });

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "used-record-btn used-record-del";
      delBtn.textContent = "🗑";
      delBtn.addEventListener("click", function () {
        if (!confirm("Удалить эту запись?")) return;
        var arr = loadRecords();
        arr.splice(index, 1);
        saveRecords(arr);
        renderRecords();
        showToast("🗑️ Запись удалена");
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      header.appendChild(actions);
    }

    var patient = document.createElement("div");
    patient.className = "used-record-line";
    patient.textContent = "👤 " + (rec.patientName || "—");

    var address = document.createElement("div");
    address.className = "used-record-line";
    address.textContent = "📍 " + (rec.address || "—");

    card.appendChild(header);
    card.appendChild(patient);
    card.appendChild(address);

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

    var cardNumber = document.getElementById("recCardNumber");
    var patientName = document.getElementById("recPatientName");
    var address = document.getElementById("recAddress");
    var rowsContainer = document.getElementById("recItemsRows");

    if (!cardNumber || !rowsContainer) return;
    rowsContainer.innerHTML = "";

    if (editingIndex !== null) {
      var records = loadRecords();
      var rec = records[editingIndex];
      if (rec) {
        cardNumber.value = rec.cardNumber || "";
        patientName.value = rec.patientName || "";
        address.value = rec.address || "";
        if (rec.items && rec.items.length > 0) {
          rec.items.forEach(function (it) { addItemRow(it.name, it.qty); });
        } else {
          addItemRow("", "");
        }
      }
    } else {
      cardNumber.value = "";
      patientName.value = "";
      address.value = "";
      addItemRow("", "");
    }

    openModal("record-form-modal");
  }

  function saveRecord() {
    var cardNumber = document.getElementById("recCardNumber").value.trim();
    var patientName = document.getElementById("recPatientName").value.trim();
    var address = document.getElementById("recAddress").value.trim();

    if (!cardNumber && !patientName) {
      showToast("⚠️ Заполните № карты или ФИО пациента");
      return;
    }

    var rows = document.querySelectorAll("#recItemsRows .used-item-row");
    var items = [];
    rows.forEach(function (row) {
      var nm = row.querySelector(".used-item-name").value.trim();
      var qt = row.querySelector(".used-item-qty").value.trim();
      if (nm) items.push({ name: nm, qty: qt });
    });

    var record = { cardNumber: cardNumber, patientName: patientName, address: address, items: items };
    var records = loadRecords();
    if (editingIndex !== null) records[editingIndex] = record;
    else records.push(record);

    saveRecords(records);
    closeModal("record-form-modal");
    renderRecords();
    showToast("✅ Запись сохранена");
  }

  // ===== Сохранённые смены =====

  function saveShift() {
    var records = loadRecords();
    if (records.length === 0) {
      showToast("⚠️ Нет записей для сохранения");
      return;
    }
    var shifts = loadSavedShifts();
    shifts.push({
      id: Date.now(),
      savedAt: new Date().toISOString(),
      records: records
    });
    saveSavedShifts(shifts);
    showToast("💾 Смена сохранена");
  }

  function renderSavedShiftsList() {
    var listEl = document.getElementById("savedShiftsList");
    var emptyEl = document.getElementById("savedShiftsEmpty");
    if (!listEl) return;
    listEl.innerHTML = "";

    var shifts = loadSavedShifts();
    if (shifts.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    shifts.forEach(function (shift) {
      var item = document.createElement("div");
      item.className = "saved-shift-item";

      var d = new Date(shift.savedAt);
      var dateStr = d.toLocaleDateString("ru-RU") + " " +
        d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      var info = document.createElement("div");
      info.className = "saved-shift-info";
      info.textContent = dateStr + " · карт: " + (shift.records ? shift.records.length : 0);

      // Кнопка удаления
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "saved-shift-del";
      delBtn.textContent = "🗑";
      delBtn.setAttribute("aria-label", "Удалить смену");
      delBtn.addEventListener("click", function (e) {
        e.stopPropagation(); // не открываем просмотр смены
        if (!confirm("Удалить эту смену?")) return;
        var all = loadSavedShifts();
        all = all.filter(function (s) { return s.id !== shift.id; });
        saveSavedShifts(all);
        renderSavedShiftsList();
        showToast("🗑️ Смена удалена");
      });

      item.appendChild(info);
      item.appendChild(delBtn);

      // Клик по строке (не по кнопке) открывает просмотр
      item.addEventListener("click", function () {
        closeModal("shifts-list-modal");
        openShiftView(shift.id);
      });

      listEl.appendChild(item);
    });
  }

  function openShiftView(shiftId) {
    var shifts = loadSavedShifts();
    var shift = null;
    for (var i = 0; i < shifts.length; i++) {
      if (shifts[i].id === shiftId) { shift = shifts[i]; break; }
    }
    if (!shift) return;

    viewingShiftId = shiftId;

    var titleEl = document.getElementById("shiftViewTitle");
    if (titleEl) {
      var d = new Date(shift.savedAt);
      titleEl.textContent = "Смена от " + d.toLocaleDateString("ru-RU") + " " +
        d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }

    var content = document.getElementById("shiftViewContent");
    if (!content) return;
    content.innerHTML = "";

    (shift.records || []).forEach(function (rec) {
      content.appendChild(buildRecordCard(rec, null, false));
    });

    openModal("shift-view-modal");
  }

  function deleteSavedShift() {
    if (viewingShiftId === null) return;
    if (!confirm("Удалить эту смену?")) return;

    var shifts = loadSavedShifts();
    shifts = shifts.filter(function (s) { return s.id !== viewingShiftId; });
    saveSavedShifts(shifts);

    viewingShiftId = null;
    closeModal("shift-view-modal");
    renderSavedShiftsList();
    showToast("🗑️ Смена удалена");
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
    openModal("report-modal");
  }

  function reportExportPng() {
    var wrap = document.getElementById("reportTableWrap");
    if (!wrap || !wrap.querySelector("table")) {
      showToast("⚠️ Нет данных для экспорта");
      return;
    }
    if (typeof window.html2canvas !== "function") {
      showToast("⚠️ Библиотека экспорта недоступна (нужен интернет при первой загрузке)");
      return;
    }

    showToast("🖼️ Формирую изображение...");
    window.html2canvas(wrap, { backgroundColor: "#ffffff", scale: 2 })
      .then(function (canvas) {
        var a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "otchet-smena-" + new Date().toISOString().slice(0, 10) + ".png";
        a.click();
        showToast("✅ Изображение сохранено");
      })
      .catch(function () {
        showToast("⚠️ Не удалось создать изображение");
      });
  }

  // ===== Привязки =====

  function bindUI() {
    var addBtn = document.getElementById("addRecordBtn");
    if (addBtn) addBtn.addEventListener("click", function () { openRecordForm(null); });

    var addRowBtn = document.getElementById("addRecItemRowBtn");
    if (addRowBtn) addRowBtn.addEventListener("click", function () {
      addItemRow("", "", false, true); // true = сразу открыть окно выбора
    });

    var saveRecBtn = document.getElementById("saveRecordBtn");
    if (saveRecBtn) saveRecBtn.addEventListener("click", saveRecord);

    // № карты — только цифры
    var cardNumberInput = document.getElementById("recCardNumber");
    if (cardNumberInput) restrictToDigits(cardNumberInput);

    var createReportBtn = document.getElementById("createReportBtn");
    if (createReportBtn) createReportBtn.addEventListener("click", createReport);

    var saveShiftBtn = document.getElementById("saveShiftBtn");
    if (saveShiftBtn) saveShiftBtn.addEventListener("click", saveShift);

    var loadShiftBtn = document.getElementById("loadShiftBtn");
    if (loadShiftBtn) loadShiftBtn.addEventListener("click", function () {
      renderSavedShiftsList();
      openModal("shifts-list-modal");
    });

    var deleteShiftBtn = document.getElementById("deleteShiftBtn");
    if (deleteShiftBtn) deleteShiftBtn.addEventListener("click", deleteSavedShift);

    var reportExportPngBtn = document.getElementById("reportExportPngBtn");
    if (reportExportPngBtn) reportExportPngBtn.addEventListener("click", reportExportPng);

    var clearBtn = document.getElementById("clearShiftBtn");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      if (!confirm("Очистить все записи текущей смены?")) return;
      saveRecords([]);
      renderRecords();
      showToast("🗑️ Смена очищена");
    });

    document.addEventListener("click", function (e) {
      if (e.target.matches(".modal-backdrop")) {
        var modal = e.target.closest(".modal");
        if (modal) {
          modal.hidden = true;
          modal.setAttribute("aria-hidden", "true");
          if (modal.id === "record-form-modal") editingIndex = null;
          if (modal.id === "shift-view-modal") viewingShiftId = null;
          document.body.classList.remove("modal-open");
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