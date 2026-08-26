(function () {
  "use strict";

  var STORAGE_KEY = "smp-shift-schedule-v3";

  function showToast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.hidden = false; });
    setTimeout(function () { if (t.parentNode) t.remove(); }, 3000);
  }

  function exportSchedule() {
    var data = localStorage.getItem(STORAGE_KEY) || "{}";
    var blob = new Blob([data], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var dateStr = new Date().toISOString().slice(0, 10);

    a.href = url;
    a.download = "smp-schedule-backup-" + dateStr + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("✅ Файл резервной копии скачан");
  }

  function importSchedule(file) {
    if (!file) return;

    var reader = new FileReader();

    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
          throw new Error("bad format");
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        showToast("✅ График импортирован");
        setTimeout(function () { location.reload(); }, 1200);
      } catch (err) {
        showToast("⚠️ Неверный формат файла резервной копии");
      }
    };

    reader.onerror = function () {
      showToast("⚠️ Не удалось прочитать файл");
    };

    reader.readAsText(file);
  }

  function init() {
    var exportBtn = document.getElementById("exportBackupBtn");
    var importBtn = document.getElementById("importBackupBtn");
    var importInput = document.getElementById("importBackupInput");

    if (exportBtn) {
      exportBtn.addEventListener("click", exportSchedule);
    }

    if (importBtn && importInput) {
      importBtn.addEventListener("click", function () {
        importInput.click();
      });
      importInput.addEventListener("change", function () {
        if (this.files && this.files[0]) importSchedule(this.files[0]);
        this.value = "";
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();