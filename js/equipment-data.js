(function () {
  "use strict";

  // ===== Классификация =====
  function detectGroup(name) {
    var n = name.toLowerCase();
    var otherKeys = ["радиосвяз","транкингов","сотовой","gps","видеорегистратор","охлаждающий спрей","одеяло","целлофанов","сортировочные марки","противоэпидемическ","средства для"];
    var deviceKeys = ["аппарат","дефибриллятор","ларингоскоп","глюкометр","пульсоксиметр","термометр","измеритель артериального давления","стетофонендоскоп","электрокардиограф","ингалятор","баллон","катетер","зонд","жгут","шприц","бинт","вата","салфетк","пластырь","перчатк","маска","повязк","шин","носилк","каталка","воротник","ларингеальн","воздуховод","трубк","интубационн","система","контейнер","ножниц","пинцет","шпатель","бумага для экг","гель электродный","вакуумное","зажим","набор акушерский","фильтр","сумка-укладка","лейкопластырь","кислородный ингалятор","эндотрахеальн","расходомер","кресло","приемное устройство","щит-носилки"];
    var drugKeys = ["раствор для инъекций","раствор для инфузий","таблетк","аэрозоль","капл","порошок","концентрат","лиофилизат","кислота","аминофиллин","амиодарон","аммиак","атропин","ацетилсалициловая","бисопролол","верапамил","галоперидол","гепарин","глицерил","глюкоза","дексаметазон","диазепам","дифенгидрамин","добутамин","допамин","дротаверин","изосорбид","йод","каптоприл","кеторолак","кетопрофен","клемастин","клопидогрель","лидокаин","магния сульфат","метамизол","метоклопрамид","метопролол","морфин","налоксон","натрия хлорид","натрия гидрокарбонат","прокаин","парацетамол","перекись водорода","преднизолон","пропранолол","тримеперидин","сульфацетамид","сульфацил","тиамин","трамадол","уголь активированный","урапидил","фенотерол","сальбутамол","ипратропиум","фентанил","фуросемид","хлоргексидин","хлорпромазин","цефотаксим","эпинефрин","этамзилат","этанол","аторвастатин","вода для инъекций","прокаинамид","тенектеплаза","лимонная кислота","антисептическ","парафин","кислород газообразный"];
    var i;
    for (i = 0; i < otherKeys.length; i++) if (n.indexOf(otherKeys[i]) !== -1) return "other";
    for (i = 0; i < deviceKeys.length; i++) if (n.indexOf(deviceKeys[i]) !== -1) return "devices";
    for (i = 0; i < drugKeys.length; i++) if (n.indexOf(drugKeys[i]) !== -1) return "drugs";
    return "other";
  }

  function detectDrugForm(name) {
    var n = name.toLowerCase();
    if (n.indexOf("аэрозоль") !== -1 || n.indexOf("спрей") !== -1 || n.indexOf("газ") !== -1) return "gas";
    if (n.indexOf("таблетк") !== -1 || n.indexOf("капсул") !== -1 || n.indexOf("порошок") !== -1 || n.indexOf("драже") !== -1 || n.indexOf("аторвастатин") !== -1) return "solid";
    if (n.indexOf("мазь") !== -1 || n.indexOf("крем") !== -1 || n.indexOf("гель") !== -1 || n.indexOf("суппозитори") !== -1 || n.indexOf("свеч") !== -1) return "soft";
    return "liquid";
  }

  // ===== Разбор ячейки количества =====
  function parseQty(cell) {
    if (cell === null || cell === undefined || cell === "—") return null;
    if (Array.isArray(cell)) return { variants: cell };
    if (typeof cell === "string") {
      if (cell.indexOf("L:") === 0) return { qtyLines: cell.slice(2).split("|") };
      if (cell.indexOf("|") !== -1) {
        var p = cell.split("|");
        return { qtyMain: p[0], qtyNote: (p.length > 2 ? p.slice(1) : p[1]) };
      }
      return { qty: cell };
    }
    return null;
  }

  function fullNameOf(def) {
    return (def[0] + " " + (def[1] || "")).replace(/\s+/g, " ").trim();
  }

  // ===== Сборка одного пункта =====
  function buildItem(id, cell) {
    var def = (window.MED_ITEMS || {})[id];
    if (!def) return null;

    // Объектная форма: { variants: [...], hideOr: true, alwaysShow: true }
    var hideOr = false;
    var alwaysShow = false;
    if (!Array.isArray(def) && def.variants) {
      hideOr = !!def.hideOr;
      alwaysShow = !!def.alwaysShow;
      def = def.variants;
    }

    var q = parseQty(cell);
    if (!q) return null;

    var item;
    if (Array.isArray(def[0])) {
      // Варианты "или"
      var hasVarQtys = q.variants && q.variants.length > 0;
      var parts = [];
      for (var i = 0; i < def.length; i++) {
        var vq = hasVarQtys ? q.variants[i] : null;
        if (hasVarQtys && (vq === null || vq === undefined || vq === "—")) continue;
        var pq = vq ? parseQty(vq) : null;
        var part = { name: def[i][0], details: def[i][1] || "" };
        if (pq) {
          if (pq.qty) part.qty = pq.qty;
          if (pq.qtyMain) part.qtyMain = pq.qtyMain;
          if (pq.qtyNote) part.qtyNote = pq.qtyNote;
        }
        parts.push(part);
      }
      if (parts.length === 0) return null;
      var baseName = def.map(function (d) { return fullNameOf(d); }).join(" / ");
      item = { name: baseName, parts: parts, group: detectGroup(fullNameOf(def[0])), hideOr: hideOr, alwaysShow: alwaysShow };
      // Количество задано одной строкой на весь пункт — показываем общим бейджем
      if (!hasVarQtys) {
        if (q.qty) item.qty = q.qty;
        if (q.qtyMain) item.qtyMain = q.qtyMain;
        if (q.qtyNote) item.qtyNote = q.qtyNote;
        if (q.qtyLines) item.qtyLines = q.qtyLines;
        if (!q.qty && q.qtyMain) item.qty = q.qtyMain;
      }
    } else {
      var full = fullNameOf(def);
      item = { name: full, parts: [{ name: def[0], details: def[1] || "" }], group: detectGroup(full) };
      if (q.qty) item.qty = q.qty;
      if (q.qtyMain) item.qtyMain = q.qtyMain;
      if (q.qtyNote) item.qtyNote = q.qtyNote;
      if (q.qtyLines) item.qtyLines = q.qtyLines;
    }
    if (item.group === "drugs") item.drugForm = detectDrugForm(item.name);
    return item;
  }

  // ===== Бригада (колонки 0..3) + автомобиль =====
  function buildBrigade(colIndex) {
    var items = [];
    var rows = (window.MED_TABLES || {}).rows || [];
    for (var r = 0; r < rows.length; r++) {
      var it = buildItem(rows[r][0], rows[r][colIndex + 1]);
      if (it) items.push(it);
    }
    var veh = (window.MED_TABLES || {}).vehicle || [];
    for (var v = 0; v < veh.length; v++) {
      var vit = buildItem(veh[v][0], veh[v][colIndex + 1]);
      if (vit) { vit.group = "vehicle"; items.push(vit); }
    }
    return items;
  }

  function buildSingle(list) {
    var items = [];
    for (var i = 0; i < list.length; i++) {
      var it = buildItem(list[i][0], list[i][1]);
      if (it) items.push(it);
    }
    return items;
  }

  // ===== Итоговые данные =====
  window.EQUIPMENT_DATA = {
    ITEM_PARTS: {},
    feldsher:    { title: "Фельдшерской бригады",        items: buildBrigade(0) },
    pediatric:   { title: "Педиатрической бригады",      items: buildBrigade(1) },
    intensive:   { title: "Бригады интенсивной терапии", items: buildBrigade(2) },
    resusc:      { title: "Реанимационной бригады",      items: buildBrigade(2) },
    psych:       { title: "Психиатрической бригады",     items: buildBrigade(3) },
    "mass-trauma": { title: "Пострадавшим при массовых травмах", items: buildSingle((window.MED_TABLES||{}).massTrauma || []) },
    chemical:     { title: "Пострадавшим от химически опасных веществ", items: buildSingle((window.MED_TABLES||{}).chemical || []) }
  };

  // ===== Каталог для поиска =====
  window.MEDICAL_CATALOG = [];
  var seen = {};
  var ITEMS = window.MED_ITEMS || {};
  for (var id in ITEMS) {
    if (!ITEMS.hasOwnProperty(id)) continue;
    var def = ITEMS[id];
    if (!Array.isArray(def) && def.variants) def = def.variants;
    if (Array.isArray(def[0])) {
      for (var i = 0; i < def.length; i++) {
        var nm = fullNameOf(def[i]);
        var g = detectGroup(nm);
        if (g === "vehicle") continue;
        var key = nm.toLowerCase();
        if (!seen[key]) { seen[key] = true; window.MEDICAL_CATALOG.push({ id: nm, name: nm, group: g }); }
      }
    } else {
      var nm2 = fullNameOf(def);
      var g2 = detectGroup(nm2);
      if (g2 === "vehicle") continue;
      var key2 = nm2.toLowerCase();
      if (!seen[key2]) { seen[key2] = true; window.MEDICAL_CATALOG.push({ id: nm2, name: nm2, group: g2 }); }
    }
  }

  // ===== Специальные случаи: размеры катетеров для поиска =====
  var catheterSizes = [
    "Катетер периферический 14G (оранжевый)",
    "Катетер периферический 16G (серый)",
    "Катетер периферический 17G (белый)",
    "Катетер периферический 18G (зеленый)",
    "Катетер периферический 20G (розовый)",
    "Катетер периферический 22G (синий)",
    "Катетер периферический 24G (желтый)",
    "Катетер периферический 26G (фиолетовый)"
  ];
  for (var ci = 0; ci < catheterSizes.length; ci++) {
    var cathName = catheterSizes[ci];
    var cathKey = cathName.toLowerCase();
    if (!seen[cathKey]) {
      seen[cathKey] = true;
      window.MEDICAL_CATALOG.push({ id: cathName, name: cathName, group: "devices" });
    }
  }

  window.MEDICAL_CATALOG.sort(function (a, b) { return a.name.localeCompare(b.name, "ru"); });
})();