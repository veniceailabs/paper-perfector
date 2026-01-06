export function openFeedbackEmail() {
  const subject = encodeURIComponent("Paper Perfector feedback");
  const body = encodeURIComponent("Feedback:\n\n");
  window.location.href = `mailto:Liveconsciouslyllc@gmail.com?subject=${subject}&body=${body}`;
}
