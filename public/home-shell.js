const firmItems = [
  { label: "Best Prop Firms 2026", description: "Our highest-rated firms overall", href: "/best-prop-firms-2026", badge: "Popular" },
  { label: "Fast Payout Firms", description: "Get paid without the long wait", href: "/fast-payout-prop-firms" },
  { label: "Instant Funding", description: "Skip the evaluation challenge", href: "/best-instant-funding-firms" },
  { label: "Futures Prop Firms", description: "Top firms built for futures traders", href: "/best-futures-prop-firms" },
  { label: "Most Trusted Firms", description: "Proven track records and fair rules", href: "/most-trusted-prop-firms" },
  { label: "Beginner Friendly", description: "Simple rules and trader-first support", href: "/beginner-friendly-firms" },
];

const compareItems = [
  { label: "Prop Firm Rules", description: "Check challenge rules before you buy", href: "/prop-firm-rules", badge: "New" },
  { label: "Compare Prop Firms", description: "Compare rules, fees and payouts side by side", href: "/compare" },
  { label: "Prop Firm Reviews", description: "Deep, independent firm breakdowns", href: "/reviews" },
  { label: "Payout Proofs", description: "Verified payout records from traders", href: "/payout-proofs", badge: "Verified" },
  { label: "Trading Guides", description: "Actionable guides for funded traders", href: "/trading-guides" },
  { label: "Funding Strategies", description: "Smarter paths to getting funded", href: "/funding-strategies" },
  { label: "Trading Psychology", description: "Build discipline that lasts", href: "/trading-psychology" },
  { label: "Beginner Tutorials", description: "Learn trading foundations step by step", href: "/beginner-tutorials" },
  { label: "Giveaways", description: "Current prop firm rewards and winners", href: "/giveaways" },
];

const calculatorItems = [
  { label: "Lot Size Calculator", description: "Size every trade with confidence", href: "/lotsizecalculator" },
  { label: "Risk-to-Reward", description: "Plan risk before entering a trade", href: "/risk-to-reward-calculator" },
  { label: "Drawdown Calculator", description: "Track daily and maximum limits", href: "/drawdown-calculator" },
  { label: "Profit Split", description: "Calculate your expected payout", href: "/profit-split-calculator" },
  { label: "Consistency Rule", description: "Check best-day profit concentration", href: "/consistency-rule-calculator" },
  { label: "Loss Recovery", description: "Plan the path back to starting equity", href: "/lossrecoveryplanner" },
  { label: "Rule Explainer", description: "Browse common firm rules and examples", href: "/ruletranslator" },
  { label: "Trade Journal", description: "Review performance and find your edge", href: "/tradejournal" },
];

const dropdownData = {
  firms: {
    eyebrow: "Discover",
    title: "Find your right prop firm",
    items: firmItems,
    allLabel: "Explore all rankings",
    allHref: "/bestprop",
  },
  compare: {
    eyebrow: "Research",
    title: "Make a confident decision",
    items: compareItems,
    allLabel: "Open comparison hub",
    allHref: "/compare",
  },
  calculators: {
    eyebrow: "Trader toolkit",
    title: "Trade with better numbers",
    items: calculatorItems,
    allLabel: "View all calculators",
    allHref: "/calculators",
  },
};

const searchItems = [
  { label: "Listed Props", description: "Browse every listed prop firm", href: "/listedprop" },
  { label: "Prop Firm Offers", description: "Explore active deals and discounts", href: "/offers" },
  { label: "Prop News", description: "Latest updates from the prop trading industry", href: "/prop-news" },
  ...firmItems,
  ...compareItems,
  ...calculatorItems,
];

const footerGroups = [
  {
    title: "Discover",
    links: [
      ["Listed Prop Firms", "/listedprop"],
      ["Best Prop Firms", "/bestprop"],
      ["Offers & Discounts", "/offers"],
      ["Prop Firm Reviews", "/reviews"],
    ],
  },
  {
    title: "Research",
    links: [
      ["Compare Firms", "/compare"],
      ["Payout Proofs", "/payout-proofs"],
      ["Prop Firm Rules", "/prop-firm-rules"],
      ["Prop News", "/prop-news"],
    ],
  },
  {
    title: "Tools",
    links: [
      ["Calculator Hub", "/calculators"],
      ["Lot Size Calculator", "/lotsizecalculator"],
      ["Drawdown Calculator", "/drawdown-calculator"],
      ["Risk-to-Reward", "/risk-to-reward-calculator"],
      ["Consistency Rule", "/consistency-rule-calculator"],
      ["Loss Recovery", "/lossrecoveryplanner"],
      ["Trade Journal", "/tradejournal"],
    ],
  },
  {
    title: "Learning",
    links: [
      ["Trading Guides", "/trading-guides"],
      ["Funding Strategies", "/funding-strategies"],
      ["Trading Psychology", "/trading-psychology"],
      ["Beginner Tutorials", "/beginner-tutorials"],
      ["Giveaways", "/giveaways"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Rank My Prop", "/about"],
      ["Contact", "/contact"],
      ["Legal Center", "/legal"],
      ["Cookies", "/cookies-policy"],
      ["FAQ", "/faq"],
      ["Login", "/login"],
    ],
  },
];

const arrow = () => `
  <svg class="arrow" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M3.75 9h10.5M10 4.75 14.25 9 10 13.25"></path>
  </svg>`;

const chevron = () => `
  <svg class="chevron" viewBox="0 0 12 8" aria-hidden="true">
    <path d="m1 1.5 5 5 5-5"></path>
  </svg>`;

const searchIcon = () => `
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="8.8" cy="8.8" r="5.4"></circle>
    <path d="m13 13 4 4"></path>
  </svg>`;

const menuIcon = () => `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path class="menu-lines" d="M4 7h16M4 12h16M4 17h16"></path>
    <path class="menu-close" d="m6 6 12 12M18 6 6 18" hidden></path>
  </svg>`;

const socialIcon = {
  Instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r=".8"></circle></svg>`,
  X: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5 19 19.5M19 4.5 5 19.5"></path></svg>`,
  YouTube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.6 12c0 1.3.1 2.6.4 3.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1c.3-1.2.4-2.5.4-3.8 0-1.3-.1-2.6-.4-3.8Z"></path><path d="m10 15.2 5.2-3.2L10 8.8v6.4Z"></path></svg>`,
  Discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 7.1a13 13 0 0 1 7.6 0l.7-1.2a14 14 0 0 1 3.3 1.3c2.1 3 2.7 6 2.4 8.9a13.5 13.5 0 0 1-4.1 2.1l-1-1.4a9 9 0 0 0 1.3-.7 10.8 10.8 0 0 1-12.8 0c.4.3.9.5 1.3.7l-1 1.4a13.5 13.5 0 0 1-4.1-2.1c-.3-2.9.3-5.9 2.4-8.9a14 14 0 0 1 3.3-1.3l.7 1.2Z"></path><circle cx="8.5" cy="12.5" r="1"></circle><circle cx="15.5" cy="12.5" r="1"></circle></svg>`,
};

function ensureStyles() {
  const pending = [
    ["rmpHomeHeaderStyles", "/home-header-shell.css"],
    ["rmpHomeFooterStyles", "/home-footer-shell.css"],
    ["rmpSiteTypographyStyles", "/site-typography.css"],
  ].map(([id, href]) => new Promise((resolve) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.sheet) resolve();
      else {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", resolve, { once: true });
      }
      return;
    }
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
    document.head.appendChild(link);
  }));
  return Promise.all(pending);
}

