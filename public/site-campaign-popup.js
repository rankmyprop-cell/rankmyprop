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

function mountPopup(settings) {
  const imageUrl = safeUrl(settings.imageUrl);
  if (!settings.enabled || !imageUrl || document.querySelector(".rmp-campaign-popup")) return;
  let timer = 0;
  let open = false;
  const close = () => {
    if (!open) return;
    open = false;
    try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch { /* Keep the current page dismissed. */ }
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
      try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch { /* Popup remains limited to this page. */ }
      popup.classList.add("is-visible");
      window.removeEventListener("scroll", onScroll);
    }, delay);
  };

  const popup = document.createElement("div");
  popup.className = "rmp-campaign-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-label", "Website offer");
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
  const snapshot = await getDoc(doc(getFirestore(app), "siteSettings", "websitePopup"));
  if (snapshot.exists()) mountPopup(snapshot.data() || {});
} catch (error) {
  if (error?.message !== "popup dismissed for this tab session") console.warn("Website campaign popup could not load.", error);
}
