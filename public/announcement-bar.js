import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const defaults = {
  enabled: true,
  prefix: "Create an account and get",
  highlight: "additional 5% OFF + 50 points",
  suffix: "on your next account purchase.",
  linkText: "Login",
  linkUrl: "/login",
  confettiEnabled: true,
  dismissible: true,
};

let announcementResizeObserver = null;

function syncStickyOffsets(bar = document.getElementById("rmpTopAnnouncement")) {
  const announcementHeight = bar && !bar.hidden ? Math.ceil(bar.getBoundingClientRect().height) : 0;
  const header = document.querySelector(".site-header.rmp-shared-home-header");
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty("--rmp-announcement-height", `${announcementHeight}px`);
  document.documentElement.style.setProperty("--rmp-sticky-header-height", `${announcementHeight + headerHeight}px`);
}

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

function ensureStyle() {
  if (document.getElementById("rmpAnnouncementStyles")) return;
  const link = document.createElement("link");
  link.id = "rmpAnnouncementStyles";
  link.rel = "stylesheet";
  link.href = "/announcement-bar.css";
  link.addEventListener("load", () => syncStickyOffsets(), { once: true });
  document.head.appendChild(link);
}

function render(settings) {
  const data = { ...defaults, ...settings };
  let bar = document.getElementById("rmpTopAnnouncement");
  if (!bar) {
    bar = document.createElement("aside");
    bar.id = "rmpTopAnnouncement";
    bar.className = "rmp-top-announcement";
    bar.setAttribute("aria-label", "Website announcement");
  }
  bar.hidden = !data.enabled;
  bar.classList.remove("is-closing");
  bar.innerHTML = `
    <span>${escapeHtml(data.prefix)} <strong>${escapeHtml(data.highlight)}</strong> ${escapeHtml(data.suffix)}
      ${data.linkText && data.linkUrl ? `<a class="rmp-announcement-link" href="${escapeHtml(data.linkUrl)}">${escapeHtml(data.linkText)}</a>` : ""}
    </span>
    <button class="rmp-announcement-close" type="button" aria-label="Close announcement">×</button>
  `;
  const header = document.querySelector(".rmp-shared-home-header");
  if (header?.parentNode) header.parentNode.insertBefore(bar, header);
  else document.body.prepend(bar);
  if ("ResizeObserver" in window) {
    announcementResizeObserver?.disconnect();
    announcementResizeObserver = new ResizeObserver(() => syncStickyOffsets(bar));
    announcementResizeObserver.observe(bar);
  }
  requestAnimationFrame(() => syncStickyOffsets(bar));
  // The stylesheet and webfont can settle after the first frame. Re-measure
  // after both phases so the sticky header never overlaps a wrapped banner.
  setTimeout(() => syncStickyOffsets(bar), 120);
  setTimeout(() => syncStickyOffsets(bar), 650);
  bar.querySelector(".rmp-announcement-close")?.addEventListener("click", () => {
    bar.classList.add("is-closing");
    sessionStorage.setItem("rmp-announcement-dismissed", "1");
    bar.addEventListener("animationend", () => {
      bar.hidden = true;
      bar.classList.remove("is-closing");
      syncStickyOffsets(bar);
    }, { once: true });
  });
  if (sessionStorage.getItem("rmp-announcement-dismissed") === "1") {
    bar.hidden = true;
    syncStickyOffsets(bar);
  }
  window.dispatchEvent(new CustomEvent("rmp:announcement-ready"));
  if (data.enabled && data.confettiEnabled && !bar.hidden) launchConfetti();
}

function launchConfetti() {
  const key = `rmp-promo-${new Date().toISOString().slice(0, 10)}`;
  if (localStorage.getItem(key) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  localStorage.setItem(key, "1");
  const layer = document.createElement("div");
  layer.className = "rmp-promo-confetti";
  layer.setAttribute("aria-hidden", "true");
  const colors = ["#ffd84a", "#ffcf35", "#ffdf6e", "#f7c948", "#7a74ff", "#a691ff", "#60e7ff", "#ff78da", "#ff9f43", "#6dffb3"];
  for (let index = 0; index < 170; index += 1) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.width = `${6 + Math.random() * 7}px`;
    piece.style.height = `${10 + Math.random() * 12}px`;
    piece.style.animationDelay = `${Math.random() * .95}s`;
    piece.style.animationDuration = `${2.9 + Math.random() * .95}s`;
    piece.style.setProperty("--drift", `${(Math.random() - .5) * 180}px`);
    piece.style.setProperty("--spin", `${360 + Math.random() * 900}deg`);
    piece.style.setProperty("--fall", `${innerHeight + 80 + Math.random() * 140}px`);
    if (Math.random() > .62) piece.style.borderRadius = "50%";
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4300);
}

async function loadSettings() {
  try {
    const app = getApps()[0] || initializeApp(firebaseConfig);
    const snapshot = await getDoc(doc(getFirestore(app), "siteSettings", "announcementBar"));
    if (snapshot.exists()) render(snapshot.data());
  } catch (_) {
    // The exported promotion remains visible if remote settings are unavailable.
  }
}

function install() {
  ensureStyle();
  render(defaults);
  loadSettings();
}

if (document.querySelector(".rmp-shared-home-header")) install();
else {
  window.addEventListener("rmp:home-shell-ready", install, { once: true });
  window.addEventListener("DOMContentLoaded", () => setTimeout(() => {
    if (!document.getElementById("rmpTopAnnouncement")) install();
  }, 0), { once: true });
}
