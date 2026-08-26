(function () {
  "use strict";

  var TMPL = window.SMP.templates;
  var editingId = null;
  var selectedColorId = "maroon";
  var selectedEmoji = "🚑";

  var SHIFT_EMOJIS = [
    "☀️", "🌙", "🕐", "🚑", "💊", "🩺", "⏰", "🌅", "🌃", "📅",
    "🏥", "💉", "🌡️", "❤️", "🟢", "🟡", "🔴", "📋", "🛏️", "🩹"
  ];

  var formState = {
    startHour: 8,
    startMinute: 0,
    endHour: 20,
    endMinute: 0,
    endsNextDay: false
  };

  function pad(v, len) {
    var s = String(v);
    while (s.length < (len || 2)) s = "0" + s;
    return s;
  }

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

  // ===== Барабаны времени =====

  function getFieldConfig(field) {
    if (field === "startHour" || field === "endHour") {
      return { modulus: 24, step: 1, padLength: 2 };
    }
    return { modulus: 60, step: 5, padLength: 2 };
  }

  function setTriple(field, value) {
    var cfg = getFieldConfig(field);
    var cap = field.charAt(0).toUpperCase() + field.slice(1);
    var mainEl = document.getElementById("tpl" + cap + "Main");
    var prevVal = (value - cfg.step + cfg.modulus) % cfg.modulus;
    var nextVal = (value + cfg.step) % cfg.modulus;

    if (mainEl) mainEl.textContent = pad(value, cfg.padLength);

    var prevBtn = document.querySelector('[data-tplfield="' + field + '"][data-direction="prev"]');
    var nextBtn = document.querySelector('[data-tplfield="' + field + '"][data-direction="next"]');
    if (prevBtn) prevBtn.textContent = pad(prevVal, cfg.padLength);
    if (nextBtn) nextBtn.textContent = pad(nextVal, cfg.padLength);
  }

  function updateFormUI() {
    setTriple("startHour", formState.startHour);
    setTriple("startMinute", formState.startMinute);
    setTriple("endHour", formState.endHour);
    setTriple("endMinute", formState.endMinute);

    var sT = formState.startHour * 60 + formState.startMinute;
    var eT = formState.endHour * 60 + formState.endMinute;
    formState.endsNextDay = (sT === eT) || (eT <= sT);

    var hint = document.getElementById("tplTimeHint");
    if (hint) {
      if (formState.endsNextDay) {
        hint.textContent = "Заканчивается завтра";
        hint.classList.add("time-hint-nextday");
      } else {
        hint.textContent = "Заканчивается сегодня";
        hint.classList.remove("time-hint-nextday");
      }
    }
  }

  function adjustTplField(field, direction) {
    vibrate(8);
    var cfg = getFieldConfig(field);
    var current = formState[field];
    var newVal = direction === "prev"
      ? (current - cfg.step + cfg.modulus) % cfg.modulus
      : (current + cfg.step) % cfg.modulus;

    formState[field] = newVal;
    updateFormUI();
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

  // ===== Выбор смайлика =====

  function renderEmojiPicker() {
    var container = document.getElementById("tplFormEmojis");
    if (!container) return;
    container.innerHTML = "";

    SHIFT_EMOJIS.forEach(function (emoji) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "template-emoji-btn" + (emoji === selectedEmoji ? " selected" : "");
      btn.textContent = emoji;
      btn.addEventListener("click", function () {
        vibrate(8);
        selectedEmoji = emoji;
        renderEmojiPicker();
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
      var emoji = tpl.emoji || "🚑";

      var row = document.createElement("div");
      row.className = "template-edit-row";
      row.style.background = color.bg;
      row.style.color = color.text;

      var emojiEl = document.createElement("span");
      emojiEl.className = "template-edit-emoji";
      emojiEl.textContent = emoji;

      var info = document.createElement("div");
      info.className = "template-edit-info";

      var name = document.createElement("div");
      name.className = "template-edit-name";
      name.textContent = tpl.name + (tpl.builtin ? " (стандартный)" : "");

      var time = document.createElement("div");
      time.className = "template-edit-time";
      time.textContent =
        pad(tpl.startHour) + ":" + pad(tpl.startMinute) + "–" +
        pad(tpl.endHour) + ":" + pad(tpl.endMinute);

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

      row.appendChild(emojiEl);
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

    if (tpl) {
      nameInput.value = tpl.name;
      formState.startHour = tpl.startHour;
      formState.startMinute = tpl.startMinute;
      formState.endHour = tpl.endHour;
      formState.endMinute = tpl.endMinute;
      formState.endsNextDay = !!tpl.endsNextDay;
      selectedColorId = tpl.colorId;
      selectedEmoji = tpl.emoji || "🚑";
    } else {
      nameInput.value = "";
      formState.startHour = 8;
      formState.startMinute = 0;
      formState.endHour = 20;
      formState.endMinute = 0;
      formState.endsNextDay = false;
      selectedColorId = "maroon";
      selectedEmoji = "🚑";
    }

    updateFormUI();
    renderColorsPicker();
    renderEmojiPicker();

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
      emoji: selectedEmoji,
      colorId: selectedColorId,
      startHour: formState.startHour,
      startMinute: formState.startMinute,
      endHour: formState.endHour,
      endMinute: formState.endMinute,
      endsNextDay: formState.endsNextDay
    };

    var templates = TMPL.load();
    var wasEdit = false;

    if (editingId) {
      for (var i = 0; i < templates.length; i++) {
        if (templates[i].id === editingId) {
          templates[i].name = data.name;
          templates[i].emoji = data.emoji;
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

    // Кнопки барабанов времени
    document.addEventListener("click", function (e) {
      var adj = e.target.closest("[data-tplfield]");
      if (adj) {
        var field = adj.getAttribute("data-tplfield");
        var dir = adj.getAttribute("data-direction");
        adjustTplField(field, dir);
      }
    });

    // Закрытие модалки
    document.addEventListener("click", function (e) {
      if (e.target.matches(".modal-backdrop")) {
        var modal = e.target.closest(".modal");
        if (modal && modal.id === "template-form-modal") closeForm();
      }
    });
  }

  function init() {
    renderList();
    bindUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();