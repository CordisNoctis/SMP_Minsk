(function () {
  "use strict";

  // =====================================================
  // ЕДИНСТВЕННОЕ МЕСТО, где меняется версия приложения.
  // До релиза: 0.00.001 → 0.00.002 → … (последняя цифра +1)
  // На релизе: 1.00.000
  // =====================================================
  var APP_VERSION = "0.00.022"; 

  if (typeof window !== "undefined") window.SMP_VERSION = APP_VERSION;
  if (typeof self !== "undefined") self.SMP_VERSION = APP_VERSION;
})();