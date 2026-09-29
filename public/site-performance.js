import "/global-footer.js";
import "/site-heading-theme.js";
import "/funding-offers-banner.js";
import "/push-notifications.js";

(() => {
  const GTAG_ID = "G-W3E425827L";
  const FAV_48 = "/favicon-48x48.png";
  const FAV_192 = "/favicon-192x192.png";
  const FAV_APPLE = "/apple-touch-icon.png";
  const FAV_MANIFEST = "/site.webmanifest";
  const IMG_EXT_RE = /\.(png|jpe?g)(\?.*)?$/i;
  const EAGER_SEL = "nav img,.hero img,.home-hero-bg img,.post-cover,img[data-eager],.profile-btn img,.sb-logo img";
  const REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const MOTION_SKIP_PATH = /(?:^|\/)(?:admin[^/]*|dashboard(?:-admin)?|support-dashboard|onboarding)(?:\.html)?\/?$/i;
  const MOTION_TARGETS = [
    "main > section", "main > article", ".hero", ".page-hero", ".review-page-heading",
    ".firm-card", ".offer-card", ".review-card", ".blog-card", ".tool-card",
    ".comparison-card", ".faq-item", ".trust-item", ".stat-card", ".feature-card",
    ".review-table-shell", ".reviews-workspace", ".rmp-quick-links-card", "[data-rmp-animate]"
  ].join(",");
  let motionObserver = null;
  let stickyResizeObserver = null;
  let observedAnnouncement = null;

  function localAsset(v = "") {
    return /^(?:https?:\/\/rankmyprop\.in\/)?assets\//i.test(String(v || "").trim());
  }

  function webp(v = "") {
    return String(v || "").replace(IMG_EXT_RE, ".webp$2");
  }

  function eager(el) {
    return !!(el?.matches?.(EAGER_SEL) || el?.closest?.("nav,.hero,.home-hero-bg,.post-cover-wrap,.featured-media,.sb-logo,.profile-btn,.header-section") || /Rank My Prop/i.test(el?.alt || ""));
  }

  function patchSrcset(srcset = "") {
    return String(srcset || "").split(",").map((part) => {
      const row = part.trim();
      if (!row) return row;
      const bits = row.split(/\s+/);
      if (localAsset(bits[0])) bits[0] = webp(bits[0]);
      return bits.join(" ");
    }).join(", ");
  }

  function tuneImg(img) {
    if (!img || img.dataset.rmpPerf === "1") return;
    img.dataset.rmpPerf = "1";
    if (!img.hasAttribute("decoding")) img.decoding = "async";
    if (!img.hasAttribute("loading")) img.loading = eager(img) ? "eager" : "lazy";
    if (!img.hasAttribute("fetchpriority")) img.setAttribute("fetchpriority", eager(img) ? "high" : "low");
    const src = img.getAttribute("src") || "";
    if (localAsset(src) && IMG_EXT_RE.test(src)) img.setAttribute("src", webp(src));
    const srcset = img.getAttribute("srcset") || "";
    if (srcset) img.setAttribute("srcset", patchSrcset(srcset));
  }

  function tuneFrame(frame) {
    if (!frame || frame.dataset.rmpPerf === "1") return;
    frame.dataset.rmpPerf = "1";
    if (!frame.hasAttribute("loading")) frame.loading = "lazy";
  }

  function scan(root = document) {
    root.querySelectorAll?.("img").forEach(tuneImg);
    root.querySelectorAll?.("iframe").forEach(tuneFrame);
  }

  function motionAllowed() {
    if (REDUCED_MOTION || MOTION_SKIP_PATH.test(location.pathname)) return false;
    if (window.self !== window.top) return false;
    return true;
  }

  function mountMotionStyles() {
    if (!motionAllowed() || document.getElementById("rmpGlobalMotionStyles")) return;
    const style = document.createElement("style");
    style.id = "rmpGlobalMotionStyles";
    style.textContent = `
      html{scroll-behavior:smooth;scroll-padding-top:88px}
      body.rmp-motion-page{animation:rmp-page-in .42s cubic-bezier(.22,.7,.2,1) both}
      .rmp-motion-item{opacity:0;transform:translate3d(0,18px,0) scale(.992);filter:blur(3px);transition:opacity .62s cubic-bezier(.22,.7,.2,1),transform .62s cubic-bezier(.22,.7,.2,1),filter .62s ease;transition-delay:var(--rmp-motion-delay,0ms);will-change:opacity,transform}
      .rmp-motion-item[data-rmp-motion="left"]{transform:translate3d(-22px,0,0)}
      .rmp-motion-item[data-rmp-motion="right"]{transform:translate3d(22px,0,0)}
      .rmp-motion-item[data-rmp-motion="scale"]{transform:scale(.965)}
      .rmp-motion-item.rmp-motion-visible{opacity:1;transform:none;filter:none;will-change:auto}
      .rmp-motion-lift{transition:translate .22s ease,box-shadow .22s ease,border-color .22s ease}
      .rmp-motion-lift:hover{translate:0 -3px}
      .rmp-motion-press{transition:translate .16s ease,filter .16s ease}
      .rmp-motion-press:hover{translate:0 -1px;filter:brightness(1.05)}
      .rmp-motion-press:active{translate:0 0;filter:brightness(.98)}
      @keyframes rmp-page-in{from{opacity:.01}to{opacity:1}}
      @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}.rmp-motion-item{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}.rmp-motion-lift,.rmp-motion-press{transition:none!important;translate:none!important}body.rmp-motion-page{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function mountGlobalShellStyles() {
    if (MOTION_SKIP_PATH.test(location.pathname) || document.getElementById("rmpGlobalShellStyles")) return;
    const style = document.createElement("style");
    style.id = "rmpGlobalShellStyles";
    style.textContent = `
      html,body{overflow-x:clip!important}
      #rmpTopAnnouncement{position:sticky!important;top:0!important;z-index:10060!important}
      .site-header.rmp-shared-home-header{position:sticky!important;top:var(--rmp-announcement-height,0px)!important;z-index:10050!important;width:100%!important;isolation:isolate;transform:translateZ(0)}
    `;
    document.head.appendChild(style);
  }

  function syncStickyHeaderMetrics() {
    const announcement = document.getElementById("rmpTopAnnouncement");
    const header = document.querySelector(".site-header.rmp-shared-home-header");
    const announcementHeight = announcement && !announcement.hidden ? Math.ceil(announcement.getBoundingClientRect().height) : 0;
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--rmp-announcement-height", `${announcementHeight}px`);
    document.documentElement.style.setProperty("--rmp-sticky-header-height", `${announcementHeight + headerHeight}px`);
    if (announcement && announcement !== observedAnnouncement && "ResizeObserver" in window) {
      stickyResizeObserver?.disconnect();
      stickyResizeObserver = new ResizeObserver(syncStickyHeaderMetrics);
      stickyResizeObserver.observe(announcement);
      if (header) stickyResizeObserver.observe(header);
      observedAnnouncement = announcement;
    }
  }

  function revealMotionElement(element) {
    element.classList.add("rmp-motion-visible");
    motionObserver?.unobserve(element);
  }

  function prepareMotion(root = document) {
    if (!motionAllowed()) return;
    const nodes = [];
    if (root instanceof Element && root.matches?.(MOTION_TARGETS)) nodes.push(root);
    root.querySelectorAll?.(MOTION_TARGETS).forEach((element) => nodes.push(element));
    nodes.forEach((element, index) => {
      if (element.classList.contains("rmp-motion-item") || element.classList.contains("rmp-reveal")) return;
      if (element.hidden || element.closest("[hidden],dialog,.modal-overlay,.review-modal,.login-modal")) return;
      element.classList.add("rmp-motion-item");
      element.style.setProperty("--rmp-motion-delay", `${Math.min((index % 6) * 55, 275)}ms`);
      if (motionObserver) motionObserver.observe(element);
      else revealMotionElement(element);
    });
    root.querySelectorAll?.(".firm-card,.offer-card,.review-card,.blog-card,.tool-card,.feature-card,.faq-item").forEach((element) => element.classList.add("rmp-motion-lift"));
    root.querySelectorAll?.("button,.primary-button,.secondary-button,.write-review-button,[class*='-btn']").forEach((element) => {
      if (!element.closest(".review-modal,.modal-overlay,.login-modal")) element.classList.add("rmp-motion-press");
    });
  }

  function initGlobalMotion() {
    if (!motionAllowed()) return;
    mountMotionStyles();
    document.body.classList.add("rmp-motion-page");
    if ("IntersectionObserver" in window) {
      motionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) revealMotionElement(entry.target);
        });
      }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    }
    requestAnimationFrame(() => prepareMotion(document));
  }

  function bootGtag() {
    if (!GTAG_ID) return;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GTAG_ID}"]`)) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GTAG_ID);
  }

  function upsertIcon(sel, attrs) {
    let el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement("link");
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }

  function syncFavicons() {
    upsertIcon('link[rel="icon"][sizes="48x48"]', { rel: "icon", type: "image/png", sizes: "48x48", href: FAV_48 });
    upsertIcon('link[rel="icon"][sizes="192x192"]', { rel: "icon", type: "image/png", sizes: "192x192", href: FAV_192 });
    upsertIcon('link[rel="apple-touch-icon"]', { rel: "apple-touch-icon", href: FAV_APPLE });
    upsertIcon('link[rel="manifest"]', { rel: "manifest", href: FAV_MANIFEST });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bootGtag();
      syncFavicons();
      scan(document);
      mountGlobalShellStyles();
      syncStickyHeaderMetrics();
      initGlobalMotion();
    }, { once: true });
  } else {
    bootGtag();
    syncFavicons();
    scan(document);
    mountGlobalShellStyles();
    syncStickyHeaderMetrics();
    initGlobalMotion();
  }

  new MutationObserver((rows) => {
    rows.forEach((row) => {
      row.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.tagName === "IMG") tuneImg(node);
        if (node.tagName === "IFRAME") tuneFrame(node);
        scan(node);
        prepareMotion(node);
        if (node.id === "rmpTopAnnouncement" || node.matches?.(".site-header.rmp-shared-home-header")) syncStickyHeaderMetrics();
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("rmp:announcement-ready", syncStickyHeaderMetrics);
  window.addEventListener("resize", syncStickyHeaderMetrics, { passive: true });

})();
