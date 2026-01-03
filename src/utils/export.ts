/**
 * Triggers browser print dialog for PDF export
 */
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

  const element =
    (document.querySelector(".paper-canvas") as HTMLElement | null) ??
    (document.body as HTMLElement);

  const computed = getComputedStyle(element);
  const backgroundColor = computed.backgroundColor || "#ffffff";

  const canvas = await html2canvas(element, {
    backgroundColor,
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  const fileName = title.replace(/[/\\?%*:|"<>]/g, "-");
  pdf.setProperties({ title: fileName });
  return pdf.output("blob");
}
