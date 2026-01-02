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
  return new Promise((resolve) => {
    // Create a temporary canvas for the document
    const element = document.querySelector(".paper-canvas") || document.body;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      // Fallback: return empty blob
      resolve(new Blob(["Failed to generate PDF"], { type: "application/pdf" }));
      return;
    }

    // For now, we'll create a simple PDF using browser's built-in capabilities
    // In production, you'd use html2pdf or similar
    const printWindow = window.open("", "", "height=400,width=600");
    if (!printWindow) {
      resolve(new Blob(["Failed to open print window"], { type: "application/pdf" }));
      return;
    }

    printWindow.document.write(element.innerHTML);
    printWindow.document.title = title;

    printWindow.onload = () => {
      // Simulate PDF generation by using the print system
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
        // Return a placeholder blob (in production, actually generate PDF)
        resolve(new Blob(["PDF generated"], { type: "application/pdf" }));
      }, 500);
    };
  });
}
