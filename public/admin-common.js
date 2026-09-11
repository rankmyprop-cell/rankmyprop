import { requireAuth, logout } from "./dashboard-common.js";

export const ADMIN_EMAIL = "rankmyprop@gmail.com";

export async function enforceAdmin(onAdmin) {
  requireAuth(async (user) => {
    const email = String(user.email || "").toLowerCase();
    if (email !== ADMIN_EMAIL) {
      alert("Unauthorized access. Admin only.");
      await logout();
      window.location.href = "dashboard.html";
      return;
    }
    try { await user.getIdToken(true); } catch {}
    await onAdmin(user);
  });
}

export function bindLogout(buttonId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = "login.html";
  });
}

export function showNotice(el, message, type = "ok") {
  if (!el) return;
  el.style.display = "inline-flex";
  el.textContent = message;

  if (type === "error") {
    el.style.borderColor = "rgba(239,68,68,0.55)";
    el.style.color = "#ffd5db";
    el.style.background = "rgba(239,68,68,0.12)";
  } else {
    el.style.borderColor = "rgba(34,197,94,0.45)";
    el.style.color = "#d7ffe8";
    el.style.background = "rgba(34,197,94,0.12)";
  }

  setTimeout(() => {
    el.style.display = "none";
  }, 2600);
}

export function formDataToObj(form) {
  const fd = new FormData(form);
  const obj = {};
  for (const [k, v] of fd.entries()) obj[k] = String(v || "").trim();
  return obj;
}

export function sortByCreatedDesc(rows) {
  const ts = (v) => {
    if (!v) return 0;
    if (typeof v?.toDate === "function") return v.toDate().getTime();
    if (typeof v?.seconds === "number") return v.seconds * 1000;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };
  return rows.sort((a, b) => ts(b.updatedAt || b.createdAt) - ts(a.updatedAt || a.createdAt));
}
