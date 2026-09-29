import { json, sha256 } from "./lib.js";

const ORIGIN = "https://www.rankmyprop.in";
const clean = (value = "", max = 2400) => String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const slugify = (value = "") => clean(value, 180).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function parsed(row) {
  if (!row) return null;
  try { return { id: row.id, ...JSON.parse(row.data || "{}") }; } catch { return null; }
}

function isoDate(value) {
  if (!value) return null;
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) return new Date(Number(value.seconds) * 1000).toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function publicUrl(value = "") {
  const url = clean(value, 1200);
  return /^(https:\/\/|\/assets\/)/i.test(url) ? url : "";
}

function rating(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(5, Math.max(0, Number(number.toFixed(2)))) : 0;
}

function list(value, max = 8) {
  const source = Array.isArray(value) ? value : clean(value, 600).split(",");
  return source.map((item) => clean(item, 160)).filter(Boolean).slice(0, max);
}

function publicReview(row) {
  const firmName = clean(row.firm || row.firmName || "Unknown Firm", 120);
  const firmSlug = slugify(row.firmSlug || row.slug || firmName);
  const reviewerName = clean(row.userName || row.reviewerName || row.authorName || row.displayName || row.name || "Anonymous Trader", 80);
  const proofUrls = (Array.isArray(row.proofUrls) ? row.proofUrls : []).map(publicUrl).filter(Boolean).slice(0, 3);
  const aspect = row.aspectRatings && typeof row.aspectRatings === "object" && !Array.isArray(row.aspectRatings) ? row.aspectRatings : {};
  return {
    id: clean(row.id, 160),
    firm: { slug: firmSlug, name: firmName },
    reviewer: {
      name: reviewerName,
      initials: reviewerName.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase() || "AT",
      avatar: publicUrl(row.userPhoto || row.photoURL || row.avatar),
    },
    rating: rating(row.rating),
    title: clean(row.reviewTitle || row.title, 140),
    text: clean(row.reviewText || row.review || row.text, 2400),
    program: clean(row.program || row.challengeType, 120),
    accountSize: clean(row.accountSize || row.accountBalance, 80),
    fundingPeriod: clean(row.fundingPeriod || row.fundedPeriod || row.timeToFund, 80),
    payoutCount: Math.max(0, Math.min(100000, Number.parseInt(row.payoutCount, 10) || 0)),
    pros: list(row.pros || row.prosText || row.reviewPros),
    cons: list(row.cons || row.consText || row.reviewCons),
    aspectRatings: Object.fromEntries(Object.entries(aspect).filter(([, value]) => Number.isFinite(Number(value))).map(([key, value]) => [key, rating(value)])),
    recommended: typeof row.recommend === "boolean" ? row.recommend : null,
    proof: { available: proofUrls.length > 0, urls: proofUrls },
    publishedAt: isoDate(row.approvedAt || row.updatedAt || row.createdAt),
    submittedAt: isoDate(row.createdAt),
  };
}

function summarize(reviews) {
  const rated = reviews.filter((review) => review.rating > 0);
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rated.forEach((review) => { ratingDistribution[Math.min(5, Math.max(1, Math.round(review.rating)))] += 1; });
  return {
    totalApproved: reviews.length,
    averageRating: rated.length ? Number((rated.reduce((sum, review) => sum + review.rating, 0) / rated.length).toFixed(2)) : 0,
    ratingDistribution,
    reviewsWithPublicProof: reviews.filter((review) => review.proof.available).length,
    totalReportedPayouts: reviews.reduce((sum, review) => sum + review.payoutCount, 0),
  };
}

