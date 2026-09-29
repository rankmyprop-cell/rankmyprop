import { getDocument, listDocuments } from "./cloudflare-data.js";

function imgLike(v = "") {
  const s = String(v || "").trim();
  return /^data:image\//i.test(s) || /^https?:\/\//i.test(s) || /^\/?assets\//i.test(s) || /\.(png|jpe?g|webp|svg|gif)$/i.test(s);
}

function assetWebp(v = "") {
  const s = String(v || "").trim();
  if (!/^\/?assets\//i.test(s)) return s;
  const rooted = `/${s.replace(/^\/+/, "")}`;
  if (!/\.(png|jpe?g)(\?.*)?$/i.test(rooted)) return rooted;
  return rooted.replace(/\.(png|jpe?g)(\?.*)?$/i, ".webp$2");
}

function toKey(v = "") {
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function slugify(v = "") {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function offerPageDocId(slug = "") {
  return `page-offers-${slugify(slug)}-html`;
}

function rankingValue(row = {}) {
  const rank = Number(row.ranking);
  if (Number.isFinite(rank) && rank > 0) return rank;
  const legacy = Number(row.sortOrder);
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  return 999999;
}

function normalizeOfferPage(raw = "", slug = "") {
  const s = String(raw || "").trim();
  const key = slugify(slug || "");
  if (!s) return key ? `/offers/${key}` : "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/offers\/[a-z0-9-]+$/i.test(s)) return s;
  if (/^\/?discount-offer(?:\.html)?(?:\?|$)/i.test(s)) return key ? `/offers/${key}` : "/discount-offer";
  if (/discount$/i.test(s.replace(/\.html$/i, ""))) return key ? `/offers/${key}` : s.replace(/\.html$/i, "");
  return s.replace(/\.html$/i, "");
}
function normalizeVisitUrl(raw = "") {
  let s = String(raw || "").trim();
  if (!s || s === "#") return "";
  s = s.replace(/^https?:\/\/(?:www\.)?rankmyprop\.in\/(https?:\/\/.+)$/i, "$1");
  s = s.replace(/^\/(https?:\/\/.+)$/i, "$1");
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s;
  if (/^\/\//.test(s)) return `https:${s}`;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[\/:?#].*)?$/i.test(s)) return `https://${s}`;
  return s;
}


function statPayload(row = {}) {
  const avg = Number(row.averageRating ?? row.autoAverageRating);
  const cnt = Number(row.reviewCount ?? row.autoReviewCount);
  return {
    rating: Number.isFinite(avg) ? Math.max(0, Math.min(5, avg)) : null,
    reviews: Number.isFinite(cnt) ? Math.max(0, Math.round(cnt)) : null
  };
}

function norm(item = {}, firmMap = new Map(), statsMap = new Map()) {
  const firmId = toKey(item.firmId || item.slug || item.id);
  const isUnlistedFirm = item.isUnlistedFirm === true || !String(item.firmId || "").trim();
  const firm = isUnlistedFirm ? null : (firmMap.get(firmId) || firmMap.get(toKey(item.name || item.firmName || "")));
  const stats = statsMap.get(firmId) || statsMap.get(toKey(firm?.slug || "")) || statsMap.get(toKey(firm?.name || item.name || ""));
  const rawLogo = assetWebp(String(isUnlistedFirm ? (item.logo || item.logoUrl || item.logo_url || "") : (firm?.logo || item.logo || "")).trim());
  const rawLogoUrl = assetWebp(String(isUnlistedFirm ? (item.logoUrl || item.logo_url || item.logo || "") : (firm?.logoUrl || firm?.logo_url || item.logoUrl || item.logo_url || "")).trim());
  const logoUrl = rawLogoUrl || (imgLike(rawLogo) ? rawLogo : "");
  const rawName = String(firm?.name || item.name || item.firmName || item.firmId || item.slug || item.id || "").trim();
  const name = rawName || "Unknown Firm";
  const routeSlug = slugify(firm?.slug || item.slug || rawName || item.firmId || item.id || "");
  const fallbackLogo = String(name).split(/\s+/).map((x) => x[0]).join("").slice(0, 3).toUpperCase() || "RMP";
  const logo = logoUrl || (imgLike(rawLogo) ? rawLogo : rawLogo || fallbackLogo);
  return {
    id: item.id || firmId || "",
    firmId,
    name,
    slug: routeSlug || firmId || "",
    isUnlistedFirm,
    logo,
    logoUrl,
    discount: String(item.discount || "").trim(),
    rating: Number(
      stats?.rating ??
      firm?.score ??
      firm?.rating ??
      0
    ),
    reviews: Number(
      stats?.reviews ??
      firm?.reviewCount ??
      0
    ),
    category: String(item.category || "forex").toLowerCase(),
    description: String(item.description || "").trim(),
    link: normalizeVisitUrl(item.visitUrl || item.visitURL || item.visit_url || item.link || item.affiliateLink || item.buyLink || firm?.buyLink || firm?.website || item.website || ""),
    affiliateLink: normalizeVisitUrl(item.affiliateLink || item.visitUrl || item.visitURL || item.visit_url || item.link || ""),
    buyLink: normalizeVisitUrl(item.buyLink || firm?.buyLink || ""),
    website: normalizeVisitUrl(item.website || firm?.website || ""),
    code: String(item.code || "RMP").trim() || "RMP",
    active: item.active !== false,
    showOffers: firm?.showOffers !== false,
    ranking: rankingValue(item),
    sortOrder: rankingValue(item),
    page: normalizeOfferPage(String(item.page || "").trim(), routeSlug || firmId || rawName),
    exclusive: Boolean(item.exclusive),
    seoTitle: String(item.seoTitle || "").trim(),
    seoDescription: String(item.seoDescription || "").trim(),
    seoKeywords: String(item.seoKeywords || "").trim(),
    heading: String(item.heading || "").trim(),
    headingPrimary: String(item.headingPrimary || item.titlePrimary || "").trim(),
    headingAccent: String(item.headingAccent || item.titleAccent || "").trim(),
    paragraph: String(item.paragraph || item.pageParagraph || "").trim(),
    lastUpdatedLabel: String(item.lastUpdatedLabel || item.lastUpdated || "").trim(),
    updatedAt: item.updatedAt || item.createdAt || ""
  };
}

function withFallback(rows) {
  return rows
    .filter((row) => row.active !== false && row.showOffers !== false && row.name)
    .sort((a, b) => rankingValue(a) - rankingValue(b));
}

export async function getAllOffers() {
  try {
    const [offerRows, firmRows, statRows] = await Promise.all([
      listDocuments("offers", 500),
      listDocuments("firms", 500),
      listDocuments("firmRatingStats", 500)
    ]);
    const firmMap = new Map();
    const statsMap = new Map();
    firmRows.forEach((row) => {
      const idKey = toKey(row.id);
      if (idKey) firmMap.set(idKey, row);
      const slugKey = toKey(row.slug);
      if (slugKey) firmMap.set(slugKey, row);
      const nameKey = toKey(row.name);
      if (nameKey) firmMap.set(nameKey, row);
    });
    statRows.forEach((row) => {
      const stats = statPayload(row);
      const idKey = toKey(row.id);
      const slugKey = toKey(row.firmSlug || "");
      const nameKey = toKey(row.firmName || "");
      if (idKey) statsMap.set(idKey, stats);
      if (slugKey) statsMap.set(slugKey, stats);
      if (nameKey) statsMap.set(nameKey, stats);
    });
    const fromDb = [];
    offerRows.forEach((row) => fromDb.push(norm(row, firmMap, statsMap)));
    return withFallback(fromDb);
  } catch (err) {
    console.warn("offers load failed:", err?.message || err);
    return [];
  }
}

export async function getOfferPageContent(slug = "", offer = {}) {
  const cleanSlug = slugify(slug || offer.slug || offer.firmId || offer.name || "");
  let cms = {};
  if (cleanSlug) {
    try {
      cms = await getDocument("pageSeoContent", offerPageDocId(cleanSlug)) || {};
    } catch (err) {
      console.warn("offer page copy load failed:", err?.message || err);
    }
  }
  return {
    seoTitle: String(cms.seoTitle || offer.seoTitle || "").trim(),
    seoDescription: String(cms.seoDescription || offer.seoDescription || "").trim(),
    seoKeywords: String(cms.seoKeywords || offer.seoKeywords || "").trim(),
    heading: String(cms.heading || offer.heading || "").trim(),
    headingPrimary: String(cms.titlePrimary || offer.headingPrimary || "").trim(),
    headingAccent: String(cms.titleAccent || offer.headingAccent || "").trim(),
    paragraph: String(cms.paragraph || offer.paragraph || "").trim(),
    lastUpdatedLabel: String(cms.lastUpdatedLabel || offer.lastUpdatedLabel || "").trim(),
    updatedAt: cms.updatedAt || offer.updatedAt || ""
  };
}
