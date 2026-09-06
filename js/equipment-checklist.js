(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var brigadeId = params.get("brigade") || "feldsher";

  var brigade = (window.EQUIPMENT_DATA && window.EQUIPMENT_DATA[brigadeId]) || null;
  var STORAGE_KEY = "smp-equipment-state-" + brigadeId + "-v1";
    var CHOICE_KEY = "smp-equipment-choice-" + brigadeId + "-v1";
  var expandedItems = {}; // какие пункты развёрнуты (по имени)
  var choiceState = {};   // выбранные варианты (по имени → массив индексов)

  function loadChoiceState() {
    try {
      var raw = localStorage.getItem(CHOICE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveChoiceState() {
    try {
      localStorage.setItem(CHOICE_KEY, JSON.stringify(choiceState));
    } catch (e) {}
  }

  // Получить выбранные индексы для пункта
  function getSelectedIndexes(item) {
    // Пункты, которые всегда показывают все формы (парацетамол)
    if (item && item.alwaysShow && item.parts) {
      return item.parts.map(function (_, i) { return i; });
    }
    var saved = choiceState[item.name];
    // Если пользователь ещё не делал выбора — по умолчанию первый
    if (!saved) return [0];
    // Возвращаем выбор пользователя (включая пустой массив)
    return saved;
  }
    // Доступ к данным форматирования пунктов
  var ITEM_PARTS_INFO = (window.EQUIPMENT_DATA && window.EQUIPMENT_DATA.ITEM_PARTS) || {};

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
    
    var expandBtn = null;
    
    // Если у пункта есть варианты (parts), отображаем сворачиваемый список
    if (item.parts && item.parts.length > 0) {
      var isExpanded = !!expandedItems[item.name];
      var selectedIdx = getSelectedIndexes(item);
      
      // Для alwaysShow (парацетамол) — всегда показываем все варианты
      if (item.alwaysShow) {
        isExpanded = true;
      }
      
      // Определяем, какие варианты показывать
      var visibleIdx = isExpanded 
        ? item.parts.map(function (_, i) { return i; })  // все
        : selectedIdx;                                    // только выбранные
      
      visibleIdx.forEach(function (partIndex, posInList) {
        var part = item.parts[partIndex];
        
        // Перед вторым и последующими видимыми вариантами: строка "или" (скрыта, если hideOr)
        if (posInList > 0 && !item.hideOr) {
          var orRow = document.createElement("div");
          orRow.className = "equipment-item-or-row";
          
          var orText = document.createElement("span");
          orText.className = "equipment-item-or-text";
          orText.textContent = "или";
          orRow.appendChild(orText);
          
          var lineRight = document.createElement("span");
          lineRight.className = "equipment-item-or-line";
          orRow.appendChild(lineRight);
          
          nameEl.appendChild(orRow);
        }
        
        // Контейнер варианта
        var variantRow = document.createElement("div");
        variantRow.className = "equipment-variant-row";
        
      // Чекбокс выбора варианта — только в развёрнутом виде
      if (isExpanded && !item.alwaysShow) {
          var checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "equipment-variant-check";
          checkbox.checked = selectedIdx.indexOf(partIndex) !== -1;
          checkbox.setAttribute("data-variant-index", partIndex);
          
          // Используем change вместо click, чтобы не срабатывал обработчик клика по mainRow
          checkbox.addEventListener("change", function (e) {
            e.stopPropagation();
            toggleVariantChoice(item, partIndex);
          });
          
          // Останавливаем всплытие клика
          checkbox.addEventListener("click", function (e) {
            e.stopPropagation();
          });
          
          variantRow.appendChild(checkbox);
        }
        
        var variantLeft = document.createElement("div");
        variantLeft.className = "equipment-variant-left";
        
        var nameLine = document.createElement("div");
        nameLine.className = "equipment-item-name-main";
        nameLine.textContent = part.name;
        variantLeft.appendChild(nameLine);
        
        if (part.details) {
          var detailsLine = document.createElement("div");
          detailsLine.className = "equipment-item-details";
          detailsLine.textContent = part.details;
          variantLeft.appendChild(detailsLine);
        }
        
        variantRow.appendChild(variantLeft);
        
        // Количество варианта (с поддержкой двух строк)
        if (part.qty || part.qtyMain) {
          var partQty = document.createElement("div");
          partQty.className = "equipment-item-part-qty";
          
          if (part.qtyMain) {
            var qtyMainEl = document.createElement("div");
            qtyMainEl.className = "equipment-qty-main";
            qtyMainEl.textContent = part.qtyMain;
            partQty.appendChild(qtyMainEl);
            
            if (part.qtyNote) {
              var partNoteLines = Array.isArray(part.qtyNote) ? part.qtyNote : [part.qtyNote];
              partNoteLines.forEach(function (noteLine) {
                var qtyNoteEl = document.createElement("div");
                qtyNoteEl.className = "equipment-qty-note";
                qtyNoteEl.textContent = noteLine;
                partQty.appendChild(qtyNoteEl);
              });
            }
          } else {
            partQty.textContent = part.qty;
          }
          
          variantRow.appendChild(partQty);
        }
        
        nameEl.appendChild(variantRow);
      });
      
      // Кнопка разворачивания — только если форм больше одной и не alwaysShow
      if (item.parts.length > 1 && !item.alwaysShow) {
        expandBtn = document.createElement("button");
        expandBtn.type = "button";
        expandBtn.className = "equipment-expand-btn";
        expandBtn.textContent = isExpanded ? "▲ Свернуть" : "▼ Показать все формы";
        expandBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          expandedItems[item.name] = !expandedItems[item.name];
          render();
        });
      }
    }
    else {
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

    // Проверяем, есть ли у вариантов собственные количества (qty или qtyMain)
    var hasVariantQty = item.parts && item.parts.some(function (p) { return p.qty || p.qtyMain; });
    
    // Создаём элемент количества только если нет вариантов с собственными количествами
    var qtyEl = null;
    if (!hasVariantQty) {
      qtyEl = document.createElement("div");
      qtyEl.className = "equipment-item-qty";
      
      var qtyInfo = (item.qtyMain || item.qtyNote || item.qtyLines) ? {
        qtyMain: item.qtyMain,
        qtyNote: item.qtyNote,
        qtyLines: item.qtyLines
      } : null;
      
      // Если заданы строки количества одинаковым шрифтом (например, "1 детский" / "1 взрослый")
      if (qtyInfo && qtyInfo.qtyLines && qtyInfo.qtyLines.length > 0) {
        qtyInfo.qtyLines.forEach(function (line) {
          var lineEl = document.createElement("div");
          lineEl.className = "equipment-qty-line";
          lineEl.textContent = line;
          qtyEl.appendChild(lineEl);
        });
      }
      // Если заданы основное количество + примечание (примечание меньшим шрифтом)
      else if (qtyInfo && qtyInfo.qtyMain) {
        var qtyMainEl = document.createElement("div");
        qtyMainEl.className = "equipment-qty-main";
        qtyMainEl.textContent = qtyInfo.qtyMain;
        qtyEl.appendChild(qtyMainEl);
        
        if (qtyInfo.qtyNote) {
          var noteLines = Array.isArray(qtyInfo.qtyNote) ? qtyInfo.qtyNote : [qtyInfo.qtyNote];
          noteLines.forEach(function (noteLine) {
            var qtyNoteEl = document.createElement("div");
            qtyNoteEl.className = "equipment-qty-note";
            qtyNoteEl.textContent = noteLine;
            qtyEl.appendChild(qtyNoteEl);
          });
        }
      } else {
        qtyEl.textContent = item.qty || "";
      }
    }

    mainRow.appendChild(nameEl);

    mainRow.addEventListener("click", function () {
      var st = loadState();
      var cur = st[item.name] || { status: 0, refillQty: "" };
      cur.status = (cur.status + 1) % 3;
      if (cur.status !== 2) cur.refillQty = "";
      st[item.name] = cur;
      saveState(st);
      render();
    });

    // Количество внутрь mainRow (справа), чтобы правый край совпадал
    if (qtyEl) {
      mainRow.appendChild(qtyEl);
    }
    
    // Добавляем основную строку
    card.appendChild(mainRow);
    
    // Добавляем кнопку разворачивания (если есть)
    if (expandBtn) {
      card.appendChild(expandBtn);
    }

    if (itemState.status === 2) {
      var selectedIdx = getSelectedIndexes(item);
      var hasVariants = item.parts && item.parts.length > 1 && selectedIdx.length > 0;
      
      if (hasVariants) {
        // Для каждого выбранного варианта — своя строка "Пополнить"
        var refillMap = itemState.refillQtyMap || {};
        
        selectedIdx.forEach(function (variantIndex) {
          var part = item.parts[variantIndex];
          
          var refillRow = document.createElement("div");
          refillRow.className = "equipment-refill-row";
          
          var label = document.createElement("span");
          label.className = "equipment-refill-label";
          label.textContent = "Пополнить: " + part.name + (part.details ? " " + part.details : "");
          
          var input = document.createElement("input");
          input.type = "text";
          input.className = "equipment-refill-input";
          input.placeholder = "Кол-во";
          input.value = refillMap[variantIndex] || "";
          input.inputMode = "numeric";
          
          input.addEventListener("click", function (e) { e.stopPropagation(); });
          input.addEventListener("input", function () {
            var st = loadState();
            if (!st[item.name]) st[item.name] = { status: 2, refillQtyMap: {} };
            if (!st[item.name].refillQtyMap) st[item.name].refillQtyMap = {};
            st[item.name].refillQtyMap[variantIndex] = input.value;
            saveState(st);
          });
          
          refillRow.appendChild(label);
          refillRow.appendChild(input);
          card.appendChild(refillRow);
        });
      } else {
        // Обычная одна строка "Пополнить"
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
    }

    listEl.appendChild(card);
  }

  function toggleVariantChoice(item, partIndex) {
    var saved = choiceState[item.name];
    var newSelection;
    
    if (!saved) {
      // Первый клик пользователя — выбираем только этот вариант
      newSelection = [partIndex];
    } else {
      // Переключаем (добавляем/снимаем), даже если это последний
      newSelection = saved.slice();
      var idx = newSelection.indexOf(partIndex);
      
      if (idx !== -1) {
        newSelection.splice(idx, 1); // Снимаем (разрешаем пустой выбор)
      } else {
        newSelection.push(partIndex);
      }
      
      newSelection.sort(function (a, b) { return a - b; });
    }
    
    choiceState[item.name] = newSelection;
    saveChoiceState();
    render();
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
        var selectedIdx = getSelectedIndexes(item);
        var hasVariants = item.parts && item.parts.length > 1 && itemState.refillQtyMap;
        
        if (hasVariants) {
          // Для пунктов с вариантами: каждая выбранная форма отдельно
          selectedIdx.forEach(function (variantIndex) {
            var part = item.parts[variantIndex];
            refillItems.push({
              name: part.name + (part.details ? " " + part.details : ""),
              norm: part.qty || part.qtyMain || item.qty || "",
              refill: (itemState.refillQtyMap && itemState.refillQtyMap[variantIndex]) || ""
            });
          });
        } else {
          refillItems.push({
            name: item.name,
            norm: item.qty || "",
            refill: itemState.refillQty || ""
          });
        }
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
    choiceState = loadChoiceState();
    render();
    bindUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();