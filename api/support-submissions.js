"use strict";

const { audit, firestore, getSupabaseAdmin, supportIdentity } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { stripPii } = require("./_lib/pii");
const { insertSubmission, listSubmissions } = require("./_lib/support-store");

const TYPE_FIELDS = Object.freeze({
  firm_create: new Set(["name", "slug", "handle", "country", "website", "buyLink", "tags", "markets", "bio", "payoutAssurance", "showListed", "showBestGlobal", "promoText", "cardMetrics", "teamReviewProfile", "rulesPanelData"]),
  firm_update: new Set(["name", "handle", "country", "website", "buyLink", "tags", "markets", "bio", "payoutAssurance", "showListed", "showBestGlobal", "promoText", "cardMetrics", "overviewTitle", "overviewLongTitle", "overviewShort", "overviewLong", "platforms", "paymentMethods", "restrictedCountries", "whyChoose", "rulesPanelData"]),
  brand_assets: new Set(["logo", "logoUrl", "banner", "bannerUrl", "ogImage", "firmId", "firmSlug"]),
  offer: new Set(["firm", "firmName", "firmId", "firmSlug", "discount", "discountPct", "coupon", "couponCode", "visitLink", "buyLink", "active", "sortOrder", "title", "description"]),
  content: new Set(["title", "heading", "paragraph", "content", "page", "pagePath", "section", "active"])
});

const CMS_COLLECTIONS = Object.freeze(new Set([
  "firms",
  "offers",
  "reviews",
  "firmReviews",
  "firmReviewProfiles",
  "firmRatingStats",
  "giveaways",
  "upcomingEvents",
  "purchases",
  "bonusOffers",
  "propNewsPosts",
  "propNewsVideos",
  "tradingGuidesPosts",
  "tradingGuidesVideos",
  "fundingStrategiesPosts",
  "fundingStrategiesVideos",
  "tradingPsychologyPosts",
  "tradingPsychologyVideos",
  "beginnerTutorialsPosts",
  "beginnerTutorialsVideos",
  "pageHeadingsParagraphs",
  "pageCopy",
  "pageSeoContent",
  "pageFaqs"
]));

function sanitizeCmsValue(value, depth = 0) {
  if (depth > 8) return null;
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeCmsValue(item, depth + 1));
  if (typeof value !== "object") return null;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (!key || ["__proto__", "prototype", "constructor"].includes(key)) continue;
    out[key] = sanitizeCmsValue(item, depth + 1);
  }
  return out;
}

function allowedChanges(type, proposed = {}) {
  if (type === "cms_update") {
    if (!proposed || typeof proposed !== "object" || Array.isArray(proposed)) return {};
    return sanitizeCmsValue(proposed) || {};
  }
  const fields = TYPE_FIELDS[type];
  if (!fields || !proposed || typeof proposed !== "object" || Array.isArray(proposed)) return {};
  const out = {};
  for (const [key, value] of Object.entries(proposed)) {
    if (fields.has(key)) out[key] = value;
  }
  return out;
}

module.exports = handler(async (req, res) => {
  method(req, ["GET", "POST"]);
  const actor = await supportIdentity(req);
  const supabase = getSupabaseAdmin();

  if (req.method === "GET") {
    const rows = await listSubmissions({ supabase, db: firestore, actor, limit: 250 });
    return json(res, 200, { ok: true, rows: stripPii(rows || []) });
  }

  const type = String(req.body?.submissionType || "");
  const targetId = String(req.body?.targetId || "").trim();
  const proposedChanges = allowedChanges(type, req.body?.proposedChanges);
  const validType = Boolean(TYPE_FIELDS[type]) || type === "cms_update";
  if (!validType || !Object.keys(proposedChanges).length) {
    throw new HttpError(400, "A valid submission type and allowed proposed changes are required.", "invalid_input");
  }
  if (type !== "firm_create" && !targetId) throw new HttpError(400, "Target ID is required for this submission.", "invalid_input");
  if (type === "firm_create" && (!proposedChanges.name || !proposedChanges.slug)) {
    throw new HttpError(400, "Firm name and slug are required.", "invalid_input");
  }

  const requestedContentCollection = String(req.body?.targetCollection || "");
  const allowedContentCollections = new Set(["pageHeadingsParagraphs", "pageCopy", "pageSeoContent", "pageFaqs"]);
  if (type === "cms_update" && !CMS_COLLECTIONS.has(requestedContentCollection)) {
    throw new HttpError(403, "This CMS collection is not allowed for support submissions.", "collection_forbidden");
  }
  const targetCollection = type === "cms_update"
    ? requestedContentCollection
    : type.startsWith("firm_") || type === "brand_assets"
    ? "firms"
    : type === "offer"
      ? "offers"
      : allowedContentCollections.has(requestedContentCollection) ? requestedContentCollection : "pageHeadingsParagraphs";
  const queued = await insertSubmission({
    supabase,
    db: firestore,
    actor,
    submission: {
      type,
      targetCollection,
      targetId: targetId || String(proposedChanges.slug || ""),
      proposedChanges
    }
  });
  await audit(actor, "submission_created", type, queued.id, { targetId: targetId || proposedChanges.slug, storage: queued.storage });
  return json(res, 201, { ok: true, id: queued.id, status: "pending" });
});