function ensureFaqStyles() {
  if (document.getElementById("rmpHomeFaqStyles")) return;
  const link = document.createElement("link");
  link.id = "rmpHomeFaqStyles";
  link.rel = "stylesheet";
  link.href = "/home-faq-shell.css";
  document.head.appendChild(link);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function isFirmDetailPage() {
  return Boolean(document.querySelector("#firmNameHeading, .detail-nav-bar"));
}

function titleFirmName() {
  const url = new URL(window.location.href);
  const parts = url.pathname.split("/").filter(Boolean);
  const routeSlug = parts[0] === "prop-firms" ? parts[1] : "";
  const querySlug = url.searchParams.get("slug");
  const dynamicSlug = routeSlug || (/firm-detail/i.test(parts[parts.length - 1] || "") ? querySlug : "");
  if (dynamicSlug) {
    return dynamicSlug.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  }
  const title = String(document.title || "").trim();
  const titleName = title
    .split(/\s+(?:Review|Prop Firm Details|Reviews &|Rules &|Payout)/i)[0]
    .replace(/\s*\|\s*Rank My Prop.*$/i, "")
    .trim();
  if (titleName && !/^rank my prop$/i.test(titleName)) return titleName;
  return String(document.querySelector("#firmNameHeading")?.textContent || "This prop firm").trim();
}

function showFirmHeadingImmediately() {
  if (!isFirmDetailPage()) return;
  const name = titleFirmName();
  const heading = document.querySelector("#firmNameHeading");
  const overviewTitle = document.querySelector("#firmOverviewTitle");
  const whyTitle = document.querySelector("#firmWhyChooseTitle");
  if (heading && name) heading.textContent = name;
  if (overviewTitle && name) overviewTitle.textContent = `${name} Overview`;
  if (whyTitle && name) whyTitle.textContent = `Why Choose ${name}?`;
  const loader = document.querySelector("#firmPageLoader");
  if (loader) {
    loader.classList.add("hide");
    loader.setAttribute("aria-hidden", "true");
    loader.style.setProperty("display", "none", "important");
  }
}

function removeUnusedFirmDetailTabs() {
  if (!isFirmDetailPage()) return;

  const removedViews = new Set(["spreads", "announcements"]);
  const activeRemovedTab = [...document.querySelectorAll(".detail-nav-item")]
    .find((item) => removedViews.has(item.getAttribute("data-view")) && item.classList.contains("active"));

  if (activeRemovedTab) {
    const overview = document.querySelector('.detail-nav-item[data-view="overview"]');
    if (overview instanceof HTMLElement) overview.click();
    else if (typeof window.__setRmpFirmTabView === "function") {
      window.__setRmpFirmTabView("overview");
    }
  }

  document.querySelectorAll(
    '.detail-nav-item[data-view="spreads"], .detail-nav-item[data-view="announcements"], #detailSpreadsPanel, #detailAnnouncementsPanel'
  ).forEach((element) => element.remove());
}

const detailPlatformAssets = {
  mt4: { name: "MetaTrader 4", src: "/assets/platforms/metatrader-4.ico" },
  metatrader4: { name: "MetaTrader 4", src: "/assets/platforms/metatrader-4.ico" },
  mt5: { name: "MetaTrader 5", src: "/assets/platforms/metatrader-5.svg" },
  metatrader5: { name: "MetaTrader 5", src: "/assets/platforms/metatrader-5.svg" },
  ctrader: { name: "cTrader", src: "/assets/platforms/ctrader-icon.svg" },
  matchtrader: { name: "Match-Trader", src: "/assets/platforms/match-trader.png" },
  tradelocker: { name: "TradeLocker", src: "/assets/platforms/tradelocker.png" },
  dxtrade: { name: "DXtrade", src: "/assets/platforms/dxtrade-icon.png" },
};

const detailPlatformFallbacks = {
  fxify: ["MT4", "MT5", "DXtrade"],
};

function installFirmPlatformLogos() {
  if (!isFirmDetailPage()) return;
  const wrap = document.querySelector("#firmPlatforms");
  if (!wrap) return;

  const render = () => {
    if (wrap.querySelector(".rmp-platform-logo")) return;
    const names = [...wrap.children]
      .map((item) => String(item.textContent || "").trim())
      .filter(Boolean);
    if (!names.length) return;

    let platformNames = names.filter((platform) => {
      const key = platform.toLowerCase().replace(/[^a-z0-9]/g, "");
      return Boolean(detailPlatformAssets[key]);
    });
    if (!platformNames.length) {
      const firmKey = String(document.querySelector("#firmNameHeading")?.textContent || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      platformNames = detailPlatformFallbacks[firmKey] || [];
    }

    const logos = platformNames.map((platform) => {
      const key = platform.toLowerCase().replace(/[^a-z0-9]/g, "");
      const asset = detailPlatformAssets[key];
      if (!asset) return "";
      return `<span class="rmp-platform-logo" data-tooltip="${escapeHtml(asset.name)}" aria-label="${escapeHtml(asset.name)}" title="${escapeHtml(asset.name)}" role="img" tabindex="0"><img src="${asset.src}" alt="" aria-hidden="true"></span>`;
    }).filter(Boolean);

    if (logos.length || wrap.children.length) wrap.innerHTML = logos.join("");
  };

  render();
  const observer = new MutationObserver(render);
  observer.observe(wrap, { childList: true });
}

function firmFaqItems(name) {
  return [
    {
      question: `Is ${name} a legitimate prop firm?`,
      answer: `${name} is reviewed through Rank My Prop's firm research process. Before purchasing an account, verify the current company details, published rules, payout terms and trader feedback shown on this page.`,
    },
    {
      question: `What funding programs does ${name} offer?`,
      answer: `${name}'s available evaluation and instant-funding programs can differ by account size and market. Use the Challenges tab above for the current targets, phases, minimum trading days and account conditions.`,
    },
    {
      question: `How do payouts work at ${name}?`,
      answer: `${name}'s payout cycle, profit split and withdrawal requirements are summarized in the overview and firm-detail tables above. Always confirm the latest payout terms before checkout because program rules can change.`,
    },
    {
      question: `What drawdown rules does ${name} use?`,
      answer: `${name} may apply daily and maximum drawdown limits differently across its programs. Open the Rules tab and check whether drawdown is static, trailing, balance-based or equity-based for the account you plan to buy.`,
    },
    {
      question: `Which trading platforms are available at ${name}?`,
      answer: `The live platform list for ${name} appears in the Platforms card on this page. Platform availability can vary by region and program, so confirm your preferred platform during checkout.`,
    },
    {
      question: `Does ${name} allow news trading, EAs and overnight positions?`,
      answer: `${name}'s strategy restrictions are program-specific. Review the Rules and Trading Conditions sections for news trading, automated strategies, copy trading, weekend holding and consistency requirements.`,
    },
    {
      question: `What should I check before buying a ${name} challenge?`,
      answer: `Compare the entry fee, drawdown calculation, profit target, payout schedule, prohibited strategies, platform support and refund policy. Choose the ${name} program that matches how you actually trade—not only the cheapest fee.`,
    },
    {
      question: `Who is ${name} best suited for?`,
      answer: `${name} may suit traders whose strategy fits its drawdown model, payout timing, supported markets and platform options. Use the complete profile above and verified trader reviews to decide whether it matches your risk style.`,
    },
  ];
}

function createFirmFaq(name) {
  const safeName = escapeHtml(name);
  const section = document.createElement("section");
  section.className = "faq-section rmp-detail-home-faq";
  section.id = "faq";
  section.setAttribute("aria-labelledby", "detailFaqTitle");
  section.innerHTML = `
    <div class="faq-ambient" aria-hidden="true"></div>
    <div class="faq-shell">
      <header class="faq-heading">
        <span>${safeName.toUpperCase()} ANSWER DESK</span>
        <h2 id="detailFaqTitle">Questions worth asking<br><em>before choosing ${safeName}.</em></h2>
        <p>Clear answers about ${safeName}'s programs, payouts, rules and trading conditions—without hiding the details that affect a funded account.</p>
      </header>
      <div class="faq-layout">
        <aside class="faq-support">
          <span class="faq-support-mark" aria-hidden="true"><img src="/assets/rankmyprop-header-logo.png" alt=""></span>
          <div>
            <small>PERSONAL GUIDANCE</small>
            <h3>Still reviewing ${safeName}?</h3>
            <p>Tell us your strategy, budget and preferred market. Our team will help you check whether ${safeName} fits your trading style.</p>
          </div>
          <a href="/contact">
            Ask Rank My Prop
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h11M10.5 5l4 4-4 4"></path></svg>
          </a>
        </aside>
        <div class="faq-list">
          ${firmFaqItems(name).map((item, index) => {
            const isOpen = index === 0;
            return `
              <article class="faq-item${isOpen ? " is-open" : ""}">
                <button type="button" aria-expanded="${isOpen}" aria-controls="detailFaqAnswer${index}">
                  <span class="faq-number">${String(index + 1).padStart(2, "0")}</span>
                  <strong>${escapeHtml(item.question)}</strong>
                  <span class="faq-toggle" aria-hidden="true"><i></i><i></i></span>
                </button>
                <div class="faq-answer" id="detailFaqAnswer${index}">
                  <div><p>${escapeHtml(item.answer)}</p></div>
                </div>
              </article>`;
          }).join("")}
        </div>
      </div>
    </div>`;
  section.querySelectorAll(".faq-item").forEach((item) => {
    const button = item.querySelector("button");
    button?.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");
      section.querySelectorAll(".faq-item").forEach((row) => {
        row.classList.remove("is-open");
        row.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
  return section;
}

function listingFaqConfig() {
  const pageKey = String(window.location.pathname.split("/").pop() || "")
    .toLowerCase()
    .replace(/\.html$/, "");
  const routeParts = String(window.location.pathname || "")
    .toLowerCase()
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/\.html$/, ""));

  const rankingPages = {
    "best-prop-firms-2026": "Best Prop Firms 2026",
    "fast-payout-prop-firms": "Fast Payout Prop Firms",
    "best-instant-funding-firms": "Best Instant Funding Firms",
    "best-futures-prop-firms": "Best Futures Prop Firms",
    "most-trusted-prop-firms": "Most Trusted Prop Firms",
    "beginner-friendly-firms": "Beginner-Friendly Prop Firms",
    "highest-rated-firms": "Highest-Rated Prop Firms",
    "cheapest-prop-firms": "Cheapest Prop Firms",
    "best-hft-prop-firms": "Best HFT Prop Firms"
  };

  const companyFaqPages = {
    about: {
      label: "ABOUT RANK MY PROP",
      lead: "Questions about",
      trail: "how Rank My Prop works.",
      description: "Clear answers about our research purpose, rankings, trader tools, commercial relationships and the checks traders should still make independently.",
      supportTitle: "Want to know more about our research?",
      supportText: "Tell us which ranking, firm profile or methodology question you are reviewing and we’ll point you toward the relevant context.",
      subject: "Question about Rank My Prop",
      items: [
        { question: "What does Rank My Prop help traders do?", answer: "Rank My Prop brings firm comparisons, approved trader feedback, rule explanations, offers, education and risk-planning tools into one research workflow." },
        { question: "Is Rank My Prop a prop firm or broker?", answer: "No. Rank My Prop is an independent information and research platform. It does not operate funded accounts, execute trades or provide brokerage services." },
        { question: "How are firms compared?", answer: "Firm research considers published rules, payouts, pricing, platform support, approved trader feedback, trust signals and practical fit. No single metric decides every ranking." },
        { question: "Do affiliate relationships affect the need to verify a firm?", answer: "No. Some links may earn a commission, but every trader should independently confirm current rules, eligibility and final checkout terms." },
        { question: "Which tools are available?", answer: "The platform includes firm comparison, calculators, a rule explainer, Trade Journal, learning hubs, offer tracking and account-based dashboard workflows." }
      ]
    },
    contact: {
      label: "CONTACT ANSWER DESK",
      lead: "Questions before",
      trail: "contacting our team.",
      description: "Choose the right contact route and include the context needed for account support, research corrections, listings, partnerships or legal requests.",
      supportTitle: "Ready to send your request?",
      supportText: "Use the form above or email support directly. Include relevant URLs, firm names and account context where possible.",
      subject: "Help with a Rank My Prop request",
      items: [
        { question: "Which issues can I contact Rank My Prop about?", answer: "You can request account support, report a research correction, ask about a firm listing, discuss a partnership, or submit a legal and privacy request." },
        { question: "What should a research correction include?", answer: "Include the page URL, firm name, exact value you believe is inaccurate, the current official source and any supporting screenshot or effective date." },
        { question: "How quickly will I receive a response?", answer: "Most complete requests are reviewed within one to three business days. Complex research, legal or verification matters may take longer." },
        { question: "Does the contact form store my message?", answer: "The current form prepares an email in your default mail application. Your email provider controls sending and storage after you choose to send it." },
        { question: "Where should privacy requests be sent?", answer: "Select the legal or privacy topic in the form or email the official contact address from the email associated with your account where applicable." }
      ]
    },
    legal: {
      label: "LEGAL POLICY DESK",
      lead: "Questions about",
      trail: "the Rank My Prop policy framework.",
      description: "A practical guide to how the Legal overview, Disclaimer, Privacy Policy, Terms of Service and Cookies Policy work together.",
      supportTitle: "Need to send an official notice?",
      supportText: "Include the relevant policy, URL, complete context and supporting evidence so the request can be reviewed correctly.",
      subject: "Rank My Prop legal policy question",
      items: [
        { question: "Which policy applies to website research and trading risk?", answer: "The Website Disclaimer covers educational purpose, trading risk, third-party firms, accuracy, affiliate disclosure and limitations of liability." },
        { question: "Which policy covers account data?", answer: "The Privacy Policy covers information collection, service providers, retention, security and data requests. The Cookies Policy explains browser-side storage technologies." },
        { question: "Which policy governs platform accounts and conduct?", answer: "The Terms of Service covers eligibility, account responsibilities, acceptable use, rewards, intellectual property and access restrictions." },
        { question: "What happens when policies overlap?", answer: "The more specific policy normally controls the relevant topic. The documents are intended to be read together." },
        { question: "How are policy changes communicated?", answer: "Revised wording is published on the relevant page with an updated effective date. Material account-related changes may also be communicated through available platform channels." }
      ]
    },
    disclaimer: {
      label: "DISCLAIMER ANSWER DESK",
      lead: "Questions about",
      trail: "research and trading responsibility.",
      description: "Understand the educational nature of Rank My Prop content, the risks of trading and the need to verify third-party firm information.",
      supportTitle: "Found information that needs review?",
      supportText: "Send the page URL, firm name, current official source and the exact information that appears outdated.",
      subject: "Disclaimer or research accuracy question",
      items: [
        { question: "Is Rank My Prop content financial advice?", answer: "No. Rankings, articles, calculators and rule explanations are educational information and independent research, not personalized investment, trading, tax or legal advice." },
        { question: "Does a high ranking guarantee challenge success or a payout?", answer: "No. Trading results, challenge approval, funded status and payouts cannot be guaranteed." },
        { question: "Who controls a prop firm’s rules and account decisions?", answer: "Each third-party firm controls its own pricing, rules, platform, regional access, account actions and payout decisions." },
        { question: "Should I verify information before buying?", answer: "Yes. Confirm the exact program, account size, drawdown calculation, restricted strategies, payout terms and final price directly before payment." },
        { question: "Does Rank My Prop use affiliate links?", answer: "Some links or codes may generate a commission at no added cost to the user. Commercial relationships do not remove the need for independent verification." }
      ]
    },
    "privacy-policy": {
      label: "PRIVACY ANSWER DESK",
      lead: "Questions about",
      trail: "your data and privacy.",
      description: "Clear guidance about account information, dashboard records, service providers, retention, security and privacy requests.",
      supportTitle: "Need to make a privacy request?",
      supportText: "Contact us from the email linked to your account where applicable so identity and ownership can be verified safely.",
      subject: "Rank My Prop privacy request",
      items: [
        { question: "What information can Rank My Prop collect?", answer: "Depending on the features used, data can include account details, login metadata, dashboard submissions, reviews, claims, referrals, journal entries and aggregate usage information." },
        { question: "Does Rank My Prop sell personal data?", answer: "The published policy states that Rank My Prop does not sell personal data." },
        { question: "Why are service providers used?", answer: "Providers may support authentication, hosting, storage, analytics, email delivery, media and operational security." },
        { question: "Can I request access, correction or deletion?", answer: "Subject to applicable law and identity verification, you may request access, correction, account closure or deletion of eligible personal data." },
        { question: "Can every record be deleted immediately?", answer: "Some records may need to be retained for security, dispute resolution, anti-fraud controls or legal obligations." }
      ]
    },
    terms: {
      label: "TERMS ANSWER DESK",
      lead: "Questions about",
      trail: "using Rank My Prop.",
      description: "Clear guidance on eligibility, account responsibilities, acceptable use, user submissions, rewards and platform access.",
      supportTitle: "Have an account-policy question?",
      supportText: "Share the relevant feature, submission or policy section without sending passwords or other sensitive credentials.",
      subject: "Rank My Prop terms question",
      items: [
        { question: "Who can use Rank My Prop account features?", answer: "Users must be legally capable of accepting the terms and meet the applicable age-of-majority requirement." },
        { question: "What are users responsible for?", answer: "Users must protect account credentials, provide accurate information and remain responsible for activity performed through their account." },
        { question: "What conduct is prohibited?", answer: "Fraud, manipulation, abusive content, infrastructure attacks, unauthorized scraping, duplicate-account abuse and misleading submissions are prohibited." },
        { question: "Are rewards and cashback automatic?", answer: "No. Rewards, cashback and related claims can require eligibility checks, evidence review and moderation before approval." },
        { question: "Can platform access be suspended?", answer: "Access may be restricted or terminated for abuse, fraud indicators, legal risk or violation of published terms." }
      ]
    },
    "cookies-policy": {
      label: "COOKIES ANSWER DESK",
      lead: "Questions about",
      trail: "cookies and browser storage.",
      description: "Understand why essential storage is used, how analytics may support the website and what browser controls are available.",
      supportTitle: "Need help with storage or sign-in?",
      supportText: "Tell us which browser and feature are affected without sharing passwords, session codes or other sensitive credentials.",
      subject: "Cookies or browser storage question",
      items: [
        { question: "What browser technologies can Rank My Prop use?", answer: "The website may use cookies, local storage, session storage and related technologies for sign-in, preferences, security and aggregate performance measurement." },
        { question: "What is essential storage?", answer: "Essential storage supports requested functions such as authentication, account continuity, security controls and interface preferences." },
        { question: "Can I block or delete website data?", answer: "Most browsers provide controls to view, block or delete cookies and website storage. Doing so may sign you out or remove locally saved preferences." },
        { question: "Do external prop firm websites use the same policy?", answer: "No. External websites operate independently and may use different cookies, analytics and privacy practices." },
        { question: "Does clearing cookies delete my server-side account?", answer: "No. Clearing browser data does not normally delete account records stored by the platform. Account or privacy requests must be submitted separately." }
      ]
    }
  };

  if (companyFaqPages[pageKey]) {
    return { pageKey, ...companyFaqPages[pageKey] };
  }

  if (pageKey === "prop-news") {
    return {
      pageKey,
      label: "PROP NEWS ANSWER DESK",
      lead: "Questions worth asking",
      trail: "before acting on prop firm news.",
      description: "Clear guidance for reading payout updates, rule changes, market developments, and trader-focused research without relying on headlines alone.",
      supportTitle: "Need help interpreting an update?",
      supportText: "Tell us which firm, rule, or payout change you are reviewing. We’ll point you toward the context that matters for your trading plan.",
      subject: "Help me understand a Prop News update",
      items: [
        { question: "What does the Prop News section cover?", answer: "Prop News covers payout developments, trading-rule changes, platform updates, firm policies, market trends, and practical education for funded traders." },
        { question: "Are older Rank My Prop articles still available?", answer: "Yes. The complete previous article archive is included alongside newly published Prop News entries." },
        { question: "How should I verify a rule or payout update?", answer: "Read the complete article, check its publication context, and confirm critical terms on the firm’s official rules or checkout page before acting." },
        { question: "Can I search and filter the article archive?", answer: "Yes. Use the search field, category filters, sorting controls, and pagination to narrow the archive." },
        { question: "Are Prop News articles financial advice?", answer: "No. The content is independent research and education. Trading and challenge purchases should be based on your own risk assessment." },
        { question: "How are new articles added?", answer: "Published entries from the Rank My Prop content system appear together with the preserved legacy archive, while duplicate slugs are automatically avoided." }
      ]
    };
  }

  if (/^blog-post-\d+$/.test(pageKey) || pageKey === "prop-news-post" || (routeParts[0] === "news" && routeParts[1])) {
    const articleTitle = String(document.querySelector("main h1")?.textContent || document.title || "Prop News article")
      .replace(/\s*\|\s*Rank My Prop.*$/i, "")
      .trim();
    return {
      pageKey,
      label: "PROP NEWS READER DESK",
      lead: "Questions worth checking",
      trail: "after reading this article.",
      description: `Use these checks to apply ${articleTitle || "this Prop News article"} carefully and verify the details that affect a funded account.`,
      supportTitle: "Need context for this article?",
      supportText: "Share the firm, rule, or trading condition you are comparing. We’ll help you find the most relevant Rank My Prop research.",
      subject: `Help me understand ${articleTitle || "this Prop News article"}`,
      items: [
        { question: "What should I verify before acting on this article?", answer: "Confirm the current firm rules, payout terms, effective date, eligible account type, and any restrictions directly on the firm’s official website." },
        { question: "Can prop firm rules change after an article is published?", answer: "Yes. Firms can change pricing, platforms, drawdown calculations, payout conditions, and prohibited strategies, so always verify time-sensitive terms again." },
        { question: "How can I compare this information with other firms?", answer: "Use Listed Props and Best Prop Firms to compare account conditions, then open the relevant firm profile for its full rules and payout context." },
        { question: "Where can I find more Prop News research?", answer: "Return to the Prop News archive to search all previous articles and newly published updates by topic." },
        { question: "Is this article financial advice?", answer: "No. Rank My Prop articles provide independent research and educational context, not personalized financial or trading advice." }
      ]
    };
  }

  const learningHubs = {
    "trading-guides": {
      name: "Trading Guides",
      label: "TRADING GUIDE ANSWER DESK",
      focus: "practical playbooks, trading methods, and funded-account execution"
    },
    "funding-strategies": {
      name: "Funding Strategies",
      label: "FUNDING STRATEGY ANSWER DESK",
      focus: "challenge planning, account growth, and smarter paths to funding"
    },
    "trading-psychology": {
      name: "Trading Psychology",
      label: "TRADING PSYCHOLOGY ANSWER DESK",
      focus: "discipline, decision-making, consistency, and emotional control"
    },
    "beginner-tutorials": {
      name: "Beginner Tutorials",
      label: "BEGINNER LEARNING DESK",
      focus: "step-by-step trading foundations, risk basics, and prop firm concepts"
    }
  };

  const hub = learningHubs[pageKey];
  if (hub) {
    return {
      pageKey,
      label: hub.label,
      lead: "Questions that make",
      trail: `${hub.name.toLowerCase()} easier to use.`,
      description: `Clear guidance for applying ${hub.focus} to your own trading plan without skipping the rules that protect your account.`,
      supportTitle: `Need help using ${hub.name}?`,
      supportText: "Tell us your experience level, strategy, market, and current challenge. We’ll point you toward the most relevant learning material.",
      subject: `Help me with ${hub.name}`,
      items: [
        { question: `What will I learn in ${hub.name}?`, answer: `This section covers ${hub.focus} through focused articles published by the Rank My Prop editorial team.` },
        { question: "Are these articles suitable for funded-account traders?", answer: "Yes. The material is designed around common evaluation rules, account limits, payout conditions, and the practical decisions funded traders face." },
        { question: "How should I apply a guide to my trading plan?", answer: "Start with one idea, define how it fits your risk limits, test it consistently, and record the outcome before changing several parts of your process at once." },
        { question: "Can prop firm rules override a strategy in an article?", answer: "Yes. Always confirm the current rules for your exact firm and account because drawdown, news, holding, and strategy restrictions can differ." },
        { question: "How are new learning articles added?", answer: "Published entries from the Rank My Prop content system appear automatically in the relevant learning hub." },
        { question: "Is this content financial advice?", answer: "No. Rank My Prop provides independent research and education. You remain responsible for your trading and challenge-purchase decisions." }
      ]
    };
  }

  const articleHubKey = learningHubs[routeParts[0]]
    ? routeParts[0]
    : pageKey === "content-post"
      ? String(new URLSearchParams(window.location.search).get("type") || "trading-guides").toLowerCase()
      : "";
  const articleHub = learningHubs[articleHubKey];
  if (articleHub && (pageKey === "content-post" || routeParts.length > 1)) {
    const articleTitle = String(document.querySelector("main h1")?.textContent || document.title || "this learning article")
      .replace(/\s*\|\s*Rank My Prop.*$/i, "")
      .trim();
    return {
      pageKey: "learning-article",
      label: "LEARNING ARTICLE ANSWER DESK",
      lead: "Questions worth checking",
      trail: "before applying this lesson.",
      description: `Use these checks to apply ${articleTitle || "this article"} carefully within your strategy, risk limits, and current prop firm rules.`,
      supportTitle: "Need help applying this lesson?",
      supportText: "Share your market, strategy, account type, and the part of the article you are working through. We’ll help you find the right context.",
      subject: `Help me apply ${articleTitle || articleHub.name}`,
      items: [
        { question: "What should I verify before using this lesson?", answer: "Check that the method fits your market, experience, risk tolerance, and the current rules of your exact prop firm account." },
        { question: "Should I change my whole trading plan at once?", answer: "No. Test one clearly defined change at a time so you can measure whether it improves discipline, execution, or risk control." },
        { question: "Can this article replace the official firm rules?", answer: "No. Educational content provides context, while the firm’s current published terms control what is allowed on your account." },
        { question: `Where can I find more ${articleHub.name.toLowerCase()}?`, answer: `Return to the ${articleHub.name} hub to browse and search all published articles in this category.` },
        { question: "Is this lesson financial advice?", answer: "No. It is educational information and independent research, not personalized financial or trading advice." }
      ]
    };
  }

  if (pageKey === "giveaways" || pageKey === "giveaway") {
    return {
      pageKey: "giveaways",
      label: "GIVEAWAY ANSWER DESK",
      lead: "Questions to check",
      trail: "before entering a giveaway.",
      description: "Clear guidance about eligibility, entry steps, winner announcements, and the information you should verify for every Rank My Prop giveaway.",
      supportTitle: "Need help with an entry?",
      supportText: "Tell us which giveaway you are entering and where the process stopped. We’ll help you find the relevant instructions.",
      subject: "Help me with a Rank My Prop giveaway",
      items: [
        { question: "How do I enter a Rank My Prop giveaway?", answer: "Open the active giveaway, review every listed eligibility requirement, and complete each entry step before the stated closing time." },
        { question: "Where can I see whether a giveaway is still active?", answer: "The giveaway page shows its current status, dates, entry progress, and available action button using the latest published data." },
        { question: "How are winners announced?", answer: "Published winners appear in the winner section or past-giveaway history after the giveaway is completed and results are confirmed." },
        { question: "Can entry requirements differ between giveaways?", answer: "Yes. Eligibility, required actions, regions, dates, and reward terms can vary, so read the complete instructions for the specific giveaway." },
        { question: "Do I need to pay to enter?", answer: "Follow the terms shown on the active giveaway. Never send money or account credentials unless the official published conditions clearly require a legitimate purchase action." },
        { question: "What should I do if an entry is not recorded?", answer: "Recheck every required step, keep supporting evidence where appropriate, and contact Rank My Prop support with the giveaway name and your entry details." }
      ]
    };
  }

  if (pageKey === "offers") {
    return {
      pageKey,
      label: "PROP FIRM OFFER DESK",
      lead: "Questions worth checking",
      trail: "before using a prop firm offer.",
      description: "Clear guidance for checking promo codes, eligibility and checkout terms before purchasing a funded-account challenge.",
      supportTitle: "Need help checking an offer?",
      supportText: "Tell us the firm, account type and code you are reviewing. We’ll help you find the terms that deserve a second look.",
      subject: "Help me verify a prop firm offer",
      items: [
        { question: "How do I use a prop firm discount code?", answer: "Open the offer from this page, choose the exact account or challenge on the firm’s website, enter the displayed code at checkout and confirm the final price before paying." },
        { question: "Are the displayed discounts guaranteed on every account?", answer: "No. A promotion can apply only to selected programs, account sizes, regions or purchase dates. The final eligible price shown by the firm at checkout controls the transaction." },
        { question: "How are offers kept current?", answer: "Active offers are published through the Rank My Prop offer dashboard. Promotions can still change without notice, so each checkout should be verified directly before purchase." },
        { question: "Does using an offer change the firm’s trading rules?", answer: "Usually a discount changes the purchase price, not the evaluation rules. Still verify drawdown, profit targets, payout conditions, refunds and prohibited strategies for the exact program." },
        { question: "Why does Rank My Prop use affiliate links?", answer: "Some offer links may earn Rank My Prop a commission at no additional cost to you. Commercial relationships do not replace the need to research the firm and its current terms." },
        { question: "What should I do if a code does not work?", answer: "Check spelling, eligible plans, minimum purchase conditions and the promotion period. If the checkout still rejects it, do not complete the purchase on the assumption that a later refund is guaranteed." }
      ]
    };
  }

  if (pageKey === "compare" || routeParts[0] === "compare") {
    const dynamic = window.__rmpCompareFaq;
    if (dynamic && Array.isArray(dynamic.items) && dynamic.items.length) {
      return {
        pageKey: "compare",
        label: dynamic.label || "PROP FIRM COMPARISON DESK",
        lead: dynamic.lead || "Questions about",
        trail: dynamic.trail || "this firm comparison.",
        description: dynamic.description || "Live comparison guidance based on the selected firms and their published Rank My Prop data.",
        supportTitle: dynamic.supportTitle || "Need help comparing these firms?",
        supportText: dynamic.supportText || "Share the account programs you are considering and we’ll help you identify the differences that matter.",
        subject: dynamic.subject || "Help me compare these prop firms",
        items: dynamic.items
      };
    }
    return {
      pageKey,
      label: "PROP FIRM COMPARISON DESK",
      lead: "Questions worth checking",
      trail: "before choosing between firms.",
      description: "Clear guidance for comparing challenge costs, drawdown rules, payouts, platforms and trust signals across your shortlisted prop firms.",
      supportTitle: "Need help comparing firms?",
      supportText: "Share the firms and account programs you are considering. We’ll help you identify the differences that matter for your trading style.",
      subject: "Help me compare prop firms",
      items: [
        { question: "How many prop firms can I compare at once?", answer: "You can start with two listed prop firms and expand the table up to four. Each selection updates the same comparison rows so account setup, rules, payouts and firm details stay aligned." },
        { question: "Where does the comparison data come from?", answer: "The table uses published firm records and approved Rank My Prop rating statistics. Values are matched from the firm’s structured profile fields and current CMS data." },
        { question: "Why does a table cell sometimes show a dash?", answer: "A dash means that a usable value is not currently available in the published firm record. It should not be interpreted as zero, not allowed or not applicable." },
        { question: "Which rules matter most when comparing prop firms?", answer: "Check daily loss, maximum drawdown type, profit targets, minimum trading days, time limits, news and automation rules, payout timing and refund conditions." },
        { question: "Can I share a comparison with someone else?", answer: "Yes. Use Share to copy a link containing your selected firms. Opening that link restores the same two-to-four-firm shortlist." },
        { question: "Should I verify the figures before buying a challenge?", answer: "Yes. Prop firms can change prices and conditions without notice. Confirm the exact program, account size, drawdown calculation and checkout terms on the firm’s official website before paying." }
      ]
    };
  }

  if (pageKey === "tradejournal") {
    return {
      pageKey,
      label: "TRADE JOURNAL ANSWER DESK",
      lead: "Questions worth answering",
      trail: "before reviewing your trades.",
      description: "Clear guidance for logging trades, syncing journal data, attaching setup screenshots, and using your history to build a more consistent funded-trading process.",
      supportTitle: "Need help with your journal?",
      supportText: "Tell us what you are trying to record, export, or review. We’ll help you use the Trade Journal more effectively.",
      subject: "Help me with the Trade Journal",
      items: [
        { question: "What can I record in the Trade Journal?", answer: "You can record the date, session, market pair, direction, position size, entry, stop loss, take profit, result, profit or loss, confidence, notes, and a supporting trade image." },
        { question: "Do I need to log in to save my trades?", answer: "Yes. Logging in connects each journal entry to your Rank My Prop account so your history can be saved securely and synced across supported devices." },
        { question: "Is my journal data private?", answer: "Journal records are owner-scoped to the authenticated account. Other traders cannot browse or edit your private trade history through the Trade Journal." },
        { question: "Can I attach a chart or setup screenshot?", answer: "Yes. Add a supported image to preserve the setup, execution, or result alongside the written details of the trade." },
        { question: "Can I export my complete journal?", answer: "Yes. The journal includes CSV, Excel, and PDF export options so you can keep an offline copy or review your trades in another workflow." },
        { question: "How should I use the journal to improve consistency?", answer: "Review repeated setups, rule breaks, emotional decisions, risk levels, and session performance. Change one measurable behavior at a time and compare the results over a meaningful sample of trades." }
      ]
    };
  }

  const calculatorPages = {
    "calculators": {
      name: "Trading Calculators",
      label: "TRADING TOOL ANSWER DESK",
      focus: "choosing and using the right calculator",
      firstQuestion: "Which calculators are available?",
      firstAnswer: "The toolkit includes lot size, risk-to-reward, drawdown, profit split, consistency-rule and loss-recovery calculators, together with the Rule Explainer and Trade Journal."
    },
    "lotsizecalculator": {
      name: "Lot Size Calculator",
      label: "POSITION SIZE ANSWER DESK",
      focus: "calculating a position size from a defined cash-risk budget",
      firstQuestion: "How is the lot size calculated?",
      firstAnswer: "The calculator divides the selected cash risk by the stop-loss distance and the entered pip value for one standard lot, then rounds the result down to a practical lot increment."
    },
    "risk-to-reward-calculator": {
      name: "Risk-to-Reward Calculator",
      label: "TRADE PLAN ANSWER DESK",
      focus: "reviewing entry, stop-loss and target prices",
      firstQuestion: "What does a 1:2 reward-to-risk result mean?",
      firstAnswer: "It means the planned reward is twice the amount or price distance placed at risk. It describes the setup structure, not the probability of winning."
    },
    "drawdown-calculator": {
      name: "Drawdown Calculator",
      label: "DRAWDOWN ANSWER DESK",
      focus: "checking daily and maximum loss buffers",
      firstQuestion: "What is the difference between daily and maximum drawdown?",
      firstAnswer: "Daily drawdown usually measures loss from a defined daily reference and resets at a specified time. Maximum drawdown uses a broader static or trailing account floor."
    },
    "profit-split-calculator": {
      name: "Profit Split Calculator",
      label: "PAYOUT ANSWER DESK",
      focus: "estimating a payout from eligible profit",
      firstQuestion: "How is the estimated payout calculated?",
      firstAnswer: "Eligible profit is multiplied by the trader share, after which any processing fee and optional personal reserve entered in the form are shown separately."
    },
    "consistency-rule-calculator": {
      name: "Consistency Rule Calculator",
      label: "CONSISTENCY ANSWER DESK",
      focus: "checking best-day profit concentration",
      firstQuestion: "How is the consistency percentage calculated?",
      firstAnswer: "The model divides the largest winning day by total net profit for the same calculation window and multiplies the result by 100."
    },
    "lossrecoveryplanner": {
      name: "Loss Recovery Planner",
      label: "RECOVERY ANSWER DESK",
      focus: "measuring the return required after a loss",
      firstQuestion: "Why is the recovery percentage larger than the loss percentage?",
      firstAnswer: "After a loss, the recovery gain is earned on a smaller balance. For example, returning from 90 to 100 requires an 11.11% gain even though the original decline was 10%."
    },
    "ruletranslator": {
      name: "Prop Firm Rule Explainer",
      label: "PROP FIRM RULE ANSWER DESK",
      focus: "understanding common prop-firm rules",
      firstQuestion: "What can the Rule Explainer explain?",
      firstAnswer: "It covers 41 common rule topics across drawdown, evaluation, payout, execution, risk, strategy, compliance and other prop-firm categories in seven language modes."
    }
  };

  const calculatorPage = calculatorPages[pageKey];
  if (calculatorPage) {
    return {
      pageKey,
      label: calculatorPage.label,
      lead: "Questions worth checking",
      trail: `before using the ${calculatorPage.name.toLowerCase()}.`,
      description: `Clear guidance for ${calculatorPage.focus}, reviewing the assumptions and checking firm-specific conditions before relying on the result.`,
      supportTitle: `Need help with the ${calculatorPage.name}?`,
      supportText: "Tell us which inputs, account rule or result you are reviewing. We’ll help you identify the assumptions that need confirmation.",
      subject: `Help me with the ${calculatorPage.name}`,
      items: [
        { question: calculatorPage.firstQuestion, answer: calculatorPage.firstAnswer },
        { question: "Does the result use live broker or prop-firm account data?", answer: "No. The result is calculated from the figures entered on the page. Where an instrument value or firm limit varies, use the current value from your platform or official rules." },
        { question: "Can this tool confirm that a trade or account is safe?", answer: "No. It is a planning aid. Real execution, open profit or loss, trading costs and firm-specific calculations can change the actual outcome." },
        { question: "Why are the calculation assumptions shown beside the result?", answer: "Visible assumptions make it easier to spot when a default value does not match your instrument, account currency, payout window or prop-firm policy." },
        { question: "Should I verify the current prop-firm rules separately?", answer: "Yes. Confirm the calculation base, reset time, limits, exceptions and breach consequences for your exact firm, program and account stage." },
        { question: "Is the calculator output financial advice?", answer: "No. Rank My Prop provides educational planning tools and independent research, not personalized financial, investment, tax or legal advice." }
      ]
    };
  }

  if (pageKey === "listedprop") {
    return {
      pageKey,
      label: "PROP FIRM DIRECTORY",
      lead: "Questions to answer",
      trail: "before choosing a firm.",
      description: "Clear guidance for using the directory, comparing account conditions and checking the details that matter before purchasing a challenge.",
      supportTitle: "Need help narrowing the list?",
      supportText: "Tell us your market, budget, strategy and preferred platform. We’ll point you toward the research that matches your trading style.",
      subject: "Help me compare listed prop firms",
      items: [
        { question: "What is the Listed Prop Firms directory?", answer: "The directory brings published prop firm profiles into one searchable view. You can compare ratings, account allocation, leverage, profit split, trading conditions and available firm details before opening a full review." },
        { question: "What is the difference between Listed Props and Best Prop Firms?", answer: "Listed Props is the broader firm directory. Best Prop Firms is a curated ranking built from stronger research signals such as payout reliability, rule clarity, trader feedback, value and platform support." },
        { question: "How should I compare firms in this directory?", answer: "Start with the filters, then compare drawdown type, profit targets, payout timing, restricted strategies, supported platforms and total challenge cost. Open View Details before making a final decision." },
        { question: "Where do firm ratings and review counts come from?", answer: "Public ratings use approved reviews from the Rank My Prop review system. Pending or rejected submissions are excluded, and live aggregates update as approved feedback is published." },
        { question: "Are all listed firms verified or recommended?", answer: "A listing is not an automatic recommendation. Verification and payout-assurance indicators are shown separately where available. Always review the complete firm profile and current terms before purchasing." },
        { question: "Can I filter firms by country or trading style?", answer: "Yes. Use the country, tag and search controls to narrow the directory. Available filters depend on the firm data published through the Rank My Prop CMS." },
        { question: "How current are the fees, rules and platform details?", answer: "Firm information is managed through the Rank My Prop CMS and refreshed when published terms change. Because firms can update conditions without notice, confirm critical rules again on the firm’s checkout page." },
        { question: "What should I check immediately before buying a challenge?", answer: "Confirm the exact program, account size, daily and maximum drawdown calculation, payout schedule, consistency rules, prohibited strategies, refund terms, platform and final price at checkout." },
      ],
    };
  }

  if (pageKey === "bestprop") {
    return {
      pageKey,
      label: "RANKING ANSWER DESK",
      lead: "Questions behind",
      trail: "the best prop firm rankings.",
      description: "Understand how to read the rankings, compare different trader needs and verify the rules behind every shortlisted funded account.",
      supportTitle: "Still comparing top firms?",
      supportText: "Share your strategy, budget and preferred market. We’ll help you identify which ranked firms deserve a closer look for your setup.",
      subject: "Help me compare the best prop firms",
      items: [
        { question: "How does Rank My Prop choose the best prop firms?", answer: "We compare payout reliability, rule clarity, trader feedback, pricing, account conditions, platform support and the overall fit for funded traders. No single headline metric determines the list." },
        { question: "Can a prop firm pay for a higher ranking?", answer: "Commercial relationships do not automatically determine ranking position. Offers and affiliate links are handled separately from the research signals used to compare firms." },
        { question: "Does the number-one firm suit every trader?", answer: "No. A highly ranked firm can still be a poor fit for a specific strategy. Your preferred market, drawdown tolerance, holding style, platform and payout needs should decide the final shortlist." },
        { question: "How important is payout reliability in the ranking?", answer: "Payout performance is a major research signal because a funded account has little value if withdrawals are inconsistent. We also consider payout timing, requirements, available evidence and trader experience." },
        { question: "How are prop firm rules compared fairly?", answer: "We look beyond profit targets and compare daily loss limits, maximum drawdown type, consistency rules, news and overnight restrictions, prohibited strategies and the conditions attached to payouts." },
        { question: "Are forex, futures and instant-funding firms ranked together?", answer: "The main ranking offers an overall view, while dedicated category pages help compare firms built for different markets and funding models. Use the relevant category before choosing an account." },
        { question: "How often can the best prop firm rankings change?", answer: "Rankings can change when firms update rules, pricing, platforms, payouts or trader-facing policies. Published CMS updates flow into the comparison experience as the research is refreshed." },
        { question: "What should I verify after shortlisting a top-ranked firm?", answer: "Open the full firm profile and verify the exact program fee, drawdown calculation, payout cycle, restricted strategies, platform availability, refund terms and current checkout conditions." },
      ],
    };
  }

  const rankingName = rankingPages[pageKey];
  if (rankingName) {
    return {
      pageKey,
      label: `${rankingName.toUpperCase()} ANSWER DESK`,
      lead: "Questions worth asking",
      trail: `before choosing ${rankingName.toLowerCase()}.`,
      description: `Clear guidance for comparing ${rankingName.toLowerCase()}, checking account conditions and verifying the rules that matter before checkout.`,
      supportTitle: "Need help narrowing the ranking?",
      supportText: "Tell us your strategy, budget and preferred market. We’ll help you identify which firms deserve a closer look for your setup.",
      subject: `Help me compare ${rankingName}`,
      items: [
        { question: `How are ${rankingName.toLowerCase()} selected?`, answer: "We compare payout reliability, rule clarity, trader feedback, pricing, account conditions, platform support and suitability for the category shown on this page." },
        { question: "Can a commercial partnership guarantee a ranking position?", answer: "No. Affiliate links and offers are handled separately from the research signals used to compare and rank firms." },
        { question: "Does the first-ranked firm suit every trader?", answer: "No. Your market, strategy, drawdown tolerance, holding style, platform and payout needs should determine the final choice." },
        { question: "Which rules should I compare before buying?", answer: "Check daily loss, maximum drawdown type, profit targets, consistency limits, news and overnight restrictions, prohibited strategies and payout conditions." },
        { question: "Where do ratings and review counts come from?", answer: "Public ratings use approved reviews from the Rank My Prop review system. Pending or rejected submissions are not included in public aggregates." },
        { question: "How often can this ranking change?", answer: "Rankings can change when firms update rules, pricing, platforms, payouts or trader-facing policies and the published research is refreshed." },
        { question: "What should I verify at checkout?", answer: "Confirm the exact account size, program fee, drawdown calculation, payout cycle, restricted strategies, refund terms, platform and final price on the firm’s website." }
      ]
    };
  }

  return null;
}

function createListingFaq(config) {
  const section = document.createElement("section");
  section.className = "faq-section rmp-listing-home-faq";
  section.id = "faq";
  section.setAttribute("aria-labelledby", `${config.pageKey}FaqTitle`);
  section.innerHTML = `
    <div class="faq-ambient" aria-hidden="true"></div>
    <div class="faq-shell">
      <header class="faq-heading">
        <span>${escapeHtml(config.label)}</span>
        <h2 id="${config.pageKey}FaqTitle">${escapeHtml(config.lead)}<br><em>${escapeHtml(config.trail)}</em></h2>
        <p>${escapeHtml(config.description)}</p>
      </header>
      <div class="faq-layout">
        <aside class="faq-support">
          <span class="faq-support-mark" aria-hidden="true"><img src="/assets/rankmyprop-header-logo.png" alt=""></span>
          <div>
            <small>PERSONAL GUIDANCE</small>
            <h3>${escapeHtml(config.supportTitle)}</h3>
            <p>${escapeHtml(config.supportText)}</p>
          </div>
          <a href="/contact">
            Ask Rank My Prop
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h11M10.5 5l4 4-4 4"></path></svg>
          </a>
        </aside>
        <div class="faq-list">
          ${config.items.map((item, index) => {
            const isOpen = index === 0;
            return `
              <article class="faq-item${isOpen ? " is-open" : ""}">
                <button type="button" aria-expanded="${isOpen}" aria-controls="${config.pageKey}FaqAnswer${index}">
                  <span class="faq-number">${String(index + 1).padStart(2, "0")}</span>
                  <strong>${escapeHtml(item.question)}</strong>
                  <span class="faq-toggle" aria-hidden="true"><i></i><i></i></span>
                </button>
                <div class="faq-answer" id="${config.pageKey}FaqAnswer${index}">
                  <div><p>${escapeHtml(item.answer)}</p></div>
                </div>
              </article>`;
          }).join("")}
        </div>
      </div>
    </div>`;

  section.querySelectorAll(".faq-item").forEach((item) => {
    const button = item.querySelector("button");
    button?.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");
      section.querySelectorAll(".faq-item").forEach((row) => {
        row.classList.remove("is-open");
        row.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
  return section;
}

function installListingFaq(footer) {
  const config = listingFaqConfig();
  if (!config || !footer) return;
  ensureFaqStyles();
  document.querySelectorAll(".rmp-research-panels, #rmpQuickLinksSection, #rmpFaqSection, .rmp-listing-home-faq").forEach((node) => node.remove());
  footer.parentNode?.insertBefore(createListingFaq(config), footer);
}

function installFirmDetailFaq(footer) {
  if (!isFirmDetailPage() || !footer) return;
  ensureFaqStyles();
  showFirmHeadingImmediately();
  document.querySelectorAll("#rmpQuickLinksSection, #rmpFaqSection, .rmp-detail-home-faq").forEach((node) => node.remove());
  footer.parentNode?.insertBefore(createFirmFaq(titleFirmName()), footer);

  const observer = new MutationObserver(() => {
    document.querySelectorAll("#rmpQuickLinksSection, #rmpFaqSection").forEach((node) => node.remove());
  });
  observer.observe(document.body, { childList: true });
  window.setTimeout(() => observer.disconnect(), 6000);
}

function dropdownMarkup(key) {
  const menu = dropdownData[key];
  return `
    <div class="dropdown-panel dropdown-${key}" data-dropdown-panel="${key}">
      <div class="dropdown-intro">
        <span>${menu.eyebrow}</span>
        <h2>${menu.title}</h2>
        <p>Independent data and tools, designed to help traders choose with clarity.</p>
        <a href="${menu.allHref}">${menu.allLabel}${arrow()}</a>
      </div>
      <div class="dropdown-links">
        ${menu.items.map((item, index) => `
          <a href="${item.href}" class="dropdown-link">
            <span class="item-index">${String(index + 1).padStart(2, "0")}</span>
            <span class="item-copy">
              <strong>${item.label}${item.badge ? `<small>${item.badge}</small>` : ""}</strong>
              <span>${item.description}</span>
            </span>
            ${arrow()}
          </a>`).join("")}
      </div>
    </div>`;
}

function marketSwitchMarkup() {
  return `
    <div class="market-switch" aria-label="Select market">
      <span class="market-indicator" aria-hidden="true"></span>
      <button class="selected" type="button" aria-pressed="true">Prop Firm</button>
      <button type="button" aria-pressed="false">Broker</button>
    </div>`;
}

function createHeader() {
  const header = document.createElement("header");
  header.className = "site-header rmp-shared-home-header";
  header.innerHTML = `
    <div class="header-shell">
      <a class="brand" href="/" aria-label="RankMyProp home">
        <img src="/assets/rankmyprop-header-logo.png" alt="">
        <span>Rank My Prop</span>
      </a>
      <nav class="main-nav" aria-label="Primary navigation">
        <a class="nav-link" href="/listedprop">Listed Props</a>
        ${["firms", "compare", "calculators"].map((key, index) => {
          const labels = ["Best Prop Firms", "Compare", "Calculators"];
          const before = index === 1 ? `<a class="nav-link" href="/offers">Offers</a><a class="nav-link" href="/reviews">Reviews</a>` : "";
          const trigger = key === "firms"
            ? `<a class="nav-link nav-button" href="/bestprop" aria-expanded="false">${labels[index]}${chevron()}</a>`
            : `<button class="nav-link nav-button" type="button" aria-expanded="false">${labels[index]}${chevron()}</button>`;
          return `${before}<div class="nav-group" data-dropdown="${key}">
            ${trigger}
            ${dropdownMarkup(key)}
          </div>`;
        }).join("")}
        <a class="nav-link" href="/prop-news">Prop News</a>
        <div class="mobile-actions">
          ${marketSwitchMarkup()}
          <button class="mobile-search-trigger" type="button">${searchIcon()} Search pages</button>
          <a class="login-button rmp-login-btn" href="/login">Login${arrow()}</a>
        </div>
      </nav>
      <div class="header-actions">
        <button class="search-button" type="button" aria-label="Search" aria-expanded="false">${searchIcon()}</button>
        ${marketSwitchMarkup()}
        <a class="login-button rmp-login-btn" href="/login">Login${arrow()}</a>
      </div>
      <button class="mobile-menu-button" type="button" aria-label="Toggle navigation" aria-expanded="false">${menuIcon()}</button>
      <div class="search-panel" role="search" hidden>
        <div class="search-field">
          ${searchIcon()}
          <input placeholder="Search firms, reviews, calculators..." aria-label="Search RankMyProp">
          <kbd>ESC</kbd>
        </div>
        <div class="search-meta"><span>Quick access</span><span>Press Enter to open</span></div>
        <div class="search-results"></div>
      </div>
    </div>`;
  return header;
}

function createFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer rmp-shared-home-footer";
  footer.innerHTML = `
    <div class="footer-shell">
      <div class="footer-main">
        <div class="footer-brand">
          <a href="/" class="footer-logo" aria-label="Rank My Prop home">
            <img src="/assets/rankmyprop-header-logo.png" alt="">
            <span>Rank My Prop</span>
          </a>
          <p>Independent prop firm research, real community feedback and practical tools for traders who want clarity before checkout.</p>
          <a class="footer-research-link" href="/bestprop">Start your research${arrow()}</a>
        </div>
        <nav class="footer-navigation" aria-label="Footer navigation">
          ${footerGroups.map((group) => `
            <div class="footer-group">
              <strong>${group.title}</strong>
              ${group.links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}
            </div>`).join("")}
        </nav>
      </div>
      <div class="footer-social-row">
        <span>Follow Rank My Prop</span>
        <div>
          ${[
            ["Instagram", "https://instagram.com/rankmyprop.hq"],
            ["X", "https://x.com/rankmyprop"],
            ["YouTube", "https://youtube.com/@RankMyProp"],
            ["Discord", "https://discord.gg/xrP4qN3y3p"],
          ].map(([label, href]) => `
            <a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Rank My Prop on ${label}">
              ${socialIcon[label]}<span>${label}</span>
            </a>`).join("")}
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Rank My Prop. All rights reserved.</span>
        <div>
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/disclaimer">Disclaimer</a>
        </div>
        <span>Research before you risk.</span>
      </div>
    </div>
    <section class="rmp-brand-wordmark-section" aria-label="Rank My Prop">
      <div class="rmp-footer-brand-bg">RANK MY PROP</div>
      <div class="rmp-footer-fade" aria-hidden="true"></div>
    </section>`;
  return footer;
}

function bindHeader(header) {
  const shell = header.querySelector(".header-shell");
  const mainNav = header.querySelector(".main-nav");
  const menuButton = header.querySelector(".mobile-menu-button");
  const searchButton = header.querySelector(".search-button");
  const mobileSearch = header.querySelector(".mobile-search-trigger");
  const searchPanel = header.querySelector(".search-panel");
  const searchInput = header.querySelector(".search-field input");
  const searchMeta = header.querySelector(".search-meta span");
  const results = header.querySelector(".search-results");
  let activeDropdown = "";

  const closeDropdowns = () => {
    activeDropdown = "";
    header.querySelectorAll(".nav-group").forEach((group) => {
      group.classList.remove("is-open");
      group.querySelector(".nav-button")?.classList.remove("is-active");
      group.querySelector(".nav-button")?.setAttribute("aria-expanded", "false");
    });
  };

  const openDropdown = (key) => {
    closeSearch();
    closeDropdowns();
    const group = header.querySelector(`[data-dropdown="${key}"]`);
    if (!group) return;
    activeDropdown = key;
    group.classList.add("is-open");
    group.querySelector(".nav-button")?.classList.add("is-active");
    group.querySelector(".nav-button")?.setAttribute("aria-expanded", "true");
  };

  const renderSearch = () => {
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const matches = (query
      ? searchItems.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query))
      : searchItems
    ).slice(0, 7);
    if (searchMeta) searchMeta.textContent = query ? `${matches.length} results` : "Quick access";
    if (!results) return;
    results.innerHTML = matches.length
      ? matches.map((item, index) => `
        <a href="${item.href}" class="search-result">
          <span class="search-result-index">${String(index + 1).padStart(2, "0")}</span>
          <span><strong>${item.label}</strong><small>${item.description}</small></span>
          ${arrow()}
        </a>`).join("")
      : `<div class="search-empty"><strong>No exact match</strong><span>Try searching “payout”, “review” or “calculator”.</span></div>`;
  };

  function closeSearch() {
    if (!searchPanel || !searchButton) return;
    searchPanel.hidden = true;
    searchButton.classList.remove("is-active");
    searchButton.setAttribute("aria-expanded", "false");
  }

  const toggleSearch = () => {
    if (!searchPanel || !searchButton) return;
    closeDropdowns();
    mainNav?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    const willOpen = searchPanel.hidden;
    searchPanel.hidden = !willOpen;
    searchButton.classList.toggle("is-active", willOpen);
    searchButton.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      renderSearch();
      window.setTimeout(() => searchInput?.focus(), 20);
    }
  };

  header.querySelectorAll(".nav-group").forEach((group) => {
    const key = group.getAttribute("data-dropdown");
    const button = group.querySelector(".nav-button");
    group.addEventListener("mouseenter", () => {
      if (window.matchMedia("(min-width: 981px)").matches) openDropdown(key);
    });
    button?.addEventListener("click", (event) => {
      if (key === "firms") return;
      event.preventDefault();
      if (activeDropdown === key) closeDropdowns();
      else openDropdown(key);
    });
  });

  shell?.addEventListener("mouseleave", () => {
    if (window.matchMedia("(min-width: 981px)").matches) closeDropdowns();
  });

  header.querySelectorAll(".market-switch").forEach((switcher) => {
    switcher.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const broker = button.textContent.trim() === "Broker";
        if (broker) {
          window.location.href = "/broker-coming-soon";
          return;
        }
        switcher.classList.toggle("show-broker", broker);
        switcher.querySelectorAll("button").forEach((option) => {
          const selected = option === button;
          option.classList.toggle("selected", selected);
          option.setAttribute("aria-pressed", String(selected));
        });
      });
    });
  });

  menuButton?.addEventListener("click", () => {
    closeDropdowns();
    closeSearch();
    const open = !mainNav?.classList.contains("is-open");
    mainNav?.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector(".menu-lines")?.toggleAttribute("hidden", open);
    menuButton.querySelector(".menu-close")?.toggleAttribute("hidden", !open);
  });

  searchButton?.addEventListener("click", toggleSearch);
  mobileSearch?.addEventListener("click", toggleSearch);
  searchInput?.addEventListener("input", renderSearch);
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const first = results?.querySelector("a.search-result");
      if (first) window.location.href = first.href;
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Element) || shell?.contains(event.target)) return;
    closeDropdowns();
    closeSearch();
    mainNav?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeDropdowns();
    closeSearch();
    mainNav?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
}

