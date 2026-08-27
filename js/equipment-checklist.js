(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var brigadeId = params.get("brigade") || "feldsher";

  var brigade = (window.EQUIPMENT_DATA && window.EQUIPMENT_DATA[brigadeId]) || null;
  var STORAGE_KEY = "smp-equipment-state-" + brigadeId + "-v1";

  var GROUP_ORDER = ["drugs", "devices", "other", "vehicle"];
  var GROUP_TITLES = {
    drugs: "Лекарственные препараты",
    devices: "Медицинские изделия и инструменты",
    other: "Прочее",
    vehicle: "Оснащение автомобиля"
  };

  var DRUG_FORM_ORDER = ["solid", "liquid", "soft", "gas"];
  var DRUG_FORM_TITLES = {
    solid: "Твердые (таблетки, капсулы, порошки)",
    liquid: "Жидкие (растворы, капли)",
    soft: "Мягкие (мази, гели)",
    gas: "Газообразные (аэрозоли, газы)"
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function byName(a, b) {
    return a.name.localeCompare(b.name, "ru");
  }

    // ===== Разделение названия на препарат и дозировку =====

  function splitItemName(name) {
    // Ищем первую цифру в строке
    var match = name.match(/\d/);
    
    if (!match) {
      // Цифр нет — возвращаем только название
      return { name: name, details: "" };
    }
    
    var index = match.index;
    var itemName = name.substring(0, index).trim();
    var itemDetails = name.substring(index).trim();
    
    // Если название пустое (начинается с цифры), оставляем как есть
    if (!itemName) {
      return { name: name, details: "" };
    }
    
    return { name: itemName, details: itemDetails };
  }

  function renderItem(item, listEl, state) {
    var itemState = state[item.name] || { status: 0, refillQty: "" };

    var card = document.createElement("div");
    card.className = "equipment-item";
    if (itemState.status === 1) card.classList.add("status-checked");
    if (itemState.status === 2) card.classList.add("status-refill");

    var mainRow = document.createElement("div");
    mainRow.className = "equipment-item-main";

    var nameEl = document.createElement("div");
    nameEl.className = "equipment-item-name";
    
    // Если у пункта есть варианты (parts), отображаем их с разделителями
    if (item.parts && item.parts.length > 0) {
      item.parts.forEach(function (part, partIndex) {
        // Разделитель между вариантами (не перед первым)
        if (partIndex > 0) {
          var divider = document.createElement("div");
          divider.className = "equipment-item-divider";
          nameEl.appendChild(divider);
          
          var orLabel = document.createElement("div");
          orLabel.className = "equipment-item-or";
          orLabel.textContent = "или";
          nameEl.appendChild(orLabel);
        }
        
        // Название препарата/средства
        var nameLine = document.createElement("div");
        nameLine.className = "equipment-item-name-main";
        nameLine.textContent = part.name;
        nameEl.appendChild(nameLine);
        
        // Дозировка (меньшим шрифтом)
        if (part.details) {
          var detailsLine = document.createElement("div");
          detailsLine.className = "equipment-item-details";
          detailsLine.textContent = part.details;
          nameEl.appendChild(detailsLine);
        }
        
        // Количество для варианта (если задано)
        if (part.qty) {
          var partQty = document.createElement("div");
          partQty.className = "equipment-item-part-qty";
          partQty.textContent = part.qty;
          nameEl.appendChild(partQty);
        }
      });
    } else {
      // Простой пункт: разделяем по первой цифре
      var parts = splitItemName(item.name);
      
      var nameLine = document.createElement("div");
      nameLine.className = "equipment-item-name-main";
      nameLine.textContent = parts.name;
      nameEl.appendChild(nameLine);
      
      if (parts.details) {
        var detailsLine = document.createElement("div");
        detailsLine.className = "equipment-item-details";
        detailsLine.textContent = parts.details;
        nameEl.appendChild(detailsLine);
      }
    }

    var qtyEl = document.createElement("div");
    qtyEl.className = "equipment-item-qty";
    qtyEl.textContent = item.qty || "";

    mainRow.appendChild(nameEl);
    mainRow.appendChild(qtyEl);

    mainRow.addEventListener("click", function () {
      var st = loadState();
      var cur = st[item.name] || { status: 0, refillQty: "" };
      cur.status = (cur.status + 1) % 3;
      if (cur.status !== 2) cur.refillQty = "";
      st[item.name] = cur;
      saveState(st);
      render();
    });

    card.appendChild(mainRow);

    if (itemState.status === 2) {
      var refillRow = document.createElement("div");
      refillRow.className = "equipment-refill-row";

      var label = document.createElement("span");
      label.className = "equipment-refill-label";
      label.textContent = "Пополнить:";

      var input = document.createElement("input");
      input.type = "text";
      input.className = "equipment-refill-input";
      input.placeholder = "Кол-во";
      input.value = itemState.refillQty || "";
      input.inputMode = "numeric";

      input.addEventListener("click", function (e) { e.stopPropagation(); });
      input.addEventListener("input", function () {
        var st = loadState();
        if (!st[item.name]) st[item.name] = { status: 2, refillQty: "" };
        st[item.name].refillQty = input.value;
        saveState(st);
      });

      refillRow.appendChild(label);
      refillRow.appendChild(input);
      card.appendChild(refillRow);
    }

    listEl.appendChild(card);
  }

  function render() {
    var titleEl = document.getElementById("brigadeTitle");
    var listEl = document.getElementById("equipmentList");
    var emptyEl = document.getElementById("equipmentEmpty");
    if (!listEl) return;

    if (brigade && titleEl) titleEl.textContent = brigade.title;

    listEl.innerHTML = "";

    if (!brigade || !brigade.items || brigade.items.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    var state = loadState();

    // Группируем позиции
    var groups = {};
    for (var i = 0; i < brigade.items.length; i++) {
      var it = brigade.items[i];
      var g = it.group || "other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(it);
    }

    // Рендерим группы по порядку
    GROUP_ORDER.forEach(function (gKey) {
      var items = groups[gKey];
      if (!items || items.length === 0) return;

      var groupTitle = document.createElement("h3");
      groupTitle.className = "equipment-group-title";
      groupTitle.textContent = GROUP_TITLES[gKey];
      listEl.appendChild(groupTitle);

      if (gKey === "drugs") {
        // Подгруппы по лекарственным формам
        var drugForms = {};
        items.forEach(function (item) {
          var df = item.drugForm || "liquid";
          if (!drugForms[df]) drugForms[df] = [];
          drugForms[df].push(item);
        });

        DRUG_FORM_ORDER.forEach(function (dfKey) {
          var dfItems = drugForms[dfKey];
          if (!dfItems || dfItems.length === 0) return;
          dfItems.sort(byName);

          var subTitle = document.createElement("h4");
          subTitle.className = "equipment-subgroup-title";
          subTitle.textContent = DRUG_FORM_TITLES[dfKey];
          listEl.appendChild(subTitle);

          dfItems.forEach(function (item) {
            renderItem(item, listEl, state);
          });
        });
      } else {
        items.sort(byName);
        items.forEach(function (item) {
          renderItem(item, listEl, state);
        });
      }
    });
  }

  function openRefillReport() {
    var content = document.getElementById("refillReportContent");
    var emptyEl = document.getElementById("refillReportEmpty");
    if (!content) return;

    content.innerHTML = "";

    if (!brigade || !brigade.items || brigade.items.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      openModal("refill-report-modal");
      return;
    }

    var state = loadState();
    var refillItems = [];

    // Собираем позиции со статусом 2 (красные / пополнить)
    brigade.items.forEach(function (item) {
      var itemState = state[item.name];
      if (itemState && itemState.status === 2) {
        refillItems.push({
          name: item.name,
          norm: item.qty || "",
          refill: itemState.refillQty || ""
        });
      }
    });

    // Сортируем по алфавиту
    refillItems.sort(function (a, b) {
      return a.name.localeCompare(b.name, "ru");
    });

    if (refillItems.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      openModal("refill-report-modal");
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    refillItems.forEach(function (it) {
      var card = document.createElement("div");
      card.className = "refill-report-item";

      var name = document.createElement("div");
      name.className = "refill-report-name";
      name.textContent = it.name;

      var normRow = document.createElement("div");
      normRow.className = "refill-report-row";

      var normLabel = document.createElement("span");
      normLabel.className = "refill-report-label";
      normLabel.textContent = "Норма:";

      var normVal = document.createElement("span");
      normVal.className = "refill-report-value";
      normVal.textContent = it.norm || "—";

      normRow.appendChild(normLabel);
      normRow.appendChild(normVal);

      var refillRow = document.createElement("div");
      refillRow.className = "refill-report-row";

      var refillLabel = document.createElement("span");
      refillLabel.className = "refill-report-label";
      refillLabel.textContent = "Пополнить:";

      var refillVal = document.createElement("span");
      refillVal.className = "refill-report-value";
      refillVal.textContent = it.refill || "—";

      refillRow.appendChild(refillLabel);
      refillRow.appendChild(refillVal);

      card.appendChild(name);
      card.appendChild(normRow);
      card.appendChild(refillRow);

      content.appendChild(card);
    });

    openModal("refill-report-modal");
  }

  function openModal(id) {
    var m = document.getElementById(id);
    if (m) {
      m.hidden = false;
      m.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function resetCheck() {
    if (!confirm("Сбросить все отметки проверки для этой бригады?")) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    render();
  }

  function bindUI() {
    var reportBtn = document.getElementById("refillReportBtn");
    if (reportBtn) {
      reportBtn.addEventListener("click", openRefillReport);
    }

    var resetBtn = document.getElementById("resetCheckBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetCheck);
    }
  }

  function init() {
    render();
    bindUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();