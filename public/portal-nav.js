import { requireAuth, loadRows } from "./dashboard-common.js";

function hide(el) {
  if (!el) return;
  el.style.display = "none";
  el.setAttribute("aria-hidden", "true");
}

function show(el) {
  if (!el) return;
  el.style.display = "";
  el.removeAttribute("aria-hidden");
}

async function applyPortalVisibility(uid) {
  const [purchases, bonusOffers] = await Promise.all([
    loadRows("purchases", uid),
    loadRows("bonusOffers", uid)
  ]);

  const hasPurchase = purchases.length > 0;
  const hasActiveBonus = bonusOffers.some((b) => String(b.status || "").toLowerCase() === "active");

  // Hide "Next Bonus" nav/modules unless user has at least one approved purchase.
  document.querySelectorAll("[data-nav='bonus']").forEach((el) => {
    if (!hasPurchase) hide(el);
    else show(el);
  });

  // Keep the page accessible if user opens bonus.html directly, but show limited info via bonus.html itself.
  document.querySelectorAll("[data-requires-purchase='true']").forEach((el) => {
    if (!hasPurchase) hide(el);
    else show(el);
  });

  // Optional: if no active bonus, hide CTA buttons (copy/open) handled by bonus.html anyway.
  if (!hasActiveBonus) {
    document.querySelectorAll("[data-requires-active-bonus='true']").forEach((el) => hide(el));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  requireAuth(async (user) => {
    await applyPortalVisibility(user.uid);
  });
});

