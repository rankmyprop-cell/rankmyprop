import { getFirmsByType } from "./firms-service.js";

function esc(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toUrl(v = "") {
  const value = String(v || "").trim();
  if (!value) return "#";
  return value.startsWith("http") ? value : `https://${value}`;
}

function parseList(v, fallback = []) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((x) => x.trim()).filter(Boolean);
  return fallback;
}

function fromRouteSlug() {
  const u = new URL(window.location.href);
  const querySlug = String(u.searchParams.get("slug") || "").trim().toLowerCase();
  if (querySlug) return querySlug;
  const bodySlug = String(document.body?.dataset?.firmSlug || "").trim().toLowerCase();
  if (bodySlug) return bodySlug;
  const file = String(window.location.pathname.split("/").pop() || "").toLowerCase();
  if (file.endsWith("detail.html")) return file.replace("detail.html", "").replace(/[^a-z0-9-]/g, "");
  if (file.endsWith("detail") && file !== "firm-detail") return file.replace(/detail$/, "").replace(/[^a-z0-9-]/g, "");
  if (file && !file.endsWith(".html") && file !== "firm-detail") return file.replace(/[^a-z0-9-]/g, "");
  return "";
}

function defaultDetails(firm = {}) {
  return {
    score: Number(firm.score || 4.4).toFixed(1),
    trustedBy: String(firm.trustedBy || "935+ traders"),
    promo: String(firm.promoText || "20% OFF + Cashback"),
    performance: {
      profitability: Number(firm.performance?.profitability || 4.6),
      payouts: Number(firm.performance?.payouts || 4.5),
      rules: Number(firm.performance?.rules || 4.3),
      flexibility: Number(firm.performance?.flexibility || 4.2),
      trust: Number(firm.performance?.trust || 4.4)
    },
    stats: Array.isArray(firm.stats) && firm.stats.length
      ? firm.stats
      : [
          { value: "935+", label: "Traders" },
          { value: "$4M+", label: "Total Payouts" },
          { value: "14 Days", label: "First Payout" },
          { value: "2023", label: "Founded" }
        ],
    tabs: parseList(firm.tabs, ["Overview", "Challenges", "Rules", "Reviews", "Spreads", "Payouts", "About"]),
    overview: String(firm.overview || firm.bio || "No overview added yet."),
    tradingConditions: Array.isArray(firm.tradingConditions) && firm.tradingConditions.length
      ? firm.tradingConditions
      : [
          { label: "Daily Drawdown", value: "3% - 5% (Plan dependent)" },
          { label: "Maximum Drawdown", value: "6% - 10% (Static)" },
          { label: "Leverage", value: "Up to 1:100" },
          { label: "Hedging", value: "Allowed" },
          { label: "Copy Trading", value: "Own Accounts Only" }
        ],
    firmDetails: Array.isArray(firm.firmDetails) && firm.firmDetails.length
      ? firm.firmDetails
      : [
          { label: "Company Name", value: firm.name || "-" },
          { label: "Headquarters", value: firm.headquarters || firm.country || "Global" },
          { label: "Founded", value: firm.founded || "N/A" },
          { label: "CEO", value: firm.ceo || "N/A" },
          { label: "Platforms", value: parseList(firm.platforms, ["MT5"]).join(", ") },
          { label: "Instruments", value: parseList(firm.markets, ["Forex"]).join(", ") },
          { label: "Payout Frequency", value: firm.payoutModel || "Bi-weekly" },
          { label: "News Trading", value: "Allowed" }
        ],
    leverageRows: Array.isArray(firm.leverageRows) && firm.leverageRows.length
      ? firm.leverageRows
      : [
          { instrument: "Indices", c1: "1:50", c2: "1:30", c3: "1:100", c4: "Variable" },
          { instrument: "Energy", c1: "1:50", c2: "1:50", c3: "1:50", c4: "n/a" },
          { instrument: "FX", c1: "1:50", c2: "1:30", c3: "1:100", c4: "n/a" },
          { instrument: "Metals", c1: "1:50", c2: "1:30", c3: "1:50", c4: "n/a" },
          { instrument: "Crypto", c1: "1:2", c2: "1:1", c3: "1:2", c4: "n/a" }
        ],
    commissions: Array.isArray(firm.commissions) && firm.commissions.length
      ? firm.commissions
      : [
          { title: "Indices", lines: ["Standard: No Commission", "Swap Free Add-on on MT5 only"] },
          { title: "Energy", lines: ["Standard: No Commission", "Swap Free Add-on on MT5 only"] },
          { title: "FX", lines: ["Standard: 5-step, 2-step & Pro: $5", "Zero: $7 per lot round trip"] }
        ],
    evaluationPrograms: Array.isArray(firm.evaluationPrograms) && firm.evaluationPrograms.length
      ? firm.evaluationPrograms
      : [
          { program: "1-Step", phase1: "10%", phase2: "-", target: "10%", allocation: "$2,000,000", split: "Up to 90%" },
          { program: "2-Step", phase1: "8%", phase2: "5%", target: "10%", allocation: "$4,000,000", split: "Up to 95%" },
          { program: "Instant Funding", phase1: "-", phase2: "-", target: "-", allocation: "$1,000,000", split: "Up to 90%" }
        ],
    paymentMethods: parseList(firm.paymentMethods, ["Crypto", "RiseWorks", "TC Pay"]),
    restrictedCountries: parseList(firm.restrictedCountries, ["Bangladesh", "Belarus", "Grenada", "Malaysia", "Myanmar", "North Korea", "Chad", "Belize", "Tuvalu", "Cape Verde", "Iran", "Syria", "Sudan", "Cuba", "Russia"]),
    whyChoose: parseList(firm.whyChoose, [
      "High profit split up to 95%",
      "No minimum trading days",
      "Fast payouts & scalable plans",
      "Multiple platforms to choose",
      "Flexible evaluation models"
    ]),
    sectionContent: {
      challenges: String(firm.challengesText || "Challenge models include 1-step, 2-step, and instant funding tracks with clear progression milestones and risk controls.").trim(),
      rules: String(firm.rulesText || firm.ruleModel || "Rules are designed for consistency with max drawdown, daily loss limits, and disciplined execution standards.").trim(),
      reviews: String(firm.reviewsText || "Community feedback highlights fast support, transparent dashboards, and stable payout experience for compliant traders.").trim(),
      spreads: String(firm.spreadsText || "Spread and commission structure varies by instrument class; traders can choose plans based on strategy fit and execution style.").trim(),
      payouts: String(firm.payoutsText || firm.payoutModel || "Payout cycle and split are optimized for active traders, with scalable allocations on consistent performance.").trim(),
      about: String(firm.aboutText || firm.bio || "This firm focuses on institutional-style funded trading infrastructure with trader-first tooling and measurable risk systems.").trim()
    }
  };
}

