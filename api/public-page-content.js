"use strict";

const { firestore } = require("./_lib/clients");
const { canonicalForRoute, normalizeRecord, pageContentIdForRoute } = require("./_lib/route-content");
const { handlePublicReviews } = require("./_lib/public-reviews");

function publicHeaders(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function updatedMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return Number(value.toMillis()) || 0;
  if (Number.isFinite(Number(value.seconds))) return Number(value.seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

async function latestFirmForSlug(db, rawSlug) {
  const slug = String(rawSlug || "").trim();
  if (!slug) return null;
  const [byId, bySlug] = await Promise.all([
    db.collection("firms").doc(slug).get(),
    db.collection("firms").where("slug", "==", slug).get(),
  ]);
  const candidates = [];
  if (byId.exists) candidates.push(byId);
  bySlug.docs.forEach((document) => {
    if (!candidates.some((item) => item.id === document.id)) candidates.push(document);
  });
  candidates.sort((a, b) => updatedMillis(b.data()?.updatedAt) - updatedMillis(a.data()?.updatedAt));
  const selected = candidates[0];
  return selected?.exists ? { id: selected.id, ...selected.data() } : null;
}

module.exports = async (req, res) => {
  const requestPath = String(req.path || req.url || "").split("?")[0];
  const resource = String(req.query?.resource || "").trim().toLowerCase();
  if (resource === "reviews" || /^\/api\/reviews(?:\/|$)/.test(requestPath)) {
    try {
      return await handlePublicReviews(req, res, firestore());
    } catch (error) {
      console.error("[public-reviews-api]", error?.code || error?.message || "unavailable");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-store");
      return res.status(503).json({ ok: false, error: "Reviews API is temporarily unavailable", code: "service_unavailable" });
    }
  }
  publicHeaders(res);
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const pathname = String(req.query.pathname || "/");
  const search = String(req.query.search || "");
  const id = pageContentIdForRoute(pathname, search);
  const context = { id, pathname, search };
  try {
    const db = firestore();
    const snap = await db.collection("publicPageContent").doc(id).get();
    let source = snap.exists ? snap.data() : null;
    if (!source) {
      const routePage = pathname === "/" ? "index.html" : String(pathname || "/").replace(/^\/+|\/+$/g, "");
      const seoDocId = `page-${routePage.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120)}`;
      const [copySnap, seoSnap] = await Promise.all([
        db.collection("pageHeadingsParagraphs").doc(id).get(),
        db.collection("pageSeoContent").doc(seoDocId).get()
      ]);
      const copy = copySnap.exists ? (copySnap.data() || {}) : null;
      const seo = seoSnap.exists ? (seoSnap.data() || {}) : null;
      if (copy || seo) source = { ...(copy || {}), ...(seo || {}), id };
    }
    if (!source && /^(firm-review|firm-rules|challenge-model)-/.test(id)) {
      const routeParts = String(pathname || "").split("/").filter(Boolean);
      const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
      const firmSlug = routeParts[0] === "prop-firms" || routeParts[0] === "prop-firm-rules"
        ? String(routeParts[1] || "")
        : String(params.get("firm") || "");
      const firm = await latestFirmForSlug(db, firmSlug);
      const rulesVisible = firm?.showRules !== false;
      const reviewsVisible = firm?.showReviews !== false;
      const surfaceVisible = id.startsWith("firm-review-") ? reviewsVisible : rulesVisible;
      if (firm && surfaceVisible) {
        const name = String(firm.name || firmSlug).trim();
        const isRules = id.startsWith("firm-rules-") || id.startsWith("challenge-model-");
        const modelSlug = id.startsWith("challenge-model-") ? id.slice(`challenge-model-${firmSlug}-`.length) : "";
        const model = modelSlug && firm.rulesPanelData?.programRules && typeof firm.rulesPanelData.programRules === "object"
          ? Object.entries(firm.rulesPanelData.programRules).find(([key, value]) => String(value?.slug || key || "").toLowerCase() === modelSlug)?.[1]
          : null;
        const modelName = String(model?.program || model?.name || "").trim();
        source = {
          id,
          heading: isRules ? (modelName ? `${name} ${modelName} Rules` : `${name} Rules`) : (firm.overviewTitle || name),
          paragraph: isRules ? (model?.desc || firm.rulesText || `Published ${name} challenge rules and account conditions.`) : (firm.overviewShort || firm.overview || ""),
          seoTitle: isRules ? (modelName ? `${name} ${modelName} Rules | Rank My Prop` : `${name} Rules | Rank My Prop`) : `${name} Review | Rank My Prop`,
          seoDescription: model?.desc || firm.metaDescription || firm.overviewShort || firm.overview || "",
          canonical: canonicalForRoute(pathname, search),
          updatedAt: firm.updatedAt || null
        };
      }
    }
    if (!source) return res.status(404).json({ ok: false, id, unavailable: true });
    const record = normalizeRecord({ id, ...source, __stableSsrHero: true }, context);
    // Reuse this public endpoint for the rules UI's exact-firm refresh. Keeping
    // the full record here avoids adding another Vercel Function on Hobby.
    let firm = null;
    if (String(req.query.includeFirm || "") === "1" && /^(firm-rules|challenge-model)-/.test(id)) {
      const routeParts = String(pathname || "").split("/").filter(Boolean);
      const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
      const firmSlug = routeParts[0] === "prop-firm-rules" ? String(routeParts[1] || "") : String(params.get("firm") || "");
      if (firmSlug) {
        firm = await latestFirmForSlug(db, firmSlug);
        if (firm?.showRules === false) firm = null;
      }
    }
    return res.status(200).json({ ok: true, id, version: String(record.updatedAt?.toMillis?.() || record.updatedAt?.seconds || "0"), record, firm });
  } catch (error) {
    // Public pages must retain their server bootstrap when this request is unavailable.
    return res.status(503).json({ ok: false, id, unavailable: true });
  }
};
