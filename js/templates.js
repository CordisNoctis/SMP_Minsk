(function () {
  "use strict";

  var TEMPLATES_KEY = "smp-shift-templates-v1";

  var TEMPLATE_COLORS = [
    { id: "maroon",  name: "Бордовый",    bg: "#7a1f2b", text: "#ffffff" },
    { id: "crimson", name: "Малиновый",   bg: "#ad1457", text: "#ffffff" },
    { id: "red",     name: "Красный",     bg: "#c62828", text: "#ffffff" },
    { id: "orange",  name: "Оранжевый",   bg: "#e65100", text: "#ffffff" },
    { id: "amber",   name: "Янтарный",    bg: "#ffa000", text: "#1a1a1a" },
    { id: "yellow",  name: "Жёлтый",      bg: "#fbc02d", text: "#1a1a1a" },
    { id: "lime",    name: "Салатовый",   bg: "#9ccc65", text: "#1a1a1a" },
    { id: "green",   name: "Зелёный",     bg: "#2e7d32", text: "#ffffff" },
    { id: "teal",    name: "Бирюзовый",   bg: "#00796b", text: "#ffffff" },
    { id: "cyan",    name: "Голубой",     bg: "#0097a7", text: "#ffffff" },
    { id: "blue",    name: "Синий",       bg: "#1565c0", text: "#ffffff" },
    { id: "indigo",  name: "Индиго",      bg: "#283593", text: "#ffffff" },
    { id: "purple",  name: "Фиолетовый",  bg: "#6a1b9a", text: "#ffffff" },
    { id: "pink",    name: "Розовый",     bg: "#c2185b", text: "#ffffff" },
    { id: "brown",   name: "Коричневый",  bg: "#5d4037", text: "#ffffff" },
    { id: "gray",    name: "Серый",       bg: "#455a64", text: "#ffffff" }
  ];

  var DEFAULT_TEMPLATES = [
    { id: "day",   name: "День",  colorId: "maroon", startHour: 8,  startMinute: 0, endHour: 20, endMinute: 0, endsNextDay: false, builtin: true },
    { id: "night", name: "Ночь",  colorId: "blue",   startHour: 20, startMinute: 0, endHour: 8,  endMinute: 0, endsNextDay: true,  builtin: true },
    { id: "daily", name: "Сутки", colorId: "green",  startHour: 8,  startMinute: 0, endHour: 8,  endMinute: 0, endsNextDay: true,  builtin: true }
  ];

  function load() {
    try {
      var raw = localStorage.getItem(TEMPLATES_KEY);
      if (!raw) return DEFAULT_TEMPLATES.slice();

      var stored = JSON.parse(raw);
      if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_TEMPLATES.slice();

      // Миграция со старого формата (хранились только пользовательские шаблоны)
      var defaultIds = [];
      for (var i = 0; i < DEFAULT_TEMPLATES.length; i++) defaultIds.push(DEFAULT_TEMPLATES[i].id);

      var hasDefaults = false;
      for (var j = 0; j < stored.length; j++) {
        if (defaultIds.indexOf(stored[j].id) !== -1) { hasDefaults = true; break; }
      }

      if (!hasDefaults) {
        return DEFAULT_TEMPLATES.slice().concat(stored);
      }

      return stored;
    } catch (e) {
      return DEFAULT_TEMPLATES.slice();
    }
  }

  function save(templates) {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch (e) {}
  }

  function getColor(colorId) {
    for (var i = 0; i < TEMPLATE_COLORS.length; i++) {
      if (TEMPLATE_COLORS[i].id === colorId) return TEMPLATE_COLORS[i];
    }
    return TEMPLATE_COLORS[0];
  }

  function find(templates, id) {
    for (var i = 0; i < templates.length; i++) {
      if (templates[i].id === id) return templates[i];
    }
    return null;
  }

  window.SMP = window.SMP || {};
  window.SMP.templates = {
    COLORS: TEMPLATE_COLORS,
    DEFAULTS: DEFAULT_TEMPLATES,
    load: load,
    save: save,
    getColor: getColor,
    find: find
  };
})();