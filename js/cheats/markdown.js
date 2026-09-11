(function () {
  "use strict";

  // ===== Парсер Markdown → HTML (минимальный, для инструкций) =====

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Инлайн-форматирование: **жирный**, *курсив*, `код`, [ссылка](url)
  function inlineFormat(line) {
    // Экранируем HTML
    line = escapeHtml(line);

    // Код
    line = line.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Жирный (до курсива!)
    line = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Курсив
    line = line.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

    // Ссылки
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" aria-label="$1 (откроется в новой вкладке)">$1 ↗</a>');

    return line;
  }

  function parseMarkdown(md) {
    var lines = md.split(/\r?\n/);
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

      // Маркированный список
      if (/^[-•]\s+/.test(line)) {
        html += "<ul>";
        while (i < lines.length && /^[-•]\s+/.test(lines[i])) {
          html += "<li>" + inlineFormat(lines[i].replace(/^[-•]\s+/, "")) + "</li>";
          i++;
        }
        html += "</ul>";
        continue;
      }

      // Нумерованный список
      if (/^\d+\.\s+/.test(line)) {
        html += "<ol>";
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          html += "<li>" + inlineFormat(lines[i].replace(/^\d+\.\s+/, "")) + "</li>";
          i++;
        }
        html += "</ol>";
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
            html += '<td data-label="' + escapeHtml(label) + '">' + inlineFormat(c) + "</td>";
          });
          html += "</tr>";
        });
        html += "</tbody></table>";
        continue;
      }

      // Обычный абзац (собираем подряд идущие непустые строки)
      var paraLines = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^(#|[-•]|\d+\.\s|>\s|---|\|.*\|)/.test(lines[i])) {
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