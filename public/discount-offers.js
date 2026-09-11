import { getAllOffers } from "./offers-service.js";
import { DISCOUNT_PAGE_PRIORITY } from "./offers-data.js";
import { escapeHtml, formatInline } from "./text-format.js";

const state = {
  offers: [],
  filtered: [],
  page: 1,
  rowsPerPage: 9,
  filter: "all",
  q: "",
  loading: true
};
const UX_DELAY_MS = 0;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureLoaderStyle() {
  if (document.getElementById("rmpLoaderFx")) return;
  const style = document.createElement("style");
  style.id = "rmpLoaderFx";
  style.textContent = [
    "@keyframes rmpPulse{0%{opacity:.42}50%{opacity:.92}100%{opacity:.42}}",
    ".rmp-load-block{animation:rmpPulse 1.05s ease-in-out infinite}"
  ].join("");
  document.head.appendChild(style);
}

function ensureOfferCardStyles() {
  if (document.getElementById("rmpOfferCardFx")) return;
  const style = document.createElement("style");
  style.id = "rmpOfferCardFx";
  style.textContent = [
    ".rmp-offer-card{display:flex;flex-direction:column;gap:18px;padding:22px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:linear-gradient(180deg,rgba(12,13,30,.92),rgba(8,10,24,.95));margin-bottom:14px}",
    ".rmp-offer-main{display:flex;align-items:flex-start;gap:14px;min-width:0;flex:1}",
    ".rmp-offer-badge{width:102px;min-width:102px;border-radius:13px;padding:1px;background:linear-gradient(135deg,#7c5cff 0%,#a78bfa 48%,#ffffff 100%)}",
    ".rmp-offer-badge-in{background:#05040b;border-radius:12px;padding:10px 8px;text-align:center}",
    ".rmp-offer-live{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.68)}",
    ".rmp-offer-discount{font-size:24px;font-weight:900;line-height:1.12;color:#fff;margin-top:5px}",
    ".rmp-offer-code{margin-top:6px;font-size:11px;font-weight:800;color:#f3d78b}",
    ".rmp-offer-info{min-width:0;flex:1}",
    ".rmp-offer-head{display:flex;align-items:center;gap:12px;min-width:0}",
    ".rmp-offer-logo{width:56px;height:56px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);overflow:hidden;display:flex;align-items:center;justify-content:center}",
    ".rmp-offer-logo img{width:100%;height:100%;object-fit:contain}",
    ".rmp-offer-name{margin:0;font-size:23px;font-weight:800;line-height:1.2;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".rmp-offer-name a{color:#fff;text-decoration:none}",
    ".rmp-offer-meta{margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
    ".rmp-offer-rate{display:inline-flex;align-items:center;gap:8px;padding:5px 10px;border-radius:999px;border:1px solid rgba(122,116,255,.55);background:rgba(122,116,255,.17);font-size:12px;color:#f4f5ff;font-weight:700}",
    ".rmp-offer-stars{display:inline-flex;align-items:center;gap:2px;font-size:11px;letter-spacing:.02em;color:#f6d574;line-height:1}",
    ".rmp-offer-score{font-size:12px;color:#fff;font-weight:800}",
    ".rmp-offer-reviews{font-size:12px;color:#a6abc2}",
    ".rmp-offer-desc{margin:10px 0 0;color:#9aa2bf;font-size:13px;line-height:1.5}",
    ".rmp-offer-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
    ".rmp-code-wrap{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:8px 10px}",
    ".rmp-code-label{font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.06em}",
    ".rmp-code-value{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#fff;font-weight:800}",
    ".rmp-copy-btn{width:26px;height:26px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);display:inline-flex;align-items:center;justify-content:center;color:#9f98ff;cursor:pointer}",
    ".rmp-offer-visit{display:inline-flex;align-items:center;justify-content:center;height:42px;padding:0 18px;border-radius:12px;background:linear-gradient(180deg,#7a74ff,#5b55ff);border:1px solid #5b55ff;color:#fff;text-decoration:none;font-size:14px;font-weight:800}",
    ".rmp-offer-skel{display:flex;flex-direction:column;gap:18px;padding:22px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:linear-gradient(180deg,rgba(12,13,30,.92),rgba(8,10,24,.95));margin-bottom:14px}",
    ".rmp-skel-row{display:flex;gap:14px;align-items:flex-start}",
    ".rmp-skel-box{border-radius:12px;background:rgba(255,255,255,.1)}",
    "@media (min-width:900px){.rmp-offer-card{flex-direction:row;align-items:center;justify-content:space-between}.rmp-offer-actions{justify-content:flex-end}.rmp-offer-skel{flex-direction:row;align-items:center;justify-content:space-between}.rmp-offer-name{font-size:24px}}",
    "@media (max-width:640px){.rmp-offer-badge{width:92px;min-width:92px}.rmp-offer-discount{font-size:21px}.rmp-offer-name{font-size:20px}.rmp-offer-actions{width:100%;justify-content:flex-start}.rmp-offer-visit{height:40px;padding:0 14px}}"
  ].join("");
  document.head.appendChild(style);
}

function ensureDedicatedHeroStyles() {
  if (document.getElementById("rmpOfferHeroFx")) return;
  const style = document.createElement("style");
  style.id = "rmpOfferHeroFx";
  style.textContent = [
    ".rmp-discount-hero{max-width:1120px;margin:22px auto 24px;padding:0 8px;text-align:center}",
    ".rmp-discount-hero h1{margin:0;font-size:clamp(34px,5vw,66px);line-height:1.08;letter-spacing:-.02em;color:#f4f6ff;font-weight:400}",
    ".rmp-discount-hero .rmp-hero-accent{background:linear-gradient(90deg,#c4b5fd 0%,#7c6dff 58%,#9ea7ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}",
    ".rmp-discount-hero p{margin:12px auto 0;max-width:980px;color:#b8bed7;font-size:clamp(15px,1.7vw,19px);line-height:1.65}"
  ].join("");
  document.head.appendChild(style);
}

function currentFileName() {
  const raw = window.location.pathname.split("/").pop() || "discount.html";
  return raw.toLowerCase();
}

function slugify(v = "") {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function keyify(v = "") {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
}

function priorityFromRoute() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "offers" && parts[1]) return slugify(decodeURIComponent(parts[1]));
  const qs = new URLSearchParams(window.location.search || "");
  return slugify(qs.get("slug") || qs.get("firm") || "");
}

