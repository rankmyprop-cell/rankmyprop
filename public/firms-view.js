import { getFirmsByType, regionKey, bestCategoryKey } from "./firms-service.js";
import { db } from "./dashboard-common.js";
import { collection, doc, getDoc, getDocs, limit, query, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { escapeHtml, formatInline } from "./text-format.js";

const page = (window.location.pathname.split("/").pop() || "").toLowerCase();
const BEST_PAGE_FILE_HINTS = [
  "best-prop-firms-2026",
  "fast-payout-prop-firms",
  "best-instant-funding-firms",
  "best-hft-prop-firms",
  "best-futures-prop-firms",
  "cheapest-prop-firms",
  "most-trusted-prop-firms",
  "beginner-friendly-firms",
  "highest-rated-firms"
];
const listingType = (page.includes("bestprop") || page.includes("best-prop") || /^best/.test(page) || BEST_PAGE_FILE_HINTS.some((x) => page.includes(x))) ? "best" : "listed";

const BEST_PAGE_HINTS = [
  { hint: "best-prop-firms-2026", key: "", title: "Best Prop Firms 2026" },
  { hint: "fast-payout-prop-firms", key: "fast_payout", title: "Fast Payout Prop Firms" },
  { hint: "best-instant-funding-firms", key: "instant_funding", title: "Best Instant Funding Firms" },
  { hint: "best-hft-prop-firms", key: "hft", title: "Best HFT Prop Firms" },
  { hint: "best-futures-prop-firms", key: "futures", title: "Best Futures Prop Firms" },
  { hint: "cheapest-prop-firms", key: "cheapest", title: "Cheapest Prop Firms" },
  { hint: "most-trusted-prop-firms", key: "trusted", title: "Most Trusted Prop Firms" },
  { hint: "beginner-friendly-firms", key: "beginner", title: "Beginner Friendly Firms" },
  { hint: "highest-rated-firms", key: "highest_rated", title: "Highest Rated Firms" }
];

function getBestRegionFromUrl() {
  if (listingType !== "best") return "";
  const u = new URL(window.location.href);
  let raw =
    u.searchParams.get("region") ||
    u.searchParams.get("bestRegion") ||
    u.searchParams.get("countryPage") ||
    "";
  if (!raw) {
    const file = String(window.location.pathname.split("/").pop() || "").toLowerCase();
    const hints = [
      "india",
      "nigeria",
      "south-africa",
      "pakistan",
      "australia",
      "china",
      "us",
      "uk"
    ];
    const found = hints.find((h) => file.includes(h));
    if (found) raw = found;
  }
  return regionKey(raw);
}

const bestRegion = getBestRegionFromUrl();

function getBestCategoryFromUrl() {
  if (listingType !== "best") return { key: "", title: "" };
  const u = new URL(window.location.href);
  const raw = u.searchParams.get("cat") || u.searchParams.get("category") || "";
  const byQuery = bestCategoryKey(raw);
  if (byQuery) {
    const match = BEST_PAGE_HINTS.find((x) => x.key === byQuery);
    return { key: byQuery, title: match?.title || "Best Prop Firms" };
  }
  const file = String(window.location.pathname.split("/").pop() || "").toLowerCase();
  const byFile = BEST_PAGE_HINTS.find((x) => file.includes(x.hint));
  if (byFile) return { key: byFile.key, title: byFile.title };
  return { key: "", title: "" };
}

const bestCategory = getBestCategoryFromUrl();

function applyBestHeading() {
  if (listingType !== "best" || !bestCategory.title) return;
  if (!document.title || /Rank My Prop/i.test(document.title)) {
    document.title = `${bestCategory.title} | Rank My Prop`;
  }
}

const state = {
  firms: [],
  filtered: [],
  page: 1,
  perPage: 9,
  loading: true
};
const UX_DELAY_MS = 2000;
const EXCLUDED_LISTING_SLUGS = new Set(["blue-guardian"]);

function isExcludedListingFirm(firm = {}) {
  return EXCLUDED_LISTING_SLUGS.has(slugify(firm.slug || firm.name || firm.id || ""));
}

function rankVal(f = {}) {
  const r = Number(f.ranking);
  if (Number.isFinite(r) && r > 0) return r;
  const s = Number(f.sortOrder);
  if (Number.isFinite(s) && s > 0) return s;
  return 999999;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureLoaderStyle() {
  if (document.getElementById("rmpLoaderFx")) return;
  const style = document.createElement("style");
  style.id = "rmpLoaderFx";
  style.textContent = [
    "@keyframes rmpFirmShimmer{0%{transform:translateX(-115%)}100%{transform:translateX(115%)}}",
    "@keyframes rmpFirmBreathe{0%,100%{border-color:rgba(139,124,255,.14);box-shadow:0 18px 42px rgba(0,0,0,.22)}50%{border-color:rgba(139,124,255,.28);box-shadow:0 22px 52px rgba(72,54,190,.12)}}",
    ".pf-loading-card{position:relative;isolation:isolate;min-height:336px;padding:20px!important;background:linear-gradient(145deg,rgba(20,19,34,.96),rgba(11,10,20,.98))!important;border:1px solid rgba(139,124,255,.15)!important;border-radius:18px!important;overflow:hidden!important;animation:rmpFirmBreathe 2.8s ease-in-out infinite}",
    ".pf-loading-card:before{content:'';position:absolute;z-index:-1;inset:-40% 42% 35% -20%;background:radial-gradient(circle,rgba(105,83,255,.17),transparent 68%);pointer-events:none}",
    ".pf-loading-card:after{content:'';position:absolute;z-index:3;top:0;bottom:0;width:46%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.055),transparent);transform:translateX(-115%);animation:rmpFirmShimmer 1.65s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}",
    ".pf-loading-card:nth-child(2n):after{animation-delay:.18s}.pf-loading-card:nth-child(3n):after{animation-delay:.34s}",
    ".pf-load-top{display:flex;align-items:center;gap:13px;padding-bottom:17px;border-bottom:1px solid rgba(255,255,255,.065)}",
    ".pf-load-logo{width:54px;height:54px;flex:0 0 54px;border-radius:14px;background:linear-gradient(145deg,rgba(151,132,255,.24),rgba(83,65,194,.09));box-shadow:inset 0 0 0 1px rgba(177,164,255,.12)}",
    ".pf-load-identity{flex:1;display:grid;gap:8px}",
    ".pf-load-line,.pf-load-pill,.pf-load-stat,.pf-load-detail,.pf-load-btn{background:rgba(255,255,255,.075)}",
    ".pf-load-line{height:10px;border-radius:999px}.pf-load-line--title{width:61%;height:15px;background:rgba(255,255,255,.14)}.pf-load-line--rating{width:43%}",
    ".pf-load-pills{display:flex;gap:7px;margin:15px 0}.pf-load-pill{width:66px;height:22px;border-radius:7px}.pf-load-pill:last-child{width:48px;background:rgba(129,103,255,.13)}",
    ".pf-load-copy{display:grid;gap:8px;margin-bottom:17px}.pf-load-copy .pf-load-line:first-child{width:92%}.pf-load-copy .pf-load-line:last-child{width:68%}",
    ".pf-load-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:17px}.pf-load-stat{height:58px;border-radius:11px;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)}",
    ".pf-load-details{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:18px}.pf-load-detail{height:29px;border-radius:8px;background:rgba(255,255,255,.045)}",
    ".pf-load-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto}.pf-load-btn{height:42px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.045)}.pf-load-btn:last-child{background:linear-gradient(135deg,rgba(114,86,255,.3),rgba(88,64,221,.17))}",
    "@media(max-width:640px){.pf-loading-card{min-height:328px;padding:18px!important}.pf-load-details{grid-template-columns:1fr}.pf-load-detail:nth-child(n+3){display:none}.pf-load-actions{grid-template-columns:1fr}}",
    "@media(prefers-reduced-motion:reduce){.pf-loading-card,.pf-loading-card:after{animation:none!important}}"
  ].join("");
  document.head.appendChild(style);
}

function ensureCardLayoutFixStyle() {
  if (document.getElementById("rmpCardLayoutFix")) return;
  const style = document.createElement("style");
  style.id = "rmpCardLayoutFix";
  style.textContent = [
    ".container{max-width:1580px !important;padding-left:20px !important;padding-right:20px !important}",
    "#grid.grid{display:grid !important;grid-template-columns:repeat(3,minmax(0,1fr)) !important;gap:24px !important;align-items:stretch !important;padding:2px 0 !important}",
    "#grid.grid>*{min-width:0 !important}",
    ".pf-card{width:100% !important;display:flex !important;flex-direction:column !important;height:100% !important;min-width:0 !important;margin:0 !important;box-sizing:border-box !important;overflow:hidden !important}",
    ".pf-card *{min-width:0 !important}",
    ".pf-tagline{min-height:40px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}",
    ".pf-details-grid{flex:1 1 auto}",
    ".pf-btn-row{margin-top:auto !important}",
    ".pf-stats-row{display:grid !important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:start}",
    ".pf-stat-item{min-width:0;gap:6px}",
    ".pf-stat-item>div:last-child{min-width:0}",
    ".pf-stat-sep{display:none !important}",
    ".pf-stat-val{max-width:none !important;font-size:13px}",
    ".pf-stat-label{letter-spacing:.35px;line-height:1.15}",
    ".pf-tagline{overflow-wrap:anywhere}",
    ".pf-detail-row{display:grid!important;grid-template-columns:22px minmax(0,1fr)!important;grid-template-rows:auto auto;column-gap:7px!important;row-gap:2px!important;align-items:center!important}",
    ".pf-detail-icon{grid-column:1;grid-row:1/3}",
    ".pf-detail-label{grid-column:2;grid-row:1;min-width:0;white-space:normal!important;line-height:1.18;overflow-wrap:normal!important;word-break:normal!important}",
    ".pf-detail-val{grid-column:2;grid-row:2;min-width:0;max-width:none!important;margin-left:0!important;white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis;line-height:1.25;overflow-wrap:normal!important;word-break:normal!important}",
    ".pf-firm-link,.pf-reviews-link{text-decoration:none}",
    ".pf-firm-link{color:#fff}",
    ".pf-firm-link:hover{color:#cbc4ff}",
    ".pf-reviews-link{color:inherit}",
    ".pf-reviews-link:hover{color:#cbc4ff}",
    "@media(max-width:1280px){#grid.grid{grid-template-columns:repeat(3,minmax(0,1fr)) !important}}",
    "@media(max-width:980px){#grid.grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:18px !important}.container{padding-left:16px !important;padding-right:16px !important}.pf-card{padding:18px !important}}",
    "@media(max-width:880px){.pf-stat-val{font-size:12px}.pf-stat-icon{width:30px;height:30px}}",
    "@media(max-width:640px){#grid.grid{grid-template-columns:minmax(0,1fr) !important;gap:16px !important}.container{padding-left:16px !important;padding-right:16px !important}.pf-card{padding:16px !important}.pf-tagline{min-height:auto}.pf-stats-row{grid-template-columns:repeat(3,minmax(0,1fr)) !important}.pf-btn-row{display:grid !important;grid-template-columns:1fr !important}.pf-btn{width:100%}}"
  ].join("");
  document.head.appendChild(style);
}

function slugify(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function safeLogo(firm) {
  if (firm.logo) return firm.logo;
  const name = encodeURIComponent((firm.name || "Logo").split(" ").slice(0, 2).join(" "));
  return `https://dummyimage.com/100x100/0b0b12/7c5cff&text=${name}`;
}

function safeBanner(firm) {
  const src = String(firm.banner || "").trim();
  const isGenericPlaceholder =
    !src ||
    /dummyimage\.com/i.test(src) ||
    /banner(?:\+|%20)?image/i.test(src) ||
    /text=/i.test(src);
  if (!isGenericPlaceholder) return src;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 280'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#151226'/>
        <stop offset='55%' stop-color='#19163a'/>
        <stop offset='100%' stop-color='#0c0b14'/>
      </linearGradient>
      <linearGradient id='line' x1='0' y1='0' x2='1' y2='0'>
        <stop offset='0%' stop-color='#7a74ff' stop-opacity='0.65'/>
        <stop offset='100%' stop-color='#7a74ff' stop-opacity='0.06'/>
      </linearGradient>
      <radialGradient id='orb1' cx='16%' cy='22%' r='38%'>
        <stop offset='0%' stop-color='#8f8aff' stop-opacity='.35'/>
        <stop offset='100%' stop-color='#8f8aff' stop-opacity='0'/>
      </radialGradient>
      <radialGradient id='orb2' cx='85%' cy='84%' r='42%'>
        <stop offset='0%' stop-color='#6a63ff' stop-opacity='.24'/>
        <stop offset='100%' stop-color='#6a63ff' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='1200' height='280' fill='url(#g)'/>
    <rect x='24' y='24' width='1152' height='232' rx='14' fill='none' stroke='rgba(255,255,255,.08)'/>
    <rect x='46' y='66' width='680' height='2.2' fill='url(#line)'/>
    <rect x='46' y='104' width='520' height='1.8' fill='url(#line)' opacity='.85'/>
    <rect x='46' y='138' width='760' height='1.5' fill='url(#line)' opacity='.55'/>
    <circle cx='192' cy='74' r='6' fill='#8b84ff'/>
    <circle cx='220' cy='74' r='6' fill='#6f68ff' opacity='.8'/>
    <rect x='980' y='44' width='132' height='36' rx='18' fill='rgba(122,116,255,.2)' stroke='rgba(178,174,255,.45)'/>
    <rect x='988' y='52' width='42' height='20' rx='10' fill='rgba(198,196,255,.35)'/>
    <rect x='1038' y='52' width='64' height='20' rx='10' fill='rgba(122,116,255,.42)'/>
    <rect x='930' y='206' width='198' height='1.6' fill='url(#line)'/>
    <circle cx='1015' cy='62' r='170' fill='url(#orb1)'/>
    <circle cx='986' cy='248' r='180' fill='url(#orb2)'/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function isProbablyHttpUrl(url = "") {
  return /^https?:\/\//i.test(String(url || "").trim());
}

function normalizeWebsiteUrl(site = "") {
  const s = String(site || "").trim();
  if (!s) return "";
  if (isProbablyHttpUrl(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}

function resolveBuyUrl(firm) {
  const raw = String(firm.buyLink || "").trim();
  // If older data still points to a local discount page, ignore it.
  if (raw && isProbablyHttpUrl(raw)) return raw;
  if (raw && /(?:^|\/)[a-z0-9-]+(?:discount|offer|coupon)\.html$/i.test(raw)) {
    return normalizeWebsiteUrl(firm.website);
  }
  if (raw && raw.includes("://")) return raw;
  // Otherwise fall back to firm website.
  return normalizeWebsiteUrl(firm.website);
}

function normalizeLabel(v = "") {
  return String(v || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function truncateWords(value = "", limit = 14) {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  const words = text.split(" ");
  return words.length > limit ? `${words.slice(0, limit).join(" ")}…` : text;
}

function readPairValue(rows, keys = []) {
  const list = Array.isArray(rows) ? rows : [];
  const targets = (Array.isArray(keys) ? keys : [keys]).map((k) => normalizeLabel(k)).filter(Boolean);
  for (const row of list) {
    const label = normalizeLabel(row?.label || row?.name || "");
    if (!label) continue;
    if (targets.some((k) => label.includes(k))) {
      const value = String(row?.value || "").trim();
      if (value) return value;
    }
  }
  return "";
}

function readProgValue(firm, key = "") {
  const first = Array.isArray(firm?.evaluationPrograms) ? firm.evaluationPrograms[0] : null;
  if (!first) return "";
  const v = String(first?.[key] || "").trim();
  return v;
}

function cardStats(firm) {
  const allocation =
    readPairValue(firm?.keyMetrics, ["allocation"]) ||
    readProgValue(firm, "allocation") ||
    "$100K";
  const leverage =
    readPairValue(firm?.tradingConditions, ["leverage"]) ||
    readPairValue(firm?.firmDetails, ["leverage"]) ||
    "1:100";
  const profitSplit =
    readPairValue(firm?.keyMetrics, ["profit split"]) ||
    readProgValue(firm, "split") ||
    "90%";
  return { allocation, leverage, profitSplit };
}

function cardDetails(firm) {
  const card = firm?.cardMetrics && typeof firm.cardMetrics === "object" ? firm.cardMetrics : {};
  const cardVal = (...vals) => {
    for (const v of vals) {
      const s = String(v ?? "").trim();
      if (!s) continue;
      const low = s.toLowerCase();
      if (low === "-" || low === "n/a" || low === "na" || low === "null") continue;
      return s;
    }
    return "";
  };
  const prog = Array.isArray(firm?.evaluationPrograms) ? (firm.evaluationPrograms[0] || {}) : {};
  const progRead = (...keys) => {
    for (const k of keys) {
      const v = String(prog?.[k] || "").trim();
      if (v) return v;
    }
    return "";
  };
  const payoutCycle =
    cardVal(card.payoutCycle) ||
    readPairValue(firm?.keyMetrics, ["payout cycle", "first payout"]) ||
    readPairValue(firm?.tradingConditions, ["payout cycle", "payout"]) ||
    readPairValue(firm?.firmDetails, ["payout"]) ||
    progRead("payoutCycle", "firstPayout", "payout", "payoutFrequency") ||
    "-";
  const newsTrading =
    cardVal(card.newsTrading) ||
    readPairValue(firm?.tradingConditions, ["news trading", "news"]) ||
    readPairValue(firm?.firmDetails, ["news trading"]) ||
    progRead("newsTrading", "news", "newsPolicy") ||
    "-";
  const minDays =
    cardVal(card.minTradingDays) ||
    readPairValue(firm?.tradingConditions, ["min trading days", "minimum trading days"]) ||
    readPairValue(firm?.firmDetails, ["min trading days", "minimum trading days"]) ||
    progRead("minTradingDays", "minimumTradingDays", "minDays") ||
    "-";
  const timeLimit =
    cardVal(card.timeLimit) ||
    readPairValue(firm?.tradingConditions, ["time limit", "maximum days"]) ||
    readPairValue(firm?.firmDetails, ["time limit", "max days", "maximum days"]) ||
    progRead("timeLimit", "maxDays", "maximumDays") ||
    "-";
  const startPrice =
    cardVal(card.startingPrice) ||
    readPairValue(firm?.firmDetails, ["starting price", "price", "fee"]) ||
    readPairValue(firm?.keyMetrics, ["starting price", "fee", "price"]) ||
    progRead("startingPrice", "price", "challengeFee", "fee") ||
    "-";
  const eaAllowed =
    cardVal(card.eaAllowed) ||
    readPairValue(firm?.tradingConditions, ["ea allowed", "expert advisor"]) ||
    readPairValue(firm?.firmDetails, ["ea allowed", "expert advisor"]) ||
    progRead("eaAllowed", "expertAdvisor", "ea") ||
    "-";
  return [
    { label: "Payout Cycle", val: payoutCycle, icon: "calendar" },
    { label: "News Trading", val: newsTrading, icon: "lightning" },
    { label: "Min Trading Days", val: minDays, icon: "shield" },
    { label: "Time Limit", val: timeLimit, icon: "clock" },
    { label: "Starting Price", val: startPrice, icon: "dollar" },
    { label: "EA Allowed", val: eaAllowed, icon: "shield" }
  ];
}

function formatReviewCount(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function detailHref(firm = {}) {
  const raw = String(firm.detailsLink || "").trim();
  const rawSlug = (() => {
    if (!raw) return "";
    try {
      const u = new URL(raw, window.location.origin);
      const qs = String(u.searchParams.get("slug") || u.searchParams.get("firmSlug") || "").trim();
      if (qs) return qs;
      const parts = String(u.pathname || "").split("/").filter(Boolean);
      if (parts[0] === "prop-firms" && parts[1]) return parts[1];
    } catch (_) {}
    const clean = raw.replace(/^\/+/, "").split("?")[0].split("#")[0].replace(/\.html$/i, "");
    if (!clean || clean.toLowerCase() === "firm-detail") return "";
    if (clean.toLowerCase().startsWith("prop-firms/")) return clean.split("/")[1] || "";
    return clean.replace(/detail$/i, "");
  })();
  const slug = slugify(rawSlug || firm.slug || firm.name || firm.id || "");
  const exportedDetailPages = {
    "aqua-funded": "aquafundeddetail.html",
    aquafunded: "aquafundeddetail.html",
    blueberry: "blueberrydetail.html",
    "blueberry-funded": "blueberryfundeddetail.html",
    blueberryfunded: "blueberryfundeddetail.html",
    "blue-guardian": "blueguardiandetail.html",
    blueguardian: "blueguardiandetail.html",
    "direct-funding-trader": "directfundingtraderdetail.html",
    directfundingtrader: "directfundingtraderdetail.html",
    "finotive-funding": "finotivefundingdetail.html",
    finotivefunding: "finotivefundingdetail.html",
    fundednext: "fundednextdetail.html",
    "funded-next": "fundednextdetail.html",
    "funder-pro": "funderprodetail.html",
    funderpro: "funderprodetail.html",
    "fx2-funding": "fx2fundingdetail.html",
    fx2funding: "fx2fundingdetail.html",
    fxify: "fxifydetail.html",
    "goat-funded-trader": "goatfundedtraderdetail.html",
    goatfundedtrader: "goatfundedtraderdetail.html",
    "instant-funding": "instantfundingdetail.html",
    instantfunding: "instantfundingdetail.html",
    "qt-funded": "qtfundeddetail.html",
    qtfunded: "qtfundeddetail.html",
    "sway-funded": "swayfundeddetail.html",
    swayfunded: "swayfundeddetail.html",
    "the-prop-trade": "theproptradedetail.html",
    theproptrade: "theproptradedetail.html",
    "top-one-trader": "toponetraderdetail.html",
    toponetrader: "toponetraderdetail.html",
    "trader-scale": "traderscaledetail.html",
    traderscale: "traderscaledetail.html",
    "we-fund": "wefunddetail.html",
    wefund: "wefunddetail.html"
  };
  if (exportedDetailPages[slug]) return exportedDetailPages[slug];
  return slug ? `firm-detail.html?slug=${encodeURIComponent(slug)}` : "firm-detail.html";
}

function reviewHref(firm = {}) {
  const slug = slugify(firm.slug || firm.name || firm.id || "");
  return slug
    ? `firm-detail.html?slug=${encodeURIComponent(slug)}#detailReviewsPanel`
    : "firm-detail.html#detailReviewsPanel";
}

async function loadLiveReviewStats() {
  const map = new Map();
  const setStat = (key, avg, count) => {
    const slug = slugify(key || "");
    const n = Math.max(0, Number(count) || 0);
    const a = Math.max(0, Math.min(5, Number(avg) || 0));
    if (!slug || (!n && !a)) return;
    map.set(slug, { count: n, sum: a * Math.max(1, n) });
  };

  try {
    const statsSnap = await getDocs(collection(db, "firmRatingStats"));
    statsSnap.forEach((d) => {
      const row = d.data() || {};
      const avg = row.averageRating ?? row.autoAverageRating ?? row.manualAverageRating;
      const count = row.reviewCount ?? row.autoReviewCount ?? row.manualReviewCount;
      setStat(d.id, avg, count);
      setStat(row.firmSlug, avg, count);
      setStat(row.firmName, avg, count);
    });
  } catch (_) {}

  const approvedStatuses = ["Approved", "approved", "Published", "published", "Publish", "publish"];
  const seen = new Set();
  for (const status of approvedStatuses) {
    try {
      const snap = await getDocs(query(collection(db, "reviews"), where("status", "==", status), limit(1200)));
      snap.forEach((d) => {
        if (seen.has(d.id)) return;
        seen.add(d.id);
        const row = d.data() || {};
        const slug = slugify(row.firmSlug || row.firmName || row.firm || "");
        if (!slug || map.has(slug)) return;
        const cur = map.get(slug) || { count: 0, sum: 0 };
        const rating = Number(row.rating ?? row.overallRating ?? 0);
        cur.count += 1;
        cur.sum += Number.isFinite(rating) ? rating : 0;
        map.set(slug, cur);
      });
    } catch (_) {}
  }

  return map;
}

function starsHtml(score) {
  const n = Math.max(0, Math.min(5, Number(score) || 0));
  let out = "";
  for (let i = 1; i <= 5; i += 1) {
    const full = i <= Math.floor(n) || (i === Math.ceil(n) && (n % 1) >= 0.3);
    out += `<span class="pf-star${full ? "" : " off"}">★</span>`;
  }
  return out;
}

const ICONS = {
  dollar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9.5c0-1.1.9-2 2-2h2a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h2a2 2 0 0 0 2-2"/></svg>`,
  scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 9l9-6 9 6M5 19h14M5 19l-2-6h4L5 19zm14 0l2-6h-4l2 6z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  lightning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  check: `<svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

function renderPagination() {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i += 1) {
    const btn = document.createElement("div");
    btn.className = `page-btn${i === state.page ? " active" : ""}`;
    btn.textContent = String(i);
    btn.addEventListener("click", () => {
      state.page = i;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pagination.appendChild(btn);
  }
}

function render() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  if (state.loading) {
    ensureLoaderStyle();
    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = new Array(state.perPage).fill(0).map(() => `
      <div class="pf-card pf-loading-card" aria-hidden="true">
        <div class="pf-load-top">
          <div class="pf-load-logo"></div>
          <div class="pf-load-identity">
            <div class="pf-load-line pf-load-line--title"></div>
            <div class="pf-load-line pf-load-line--rating"></div>
          </div>
        </div>
        <div class="pf-load-pills">
          <div class="pf-load-pill"></div>
          <div class="pf-load-pill"></div>
        </div>
        <div class="pf-load-copy">
          <div class="pf-load-line"></div>
          <div class="pf-load-line"></div>
        </div>
        <div class="pf-load-stats">
          <div class="pf-load-stat"></div>
          <div class="pf-load-stat"></div>
          <div class="pf-load-stat"></div>
        </div>
        <div class="pf-load-details">
          <div class="pf-load-detail"></div>
          <div class="pf-load-detail"></div>
          <div class="pf-load-detail"></div>
          <div class="pf-load-detail"></div>
        </div>
        <div class="pf-load-actions">
          <div class="pf-load-btn"></div>
          <div class="pf-load-btn"></div>
        </div>
      </div>
    `).join("");
    const pagination = document.getElementById("pagination");
    if (pagination) pagination.innerHTML = '<div class="page-btn active">Loading...</div>';
    return;
  }

  grid.removeAttribute("aria-busy");
  const start = (state.page - 1) * state.perPage;
  const rows = state.filtered.slice(start, start + state.perPage);

  if (!rows.length) {
    grid.innerHTML = '<div class="pf-empty">No firms found. Admin panel se firms add karo.</div>';
    renderPagination();
    return;
  }

  grid.innerHTML = rows.map((f) => {
    const tags = Array.isArray(f.tags) ? f.tags : [];
    const markets = Array.isArray(f.markets) ? f.markets : [];
    const cardDetailHref = detailHref(f);
    const cardReviewHref = reviewHref(f);
    const buyHref = resolveBuyUrl(f);
    const hasAssurance = f.payoutAssurance ?? f.verified;
    const fullBio = String(f.bio || f.overviewShort || "").replace(/\s+/g, " ").trim();
    const bio = formatInline(truncateWords(fullBio, 14));
    const rating = Math.max(0, Math.min(5, Number(f.score || 0)));
    const reviews = formatReviewCount(f.reviewCount);
    const badgeMarket = String(markets[0] || tags[0] || "CFDs").toUpperCase();
    const stats = cardStats(f);
    const details = cardDetails(f);
    const logoSrc = safeLogo(f);
    const detailRows = details.map((d) => `
      <div class="pf-detail-row">
        <div class="pf-detail-icon">${ICONS[d.icon] || ICONS.shield}</div>
        <span class="pf-detail-label">${escapeHtml(d.label)}</span>
        <span class="pf-detail-val" title="${escapeHtml(d.val || "-")}">${escapeHtml(d.val || "-")}</span>
      </div>
    `).join("");
    return `
      <div class="pf-card">
        <div class="pf-card-header">
          <div class="pf-header-left">
            <div class="pf-logo">
              <img fetchpriority="low" src="${logoSrc}" alt="${escapeHtml(f.name)} logo" loading="lazy" decoding="async" width="120" height="120">
            </div>
            <div class="pf-title-wrap">
              <div class="pf-firm-name-row">
                <a class="pf-firm-name pf-firm-link" href="${cardDetailHref}">${escapeHtml(f.name)}</a>
                ${hasAssurance ? `<div class="pf-tick-wrap"><div class="pf-tick">${ICONS.check}</div><div class="pf-tooltip"><span class="dot"></span>Payout Assurance Enabled</div></div>` : ""}
              </div>
              <div class="pf-rating-row">
                <span class="pf-rating-num">${rating ? rating.toFixed(1) : "0.0"}</span>
                <div class="pf-stars">${starsHtml(rating)}</div>
                <a class="pf-reviews pf-reviews-link" href="${cardReviewHref}">${escapeHtml(reviews)} reviews</a>
              </div>
            </div>
          </div>
        </div>
        <div class="pf-badges">
          <span class="pf-badge pf-badge-verified">VERIFIED</span>
          <span class="pf-badge pf-badge-market">${escapeHtml(badgeMarket)}</span>
        </div>
        <div class="pf-tagline" title="${escapeHtml(fullBio)}">${bio}</div>
        <div class="pf-divider"></div>
        <div class="pf-stats-row">
          <div class="pf-stat-item">
            <div class="pf-stat-icon">${ICONS.dollar}</div>
            <div><div class="pf-stat-val">${escapeHtml(stats.allocation)}</div><div class="pf-stat-label">Allocation</div></div>
          </div>
          <div class="pf-stat-sep"></div>
          <div class="pf-stat-item">
            <div class="pf-stat-icon">${ICONS.scale}</div>
            <div><div class="pf-stat-val">${escapeHtml(stats.leverage)}</div><div class="pf-stat-label">Leverage</div></div>
          </div>
          <div class="pf-stat-sep"></div>
          <div class="pf-stat-item">
            <div class="pf-stat-icon">${ICONS.clock}</div>
            <div><div class="pf-stat-val">${escapeHtml(stats.profitSplit)}</div><div class="pf-stat-label">Profit Split</div></div>
          </div>
        </div>
        <div class="pf-divider"></div>
        <div class="pf-details-grid">${detailRows}</div>
        <div class="pf-divider"></div>
        <div class="pf-btn-row">
          <a class="pf-btn pf-btn-outline" href="${escapeHtml(buyHref || "#")}" target="_blank" rel="noopener noreferrer">View Firm</a>
          <a class="pf-btn pf-btn-primary" href="${cardDetailHref}">View Details</a>
        </div>
      </div>`;
  }).join("");

  renderPagination();
}

function applyFilters() {
  const search = String(document.getElementById("search")?.value || "").toLowerCase();
  const sort = String(document.getElementById("sort")?.value || "ranking");
  const country = String(document.getElementById("country")?.value || "all");
  const tag = String(document.getElementById("tag")?.value || "all");

  state.filtered = state.firms.filter((f) => {
    const bySearch = f.name.toLowerCase().includes(search);
    const byCountry = country === "all" || f.country === country;
    const byTag = tag === "all" || (f.tags || []).includes(tag);
    return bySearch && byCountry && byTag;
  });

  if (sort === "followers") {
    state.filtered.sort((a, b) => Number(b.followers || 0) - Number(a.followers || 0));
  } else if (sort === "name") {
    state.filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    state.filtered.sort((a, b) => rankVal(a) - rankVal(b));
  }

  state.page = 1;
  render();
}

function bindFilters() {
  ["search", "sort", "country", "tag"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = id === "search" ? "input" : "change";
    el.addEventListener(evt, applyFilters);
  });
}

function setOptions(select, options, defaultValue) {
  if (!select) return;
  select.innerHTML = "";
  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    if (defaultValue && opt.value === defaultValue) o.selected = true;
    select.appendChild(o);
  });
}

async function loadFilterOptions() {
  const sortEl = document.getElementById("sort");
  const countryEl = document.getElementById("country");
  const tagEl = document.getElementById("tag");
  if (!sortEl || !countryEl) return;

  const fallbackSortOptions = [
    { value: "ranking", label: "Sort: Ranking" },
    { value: "name", label: "Sort: Name" },
    { value: "followers", label: "Sort: Followers" }
  ];
  setOptions(sortEl, fallbackSortOptions, "ranking");

  try {
    const snap = await getDoc(doc(db, "firmFilters", "default"));
    if (!snap.exists()) return;
    const data = snap.data() || {};

    const sortOptions = Array.isArray(data.sortOptions) && data.sortOptions.length
      ? data.sortOptions.map((o) => ({ value: String(o.value || "").trim(), label: String(o.label || "").trim() })).filter((o) => o.value)
      : fallbackSortOptions;
    const hasRanking = sortOptions.some((o) => o.value === "ranking");
    const safeSortOptions = hasRanking ? sortOptions : [{ value: "ranking", label: "Sort: Ranking" }, ...sortOptions];

    const countries = listingType === "best" ? (data.bestCountries || []) : (data.listedCountries || []);
    const tags = listingType === "best" ? (data.bestTags || []) : (data.listedTags || []);

    const countryOptions = [{ value: "all", label: "All Countries" }].concat(
      countries.map((c) => ({ value: String(c || "").trim(), label: String(c || "").trim() })).filter((c) => c.value)
    );
    const tagOptions = [{ value: "all", label: "All Tags" }].concat(
      tags.map((t) => ({ value: String(t || "").trim(), label: String(t || "").trim() })).filter((t) => t.value)
    );

    setOptions(sortEl, safeSortOptions, "ranking");
    if (countryOptions.length) setOptions(countryEl, countryOptions, "all");
    if (tagEl && tagOptions.length) setOptions(tagEl, tagOptions, "all");
  } catch (err) {
    console.warn("filter options load failed:", err?.message || err);
  }
}

async function init() {
  bindFilters();
  ensureCardLayoutFixStyle();
  applyBestHeading();
  const hasStaticFirstPaint = document.getElementById("grid")?.dataset.rmpStaticFirstPaint === "true";
  if (!hasStaticFirstPaint) render();
  const [, , firms, liveReviewStats] = await Promise.all([
    wait(UX_DELAY_MS),
    loadFilterOptions(),
    getFirmsByType(listingType, { bestRegion, bestCategory: bestCategory.key }),
    loadLiveReviewStats()
  ]);
  state.firms = firms.filter((firm) => !isExcludedListingFirm(firm)).map((firm) => {
    const key = slugify(firm.slug || firm.name || firm.id || "");
    const live = liveReviewStats.get(key);
    if (!live) return firm;
    return {
      ...firm,
      reviewCount: live.count,
      score: live.count ? Math.max(0, Math.min(5, live.sum / live.count)) : firm.score
    };
  });
  state.filtered = [...state.firms];
  state.loading = false;
  applyFilters();
}

document.addEventListener("DOMContentLoaded", init);