function appStyles() {
  return `
  <style>
    *{box-sizing:border-box}
    :root{
      --bg:#070812;
      --panelTop:rgba(17,18,29,.94);
      --panelBottom:rgba(10,11,18,.94);
      --border:#2a2340;
      --text:#eef1ff;
      --muted:#9ca4c4;
      --accent:#6b5bff;
      --accent2:#5a4dff;
    }
    body{margin:0;background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif}
    a{text-decoration:none}
    .rmp-bg{position:fixed;inset:0;pointer-events:none;background:
      radial-gradient(920px 360px at 52% -8%,rgba(101,80,255,.2),transparent 60%),
      radial-gradient(640px 250px at 90% 5%,rgba(88,72,255,.08),transparent 60%),
      linear-gradient(180deg,#0a0b12,#07080f);}
    .glass{background:linear-gradient(180deg,rgba(18,19,31,.92),rgba(11,12,20,.92));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--border);border-radius:12px}
    .nav-wrap{position:relative;z-index:5;max-width:1450px;margin:16px auto 0;padding:0 12px}
    .nav{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;gap:12px}
    .nav-links{display:flex;gap:8px;align-items:center;list-style:none;margin:0;padding:0}
    .nav-item{padding:6px 12px;border-radius:8px;color:#cfd4e6;font-size:13px}
    .nav-item:hover,.nav-item.active{background:rgba(120,110,255,.18);box-shadow:0 0 12px rgba(120,110,255,.38);color:#fff}
    .cta-btn{background:linear-gradient(180deg,#7c74ff,#5a52ff);color:#fff;border-radius:9px;padding:7px 12px;font-size:12px;font-weight:700}
    .has-dropdown{position:relative}
    .dropdown{position:absolute;top:140%;left:0;min-width:220px;background:rgba(18,16,32,.95);backdrop-filter:blur(18px);border:1px solid var(--border);border-radius:12px;padding:10px;opacity:0;transform:translateY(10px);pointer-events:none;transition:.22s;z-index:20}
    .dropdown a{display:block;padding:10px 12px;border-radius:8px;color:#dce2ff;font-size:12px}
    .dropdown a:hover{background:rgba(120,110,255,.18)}
    .has-dropdown.open .dropdown{opacity:1;transform:translateY(0);pointer-events:auto}
    .hamburger{display:none;border:1px solid var(--border);background:rgba(255,255,255,.03);color:#fff;border-radius:9px;padding:6px 10px;font-size:16px}
    .mobile-menu{display:none;position:absolute;left:0;right:0;top:100%;margin-top:8px;background:rgba(11,12,20,.96);border:1px solid var(--border);border-radius:12px;padding:12px;flex-direction:column;gap:8px;z-index:30}
    .mobile-menu.open{display:flex}
    .page{position:relative;z-index:4;max-width:1450px;margin:10px auto 34px;padding:0 12px}
    .panel{background:linear-gradient(180deg,var(--panelTop),var(--panelBottom));border:1px solid var(--border);border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,.26)}
    .top{padding:12px;min-height:390px}
    .top-header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:8px}
    .top-grid{display:grid;grid-template-columns:232px 1fr 300px;gap:10px}
    .firm-head{display:flex;gap:12px}
    .firm-logo{width:46px;height:46px;border-radius:8px;border:1px solid rgba(255,255,255,.16);object-fit:cover;background:#fff}
    .firm-name{font-size:24px;font-weight:600;line-height:1.05;margin:0;letter-spacing:-.01em}
    .firm-meta{margin-top:4px;color:#99a3c5;font-size:10.5px;line-height:1.35}
    .button-row{display:flex;gap:8px;flex-wrap:wrap}
    .chip-btn{height:36px;padding:0 12px;border-radius:8px;border:1px solid var(--border);background:rgba(255,255,255,.02);color:#dce1ff;font-size:10.5px;font-weight:600;display:inline-flex;align-items:center}
    .chip-btn.primary{border-color:rgba(122,116,255,.55);background:linear-gradient(180deg,#7a74ff,#5b55ff);box-shadow:inset 0 0 18px rgba(153,140,255,.16)}
    .left-stack,.radar-wrap,.top-right{background:rgba(10,11,19,.72);border:1px solid var(--border);border-radius:10px}
    .left-stack{padding:8px}
    .score-box{padding:8px;border:1px solid var(--border);border-radius:8px}
    .score-big{font-size:42px;line-height:1;font-weight:700;color:#796bff}
    .stars{color:#7468ff;font-size:11px;letter-spacing:1.5px;margin-top:3px}
    .mini-row{display:flex;justify-content:space-between;gap:8px;padding:7px 8px;border-radius:8px;border:1px solid var(--border);margin-top:7px;font-size:10.5px;background:rgba(255,255,255,.01)}
    .buy-btn{margin-top:8px;display:block;text-align:center;padding:8px 10px;background:linear-gradient(180deg,#7a74ff,#5b55ff);border-radius:8px;color:#fff;font-weight:700;font-size:12px}
    .radar-wrap{padding:8px}
    .radar-title{font-size:10.5px;color:#c3cae7;text-align:center;margin:0 0 4px}
    .radar-bars{display:grid;gap:5px;margin-top:3px}
    .radar-bar-row{display:grid;grid-template-columns:68px 1fr 24px;gap:6px;align-items:center;font-size:9px;color:#aeb7d4}
    .radar-bar-track{height:5px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid var(--border)}
    .radar-bar-fill{height:100%;background:linear-gradient(90deg,#6f63ff,#8a80ff)}
    .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:4px}
    .stat{padding:6px;border-radius:8px;border:1px solid var(--border);text-align:center;background:rgba(255,255,255,.01)}
    .stat b{display:block;font-size:12px}
    .stat small{font-size:9.5px;color:#aeb7d4}
    .top-right{padding:8px}
    .top-right h4{margin:0 0 8px;font-size:12px}
    .badge-wrap{display:flex;flex-wrap:wrap;gap:6px}
    .badge{border:1px solid var(--border);background:rgba(122,116,255,.08);color:#d9dcff;padding:4px 7px;border-radius:7px;font-size:9.5px}
    .kv{display:grid;grid-template-columns:1fr auto;gap:8px;padding:3px 0;font-size:10.5px}
    .kv span{color:#9ba4c6}
    .kv b{color:#fff;font-weight:700}
    .tabs{display:flex;flex-wrap:wrap;gap:16px;padding:9px 10px;border-top:1px solid var(--border);font-size:10.5px;color:#c6cdf0}
    .tabs .active{color:#fff;position:relative}
    .tabs .active:after{content:"";position:absolute;left:0;right:0;bottom:-9px;height:2px;background:#7a74ff;border-radius:2px;box-shadow:0 0 10px rgba(122,116,255,.55)}
    .tab-note{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 5px;border-radius:999px;background:#5f52ff;color:#fff;font-size:9.5px;margin-left:6px;box-shadow:0 0 10px rgba(122,116,255,.45)}
    .content-grid{display:grid;grid-template-columns:70% 30%;gap:10px;margin-top:10px}
    .block{padding:10px 11px}
    .overview-block{min-height:240px}
    .conditions-block{min-height:240px}
    .block h3{margin:0 0 7px;font-size:16px;font-weight:600;letter-spacing:-.01em}
    .block p{margin:0;color:#bfc7e4;line-height:1.5;font-size:13px}
    .table{width:100%;border-collapse:collapse;font-size:12px}
    .table th,.table td{border-top:1px solid var(--border);padding:4px 6px;text-align:left;line-height:1.22}
    .table th{color:#aeb8d8;font-weight:600}
    .list{display:grid;gap:6px}
    .list-row{display:grid;grid-template-columns:1fr auto;gap:8px;font-size:11px}
    .list-row span{color:#a5afcf}
    .list-row b{font-weight:600}
    .country{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.03);font-size:10px}
    .dot{width:6px;height:6px;border-radius:999px;background:#5f52ff;display:inline-block}
    .muted{color:#9ca6c9}
    @media(max-width:1040px){
      .top-grid{grid-template-columns:1fr}
      .content-grid{grid-template-columns:1fr}
      .stat-grid{grid-template-columns:repeat(2,1fr)}
      .nav-links,.login-desktop{display:none}
      .hamburger{display:inline-flex}
      .firm-name{font-size:22px}
      .top-header{flex-direction:column;align-items:flex-start}
    }
  </style>`;
}

