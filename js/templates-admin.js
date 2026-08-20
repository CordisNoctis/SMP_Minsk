(function () {
  "use strict";

  var TMPL = window.SMP.templates;
  var editingId = null;
  var selectedColorId = "maroon";

  function pad(v) { return (v < 10 ? "0" : "") + v; }

  function vibrate(d) {
    if (navigator.vibrate) try { navigator.vibrate(d || 10); } catch (e) {}
  }

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

  // ===== Селекты времени =====

  function initTimeSelects() {
    var hourIds = ["tplStartHour", "tplEndHour"];
    var minIds = ["tplStartMinute", "tplEndMinute"];

    hourIds.forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = "";
      for (var h = 0; h < 24; h++) {
        var opt = document.createElement("option");
        opt.value = h;
        opt.textContent = pad(h);
        sel.appendChild(opt);
      }
    });

    minIds.forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = "";
      for (var m = 0; m < 60; m += 5) {
        var opt = document.createElement("option");
        opt.value = m;
        opt.textContent = pad(m);
        sel.appendChild(opt);
      }
    });
  }

  // ===== Палитра цветов =====

  function renderColorsPicker() {
    var container = document.getElementById("tplFormColors");
    if (!container) return;
    container.innerHTML = "";

    TMPL.COLORS.forEach(function (color) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "template-color-btn" + (color.id === selectedColorId ? " selected" : "");
      btn.style.background = color.bg;
      btn.setAttribute("aria-label", color.name);
      btn.addEventListener("click", function () {
        vibrate(8);
        selectedColorId = color.id;
        renderColorsPicker();
      });
      container.appendChild(btn);
    });
  }

  // ===== Список шаблонов =====

  function renderList() {
    var container = document.getElementById("templatesAdminList");
    var emptyMsg = document.getElementById("templatesEmpty");
    if (!container) return;
    container.innerHTML = "";

    var templates = TMPL.load();
    if (templates.length === 0) {
      if (emptyMsg) emptyMsg.hidden = false;
      return;
    }
    if (emptyMsg) emptyMsg.hidden = true;

    templates.forEach(function (tpl) {
      var color = TMPL.getColor(tpl.colorId);

      var row = document.createElement("div");
      row.className = "template-edit-row";
      row.style.background = color.bg;
      row.style.color = color.text;

      var info = document.createElement("div");
      info.className = "template-edit-info";

      var name = document.createElement("div");
      name.className = "template-edit-name";
      name.textContent = tpl.name + (tpl.builtin ? " (стандартный)" : "");

      var time = document.createElement("div");
      time.className = "template-edit-time";
      time.textContent =
        pad(tpl.startHour) + ":" + pad(tpl.startMinute) + "–" +
        pad(tpl.endHour) + ":" + pad(tpl.endMinute) +
        (tpl.endsNextDay ? " (завтра)" : "");

      info.appendChild(name);
      info.appendChild(time);

      var actions = document.createElement("div");
      actions.className = "template-edit-actions";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "template-edit-btn";
      editBtn.textContent = "✎";
      editBtn.setAttribute("aria-label", "Редактировать");
      editBtn.addEventListener("click", function () {
        vibrate(10);
        openForm(tpl);
      });
      actions.appendChild(editBtn);

      if (!tpl.builtin) {
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "template-edit-delete";
        delBtn.textContent = "🗑";
        delBtn.setAttribute("aria-label", "Удалить");
        delBtn.addEventListener("click", function () {
          vibrate(15);
          deleteTemplate(tpl.id);
        });
        actions.appendChild(delBtn);
      }

      row.appendChild(info);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  // ===== Форма =====

  function openForm(tpl) {
    editingId = tpl ? tpl.id : null;

    var titleEl = document.getElementById("templateFormTitle");
    if (titleEl) titleEl.textContent = tpl ? "Редактирование шаблона" : "Новый шаблон";

    var nameInput = document.getElementById("tplFormName");
    var startHour = document.getElementById("tplStartHour");
    var startMinute = document.getElementById("tplStartMinute");
    var endHour = document.getElementById("tplEndHour");
    var endMinute = document.getElementById("tplEndMinute");
    var endsNextDay = document.getElementById("tplEndsNextDay");

    if (tpl) {
      nameInput.value = tpl.name;
      startHour.value = tpl.startHour;
      startMinute.value = tpl.startMinute;
      endHour.value = tpl.endHour;
      endMinute.value = tpl.endMinute;
      endsNextDay.checked = !!tpl.endsNextDay;
      selectedColorId = tpl.colorId;
    } else {
      nameInput.value = "";
      startHour.value = 8;
      startMinute.value = 0;
      endHour.value = 20;
      endMinute.value = 0;
      endsNextDay.checked = false;
      selectedColorId = "maroon";
    }

    renderColorsPicker();

    var modal = document.getElementById("template-form-modal");
    if (modal) {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function closeForm() {
    editingId = null;
    var modal = document.getElementById("template-form-modal");
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("modal-open");
  }

  function saveForm() {
    var nameInput = document.getElementById("tplFormName");
    var name = nameInput.value.trim();

    if (!name) {
      showToast("⚠️ Введите название шаблона");
      nameInput.focus();
      return;
    }

    var data = {
      name: name,
      colorId: selectedColorId,
      startHour: parseInt(document.getElementById("tplStartHour").value, 10),
      startMinute: parseInt(document.getElementById("tplStartMinute").value, 10),
      endHour: parseInt(document.getElementById("tplEndHour").value, 10),
      endMinute: parseInt(document.getElementById("tplEndMinute").value, 10),
      endsNextDay: document.getElementById("tplEndsNextDay").checked
    };

    var templates = TMPL.load();
    var wasEdit = false;

    if (editingId) {
      for (var i = 0; i < templates.length; i++) {
        if (templates[i].id === editingId) {
          templates[i].name = data.name;
          templates[i].colorId = data.colorId;
          templates[i].startHour = data.startHour;
          templates[i].startMinute = data.startMinute;
          templates[i].endHour = data.endHour;
          templates[i].endMinute = data.endMinute;
          templates[i].endsNextDay = data.endsNextDay;
          wasEdit = true;
          break;
        }
      }
    } else {
      data.id = "custom-" + Date.now();
      data.builtin = false;
      templates.push(data);
    }

    TMPL.save(templates);
    closeForm();
    renderList();
    showToast(wasEdit ? "✅ Шаблон обновлён" : "✅ Шаблон создан");
  }

  function deleteTemplate(id) {
    if (!confirm("Удалить этот шаблон?")) return;

    var templates = TMPL.load();
    var newTemplates = [];
    for (var i = 0; i < templates.length; i++) {
      if (templates[i].id !== id) newTemplates.push(templates[i]);
    }

    TMPL.save(newTemplates);
    renderList();
    showToast("🗑️ Шаблон удалён");
  }

  // ===== Привязки =====

  function bindUI() {
    var createBtn = document.getElementById("createTemplateBtn");
    if (createBtn) {
      createBtn.addEventListener("click", function () {
        vibrate(10);
        openForm(null);
      });
    }

    var saveBtn = document.getElementById("tplFormSaveBtn");
    if (saveBtn) saveBtn.addEventListener("click", saveForm);

    document.addEventListener("click", function (e) {
      if (e.target.matches(".modal-backdrop")) {
        var modal = e.target.closest(".modal");
        if (modal && modal.id === "template-form-modal") closeForm();
      }
    });
  }

  function init() {
    initTimeSelects();
    renderList();
    bindUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();