function priorityFirmName() {
  const routeSlug = priorityFromRoute();
  if (routeSlug) return routeSlug;
  const file = currentFileName();
  if (DISCOUNT_PAGE_PRIORITY[file]) return slugify(DISCOUNT_PAGE_PRIORITY[file]);
  if (!/\.html$/i.test(file) && DISCOUNT_PAGE_PRIORITY[`${file}.html`]) {
    return slugify(DISCOUNT_PAGE_PRIORITY[`${file}.html`]);
  }
  return null;
}

function titleCaseWords(v = "") {
  return String(v || "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function emphasizeHeroHeading(text = "") {
  const words = String(text || "").trim().split(/\s+/g).filter(Boolean);
  if (!words.length) return "";
  if (words.length === 1) return escapeHtml(words[0]);
  const accentCount = Math.max(2, Math.ceil(words.length * 0.42));
  const splitAt = Math.max(1, words.length - accentCount);
  const lead = escapeHtml(words.slice(0, splitAt).join(" "));
  const tail = escapeHtml(words.slice(splitAt).join(" "));
  return `${lead} <span class="rmp-hero-accent">${tail}</span>`;
}

function starString(value = 0) {
  const rating = Number(value || 0);
  if (!Number.isFinite(rating) || rating <= 0) return "☆☆☆☆☆";
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
}

function isDedicatedDiscountPage() {
  return Boolean(priorityFirmName());
}

function findPriorityOffer(list = []) {
  const priority = priorityFirmName();
  if (!priority || !Array.isArray(list)) return null;
  return list.find((offer) => isPriorityOffer(offer, priority)) || null;
}

function resolveDedicatedFirmName(list = []) {
  const hit = findPriorityOffer(list);
  if (hit && String(hit.name || "").trim()) return String(hit.name || "").trim();
  const priority = priorityFirmName();
  return priority ? titleCaseWords(String(priority).replace(/-/g, " ")) : "";
}

function ensureDedicatedHero(list = []) {
  if (!isDedicatedDiscountPage()) return;
  const firmName = resolveDedicatedFirmName(list);
  if (!firmName) return;
  const heading = `${firmName} Discount Code 2026 | Latest Promo & Coupon Offers`;
  const paragraph = `Get the latest ${firmName} discount codes, promo offers, and verified coupon deals for 2026. Save on ${firmName} prop firm challenge accounts with updated eligibility and expiry details.`;
  const headingHtml = emphasizeHeroHeading(heading);

  const legacyH = document.getElementById("h");
  const legacySub = document.getElementById("sub");
  if (legacyH) legacyH.innerHTML = headingHtml;
  if (legacySub) legacySub.textContent = paragraph;
  if (legacyH) return;

  const wrap = document.querySelector(".wrap");
  if (!wrap) return;
  ensureDedicatedHeroStyles();
  let hero = document.getElementById("rmpDiscountHero");
  if (!hero) {
    hero = document.createElement("section");
    hero.id = "rmpDiscountHero";
    hero.className = "rmp-discount-hero";
    hero.innerHTML = '<h1></h1><p></p>';
    const shell = wrap.querySelector(".offers-shell");
    wrap.insertBefore(hero, shell || wrap.firstChild);
  }
  const h1 = hero.querySelector("h1");
  const p = hero.querySelector("p");
  if (h1) h1.innerHTML = headingHtml;
  if (p) p.textContent = paragraph;
}

function isPriorityOffer(offer, priority = "") {
  const key = keyify(priority);
  if (!key) return false;
  const fields = [
    offer?.slug,
    offer?.firmId,
    offer?.id,
    offer?.name,
    String(offer?.page || "").replace(/discount(?:\.html)?$/i, "")
  ];
  return fields.some((v) => keyify(v) === key);
}

function orderedOffers(list) {
  const priority = priorityFirmName();
  if (!priority) return [...list];
  return [...list].sort((a, b) => {
    const aHit = isPriorityOffer(a, priority);
    const bHit = isPriorityOffer(b, priority);
    if (aHit && !bHit) return -1;
    if (bHit && !aHit) return 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
}

function applyFilters() {
  const ordered = orderedOffers(state.offers);
  state.filtered = ordered.filter((o) => {
    const okFilter = state.filter === "all"
      || (state.filter === "exclusive" ? o.exclusive === true : o.category === state.filter);
    const okSearch = o.name.toLowerCase().includes(state.q.toLowerCase());
    return okFilter && okSearch;
  });
}

function copyCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    alert(`Code ${code} copied!`);
  }).catch(() => {
    alert(`Code: ${code}`);
  });
}

