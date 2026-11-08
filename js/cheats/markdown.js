(function () {
  "use strict";

  // ===== Парсер Markdown → HTML (минимальный, для инструкций) =====

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Инлайн-форматирование: **жирный**, *курсив*, `код`, [ссылка](url), ![картинка](адрес)
  function inlineFormat(line) {
    // Экранируем HTML
    line = escapeHtml(line);

    // Код
    line = line.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Картинки ![альт](адрес) — до ссылок, иначе синтаксис совпадает
    line = line.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img class="drug-img" src="$2" alt="$1">');

    // Жирный (до курсива!)
    line = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Курсив
    line = line.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

    // Ссылки
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" aria-label="$1 (откроется в новой вкладке)">$1 ↗</a>');

    // Разрешаем безопасные HTML-теги: <br>, <sup>, <sub> (восстанавливаем после экранирования)
    line = line.replace(/&lt;(\/?(?:br|sup|sub)\s*\/?)&gt;/gi, "<$1>");

    return line;
  }

  // ===== Списки с вложенностью =====
  // Вложенность определяется отступом: подпункты сдвигаются на 2+ пробела
  // и попадают внутрь родительского пункта (как на GitHub).

  // Распознаёт маркер пункта: "- текст", "• текст", "1. текст", "1) текст"
  // (с любым отступом). Возвращает { indent, ordered, rest } или null.
  function listMarker(line) {
    var m = line.match(/^(\s*)([-•]|\d+[.)])\s+(.*)$/);
    if (!m) return null;
    return { indent: m[1].length, ordered: /\d/.test(m[2]), rest: m[3] };
  }

  // Парсит список, начиная со строки i (первый маркер — на отступе indent).
  // Возвращает { html, next } — next: индекс первой строки после списка.
  function parseListAt(lines, i, indent) {
    var first = listMarker(lines[i]);
    if (!first) return { html: "", next: i };

    var ordered = first.ordered;
    var html = ordered ? "<ol>" : "<ul>";

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

      // Строка без маркера: перенос текста внутри последнего пункта
      if (!mk) {
        if (/^\s+\S/.test(line)) {
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
             !listMarker(lines[i]) && /^\s+\S/.test(lines[i])) {
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

  function parseMarkdown(input) {
    // Принимаем либо строку, либо уже готовый массив строк (для оптимизации скорости)
    var lines = Array.isArray(input) ? input : input.split(/\r?\n/);
    var html = "";
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      // Пустая строка
      if (line.trim() === "") { i++; continue; }

      // Горизонтальная линия
      if (/^---+\s*$/.test(line)) {
        html += "<hr>";
        i++;
        continue;
      }

      // Блок кода ``` (схемы, примеры расчётов)
      if (/^```/.test(line.trim())) {
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

      // Заголовки
      var hMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        var level = hMatch[1].length;
        html += "<h" + level + ">" + inlineFormat(hMatch[2]) + "</h" + level + ">";
        i++;
        continue;
      }

      // Блок предупреждения: начинается с ⚠️ или **ВАЖНО:**
      if (/^\s*⚠️/.test(line) || /^\s*\*\*ВАЖНО:?\*\*/i.test(line)) {
        var alertLines = [line];
        i++;
        while (i < lines.length && lines[i].trim() !== "" && !/^(#|-|\d+\.)\s/.test(lines[i])) {
          alertLines.push(lines[i]);
          i++;
        }
        html += '<div class="drug-alert">' + alertLines.map(inlineFormat).join("<br>") + "</div>";
        continue;
      }

      // Цитата
      if (/^>\s?/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
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
      if (/\|.*\|/.test(line) && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
        var headerCells = line.split("|").map(function (c) { return c.trim(); }).filter(Boolean);
        i += 2; // пропускаем шапку и разделитель
        var rows = [];
        while (i < lines.length && /\|.*\|/.test(lines[i]) && lines[i].trim() !== "") {
          var cells = lines[i].split("|").map(function (c) { return c.trim(); }).filter(Boolean);
          rows.push(cells);
          i++;
        }
        html += '<table><thead><tr>';
        headerCells.forEach(function (c) { html += "<th>" + inlineFormat(c) + "</th>"; });
        html += '</tr></thead><tbody>';
        rows.forEach(function (row) {
          html += "<tr>";
          row.forEach(function (c, idx) {
            var label = headerCells[idx] || "";
            // 1. Применяем стандартное форматирование (оно экранирует HTML)
            var cellHtml = inlineFormat(c);
            
            html += '<td data-label="' + escapeHtml(label) + '">' + cellHtml + "</td>";
          });
          html += "</tr>";
        });
        html += "</tbody></table>";
        continue;
      }

      // Обычный абзац (собираем подряд идущие непустые строки;
      // абзац прерывается и строками вложенных пунктов списка)
      var paraLines = [];
      while (i < lines.length && lines[i].trim() !== "" &&
             !/^(#|[-•]|\d+\.\s|>\s|---|\|.*\||```)/.test(lines[i]) &&
             !listMarker(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length) {
        html += "<p>" + inlineFormat(paraLines.join(" ")) + "</p>";
      }
    }

    return html;
  }

  window.SMP = window.SMP || {};
  window.SMP.markdown = { parse: parseMarkdown };
})();
