import { useEffect, useRef, useState } from "react";
import "../styles/HoverTip.css";

const TIP_DELAY_MS = 1600;
const TIP_OFFSET = 14;
const TIP_PADDING = 12;
const MAX_TIP_LENGTH = 140;
const INTERACTIVE_SELECTOR =
  "[data-tip], [aria-label], [title], button, a, input, textarea, select, label, [role='button'], [tabindex]";

type TipState = {
  visible: boolean;
  text: string;
  x: number;
  y: number;
};

type HoverTipProps = {
  enabled?: boolean;
};

function sanitizeTipText(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "";
  }
  if (cleaned.length <= MAX_TIP_LENGTH) {
    return cleaned;
  }
  return `${cleaned.slice(0, MAX_TIP_LENGTH - 1)}…`;
}

function getTipText(element: Element | null) {
  if (!element) {
    return "";
  }
  const htmlElement = element as HTMLElement;
  const dataTip = htmlElement.dataset.tip?.trim();
  if (dataTip) {
    return sanitizeTipText(dataTip);
  }
  const ariaLabel = htmlElement.getAttribute("aria-label")?.trim();
  if (ariaLabel) {
    return sanitizeTipText(ariaLabel);
  }
  const title = htmlElement.getAttribute("title")?.trim();
  if (title) {
    return sanitizeTipText(title);
  }

  if (
    htmlElement instanceof HTMLInputElement ||
    htmlElement instanceof HTMLTextAreaElement
  ) {
    const placeholder = htmlElement.placeholder?.trim();
    if (placeholder) {
      return sanitizeTipText(placeholder);
    }
  }

  if (htmlElement instanceof HTMLSelectElement) {
    const selected = htmlElement.options[htmlElement.selectedIndex]?.textContent?.trim();
    if (selected) {
      return sanitizeTipText(selected);
    }
  }

  const text = htmlElement.textContent?.trim() ?? "";
  if (!/[a-z0-9]/i.test(text)) {
    return "";
  }
  return sanitizeTipText(text);
}

export function HoverTip({ enabled = true }: HoverTipProps) {
  const [tip, setTip] = useState<TipState>({
    visible: false,
    text: "",
    x: 0,
    y: 0,
  });
  const tipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hideTip = () => {
    clearTimer();
    setTip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  };

  const updatePosition = (x: number, y: number) => {
    const tooltip = tipRef.current;
    let nextX = x + TIP_OFFSET;
    let nextY = y + TIP_OFFSET;

    if (tooltip) {
      const rect = tooltip.getBoundingClientRect();
      if (nextX + rect.width + TIP_PADDING > window.innerWidth) {
        nextX = x - rect.width - TIP_OFFSET;
      }
      if (nextY + rect.height + TIP_PADDING > window.innerHeight) {
        nextY = y - rect.height - TIP_OFFSET;
      }
      nextX = Math.max(TIP_PADDING, nextX);
      nextY = Math.max(TIP_PADDING, nextY);
    }

    setTip((prev) =>
      prev.visible ? { ...prev, x: nextX, y: nextY } : prev
    );
  };

  useEffect(() => {
    if (!enabled) {
      hideTip();
      return;
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (tip.visible) {
        updatePosition(event.clientX, event.clientY);
      }
    };

    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      const target = (event.target as Element | null)?.closest(
        INTERACTIVE_SELECTOR
      );
      if (!target) {
        hoveredRef.current = null;
        hideTip();
        return;
      }

      if (target === hoveredRef.current) {
        return;
      }

      hoveredRef.current = target as HTMLElement;
      clearTimer();
      const text = getTipText(target);
      if (!text) {
        hideTip();
        return;
      }

      timerRef.current = window.setTimeout(() => {
        if (hoveredRef.current !== target) {
          return;
        }
        const { x, y } = pointerRef.current;
        setTip({ visible: true, text, x, y });
        requestAnimationFrame(() => updatePosition(x, y));
      }, TIP_DELAY_MS);
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      const related = event.relatedTarget as Node | null;
      if (
        hoveredRef.current &&
        related &&
        hoveredRef.current.contains(related)
      ) {
        return;
      }
      hoveredRef.current = null;
      hideTip();
    };

    const handlePointerDown = () => hideTip();
    const handleScroll = () => hideTip();
    const handleKeyDown = () => hideTip();

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("scroll", handleScroll, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("keydown", handleKeyDown);
      clearTimer();
    };
  }, [enabled, tip.visible]);

  if (!enabled || !tip.visible) {
    return null;
  }

  return (
    <div
      ref={tipRef}
      className="hover-tip"
      style={{ left: `${tip.x}px`, top: `${tip.y}px` }}
      role="tooltip"
    >
      {tip.text}
    </div>
  );
}
