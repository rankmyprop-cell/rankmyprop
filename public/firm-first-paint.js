(function () {
  "use strict";

  var names = {
    aifo: "AIFO",
    aquafundeddetail: "Aqua Funded",
    blueberrydetail: "Blueberry",
    blueberryfundeddetail: "Blueberry Funded",
    blueguardiandetail: "Blue Guardian",
    directfundingtraderdetail: "Direct Funding Trader",
    finotivefundingdetail: "Finotive Funding",
    fundednextdetail: "FundedNext",
    funderprodetail: "FunderPro",
    fx2fundingdetail: "FX2 Funding",
    fxifydetail: "FXIFY",
    goatfundedtraderdetail: "Goat Funded Trader",
    instantfundingdetail: "Instant Funding",
    qtfundeddetail: "QT Funded",
    swayfundeddetail: "Sway Funded",
    theproptradedetail: "The Prop Trade",
    toponetraderdetail: "Top One Trader",
    traderscaledetail: "Trader Scale",
    tradebridges: "Trade Bridges",
    "trade-bridges": "Trade Bridges",
    wefunddetail: "We Fund"
  };

  var knownFirmData = {
    "trade-bridges": {
      name: "Trade Bridges",
      initials: "TB",
      meta: "Lucknow, Uttar Pradesh, India • Founded 2025 • Funded Trading Evaluation Programme",
      overview: "Trade Bridges was established in 2025 with the objective of providing Indian traders with access to structured funded trading evaluation programmes, helping traders demonstrate their skills through structured challenges and performance-based reward programmes.",
      whyChoose: "Why Choose Trade Bridges?",
      buyUrl: "https://tradebridges.in"
    }
  };

  function titleCaseSlug(value) {
    return String(value || "").split("-").filter(Boolean).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function resolveSlug() {
    var url = new URL(location.href);
    var parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "prop-firms" && parts[1]) return parts[1].toLowerCase();
    var querySlug = url.searchParams.get("slug") || url.searchParams.get("firmSlug");
    if (querySlug) return querySlug.toLowerCase();
    var file = String(parts.pop() || "").replace(/\.html$/i, "").toLowerCase();
    if (file.endsWith("detail") && file !== "firm-detail") return file.replace(/detail$/, "");
    return "";
  }

  function resolveName() {
    var slug = resolveSlug();
    if (slug) {
      if (names[slug]) return names[slug];
      if (/^(fundednext|fundednext-firm)$/.test(slug)) return "FundedNext";
      return titleCaseSlug(slug);
    }
    var url = new URL(location.href);
    var file = String(url.pathname.split("/").filter(Boolean).pop() || "")
      .replace(/\.html$/i, "")
      .toLowerCase();
    if (names[file]) return names[file];
    return String(document.title || "").split(/\s+(?:Review|Rules|Prop Firm)/i)[0].trim() || "Prop Firm";
  }

  var firmName = resolveName();
  var platformAssets = {
    mt4: ["MetaTrader 4", "/assets/platforms/metatrader-4.ico"],
    metatrader4: ["MetaTrader 4", "/assets/platforms/metatrader-4.ico"],
    mt5: ["MetaTrader 5", "/assets/platforms/metatrader-5.svg"],
    metatrader5: ["MetaTrader 5", "/assets/platforms/metatrader-5.svg"],
    ctrader: ["cTrader", "/assets/platforms/ctrader-icon.svg"],
    matchtrader: ["Match-Trader", "/assets/platforms/match-trader.png"],
    tradelocker: ["TradeLocker", "/assets/platforms/tradelocker.png"],
    dxtrade: ["DXtrade", "/assets/platforms/dxtrade-icon.png"]
  };

  function installPlatformObserver() {
    var wrap = document.getElementById("firmPlatforms");
    if (!wrap || wrap.dataset.logoObserver === "1") return;
    wrap.dataset.logoObserver = "1";

    function render() {
      if (wrap.querySelector(".rmp-platform-logo")) return;
      var namesFromData = Array.from(wrap.children).map(function (child) {
        return String(child.textContent || "").trim();
      }).filter(Boolean);
      var supported = namesFromData.filter(function (name) {
        return Boolean(platformAssets[name.toLowerCase().replace(/[^a-z0-9]/g, "")]);
      });
      if (!supported.length && firmName.toLowerCase().replace(/[^a-z0-9]/g, "") === "fxify") {
        supported = ["MT4", "MT5", "DXtrade"];
      }
      var html = supported.map(function (name) {
        var asset = platformAssets[name.toLowerCase().replace(/[^a-z0-9]/g, "")];
        if (!asset) return "";
        return '<span class="rmp-platform-logo" data-tooltip="' + asset[0] + '" aria-label="' + asset[0] + '" title="' + asset[0] + '" role="img" tabindex="0"><img src="' + asset[1] + '" alt="" aria-hidden="true"></span>';
      }).join("");
      if (html || wrap.children.length) wrap.innerHTML = html;
    }

    render();
    new MutationObserver(render).observe(wrap, { childList: true });
  }

  function mount() {
    var wrapper = document.querySelector(".dashboard-wrapper");
    if (!wrapper) return false;

    var guardStyle = document.getElementById("rmpFirmHydrationGuard");
    if (!guardStyle) {
      guardStyle = document.createElement("style");
      guardStyle.id = "rmpFirmHydrationGuard";
      guardStyle.textContent = "body.rmp-firm-hydrating .dashboard-wrapper > :not(#firmPageLoader){visibility:hidden!important}";
      document.head.appendChild(guardStyle);
    }
    document.body.classList.add("rmp-firm-hydrating");

    var slug = resolveSlug();
    var known = knownFirmData[slug];
    var displayName = known ? known.name : firmName;
    var initials = known ? known.initials : displayName.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 3).toUpperCase();

    var firmHeading = document.getElementById("firmNameHeading");
    if (firmHeading) firmHeading.textContent = displayName;

    var initialsEl = document.getElementById("firmLogoInitials");
    if (initialsEl) initialsEl.textContent = initials;

    var metaEl = document.getElementById("firmMetaLine");
    if (metaEl) metaEl.textContent = known ? known.meta : (displayName + " • Proprietary Trading Evaluation");

    var overviewTitle = document.getElementById("firmOverviewTitle");
    if (overviewTitle) overviewTitle.textContent = displayName + " Overview";

    var overviewShort = document.getElementById("firmOverviewShort");
    if (overviewShort && known) overviewShort.textContent = known.overview;

    var whyChoose = document.getElementById("firmWhyChooseTitle");
    if (whyChoose) whyChoose.textContent = known ? known.whyChoose : ("Why Choose " + displayName + "?");

    var buyBtn = document.getElementById("firmBuyNowBtn");
    if (buyBtn && known && known.buyUrl) buyBtn.href = known.buyUrl;

    var seoHeading = document.getElementById("detailSeoHeading");
    if (seoHeading) seoHeading.textContent = displayName + " Review 2026: Fees, Rules, Payout & Details";

    var seoParagraph = document.getElementById("detailSeoParagraph");
    if (seoParagraph) seoParagraph.textContent = "Explore " + displayName + " review covering evaluation models, challenge rules, profit splits, payout cycle, and trader ratings.";

    if (slug) {
      document.querySelectorAll(".detail-nav-item").forEach(function (link) {
        var view = link.getAttribute("data-view") || "overview";
        link.href = "/prop-firms/" + slug + (view === "overview" ? "" : "/" + view);
      });
    }

    installPlatformObserver();

    if (!document.getElementById("rmpSeoHeroWrap")) {
      var hero = document.createElement("section");
      hero.id = "rmpSeoHeroWrap";
      hero.className = "rmp-seo-wrap rmp-seo-ready rmp-first-paint-hero";
      hero.setAttribute("data-copy-ignore", "1");
      hero.innerHTML =
        '<div class="rmp-seo">' +
          '<h2 id="rmpSeoHeading">' + displayName.replace(/[&<>"']/g, "") + ' <span class="rmp-seo-accent">Prop Firm Details</span></h2>' +
          '<p id="rmpSeoParagraph">' + displayName.replace(/[&<>"']/g, "") + ' detail page gives account highlights, fee context, payout data, and essential terms so you can make faster prop firm decisions.</p>' +
          '<div id="rmpSeoUpdated" class="rmp-seo-updated" data-copy-ignore="1" hidden></div>' +
        "</div>";
      wrapper.parentNode.insertBefore(hero, wrapper);
    }
    return true;
  }

  if (!mount()) {
    var observer = new MutationObserver(function () {
      if (mount()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
