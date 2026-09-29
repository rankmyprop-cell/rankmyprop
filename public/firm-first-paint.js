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
    wefunddetail: "We Fund"
  };

  function titleCaseSlug(value) {
    return String(value || "").split("-").filter(Boolean).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function resolveName() {
    var url = new URL(location.href);
    var file = String(url.pathname.split("/").filter(Boolean).pop() || "")
      .replace(/\.html$/i, "")
      .toLowerCase();
    if (names[file]) return names[file];
    var parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "prop-firms" && parts[1]) return /^(fundednext|fundednext-firm)$/.test(parts[1]) ? "FundedNext" : titleCaseSlug(parts[1]);
    var querySlug = url.searchParams.get("slug");
    if (querySlug) return /^(fundednext|fundednext-firm)$/.test(querySlug) ? "FundedNext" : titleCaseSlug(querySlug);
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

    var firmHeading = document.getElementById("firmNameHeading");
    if (firmHeading) firmHeading.textContent = firmName;
    installPlatformObserver();

    if (!document.getElementById("rmpSeoHeroWrap")) {
      var hero = document.createElement("section");
      hero.id = "rmpSeoHeroWrap";
      hero.className = "rmp-seo-wrap rmp-seo-ready rmp-first-paint-hero";
      hero.setAttribute("data-copy-ignore", "1");
      hero.innerHTML =
        '<div class="rmp-seo">' +
          '<h2 id="rmpSeoHeading">' + firmName.replace(/[&<>"']/g, "") + ' <span class="rmp-seo-accent">Prop Firm Details</span></h2>' +
          '<p id="rmpSeoParagraph">' + firmName.replace(/[&<>"']/g, "") + ' detail page gives account highlights, fee context, payout data, and essential terms so you can make faster prop firm decisions.</p>' +
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
