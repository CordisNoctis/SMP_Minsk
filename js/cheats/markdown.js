(function () {
  "use strict";

  // ===== Парсер Markdown → HTML (минимальный, для инструкций) =====
  // Стандарт ES5: var, function, без внешних зависимостей.

  // Управляющие символы C0 (кроме \t, \n, \r) вырезаются из входа:
  // защита от коллизий плейсхолдеров stash и от подмены фрагментов.
  var CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

  // Внутренний токен для экранированной вертикальной черты в таблицах.
  // \u0001 вырезается из входа CONTROL_RE, поэтому подделать его нельзя.
  var PIPE_TOKEN = "\u0001";

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fromCode(cp) {
    if (!Number.isFinite(cp) || cp < 0 || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) return "";
    if (cp <= 0xFFFF) return String.fromCharCode(cp);
    cp -= 0x10000;
    return String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
  }

  var NAMED_ENTITIES = {
    amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'",
    nbsp: "\u00A0", tab: "\t", newline: "\n",
    colon: ":", sol: "/", bsol: "\\", lowbar: "_", verbar: "|",
    lpar: "(", rpar: ")", period: ".", excl: "!", quest: "?",
    num: "#", ast: "*", plus: "+", comma: ",", hyphen: "-",
    equals: "=", grave: "`", circ: "^", tilde: "~", semi: ";"
  };

  // Декодирование HTML-сущностей (числовых и именованных) для проверки URL.
  // Несколько проходов — чтобы ловить двойное кодирование (&amp;#106; и т.п.).
  function decodeEntities(s) {
    var out = String(s);
    for (var pass = 0; pass < 3; pass++) {
      var prev = out;
      out = out
        .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return fromCode(Number.parseInt(h, 16)); })
        .replace(/&#(\d+);/g, function (m, d) { return fromCode(Number.parseInt(d, 10)); })
        .replace(/&(amp|lt|gt|quot|apos|nbsp|tab|newline|colon|sol|bsol|lowbar|verbar|lpar|rpar|period|excl|quest|num|ast|plus|comma|hyphen|equals|grave|circ|tilde|semi);/gi,
          function (m, name) { return NAMED_ENTITIES[name.toLowerCase()]; });
      if (out === prev) break;
    }
    return out;
  }

  // Символы, которые браузеры игнорируют/обрезают в URL либо которые
  // используются для обхода наивных проверок: пробелы, табы, переводы строк,
  // C0/C1-управляющие, zero-width, BOM, неразрывные пробелы.
  var URL_STRIP_RE = /[\u0000-\u0020\u007F-\u009F\u00AD\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF]/g;

  // Строгий белый список: http://, https://, относительные пути и якоря #.
  // Всё остальное (javascript:, data:, vbscript:, file:, blob:, mailto:,
  // протокол-относительные //host и любые иные схемы) отклоняется.
  function sanitizeUrl(url) {
    var clean = decodeEntities(url).replace(URL_STRIP_RE, "").replace(/\\/g, "/");
    if (clean === "") return "#";
    var lower = clean.toLowerCase();

    if (/^https?:\/\//.test(lower)) return escapeHtml(clean);
    if (clean.charAt(0) === "#") return escapeHtml(clean);
    if (clean.charAt(0) === "/" && clean.charAt(1) !== "/") return escapeHtml(clean);
    if (clean.indexOf("//") === 0) return "#";
    if (/^[a-z][a-z0-9+.-]*:/.test(lower)) return "#";

    // Относительный путь без схемы: img/x.svg, ./x, ../x, file.svg
    return escapeHtml(clean);
  }

  // Жирный/курсив поверх уже экранированной строки.
  // Курсив не срабатывает, если после открывающей * или перед закрывающей *
  // стоит пробел: выражения вида 2 * 5 * 10 остаются текстом.
  function emphasis(s) {
    s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*(?!\s)([^*]*[^\s*])\*/g, "$1<em>$2</em>");
    return s;
  }

  // Инлайн-форматирование: **жирный**, *курсив*, `код`, [ссылка](url),
  // ![картинка](адрес), голые URL, экранированные символы.
  function inlineFormat(line) {
    line = escapeHtml(line);

    // Плейсхолдеры для сохранения обработанных фрагментов.
    // Используется \uE000 (Private Use Area) — гарантированно не встретится
    // в обычном тексте и не будет вырезан CONTROL_RE.
    var stash = [];
    function keep(html) {
      stash.push(html);
      return "___STASH_" + (stash.length - 1) + "___";
    }

    // Экранированные обратная кавычка и бэкслэш — до разбора кода,
    // чтобы \` не открывал код-спан.
    line = line.replace(/\\([`\\])/g, function (m, ch) { return keep(escapeHtml(ch)); });

    // Код в обратных кавычках (ссылки внутри не создаём)
    line = line.replace(/`([^`]+)`/g, function (m, c) {
      return keep("<code>" + c + "</code>");
    });

    // Прочие экранированные символы Markdown — literal, без форматирования
    line = line.replace(/\\([*_[\]()#+\-.!|~>])/g, function (m, ch) { return keep(escapeHtml(ch)); });

    // Картинки ![альт](адрес) — до ссылок, иначе синтаксис совпадает
    line = line.replace(/!\[([^[\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
      return keep('<img class="drug-img" src="' + sanitizeUrl(url) + '" alt="' + alt + '">');
    });

    // Markdown-ссылки [текст](url)
    line = line.replace(/\[([^[\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
      return keep('<a href="' + sanitizeUrl(url) + '" target="_blank" rel="noopener" aria-label="' +
        text + ' (откроется в новой вкладке)">' + emphasis(text) + "</a>");
    });

    // Голые URL: https://..., http://..., www....
    line = line.replace(/(^|[\s(«»:,;])((?:https?:\/\/|www\.)[^\s<>()\[\]{}]+[^\s<>().,;:!?])/g, function (m, pre, url) {
      var href = url.indexOf("www.") === 0 ? "https://" + url : url;
      return pre + keep('<a href="' + sanitizeUrl(href) + '" target="_blank" rel="noopener">' + url + "</a>");
    });

    // Жирный и курсив
    line = emphasis(line);

    // Разрешаем безопасные HTML-теги: <br>, <sup>, <sub> (без атрибутов)
    line = line.replace(/&lt;(\/?(?:br|sup|sub)\s*\/?)&gt;/gi, "<$1>");

    // Возвращаем сохранённые фрагменты (код, картинки, ссылки)
    line = line.replace(/___STASH_(\d+)___/g, function (m, i) {
      var v = stash[+i];
      return v === undefined ? "" : v;
    });

    return line;
  }

  // ===== Списки с вложенностью =====

  // Распознаёт маркер пункта: "- текст", "• текст", "1. текст", "1) текст".
  // Возвращает { indent, ordered, num, rest } или null.
  function listMarker(line) {
    var m = line.match(/^(\s*)([-•]|\d+[.)])\s+(.*)$/);
    if (!m) return null;
    return {
      indent: m[1].length,
      ordered: /\d/.test(m[2]),
      num: Number.parseInt(m[2], 10) || 1,
      rest: m[3]
    };
  }

  function isTableSeparator(line) {
    return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line) && line.indexOf("-") !== -1;
  }

  function isTableStart(lines, i) {
    return lines[i].trim() !== "" &&
      lines[i].indexOf("|") !== -1 &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1]);
  }

  // Любой блочный элемент: заголовок, цитата, код, разделитель,
  // предупреждение, список, таблица. Используется для завершения
  // абзацев, переносов списка и блока drug-alert.
  function isBlockStart(lines, i) {
    var line = lines[i];
    if (/^\s*#{1,6}\s/.test(line)) return true;
    if (/^\s*>/.test(line)) return true;
    if (/^\s*```/.test(line)) return true;
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return true;
    if (/^\s*⚠️/.test(line) || /^\s*\*\*ВАЖНО:?\*\*/i.test(line)) return true;
    if (listMarker(line)) return true;
    if (isTableStart(lines, i)) return true;
    return false;
  }

  // Парсит список, начиная со строки i (первый маркер — на отступе indent).
  // Возвращает { html, next } — next: индекс первой строки после списка.
  function parseListAt(lines, i, indent) {
    var first = listMarker(lines[i]);
    if (!first) return { html: "", next: i };

    var ordered = first.ordered;
    var html = ordered
      ? (first.num > 1 ? '<ol start="' + first.num + '">' : "<ol>")
      : "<ul>";

    while (i < lines.length) {
      var line = lines[i];

      // Пустая строка: продолжаем, если дальше идёт пункт этого или
      // более глубокого уровня; иначе список завершён
      if (line.trim() === "") {
        var peek = i + 1 < lines.length ? listMarker(lines[i + 1]) : null;
        if (peek && peek.indent >= indent) { i++; continue; }
        break;
      }

      var mk = listMarker(line);

      // Строка без маркера: перенос текста внутри последнего пункта,
      // но не блочный элемент (цитата, код, таблица, заголовок и т.д.)
      if (!mk) {
        if (/^\s+\S/.test(line) && !isBlockStart(lines, i)) {
          var cont = " " + inlineFormat(line.trim());
          if (html.slice(-5) === "</li>") {
            html = html.slice(0, -5) + cont + "</li>";
          } else {
            html += cont;
          }
          i++;
          continue;
        }
        break;
      }

      // Маркер меньшего отступа — текущий уровень завершён
      if (mk.indent < indent) break;
      // Смена типа списка на том же уровне (нумерованный среди маркированного)
      if (mk.indent === indent && mk.ordered !== ordered) break;

      if (mk.indent > indent) {
        // Вложенный список — вставляем внутрь предыдущего <li>
        var sub = parseListAt(lines, i, mk.indent);
        if (html.slice(-5) === "</li>") {
          html = html.slice(0, -5) + sub.html + "</li>";
        } else {
          html += sub.html;
        }
        i = sub.next;
        continue;
      }

      // Пункт текущего уровня
      i++;
      var item = inlineFormat(mk.rest);

      // Переносы текста внутри пункта (непустые строки с отступом, без маркера)
      while (i < lines.length && lines[i].trim() !== "" &&
             !listMarker(lines[i]) && !isBlockStart(lines, i) && /^\s+\S/.test(lines[i])) {
        item += " " + inlineFormat(lines[i].trim());
        i++;
      }

      // Вложенный список сразу после этого пункта
      var nested = i < lines.length ? listMarker(lines[i]) : null;
      if (nested && nested.indent > indent) {
        var sub2 = parseListAt(lines, i, nested.indent);
        item += sub2.html;
        i = sub2.next;
      }

      html += "<li>" + item + "</li>";
    }

    return { html: html + (ordered ? "</ol>" : "</ul>"), next: i };
  }

  // Разбиение строки таблицы на ячейки с учётом экранированной черты \|
  function splitRow(line) {
    var cells = line.replace(/\\\|/g, PIPE_TOKEN).split("|");
    if (cells[0] === "") cells.shift();
    if (cells.length && cells[cells.length - 1] === "") cells.pop();
    var pipeRe = new RegExp(PIPE_TOKEN, "g");
    return cells.map(function (c) {
      return c.replace(pipeRe, "|").trim();
    });
  }

  function cellAlign(sep) {
    var s = sep.trim();
    var left = s.charAt(0) === ":";
    var right = s.charAt(s.length - 1) === ":";
    if (left && right) return "center";
    if (right) return "right";
    return "";
  }

  function parseMarkdown(input) {
    // Принимаем либо строку, либо уже готовый массив строк.
    // Вход очищается от нулевых байтов и прочих управляющих символов.
    var lines;
    if (Array.isArray(input)) {
      lines = input.map(function (l) { return String(l).replace(CONTROL_RE, ""); });
    } else {
      lines = String(input).replace(/\r\n?/g, "\n").replace(CONTROL_RE, "").split("\n");
    }

    var html = "";
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      // Пустая строка
      if (line.trim() === "") { i++; continue; }

      // Горизонтальная линия: ---, ***, ___
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        html += "<hr>";
        i++;
        continue;
      }

      // Блок кода ``` (схемы, примеры расчётов)
      if (/^\s*```/.test(line)) {
        var codeLines = [];
        i++;
        while (i < lines.length && lines[i].trim().indexOf("```") !== 0) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // закрывающая ```
        html += '<pre class="drug-pre"><code>' + escapeHtml(codeLines.join("\n")) + "</code></pre>";
        continue;
      }

      // Заголовки (с необязательной закрывающей последовательностью #)
      var hMatch = line.match(/^\s*#{1,6}\s+(.*)$/);
      if (hMatch) {
        var level = line.match(/^\s*(#{1,6})/)[1].length;
        var hText = hMatch[1].replace(/\s+#+\s*$/, "");
        html += "<h" + level + ">" + inlineFormat(hText) + "</h" + level + ">";
        i++;
        continue;
      }

      // Блок предупреждения: начинается с ⚠️ или **ВАЖНО:**
      // Завершается перед ЛЮБЫМ блочным элементом (цитата, код, таблица,
      // разделитель, заголовок, список, новое предупреждение) или пустой строкой.
      if (/^\s*⚠️/.test(line) || /^\s*\*\*ВАЖНО:?\*\*/i.test(line)) {
        var alertLines = [line];
        i++;
        while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines, i)) {
          alertLines.push(lines[i]);
          i++;
        }
        html += '<div class="drug-alert">' + alertLines.map(inlineFormat).join("<br>") + "</div>";
        continue;
      }

      // Цитата
      if (/^\s*>/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        html += "<blockquote>" + quoteLines.map(inlineFormat).join("<br>") + "</blockquote>";
        continue;
      }

      // Списки: маркированные и нумерованные, с вложенностью по отступу
      var listMk = listMarker(line);
      if (listMk) {
        var parsedList = parseListAt(lines, i, listMk.indent);
        html += parsedList.html;
        i = parsedList.next;
        continue;
      }

      // Таблица
      if (isTableStart(lines, i)) {
        var headerCells = splitRow(line);
        var aligns = splitRow(lines[i + 1]).map(cellAlign);
        i += 2; // пропускаем шапку и разделитель

        var rows = [];
        while (i < lines.length && lines[i].trim() !== "" && lines[i].indexOf("|") !== -1) {
          rows.push(splitRow(lines[i]));
          i++;
        }

        html += "<table><thead><tr>";
        headerCells.forEach(function (c, idx) {
          var al = aligns[idx] || "";
          html += "<th" + (al ? ' style="text-align:' + al + '"' : "") + ">" + inlineFormat(c) + "</th>";
        });
        html += "</tr></thead><tbody>";
        rows.forEach(function (row) {
          html += "<tr>";
          for (var idx = 0; idx < headerCells.length; idx++) {
            var cell = idx < row.length ? row[idx] : "";
            var label = headerCells[idx] || "";
            var al2 = aligns[idx] || "";
            html += '<td data-label="' + escapeHtml(label) + '"' +
              (al2 ? ' style="text-align:' + al2 + '"' : "") + ">" +
              inlineFormat(cell) + "</td>";
          }
          html += "</tr>";
        });
        html += "</tbody></table>";
        continue;
      }

      // Обычный абзац: собираем подряд идущие непустые строки,
      // абзац прерывается любым блочным элементом
      var paraLines = [];
      while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines, i)) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length) {
        html += "<p>" + inlineFormat(paraLines.join(" ")) + "</p>";
      } else {
        // Защита от бесконечного цикла, если строка не распознана ни одним блоком
        html += "<p>" + inlineFormat(lines[i]) + "</p>";
        i++;
      }
    }

    return html;
  }

  window.SMP = window.SMP || {};
  window.SMP.markdown = { parse: parseMarkdown };
})();