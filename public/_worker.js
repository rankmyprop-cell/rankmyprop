const API_ORIGIN = "https://rankmyprop-api.theforexclue.workers.dev";
const LEGACY_BLOG_REDIRECTS = {
  "01": "/beginner-friendly-firms", "02": "/news/how-prop-firm-payout-verification-works",
  "03": "/news/understanding-daily-drawdown-limits", "04": "/prop-firm-rules",
  "05": "/news/weekend-holding-rules-explained", "06": "/news/prop-firm-discount-codes-how-to-use-safely",
  "07": "/news/best-prop-firms-for-scalping-traders", "08": "/news/best-prop-firms-for-swing-traders",
  "09": "/news/profit-split-models-compared", "10": "/news/news-trading-rules-at-top-prop-firms",
  "11": "/news/how-to-pass-a-prop-firm-evaluation-faster", "12": "/news/soft-breach-vs-hard-breach-rules",
  "13": "/news/how-maximum-loss-rules-impact-position-size", "14": "/news/top-mistakes-that-fail-prop-firm-challenges",
  "15": "/news/how-to-build-a-funded-account-risk-plan", "16": "/news/copy-trading-policies-across-prop-firms",
  "17": "/news/do-prop-firms-allow-expert-advisors-eas", "18": "/news/best-funded-account-scaling-plans",
  "19": "/news/how-to-compare-challenge-fees-properly", "20": "/fast-payout-prop-firms",
  "21": "/news/consistency-rules-what-traders-miss", "22": "/news/broker-spreads-and-their-impact-on-challenges",
  "23": "/news/how-leverage-affects-challenge-success", "24": "/news/best-prop-firms-for-low-drawdown-traders",
  "25": "/news/can-you-hold-trades-over-news-events", "26": "/news/payout-denial-red-flags-to-avoid",
  "27": "/news/regional-restrictions-in-prop-trading", "28": "/news/how-to-read-prop-firm-terms-conditions",
  "29": "/news/top-trader-habits-for-long-term-funding",
};
const CONTENT_CONSOLIDATION_REDIRECTS = new Map([
  ["/news/best-prop-firms-for-beginners-2026", "/beginner-friendly-firms"],
  ["/news/best-prop-firms-for-beginners-in-2026", "/beginner-friendly-firms"],
  ["/news/best-prop-firms-for-beginners-in-2026-top-easy-funded-accounts-to-start-with", "/beginner-friendly-firms"],
  ["/news/best-prop-firms-for-beginners-in-2026-top-funded-accounts-to-start-trading", "/beginner-friendly-firms"],
  ["/news/best-prop-firms-for-forex-beginners-in-2026-top-funded-accounts-for-new-traders", "/beginner-friendly-firms"],
  ["/news/best-prop-firms-for-forex-beginners-in-2026-top-funded-accounts-to-start-your-trading-journey", "/beginner-friendly-firms"],
  ["/news/best-instant-funding-prop-firms-for-beginners-in-2026-top-no-challenge-accounts-ranked", "/best-instant-funding-firms"],
  ["/news/best-instant-funding-prop-firms-in-2026-top-instant-funded-accounts-ranked", "/best-instant-funding-firms"],
  ["/news/best-instant-funding-prop-firms-in-2026-top-no-challenge-funded-accounts", "/best-instant-funding-firms"],
  ["/news/best-cheap-prop-firms-in-2026-top-budget-friendly-funded-accounts-ranked", "/cheapest-prop-firms"],
  ["/news/best-cheap-prop-firms-in-2026-top-low-cost-funded-accounts-ranked", "/cheapest-prop-firms"],
  ["/news/cheapest-prop-firm-challenges-2026", "/cheapest-prop-firms"],
  ["/news/best-prop-firms-with-instant-payouts-in-2026-top-funded-trading-firms-for-fast-withdrawals", "/fast-payout-prop-firms"],
  ["/news/fastest-paying-prop-firms-in-2026-top-funded-trading-firms-with-quick-withdrawals", "/fast-payout-prop-firms"],
  ["/news/fastest-paying-prop-firms-in-2026-top-instant-payout-funded-accounts-ranked", "/fast-payout-prop-firms"],
  ["/news/fastest-paying-prop-firms-in-2026-top-instant-payout-funded-trading-firms", "/fast-payout-prop-firms"],
  ["/news/fastest-paying-prop-firms-in-2026-which-firms-actually-pay-traders-fast", "/fast-payout-prop-firms"],
  ["/news/fastest-payout-prop-firms-this-month", "/fast-payout-prop-firms"],
  ["/news/most-trusted-prop-firms-in-2026-safest-funded-trading-firms-ranked", "/most-trusted-prop-firms"],
  ["/news/most-trusted-prop-firms-in-2026-top-reliable-funded-trading-firms-ranked", "/most-trusted-prop-firms"],
  ["/news/best-prop-firms-with-no-time-limit-in-2026-top-unlimited-challenge-funded-accounts", "/news/best-prop-firms-with-no-time-limit-in-2026-top-unlimited-evaluation-accounts"],
  ["/news/best-prop-firms-with-no-time-limit-in-2026-trade-at-your-own-pace", "/news/best-prop-firms-with-no-time-limit-in-2026-top-unlimited-evaluation-accounts"],
  ["/news/best-prop-firms-with-no-consistency-rule-in-2026-freedom-for-funded-traders", "/news/best-prop-firms-with-no-consistency-rule-in-2026-top-flexible-funded-accounts"],
  ["/news/best-one-step-prop-firms-in-2026-top-single-evaluation-funded-accounts", "/news/best-one-step-prop-firms-in-2026-top-easy-evaluation-funded-accounts"],
  ["/news/best-forex-prop-firms-in-2026-top-funded-trading-firms-for-currency-traders", "/news/best-forex-prop-firms-in-2026-top-funded-trading-firms-ranked"],
  ["/news/best-prop-firms-for-gold-traders-in-2026-top-funded-accounts-for-xauusd-trading", "/news/best-prop-firms-for-gold-trading-in-2026-top-xauusd-funded-accounts-ranked"],
  ["/news/best-prop-firms-for-gold-trading-in-2026-top-funded-accounts-for-xauusd-traders", "/news/best-prop-firms-for-gold-trading-in-2026-top-xauusd-funded-accounts-ranked"],
  ["/news/best-prop-firms-for-news-trading-in-2026-top-funded-accounts-for-high-volatility-traders", "/news/best-prop-firms-for-news-trading-in-2026-top-funded-accounts-for-high-impact-market-events"],
  ["/news/best-prop-firms-for-news-trading-in-2026-top-high-volatility-funded-accounts", "/news/best-prop-firms-for-news-trading-in-2026-top-funded-accounts-for-high-impact-market-events"],
  ["/news/best-prop-firms-for-scalping-in-2026-top-funded-accounts-for-fast-paced-traders", "/news/best-prop-firms-for-scalping-traders"],
  ["/news/best-prop-firms-for-scalping-in-2026-top-funded-accounts-for-fast-traders", "/news/best-prop-firms-for-scalping-traders"],
  ["/news/best-prop-firms-for-swing-trading-in-2026-top-funded-accounts-for-long-term-traders", "/news/best-prop-firms-for-swing-traders"],
  ["/news/best-prop-firms-for-swing-trading-in-2026-top-funded-accounts-for-patient-traders", "/news/best-prop-firms-for-swing-traders"],
  ["/news/best-swing-trading-prop-firms-in-2026-top-funded-accounts-for-swing-traders", "/news/best-prop-firms-for-swing-traders"],
  ["/news/best-prop-firms-for-small-account-traders-in-2026-top-affordable-funded-opportunities", "/news/best-prop-firms-for-small-account-traders-in-2026-top-funded-accounts-for-low-risk-trading"],
]);
const REDIRECTS = new Map([
  ["/discount", "/offers"],
  ["/sitemap-challenge-rules.xml", "/sitemaps/challenge-rules.xml"],
  ["/propfirmrule", "/prop-firm-rules"],
  ["/firm-reviews", "/reviews"],
  ["/compare-prop-firms", "/compare"],
  ["/prop-firms/traderscale", "/prop-firms/trader-scale"],
  ["/prop-firms/blueberryfunded", "/prop-firms/blueberry-funded"],
  ["/prop-firms/swayfunded", "/prop-firms/sway-funded"],
  ["/prop-firms/toponetrader", "/prop-firms/top-one-trader"],
  ["/prop-firms/goatfundedtrader", "/prop-firms/goat-funded-trader"],
  ["/prop-firms/wefund", "/prop-firms/we-fund"],
  ["/prop-firms/qtfunded", "/prop-firms/qt-funded"],
  ["/prop-firms/finotivefunding", "/prop-firms/finotive-funding"],
  ["/prop-firms/aquafunded", "/prop-firms/aqua-funded"],
  ["/prop-firms/fx2funding", "/prop-firms/fx2-funding"],
  ["/traderscaledetail", "/prop-firms/trader-scale"],
  ["/blueberrydetail", "/prop-firms/blueberry-funded"],
  ["/blueberryfundeddetail", "/prop-firms/blueberry-funded"],
  ["/swayfundeddetail", "/prop-firms/sway-funded"],
  ["/toponetraderdetail", "/prop-firms/top-one-trader"],
  ["/goatfundedtraderdetail", "/prop-firms/goat-funded-trader"],
  ["/wefunddetail", "/prop-firms/we-fund"],
  ["/qtfundeddetail", "/prop-firms/qt-funded"],
  ["/finotivefundingdetail", "/prop-firms/finotive-funding"],
  ["/funderprodetail", "/prop-firms/funderpro"],
  ["/fxifydetail", "/prop-firms/fxify"],
  ["/aquafundeddetail", "/prop-firms/aqua-funded"],
  ["/fx2fundingdetail", "/prop-firms/fx2-funding"],
  ["/fundednextdetail", "/prop-firms/fundednext"],
  ["/traderscalediscount", "/offers/trader-scale"],
  ["/blueberryfundeddiscount", "/offers/blueberry-funded"],
  ["/swayfundeddiscount", "/offers/sway-funded"],
  ["/toponetraderdiscount", "/offers/top-one-trader"],
  ["/goatfundedtraderdiscount", "/offers/goat-funded-trader"],
  ["/wefunddiscount", "/offers/we-fund"],
  ["/qtfundeddiscount", "/offers/qt-funded"],
  ["/fxifydiscount", "/offers/fxify"],
  ["/finotivefundingdiscount", "/offers/finotive-funding"],
  ["/funderprodiscount", "/offers/funderpro"],
  ["/aquafundeddiscount", "/offers/aqua-funded"],
  ["/fx2fundingdiscount", "/offers/fx2-funding"],
  ["/fundednextdiscount", "/offers/fundednext"],
  ["/privacypolicy", "/privacy-policy"],
  ["/termsofservice", "/terms"],
  ["/cookiespolicy", "/cookies-policy"],
  ["/cookie-policy", "/cookies-policy"],
  ["/best-beginner-friendly-prop-firms-in-2026", "/beginner-friendly-firms"],
  ["/best-instant-funding-firms.html", "/best-instant-funding-firms"],
  ["/forex-prop-firms", "/bestprop"],
]);

