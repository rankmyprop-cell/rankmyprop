"use strict";

const ORIGIN = "https://www.rankmyprop.in";

function slugify(value = "") {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function cleanPath(value = "/") {
  const raw = String(value || "/").split("?")[0].split("#")[0].trim() || "/";
  const pathname = raw.startsWith("/") ? raw : `/${raw}`;
  return pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
}

function pageContentIdForRoute(route = "/", search = "") {
  const pathname = cleanPath(route);
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  if (!parts.length) return "home-hero";
  if (pathname === "/offers") return "offers-page";
  if (pathname === "/compare") return "compare-page";
  if (pathname === "/reviews") return "firm-reviews-page";
  if (pathname === "/prop-firm-rules") return "prop-firm-rules-page";
  if (pathname === "/firm-rules") {
    const firm = slugify(query.get("firm"));
    return firm ? `firm-rules-${firm}` : "prop-firm-rules-page";
  }
  if (parts[0] === "prop-firms" && parts[1]) {
    const firm = slugify(parts[1]);
    if (parts[2] === "reviews") return `firm-review-${firm}`;
    return `firm-review-${firm}`;
  }
  if (parts[0] === "prop-firm-rules" && parts[1]) {
    const firm = slugify(parts[1]);
    const model = slugify(parts[2]);
    return model ? `challenge-model-${firm}-${model}` : `firm-rules-${firm}`;
  }
  if (parts[0] === "offers" && parts[1]) return `offer-${slugify(parts[1])}`;
  if (parts.length >= 2 && ["blog", "news", "trading-guides", "funding-strategies", "trading-psychology", "beginner-tutorials"].includes(parts[0])) return `article-${slugify(parts[0])}-${slugify(parts[1])}`;
  return `page-${slugify(parts.join("-")) || "home"}`;
}

function canonicalForRoute(route = "/", search = "") {
  const pathname = cleanPath(route);
  const id = pageContentIdForRoute(pathname, search);
  if (pathname === "/firm-rules" && id.startsWith("firm-rules-")) return `${ORIGIN}/firm-rules?firm=${encodeURIComponent(id.slice("firm-rules-".length))}`;
  return `${ORIGIN}${pathname}`;
}

function text(value = "") { return String(value ?? "").replace(/\s+/g, " ").trim(); }

function normalizeRecord(raw = {}, context = {}) {
  const heading = text(raw.heading || [raw.titlePrimary, raw.titleAccent].filter(Boolean).join(" "));
  const paragraph = text(raw.paragraph || raw.heroText || raw.description);
  const canonical = text(raw.canonical || canonicalForRoute(context.pathname, context.search));
  return {
    id: text(raw.id || context.id),
    heading,
    paragraph,
    seoTitle: text(raw.seoTitle || raw.title || heading),
    seoDescription: text(raw.seoDescription || raw.metaDescription || paragraph),
    canonical,
    robots: text(raw.robots || "index, follow, max-image-preview:large, max-snippet:-1"),
    schema: raw.schema && typeof raw.schema === "object" ? raw.schema : null,
    updatedAt: raw.updatedAt || null,
    __stableSsrHero: raw.__stableSsrHero === true,
  };
}

function hasMeaningfulContent(record) {
  return Boolean(record && (text(record.heading) || text(record.paragraph) || text(record.seoTitle) || text(record.seoDescription)));
}

function selectRouteRecord({ backend, ssr, lastGood, staticRecord, fallback, context }) {
  const candidates = [backend, ssr, lastGood, staticRecord, fallback];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const record = normalizeRecord(candidate, context);
    if (record.id && record.id !== context.id) continue;
    if (hasMeaningfulContent(record)) return record;
  }
  return normalizeRecord({ id: context.id }, context);
}

function injectRouteBootstrap(html = "", rawRecord = {}, context = {}, version = "") {
  const record = normalizeRecord({ ...rawRecord, id: context.id, __stableSsrHero: true }, context);
  if (!hasMeaningfulContent(record) || record.id !== context.id) return String(html || "");
  const payload = { ...record, version: String(version || "") };
  const tag = `<script id="rmp-ssr-bootstrap">window.__RMP_SSR_BOOTSTRAP=${JSON.stringify(payload).replace(/</g, "\\u003c")};</script>`;
  const source = String(html || "");
  if (/<script\s+id=["']rmp-ssr-bootstrap["']>[\s\S]*?<\/script>/i.test(source)) {
    return source.replace(/<script\s+id=["']rmp-ssr-bootstrap["']>[\s\S]*?<\/script>/i, tag);
  }
  return source.replace(/<\/head>/i, `${tag}\n</head>`);
}

module.exports = { ORIGIN, canonicalForRoute, cleanPath, hasMeaningfulContent, injectRouteBootstrap, normalizeRecord, pageContentIdForRoute, selectRouteRecord, slugify };
