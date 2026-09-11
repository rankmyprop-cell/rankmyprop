import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const loginLabel = `Login <svg class="arrow" viewBox="0 0 18 18" aria-hidden="true"><path d="M3.75 9h10.5M10 4.75 14.25 9 10 13.25"></path></svg>`;

function ensureContentRuntime() {
  const file = (window.location.pathname.split("/").pop() || "").toLowerCase();
  const path = String(window.location.pathname || "").toLowerCase();
  if (!file || file.startsWith("admin-")) return;
  const blocked = /^\/compare(?:\/|$)/i.test(path) || /^(index|dashboard|login|onboarding|my-profile|edit-profile|offers|compare|calculators|lotsizecalculator|risk-to-reward-calculator|drawdown-calculator|profit-split-calculator|consistency-rule-calculator|lossrecoveryplanner|ruletranslator|about|contact|legal|disclaimer|privacy-policy|terms|cookies-policy)/i.test(file);
  if (blocked) return;
  const loaded = Array.from(document.scripts).some((s) =>
    String(s.src || "").includes("/content-cms-runtime.js") ||
    String(s.getAttribute("src") || "") === "content-cms-runtime.js"
  );
  if (loaded) return;
  const s = document.createElement("script");
  s.defer = true;
  s.src = "/content-cms-runtime.js";
  document.head.appendChild(s);
}

function ensureSharedNav() {
  const file = (window.location.pathname.split("/").pop() || "").toLowerCase();
  if (!file || file.startsWith("admin-")) return;
  const hasNav = document.querySelector("nav.glass");
  const hasFooter = document.querySelector("footer");
  if (!hasNav && !hasFooter) return;
  const loaded = Array.from(document.scripts).some((s) => String(s.src || "").includes("/rmp-nav.js") || String(s.getAttribute("src") || "") === "rmp-nav.js");
  if (loaded) return;
  const s = document.createElement("script");
  s.defer = true;
  s.src = "rmp-nav.js";
  document.head.appendChild(s);
}

function initialsFromEmail(email) {
  if (!email) return "U";
  return email.trim().charAt(0).toUpperCase();
}

function decorateDesktopLogin(user) {
  const nav = document.querySelector(".header-shell") || document.querySelector("nav.glass");
  if (!nav) return;
  const desktopLogin = nav.querySelector(".header-actions .rmp-login-btn") || nav.querySelector(".rmp-login-btn") || nav.querySelector('a[href="login.html"]');
  if (!desktopLogin) return;

  if (!user) {
    desktopLogin.href = "/login";
    desktopLogin.innerHTML = loginLabel;
    return;
  }

  const avatar = user.photoURL
    ? `<img fetchpriority="high" loading="eager" decoding="async" src="${user.photoURL}" alt="Profile" style="width:22px;height:22px;border-radius:999px;object-fit:cover;border:1px solid rgba(255,255,255,.35)">`
    : `<span style="width:22px;height:22px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,.15);font-size:12px;font-weight:700">${initialsFromEmail(user.email)}</span>`;

  desktopLogin.href = "/dashboard";
  desktopLogin.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px">${avatar}<span>Dashboard</span></span>`;
}

function decorateMobileLogin(user) {
  const mobileLinks = document.querySelectorAll('.mobile-actions .rmp-login-btn, #mobileMenu a[href="login.html"]');
  mobileLinks.forEach((link) => {
    if (!user) {
      link.href = "/login";
      link.innerHTML = loginLabel;
    } else {
      link.href = "/dashboard";
      link.textContent = "Dashboard";
    }
  });
}

function decoratePromoLink(user) {
  const promoLinks = document.querySelectorAll('.top-promo a[href="login.html"], #rmpTopAnnouncement .rmp-announcement-link');
  promoLinks.forEach((promoLink) => {
    if (!user) {
      promoLink.href = "/login";
      promoLink.textContent = "Login";
    } else {
      promoLink.href = "/dashboard";
      promoLink.textContent = "Dashboard";
    }
  });
}

function applyAuthUi(user) {
  decorateDesktopLogin(user);
  decorateMobileLogin(user);
  decoratePromoLink(user);
}

ensureContentRuntime();
ensureSharedNav();

window.addEventListener("rmp:announcement-ready", () => applyAuthUi(auth.currentUser));

onAuthStateChanged(auth, (user) => {
  applyAuthUi(user);
  setTimeout(() => applyAuthUi(user), 220);
  setTimeout(() => applyAuthUi(user), 900);
});
