export function escapeHtml(v = "") {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatInline(v = "") {
  let h = escapeHtml(v);
  h = h.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)/g, (_, text, href) => {
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  h = h.replace(/==([^=]+)==/g, '<mark style="background:linear-gradient(180deg,#7a74ff,#5b55ff);color:#fff;padding:.04em .22em;border-radius:4px;">$1</mark>');
  return h;
}

export function stripInline(v = "") {
  return String(v)
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|mailto:|tel:)[^\s)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/==([^=]+)==/g, "$1");
}
