(function () {
  "use strict";

  window.SMP = window.SMP || {};

  var cache = null;

  function cleanCell(s) {
    return String(s).replace(/\*\*/g, "").replace(/`/g, "").trim();
  }

  function isSeparatorLine(line) {
    return /^\s*\|[\s:\-|]+\|?\s*$/.test(line);
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Убирает дублирующий префикс кода из наименования: "A00 - Холера" → "Холера"
  function cleanName(name, code) {
    var re = new RegExp("^\\s*" + escapeRegExp(code) + "\\s*[-–—:]\\s*");
    var cleaned = name.replace(re, "").trim();
    return cleaned || name.trim();
  }

  function getLevel(code) {
    if (!code) return 0;
    if (/^[A-Z]\d{1,2}\.\d+/.test(code)) return 4;              // A00.1
    if (/^[A-Z]\d{1,2}$/.test(code)) return 3;                 // A00
    if (/^[A-Z]\d{1,2}[-–][A-Z]?\d{1,2}$/.test(code)) return 2; // A00-A09
    return 1;                                                   // I, II, XXI
  }

  function parseMd(mdText) {
    var lines = mdText.split(/\r?\n/);
    var records = [];
    var byCode = {};
    var childrenMap = {};
    var inTable = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // Начало таблицы: первая ячейка = "Код"
      if (!inTable && /^\s*\|/.test(line)) {
        var firstCell = cleanCell(line.split("|")[1] || "");
        if (/^Код$/i.test(firstCell)) {
          inTable = true;
          if (i + 1 < lines.length && isSeparatorLine(lines[i + 1])) i++;
          continue;
        }
      }

      if (!inTable) continue;

      if (line.trim() === "" || line.indexOf("|") === -1) {
        inTable = false;
        continue;
      }
      if (isSeparatorLine(line)) continue;

      var parts = line.split("|");
      var cells = parts.slice(1, parts.length - 1).map(cleanCell);
      if (cells.length === 0) cells = parts.map(cleanCell).filter(Boolean);

      var code = cells[0] || "";
      var name = cells[1] || "";
      var parentCode = cells[2] || "";

      if (!code || /^Код$/i.test(code)) continue;
      if (byCode[code]) continue;

      // ГЛАВНОЕ: самоссылка (I → I) означает корневой класс
      if (parentCode === code) parentCode = "";

      var record = {
        code: code,
        name: cleanName(name, code),
        parentCode: parentCode,
        level: getLevel(code),
        hasChildren: false
      };

      records.push(record);
      byCode[code] = record;

      var parentKey = parentCode || "__ROOT__";
      if (!childrenMap[parentKey]) childrenMap[parentKey] = [];
      childrenMap[parentKey].push(record);
    }

    records.forEach(function (r) {
      r.hasChildren = !!(childrenMap[r.code] && childrenMap[r.code].length);
    });

    // Корни: без родителя + записи, чьего родителя ещё нет в файле
    // (справочник дополняется постепенно — такие показываем как корни)
    var roots = (childrenMap["__ROOT__"] || []).slice();
    records.forEach(function (r) {
      if (r.parentCode && !byCode[r.parentCode] && roots.indexOf(r) === -1) {
        roots.push(r);
      }
    });

    return { records: records, byCode: byCode, childrenMap: childrenMap, roots: roots };
  }

  function buildBreadcrumbs(byCode, code) {
    var crumbs = [];
    var current = byCode[code];
    var seen = {};
    while (current) {
      if (seen[current.code]) break;
      seen[current.code] = true;
      crumbs.unshift({ code: current.code, name: current.name });
      if (!current.parentCode || !byCode[current.parentCode]) break;
      current = byCode[current.parentCode];
    }
    return crumbs;
  }

  window.SMP.mkb10DB = {
    list: function () {
      if (cache) return Promise.resolve(cache);
      return fetch("../js/cheats/md/mkb10.md")
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(function (text) {
          cache = parseMd(text);
          return cache;
        });
    },

    getRoots: function () {
      return this.list().then(function (data) { return data.roots; });
    },

    getChildren: function (parentCode) {
      return this.list().then(function (data) {
        return data.childrenMap[parentCode] || [];
      });
    },

    get: function (code) {
      return this.list().then(function (data) {
        var record = data.byCode[code];
        if (!record) return null;
        return {
          code: record.code,
          name: record.name,
          level: record.level,
          breadcrumbs: buildBreadcrumbs(data.byCode, code)
        };
      });
    },

    search: function (query, limit) {
      limit = limit || 200;
      return this.list().then(function (data) {
        var q = (query || "").trim().toLowerCase();
        if (!q) return [];
        var results = [];
        for (var i = 0; i < data.records.length; i++) {
          var r = data.records[i];
          if ((r.code + " " + r.name).toLowerCase().indexOf(q) !== -1) {
            results.push(r);
            if (results.length >= limit) break;
          }
        }
        return results;
      });
    },

    totalCount: function () {
      return this.list().then(function (data) { return data.records.length; });
    }
  };
})();