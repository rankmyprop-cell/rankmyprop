export const PUBLIC_COLLECTIONS = new Set([
  "announcements", "beginnerTutorialsPosts", "beginnerTutorialsVideos", "bonusOffers",
  "contributors", "firmRatingStats", "firms", "fundingStrategiesPosts", "fundingStrategiesVideos",
  "giveaways", "offers", "pageCopy", "pageFaqs", "pageHeadingsParagraphs", "pageSeoContent", "propNewsPosts", "propNewsVideos",
  "reviews", "siteSettings", "tradingGuidesPosts", "tradingGuidesVideos", "tradingPsychologyPosts",
  "tradingPsychologyVideos"
]);

export const PUSH_CATEGORIES = new Set(["announcements", "offers", "firms"]);

export function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function corsHeaders(request, env) {
  const allowed = new Set(String(env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean));
  const origin = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": allowed.has(origin) ? origin : "https://www.rankmyprop.in",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-rmp-migration-key",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

export function categories(value) {
  const source = Array.isArray(value) ? value : [];
  return [...new Set(source.map((item) => String(item || "").trim().toLowerCase()))].filter((item) => PUSH_CATEGORIES.has(item));
}

export function safeClickUrl(value) {
  const input = String(value || "/").trim();
  if (input.startsWith("/") && !input.startsWith("//")) return input;
  let parsed;
  try { parsed = new URL(input); } catch { throw new Error("Invalid RankMyProp click URL."); }
  if (!["rankmyprop.in", "www.rankmyprop.in", "rankmyprop-web.pages.dev"].includes(parsed.hostname.toLowerCase())) throw new Error("Click URL must point to RankMyProp.");
  return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function extractDocumentFields(data = {}) {
  const time = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number") return new Date(value).toISOString();
    if (typeof value?.seconds === "number") return new Date(value.seconds * 1000).toISOString();
    return null;
  };
  return {
    uid: String(data.uid || data.userUid || data.userId || "") || null,
    email: String(data.email || data.userEmail || data.reviewerEmail || "").toLowerCase() || null,
    slug: String(data.slug || data.firmSlug || data.id || "") || null,
    status: String(data.status || data.publishState || "") || null,
    createdAt: time(data.createdAt),
    updatedAt: time(data.updatedAt),
  };
}
