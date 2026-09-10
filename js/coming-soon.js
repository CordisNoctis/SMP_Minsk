(function () {
  "use strict";

  var TITLES = {
    "normative-base": "Нормативная база",
    "calculators": "Клинические калькуляторы и шкалы",
    "ems-algorithms": "Алгоритмы помощи на этапе СМП",
    "manipulations": "Показания и противопоказания для манипуляций",
    "call-card-templates": "Примеры заполнения карт вызова",
    "local-status": "Примеры локального статуса",
    "icd-10": "Коды МКБ-10",
    "ems-stations-minsk": "Подстанции СМП г. Минска",
    "hospitals": "Стационары",
    "default": "Раздел в разработке"
  };

  var MESSAGES = {
    "normative-base": "Собираю здесь все актуальные приказы, постановления и клинические протоколы Министерства здравоохранения Республики Беларусь в удобном для поиска формате.",
    "calculators": "Здесь появятся клинические шкалы и калькуляторы для быстрой оценки состояния пациента прямо на вызове.",
    "ems-algorithms": "Готовлю пошаговые алгоритмы действий при неотложных состояниях — от остановки сердца до анафилаксии. Всё самое важное будет под рукой в любой момент.",
    "manipulations": "Готовлю раздел с чёткими показаниями и противопоказаниями к основным манипуляциям, чтобы не держать всё в голове.",
    "call-card-templates": "Готовлю примеры правильно заполненных карт вызова для разных типов вызовов — чтобы заполнение занимало меньше времени.",
    "local-status": "Собираю примеры описания локального статуса для частых патологий — готовые формулировки для карты вызова.",
    "icd-10": "Добавлю справочник кодов МКБ-10 с быстрым поиском — чтобы правильно кодировать диагноз без лишних справочников.",
    "ems-stations-minsk": "Готовлю список подстанций СМП г. Минска с контактами и зонами обслуживания.",
    "hospitals": "Собираю справочник стационаров с профилями и контактами приёмных отделений — чтобы быстро выбрать маршрут доставки пациента.",
    "default": "Работаю над этим разделом, чтобы сделать его максимально полезным для вашей работы. Совсем скоро здесь появится что-то действительно крутое!"
  };

  var params = new URLSearchParams(window.location.search);
  var section = params.get("section") || "default";

  var pageTitleEl = document.getElementById("pageTitle");
  var titleEl = document.querySelector(".coming-soon-title");
  var descEl = document.getElementById("comingSoonDescription");

  var title = TITLES[section] || TITLES["default"];
  var description = MESSAGES[section] || MESSAGES["default"];

  if (pageTitleEl) pageTitleEl.textContent = title;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = description;

  // Обновляем заголовок вкладки браузера
  document.title = title + " — СМП Помощник";
})();