async function installHomeShell() {
  if (document.querySelector(".rmp-shared-home-header")) return;
  // Do not inject the shared shell until its CSS is ready. Injecting first and
  // styling on the next network tick caused a brief unstyled block at 0,0 on
  // every transition between the React home page and preserved HTML pages.
  await ensureStyles();
  if (document.querySelector(".rmp-shared-home-header")) return;
  removeUnusedFirmDetailTabs();
  installFirmPlatformLogos();
  document.body.classList.remove("rmp-has-fixed-nav", "rmp-mobile-menu-open");
  document.documentElement.style.removeProperty("--rmp-fixed-nav-h");

  const header = createHeader();
  const existingNav = document.querySelector("nav.glass");
  if (existingNav) existingNav.replaceWith(header);
  else document.body.prepend(header);

  const footer = createFooter();
  const existingFooter = document.querySelector("footer");
  if (existingFooter) existingFooter.replaceWith(footer);
  else document.body.appendChild(footer);
  installFirmDetailFaq(footer);
  installListingFaq(footer);
  if (!window.__rmpCompareFaqListenerBound) {
    window.__rmpCompareFaqListenerBound = true;
    window.addEventListener("rmp:compare-updated", () => {
      installListingFaq(document.querySelector("footer.rmp-shared-home-footer"));
    });
  }
  bindHeader(header);
  window.dispatchEvent(new CustomEvent("rmp:home-shell-ready"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installHomeShell, { once: true });
} else {
  installHomeShell();
}
