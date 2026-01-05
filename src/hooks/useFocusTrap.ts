import { useEffect } from "react";
import type { RefObject } from "react";

const focusableSelectors = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

export function useFocusTrap(containerRef: RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const previousActive = document.activeElement as HTMLElement | null;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );
    const initialFocus = focusable[0] ?? container;
    initialFocus.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableItems = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      );
      if (focusableItems.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusableItems[0];
      const last = focusableItems[focusableItems.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousActive && previousActive.focus) {
        previousActive.focus();
      }
    };
  }, [containerRef, onClose]);
}
