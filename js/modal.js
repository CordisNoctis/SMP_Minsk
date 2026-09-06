(function () {
  "use strict";

  let activeModal = null;
  let lastFocusedElement = null;

  function getFocusableElements(container) {
    const elements = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    return elements.filter(function (element) {
      const rect = element.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0;
    });
  }

  function openModal(modal, triggerElement) {
    if (!modal) {
      return;
    }

    activeModal = modal;
    lastFocusedElement = triggerElement || document.activeElement;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    const focusableElements = getFocusableElements(modal);

    const firstFocusable =
      focusableElements.find(function (element) {
        return !element.hasAttribute("data-modal-close");
      }) || focusableElements[0];

    if (firstFocusable) {
      firstFocusable.focus();
    }

    document.addEventListener("keydown", handleKeydown);
  }

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");

    if (activeModal === modal) {
      activeModal = null;
    }

    document.body.classList.remove("modal-open");

    document.removeEventListener("keydown", handleKeydown);

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus === "function"
    ) {
      lastFocusedElement.focus();
    }
  }

  function handleKeydown(event) {
    if (!activeModal) {
      return;
    }

    if (event.key === "Escape") {
      closeModal(activeModal);
      return;
    }

    if (event.key === "Tab") {
      const focusableElements = getFocusableElements(activeModal);

      if (!focusableElements.length) {
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable =
        focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstFocusable
      ) {
        event.preventDefault();
        lastFocusable.focus();
      }

      if (
        !event.shiftKey &&
        document.activeElement === lastFocusable
      ) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  document.addEventListener("click", function (event) {
    const opener = event.target.closest("[data-modal-open]");

    if (opener) {
      event.preventDefault();

      const modalId = opener.getAttribute("data-modal-open");
      const modal = document.getElementById(modalId);

      openModal(modal, opener);

      return;
    }

    const closer = event.target.closest("[data-modal-close]");

    if (closer) {
      const modal = closer.closest(".modal");

      if (modal) {
        closeModal(modal);
      }
    }
  });
})();