function redirectFor(url) {
  if (/^\/prop-firms\/fundednext-firm(?:\/|$)/.test(url.pathname)) return url.pathname.replace("/fundednext-firm", "/fundednext") + url.search;
  if (/^\/firm-detail(?:\.html)?$/.test(url.pathname) && url.searchParams.get("slug")) {
    const slug = url.searchParams.get("slug").toLowerCase();
    const canonicalSlug = slug === "fundednext-firm" ? "fundednext" : slug;
    const view = url.searchParams.get("view");
    return `/prop-firms/${encodeURIComponent(canonicalSlug)}${view && view !== "overview" ? "/" + encodeURIComponent(view) : ""}`;
  }
  if (url.pathname === "/firm-reviews" && url.searchParams.get("slug")) return `/prop-firms/${encodeURIComponent(url.searchParams.get("slug"))}/reviews`;
  if (CONTENT_CONSOLIDATION_REDIRECTS.has(url.pathname)) return CONTENT_CONSOLIDATION_REDIRECTS.get(url.pathname);
  if (REDIRECTS.has(url.pathname)) return REDIRECTS.get(url.pathname);
  let match = url.pathname.match(/^\/prop-firms\/([^/]+)\/rules\/?$/);
  if (match) return `/firm-rules?firm=${encodeURIComponent(match[1])}`;
  match = url.pathname.match(/^\/(?:blog\/)?blog-post-(\d+)\/?$/);
  if (match) {
    const id = String(Number(match[1])).padStart(2, "0");
    return LEGACY_BLOG_REDIRECTS[id] || `/blog/blog-post-${id}`;
  }
  return "";
}

