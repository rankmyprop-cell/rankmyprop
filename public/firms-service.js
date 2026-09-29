import { listDocuments } from "./cloudflare-data.js";
import { DEFAULT_LISTED_FIRMS, DEFAULT_BEST_FIRMS } from "./firms-data.js";
import { withFirmFieldOverridesList } from "./firm-field-overrides.js";

const BEST_REGIONS = [
  "india",
  "nigeria",
  "south_africa",
  "pakistan",
  "australia",
  "china",
  "us",
  "uk"
];

const BEST_CATEGORIES = [
  "fast_payout",
  "instant_funding",
  "hft",
  "futures",
  "cheapest",
  "trusted",
  "beginner",
  "highest_rated"
];

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function detailPathFor(row = {}) {
  const raw = String(row.detailsLink || "").trim();
  const id = String(row.id || "").trim();
  const rawSlug = (() => {
    if (!raw) return "";
    try {
      const u = new URL(raw, "https://www.rankmyprop.in");
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
  // The public name/slug is canonical. Legacy detail filenames such as
  // blueberryfundeddetail.html intentionally do not define the route slug.
  const slug = slugify(row.slug || row.name || rawSlug || id || "");
  return slug ? `/prop-firms/${encodeURIComponent(slug)}` : "/firm-detail";
}

function regionKey(text = "") {
  const k = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!k) return "";
  if (k === "usa" || k === "united_states" || k === "united_states_of_america") return "us";
  if (k === "united_kingdom" || k === "great_britain" || k === "britain") return "uk";
  if (k === "southafrica") return "south_africa";
  return k;
}

function bestCategoryKey(text = "") {
  const k = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!k) return "";
  const map = {
    fast_payout_prop_firms: "fast_payout",
    fast_payout: "fast_payout",
    best_instant_funding_firms: "instant_funding",
    instant_funding: "instant_funding",
    best_hft_prop_firms: "hft",
    hft: "hft",
    best_futures_prop_firms: "futures",
    futures: "futures",
    cheapest_prop_firms: "cheapest",
    cheapest: "cheapest",
    most_trusted_prop_firms: "trusted",
    trusted: "trusted",
    beginner_friendly_firms: "beginner",
    beginner: "beginner",
    highest_rated_firms: "highest_rated",
    highest_rated: "highest_rated"
  };
  return map[k] || (BEST_CATEGORIES.includes(k) ? k : "");
}

function pickRegionFlags(row = {}) {
  const src = row.bestRegions && typeof row.bestRegions === "object" ? row.bestRegions : {};
  const out = {};
  BEST_REGIONS.forEach((k) => {
    out[k] = Boolean(src[k]);
  });
  return out;
}

function pickCategoryFlags(row = {}) {
  const src = row.bestCategories && typeof row.bestCategories === "object" ? row.bestCategories : {};
  const out = {};
  BEST_CATEGORIES.forEach((k) => {
    out[k] = Boolean(src[k]);
  });
  return out;
}

function parseIsoOrNull(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function cleanMetric(v = "") {
  return String(v ?? "").trim();
}

function rankingValue(row = {}) {
  const rank = Number(row.ranking);
  if (Number.isFinite(rank) && rank > 0) return rank;
  const legacy = Number(row.sortOrder);
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  return 999999;
}

function normalizeCardMetrics(row = {}) {
  const src = row.cardMetrics && typeof row.cardMetrics === "object" ? row.cardMetrics : {};
  return {
    payoutCycle: cleanMetric(src.payoutCycle),
    minTradingDays: cleanMetric(src.minTradingDays),
    newsTrading: cleanMetric(src.newsTrading),
    timeLimit: cleanMetric(src.timeLimit),
    eaAllowed: cleanMetric(src.eaAllowed),
    startingPrice: cleanMetric(src.startingPrice)
  };
}

function isVisibleNow(row = {}) {
  if (row.active === false) return false;

  const state = String(row.publishState || row.status || "published").toLowerCase();
  if (state === "draft") return false;

  const until = parseIsoOrNull(row.unpublishUntil);
  if (state === "unpublished") {
    if (!until) return false;
    return Date.now() >= until.getTime();
  }

  const publishAt = parseIsoOrNull(row.publishAt);
  if (publishAt && Date.now() < publishAt.getTime()) return false;

  return true;
}

function isVisibleOnSurface(row = {}, surface = "listing") {
  const key = String(surface || "listing").trim().toLowerCase();
  if (key === "profile") return row.showFirmProfile !== false;
  if (key === "home") return row.showHomeTable !== false;
  if (key === "rules") return row.showRules !== false;
  if (key === "reviews") return row.showReviews !== false;
  if (key === "offers") return row.showOffers !== false;
  return true;
}

function norm(row = {}) {
  const slug = String(row.slug || "").trim() || slugify(row.name || row.id || "");
  const legacyType = String(row.listingType || "").toLowerCase();
  const regionFlags = pickRegionFlags(row);
  const categoryFlags = pickCategoryFlags(row);
  const showListed = typeof row.showListed === "boolean" ? row.showListed : legacyType === "listed";
  const showBestGlobal = typeof row.showBestGlobal === "boolean" ? row.showBestGlobal : legacyType === "best";

  return {
    id: row.id || slug,
    slug,
    name: String(row.name || "").trim(),
    listingType: legacyType || (showBestGlobal ? "best" : "listed"),
    handle: String(row.handle || "").trim(),
    bio: String(row.bio || "").trim(),
    website: String(row.website || "").trim(),
    country: String(row.country || "Global").trim(),
    tags: Array.isArray(row.tags) ? row.tags.map((x) => String(x || "").trim()).filter(Boolean) : [],
    verified: Boolean(row.verified),
    payoutAssurance: typeof row.payoutAssurance === "boolean" ? row.payoutAssurance : Boolean(row.verified),
    followers: Number(row.followers || 0),
    updatedAt: row.updatedAt || row.createdAt || "",
    detailsLink: detailPathFor(row),
    buyLink: String(row.buyLink || "").trim(),
    logo: String(row.logo || "").trim(),
    banner: String(row.banner || "").trim(),
    ceo: String(row.ceo || "").trim(),
    founded: String(row.founded || "").trim(),
    markets: Array.isArray(row.markets) ? row.markets.map((x) => String(x || "").trim()).filter(Boolean) : [],
    headquarters: String(row.headquarters || "").trim(),
    metaHeadquarters: String(row.metaHeadquarters || row.headquarters || "").trim(),
    metaFounded: String(row.metaFounded || row.founded || "").trim(),
    metaCeo: String(row.metaCeo || row.ceo || "").trim(),
    trustText: String(row.trustText || "").trim(),
    platforms: [row.platforms, row.tradingPlatforms, row.platform, row.supportedPlatforms]
      .flatMap((value) => Array.isArray(value) ? value : String(value || "").split(/[,\n|]+/))
      .map((value) => String(value || "").trim())
      .filter((value, index, values) => {
        const key = value.toLowerCase().replace(/[^a-z0-9]/g, "");
        const supported = new Set(["mt4", "metatrader4", "mt5", "metatrader5", "ctrader", "matchtrader", "tradelocker", "dxtrade"]);
        return supported.has(key) && values.findIndex((item) => item.toLowerCase().replace(/[^a-z0-9]/g, "") === key) === index;
      }),
    overview: String(row.overview || "").trim(),
    overviewShort: String(row.overviewShort || "").trim(),
    ruleModel: String(row.ruleModel || "").trim(),
    payoutModel: String(row.payoutModel || "").trim(),
    dailyDrawdown: String(row.dailyDrawdown || "").trim(),
    maxDrawdown: String(row.maxDrawdown || "").trim(),
    maxFundingLimit: String(row.maxFundingLimit || "").trim(),
    keyMetrics: Array.isArray(row.keyMetrics)
      ? row.keyMetrics
      : row.keyMetrics && typeof row.keyMetrics === "object"
        ? Object.entries(row.keyMetrics).map(([label, value]) => ({ label: String(label).replace(/([a-z])([A-Z])/g, "$1 $2"), value: String(value ?? "-") }))
        : row.cardMetrics && typeof row.cardMetrics === "object"
          ? Object.entries(row.cardMetrics).map(([label, value]) => ({ label: String(label).replace(/([a-z])([A-Z])/g, "$1 $2"), value: String(value ?? "-") }))
          : [],
    cardMetrics: normalizeCardMetrics(row),
    score: Number(row.score || 0),
    reviewCount: Number(row.reviewCount || 0),
    trustedBy: String(row.trustedBy || "").trim(),
    promoText: String(row.promoText || "").trim(),
    reviewSnippet: String(row.reviewSnippet || "").trim(),
    performance: typeof row.performance === "object" && row.performance ? row.performance : {},
    stats: Array.isArray(row.stats) ? row.stats : [],
    tabs: Array.isArray(row.tabs) ? row.tabs : [],
    tradingConditions: Array.isArray(row.tradingConditions)
      ? row.tradingConditions
      : row.tradingConditions && typeof row.tradingConditions === "object"
        ? Object.entries(row.tradingConditions).map(([label, value]) => ({ label: String(label).replace(/([a-z])([A-Z])/g, "$1 $2"), value: String(value ?? "-") }))
        : [],
    firmDetails: Array.isArray(row.firmDetails) ? row.firmDetails : [],
    leverageRows: Array.isArray(row.leverageRows) ? row.leverageRows : [],
    commissions: Array.isArray(row.commissions) ? row.commissions : [],
    evaluationPrograms: Array.isArray(row.evaluationPrograms) ? row.evaluationPrograms : [],
    rulesPanelData: row.rulesPanelData && typeof row.rulesPanelData === "object" ? row.rulesPanelData : null,
    challengesPanelData: row.challengesPanelData && typeof row.challengesPanelData === "object" ? row.challengesPanelData : null,
    rulesLink: String(row.rulesLink || (slug ? `/prop-firm-rules/${slug}` : "/prop-firm-rules")).trim(),
    paymentMethods: Array.isArray(row.paymentMethods) ? row.paymentMethods : [],
    restrictedCountries: Array.isArray(row.restrictedCountries) ? row.restrictedCountries : [],
    whyChoose: Array.isArray(row.whyChoose) ? row.whyChoose : [],
    ranking: rankingValue(row),
    sortOrder: rankingValue(row),
    active: row.active !== false,

    finderEnabled: Boolean(row.finderEnabled),
    finderStrategies: Array.isArray(row.finderStrategies) ? row.finderStrategies.map((x) => String(x || "").trim()).filter(Boolean) : [],
    finderPitch: String(row.finderPitch || "").trim(),
    finderLink: String(row.finderLink || "").trim(),

    nextBonusCode: String(row.nextBonusCode || "").trim(),
    nextBonusDiscountPct: Number(row.nextBonusDiscountPct || 0),
    nextBonusCashbackPct: Number(row.nextBonusCashbackPct || 0),
    nextBonusUrl: String(row.nextBonusUrl || "").trim(),

    showListed,
    showBestGlobal,
    showFirmProfile: row.showFirmProfile !== false,
    showHomeTable: row.showHomeTable !== false,
    showRules: row.showRules !== false,
    showReviews: row.showReviews !== false,
    showOffers: row.showOffers !== false,
    bestRegions: regionFlags,
    bestCategories: categoryFlags,
    publishState: String(row.publishState || row.status || "published").toLowerCase(),
    publishAt: String(row.publishAt || "").trim(),
    unpublishUntil: String(row.unpublishUntil || "").trim(),
    visibleNow: isVisibleNow(row)
  };
}

function uniqBySlug(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = String(row.slug || row.id || "").trim().toLowerCase();
    if (!key) return;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, row);
      return;
    }
    const prevScore = (prev.visibleNow ? 1000 : 0) + (prev.publishState === "published" ? 100 : 0) + (prev.active ? 10 : 0);
    const nextScore = (row.visibleNow ? 1000 : 0) + (row.publishState === "published" ? 100 : 0) + (row.active ? 10 : 0);
    if (nextScore >= prevScore) map.set(key, row);
  });
  return Array.from(map.values());
}

