(function () {
  "use strict";

  var path = ((window.location.pathname.split("/").pop() || "index.html").split("?")[0] || "index.html").toLowerCase();

  var COUNTRY_CODE_ALIASES = {
    america: "US",
    bolivia: "BO",
    brunei: "BN",
    capeverde: "CV",
    congo: "CG",
    democraticrepublicofthecongo: "CD",
    drcongo: "CD",
    drc: "CD",
    easttimor: "TL",
    england: "GB",
    holland: "NL",
    hongkong: "HK",
    ivorycoast: "CI",
    kosovo: "XK",
    laos: "LA",
    macao: "MO",
    macau: "MO",
    micronesia: "FM",
    moldova: "MD",
    northkorea: "KP",
    palestine: "PS",
    russia: "RU",
    southkorea: "KR",
    swaziland: "SZ",
    syria: "SY",
    taiwan: "TW",
    tanzania: "TZ",
    thebahamas: "BS",
    thegambia: "GM",
    turkey: "TR",
    turkiye: "TR",
    uae: "AE",
    uk: "GB",
    unitedarabemirates: "AE",
    unitedkingdom: "GB",
    unitedstates: "US",
    unitedstatesofamerica: "US",
    us: "US",
    usa: "US",
    venezuela: "VE",
    vietnam: "VN"
  };
  var countryCodeLookup = null;

  function normalizeCountryName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\([^)]*\)/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function getCountryCodeLookup() {
    if (countryCodeLookup) return countryCodeLookup;
    countryCodeLookup = {};
    if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
      return Object.assign(countryCodeLookup, COUNTRY_CODE_ALIASES);
    }
    try {
      var names = new Intl.DisplayNames(["en"], { type: "region" });
      for (var first = 65; first <= 90; first += 1) {
        for (var second = 65; second <= 90; second += 1) {
          var code = String.fromCharCode(first, second);
          var label = names.of(code);
          if (!label || label === code || code === "ZZ") continue;
          countryCodeLookup[normalizeCountryName(label)] = code;
        }
      }
    } catch (_) {}
    Object.assign(countryCodeLookup, COUNTRY_CODE_ALIASES);
    return countryCodeLookup;
  }

  function countryCodeForLabel(label) {
    var raw = String(label || "").trim();
    if (/^[a-z]{2}$/i.test(raw)) return raw.toUpperCase();
    var key = normalizeCountryName(raw);
    return getCountryCodeLookup()[key] || COUNTRY_CODE_ALIASES[key] || "";
  }

  function emojiFlag(code) {
    return String.fromCodePoint.apply(null, code.split("").map(function (char) {
      return 127397 + char.charCodeAt(0);
    }));
  }

  function enhanceRestrictedCountryFlags() {
    var pills = document.querySelectorAll("#firmRestrictedCountries .country-pill");
    pills.forEach(function (pill) {
      var icon = pill.firstElementChild;
      if (!icon || icon.tagName !== "SPAN") return;
      var fullText = pill.textContent || "";
      var iconText = icon.textContent || "";
      var countryName = fullText.indexOf(iconText) === 0 ? fullText.slice(iconText.length).trim() : fullText.trim();
      var code = countryCodeForLabel(countryName);
      if (!code || icon.dataset.countryFlag === code) return;

      var image = document.createElement("img");
      image.src = "https://flagcdn.com/w40/" + code.toLowerCase() + ".png";
      image.srcset = "https://flagcdn.com/w80/" + code.toLowerCase() + ".png 2x";
      image.alt = "";
      image.width = 20;
      image.height = 15;
      image.loading = "lazy";
      image.decoding = "async";
      image.style.cssText = "display:block;width:20px;height:15px;object-fit:cover;border-radius:2px;box-shadow:0 0 0 1px rgba(255,255,255,.16)";
      image.addEventListener("error", function () {
        icon.textContent = emojiFlag(code);
      }, { once: true });

      icon.dataset.countryFlag = code;
      icon.style.display = "inline-flex";
      icon.style.width = "20px";
      icon.style.flex = "0 0 20px";
      icon.style.alignItems = "center";
      icon.style.justifyContent = "center";
      icon.textContent = "";
      icon.appendChild(image);
    });
  }

  function initRestrictedCountryFlags() {
    enhanceRestrictedCountryFlags();
    var target = document.getElementById("firmRestrictedCountries");
    if (!target || typeof MutationObserver !== "function") return;
    new MutationObserver(enhanceRestrictedCountryFlags).observe(target, { childList: true, subtree: true });
  }

  var FALLBACKS = {
    general: {
      label: "Prop Trading FAQ",
      lead: "Frequently",
      trail: "asked questions",
      supportTitle: "Still have a question?",
      supportText: "Can't find the answer to your question? Send us an email and we'll get back to you as soon as possible.",
      supportButtonText: "Send email",
      supportButtonLink: "mailto:support@rankmyprop.in",
      items: [
        { q: "How does Rank My Prop review trading firms?", a: "We compare rules, payout reliability, drawdown structure, and trader usability before ranking firms." },
        { q: "How are firms ranked on Rank My Prop?", a: "Firms are evaluated on consistency, transparency, support quality, pricing, and payout behavior." },
        { q: "How does Rank My Prop verify payout proofs?", a: "Our team checks proof format, account context, and consistency before listing proof-backed claims." },
        { q: "Do firms pay to be ranked on Rank My Prop?", a: "No. Rankings are based on evaluation criteria and trader relevance, not paid placement." },
        { q: "How often are rankings updated?", a: "Rankings are reviewed regularly and updated when firms change rules, payouts, or policy quality." }
      ]
    },
    discount: {
      label: "Discount FAQ",
      lead: "Frequently",
      trail: "asked questions",
      supportTitle: "Need a better offer?",
      supportText: "Share your preferred firm and account size. We'll help you find the best available deal.",
      supportButtonText: "Request offer",
      supportButtonLink: "mailto:support@rankmyprop.in?subject=Discount%20help",
      items: [
        { q: "Are discount codes verified before listing?", a: "Yes. We verify active status and source before showing offers." },
        { q: "Can discount and cashback be used together?", a: "Some firms allow stacking while others do not. Check each offer's terms before checkout." },
        { q: "How often are discount pages refreshed?", a: "Discount pages are reviewed frequently and updated whenever offer status changes." },
        { q: "Why does a code stop working?", a: "Codes can expire, hit usage limits, or get replaced by firm-side updates." },
        { q: "Should I choose only by discount?", a: "No. Always compare firm rules, payout history, and support quality with the discount value." }
      ]
    },
    firm: {
      label: "Firm Detail FAQ",
      lead: "Frequently",
      trail: "asked questions",
      supportTitle: "Need help choosing this firm?",
      supportText: "Send us your strategy and risk style. We'll help you decide if this firm fits your trading plan.",
      supportButtonText: "Get guidance",
      supportButtonLink: "mailto:support@rankmyprop.in?subject=Firm%20selection%20help",
      items: [
        { q: "What should I check first on a firm detail page?", a: "Start with drawdown model, payout cycle, consistency limits, and restricted strategies." },
        { q: "Is this firm good for scalping or swing trading?", a: "Check allowed strategy notes and execution constraints on the firm profile." },
        { q: "Are fee and reset policies included?", a: "Yes. We include important fee and policy details wherever available." },
        { q: "How do I compare this firm with others?", a: "Use Listed Prop Firms and Best Prop Firms pages for side-by-side comparisons." },
        { q: "Does Rank My Prop track rule changes?", a: "Yes. We update profiles when key trading and payout rules change." }
      ]
    },
    tool: {
      label: "Tool FAQ",
      lead: "Frequently",
      trail: "asked questions",
      supportTitle: "Need calculator help?",
      supportText: "Tell us your account size and risk limit. We'll help you use the tool correctly.",
      supportButtonText: "Ask support",
      supportButtonLink: "mailto:support@rankmyprop.in?subject=Tool%20help",
      items: [
        { q: "Are tool results financial advice?", a: "No. Tools are for planning and education only." },
        { q: "Can I use these tools for any prop firm?", a: "Yes. Enter your firm-specific rule values for better accuracy." },
        { q: "Why are my numbers different from broker output?", a: "Different spread, commission, and contract specs can change final values." },
        { q: "Can I save my calculations?", a: "You can copy and store outputs manually while we continue adding workflow features." },
        { q: "Do you support custom risk models?", a: "Yes. Most tools allow flexible inputs for custom planning." }
      ]
    },
    blog: {
      label: "Blog FAQ",
      lead: "Frequently",
      trail: "asked questions",
      supportTitle: "Want deeper guidance?",
      supportText: "Share your trading question and we'll help with practical next steps.",
      supportButtonText: "Send email",
      supportButtonLink: "mailto:support@rankmyprop.in?subject=Blog%20question",
      items: [
        { q: "How do I apply this guide in real trading?", a: "Break the article into checklist actions and apply one change at a time." },
        { q: "Does this article fit beginners?", a: "Yes. Start with risk basics first, then apply advanced steps." },
        { q: "Can article strategies work on funded accounts?", a: "Yes, when adapted to your firm's drawdown and rule framework." },
        { q: "Where can I compare firms mentioned here?", a: "Use Listed Prop Firms and Best Prop Firms for structured comparison." },
        { q: "How often is educational content updated?", a: "We refresh key guides as market and prop firm policies evolve." }
      ]
    },
    legal: {
      label: "Policy FAQ",
      lead: "Frequently",
      trail: "asked questions",
      supportTitle: "Need policy clarification?",
      supportText: "Contact us and we'll clarify policy language and usage scope.",
      supportButtonText: "Contact us",
      supportButtonLink: "mailto:support@rankmyprop.in?subject=Policy%20question",
      items: [
        { q: "Is this legal page updated regularly?", a: "Yes. Policy pages are revised when platform rules or compliance requirements change." },
        { q: "Who should I contact for policy questions?", a: "Use the support email shown on this page for official clarification." },
        { q: "Do policy updates apply immediately?", a: "Unless stated otherwise, updated policy terms apply from the publish date." },
        { q: "Can I request data correction or deletion?", a: "Yes. Submit a request through the listed contact channel." },
        { q: "Where do I find all policy pages?", a: "Use footer links to access privacy, terms, cookies, and related policies." }
      ]
    }
  };
  var PAGE_FALLBACKS = {
    "lotsizecalculator": {
      label: "Lot Size FAQ",
      items: [
        { q: "How is lot size calculated here?", a: "Lot size is derived from account risk amount divided by stop-loss value and pip value inputs." },
        { q: "Which risk percent should I use?", a: "Most funded traders use 0.25% to 1% risk per trade based on consistency goals." },
        { q: "Why does lot size change with stop loss?", a: "Wider stop means larger risk per lot, so allowed lot size is reduced automatically." }
      ]
    },
    "lossrecoveryplanner": {
      label: "Recovery FAQ",
      items: [
        { q: "What does safe recovery mean?", a: "Safe recovery means rebuilding equity without crossing daily or max drawdown limits." },
        { q: "Should I increase risk after a loss?", a: "Usually no. Controlled fixed-risk recovery is safer than aggressive risk jumps." },
        { q: "Can this plan work for any prop firm?", a: "Yes. Just match your firm's daily and overall drawdown rules in inputs." }
      ]
    },
    "ruletranslator": {
      label: "Rule Explainer FAQ",
      items: [
        { q: "What does Rule Explainer simplify?", a: "It breaks down firm clauses like daily drawdown, consistency, and payout locks into plain language." },
        { q: "Can I compare two firms with it?", a: "Yes. Translate each firm's key clauses and compare risk impact before buying." },
        { q: "Should I still read original terms?", a: "Yes. Use this as clarity support, then confirm exact legal wording on the firm site." }
      ]
    },
    "tradejournal": {
      label: "Trade Journal FAQ",
      items: [
        { q: "What should I log after each trade?", a: "Record setup reason, risk size, execution notes, and post-trade mistakes for pattern tracking." },
        { q: "How does journaling help funded challenges?", a: "It improves consistency and helps reduce repeat errors that cause drawdown breaches." },
        { q: "How often should I review journal entries?", a: "Review weekly to identify recurring execution problems and adjust your rule checklist." }
      ]
    },
    "risk-to-reward-calculator": {
      label: "R:R FAQ",
      items: [
        { q: "What is breakeven win rate?", a: "It is the minimum win rate needed so expected profits and losses cancel out." },
        { q: "Is higher R:R always better?", a: "Not always. Pick R:R that fits your strategy's realistic hit rate and execution style." },
        { q: "Does this include spread and commissions?", a: "No. Add a small buffer for trading costs while planning." }
      ]
    },
    "drawdown-calculator": {
      label: "Drawdown FAQ",
      items: [
        { q: "Difference between daily and max drawdown?", a: "Daily drawdown resets each day, while max drawdown tracks deeper account decline." },
        { q: "How do I avoid breach risk?", a: "Reduce lot size as buffer shrinks and stop trading when daily buffer gets thin." },
        { q: "Can I use equity instead of balance?", a: "Yes, if your firm calculates limits on equity fluctuations." }
      ]
    },
    "profit-split-calculator": {
      label: "Payout FAQ",
      items: [
        { q: "How is trader payout calculated?", a: "Gross profit is split by payout ratio, then fees and deductions are subtracted." },
        { q: "Why check minimum payout threshold?", a: "Many firms process payouts only after a minimum eligible amount is reached." },
        { q: "Can tax reduce final withdrawal?", a: "Yes. Withholding or fee deductions can reduce received amount." }
      ]
    },
    "consistency-rule-calculator": {
      label: "Consistency FAQ",
      items: [
        { q: "What is consistency limit?", a: "It caps how much one day can contribute to total target profit." },
        { q: "How do I stay within consistency?", a: "Spread gains across sessions and avoid one oversized winning day." },
        { q: "Does one breach fail the account?", a: "Depends on firm policy. Always verify exact consistency clause in your rules." }
      ]
    },
    "ai-prop-firm-finder": {
      label: "Finder FAQ",
      items: [
        { q: "How are firm matches ranked?", a: "Matches are scored using trading style fit, risk model fit, payout preference, and firm profile data." },
        { q: "Can I trust this as final selection?", a: "Use it as shortlist guidance, then confirm rules and payouts on firm detail pages." },
        { q: "Does region matter in matching?", a: "Yes. Region filters help prioritize firms relevant to your location and constraints." }
      ]
    }
  };
  var BLOG_PAGE_MAP = {
    "prop-news": "prop-news-post",
    "trading-guides": "trading-guides-post",
    "funding-strategies": "funding-strategies-post",
    "trading-psychology": "trading-psychology-post",
    "beginner-tutorials": "beginner-tutorials-post"
  };

  function shouldSkipFaq() {
    if (/^admin-/.test(path)) return true;
    if (/^(prop-news|prop-news-post|blog-post-\d+|content-post|trading-guides|funding-strategies|trading-psychology|beginner-tutorials|giveaways|giveaway|tradejournal)(?:\.html)?$/.test(path)) return true;
    if (/^\/(?:news|trading-guides|funding-strategies|trading-psychology|beginner-tutorials)\/[^/]+\/?$/i.test(String(window.location.pathname || ""))) return true;
    if (/^(listedprop|bestprop|best-prop-firms-2026|fast-payout-prop-firms|best-instant-funding-firms|best-futures-prop-firms|most-trusted-prop-firms|beginner-friendly-firms|highest-rated-firms|cheapest-prop-firms|best-hft-prop-firms)(?:\.html)?$/.test(path)) return true;
    if (/^(dashboard|onboarding|login|cashback|reviews|claims|bonus|referral|edit-profile|my-profile)\.html$/.test(path)) return true;
    if (document.querySelector("#firmNameHeading, .detail-nav-bar")) return true;
    if (String(window.location.pathname || "").toLowerCase().indexOf("/prop-firms/") === 0) return true;
    if (path === "assets/logo-concepts/logo-preview.html") return true;
    return false;
  }

  function getPageKey() {
    var url = new URL(window.location.href);
    var parts = String(url.pathname || "/").split("/").filter(Boolean).map(function (x) { return String(x || "").toLowerCase(); });
    if (parts[0] === "prop-firms" && parts[1]) {
      var routeSlug = slugifyDetail(parts[1]);
      if (routeSlug) return routeSlug;
    }

    var name = path.replace(/\.html$/, "") || "index";
    if (name === "firm-detail" || name === "firm-rules" || name === "firm-reviews") {
      var qSlug = slugifyDetail(url.searchParams.get("slug") || url.searchParams.get("firmSlug") || "");
      if (qSlug) return qSlug;
    }

    if (name === "prop-news-post") {
      var params = new URLSearchParams(url.search || "");
      var slug = String(params.get("slug") || "").trim().toLowerCase();
      var type = String(params.get("type") || "prop-news").trim().toLowerCase();
      var prefix = BLOG_PAGE_MAP[type] || BLOG_PAGE_MAP["prop-news"];
      if (slug) return prefix + ":" + slug;
      return prefix;
    }
    return name;
  }

  function getPageType(key) {
    var parts = String(window.location.pathname || "/").split("/").filter(Boolean).map(function (x) { return String(x || "").toLowerCase(); });
    if (parts[0] === "prop-firms" && parts[1]) return "firm";
    if (/^(firm-detail|firm-rules|firm-reviews)$/.test(key)) return "firm";
    if (
      /^blog-post-/.test(key) ||
      /^(blog|trading-guides|funding-strategies|trading-psychology|beginner-tutorials)$/.test(key) ||
      /^(prop-news-post|trading-guides-post|funding-strategies-post|trading-psychology-post|beginner-tutorials-post)(:|$)/.test(key)
    ) return "blog";
    if (key.indexOf("discount") >= 0) return "discount";
    if (key.indexOf("detail") >= 0) return "firm";
    if (/(calculator|planner|translator|journal)/.test(key)) return "tool";
    if (/^(about|contact|faq|cookiespolicy|privacypolicy|termsofservice|legal|disclaimer)$/.test(key)) return "legal";
    return "general";
  }

  function toDocId(key) {
    return "page-" + String(key || "index")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
  }

  var FAQ_CACHE_PREFIX = "rmpFaqCfg:";
  var FAQ_CACHE_TTL = 15 * 60 * 1000;
  var faqApiCfgPromise = null;

  function faqCacheKey(key, type) {
    return FAQ_CACHE_PREFIX + String(type || "general") + ":" + String(key || "index");
  }

  function readFaqCache(key, type) {
    try {
      var raw = localStorage.getItem(faqCacheKey(key, type));
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.t || !parsed.data) return null;
      if ((Date.now() - Number(parsed.t || 0)) > FAQ_CACHE_TTL) return null;
      return parsed.data;
    } catch (_) {
      return null;
    }
  }

  function writeFaqCache(key, type, data) {
    try {
      localStorage.setItem(faqCacheKey(key, type), JSON.stringify({
        t: Date.now(),
        data: data || {}
      }));
    } catch (_) {}
  }

  function fsValue(v) {
    if (!v || typeof v !== "object") return undefined;
    if (Object.prototype.hasOwnProperty.call(v, "stringValue")) return String(v.stringValue || "");
    if (Object.prototype.hasOwnProperty.call(v, "booleanValue")) return Boolean(v.booleanValue);
    if (Object.prototype.hasOwnProperty.call(v, "integerValue")) return Number(v.integerValue || 0);
    if (Object.prototype.hasOwnProperty.call(v, "doubleValue")) return Number(v.doubleValue || 0);
    if (Object.prototype.hasOwnProperty.call(v, "arrayValue")) {
      var arr = (v.arrayValue && v.arrayValue.values) || [];
      return arr.map(fsValue);
    }
    if (Object.prototype.hasOwnProperty.call(v, "mapValue")) {
      var out = {};
      var fields = (v.mapValue && v.mapValue.fields) || {};
      Object.keys(fields).forEach(function (k) { out[k] = fsValue(fields[k]); });
      return out;
    }
    return undefined;
  }

  function fsDocToObj(doc) {
    var out = {};
    var fields = (doc && doc.fields) || {};
    Object.keys(fields).forEach(function (k) { out[k] = fsValue(fields[k]); });
    return out;
  }

  function getFaqApiCfg() {
    if (faqApiCfgPromise) return faqApiCfgPromise;
    faqApiCfgPromise = import("./firebase-config.js").then(function (m) {
      return (m && m.firebaseConfig) || null;
    }).catch(function () { return null; });
    return faqApiCfgPromise;
  }

  async function fetchFaqDocRest(docId) {
    var cfg = await getFaqApiCfg();
    if (!cfg || !cfg.projectId || !cfg.apiKey) return null;

    var url = "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(cfg.projectId) +
      "/databases/(default)/documents/pageFaqs/" +
      encodeURIComponent(String(docId || "")) +
      "?key=" + encodeURIComponent(cfg.apiKey);

    try {
      var res = await fetch(url, { cache: "no-store", credentials: "omit" });
      if (!res.ok) return null;
      var json = await res.json();
      return fsDocToObj(json);
    } catch (_) {
      return null;
    }
  }

  function esc(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmt(v) {
    var h = esc(v);
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, u) {
      return '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + t + "</a>";
    });
    h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    h = h.replace(/==([^=]+)==/g, '<mark class="rmp-faq-mark">$1</mark>');
    return h;
  }

  function parseFaqText(text) {
    var blocks = String(text || "").split(/\n\s*\n/g);
    var items = [];
    blocks.forEach(function (block) {
      var row = block.trim();
      if (!row) return;
      var pair = row.split("||");
      if (pair.length < 2) return;
      var q = String(pair.shift() || "").trim();
      var a = String(pair.join("||") || "").trim();
      if (!q || !a) return;
      items.push({ q: q, a: a });
    });
    return items;
  }

  function mailtoToGmailCompose(mailtoLink) {
    var raw = String(mailtoLink || "").trim().replace(/^\/+/, "");
    if (!/^mailto:/i.test(raw)) return "";
    try {
      var url = new URL(raw);
      var to = String(url.pathname || "").replace(/^\/+/, "").trim();
      var q = new URLSearchParams();
      q.set("view", "cm");
      q.set("fs", "1");
      q.set("tf", "cm");
      if (to) q.set("to", to);
      var cc = String(url.searchParams.get("cc") || "").trim();
      var bcc = String(url.searchParams.get("bcc") || "").trim();
      var subject = String(url.searchParams.get("subject") || url.searchParams.get("su") || "").trim();
      var body = String(url.searchParams.get("body") || "").trim();
      if (cc) q.set("cc", cc);
      if (bcc) q.set("bcc", bcc);
      if (subject) q.set("su", subject);
      if (body) q.set("body", body);
      return "https://mail.google.com/mail/?" + q.toString();
    } catch (_) {
      return "";
    }
  }

  function normalizeSupportButtonLink(raw) {
    return "/contact";
  }

  function normalizeFaq(data, key, type) {
    var fbType = FALLBACKS[type] || FALLBACKS.general;
    var fbPage = PAGE_FALLBACKS[key] || {};
    var fb = {
      label: String(fbPage.label || fbType.label),
      lead: String(fbType.lead || "Frequently"),
      trail: String(fbType.trail || "asked questions"),
      supportTitle: String(fbType.supportTitle || "Need help?"),
      supportText: String(fbType.supportText || ""),
      supportButtonText: String(fbType.supportButtonText || "Send email"),
      supportButtonLink: String(fbType.supportButtonLink || "mailto:support@rankmyprop.in"),
      items: Array.isArray(fbPage.items) && fbPage.items.length ? fbPage.items : (fbType.items || [])
    };
    var items = [];

    if (Array.isArray(data && data.items)) {
      items = data.items.map(function (x) {
        return { q: String(x && x.q || "").trim(), a: String(x && x.a || "").trim() };
      }).filter(function (x) { return x.q && x.a; });
    }
    if (!items.length) items = parseFaqText(data && data.faqText);
    if (!items.length) items = fb.items.slice(0);

    return {
      pageKey: key,
      pageType: type,
      label: String(data && data.label || fb.label),
      lead: String(data && data.lead || fb.lead),
      trail: String(data && data.trail || fb.trail),
      supportTitle: String(data && data.supportTitle || fb.supportTitle),
      supportText: String(data && data.supportText || fb.supportText),
      supportButtonText: String(data && data.supportButtonText || fb.supportButtonText),
      supportButtonLink: String(data && data.supportButtonLink || fb.supportButtonLink),
      items: items.slice(0, 10)
    };
  }

  async function loadFaqConfig(key, type) {
    var cached = readFaqCache(key, type);
    var fb = normalizeFaq(cached, key, type);

    var byPage = await fetchFaqDocRest(toDocId(key));
    if (byPage) {
      writeFaqCache(key, type, byPage);
      return normalizeFaq(byPage, key, type);
    }

    if (type === "firm") {
      var legacyKeys = Array.from(new Set([
        String(key || "") + "detail",
        String(key || "") + "detail.html",
        "prop-firms/" + String(key || ""),
        "/prop-firms/" + String(key || "")
      ].map(function (x) { return String(x || "").trim().toLowerCase(); }).filter(Boolean)));

      for (var i = 0; i < legacyKeys.length; i += 1) {
        var legacyDoc = await fetchFaqDocRest(toDocId(legacyKeys[i]));
        if (!legacyDoc) continue;
        writeFaqCache(key, type, legacyDoc);
        return normalizeFaq(legacyDoc, key, type);
      }
    }

    var byType = await fetchFaqDocRest("type-" + type);
    if (byType) {
      writeFaqCache(key, type, byType);
      return normalizeFaq(byType, key, type);
    }

    return fb;
  }

  function renderFaq(cfg) {
    var footer = document.querySelector("footer");
    if (!footer) return null;
    if (document.getElementById("rmpFaqSection")) return null;
    if (document.getElementById("faqSection")) return null;

    var wrap = document.createElement("section");
    wrap.id = "rmpFaqSection";
    wrap.className = "rmp-faq-shell";

    var list = cfg.items.map(function (item, i) {
      return [
        '<article class="rmp-faq-item" data-open="0">',
        '<button type="button" class="rmp-faq-q" aria-expanded="false" aria-controls="rmpFaqA' + i + '">',
        '<span>' + fmt(item.q) + '</span>',
        '<span class="rmp-faq-icon">⌄</span>',
        '</button>',
        '<div id="rmpFaqA' + i + '" class="rmp-faq-a"><div>' + fmt(item.a) + '</div></div>',
        '</article>'
      ].join("");
    }).join("");

    var supportHref = normalizeSupportButtonLink(cfg.supportButtonLink);
    var supportTarget = /^https?:\/\//i.test(supportHref) ? ' target="_blank" rel="noopener noreferrer"' : "";
    wrap.innerHTML = [
      '<div class="rmp-faq-bg"></div>',
      '<div class="rmp-faq-grid">',
      '<div class="rmp-faq-left">',
      '<span class="rmp-faq-pill">' + esc(cfg.label) + '</span>',
      '<h2 class="rmp-faq-title"><span>' + fmt(cfg.lead) + '</span><strong>' + fmt(cfg.trail) + '</strong></h2>',
      '<div class="rmp-faq-help">',
      '<h3>' + fmt(cfg.supportTitle) + '</h3>',
      '<p>' + fmt(cfg.supportText) + '</p>',
      '<a class="rmp-faq-mail" href="' + esc(supportHref) + '"' + supportTarget + '>' + esc(cfg.supportButtonText) + '</a>',
      '</div>',
      '</div>',
      '<div class="rmp-faq-right">' + list + '</div>',
      '</div>'
    ].join("");

    footer.parentNode.insertBefore(wrap, footer);

    var items = wrap.querySelectorAll(".rmp-faq-item");
    items.forEach(function (item) {
      var btn = item.querySelector(".rmp-faq-q");
      btn.addEventListener("click", function () {
        items.forEach(function (x) {
          if (x !== item) {
            x.dataset.open = "0";
            var qb = x.querySelector(".rmp-faq-q");
            if (qb) qb.setAttribute("aria-expanded", "false");
          }
        });
        var open = item.dataset.open === "1";
        item.dataset.open = open ? "0" : "1";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });

    return wrap;
  }


  function quickLinkConfig() {
    var path = String(location.pathname || "/").toLowerCase();
    if (/admin|dashboard|login|signup|profile|404|checkout/.test(path)) return null;
    var core = [
      { label: "Compare Prop Firms", href: "/compare" },
      { label: "Best Prop Firms", href: "/bestprop" },
      { label: "Prop Firm Discounts", href: "/discount" },
      { label: "Prop Firm Rules", href: "/propfirmrule" },
      { label: "Payout Proofs", href: "/payout-proofs" }
    ];
    if (path.indexOf("/prop-firms/") === 0 || path.indexOf("firm-detail") !== -1) {
      return { eyebrow: "Firm research links", title: "Quick Links For Firm Research", text: "Jump to the most useful Rank My Prop sections before choosing a firm.", links: core };
    }
    if (path.indexOf("compare-prop-firms") !== -1) {
      return { eyebrow: "Compare shortcuts", title: "Quick Links For Comparing Firms", text: "Use these pages to verify payouts, rules, offers, and rankings after comparing firms.", links: [core[2], core[3], core[4], { label: "Prop Firm Reviews", href: "/reviews" }, core[1]] };
    }
    if (path.indexOf("discount") !== -1 || path.indexOf("offer") !== -1) {
      return { eyebrow: "Offer research", title: "Quick Links For Discount Research", text: "Check rules, reviews, payouts, and comparisons before using any prop firm offer.", links: [core[0], core[3], core[4], { label: "Prop Firm Reviews", href: "/reviews" }, core[1]] };
    }
    if (path.indexOf("rule") !== -1) {
      return { eyebrow: "Rule research", title: "Quick Links For Prop Firm Rules", text: "Compare rules with payouts, reviews, and discount pages before selecting a challenge.", links: [core[0], core[4], { label: "Rule Explainer", href: "/ruletranslator" }, { label: "Prop Firm Reviews", href: "/reviews" }, core[1]] };
    }
    if (/calculator|lotsize|drawdown|risk-to-reward|profit-split|consistency|lossrecovery|tradejournal|ruletranslator/.test(path)) {
      return { eyebrow: "Trader tools", title: "Quick Links For Trading Tools", text: "Move between calculators and research pages while planning funded account risk.", links: [
        { label: "Lot Size Calculator", href: "/lotsizecalculator" },
        { label: "Drawdown Calculator", href: "/drawdown-calculator" },
        { label: "Risk-to-Reward Calculator", href: "/risk-to-reward-calculator" },
        { label: "Consistency Rule Calculator", href: "/consistency-rule-calculator" },
        core[0]
      ] };
    }
    if (/blog|trading-guides|funding-strategies|trading-psychology|beginner-tutorials|prop-news/.test(path)) {
      return { eyebrow: "Learning paths", title: "Quick Links For Prop Trading Guides", text: "Connect education content with firm comparisons, rules, discounts, and payout research.", links: [
        { label: "Trading Guides", href: "/trading-guides" },
        { label: "Funding Strategies", href: "/funding-strategies" },
        { label: "Beginner Tutorials", href: "/beginner-tutorials" },
        core[0],
        core[1]
      ] };
    }
    if (path.indexOf("payout") !== -1) {
      return { eyebrow: "Payout research", title: "Quick Links For Payout Checks", text: "Verify payout proof alongside rules, reviews, and compare pages.", links: [core[0], core[3], { label: "Prop Firm Reviews", href: "/reviews" }, core[2], core[1]] };
    }
    return { eyebrow: "Rank My Prop shortcuts", title: "Quick Links For Prop Firm Research", text: "Explore the highest-value pages for comparing prop firms, rules, offers, and payouts.", links: core };
  }

  function renderQuickLinks() {
    if (/^(listedprop|bestprop)(?:\.html)?$/.test(path)) return null;
    if (document.getElementById("rmpQuickLinksSection")) return null;
    if (document.querySelector(".rmp-research-panels")) return null;
    var footer = document.querySelector("footer");
    if (!footer) return null;
    var cfg = quickLinkConfig();
    if (!cfg || !Array.isArray(cfg.links) || !cfg.links.length) return null;
    var wrap = document.createElement("section");
    wrap.id = "rmpQuickLinksSection";
    wrap.className = "rmp-quick-links-shell";
    wrap.innerHTML = [
      '<div class="rmp-quick-links-card">',
      '<div class="rmp-quick-links-head">',
      '<span class="rmp-quick-links-pill">' + esc(cfg.eyebrow || "Quick links") + '</span>',
      '<h2>' + esc(cfg.title || "Quick Links") + '</h2>',
      '<p>' + esc(cfg.text || "Explore related Rank My Prop pages.") + '</p>',
      '</div>',
      '<div class="rmp-quick-links-grid">' + cfg.links.map(function (link) {
        return '<a href="' + esc(link.href) + '"><span>' + esc(link.label) + '</span><strong>&gt;</strong></a>';
      }).join("") + '</div>',
      '</div>'
    ].join("");
    var faq = document.getElementById("rmpFaqSection");
    footer.parentNode.insertBefore(wrap, faq || footer);
    return wrap;
  }

  function mountStyle() {
    var style = document.createElement("style");
    style.textContent = [
      ".rmp-reveal{opacity:0;transform:translateY(20px);filter:blur(5px);transition:opacity .56s ease,transform .56s ease,filter .56s ease}",
      ".rmp-reveal.rmp-visible{opacity:1;transform:none;filter:none}",
      ".rmp-quick-links-shell{position:relative;width:100%;padding:40px 24px 0;background:#05040b}",
      ".rmp-quick-links-card{max-width:1100px;margin:0 auto;border:1px solid rgba(127,99,255,.34);border-radius:20px;background:linear-gradient(135deg,rgba(16,14,29,.96),rgba(10,8,18,.98));box-shadow:0 22px 48px rgba(0,0,0,.42);padding:24px}",
      ".rmp-quick-links-head{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}",
      ".rmp-quick-links-pill{display:inline-flex;align-self:flex-start;padding:7px 14px;border-radius:999px;border:1px solid rgba(127,99,255,.45);background:rgba(127,99,255,.14);color:#cfc9ff;font:700 11px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase}",
      ".rmp-quick-links-head h2{margin:0;color:#f5f3ff;font:700 clamp(22px,2.2vw,30px)/1.16 'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em}",
      ".rmp-quick-links-head p{margin:0;color:#aeb4d4;font:400 14px/1.65 'Plus Jakarta Sans',sans-serif;max-width:760px}",
      ".rmp-quick-links-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}",
      ".rmp-quick-links-grid a{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;padding:12px 14px;border:1px solid rgba(127,99,255,.3);border-radius:13px;background:rgba(255,255,255,.035);color:#f2f0ff;text-decoration:none;font:700 13px/1.25 'Plus Jakarta Sans',sans-serif;transition:background .18s ease,border-color .18s ease,transform .18s ease}",
      ".rmp-quick-links-grid a:hover{background:rgba(127,99,255,.16);border-color:rgba(127,99,255,.62);transform:translateY(-1px)}",
      ".rmp-quick-links-grid strong{color:#8b5cf6;font-size:16px;line-height:1}",
      "@media(max-width:900px){.rmp-quick-links-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.rmp-quick-links-shell{padding:30px 14px 0}.rmp-quick-links-card{padding:18px}}",
      "@media(max-width:520px){.rmp-quick-links-grid{grid-template-columns:1fr}}",
      ".rmp-faq-shell{position:relative;width:100%;max-width:none;margin:0;padding:120px 24px;background:transparent}",
      ".rmp-faq-bg{display:none}",
      ".rmp-faq-grid{position:relative;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.1fr 1fr;gap:42px;align-items:flex-start;padding:0;border:none;border-radius:0;overflow:visible;background:transparent}",
      ".rmp-faq-left{display:flex;flex-direction:column;gap:14px}",
      ".rmp-faq-pill{display:inline-flex;align-self:flex-start;padding:6px 16px;border-radius:999px;border:1px solid rgba(120,110,255,.35);background:rgba(120,110,255,.12);font: 400 12px/1.1 'Plus Jakarta Sans',sans-serif;color:#cfd2ff}",
      ".rmp-faq-title{margin:0 0 4px;font: 400 clamp(32px,4.2vw,46px)/1.15 'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em;color:#f3f6ff;max-width:none}",
      ".rmp-faq-title span{display:block;white-space:nowrap;background:linear-gradient(90deg,#9f95ff 6%,#6f66ff 62%,#c9c4ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}",
      ".rmp-faq-title strong{display:block;white-space:nowrap;font-weight:400;color:#eef2ff}",
      ".rmp-faq-help{position:relative;max-width:600px;background:rgba(255,255,255,0.035);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:24px 22px;box-shadow:0 20px 40px rgba(0,0,0,0.45)}",
      ".rmp-faq-help h3{margin:0 0 10px;font: 500 18px/1.25 'Plus Jakarta Sans',sans-serif;letter-spacing:-.01em;color:#fff}",
      ".rmp-faq-help p{margin:0 0 14px;font: 400 14px/1.6 'Plus Jakarta Sans',sans-serif;color:#9ca3af;max-width:100%}",
      ".rmp-faq-mail{display:inline-flex;align-items:center;justify-content:center;min-width:92px;padding:10px 16px;background:linear-gradient(180deg,#7a74ff,#5b55ff);border:none;border-radius:12px;color:#fff;text-decoration:none;font: 500 13px/1 'Plus Jakarta Sans',sans-serif;box-shadow:0 0 20px rgba(120,110,255,0.4)}",
      ".rmp-faq-right{display:flex;flex-direction:column;gap:12px}",
      ".rmp-faq-item{background:rgba(255,255,255,0.035);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden}",
      ".rmp-faq-q{width:100%;padding:16px 18px;background:transparent;border:0;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;text-align:left;font:500 15px/1.45 'Plus Jakarta Sans',sans-serif}",
      ".rmp-faq-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(120,110,255,0.15);border:1px solid rgba(120,110,255,0.35);font-size:12px;line-height:1;transition:transform .3s ease;color:#7a74ff}",
      ".rmp-faq-a{max-height:0;overflow:hidden;opacity:0;transition:max-height .45s ease,opacity .35s ease;padding:0 16px}",
      ".rmp-faq-a div{padding:0 0 14px;font: 400 13px/1.65 'Plus Jakarta Sans',sans-serif;color:#9ca3af}",
      ".rmp-faq-item[data-open='1'] .rmp-faq-a{max-height:340px;opacity:1}",
      ".rmp-faq-item[data-open='1'] .rmp-faq-icon{transform:rotate(180deg)}",
      ".rmp-faq-mark{background:linear-gradient(90deg,rgba(247,219,94,.92),rgba(245,243,107,.92));color:#0b0b16;padding:.08em .26em;border-radius:4px}",
      ".rmp-faq-shell a{color:#d3ccff;text-decoration:underline;text-decoration-color:rgba(211,204,255,.65)}",
      ".rmp-faq-shell a:hover{color:#fff}",
      "@media(max-width:1100px){.rmp-faq-grid{grid-template-columns:1fr;gap:24px}.rmp-faq-title{font-size:36px}.rmp-faq-help{max-width:none}.rmp-faq-q{font-size:14px}.rmp-faq-a div{font-size:13px}}",
      "@media(max-width:640px){.rmp-faq-shell{padding:80px 14px}.rmp-faq-grid{gap:14px}.rmp-faq-title{font-size:30px;line-height:1.18}.rmp-faq-title span,.rmp-faq-title strong{white-space:normal}.rmp-faq-help{padding:16px 14px}.rmp-faq-help h3{font-size:16px}.rmp-faq-help p,.rmp-faq-a div{font-size:12px}.rmp-faq-q{padding:13px 12px;font-size:13px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function runReveal(extraNode) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    var selectors = [
      "header",
      "main section",
      ".top",
      ".panel",
      ".card",
      ".link-card",
      ".announce-item",
      ".event-item",
      ".alert-item",
      ".help-card",
      ".hero",
      ".hero-content",
      "footer",
      "#rmpFaqSection"
    ];

    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors.join(",")));
    if (extraNode) nodes.push(extraNode);

    var seen = new Set();
    var targets = nodes.filter(function (el) {
      if (!el || seen.has(el)) return false;
      seen.add(el);
      return true;
    });

    targets.forEach(function (el, idx) {
      if (el.classList.contains("rmp-reveal") || el.classList.contains("rmp-motion-item")) return;
      el.classList.add("rmp-reveal");
      el.style.transitionDelay = Math.min(idx * 35, 420) + "ms";
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("rmp-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });

    requestAnimationFrame(function () {
      targets.slice(0, 6).forEach(function (el) { el.classList.add("rmp-visible"); });
    });
  }

  function bootContentCmsRuntime() {
    if (window.self !== window.top) return;
    if (!path || /^(index|home-page|admin-|dashboard|login|onboarding|my-profile|edit-profile)/.test(path)) return;
    if (window.__rmpContentCmsRuntimeScriptBooted) return;
    window.__rmpContentCmsRuntimeScriptBooted = true;
    var s = document.createElement("script");
    s.defer = true;
    s.src = "/content-cms-runtime.js";
    document.head.appendChild(s);
  }

  function slugifyDetail(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function resolveDetailFirmSlug() {
    var fromCtx = slugifyDetail(window.__rmpFirmContext && window.__rmpFirmContext.firmSlug);
    if (fromCtx) return fromCtx;

    var fromBody = slugifyDetail(document.body && document.body.dataset && document.body.dataset.firmSlug);
    if (fromBody) return fromBody;

    var url = new URL(window.location.href);
    var q = slugifyDetail(url.searchParams.get("slug") || url.searchParams.get("firmSlug") || "");
    if (q) return q;

    var parts = String(url.pathname || "/").split("/").filter(Boolean);
    var last = String(parts[parts.length - 1] || "").toLowerCase();
    var tabSet = { overview: 1, rules: 1, challenges: 1, reviews: 1, spreads: 1, announcements: 1 };
    if (last.endsWith("detail.html")) return slugifyDetail(last.replace("detail.html", ""));
    if (parts.length >= 2 && tabSet[last]) return slugifyDetail(parts[parts.length - 2] || "");
    if (last && !last.endsWith(".html")) return slugifyDetail(last);

    var h = document.getElementById("firmNameHeading");
    return slugifyDetail(h && h.textContent);
  }

  function initDetailReviewRouting() {
    var nav = document.querySelector(".detail-nav-item[data-view='reviews']");
    if (!nav) return;

    var reviewUrl = function () {
      var slug = resolveDetailFirmSlug();
      return slug ? ("firm-reviews.html?slug=" + encodeURIComponent(slug)) : "firm-reviews.html";
    };

    var applyLinks = function () {
      var url = reviewUrl();
      var reviewNav = document.querySelector(".detail-nav-item[data-view='reviews']");
      if (reviewNav && reviewNav.tagName === "A") reviewNav.setAttribute("href", url);
      if (reviewNav) {
        reviewNav.setAttribute("role", "link");
        reviewNav.setAttribute("tabindex", "0");
        reviewNav.style.cursor = "pointer";
      }
      var leaveBtn = document.getElementById("firmLeaveReviewBtn");
      if (leaveBtn && leaveBtn.tagName === "A") leaveBtn.setAttribute("href", url);
      document.querySelectorAll("a.review-btn").forEach(function (el) { el.setAttribute("href", url); });
    };

    applyLinks();
    setTimeout(applyLinks, 250);
    setTimeout(applyLinks, 1200);

    document.addEventListener("click", function (e) {
      var target = e.target && e.target.closest && e.target.closest(".detail-nav-item[data-view='reviews']");
      if (!target) return;
      e.preventDefault();
      window.location.href = reviewUrl();
    }, true);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var target = document.activeElement;
      if (!target || !target.matches || !target.matches(".detail-nav-item[data-view='reviews']")) return;
      e.preventDefault();
      window.location.href = reviewUrl();
    }, true);
  }

  var __rmpDetailStatsBusy = false;
  async function refreshDetailLiveReviewStats() {
    var scoreEl = document.getElementById("firmScoreValue");
    var badgeEl = document.getElementById("detailReviewsBadge");
    if (!scoreEl || !badgeEl) return;
    if (__rmpDetailStatsBusy) return;
    __rmpDetailStatsBusy = true;
    try {
      var slug = resolveDetailFirmSlug();
      var h = document.getElementById("firmNameHeading");
      var firmName = String(h && h.textContent || "").trim();
      var slugSet = new Set([slugifyDetail(slug), slugifyDetail(firmName)].filter(Boolean));
      var nameSet = new Set([String(firmName || "").trim().toLowerCase()].filter(Boolean));
      var nameExact = new Set([String(firmName || "").trim()].filter(Boolean));
      if (!slugSet.size && !nameSet.size) return;

      var mods = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
        import("./firebase-config.js")
      ]);
      var appMod = mods[0];
      var fsMod = mods[1];
      var cfgMod = mods[2];
      var app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfgMod.firebaseConfig);
      var db = fsMod.getFirestore(app);
      var rows = [];
      var pull = async function (q) {
        try {
          var snap = await fsMod.getDocs(q);
          snap.forEach(function (d) { rows.push({ id: d.id, data: d.data() || {} }); });
        } catch (_) {}
      };
      var sts = ["Approved", "approved", "Published", "published", "Publish", "publish"];

      var tasks = [];
      for (var i = 0; i < sts.length; i += 1) {
        var st = sts[i];
        slugSet.forEach(function (s) {
          tasks.push(pull(fsMod.query(fsMod.collection(db, "reviews"), fsMod.where("firmSlug", "==", s), fsMod.where("status", "==", st), fsMod.limit(600))));
        });
      }
      await Promise.all(tasks);

      if (!rows.length && nameExact.size) {
        tasks = [];
        for (var j = 0; j < sts.length; j += 1) {
          var st2 = sts[j];
          nameExact.forEach(function (n) {
            tasks.push(pull(fsMod.query(fsMod.collection(db, "reviews"), fsMod.where("firm", "==", n), fsMod.where("status", "==", st2), fsMod.limit(600))));
            tasks.push(pull(fsMod.query(fsMod.collection(db, "reviews"), fsMod.where("firmName", "==", n), fsMod.where("status", "==", st2), fsMod.limit(600))));
          });
        }
        await Promise.all(tasks);
      }

      if (!rows.length) {
        for (var k = 0; k < sts.length; k += 1) {
          await pull(fsMod.query(fsMod.collection(db, "reviews"), fsMod.where("status", "==", sts[k]), fsMod.limit(2500)));
        }
      }

      var uniq = new Map();
      rows.forEach(function (row) {
        var d = row.data || {};
        var cSlugs = [
          slugifyDetail(d.firmSlug || ""),
          slugifyDetail(d.slug || ""),
          slugifyDetail(d.firmName || ""),
          slugifyDetail(d.firm || ""),
          slugifyDetail(d.name || "")
        ].filter(Boolean);
        var cNames = [
          String(d.firmName || "").trim().toLowerCase(),
          String(d.firm || "").trim().toLowerCase(),
          String(d.name || "").trim().toLowerCase()
        ].filter(Boolean);
        var ok = false;
        for (var x = 0; x < cSlugs.length; x += 1) { if (slugSet.has(cSlugs[x])) { ok = true; break; } }
        if (!ok) { for (var y = 0; y < cNames.length; y += 1) { if (nameSet.has(cNames[y])) { ok = true; break; } } }
        if (!ok) return;
        var id = String(row.id || "");
        if (!id) return;
        uniq.set(id, d);
      });

      var list = Array.from(uniq.values());
      var count = list.length;
      var avg = 0;
      if (count) {
        avg = list.reduce(function (s, r) {
          var v = Number(r && r.rating || 0);
          if (!Number.isFinite(v)) v = 0;
          v = Math.max(0, Math.min(5, v));
          return s + v;
        }, 0) / count;
      }
      var traders = new Set(list.map(function (r) {
        return String(r && (r.uid || r.userUid || r.userId || r.reviewerUid || r.email || r.userEmail || r.reviewerEmail || r.userName || r.name || "" ) || "").trim();
      }).filter(Boolean)).size || count;

      scoreEl.textContent = (count ? avg : 0).toFixed(1);
      if (typeof window.renderScoreStars === "function") {
        window.renderScoreStars(count ? avg : 0);
      } else {
        var starsEl = document.getElementById("firmScoreStars");
        if (starsEl) {
          var n = Math.max(0, Math.min(5, Math.round(count ? avg : 0)));
          starsEl.textContent = "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
        }
      }
      var trustedEl = document.getElementById("firmTrustedText");
      if (trustedEl) trustedEl.textContent = count ? ("Trusted by " + traders + " traders") : "No approved reviews yet";
      var cnt = String(count);
      badgeEl.textContent = cnt;
      var ov = document.getElementById("overviewReviewChip");
      if (ov) ov.textContent = cnt;
    } catch (_) {
    } finally {
      __rmpDetailStatsBusy = false;
    }
  }

  async function boot() {
    initRestrictedCountryFlags();
    bootContentCmsRuntime();
    mountStyle();
    initDetailReviewRouting();
    refreshDetailLiveReviewStats();
    setTimeout(refreshDetailLiveReviewStats, 800);
    setTimeout(refreshDetailLiveReviewStats, 2200);

    var faqNode = null;
    if (!shouldSkipFaq() && document.querySelector("footer")) {
      var key = getPageKey();
      var type = getPageType(key);
      var initialCfg = normalizeFaq(readFaqCache(key, type), key, type);
      faqNode = renderFaq(initialCfg);
      renderQuickLinks();
      runReveal(faqNode);

      loadFaqConfig(key, type).then(function (cfg) {
        if (!cfg) return;
        if (JSON.stringify(cfg) === JSON.stringify(initialCfg)) return;
        if (faqNode && faqNode.parentNode) faqNode.parentNode.removeChild(faqNode);
        faqNode = renderFaq(cfg) || faqNode;
      }).catch(function () {});
      return;
    }

    renderQuickLinks();
    runReveal(faqNode);
  }

  boot();
})();