function canonicalComparison(url) {
  const comparison = decodeURIComponent(url.pathname.replace(/^\/compare\//, "").replace(/\/+$/, ""));
  const separator = comparison.indexOf("-vs-");
  if (separator < 1) return "";
  const first = comparison.slice(0, separator);
  const second = comparison.slice(separator + 4);
  return first && second && first.localeCompare(second) > 0 ? `/compare/${second}-vs-${first}` : "";
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const canonical = canonicalComparison(incoming);
    if (canonical) return new Response(null, { status: 308, headers: { location: new URL(canonical, incoming).toString(), "cache-control": "public, max-age=0, s-maxage=86400" } });
    const redirect = redirectFor(incoming);
    if (redirect) return Response.redirect(new URL(redirect, incoming), 301);
    if (incoming.pathname.startsWith("/__/auth/")) {
      const firebase = new URL(`${incoming.pathname}${incoming.search}`, "https://rank-my-prop.firebaseapp.com");
      return fetch(new Request(firebase, request));
    }
    if (incoming.pathname.startsWith("/api/")) {
      const target = new URL(`${incoming.pathname}${incoming.search}`, API_ORIGIN);
      const headers = new Headers(request.headers);
      headers.set("x-rmp-forwarded-host", incoming.host);
      return fetch(new Request(target, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        redirect: "manual",
      }));
    }
    // Admin pages use clean URLs while their static source files keep the
    // `.html` extension. Register new admin modules here so Cloudflare assets
    // resolve them consistently with the existing admin routes.
    if (incoming.pathname === "/admin-website-popup" || incoming.pathname === "/admin-website-popup/") {
      const popupAdminUrl = new URL("/admin-website-popup.html", incoming);
      return env.ASSETS.fetch(new Request(popupAdminUrl, request));
    }
    // Resolve canonical firm pages from the live CMS-backed template so direct
    // reloads and paths created after a build use the same firm record.
    const firmProfile = incoming.pathname.match(/^\/prop-firms\/([^/]+)(?:\/(overview|rules|challenges|reviews|spreads|announcements))?\/?$/);
    if (firmProfile) {
      let slug = firmProfile[1];
      try { slug = decodeURIComponent(slug); } catch (_) {}
      // Dedicated firm review pages have their own full layout. They must not
      // be rendered inside the legacy detail-page reviews panel.
      if (firmProfile[2] === "reviews") {
        const reviewsUrl = new URL("/firm-reviews", incoming);
        reviewsUrl.searchParams.set("slug", slug);
        const firmId = incoming.searchParams.get("firmId");
        if (firmId) reviewsUrl.searchParams.set("firmId", firmId);
        return env.ASSETS.fetch(new Request(reviewsUrl, request));
      }
      // Pages clean URLs redirects `.html` paths to the extensionless route;
      // use the extensionless asset path internally to avoid a browser redirect loop.
      const detailUrl = new URL("/firm-detail", incoming);
      detailUrl.searchParams.set("slug", slug);
      const firmId = incoming.searchParams.get("firmId");
      if (firmId) detailUrl.searchParams.set("firmId", firmId);
      if (firmProfile[2] && firmProfile[2] !== "overview") detailUrl.searchParams.set("view", firmProfile[2]);
      const detailRequest = new Request(detailUrl, request);
      return env.ASSETS.fetch(detailRequest);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;
    return assetResponse;
  },
};
