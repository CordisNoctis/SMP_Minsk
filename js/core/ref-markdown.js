/* ===== Рендер markdown-справок в модальном окне ===== */
(function () {
  "use strict";
  window.SMP = window.SMP || {};

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function inline(s) {
    // Если строка уже содержит HTML-теги, не экранируем их
    if (s.indexOf('<') !== -1 && s.indexOf('>') !== -1) {
      // Обрабатываем только markdown-разметку, оставляя HTML как есть
      return s
        .replace(/`([^`]+)`/g, '<code class="ref-md-code">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    }
    
    return s
      .replace(/`([^`]+)`/g, '<code class="ref-md-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function splitRow(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
  }

  function isSepLine(line) {
    return /^\|?[\s:-]+\|/.test(line.trim());
  }

  function parseTable(lines, i) {
    var header = splitRow(lines[i]);
    var rows = [];
    var j = i + 2;
    while (j < lines.length && lines[j].trim().indexOf("|") === 0) {
      rows.push(splitRow(lines[j]));
      j++;
    }
    var html = '<div class="ref-md-table-wrap"><table class="ref-md-table"><thead><tr>';
    header.forEach(function (c) { html += "<th>" + inline(escapeHtml(c)) + "</th>"; });
    html += "</tr></thead><tbody>";
    rows.forEach(function (r) {
      html += "<tr>";
      r.forEach(function (c) { html += "<td>" + inline(escapeHtml(c)) + "</td>"; });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    return { html: html, next: j };
  }

  function toHtml(md) {
    // Удаляем теги цитат <cite-badge ...></cite-badge>
    md = md.replace(/<\/?cite-badge[^>]*>/g, "");

    var lines = md.split(/\r?\n/);
    var out = [];
    var i = 0;
    var inList = null;

    function closeList() {
      if (inList) { out.push("</" + inList + ">"); inList = null; }
    }

    while (i < lines.length) {
      var line = lines[i].trim();

      if (!line) { closeList(); i++; continue; }

      // ===== Блоки кода ``` =====
      if (line.indexOf("```") === 0) {
        closeList();
        var code = [];
        i++;
        while (i < lines.length && lines[i].trim().indexOf("```") !== 0) {
          code.push(lines[i]);
          i++;
        }
        i++; // пропускаем закрывающую ```
        out.push('<pre class="ref-md-pre"><code>' + escapeHtml(code.join("\n")) + '</code></pre>');
        continue;
      }

      if (/^-{3,}$/.test(line)) { closeList(); out.push('<hr class="ref-md-hr">'); i++; continue; }

      var h = line.match(/^(#{2,4})\s+(.*)$/);
      if (h) {
        closeList();
        var lvl = h[1].length;
        out.push('<h' + lvl + ' class="ref-md-h' + lvl + '">' + inline(escapeHtml(h[2])) + "</h" + lvl + ">");
        i++; continue;
      }

      if (line.indexOf("|") === 0 && i + 1 < lines.length && isSepLine(lines[i + 1])) {
        closeList();
        var t = parseTable(lines, i);
        out.push(t.html);
        i = t.next; continue;
      }

      if (line.indexOf(">") === 0) {
        closeList();
        var quote = [];
        while (i < lines.length && lines[i].trim().indexOf(">") === 0) {
          quote.push(lines[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        out.push('<blockquote class="ref-md-quote">' + inline(escapeHtml(quote.join(" "))) + "</blockquote>");
        continue;
      }

      var ul = line.match(/^[-*]\s+(.*)$/);
      var ol = line.match(/^\d+\.\s+(.*)$/);
      if (ul || ol) {
        var type = ul ? "ul" : "ol";
        if (inList !== type) { closeList(); out.push('<' + type + ' class="ref-md-list">'); inList = type; }
        out.push("<li>" + inline(escapeHtml((ul || ol)[1])) + "</li>");
        i++; continue;
      }

      closeList();
      var para = [line];
      i++;
      while (i < lines.length) {
        var nl = lines[i].trim();
        if (!nl || nl.indexOf("```") === 0 || /^[-*]\s/.test(nl) || /^\d+\.\s/.test(nl) || nl.indexOf("|") === 0 || nl.indexOf(">") === 0 || /^#{2,4}\s/.test(nl) || /^-{3,}$/.test(nl)) break;
        para.push(nl);
        i++;
      }
      out.push("<p>" + inline(para.join(" ")) + "</p>");
    }
    closeList();
    return out.join("");
  }

  function openRefMarkdownModal(opts) {
    opts = opts || {};
    var old = document.getElementById("refMarkdownModal");
    if (old) old.remove();

    var lines = (opts.markdown || "").split(/\r?\n/);
    var title = opts.title || "";
    if (!title) {
      for (var k = 0; k < lines.length; k++) {
        var m = lines[k].trim().match(/^##\s+(.*)$/);
        if (m) { title = m[1]; lines.splice(k, 1); break; }
      }
    }

    var modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "refMarkdownModal";
    modal.innerHTML =
      '<div class="modal-backdrop"></div>' +
      '<section class="modal-panel" role="dialog" aria-modal="true">' +
        '<header class="modal-header">' +
          '<h2>ℹ️ ' + escapeHtml(title) + '</h2>' +
          '<button type="button" class="modal-close" aria-label="Закрыть">✕</button>' +
        '</header>' +
        '<div class="modal-body ref-md">' + toHtml(lines.join("\n")) + '</div>' +
      '</section>';
    document.body.appendChild(modal);

    modal.removeAttribute("hidden");
    modal.classList.add("open");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    function close() {
      modal.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    modal.querySelector(".modal-backdrop").addEventListener("click", close);
    modal.querySelector(".modal-close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  window.SMP.refMarkdown = { toHtml: toHtml };
  window.SMP.openRefMarkdownModal = openRefMarkdownModal;
})();