function logoFallback(name = "Firm") {
  const txt = String(name || "Firm").trim().slice(0, 2).toUpperCase() || "RM";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' rx='18' fill='#120f1d'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='44' font-weight='700' fill='#7c5cff'>${txt}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function offerPageUrl(firm = {}) {
  const raw = String(firm.page || "").trim();
  if (!raw) return `/offers/${encodeURIComponent(String(firm.firmId || firm.slug || firm.id || "").toLowerCase())}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes(".html")) return raw.replace(/\.html(?=$|[?#])/, "");
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function normalizeVisitUrl(raw = "") {
  const s = String(raw || "").trim();
  if (!s || s === "#") return "#";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s;
  if (/^\/\//.test(s)) return `https:${s}`;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[\/:?#].*)?$/i.test(s)) return `https://${s}`;
  return s;
}

function offerVisitUrl(firm = {}) {
  return normalizeVisitUrl(firm.affiliateLink || firm.link || firm.buyLink || firm.website || "");
}

function cardHtml(firm) {
  const ratingValue = Number(firm.rating || 0);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const ratingText = hasRating ? ratingValue.toFixed(1) : "New";
  const code = String(firm.code || "RMP");
  const name = String(firm.name || "Unknown Firm");
  const safeName = escapeHtml(name);
  const safeLogo = escapeHtml(firm.logoUrl || firm.logo || logoFallback(name));
  const discountRaw = String(firm.discount || "0%").trim();
  const discountNorm = discountRaw && !/%/.test(discountRaw) && /^\d+(\.\d+)?$/.test(discountRaw) ? `${discountRaw}%` : discountRaw;
  const discount = escapeHtml(discountNorm || "0%");
  const fallbackDescription = `Get the latest ${name} discount codes, promo offers, and verified coupon details for ${new Date().getFullYear()}.`;
  const description = formatInline(String(firm.description || "").trim() || fallbackDescription);
  const reviews = Math.max(0, Number(firm.reviews || 0));
  const pageUrl = escapeHtml(offerPageUrl(firm));
  const visitUrl = escapeHtml(offerVisitUrl(firm) || offerPageUrl(firm));
  const ratingBadge = hasRating
    ? `<span class="rmp-offer-rate"><span class="rmp-offer-stars">${starString(ratingValue)}</span><span class="rmp-offer-score">${ratingText}</span></span><span class="rmp-offer-reviews">${reviews} reviews</span>`
    : `<span class="rmp-offer-rate"><span class="rmp-offer-stars">☆☆☆☆☆</span><span class="rmp-offer-score">New</span></span><span class="rmp-offer-reviews">No live reviews yet</span>`;

  return `
    <div class="rmp-offer-card">
      <div class="rmp-offer-main">
        <div class="rmp-offer-badge">
          <div class="rmp-offer-badge-in">
            <div class="rmp-offer-live">Live Offer</div>
            <div class="rmp-offer-discount">${discount}</div>
            <div class="rmp-offer-code">+ CODE ${escapeHtml(code)}</div>
          </div>
        </div>

        <div class="rmp-offer-info">
          <div class="rmp-offer-head">
            <a href="${pageUrl}" class="rmp-offer-logo" aria-label="${safeName} offer page">
              <img fetchpriority="low" src="${safeLogo}" alt="${safeName}" onerror="this.src='${logoFallback(name)}'" loading="lazy" decoding="async" width="120" height="120">
            </a>
            <div style="min-width:0;flex:1">
              <h3 class="rmp-offer-name"><a href="${pageUrl}">${safeName}</a></h3>
              <div class="rmp-offer-meta">
                ${ratingBadge}
              </div>
            </div>
          </div>
          <p class="rmp-offer-desc">${description}</p>
        </div>
      </div>

      <div class="rmp-offer-actions">
        <div class="rmp-code-wrap">
          <span class="rmp-code-label">Code</span>
          <span class="rmp-code-value">${escapeHtml(code)}</span>
          <button class="rmp-copy-btn copy-btn" data-code="${escapeHtml(code)}" aria-label="Copy code">
            <i data-lucide="copy" class="w-4 h-4"></i>
          </button>
        </div>

        <a class="rmp-offer-visit visit-btn" href="${visitUrl}" target="_blank" rel="noopener sponsored">
          Visit
        </a>
      </div>
    </div>`;
}

