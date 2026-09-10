(function () {
  "use strict";

  // =====================================================
  // База препаратов: индекс + Markdown-файлы.
  //
  //   data/drugs-index.json       — индекс с метаданными
  //   data/drugs/{id}.md          — инструкция для специалиста
  //   data/drugs/{id}-patient.md  — инструкция для пациента
  //
  // Пример записи индекса:
  // {
  //   "id": "salbutamol",
  //   "title": "Сальбутамол 100 мкг/доза",
  //   "group": "Бета-2-адреномиметики",
  //   "atc": "R03AC02",
  //   "form": "Аэрозоль для ингаляций дозированный",
  //   "tags": ["экстренные", "ингаляционные"],
  //   "aliases": ["вентолин", "сальбутамол"],
  //   "hasPatient": true,
  //   "updated": "2026-09-09"
  // }
  // =====================================================

  var indexCache = null;
  var indexPromise = null;
  var mdCache = {};

  function baseUrl() {
    return window.location.pathname.includes("/pages/") ? "../data/" : "data/";
  }

  // Запрос по сети; при офлайне — отдаём копию из кэша Service Worker
  function fetchText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).catch(function () {
      if (!("caches" in window)) throw new Error("offline");
      return caches.match(url).then(function (resp) {
        if (!resp) throw new Error("offline-miss");
        return resp.text();
      });
    });
  }

  // Проверка индекса: битые записи отбрасываются с предупреждением
  function validateIndex(data) {
    var result = { version: 0, updated: null, drugs: [] };
    if (!data || typeof data !== "object") return result;
    result.version = typeof data.version === "number" ? data.version : 0;
    result.updated = typeof data.updated === "string" ? data.updated : null;
    if (!Array.isArray(data.drugs)) return result;

    data.drugs.forEach(function (d) {
      if (!d || typeof d.id !== "string" || !d.id) {
        console.warn("drugsDB: пропущена запись без id", d);
        return;
      }
      if (typeof d.title !== "string" || !d.title) {
        console.warn("drugsDB: пропущена запись без title:", d.id);
        return;
      }
      result.drugs.push({
        id: d.id,
        title: d.title,
        group: typeof d.group === "string" ? d.group : "",
        atc: typeof d.atc === "string" ? d.atc : "",
        form: typeof d.form === "string" ? d.form : "",
        tags: Array.isArray(d.tags) ? d.tags : [],
        aliases: Array.isArray(d.aliases) ? d.aliases : [],
        hasPatient: d.hasPatient === true,
        updated: typeof d.updated === "string" ? d.updated : ""
      });
    });

    return result;
  }

  // Загрузка индекса (результат кэшируется в памяти страницы)
  function loadIndex(force) {
    if (indexCache && !force) return Promise.resolve(indexCache);
    if (indexPromise && !force) return indexPromise;

    indexPromise = fetchText(baseUrl() + "drugs-index.json")
      .then(function (text) {
        var data;
        try { data = JSON.parse(text); }
        catch (e) { throw new Error("некорректный JSON индекса"); }
        indexCache = validateIndex(data);
        return indexCache;
      })
      .catch(function (err) {
        console.warn("drugsDB: индекс не загружен:", err && err.message);
        indexCache = { version: 0, updated: null, drugs: [] };
        return indexCache;
      });

    return indexPromise;
  }

  function list() {
    return loadIndex().then(function (idx) { return idx.drugs; });
  }

  function get(id) {
    return loadIndex().then(function (idx) {
      for (var i = 0; i < idx.drugs.length; i++) {
        if (idx.drugs[i].id === id) return idx.drugs[i];
      }
      return null;
    });
  }

  // Поиск: название + синонимы + фармгруппа
  function search(query) {
    var q = (query || "").trim().toLowerCase();
    return list().then(function (drugs) {
      if (!q) return drugs;
      return drugs.filter(function (d) {
        if (d.title.toLowerCase().indexOf(q) !== -1) return true;
        if (d.group && d.group.toLowerCase().indexOf(q) !== -1) return true;
        for (var i = 0; i < d.aliases.length; i++) {
          if (d.aliases[i].toLowerCase().indexOf(q) !== -1) return true;
        }
        return false;
      });
    });
  }

  // Загрузка Markdown-инструкции: kind = "specialist" | "patient"
  function loadInstruction(id, kind) {
    var suffix = kind === "patient" ? "-patient.md" : ".md";
    var url = baseUrl() + "drugs/" + encodeURIComponent(id) + suffix;

    if (mdCache[url]) return Promise.resolve(mdCache[url]);

    return fetchText(url).then(function (text) {
      mdCache[url] = text;
      return text;
    }).catch(function () {
      return null; // файла нет или офлайн без копии
    });
  }

  // Сброс кэшей (после обновления базы без перезагрузки)
  function invalidate() {
    indexCache = null;
    indexPromise = null;
    mdCache = {};
  }

  window.SMP = window.SMP || {};
  window.SMP.drugsDB = {
    loadIndex: loadIndex,
    list: list,
    get: get,
    search: search,
    loadInstruction: loadInstruction,
    invalidate: invalidate
  };
})();