function radarSvg(perf, score) {
  const values = [
    Number(perf.profitability || 0),
    Number(perf.payouts || 0),
    Number(perf.rules || 0),
    Number(perf.flexibility || 0),
    Number(perf.trust || 0)
  ].map((v) => Math.max(0, Math.min(5, v)));
  const points = [];
  const cx = 156;
  const cy = 118;
  const r = 86;
  for (let i = 0; i < 5; i += 1) {
    const angle = (-90 + i * 72) * (Math.PI / 180);
    const rr = (values[i] / 5) * r;
    points.push(`${cx + Math.cos(angle) * rr},${cy + Math.sin(angle) * rr}`);
  }
  return `
  <svg viewBox="0 0 320 220" width="100%" height="210" aria-hidden="true">
    <polygon points="156,38 228,88 200,168 112,168 84,88" fill="rgba(122,116,255,.07)" stroke="rgba(122,116,255,.22)"/>
    <polygon points="${points.join(" ")}" fill="rgba(122,116,255,.45)" stroke="#7a74ff" stroke-width="2"/>
    <circle cx="156" cy="118" r="24" fill="rgba(0,0,0,.45)" stroke="rgba(255,255,255,.2)"/>
    <text x="156" y="114" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">${esc(score)}</text>
    <text x="156" y="129" text-anchor="middle" fill="#a8b1d2" font-size="7">Overall Score</text>
    <text x="156" y="22" text-anchor="middle" fill="#9da7ca" font-size="9">Profitability</text>
    <text x="241" y="93" text-anchor="middle" fill="#9da7ca" font-size="9">Payouts</text>
    <text x="214" y="183" text-anchor="middle" fill="#9da7ca" font-size="9">Rules</text>
    <text x="97" y="183" text-anchor="middle" fill="#9da7ca" font-size="9">Flexibility</text>
    <text x="70" y="93" text-anchor="middle" fill="#9da7ca" font-size="9">Trust</text>
  </svg>`;
}

