(function () {
  "use strict";

  if (window.__rmpContentCmsRuntimeInit) return;
  window.__rmpContentCmsRuntimeInit = true;
  if (window.self !== window.top) return;
  // A route-specific SSR record is authoritative. Never let the legacy generic
  // filename/default resolver replace it during hydration.
  if (window.__RMP_SSR_BOOTSTRAP && window.__RMP_SSR_BOOTSTRAP.__stableSsrHero) {
    if (!window.__rmpRouteContentRuntimeLoaded && !document.querySelector('script[src*="route-content-runtime.js"]')) {
      var routeRuntime = document.createElement("script");
      routeRuntime.src = "/route-content-runtime.js";
      routeRuntime.defer = true;
      document.head.appendChild(routeRuntime);
    }
    // Directory/ranking templates intentionally have no native hero: this
    // runtime must still create their CMS heading block. Pages that already
    // render an h1 can safely leave hydration to the route-specific runtime.
    if (document.querySelector("[data-rmp-route-heading], main h1, h1")) return;
  }

  function routeToPageFile(pathname) {
    var raw = String(pathname || "/").split("?")[0].split("#")[0].trim();
    var parts = raw.split("/").filter(Boolean).map(function (p) { return String(p || "").toLowerCase(); });
    if (!parts.length) return "index.html";
    if (parts[0] === "prop-firms" && parts[1]) {
      if (parts[2] === "reviews") return "firm-reviews.html";
      if (parts[2] === "rules") return "firm-detail.html";
      return "firm-detail.html";
    }
    if (parts[0] === "offers" && parts[1]) return "offers-" + String(parts[1] || "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + ".html";
    if ((parts[0] === "blog" || parts[0] === "news" || parts[0] === "trading-guides" || parts[0] === "funding-strategies" || parts[0] === "trading-psychology" || parts[0] === "beginner-tutorials") && parts[1]) {
      return "prop-news-post.html";
    }
    if (parts[0] === "tools") {
      var tool = String(parts[1] || "").toLowerCase();
      if (tool === "lot-size-calculator") return "lotsizecalculator.html";
      if (tool === "pip-calculator" || tool === "risk-to-reward-calculator") return "risk-to-reward-calculator.html";
      if (tool === "profit-split-calculator") return "profit-split-calculator.html";
      if (tool === "drawdown-calculator") return "drawdown-calculator.html";
      if (tool === "consistency-rule-calculator") return "consistency-rule-calculator.html";
    }
    var last = String(parts[parts.length - 1] || "").toLowerCase();
    if (!last) return "index.html";
    return last.endsWith(".html") ? last : (last + ".html");
  }

  var file = routeToPageFile(window.location.pathname);
  if (/^about:/i.test(file)) return;
  var fileBase = String(file || "index.html").toLowerCase().replace(/\.html$/i, "");
  var routeParts = String(window.location.pathname || "/")
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean)
    .map(function (p) { return String(p || "").toLowerCase(); });
  var isDedicatedDiscountRoute = (
    (routeParts[0] === "offers" && !!routeParts[1]) ||
    (fileBase !== "discount" && fileBase !== "discount-offer" && /discount$/i.test(fileBase))
  );
  var isDedicatedRulesRoute = routeParts[0] === "prop-firm-rules" && !!routeParts[1];
  var SKIP_RE = /^(index|home-page|admin-|dashboard|login|onboarding|my-profile|edit-profile)/i;
  var CUSTOM_LAYOUT_SKIP = {
    "about": 1,
    "contact": 1,
    "legal": 1,
    "disclaimer": 1,
    "privacy-policy": 1,
    "terms": 1,
    "cookies-policy": 1,
    "trader-interviews": 1,
    "trader-leaderboard": 1,
    "success-stories": 1,
    "discord-community": 1,
    "referral-program": 1,
    "top-traders-of-month": 1,
    "events-webinars": 1,
    "payout-proofs": 1,
    "prop-firm-rules": 1,
    "firm-rules": 1,
    "faq": 1,
    "firm-reviews": 1,
    "reviews": 1,
    "announcements": 1
  };
  var DYNAMIC_SKIP = {
    "firm-detail": 1,
    "prop-news-post": 1
  };
  if (!file || SKIP_RE.test(fileBase)) return;
  if (isDedicatedDiscountRoute) return;
  if (isDedicatedRulesRoute) return;
  if (CUSTOM_LAYOUT_SKIP[fileBase]) return;
  if (DYNAMIC_SKIP[fileBase]) return;

  var YEAR = String(new Date().getFullYear());
  var PREVIEW_KEY = "rmp-page-seo-preview";
  var HUB_PAGES = {
    "blog": 1,
    "trading-guides": 1,
    "funding-strategies": 1,
    "trading-psychology": 1,
    "beginner-tutorials": 1
  };
  var CALC_CENTER_PAGES = {
    "lossrecoveryplanner": 1,
    "ruletranslator": 1
  };
  var SIMPLE_HERO_PAGES = {
    "risk-to-reward-calculator": 1,
    "drawdown-calculator": 1,
    "profit-split-calculator": 1,
    "consistency-rule-calculator": 1
  };
  var BEST_RE = /^(bestprop|best-prop-firms-2026|best-futures-prop-firms|best-hft-prop-firms|best-instant-funding-firms|fast-payout-prop-firms|cheapest-prop-firms|most-trusted-prop-firms|beginner-friendly-firms|highest-rated-firms)$/;
  var RULES_HUB_RE = /^(propfirmrule|prop-firm-rules|firm-rules)$/;
  var FIRM_NAMES = {
    aquafunded: "Aqua Funded",
    blueberry: "Blueberry",
    blueberryfunded: "Blueberry Funded",
    blueguardian: "Blue Guardian",
    directfundingtrader: "Direct Funding Trader",
    finotivefunding: "Finotive Funding",
    fundednext: "Funded Next",
    funderpro: "FunderPro",
    fx2funding: "FX2 Funding",
    fxify: "FXify",
    goatfundedtrader: "Goat Funded Trader",
    instantfunding: "Instant Funding",
    qtfunded: "QT Funded",
    swayfunded: "Sway Funded",
    theproptrade: "The Prop Trade",
    toponetrader: "Top One Trader",
    traderscale: "Trader Scale",
    wefund: "We Fund"
  };
  var SEO_COPY = {
    "listedprop": {
      heading: "Best Prop Firms 2026: Compare Funded Trading Firms",
      paragraph: "Compare the best prop firms in 2026 based on funding options, profit splits, drawdown rules, payout cycles, trading platforms, challenge fees, news trading policies, and trader reviews.",
      directCode: true
    },
    "bestprop": {
      heading: "Best Forex Prop Firms in 2026",
      paragraph: "Compare the best forex prop firms in 2026 based on payouts, trading rules, leverage, account sizes, trust score, and overall trader experience."
    },
    "best-prop-firms-2026": {
      heading: "Best Forex Prop Firms in 2026: Top-Rated Funded Trading Firms",
      paragraph: "Discover the best forex prop firms in 2026, featuring top-rated funded trading firms with detailed information on account sizes, profit splits, drawdown rules, payout cycles, trading platforms, challenge fees, news trading policies, and trader reviews.",
      directCode: true
    },
    "fast-payout-prop-firms": {
      heading: "Best Fast Payout Prop Firms in 2026: Top Firms for Quick Payouts",
      paragraph: "Discover the best fast payout prop firms in 2026, featuring funded trading firms known for quick payout cycles, flexible withdrawal options, competitive profit splits, and trader-friendly funding programs.",
      directCode: true
    },
    "best-instant-funding-firms": {
      heading: "Best Instant Funding Prop Firms in 2026: Top Instant Funded Accounts",
      paragraph: "Discover the best instant funding prop firms in 2026 offering immediate access to funded trading accounts. Explore account sizes, profit splits, payout rules, drawdown limits, trading platforms, pricing, and key trading conditions before choosing an instant funding program.",
      directCode: true
    },
    "best-hft-prop-firms": {
      heading: "Best HFT Friendly Prop Firms 2026",
      paragraph: "Compare HFT prop firms allowing scalping, expert advisors, automated trading, and high-frequency strategies with fast execution and trader-friendly conditions."
    },
    "best-futures-prop-firms": {
      heading: "Best Futures Prop Firms in 2026: Top Firms for Futures Traders",
      paragraph: "Discover the best futures prop firms in 2026 for traders looking for funded futures accounts. Explore available account sizes, profit splits, drawdown rules, payout conditions, trading platforms, scaling plans, and other key funding requirements.",
      directCode: true
    },
    "cheapest-prop-firms": {
      heading: "Cheapest Forex Prop Firms in 2026",
      paragraph: "Compare affordable prop firms with low challenge fees, budget-friendly funded accounts, flexible trading conditions, and trusted payout systems for traders."
    },
    "most-trusted-prop-firms": {
      heading: "Most Trusted Forex Prop Firms in 2026: Top Trusted Funded Trading Firms",
      paragraph: "Discover the most trusted forex prop firms in 2026 based on verification, trader reviews, payout information, rule transparency, and overall trading conditions. Explore trusted funded trading firms and their key account features before choosing a prop firm.",
      directCode: true
    },
    "beginner-friendly-firms": {
      heading: "Best Beginner-Friendly Prop Firms in 2026: Top Firms for New Traders",
      paragraph: "Discover the best beginner-friendly prop firms in 2026 for new and developing traders. Explore simple trading rules, affordable challenge fees, clear funding conditions, easy-to-use platforms, flexible account options, and trader-friendly requirements.",
      directCode: true
    },
    "highest-rated-firms": {
      heading: "Highest Rated Forex Prop Firms 2026",
      paragraph: "Compare the highest rated prop firms based on trader reviews, payout experience, platform quality, support response, and overall trading conditions."
    },
    "lotsizecalculator": {
      heading: "Forex Lot Size Calculator for Traders",
      paragraph: "Calculate accurate forex lot sizes based on account balance, stop loss, risk percentage, and currency pair to improve overall risk management."
    },
    "lossrecoveryplanner": {
      heading: "Trading Loss Recovery Calculator for Forex",
      paragraph: "Use the loss recovery calculator to estimate required profits after drawdowns and manage trading recovery strategies more effectively and safely."
    },
    "ruletranslator": {
      heading: "Prop Firm Trading Rules Explained Clearly",
      paragraph: "Understand prop firm trading rules including drawdown limits, consistency requirements, payout policies, leverage, and restricted trading strategies for funded accounts."
    },
    "tradejournal": {
      heading: "Forex Trade Journal for Performance Tracking",
      paragraph: "Track trading performance, analyze strategies, monitor risk management, and improve consistency using a professional forex trade journal for traders."
    },
    "risk-to-reward-calculator": {
      heading: "Risk Reward Ratio Calculator for Traders",
      paragraph: "Calculate risk-to-reward ratios instantly to improve trade planning, manage potential losses, and identify profitable trading opportunities with better precision."
    },
    "drawdown-calculator": {
      heading: "Forex Drawdown Calculator for Risk Management",
      paragraph: "Measure account drawdowns, recovery percentages, and capital preservation levels using an advanced forex drawdown calculator for funded trading accounts."
    },
    "profit-split-calculator": {
      heading: "Prop Firm Profit Split Calculator Online",
      paragraph: "Calculate trader and prop firm profit shares instantly based on payout percentages, funded account size, and total trading profits earned."
    },
    "consistency-rule-calculator": {
      heading: "Prop Firm Consistency Rule Calculator Tool",
      paragraph: "Check consistency rule compliance for prop firms by calculating daily profit distribution, trading balance, and payout eligibility across funded accounts."
    },
    "prop-firm-reviews": {
      heading: "Best Prop Firm Reviews for Traders",
      paragraph: "Read detailed prop firm reviews covering payouts, trading rules, support quality, challenge difficulty, and overall trader experience before choosing a firm."
    },
    "propfirmrule": {
      heading: "Complete Prop Firm Rules and Guidelines",
      paragraph: "Understand prop firm trading rules including drawdown limits, consistency requirements, leverage policies, payout systems, and restricted trading strategies clearly."
    },
    "prop-firm-rules": {
      heading: "Prop Firm Rules 2026: Trading Rules for Funded Accounts",
      paragraph: "Explore prop firm rules for funded trading accounts in 2026, including daily drawdown, maximum loss, profit targets, payout rules, trading restrictions, news trading, EA usage, copy trading, and platform requirements.",
      seoTitle: "Prop Firm Rules 2026 | Funded Account Trading Rules",
      seoDescription: "Explore prop firm rules for funded accounts in 2026. Check drawdown, maximum loss, profit targets, payouts, news trading, EA, copy trading and platform rules.",
      directCode: true
    },
    "firm-rules": {
      heading: "Complete Prop Firm Rules and Guidelines",
      paragraph: "Understand prop firm trading rules including drawdown limits, consistency requirements, leverage policies, payout systems, and restricted trading strategies clearly."
    },
    "trading-guides": {
      heading: "Professional Forex Trading Guides for Beginners",
      paragraph: "Explore forex trading guides covering market analysis, risk management, trading strategies, and funded trading tips for beginner and advanced traders."
    },
    "payout-proofs": {
      heading: "Verified Prop Firm Payout Proofs Collection",
      paragraph: "Browse verified prop firm payout proofs showing real trader withdrawals, payout timelines, payment methods, and funded trading success experiences."
    },
    "funding-strategies": {
      heading: "Best Prop Firm Funding Strategies Explained",
      paragraph: "Learn effective prop firm funding strategies to pass evaluations, manage risk properly, maintain consistency, and secure funded trading accounts successfully."
    },
    "trading-psychology": {
      heading: "Trading Psychology Tips for Consistent Traders",
      paragraph: "Improve trading discipline, emotional control, patience, and decision-making with proven trading psychology techniques for forex and funded account traders."
    },
    "beginner-tutorials": {
      heading: "Forex Beginner Tutorials for New Traders",
      paragraph: "Learn forex trading basics, chart analysis, risk management, and prop firm concepts through beginner tutorials designed for new funded traders."
    },
    "affiliate-program": {
      heading: "Best Prop Firm Affiliate Programs 2026",
      paragraph: "Explore high paying prop firm affiliate programs offering competitive commissions, recurring earnings, marketing support, and reliable partnership opportunities for creators."
    },
    "partner-with-us": {
      heading: "Partner With The Forex Clue Team",
      paragraph: "Collaborate with The Forex Clue through sponsored promotions, prop firm partnerships, brand marketing campaigns, reviews, and long-term business opportunities."
    },
    "carrer": {
      heading: "Forex and Prop Trading Career Opportunities",
      paragraph: "Discover career opportunities in forex trading, prop firms, content creation, marketing, customer support, and funded trading industry related roles."
    },
    "career-opportunities": {
      heading: "Forex and Prop Trading Career Opportunities",
      paragraph: "Discover career opportunities in forex trading, prop firms, content creation, marketing, customer support, and funded trading industry related roles."
    },
    "giveaways": {
      heading: "Best Forex Trading Giveaways and Contests",
      paragraph: "Join forex trading giveaways and prop firm contests to win funded accounts, free challenges, discount codes, and exclusive rewards from top trading brands."
    }
  };

  function normText(v) {
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function readLocalPreview(pageName) {
    try {
      var raw = JSON.parse(localStorage.getItem(PREVIEW_KEY) || "{}") || {};
      var row = raw[String(pageName || "").trim()];
      return row && typeof row === "object" ? row : null;
    } catch (_) {
      return null;
    }
  }

  function esc(v) {
    return String(v || "").replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function humanDate(date) {
    try {
      return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date || new Date());
    } catch (_) {
      return "June 16, 2026";
    }
  }

  function words(v) {
    return normText(v).split(/\s+/).filter(Boolean);
  }

  function titleCase(v) {
    return words(v).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(" ");
  }

  function baseName(name) {
    return String(name || "index.html").toLowerCase().replace(/\.html$/i, "");
  }

  function pageLabel(name) {
    var raw = baseName(name).replace(/[-_]+/g, " ").trim();
    if (!raw) return "Prop Firm Page";
    return titleCase(raw);
  }

  function firmNameFromBase(base) {
    var b = String(base || "").toLowerCase();
    var clean = b.replace(/(discount|rules|detail)$/i, "");
    var fromMap = FIRM_NAMES[b] || FIRM_NAMES[clean];
    if (fromMap) return fromMap;
    var text = clean.replace(/[-_]+/g, " ").trim();
    return text ? titleCase(text) : "Prop Firm";
  }

  function defaultSeoForPage(name) {
    var b = baseName(name);
    if (SEO_COPY[b]) return { heading: SEO_COPY[b].heading, paragraph: SEO_COPY[b].paragraph };
    var firm = firmNameFromBase(b);
    var heading = "";
    var paragraph = "";

    if (b === "listedprop") {
      heading = YEAR + " Listed Prop Firms Directory";
      paragraph = "Compare listed prop firms by payout cycle, drawdown model, challenge fees, and platform support so you can shortlist accounts that match your trading style.";
    } else if (BEST_RE.test(b)) {
      heading = YEAR + " Best Prop Firms Rankings";
      paragraph = "Review " + YEAR + " best prop firm rankings with payout reliability, evaluation terms, and trader-focused filters to choose stronger funded options with confidence.";
    } else if (b !== "discount" && /discount$/i.test(b)) {
      heading = YEAR + " " + firm + " Discounts";
      paragraph = firm + " discount page tracks live " + YEAR + " promo codes, expiry dates, and claim terms so you can save more without missing eligibility conditions.";
    } else if (b === "discount" || b === "discount-offer") {
      heading = YEAR + " Prop Discounts And Offers";
      paragraph = "Browse verified prop firm discount codes and active offers updated for " + YEAR + " so you can reduce challenge costs and compare savings quickly.";
    } else if (!RULES_HUB_RE.test(b) && /rules$/i.test(b)) {
      heading = YEAR + " " + firm + " Rules";
      paragraph = firm + " rules page explains drawdown limits, payout timing, consistency logic, and key restrictions for " + YEAR + " in a trader-friendly format.";
    } else if (RULES_HUB_RE.test(b)) {
      heading = YEAR + " Prop Rules Comparison Hub";
      paragraph = "Compare prop firm rules with clear " + YEAR + " breakdowns for drawdown, profit targets, payout terms, and restrictions before buying any challenge.";
    } else if (/detail$/i.test(b) || b === "firm-detail") {
      heading = firm + " Prop Firm Details";
      paragraph = firm + " detail page gives account highlights, fee context, payout data, and essential terms so you can make faster prop firm decisions.";
    } else if (b === "affiliate-program") {
      heading = "Affiliate Program Coming Soon Update";
      paragraph = "Our affiliate program page is in progress. Explore best firms, active discounts, and latest prop trading updates while we finalize the partner rollout.";
    } else {
      var lbl = pageLabel(name);
      heading = lbl + " Insights For Traders";
      paragraph = "Explore this " + lbl + " section to compare prop firm data, review key conditions, and move faster with practical insights for funded trading decisions.";
    }

    return { heading: heading, paragraph: normText(paragraph) };
  }

  function docIdForPage(name) {
    return "page-" + String(name || "index.html")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
  }

  function emphasizeHeading(text, originalLayout) {
    var arr = words(text);
    if (!arr.length) return "";
    if (arr.length === 1) return esc(arr[0]);
    var accentCount = Math.max(2, Math.ceil(arr.length * 0.4));
    var splitAt = Math.max(1, arr.length - accentCount);
    var first = esc(arr.slice(0, splitAt).join(" "));
    var accent = esc(arr.slice(splitAt).join(" "));
    if (originalLayout) return "<span class=\"rmp-seo-white\">" + first + "</span> <span class=\"rmp-seo-accent\">" + accent + "</span>";
    return first + " <span class=\"rmp-seo-accent\">" + accent + "</span>";
  }

  function ensureSeoStyles() {
    if (document.getElementById("rmpSeoRuntimeStyles")) return;
    var st = document.createElement("style");
    st.id = "rmpSeoRuntimeStyles";
    st.textContent = "" +
      ".rmp-seo-wrap{position:relative;z-index:1;max-width:1280px;margin:38px auto 8px;padding:0 16px;opacity:1!important;transform:none!important;filter:none!important}" +
      ".rmp-seo-wrap.rmp-seo-ready{opacity:1;transform:none}" +
      "body.rmp-has-fixed-nav #rmpSeoHeroWrap{margin-top:0!important;padding-top:38px!important}" +
      ".rmp-seo{text-align:center}" +
      ".rmp-seo h1{max-width:1120px;margin:0 auto;letter-spacing:-.04em;line-height:1.04;font-weight:600;font-size:clamp(38px,5.4vw,62px);color:#fff;filter:none;opacity:1;text-shadow:none;text-wrap:balance}" +
      ".rmp-seo-white{background:linear-gradient(90deg,#fff,#cfd3de);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}" +
      ".rmp-seo-accent{background:linear-gradient(92deg,#fff 0%,#d4ccff 24%,#846aff 75%,#b09eff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:none;opacity:1;text-shadow:none}" +
      ".rmp-seo p{margin:14px auto 0;max-width:850px;color:#f0eff9;font-size:18px;font-weight:600;line-height:1.62;text-align:center;text-wrap:balance;filter:none;opacity:1;text-shadow:none}" +
      ".rmp-seo-updated{margin:12px auto 0;color:#c9c2ff;font-size:14px;font-weight:700;letter-spacing:.01em;text-align:center}" +
      ".rmp-seo-updated span{color:#fff;font-weight:700}" +
      ".rmp-original-heading-layout{max-width:none;margin:0 auto 34px;padding:0;opacity:1!important}" +
      "body.rmp-has-fixed-nav .rmp-original-heading-layout#rmpSeoHeroWrap{margin-top:0!important;padding-top:0!important}" +
      ".rmp-original-heading-layout .rmp-seo h1{max-width:1120px!important;margin:0 auto!important;font-size:clamp(38px,5.4vw,62px)!important;line-height:1.04!important;font-weight:600!important;letter-spacing:-.04em!important;text-wrap:balance}" +
      "body .rmp-original-heading-layout .rmp-seo .rmp-seo-accent{background-image:linear-gradient(92deg,#fff 0%,#d4ccff 24%,#846aff 75%,#b09eff 100%)!important;background-color:transparent!important;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important;-webkit-text-fill-color:transparent!important}" +
      ".rmp-original-heading-layout .rmp-seo p{max-width:850px!important;margin:16px auto 0!important;color:#f0eff9!important;font-size:18px!important;font-weight:600!important;line-height:1.62!important;text-wrap:balance}" +
      ".rmp-original-heading-layout .rmp-seo-updated{margin-top:12px;font-size:14px}" +
      "@media (max-width:780px){.rmp-seo-wrap{margin-top:28px;padding:0 12px}body.rmp-has-fixed-nav #rmpSeoHeroWrap{padding-top:28px!important}.rmp-seo h1{font-size:clamp(34px,9vw,52px);line-height:1.03}.rmp-seo p{margin-top:12px;font-size:16px;line-height:1.55;max-width:92vw}.rmp-seo-updated{font-size:13px;margin-top:10px}.rmp-original-heading-layout{margin:0 auto 28px;padding:0}.rmp-original-heading-layout .rmp-seo h1{font-size:clamp(34px,9vw,52px)!important;line-height:1.03!important}.rmp-original-heading-layout .rmp-seo p{margin-top:12px!important;font-size:16px!important;line-height:1.55!important}}";
    document.head.appendChild(st);
  }

  function removeLegacyPageCopy() {
    var b = baseName(file);
    var shouldCleanup = !!SEO_COPY[b] || !!HUB_PAGES[b] || !!CALC_CENTER_PAGES[b] || !!SIMPLE_HERO_PAGES[b] || b === "listedprop" || BEST_RE.test(b) || /discount$/.test(b) || /rules$/.test(b) || /detail$/.test(b);
    if (!shouldCleanup) return;

    var containers = Array.from(document.querySelectorAll(".container"));
    containers.forEach(function (ctr) {
      if (!ctr || !ctr.children || !ctr.children.length) return;
      var kids = Array.from(ctr.children);
      for (var i = 0; i < kids.length; i += 1) {
        var k = kids[i];
        if (!k || !k.classList || !k.classList.contains("heading")) continue;
        var p = kids[i + 1];
        var br = kids[i + 2];
        if (p && p.classList && (p.classList.contains("paragraph") || p.classList.contains("heading-sub"))) p.remove();
        if (br && String(br.tagName || "").toLowerCase() === "br") br.remove();
        k.remove();
        break;
      }
    });

    if (HUB_PAGES[b]) {
      var hubHead = document.querySelector("main .hero-head");
      if (hubHead) hubHead.remove();
    }

    if (b === "lotsizecalculator") {
      var lotHead = document.querySelector(".container > .heading");
      if (lotHead) lotHead.remove();
    }

    if (CALC_CENTER_PAGES[b]) {
      var center = document.querySelector("section.rmp-center-wrap");
      if (center) center.remove();
    }

    if (SIMPLE_HERO_PAGES[b]) {
      var hero = document.querySelector("main .hero, .wrap .hero, section.hero");
      if (hero && hero.querySelector("h1")) hero.remove();
    }

    if (b === "tradejournal") {
      var tjHero = document.querySelector("section.hero");
      if (tjHero) {
        var tjH = tjHero.querySelector("h1");
        var tjP = tjHero.querySelector(".hero-sub, p");
        if (tjH) tjH.remove();
        if (tjP) tjP.remove();
      }
    }
  }

  function nativeSeoRefs() {
    var homeH = document.querySelector(".home-hero-bg h1");
    var homeP = document.querySelector(".home-hero-bg p");
    if (homeH && homeP) return { headingEl: homeH, paragraphEl: homeP, native: true };

    var heroH = document.querySelector("section.hero .h1, section.hero h1, .hero .h1, .hero h1");
    var heroP = document.querySelector("section.hero .sub, section.hero p.sub, .hero .sub, .hero p.sub");
    if (heroH && heroP) return { headingEl: heroH, paragraphEl: heroP, native: true };

    var heroWrap = document.querySelector(".hero-head");
    if (heroWrap) {
      var wrapH = heroWrap.querySelector("h1,h2,.h1");
      var wrapP = heroWrap.querySelector("p,.sub");
      if (wrapH && wrapP) return { headingEl: wrapH, paragraphEl: wrapP, native: true };
    }

    return null;
  }

  function ensureSeoBlock() {
    var wrap = document.getElementById("rmpSeoHeroWrap");
    if (wrap) {
      return {
        wrap: wrap,
        headingEl: wrap.querySelector("#rmpSeoHeading"),
        paragraphEl: wrap.querySelector("#rmpSeoParagraph"),
        updatedEl: wrap.querySelector("#rmpSeoUpdated")
      };
    }

    ensureSeoStyles();

    var originalLayout = baseName(file) === "listedprop" || BEST_RE.test(baseName(file));
    wrap = document.createElement("section");
    wrap.id = "rmpSeoHeroWrap";
    wrap.className = "rmp-seo-wrap" + (originalLayout ? " rmp-original-heading-layout" : "");
    wrap.setAttribute("data-copy-ignore", "1");
    wrap.innerHTML = "<div class=\"rmp-seo\"><h1 id=\"rmpSeoHeading\" data-rmp-route-heading></h1><p id=\"rmpSeoParagraph\" data-rmp-route-hero></p><div id=\"rmpSeoUpdated\" class=\"rmp-seo-updated\" data-copy-ignore=\"1\" hidden></div></div>";

    var ctr = document.querySelector(".container");
    if (ctr && originalLayout) {
      ctr.insertBefore(wrap, ctr.firstChild);
      return {
        wrap: wrap,
        headingEl: wrap.querySelector("#rmpSeoHeading"),
        paragraphEl: wrap.querySelector("#rmpSeoParagraph"),
        updatedEl: wrap.querySelector("#rmpSeoUpdated")
      };
    }
    if (ctr && ctr.parentNode) {
      ctr.parentNode.insertBefore(wrap, ctr);
      return {
        wrap: wrap,
        headingEl: wrap.querySelector("#rmpSeoHeading"),
        paragraphEl: wrap.querySelector("#rmpSeoParagraph"),
        updatedEl: wrap.querySelector("#rmpSeoUpdated")
      };
    }

    var main = document.querySelector("main");
    if (main && main.parentNode) {
      main.parentNode.insertBefore(wrap, main);
    } else {
      var nav = document.querySelector("nav.glass") || document.querySelector("header");
      if (nav && nav.parentNode && nav.nextSibling) {
        nav.parentNode.insertBefore(wrap, nav.nextSibling);
      } else if (document.body.firstChild) {
        document.body.insertBefore(wrap, document.body.firstChild);
      } else {
        document.body.appendChild(wrap);
      }
    }

    return {
      wrap: wrap,
      headingEl: wrap.querySelector("#rmpSeoHeading"),
      paragraphEl: wrap.querySelector("#rmpSeoParagraph"),
      updatedEl: wrap.querySelector("#rmpSeoUpdated")
    };
  }

  function renderSeo(content) {
    var refs = nativeSeoRefs() || ensureSeoBlock();
    if (!refs || !refs.headingEl || !refs.paragraphEl) return;
    var heading = normText((content && content.heading) || defaultSeoForPage(file).heading);
    if (refs.native) refs.headingEl.textContent = heading;
    else refs.headingEl.innerHTML = emphasizeHeading(heading, refs.wrap?.classList.contains("rmp-original-heading-layout"));
    refs.paragraphEl.textContent = normText((content && content.paragraph) || defaultSeoForPage(file).paragraph);
    var updated = normText(content && (content.lastUpdatedLabel || content.lastUpdated));
    var updatedEl = refs.updatedEl || null;
    if (!updatedEl && refs.paragraphEl && refs.paragraphEl.parentNode) {
      updatedEl = refs.paragraphEl.parentNode.querySelector("[data-rmp-seo-updated='1']");
      if (!updatedEl) {
        updatedEl = document.createElement("div");
        updatedEl.className = "rmp-seo-updated";
        updatedEl.setAttribute("data-rmp-seo-updated", "1");
        updatedEl.setAttribute("data-copy-ignore", "1");
        refs.paragraphEl.insertAdjacentElement("afterend", updatedEl);
      }
    }
    if (updatedEl) {
      updatedEl.hidden = !updated;
      updatedEl.innerHTML = updated ? "Last Updated: <span>" + esc(updated) + "</span>" : "";
    }
    var ctr = refs.headingEl.closest(".hero,.hero-head,.home-hero-bg,.rmp-seo-wrap,.container");
    if (ctr) {
      ctr.style.textAlign = "center";
      if (!refs.native && content && content.pending !== true) ctr.classList.add("rmp-seo-ready");
    }
  }

  function collectBlocks(root) {
    var nodes = Array.from((root || document).querySelectorAll("h1,h2,h3,h4,h5,h6,p"));
    var tagCount = {};
    var out = [];
    nodes.forEach(function (el) {
      if (!el) return;
      if (el.closest("[data-copy-ignore='1'],script,style,template,noscript")) return;
      var text = normText(el.textContent);
      if (!text) return;
      var tag = String(el.tagName || "").toLowerCase();
      tagCount[tag] = (tagCount[tag] || 0) + 1;
      var key = tag + "_" + tagCount[tag];
      el.setAttribute("data-copy-key", key);
      out.push({ key: key, tag: tag, text: text, el: el });
    });
    return out;
  }

  function toBlockMaps(blocks) {
    var defaults = {};
    var tags = {};
    var order = [];
    (blocks || []).forEach(function (b) {
      if (!b || !b.key) return;
      defaults[b.key] = String(b.text || "");
      tags[b.key] = String(b.tag || "");
      order.push(b.key);
    });
    return { defaults: defaults, tags: tags, order: order };
  }

  function normalizeOverrides(raw) {
    if (!raw || typeof raw !== "object") return {};
    var out = {};
    Object.keys(raw).forEach(function (k) {
      var v = raw[k];
      if (typeof v !== "string") return;
      out[k] = v;
    });
    return out;
  }

  function applyOverrides(blocks, overrides) {
    if (!overrides || typeof overrides !== "object") return;
    blocks.forEach(function (b) {
      var next = overrides[b.key];
      if (typeof next !== "string") return;
      b.el.textContent = next;
    });
  }

  function needsSync(existing, nextMaps, pageName) {
    if (!existing || typeof existing !== "object") return true;
    if (String(existing.page || "") !== String(pageName || "")) return true;
    if (Number(existing.blockCount || 0) !== Number(nextMaps.order.length || 0)) return true;
    var oldOrder = Array.isArray(existing.order) ? existing.order : [];
    if (oldOrder.length !== nextMaps.order.length) return true;
    for (var i = 0; i < nextMaps.order.length; i += 1) {
      if (String(oldOrder[i] || "") !== String(nextMaps.order[i] || "")) return true;
    }
    var oldDefaults = (existing.defaults && typeof existing.defaults === "object") ? existing.defaults : {};
    for (var j = 0; j < nextMaps.order.length; j += 1) {
      var key = nextMaps.order[j];
      if (String(oldDefaults[key] || "") !== String(nextMaps.defaults[key] || "")) return true;
    }
    return false;
  }

  async function initFirestore() {
    var mCfg = await import("./firebase-config.js");
    var mApp = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    var mFs = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    var app = mApp.getApps().length ? mApp.getApp() : mApp.initializeApp(mCfg.firebaseConfig);
    return { fs: mFs, db: mFs.getFirestore(app) };
  }

  async function loadPageHeadingFallback(f, pageName) {
    try {
      var q1 = f.fs.query(
        f.fs.collection(f.db, "pageHeadingsParagraphs"),
        f.fs.where("pageFile", "==", pageName),
        f.fs.limit(1)
      );
      var s1 = await f.fs.getDocs(q1);
      if (!s1.empty) {
        var d1 = s1.docs[0].data() || {};
        var h1 = normText([d1.titlePrimary, d1.titleAccent].filter(Boolean).join(" "));
        var p1 = normText(d1.paragraph);
        var u1 = normText(d1.lastUpdatedLabel || d1.lastUpdated);
        if (h1 || p1 || u1) return { heading: h1, paragraph: p1, lastUpdatedLabel: u1 };
      }
    } catch (_) {}
    try {
      var q2 = f.fs.query(
        f.fs.collection(f.db, "pageHeadingsParagraphs"),
        f.fs.where("linkedPages", "array-contains", pageName),
        f.fs.limit(1)
      );
      var s2 = await f.fs.getDocs(q2);
      if (!s2.empty) {
        var d2 = s2.docs[0].data() || {};
        var h2 = normText([d2.titlePrimary, d2.titleAccent].filter(Boolean).join(" "));
        var p2 = normText(d2.paragraph);
        var u2 = normText(d2.lastUpdatedLabel || d2.lastUpdated);
        if (h2 || p2 || u2) return { heading: h2, paragraph: p2, lastUpdatedLabel: u2 };
      }
    } catch (_) {}
    return null;
  }

  async function syncSeo(f, defaults, pageDocId) {
    var directCopy = SEO_COPY[baseName(file)];
    if (directCopy && directCopy.directCode === true) {
      renderSeo({ heading: defaults.heading, paragraph: defaults.paragraph, lastUpdatedLabel: "" });
      return;
    }
    try {
      var seoRef = f.fs.doc(f.db, "pageSeoContent", pageDocId);
      var seoSnap = await f.fs.getDoc(seoRef);
      var seoData = seoSnap.exists() ? (seoSnap.data() || {}) : {};
      var previewData = readLocalPreview(file) || {};
      var pageItemData = await loadPageHeadingFallback(f, file) || {};
      var storedHeading = normText(seoData.heading);
      var storedDefaultHeading = normText(seoData.defaultHeading);
      var previewHeading = normText(previewData.heading);
      var useStoredHeading = !!storedHeading && storedHeading !== storedDefaultHeading;
      var fallbackHeading = normText(pageItemData.heading);
      var liveHeading = normText(previewHeading || (useStoredHeading ? storedHeading : fallbackHeading || defaults.heading));
      var storedParagraph = normText(seoData.paragraph);
      var storedDefaultParagraph = normText(seoData.defaultParagraph);
      var useStoredParagraph = !!storedParagraph && storedParagraph !== storedDefaultParagraph;
      var previewParagraph = normText(previewData.paragraph);
      var fallbackParagraph = normText(pageItemData.paragraph);
      var liveParagraph = normText(previewParagraph || (useStoredParagraph ? storedParagraph : fallbackParagraph || defaults.paragraph)) || defaults.paragraph;
      var liveUpdated = normText(previewData.lastUpdatedLabel || seoData.lastUpdatedLabel || pageItemData.lastUpdatedLabel || defaults.lastUpdatedLabel);
      renderSeo({ heading: liveHeading, paragraph: liveParagraph, lastUpdatedLabel: liveUpdated });

      var payload = {
        page: file,
        pagePath: window.location.pathname || "/" + file,
        defaultHeading: defaults.heading,
        defaultParagraph: defaults.paragraph,
        lastUpdatedLabel: liveUpdated,
        lastSeenAt: f.fs.serverTimestamp()
      };

      if (!seoSnap.exists()) payload.createdAt = f.fs.serverTimestamp();
      var contentChanged = !seoSnap.exists() || storedHeading !== liveHeading || storedParagraph !== liveParagraph || normText(seoData.lastUpdatedLabel) !== liveUpdated;
      if (!useStoredHeading || storedHeading !== liveHeading) payload.heading = liveHeading;
      if (!useStoredParagraph || storedParagraph !== liveParagraph) payload.paragraph = liveParagraph;
      if (contentChanged) payload.updatedAt = f.fs.serverTimestamp();
      await f.fs.setDoc(seoRef, payload, { merge: true });
    } catch (_) {
      renderSeo({ heading: defaults.heading, paragraph: defaults.paragraph, lastUpdatedLabel: defaults.lastUpdatedLabel || "" });
    }
  }

  async function scanAndSync() {
    // Firm Detail CMS owns this entire dynamic surface, including query routes.
    if (document.getElementById("firmNameHeading")) return;
    if (!nativeSeoRefs()) removeLegacyPageCopy();
    var seoDefaults = defaultSeoForPage(file);
    var initialPreview = readLocalPreview(file);
    renderSeo(Object.assign({ pending: true, lastUpdatedLabel: "" }, seoDefaults, initialPreview || {}));

    var blocks = collectBlocks(document);
    if (!blocks.length) {
      renderSeo(Object.assign({ lastUpdatedLabel: "" }, seoDefaults, initialPreview || {}));
      return;
    }
    var pageDocId = docIdForPage(file);
    var maps = toBlockMaps(blocks);

    try {
      var f = await initFirestore();
      await syncSeo(f, seoDefaults, pageDocId);
      var ref = f.fs.doc(f.db, "pageCopy", pageDocId);
      var snap = await f.fs.getDoc(ref);
      var data = snap.exists() ? (snap.data() || {}) : {};
      var overrides = normalizeOverrides(data.overrides);
      applyOverrides(blocks, overrides);
      if (!needsSync(data, maps, file)) return;

      var payload = {
        page: file,
        pagePath: window.location.pathname || "/" + file,
        defaults: maps.defaults,
        tags: maps.tags,
        order: maps.order,
        blockCount: maps.order.length,
        lastSeenAt: f.fs.serverTimestamp(),
        updatedAt: f.fs.serverTimestamp()
      };
      if (!snap.exists()) payload.createdAt = f.fs.serverTimestamp();
      await f.fs.setDoc(ref, payload, { merge: true });
    } catch (_) {}
  }

  scanAndSync();
  window.addEventListener("load", function () {
    setTimeout(scanAndSync, 400);
  }, { once: true });
  setTimeout(scanAndSync, 1800);
})();
