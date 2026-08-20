// Справочник средств и лекарств.
// type: "оборудование" | "ЛС" | "расходник" | "иное"
// unit: единица измерения (амп, шт, фл, уп и т.д.)
window.MEDICAL_CATALOG = [
  // ===== Примеры (замените реальными данными) =====
  { id: "tonometr",     name: "Тонометр механический",        type: "оборудование", unit: "шт" },
  { id: "fonendoskop",  name: "Фонендоскоп",                  type: "оборудование", unit: "шт" },
  { id: "kislorod-ball",name: "Баллон кислородный",           type: "оборудование", unit: "шт" },
  { id: "adrenalin",    name: "Адреналин 0,1% (эпинефрин)",   type: "ЛС", unit: "амп" },
  { id: "natrii-hlorid",name: "Натрия хлорид 0,9%",           type: "ЛС", unit: "фл" },
  { id: "bint",         name: "Бинт стерильный",              type: "расходник", unit: "шт" },
  { id: "shpric-10",    name: "Шприц 10 мл",                  type: "расходник", unit: "шт" }
  // Добавляйте сюда все средства и лекарства, которые используются в табелях.
];

// Вспомогательная функция: получить позицию справочника по id
window.getCatalogItem = function (id) {
  for (var i = 0; i < window.MEDICAL_CATALOG.length; i++) {
    if (window.MEDICAL_CATALOG[i].id === id) return window.MEDICAL_CATALOG[i];
  }
  return null;
};