function bindCardEvents(root) {
  root.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => copyCode(btn.dataset.code || "RMP"));
  });
}

function loadingCardHtml() {
  return `
    <div class="rmp-offer-skel">
      <div class="rmp-skel-row" style="flex:1;min-width:0">
        <div class="rmp-skel-box rmp-load-block" style="width:102px;height:98px"></div>
        <div style="flex:1;min-width:0">
          <div class="rmp-skel-box rmp-load-block" style="width:220px;max-width:80%;height:28px;margin-bottom:10px"></div>
          <div class="rmp-skel-box rmp-load-block" style="width:140px;height:22px;margin-bottom:12px"></div>
          <div class="rmp-skel-box rmp-load-block" style="width:100%;height:12px;margin-bottom:8px"></div>
          <div class="rmp-skel-box rmp-load-block" style="width:84%;height:12px"></div>
        </div>
      </div>
      <div class="rmp-skel-row" style="justify-content:flex-end">
        <div class="rmp-skel-box rmp-load-block" style="width:124px;height:40px"></div>
        <div class="rmp-skel-box rmp-load-block" style="width:96px;height:40px"></div>
      </div>
    </div>`;
}

function renderLoading() {
  const container = document.getElementById("offersContainer");
  if (!container) return;
  ensureLoaderStyle();
  container.innerHTML = new Array(6).fill(0).map(loadingCardHtml).join("");
  const pageIndicator = document.getElementById("pageIndicator");
  if (pageIndicator) pageIndicator.textContent = "Loading...";
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
}

function render() {
  if (state.loading) {
    renderLoading();
    return;
  }
  const container = document.getElementById("offersContainer");
  if (!container) return;

  applyFilters();

  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.rowsPerPage));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const start = (state.page - 1) * state.rowsPerPage;
  const rows = state.filtered.slice(start, start + state.rowsPerPage);

  container.innerHTML = rows.length
    ? rows.map(cardHtml).join("")
    : '<div class="glass-card p-8 text-center text-gray-300">No offers matched your search.</div>';

  bindCardEvents(container);

  const pageIndicator = document.getElementById("pageIndicator");
  if (pageIndicator) pageIndicator.textContent = `Page ${state.page} of ${totalPages}`;

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (prevBtn) prevBtn.disabled = state.page <= 1;
  if (nextBtn) nextBtn.disabled = state.page >= totalPages;

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function setMonthLabel() {
  const el = document.getElementById("forex-text");
  if (!el) return;
  const month = new Date().toLocaleString("default", { month: "long" });
  el.textContent = `Exclusive ${month} Forex Offers`;
}

function bindGlobalHandlers() {
  window.filterOffers = (cat) => {
    state.filter = cat;
    state.page = 1;
    document.querySelectorAll('button[id^="tab-"]').forEach((btn) => btn.classList.remove("active-tab"));
    const active = document.getElementById(`tab-${cat}`);
    if (active) active.classList.add("active-tab");
    render();
  };

  window.searchFirms = () => {
    const input = document.getElementById("searchInput");
    state.q = input ? input.value : "";
    state.page = 1;
    render();
  };

  window.changePage = (dir) => {
    state.page += dir;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.copyOnly = copyCode;
  window.handleVisit = () => {};
}

async function init() {
  bindGlobalHandlers();
  ensureOfferCardStyles();
  setMonthLabel();
  renderLoading();
  const [, offers] = await Promise.all([wait(UX_DELAY_MS), getAllOffers()]);
  state.offers = offers;
  ensureDedicatedHero(offers);
  state.loading = false;
  render();
}

document.addEventListener("DOMContentLoaded", init);
