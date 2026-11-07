(function () {
  "use strict";

  // ===== Парсер Markdown → HTML (с поддержкой многоуровневых списков) =====

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function inlineFormat(line) {
    line = escapeHtml(line);
    line = line.replace(/`([^`]+)`/g, "<code>$1</code>");
    line = line.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img class="drug-img" src="$2" alt="$1">');
    line = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    line = line.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" aria-label="$1 (откроется в новой вкладке)">$1 ↗</a>');
    line = line.replace(/&lt;(\/?(?:br|sup|sub)\s*\/?)&gt;/gi, "<$1>");
    return line;
  }

  function parseMarkdown(md) {
    var lines = md.split(/\r?\n/);
    var html = "";
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (line.trim() === "") { i++; continue; }

      if (/^---+\s*$/.test(line)) {
        html += "<hr>";
        i++;
        continue;
      }

      if (/^```/.test(line.trim())) {
        var codeLines = [];
        i++;
        while (i < lines.length && lines[i].trim().indexOf("```") !== 0) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; 
        html += '<pre class="drug-pre"><code>' + escapeHtml(codeLines.join("\n")) + "</code></pre>";
        continue;
      }

      var hMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        var level = hMatch[1].length;
        html += "<h" + level + ">" + inlineFormat(hMatch[2]) + "</h" + level + ">";
        i++;
        continue;
      }

      if (/^\s*⚠️/.test(line) || /^\s*\*\*ВАЖНО:?\*\*/i.test(line)) {
        var alertLines = [line];
        i++;
        while (i < lines.length && lines[i].trim() !== "" && !/^(#|\s*[-•*]|\s*\d+\.\s|>\s|---|\|.*\||```)/.test(lines[i])) {
          alertLines.push(lines[i]);
          i++;
        }
        html += '<div class="drug-alert">' + alertLines.map(inlineFormat).join("<br>") + "</div>";
        continue;
      }

      if (/^>\s?/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        html += "<blockquote>" + quoteLines.map(inlineFormat).join("<br>") + "</blockquote>";
        continue;
      }

      // ===== УЛУЧШЕННАЯ ОБРАБОТКА СПИСКОВ (поддержка вложенности) =====
      if (/^\s*[-•*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        var listHtml = "";
        var stack = []; // Стек для отслеживания глубины и типа списка: { depth: Number, type: 'ul' | 'ol' }

        while (i < lines.length) {
          var currentLine = lines[i];
          var ulMatch = currentLine.match(/^(\s*)([-•*])\s+(.*)$/);
          var olMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);

          if (!ulMatch && !olMatch) break; // Конец списка

          var match = ulMatch || olMatch;
          var indent = match[1].length;
          var depth = Math.floor(indent / 4) + 1; // 0 пробелов = глубина 1, 4 пробела = глубина 2 и т.д.
          var type = olMatch ? 'ol' : 'ul';
          var text = match[3];

          // 1. Закрываем списки, если текущая глубина меньше или равна глубине в стеке (поднимаемся наверх)
          while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            var popped = stack.pop();
            listHtml += "</li></" + popped.type + ">";
          }

          // 2. Открываем новые списки, если углубляемся
          if (stack.length === 0 || stack[stack.length - 1].depth < depth) {
            while (stack.length < depth) {
              listHtml += "<" + type + ">";
              stack.push({ depth: stack.length + 1, type: type });
            }
          } else if (stack.length > 0 && stack[stack.length - 1].type !== type) {
            // Смена типа списка на той же глубине (редко, но бывает)
            var poppedType = stack.pop();
            listHtml += "</li></" + poppedType.type + ">";
            listHtml += "<" + type + ">";
            stack.push({ depth: depth, type: type });
          }

          // 3. Добавляем элемент списка (не закрываем </li> сразу, чтобы вложенный список попал внутрь него)
          listHtml += "<li>" + inlineFormat(text);
          i++;
        }

        // 4. Завершение блока списка: закрываем последний <li> и все оставшиеся открытые теги
        if (stack.length > 0) {
          listHtml += "</li>";
        }
        while (stack.length > 0) {
          listHtml += "</" + stack.pop().type + ">";
        }

        html += listHtml;
        continue;
      }
      // ===== КОНЕЦ УЛУЧШЕННОЙ ОБРАБОТКИ СПИСКОВ =====

      // Таблица
      if (/\|.*\|/.test(line) && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
        var headerCells = line.split("|").map(function (c) { return c.trim(); }).filter(Boolean);
        i += 2; 
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
            var cellHtml = inlineFormat(c);
            html += '<td data-label="' + escapeHtml(label) + '">' + cellHtml + "</td>";
          });
          html += "</tr>";
        });
        html += "</tbody></table>";
        continue;
      }

      // Обычный абзац (обновлено регулярное выражение, чтобы не ломаться на пробелах перед списком)
      var paraLines = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^(#|\s*[-•*]|\s*\d+\.\s|>\s|---|\|.*\||```)/.test(lines[i])) {
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