function radarBars(perf) {
  const rows = [
    { label: "Profit", key: "profitability" },
    { label: "Payout", key: "payouts" },
    { label: "Rules", key: "rules" },
    { label: "Flex", key: "flexibility" },
    { label: "Trust", key: "trust" }
  ];
  return `<div class="radar-bars">${rows.map((row) => {
    const v = Math.max(0, Math.min(5, Number(perf?.[row.key] || 0)));
    const pct = (v / 5) * 100;
    return `<div class="radar-bar-row"><span>${row.label}</span><span class="radar-bar-track"><span class="radar-bar-fill" style="width:${pct}%"></span></span><b>${v.toFixed(1)}</b></div>`;
  }).join("")}</div>`;
}

function layout(firm) {
  const d = defaultDetails(firm);
  const platforms = parseList(firm.platforms, ["MT5", "DXTrade", "cTrader", "Match-Trader", "TradeLocker"]);
  const defaultMetrics = [
    { label: "Max Allocation", value: "$4,000,000" },
    { label: "Profit Split", value: "Up to 90% (95% Elite)" },
    { label: "Payout Cycle", value: "14 Days" },
    { label: "Scaling Plan", value: "Available" },
    { label: "Min Trading Days", value: "0 Days (No Minimum)" },
    { label: "Time Limit", value: "No Limit" },
    { label: "EA Allowed", value: "Yes (T&C Apply)" },
    { label: "News Trading", value: "Allowed" }
  ];
  const metricMap = new Map(defaultMetrics.map((m) => [m.label.toLowerCase(), m.value]));
  (Array.isArray(firm.keyMetrics) ? firm.keyMetrics : []).forEach((m) => {
    const key = String(m?.label || "").trim().toLowerCase();
    if (!key) return;
    metricMap.set(key, String(m?.value || "-"));
  });
  const keyMetrics = defaultMetrics.map((m) => ({ label: m.label, value: metricMap.get(m.label.toLowerCase()) || m.value }));
  const profileMeta = [
    firm.ceo ? `CEO: ${firm.ceo}` : "",
    parseList(firm.markets, []).join(" • "),
    firm.founded ? `Founded ${firm.founded}` : "",
    firm.headquarters || firm.country || ""
  ].filter(Boolean).join(" • ");

  return `
    ${appStyles()}
    <div class="rmp-bg"></div>
    <div class="nav-wrap">
      <nav class="glass nav">
        <div style="display:flex;align-items:center;gap:10px"><img fetchpriority="high" loading="eager" decoding="async" src="assets/Rank%20My%20Prop%20Logo%201.webp" alt="Rank My Prop" style="width:30px;height:30px;border-radius:8px;object-fit:cover"><b>Rank My Prop</b></div>
        <ul class="nav-links">
          <li><a class="nav-item active" href="index.html">Home</a></li>
          <li><a class="nav-item" href="listedprop.html">Listed Props</a></li>
          <li><a class="nav-item" href="bestprop.html">Best Prop Firms</a></li>
          <li><a class="nav-item" href="/offers">Discount Code</a></li>
          <li><a class="nav-item" href="blog.html">Prop News</a></li>
          <li class="has-dropdown">
            <span class="nav-item" id="featuresBtn">Calculators ▾</span>
            <div class="dropdown" id="featuresDropdown">
              <a href="lotsizecalculator.html">Lot Size Calculator</a>
              <a href="lossrecoveryplanner.html">Loss Recovery Calculator</a>
              <a href="ruletranslator.html">Rule Explainer</a>
              <a href="tradejournal.html">Trade Journal</a>
            </div>
          </li>
        </ul>
        <button id="hamburger" class="hamburger">☰</button>
        <a href="login.html" class="cta-btn login-desktop">Login</a>
        <div id="mobileMenu" class="mobile-menu">
          <a href="index.html" class="nav-item active">Home</a>
          <a href="listedprop.html" class="nav-item">Listed Props</a>
          <a href="bestprop.html" class="nav-item">Best Prop Firms</a>
          <a href="/offers" class="nav-item">Discount Code</a>
          <a href="blog.html" class="nav-item">Prop News</a>
          <a href="lotsizecalculator.html" class="nav-item">Lot Size Calculator</a>
          <a href="lossrecoveryplanner.html" class="nav-item">Loss Recovery Calculator</a>
          <a href="ruletranslator.html" class="nav-item">Rule Explainer</a>
          <a href="tradejournal.html" class="nav-item">Trade Journal</a>
          <a href="login.html" class="cta-btn">Login</a>
        </div>
      </nav>
    </div>
    <main class="page">
      <section class="panel top">
        <div class="top-header">
          <div class="firm-head">
            <img fetchpriority="low" loading="lazy" decoding="async" class="firm-logo" src="${esc(firm.logo || "assets/Rank%20My%20Prop%20Logo%201.webp")}" alt="${esc(firm.name || "Firm")}">
            <div>
              <h1 class="firm-name">${esc(firm.name || "Firm Details")}</h1>
              <div class="firm-meta">${esc(profileMeta || "Trader-first proprietary trading firm profile")}</div>
            </div>
          </div>
          <div class="button-row">
            <a class="chip-btn" href="${esc(firm.buyLink || "#")}" target="_blank" rel="noopener">Leave a Review</a>
            <a class="chip-btn primary" href="${esc(toUrl(firm.website))}" target="_blank" rel="noopener">Visit Website</a>
          </div>
        </div>
        <div class="top-grid">
          <div class="left-stack">
            <div style="display:grid;grid-template-columns:118px 1fr;gap:8px">
              <div class="score-box">
                <div class="score-big">${esc(d.score)}</div>
                <div class="stars">★★★★★</div>
                <div class="muted" style="font-size:11px;margin-top:6px">Trusted by ${esc(d.trustedBy)}</div>
              </div>
              <div>
                <div class="mini-row"><span>RMP</span><b>Copy</b></div>
                <div class="mini-row"><span>${esc(d.promo)}</span></div>
                <a class="buy-btn" href="${esc(firm.buyLink || "discount.html")}" target="_blank" rel="noopener">Buy Now</a>
              </div>
            </div>
          </div>
          <div class="radar-wrap">
            <p class="radar-title">Firm Performance Overview</p>
            ${radarSvg(d.performance, d.score)}
            ${radarBars(d.performance)}
            <div class="stat-grid">
              ${d.stats.map((s) => `<div class="stat"><b>${esc(s.value || "-")}</b><small>${esc(s.label || "-")}</small></div>`).join("")}
            </div>
          </div>
          <div style="display:grid;gap:10px">
            <div class="top-right"><h4>Platforms</h4><div class="badge-wrap">${platforms.map((p) => `<span class="badge">${esc(p)}</span>`).join("")}</div></div>
            <div class="top-right"><h4>Key Metrics</h4>${keyMetrics.map((m) => `<div class="kv"><span>${esc(m?.label || "-")}</span><b>${esc(m?.value || "-")}</b></div>`).join("")}</div>
            <div class="top-right"><h4>Trading Conditions</h4>${d.tradingConditions.map((r) => `<div class="kv"><span>${esc(r.label || "-")}</span><b>${esc(r.value || "-")}</b></div>`).join("")}</div>
            <div class="top-right"><h4>Restricted Countries</h4><div class="badge-wrap">${d.restrictedCountries.filter((x) => !/and more/i.test(String(x))).map((x) => `<span class="country">${esc(x)}</span>`).join("")}</div></div>
          </div>
        </div>
        <div class="tabs">${d.tabs.map((t, i) => `<span class="${i === 0 ? "active" : ""}">${esc(t)}${i === 1 ? '<span class="tab-note">2</span>' : ""}${i === 3 ? '<span class="tab-note">1027</span>' : ""}${i === 5 ? '<span class="tab-note">New</span>' : ""}</span>`).join("")}</div>
      </section>

      <div class="content-grid">
        <section class="panel block overview-block">
          <h3>${esc(firm.name || "Firm")} Overview</h3>
          <p>${esc(d.overview)}</p>
          <div style="margin-top:10px"><a href="#" class="chip-btn" style="height:28px;font-size:10px">Show More ↘</a></div>
        </section>
        <section class="panel block conditions-block">
          <h3>Trading Conditions</h3>
          <div class="list">${d.tradingConditions.map((r) => `<div class="list-row"><span>${esc(r.label || "-")}</span><b>${esc(r.value || "-")}</b></div>`).join("")}</div>
        </section>
      </div>
    </main>`;
}

