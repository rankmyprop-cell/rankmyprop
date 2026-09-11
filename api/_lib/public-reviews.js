"use strict";

const { createHash } = require("node:crypto");

const APPROVED_STATUSES = ["Approved", "approved", "Published", "published", "Publish", "publish"];
const APPROVED_SET = new Set(APPROVED_STATUSES.map((value) => value.toLowerCase()));
const MAX_SOURCE_REVIEWS = 2500;

function first(value, fallback = "") {
  return Array.isArray(value) ? value[0] : (value ?? fallback);
}

function clean(value = "", max = 500) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function slugify(value = "") {
  return clean(value, 180).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function boundedInteger(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function rating(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(5, Math.max(0, Number(number.toFixed(2)))) : 0;
}

function isoDate(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") return value.toDate().toISOString();
    if (Number.isFinite(Number(value.seconds))) return new Date(Number(value.seconds) * 1000).toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  } catch {
    return null;
  }
}

function list(value, maxItems = 8) {
  const values = Array.isArray(value) ? value : clean(value, 600).split(",");
  return values.map((item) => clean(item, 160)).filter(Boolean).slice(0, maxItems);
}

function publicUrl(value = "") {
  const url = clean(value, 1200);
  return /^(https:\/\/|\/assets\/)/i.test(url) ? url : "";
}

function safeAspectRatings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const aliases = {
    customerService: ["customerService", "cs"],
    tradingConditions: ["tradingConditions", "tc"],
    payoutProcess: ["payoutProcess", "pp"],
    userFriendliness: ["userFriendliness", "overallExperience", "oe"]
  };
  const output = {};
  for (const [key, candidates] of Object.entries(aliases)) {
    const found = candidates.map((candidate) => Number(value[candidate])).find(Number.isFinite);
    if (found !== undefined) output[key] = rating(found);
  }
  return output;
}

function publicReview(document) {
  const row = typeof document.data === "function" ? (document.data() || {}) : (document || {});
  const firmName = clean(row.firm || row.firmName || "Unknown Firm", 120);
  const firmSlug = slugify(row.firmSlug || row.slug || firmName);
  const reviewerName = clean(row.userName || row.reviewerName || row.authorName || row.displayName || row.name || "Anonymous Trader", 80);
  const proofUrls = (Array.isArray(row.proofUrls) ? row.proofUrls : []).map(publicUrl).filter(Boolean).slice(0, 3);
  return {
    id: clean(document.id || row.id, 160),
    firm: { slug: firmSlug, name: firmName },
    reviewer: {
      name: reviewerName,
      initials: reviewerName.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase() || "AT",
      avatar: publicUrl(row.userPhoto || row.photoURL || row.avatar)
    },
    rating: rating(row.rating),
    title: clean(row.reviewTitle || row.title, 140),
    text: clean(row.reviewText || row.review || row.text, 2400),
    program: clean(row.program || row.challengeType, 120),
    accountSize: clean(row.accountSize || row.accountBalance, 80),
    fundingPeriod: clean(row.fundingPeriod || row.fundedPeriod || row.timeToFund, 80),
    payoutCount: Math.max(0, boundedInteger(row.payoutCount, 0, 0, 100000)),
    pros: list(row.pros || row.prosText || row.reviewPros),
    cons: list(row.cons || row.consText || row.reviewCons),
    aspectRatings: safeAspectRatings(row.aspectRatings),
    recommended: typeof row.recommend === "boolean" ? row.recommend : null,
    proof: { available: proofUrls.length > 0, urls: proofUrls },
    publishedAt: isoDate(row.approvedAt || row.updatedAt || row.createdAt),
    submittedAt: isoDate(row.createdAt)
  };
}

function reviewTime(review) {
  return new Date(review.publishedAt || review.submittedAt || 0).getTime() || 0;
}

function summarize(reviews) {
  const rated = reviews.filter((review) => review.rating > 0);
  const averageRating = rated.length ? Number((rated.reduce((sum, review) => sum + review.rating, 0) / rated.length).toFixed(2)) : 0;
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rated.forEach((review) => {
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating)));
    ratingDistribution[bucket] += 1;
  });
  return {
    totalApproved: reviews.length,
    averageRating,
    ratingDistribution,
    reviewsWithPublicProof: reviews.filter((review) => review.proof.available).length,
    totalReportedPayouts: reviews.reduce((sum, review) => sum + review.payoutCount, 0)
  };
}