export async function legacyReviews(request, env, routeFirm = "") {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" } });
  if (request.method !== "GET") return json({ ok: false, error: "Method not allowed", code: "method_not_allowed" }, 405);
  const url = new URL(request.url);
  const requestedFirm = slugify(routeFirm || url.searchParams.get("firm"));
  const page = Math.max(1, Math.min(10000, Number.parseInt(url.searchParams.get("page"), 10) || 1));
  const limit = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("limit"), 10) || 20));
  const exactRating = Math.max(0, Math.min(5, Number.parseInt(url.searchParams.get("rating"), 10) || 0));
  const minRating = Math.max(0, Math.min(5, Number.parseInt(url.searchParams.get("minRating"), 10) || 0));
  const sort = clean(url.searchParams.get("sort") || "newest", 20).toLowerCase();
  if (!["newest", "oldest", "highest", "lowest"].includes(sort)) return json({ ok: false, error: "sort must be newest, oldest, highest or lowest", code: "invalid_sort" }, 400);
  const result = await env.DB.prepare("SELECT id,data FROM documents WHERE collection='reviews' AND LOWER(COALESCE(status,'')) IN ('approved','published','publish') LIMIT 2500").all();
  let approved = result.results.map(parsed).filter(Boolean).map(publicReview).filter((review) => review.id && review.firm.slug && review.text);
  if (requestedFirm) approved = approved.filter((review) => review.firm.slug === requestedFirm);
  const summary = summarize(approved);
  let filtered = approved.filter((review) => (!exactRating || Math.round(review.rating) === exactRating) && (!minRating || review.rating >= minRating));
  const time = (review) => new Date(review.publishedAt || review.submittedAt || 0).getTime() || 0;
  filtered.sort((a, b) => sort === "oldest" ? time(a) - time(b) : sort === "highest" ? b.rating - a.rating || time(b) - time(a) : sort === "lowest" ? a.rating - b.rating || time(b) - time(a) : time(b) - time(a));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const reviews = filtered.slice((page - 1) * limit, page * limit);
  let firm = null;
  if (requestedFirm) {
    const firmRow = parsed(await env.DB.prepare("SELECT id,data FROM documents WHERE collection='firms' AND (slug=? OR (COALESCE(slug,'')='' AND id=?)) ORDER BY updated_at DESC LIMIT 1").bind(requestedFirm, requestedFirm).first()) || {};
    firm = { slug: requestedFirm, name: clean(firmRow.name || approved[0]?.firm?.name || requestedFirm, 120), logo: publicUrl(firmRow.logoUrl || firmRow.logo), website: publicUrl(firmRow.website), reviewsPage: `${ORIGIN}/prop-firms/${encodeURIComponent(requestedFirm)}/reviews` };
  }
  const query = new URLSearchParams({ ...(requestedFirm ? { firm: requestedFirm } : {}), page: String(page), limit: String(limit), ...(exactRating ? { rating: String(exactRating) } : {}), ...(minRating ? { minRating: String(minRating) } : {}), ...(sort !== "newest" ? { sort } : {}) });
  const self = `${ORIGIN}/api/reviews?${query}`;
  return json({ ok: true, apiVersion: "1.0", firm, summary, filters: { firm: requestedFirm || null, rating: exactRating || null, minRating: minRating || null, sort }, pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }, reviews, links: { self, documentation: `${ORIGIN}/review-api`, next: page < totalPages ? self.replace(`page=${page}`, `page=${page + 1}`) : null, previous: page > 1 ? self.replace(`page=${page}`, `page=${page - 1}`) : null }, attribution: { name: "Rank My Prop", url: `${ORIGIN}/reviews`, required: true }, generatedAt: new Date().toISOString() }, 200, { "access-control-allow-origin": "*", "cache-control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30", "x-robots-tag": "noindex" });
}

