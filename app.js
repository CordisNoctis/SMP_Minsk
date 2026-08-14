const VERSION_URL = "./version.json";
const CONTENT_URL = "./data/content.json";

const statusEl = document.getElementById("status");
const syncBtn = document.getElementById("syncBtn");
const installBtn = document.getElementById("installBtn");
const protocolList = document.getElementById("protocolList");
const searchInput = document.getElementById("search");
const toast = document.getElementById("toast");

let deferredPrompt = null;
let content = null;

init();

async function init() {
  registerServiceWorker();
  bindUI();
  renderContentFromStorage();
  updateOnlineStatus();

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();

    deferredPrompt = event;

    installBtn.hidden = false;
    installBtn.classList.remove("hidden");
  });

  if (navigator.onLine) {
    syncContent(false);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;

        if (!worker) {
          return;
        }

        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showToast(
              "Доступно обновление приложения. Перезапустите приложение или нажмите «Синхронизировать»."
            );
          }
        });
      });
    } catch (error) {
      console.warn("Ошибка Service Worker:", error);
    }
  });
}

function bindUI() {
  syncBtn.addEventListener("click", () => {
    syncContent(true);
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    deferredPrompt = null;

    installBtn.hidden = true;
    installBtn.classList.add("hidden");
  });

  searchInput.addEventListener("input", () => {
    renderProtocols(searchInput.value);
  });
}

function updateOnlineStatus() {
  if (navigator.onLine) {
    statusEl.textContent = "Онлайн";
    statusEl.className = "online";
  } else {
    statusEl.textContent = "Офлайн";
    statusEl.className = "offline";
  }
}

async function syncContent(manual = false) {
  if (!navigator.onLine) {
    if (manual) {
      showToast("Нет сети. Работаем с сохранёнными данными.");
    }
    return;
  }

  try {
    syncBtn.disabled = true;

    const versionResponse = await fetch(VERSION_URL, {
      cache: "no-store"
    });

    const versionData = await versionResponse.json();

    const localVersion = localStorage.getItem("contentVersion");

    if (localVersion !== versionData.data) {
      const contentResponse = await fetch(CONTENT_URL, {
        cache: "no-store"
      });

      const freshContent = await contentResponse.json();

      localStorage.setItem("content", JSON.stringify(freshContent));
      localStorage.setItem("contentVersion", versionData.data);

      content = freshContent;

      renderProtocols(searchInput.value);

      if (manual) {
        showToast("Данные обновлены.");
      }
    } else {
      if (manual) {
        showToast("Данные актуальны.");
      }
    }
  } catch (error) {
    console.warn(error);

    if (manual) {
      showToast("Не удалось обновить данные. Используем офлайн-версию.");
    }
  } finally {
    syncBtn.disabled = false;
  }
}

function renderContentFromStorage() {
  try {
    content = JSON.parse(localStorage.getItem("content") || "null");
  } catch {
    content = null;
  }

  renderProtocols("");
}

function renderProtocols(query = "") {
  const q = query.trim().toLowerCase();

  const items = content?.protocols || [];

  const filtered = items.filter((item) => {
    const title = item.title?.toLowerCase() || "";
    const category = item.category?.toLowerCase() || "";
    const summary = item.summary?.toLowerCase() || "";

    return (
      title.includes(q) ||
      category.includes(q) ||
      summary.includes(q)
    );
  });

  protocolList.innerHTML = "";

  if (!filtered.length) {
    const div = document.createElement("div");
    div.className = "item";

    const p = document.createElement("p");
    p.textContent =
      "Нет данных. Нажмите «Синхронизировать» при наличии интернета.";

    div.appendChild(p);
    protocolList.appendChild(div);

    return;
  }

  for (const item of filtered) {
    const div = document.createElement("div");
    div.className = "item";

    const h3 = document.createElement("h3");
    h3.textContent = item.title || "Без названия";

    const p = document.createElement("p");
    p.textContent = `${item.category || ""} — ${item.summary || ""}`;

    div.appendChild(h3);
    div.appendChild(p);

    protocolList.appendChild(div);
  }
}

function showToast(text) {
  toast.textContent = text;
  toast.hidden = false;

  setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}