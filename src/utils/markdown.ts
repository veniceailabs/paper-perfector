/**
 * Simple markdown to HTML renderer
 * Supports basic markdown syntax
 */
export function markdownToHtml(text: string): string {
  let html = text;

  // Escape HTML special characters first
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Line breaks
  html = html.replace(/\n/g, "<br>");

  return html;
}

/**
 * Extract plain text from markdown
 */
export function markdownToPlainText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markers
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1") // Remove italic markers
    .replace(/_(.+?)_/g, "$1");
}
