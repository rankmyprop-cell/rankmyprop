(function () {
  "use strict";
  if (window.__rmpRouteContentRuntimeLoaded) return;
  window.__rmpRouteContentRuntimeLoaded = true;

  var PREFIX = "rmp:last-good-route-content:";
  var VERSION_KEY = "rmp:public-cache-version";
  var bootstrap = window.__RMP_SSR_BOOTSTRAP && typeof window.__RMP_SSR_BOOTSTRAP === "object" ? window.__RMP_SSR_BOOTSTRAP : null;
  if (!bootstrap || !bootstrap.__stableSsrHero || !bootstrap.id) return;

  function clean(value) { return String(value == null ? "" : value).replace(/\s+/g, " ").trim(); }
  function slugify(value) { return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function expectedId() {
    var pathname = location.pathname.replace(/\/+$/, "") || "/";
    var parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
    var query = new URLSearchParams(location.search);
    if (!parts.length) return "home-hero";
    if (pathname === "/offers") return "offers-page";
    if (pathname === "/compare") return "compare-page";
    if (pathname === "/reviews") return "firm-reviews-page";
    if (pathname === "/prop-firm-rules") return "prop-firm-rules-page";
    if (pathname === "/firm-rules") { var firmId = slugify(query.get("firm")); return firmId ? "firm-rules-" + firmId : "prop-firm-rules-page"; }
    if (parts[0] === "prop-firms" && parts[1]) return "firm-review-" + slugify(parts[1]);
    if (parts[0] === "prop-firm-rules" && parts[1]) return parts[2] ? "challenge-model-" + slugify(parts[1]) + "-" + slugify(parts[2]) : "firm-rules-" + slugify(parts[1]);
    if (parts[0] === "offers" && parts[1]) return "offer-" + slugify(parts[1]);
    if (parts.length >= 2 && ["blog", "news", "trading-guides", "funding-strategies", "trading-psychology", "beginner-tutorials"].includes(parts[0])) return "article-" + slugify(parts[0]) + "-" + slugify(parts[1]);
    return "page-" + slugify(parts.join("-"));
  }
  var routeId = expectedId();
  var authoritativeRecord = null;
  var hydrationApplyQueued = false;
  // Query-driven rules pages share one HTML shell but have distinct CMS identities.
  if (location.pathname.replace(/\/+$/, "") === "/firm-rules") {
    var firm = slugify(new URLSearchParams(location.search).get("firm"));
    if (firm) bootstrap = Object.assign({}, bootstrap, { id: "firm-rules-" + firm, canonical: "https://www.rankmyprop.in/firm-rules?firm=" + encodeURIComponent(firm) });
  }
  // A template/bootstrap record can only be used when it proves that it belongs
  // to this canonical browser route. Never let another page's record hydrate it.
  var bootstrapMatchesRoute = bootstrap.id === routeId;
  function current() { return { id: routeId, pathname: location.pathname || "/", search: location.search || "" }; }
  function isGeneratedHomePlaceholder(record) {
    return routeId === "home-hero"
      && clean(record?.heading).toLowerCase() === "index insights for traders"
      && clean(record?.paragraph).toLowerCase().indexOf("explore this index section") === 0;
  }
  function valid(record) { return Boolean(record && record.id === routeId && !isGeneratedHomePlaceholder(record) && (clean(record.heading) || clean(record.paragraph) || clean(record.seoTitle))); }
  function lastGood() { try { var value = JSON.parse(localStorage.getItem(PREFIX + routeId) || "null"); return valid(value) ? value : null; } catch (_) { return null; } }
  function remember(record, version) {
    if (!valid(record)) return;
    try { localStorage.setItem(PREFIX + routeId, JSON.stringify(record)); if (version) localStorage.setItem(VERSION_KEY + ":" + routeId, String(version)); } catch (_) {}
  }
  function setMeta(selector, attribute, value) { var el = document.querySelector(selector); if (el && clean(value) && el.getAttribute(attribute) !== value) el.setAttribute(attribute, value); }
  function apply(record) {
    if (!valid(record)) return;
    authoritativeRecord = record;
    // Interactive rule pages own their hero and metadata after the selected
    // account model is known. Do not restore the route bootstrap over it.
    var h1 = document.querySelector("[data-rmp-route-heading], main h1, h1");
    // Article templates resolve their title from the current article record.
    // Their generic shell bootstrap says "Loading article...", so it must never
    // be allowed to overwrite a loaded article title during hydration.
    if (document.documentElement.dataset.rmpDynamicRouteContent === "true" || h1?.classList?.contains("post-title")) return;
    if (h1 && clean(record.heading) && clean(h1.textContent) !== clean(record.heading)) h1.textContent = record.heading;
    var hero = document.querySelector("[data-rmp-route-hero], .home-hero-bg p, section.hero p, .hero p, main h1 + p");
    if (hero && clean(record.paragraph) && clean(hero.textContent) !== clean(record.paragraph)) hero.textContent = record.paragraph;
    if (clean(record.seoTitle) && document.title !== record.seoTitle) document.title = record.seoTitle;
    setMeta('meta[name="description"]', "content", record.seoDescription);
    setMeta('meta[property="og:title"]', "content", record.seoTitle);
    setMeta('meta[property="og:description"]', "content", record.seoDescription);
    setMeta('meta[name="twitter:title"]', "content", record.seoTitle);
    setMeta('meta[name="twitter:description"]', "content", record.seoDescription);
    setMeta('link[rel="canonical"]', "href", record.canonical);
    setMeta('meta[name="robots"]', "content", record.robots);
    document.documentElement.dataset.rmpRouteContentId = record.id;
  }
  async function refresh() {
    var ctx = current();
    try {
      var url = "/api/public-page-content?pathname=" + encodeURIComponent(ctx.pathname) + "&search=" + encodeURIComponent(ctx.search);
      var response = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-store" } });
      if (!response.ok) return;
      var payload = await response.json();
      if (!payload || payload.id !== routeId || !valid(payload.record)) return;
      apply(payload.record);
      remember(payload.record, payload.version);
    } catch (_) {
      // SSR bootstrap intentionally remains rendered on any public-cache failure.
    }
  }
  // SSR wins over stale local/static cache. Last-good only matters if an SSR record is absent,
  // which this branch never allows to overwrite a valid bootstrap.
  if (bootstrapMatchesRoute) {
    apply(bootstrap);
    remember(bootstrap, bootstrap.version);
  }
  // Some route templates render their static/default hero after deferred scripts run.
  // Keep the route-specific server record authoritative through that hydration pass.
  if (document.body && window.MutationObserver) {
    new MutationObserver(function () {
      if (!authoritativeRecord || hydrationApplyQueued) return;
      hydrationApplyQueued = true;
      queueMicrotask(function () {
        hydrationApplyQueued = false;
        apply(authoritativeRecord);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  refresh();
  window.addEventListener("rankmyprop-public-cache-updated", function (event) {
    var affected = event?.detail?.ids || event?.detail?.id || [];
    var ids = Array.isArray(affected) ? affected : [affected];
    if (!ids.length || ids.includes(routeId)) refresh();
  });
  window.addEventListener("storage", function (event) { if (event.key === VERSION_KEY + ":" + routeId) refresh(); });
})();