async function firmMetadata(db, slug, reviews) {
  if (!slug) return null;
  let document = await db.collection("firms").doc(slug).get().catch(() => null);
  if (!document?.exists) {
    const snapshot = await db.collection("firms").where("slug", "==", slug).limit(1).get().catch(() => null);
    document = snapshot?.docs?.[0] || null;
  }
  const row = document?.exists ? (document.data() || {}) : {};
  return {
    slug,
    name: clean(row.name || reviews[0]?.firm?.name || slug, 120),
    logo: publicUrl(row.logoUrl || row.logo),
    website: publicUrl(row.website),
    reviewsPage: `https://www.rankmyprop.in/prop-firms/${encodeURIComponent(slug)}/reviews`
  };
}

function setHeaders(res, etag) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type, If-None-Match");
  res.setHeader("Access-Control-Expose-Headers", "ETag, X-RateLimit-Policy");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=15, stale-while-revalidate=30");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("X-RateLimit-Policy", "CDN cached; maximum 100 reviews per response");
  if (etag) res.setHeader("ETag", etag);
}

async function handlePublicReviews(req, res, db) {
  if (req.method === "OPTIONS") {
    setHeaders(res);
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    setHeaders(res);
    return res.status(405).json({ ok: false, error: "Method not allowed", code: "method_not_allowed" });
  }

  const requestedFirm = slugify(first(req.query?.firm, req.params?.firm || ""));
  const page = boundedInteger(first(req.query?.page), 1, 1, 10000);
  const pageSize = boundedInteger(first(req.query?.limit), 20, 1, 100);
  const exactRating = boundedInteger(first(req.query?.rating), 0, 0, 5);
  const minRating = boundedInteger(first(req.query?.minRating), 0, 0, 5);
  const sort = clean(first(req.query?.sort, "newest"), 20).toLowerCase();
  const allowedSorts = new Set(["newest", "oldest", "highest", "lowest"]);
  if (!allowedSorts.has(sort)) {
    setHeaders(res);
    return res.status(400).json({ ok: false, error: "sort must be newest, oldest, highest or lowest", code: "invalid_sort" });
  }

  const snapshot = await db.collection("reviews").where("status", "in", APPROVED_STATUSES).limit(MAX_SOURCE_REVIEWS).get();
  let allApproved = snapshot.docs
    .filter((document) => APPROVED_SET.has(clean(document.data()?.status, 30).toLowerCase()))
    .map(publicReview)
    .filter((review) => review.id && review.firm.slug && review.text);
  if (requestedFirm) allApproved = allApproved.filter((review) => review.firm.slug === requestedFirm);

  const summary = summarize(allApproved);
  let filtered = allApproved.filter((review) => (!exactRating || Math.round(review.rating) === exactRating) && (!minRating || review.rating >= minRating));
  filtered.sort((a, b) => {
    if (sort === "oldest") return reviewTime(a) - reviewTime(b) || a.id.localeCompare(b.id);
    if (sort === "highest") return b.rating - a.rating || reviewTime(b) - reviewTime(a);
    if (sort === "lowest") return a.rating - b.rating || reviewTime(b) - reviewTime(a);
    return reviewTime(b) - reviewTime(a) || a.id.localeCompare(b.id);
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;
  const reviews = filtered.slice(offset, offset + pageSize);
  const firm = await firmMetadata(db, requestedFirm, allApproved);
  const query = new URLSearchParams();
  if (requestedFirm) query.set("firm", requestedFirm);
  query.set("page", String(page));
  query.set("limit", String(pageSize));
  if (exactRating) query.set("rating", String(exactRating));
  if (minRating) query.set("minRating", String(minRating));
  if (sort !== "newest") query.set("sort", sort);
  const self = `https://www.rankmyprop.in/api/reviews?${query.toString()}`;
  const payload = {
    ok: true,
    apiVersion: "1.0",
    firm,
    summary,
    filters: { firm: requestedFirm || null, rating: exactRating || null, minRating: minRating || null, sort },
    pagination: { page, limit: pageSize, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    reviews,
    links: {
      self,
      documentation: "https://www.rankmyprop.in/review-api",
      next: page < totalPages ? self.replace(`page=${page}`, `page=${page + 1}`) : null,
      previous: page > 1 ? self.replace(`page=${page}`, `page=${page - 1}`) : null
    },
    attribution: { name: "Rank My Prop", url: "https://www.rankmyprop.in/reviews", required: true },
    generatedAt: new Date().toISOString()
  };
  const etag = `W/\"${createHash("sha1").update(JSON.stringify({ requestedFirm, page, pageSize, exactRating, minRating, sort, reviews, summary })).digest("hex").slice(0, 24)}\"`;
  setHeaders(res, etag);
  if (String(req.headers?.["if-none-match"] || "") === etag) return res.status(304).end();
  return res.status(200).json(payload);
}

module.exports = { handlePublicReviews, publicReview, slugify, summarize };
