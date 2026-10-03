import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "/firebase-config.js";

const DISMISSED_KEY = "rmp:website-popup:dismissed";
let dismissedForSession = false;
try {
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation?.type === "reload") sessionStorage.removeItem(DISMISSED_KEY);
  dismissedForSession = sessionStorage.getItem(DISMISSED_KEY) === "1";
} catch { /* Storage may be unavailable in restricted browser contexts. */ }

const safeUrl = (value) => {
  try {
    const url = new URL(String(value || "").trim(), location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
};

const slugify = (value) => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function pageFirmSlug() {
  const url = new URL(location.href);
  const parts = url.pathname.split("/").filter(Boolean);
  if ((parts[0] === "prop-firms" || parts[0] === "prop-firm-rules" || parts[0] === "offers") && parts[1]) return slugify(parts[1]);
  const querySlug = url.searchParams.get("firm") || url.searchParams.get("slug") || url.searchParams.get("firmSlug");
  return slugify(querySlug);
}

function matchesPath(pattern) {
  const clean = String(pattern || "").trim();
  if (!clean) return false;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const normalized = clean.startsWith("/") ? clean.replace(/\/+$/, "") || "/" : `/${clean.replace(/\/+$/, "")}`;
  if (normalized.endsWith("*")) return path.startsWith(normalized.slice(0, -1));
  return path === normalized;
}

function matchesTarget(campaign) {
  if (!campaign?.enabled) return false;
  const mode = String(campaign.targetMode || "all");
  if (mode === "all") return true;
  if (mode === "firm") return Boolean(campaign.targetFirmSlug) && pageFirmSlug() === slugify(campaign.targetFirmSlug);
  if (mode === "paths") return Array.isArray(campaign.targetPaths) && campaign.targetPaths.some(matchesPath);
  return false;
}

function mountPopup(settings) {
  const imageUrl = safeUrl(settings.imageUrl);
  if (!settings.enabled || !imageUrl || document.querySelector(".rmp-campaign-popup")) return;
  let timer = 0;
  let open = false;
  const popup = document.createElement("div");
  popup.className = "rmp-campaign-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-label", settings.name || "Website offer");
  const close = () => {
    if (!open) return;
    open = false;
    try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch { /* Current page stays dismissed. */ }
    popup.classList.add("is-closing");
    window.setTimeout(() => popup.remove(), 190);
  };
  const onScroll = () => {
    if (open || timer || window.scrollY < 120) return;
    const delay = Math.max(0, Math.min(30, Number(settings.openDelay ?? 2))) * 1000;
    timer = window.setTimeout(() => {
      timer = 0;
      if (window.scrollY < 120) return;
      open = true;
      try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch { /* Current page stays dismissed. */ }
      popup.classList.add("is-visible");
      window.removeEventListener("scroll", onScroll);
    }, delay);
  };
  const backdrop = document.createElement("button");
  backdrop.className = "rmp-campaign-backdrop";
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", "Close popup");
  backdrop.addEventListener("click", close);
  const card = document.createElement("section");
  card.className = "rmp-campaign-card";
  card.style.setProperty("--popup-width", `${Math.max(260, Math.min(760, Number(settings.desktopWidth || 620)))}px`);
  card.style.setProperty("--popup-mobile-width", `${Math.max(70, Math.min(100, Number(settings.mobileWidth || 92)))}vw`);
  const closeButton = document.createElement("button");
  closeButton.className = "rmp-campaign-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close popup");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", close);
  const targetUrl = safeUrl(settings.targetUrl);
  let image;
  if (targetUrl) {
    const link = document.createElement("a");
    link.className = "rmp-campaign-image-link";
    link.href = targetUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", settings.alt || "Open offer");
    image = document.createElement("img");
    link.append(image);
    card.append(link);
  } else {
    image = document.createElement("img");
    image.className = "rmp-campaign-image";
    card.append(image);
  }
  image.src = imageUrl;
  image.alt = String(settings.alt || "Rank My Prop offer");
  card.append(closeButton);
  popup.append(backdrop, card);
  document.body.append(popup);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  window.addEventListener("pagehide", () => { if (timer) window.clearTimeout(timer); }, { once: true });
}

try {
  if (dismissedForSession) throw new Error("popup dismissed for this tab session");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const [multi, legacy] = await Promise.all([
    getDoc(doc(firestore, "siteSettings", "websitePopups")),
    getDoc(doc(firestore, "siteSettings", "websitePopup"))
  ]);
  const campaigns = Array.isArray(multi.data()?.campaigns) ? multi.data().campaigns : [];
  const selected = campaigns.filter(matchesTarget).sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
  if (selected) mountPopup(selected);
  else if (!campaigns.length && legacy.exists()) mountPopup(legacy.data() || {});
} catch (error) {
  if (error?.message !== "popup dismissed for this tab session") console.warn("Website campaign popup could not load.", error);
}