function wireHeaderControls() {
  const featuresBtn = document.getElementById("featuresBtn");
  const featuresWrapper = featuresBtn?.parentElement;
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  featuresBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    featuresWrapper?.classList.toggle("open");
  });
  hamburger?.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileMenu?.classList.toggle("open");
  });
  document.addEventListener("click", () => {
    featuresWrapper?.classList.remove("open");
    mobileMenu?.classList.remove("open");
  });
}

async function loadFirm() {
  const app = document.getElementById("rmpFirmPageApp") || document.body;
  const slug = fromRouteSlug();
  const listed = await getFirmsByType("listed", { surface: "profile" });
  const best = [];
  const all = [...listed, ...best];
  const found = all.find((f) => String(f.slug || "").toLowerCase() === slug) || all.find((f) => slugify(f.name || "") === slug);

  if (!found) {
    app.innerHTML = `${appStyles()}<div style="max-width:900px;margin:80px auto;color:#fff;padding:24px">Firm not found.</div>`;
    return;
  }
  document.title = `${found.name} Review, Rules, Payout & Discounts | Rank My Prop`;
  app.innerHTML = layout(found);
  const updatedElement = document.getElementById("rmpSeoUpdated");
  const updatedDate = new Date(found.updatedAt || 0);
  if (updatedElement && Number.isFinite(updatedDate.getTime()) && updatedDate.getTime() > 0) {
    updatedElement.hidden = false;
    updatedElement.innerHTML = `Last Updated: <span>${updatedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>`;
  }
  wireHeaderControls();
}

document.addEventListener("DOMContentLoaded", loadFirm);
