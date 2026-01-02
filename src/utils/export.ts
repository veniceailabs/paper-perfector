export function exportToPdf(title?: string) {
  const previousTitle = document.title;
  if (title) {
    document.title = title;
  }

  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  };

  window.addEventListener("afterprint", restoreTitle);
  window.print();
}