function pageContentId(pathname, search) {
  const path = String(pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  if (!parts.length) return "home-hero";
  if (path === "/offers") return "offers-page";
  if (path === "/compare") return "compare-page";
  if (path === "/reviews") return "firm-reviews-page";
  if (path === "/prop-firm-rules") return "prop-firm-rules-page";
  if (path === "/firm-rules") return params.get("firm") ? `firm-rules-${slugify(params.get("firm"))}` : "prop-firm-rules-page";
  if (parts[0] === "prop-firms" && parts[1]) return `firm-review-${slugify(parts[1])}`;
  if (parts[0] === "prop-firm-rules" && parts[1]) return parts[2] ? `challenge-model-${slugify(parts[1])}-${slugify(parts[2])}` : `firm-rules-${slugify(parts[1])}`;
  if (parts[0] === "offers" && parts[1]) return `offer-${slugify(parts[1])}`;
  if (parts.length >= 2 && ["blog", "news", "trading-guides", "funding-strategies", "trading-psychology", "beginner-tutorials"].includes(parts[0])) return `article-${slugify(parts[0])}-${slugify(parts[1])}`;
  return `page-${slugify(parts.join("-")) || "home"}`;
}

function normalizeContent(source, id, pathname, search) {
  const heading = clean(source.heading || [source.titlePrimary, source.titleAccent].filter(Boolean).join(" "));
  const paragraph = clean(source.paragraph || source.heroText || source.description);
  const canonical = clean(source.canonical || `${ORIGIN}${pathname === "/firm-rules" && search ? `${pathname}${search}` : pathname}`);
  return { id, heading, paragraph, seoTitle: clean(source.seoTitle || source.title || heading), seoDescription: clean(source.seoDescription || source.metaDescription || paragraph), canonical, robots: clean(source.robots || "index, follow, max-image-preview:large, max-snippet:-1"), schema: source.schema && typeof source.schema === "object" ? source.schema : null, updatedAt: source.updatedAt || null, __stableSsrHero: true };
}

export async function legacyPageContent(request, env) {
  if (request.method !== "GET") return json({ ok: false, error: "Method not allowed" }, 405);
  const url = new URL(request.url);
  const pathname = url.searchParams.get("pathname") || "/";
  const search = url.searchParams.get("search") || "";
  const id = pageContentId(pathname, search);
  let row = parsed(await env.DB.prepare("SELECT id,data FROM documents WHERE collection='publicPageContent' AND id=?").bind(id).first());
  if (!row) row = parsed(await env.DB.prepare("SELECT id,data FROM documents WHERE collection='pageHeadingsParagraphs' AND id=?").bind(id).first());
  let firm = null;
  if (url.searchParams.get("includeFirm") === "1" || (!row && /^(firm-review|firm-rules|challenge-model)-/.test(id))) {
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[0] === "prop-firms" || parts[0] === "prop-firm-rules" ? slugify(parts[1]) : slugify(new URLSearchParams(search.replace(/^\?/, "")).get("firm"));
    if (slug) firm = parsed(await env.DB.prepare("SELECT id,data FROM documents WHERE collection='firms' AND (slug=? OR (COALESCE(slug,'')='' AND id=?)) ORDER BY updated_at DESC LIMIT 1").bind(slug, slug).first());
    if (firm?.showRules === false && !id.startsWith("firm-review-")) firm = null;
    if (!row && firm) {
      const name = clean(firm.name || slug, 120);
      const rules = !id.startsWith("firm-review-");
      row = { id, heading: rules ? `${name} Rules` : (firm.overviewTitle || name), paragraph: rules ? (firm.rulesText || `Published ${name} challenge rules and account conditions.`) : (firm.overviewShort || firm.overview || ""), seoTitle: rules ? `${name} Rules | Rank My Prop` : `${name} Review | Rank My Prop`, seoDescription: firm.metaDescription || firm.overviewShort || firm.overview || "" };
    }
  }
  if (!row) return json({ ok: false, id, unavailable: true }, 404, { "cache-control": "no-store" });
  const record = normalizeContent(row, id, pathname, search);
  return json({ ok: true, id, version: clean(record.updatedAt?.seconds || record.updatedAt || "0"), record, firm }, 200, { "cache-control": "no-store, max-age=0, must-revalidate" });
}

export async function legacyNewsletter(request, env, requireAdmin) {
  if (request.method === "GET") {
    await requireAdmin(request, env);
    const result = await env.DB.prepare("SELECT id,data FROM documents WHERE collection='newsletter' ORDER BY created_at DESC LIMIT 1000").all();
    return json({ ok: true, rows: result.results.map(parsed).filter(Boolean) }, 200, { "cache-control": "no-store" });
  }
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  const input = await request.json();
  const email = clean(input?.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "Enter a valid email address." }, 400);
  const id = await sha256(email);
  const existing = await env.DB.prepare("SELECT id FROM documents WHERE collection='newsletter' AND id=?").bind(id).first();
  const now = new Date().toISOString();
  const data = { email, source: clean(input?.source || "rankmyprop-homepage", 100), status: "active", createdAt: now, updatedAt: now };
  await env.DB.prepare(`INSERT INTO documents(collection,id,data,email,status,created_at,updated_at) VALUES('newsletter',?,?,?,?,?,?) ON CONFLICT(collection,id) DO UPDATE SET data=excluded.data,email=excluded.email,status='active',updated_at=excluded.updated_at`).bind(id, JSON.stringify(data), email, "active", now, now).run();
  return json({ ok: true, alreadySubscribed: Boolean(existing) }, existing ? 200 : 201);
}

function decodeXml(value = "") { return String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(); }
export async function legacyYoutube(request) {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const channelId = "UCdErQzX-O6KymTozg6xyTEQ";
  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { headers: { "user-agent": "RankMyProp/1.0 (+https://www.rankmyprop.in)" } });
    if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`);
    const videos = [...(await response.text()).matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 3).map((match) => {
      const block = match[1];
      const field = (pattern) => decodeXml(block.match(pattern)?.[1] || "");
      const videoId = field(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
      const title = field(/<title>([\s\S]*?)<\/title>/);
      return { id: `youtube-${videoId}`, videoId, title, description: field(/<media:description>([\s\S]*?)<\/media:description>/).split(/\n\s*\n/)[0] || `Watch ${title} from Rank My Prop for practical prop firm research and trader insights.`, youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`, thumbUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, authorName: "Rank My Prop", publishedAt: field(/<published>([\s\S]*?)<\/published>/) };
    }).filter((video) => video.videoId && video.title);
    return json({ channelId, source: "youtube-feed", videos }, 200, { "cache-control": "public, s-maxage=900, stale-while-revalidate=3600" });
  } catch { return json({ error: "Latest videos are temporarily unavailable", videos: [] }, 502); }
}

export async function legacyAdminStats(request, env, requireAdmin) {
  await requireAdmin(request, env);
  const users = await env.DB.prepare("SELECT COUNT(*) AS count FROM auth_users WHERE disabled=0").first();
  const counts = async (collections, pending = false) => {
    const placeholders = collections.map(() => "?").join(",");
    const query = `SELECT COUNT(*) AS count FROM documents WHERE collection IN (${placeholders})${pending ? " AND LOWER(COALESCE(status,''))='pending'" : ""}`;
    return Number((await env.DB.prepare(query).bind(...collections).first())?.count || 0);
  };
  return json({ ok: true, stats: { users: Number(users?.count || 0), cashback: await counts(["cashbackRequests"]), pendingClaims: await counts(["accountClaims", "claims", "claimRequests"], true), pendingReviews: await counts(["reviews"], true) } });
}