export async function getFirmsByType(listingType, options = {}) {
  try {
    const [firmRows, statRows] = await Promise.all([
      listDocuments("firms", 500),
      listDocuments("firmRatingStats", 500)
    ]);
    const all = firmRows.map((row) => norm(row));
    const statsMap = new Map();
    statRows.forEach((row) => {
      const idKey = slugify(row.id || "");
      const slugKey = slugify(row.firmSlug || "");
      const nameKey = slugify(row.firmName || "");
      const avg = Number(row.averageRating ?? row.autoAverageRating);
      const cnt = Number(row.reviewCount ?? row.autoReviewCount);
      const payload = {
        score: Number.isFinite(avg) ? Math.max(0, Math.min(5, avg)) : null,
        reviewCount: Number.isFinite(cnt) ? Math.max(0, Math.round(cnt)) : null
      };
      if (idKey) statsMap.set(idKey, payload);
      if (slugKey) statsMap.set(slugKey, payload);
      if (nameKey) statsMap.set(nameKey, payload);
    });

    const region = regionKey(options.bestRegion || options.region || "");
    const category = bestCategoryKey(options.bestCategory || options.category || "");
    const surface = String(options.surface || "listing").toLowerCase();
    const deduped = uniqBySlug(all);

    let result = deduped
      .map((f) => {
        const s = statsMap.get(slugify(f.slug || f.id || "")) || statsMap.get(slugify(f.name || ""));
        if (!s) return f;
        return {
          ...f,
          score: Number.isFinite(s.score) ? s.score : f.score,
          reviewCount: Number.isFinite(s.reviewCount) ? s.reviewCount : f.reviewCount
        };
      })
      .filter((f) => {
        if (!f.visibleNow || !f.name) return false;
        if (!isVisibleOnSurface(f, surface)) return false;
        if (["profile", "rules", "reviews", "offers"].includes(surface)) return true;
        const isBest = Boolean(f.showBestGlobal) || BEST_REGIONS.some((k) => Boolean(f.bestRegions?.[k]));
        const isListed = Boolean(f.showListed);

        if (String(listingType || "listed").toLowerCase() === "best") {
          if (!isBest) return false;
          if (region && !Boolean(f.bestRegions?.[region])) return false;
          if (category && !Boolean(f.bestCategories?.[category])) return false;
          return true;
        }
        return isListed;
      })
      .sort((a, b) => rankingValue(a) - rankingValue(b));

    // If no results from Firebase, use fallback data
    if (result.length === 0 && all.length === 0) {
      console.warn("No firms from Cloudflare, using fallback data");
      const fallbackData = String(listingType || "listed").toLowerCase() === "best" ? DEFAULT_BEST_FIRMS : DEFAULT_LISTED_FIRMS;
      result = fallbackData.map(firm => norm(firm)).filter((firm) => isVisibleOnSurface(firm, surface));
    }

    return await withFirmFieldOverridesList(result);
  } catch (err) {
    console.warn("firm load failed, using fallback data:", err?.message || err);
    // Return fallback data when Cloudflare fails.
    const fallbackData = String(listingType || "listed").toLowerCase() === "best" ? DEFAULT_BEST_FIRMS : DEFAULT_LISTED_FIRMS;
    return await withFirmFieldOverridesList(fallbackData.map((firm) => norm(firm)));
  }
}

export { BEST_REGIONS, BEST_CATEGORIES, regionKey, bestCategoryKey, slugify, isVisibleOnSurface };
