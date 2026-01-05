/**
 * Triggers browser print dialog for PDF export
 */
import type { Document } from "../models/DocumentSchema";
import { formatReference, formatReferenceTitle } from "./citations";
import { parseFontSize, parsePageMargin, resolveFormat } from "./formatting";

export function exportToPdf(title?: string, onAfterPrint?: () => void) {
  const previousTitle = document.title;
  if (title) {
    document.title = title;
  }

  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
    if (onAfterPrint) {
      onAfterPrint();
    }
  };

  window.addEventListener("afterprint", restoreTitle);
  window.print();
}

/**
 * Generates PDF blob for email attachment
 * Returns a promise that resolves to a Blob
 */
export async function exportToPdfBlob(title: string = "document"): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const root = document.documentElement;
  root.setAttribute("data-exporting", "pdf");

  try {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Ignore font readiness failures
      }
    }

    const element =
      (document.querySelector(".paper-canvas") as HTMLElement | null) ??
      (document.body as HTMLElement);

    const computed = getComputedStyle(element);
    const backgroundColor = computed.backgroundColor || "#ffffff";

    const colorMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const [red, green, blue] = colorMatch
      ? colorMatch.slice(1, 4).map((value) => Number(value))
      : [255, 255, 255];

    const canvas = await html2canvas(element, {
      backgroundColor,
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 0;
    const contentWidth = pageWidth - margin * 2;
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    const addPageBackground = () => {
      pdf.setFillColor(red, green, blue);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
    };

    addPageBackground();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      addPageBackground();
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const fileName = title.replace(/[/\\?%*:|"<>]/g, "-");
    pdf.setProperties({ title: fileName });
    return pdf.output("blob");
  } finally {
    root.removeAttribute("data-exporting");
  }
}

function toPoints(value: number, unit: "pt" | "px" | "mm" | "in") {
  if (unit === "pt") {
    return value;
  }
  if (unit === "px") {
    return value * 0.75;
  }
  if (unit === "in") {
    return value * 72;
  }
  return value * (72 / 25.4);
}

export async function exportToPdfTextBlob(doc: Document): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const resolvedFormat = resolveFormat(doc);
  const fontSizeData = parseFontSize(resolvedFormat.fontSize, "12pt");
  const marginData = parsePageMargin(resolvedFormat.pageMargin, "24mm");
  const baseFontSize = toPoints(fontSizeData.size, fontSizeData.unit);
  const margin = toPoints(marginData.size, marginData.unit);
  const lineHeight = baseFontSize * (resolvedFormat.lineHeight ?? 1.5);
  const paragraphSpacing = toPoints(
    resolvedFormat.paragraphSpacing ?? 12,
    "px"
  );
  const showHeader = resolvedFormat.showHeader ?? false;
  const showPageNumbers = resolvedFormat.showPageNumbers ?? false;
  const headerText =
    resolvedFormat.headerText?.trim() || doc.title.toUpperCase();
  const headerFontSize = Math.max(8, baseFontSize * 0.75);

  const fontFamily = /times/i.test(resolvedFormat.fontFamily ?? "")
    ? "times"
    : "helvetica";

  const pdf = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const headerOffset = showHeader ? headerFontSize * 1.8 : 0;
  const footerOffset = showPageNumbers ? headerFontSize * 1.8 : 0;
  const contentTop = margin + headerOffset;
  const contentBottom = margin + footerOffset;

  let pageNumber = 1;
  let cursorY = contentTop;

  const drawHeaderFooter = () => {
    pdf.setFont(fontFamily, "normal");
    pdf.setFontSize(headerFontSize);
    if (showHeader) {
      pdf.text(headerText, margin, margin);
    }
    if (showPageNumbers) {
      pdf.text(
        `Page ${pageNumber}`,
        pageWidth - margin,
        pageHeight - margin / 2,
        { align: "right" }
      );
    }
  };

  const ensureSpace = (blockHeight: number) => {
    if (cursorY + blockHeight <= pageHeight - contentBottom) {
      return;
    }
    pdf.addPage();
    pageNumber += 1;
    cursorY = contentTop;
    drawHeaderFooter();
  };

  const addLines = (
    lines: string[],
    fontSize: number,
    fontStyle: "normal" | "bold"
  ) => {
    const lineHeightForFont = lineHeight * (fontSize / baseFontSize);
    pdf.setFont(fontFamily, fontStyle);
    pdf.setFontSize(fontSize);
    lines.forEach((line) => {
      ensureSpace(lineHeightForFont);
      pdf.text(line, margin, cursorY);
      cursorY += lineHeightForFont;
    });
  };

  const addWrappedText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" = "normal",
    extraSpacing: number = paragraphSpacing
  ) => {
    const lines = pdf.splitTextToSize(text, contentWidth);
    addLines(lines, fontSize, fontStyle);
    if (extraSpacing > 0) {
      ensureSpace(extraSpacing);
      cursorY += extraSpacing;
    }
  };

  drawHeaderFooter();

  addWrappedText(doc.title, baseFontSize * 1.6, "bold");
  if (doc.subtitle) {
    addWrappedText(doc.subtitle, baseFontSize * 1.2, "normal");
  }

  const metaEntries = Object.entries(doc.metadata ?? {}).filter(
    ([, value]) => value.trim().length > 0
  );
  if (metaEntries.length > 0) {
    metaEntries.forEach(([key, value]) => {
      addWrappedText(`${key}: ${value}`, baseFontSize);
    });
    cursorY += paragraphSpacing;
  }

  doc.sections.forEach((section) => {
    addWrappedText(section.title, baseFontSize * 1.15, "bold", paragraphSpacing * 0.6);
    section.body.forEach((paragraph) => {
      if (!paragraph.trim()) {
        cursorY += paragraphSpacing;
        return;
      }
      const lines = paragraph.split("\n");
      lines.forEach((line, index) => {
        addWrappedText(
          line,
          baseFontSize,
          "normal",
          index === lines.length - 1 ? paragraphSpacing : 0
        );
      });
    });
    section.monoBlocks?.forEach((block) => {
      const lines = block.split("\n");
      pdf.setFont("courier", "normal");
      pdf.setFontSize(baseFontSize * 0.9);
      lines.forEach((line) => {
        ensureSpace(lineHeight);
        pdf.text(line, margin, cursorY);
        cursorY += lineHeight;
      });
      cursorY += paragraphSpacing;
    });
  });

  const sources = doc.sources ?? [];
  const hasReferenceSection = doc.sections.some((section) =>
    /references|bibliography|works cited/i.test(section.title)
  );
  if (sources.length > 0 && !hasReferenceSection) {
    addWrappedText(formatReferenceTitle(resolvedFormat.preset ?? "default"), baseFontSize * 1.15, "bold");
    sources.forEach((source) => {
      addWrappedText(formatReference(source, resolvedFormat.preset ?? "default"), baseFontSize);
    });
  }

  const fileName = doc.title.replace(/[/\\?%*:|"<>]/g, "-");
  pdf.setProperties({ title: fileName });
  return pdf.output("blob");
}
