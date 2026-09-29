import { getFirmsByType, slugify } from "./firms-service.js";
import { DEFAULT_BEST_FIRMS, DEFAULT_LISTED_FIRMS } from "./firms-data.js";

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[char]));
const clean = (value) => String(value ?? "").trim();
const published = (value) => clean(value) || "Not published";
const safeLink = (value = "") => {
  const href = clean(value);
  if (!href) return "#";
  if (/^(https?:\/\/|\/)/i.test(href)) return href;
  return `https://${href}`;
};
const assetUrl = (value = "") => {
  const source = clean(value);
  if (!source) return "";
  if (/^(https?:\/\/|\/|data:|blob:)/i.test(source)) return source;
  return `/${source.replace(/^\.?\//, "")}`;
};
const humanize = (value = "") => clean(value).replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const initials = (name = "") => clean(name).split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase() || "RMP";

function firmSlugFromLocation() {
  const parts = location.pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(location.search);
  return slugify(parts[0] === "prop-firm-rules" && parts[1] ? decodeURIComponent(parts[1]) : (params.get("firm") || ""));
}

function programSlugFromLocation() {
  const parts = location.pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(location.search);
  return slugify(parts[0] === "prop-firm-rules" && parts[2] ? decodeURIComponent(parts[2]) : (params.get("program") || ""));
}

async function loadAllFirms() {
  const listed = await getFirmsByType("listed", { surface: "rules" });
  const best = [];
  const fallbackLogos = new Map([...DEFAULT_LISTED_FIRMS, ...DEFAULT_BEST_FIRMS].map((firm) => [slugify(firm.slug || firm.name), firm.logo]));
  const firms = new Map();
  [...listed, ...best].forEach((firm) => {
    const key = slugify(firm.slug || firm.name || firm.id);
    if (!key) return;
    const current = firms.get(key);
    const weight = (row) => (row.rulesPanelData ? 4 : 0) + (row.challengesPanelData ? 3 : 0) + (row.logo ? 1 : 0);
    if (!current || weight(firm) >= weight(current)) firms.set(key, {
      ...current,
      ...firm,
      logo: clean(firm.logo) || clean(current?.logo) || clean(fallbackLogos.get(key)),
      slug: key,
    });
  });
  return [...firms.values()].sort((a, b) => Number(a.ranking || 9999) - Number(b.ranking || 9999) || a.name.localeCompare(b.name));
}

function logoMarkup(firm, className = "firm-logo") {
  const name = escapeHtml(firm.name);
  const logo = assetUrl(firm.logo);
  return `<span class="${className}">${logo ? `<img src="${escapeHtml(logo)}" alt="${name} logo" loading="lazy" onerror="this.parentElement.textContent='${escapeHtml(initials(firm.name))}'">` : escapeHtml(initials(firm.name))}</span>`;
}

function programRows(firm) {
  const sourceRules = firm.rulesPanelData?.programRules || {};
  const migratedModelSlugs = slugify(firm.slug || firm.name) === "finotive-funding"
    ? ["instant-standard", "1-step-challenge", "instant-lite"]
    : [];
  const savedModelSlugs = Array.isArray(firm.rulesPanelData?.modelSlugs) && firm.rulesPanelData.modelSlugs.length
    ? firm.rulesPanelData.modelSlugs.map(slugify)
    : (migratedModelSlugs.length ? migratedModelSlugs : Object.keys(sourceRules));
  const savedPrograms = savedModelSlugs.map((key) => [key, sourceRules[key]]).filter(([, value]) => value).map(([key, value]) => ({
    program: value?.program || value?.name || key,
    ...(value || {}),
  })).filter((program) => Boolean(slugify(programName(program))));
  // Once the admin has authored account-model blocks, they are the complete
  // public rulebook. Never mix historical evaluation/challenge defaults in.
  if (savedPrograms.length) return savedPrograms;
  const fromPanel = Array.isArray(firm.challengesPanelData?.programs) ? firm.challengesPanelData.programs : [];
  const fromEvaluation = Array.isArray(firm.evaluationPrograms) ? firm.evaluationPrograms : [];
  const rows = fromPanel.length ? fromPanel : fromEvaluation;
  return rows.length ? rows : [{ program: firm.ruleModel || "All published programs" }];
}

async function loadFirmForRoute(slug) {
  if (!slug) return null;
  try {
    const pathname = location.pathname.startsWith("/prop-firm-rules/") ? location.pathname : "/firm-rules";
    const search = location.pathname.startsWith("/prop-firm-rules/") ? location.search : `?firm=${encodeURIComponent(slug)}`;
    const response = await fetch(`/api/public-page-content?pathname=${encodeURIComponent(pathname)}&search=${encodeURIComponent(search)}&includeFirm=1`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    const payload = await response.json();
    if (response.ok && payload?.firm) return { ...payload.firm, slug: slugify(payload.firm.slug || slug) };
  } catch (_) {
    // The directory loader below remains a safe fallback if the fresh endpoint is unavailable.
  }
  return null;
}

function programRulesFor(firm, program) {
  const source = firm.rulesPanelData?.programRules;
  if (!source || typeof source !== "object") return null;
  const requestedSlug = programSlugFromLocation();
  const candidateNames = [
    requestedSlug,
    slugify(programName(program)),
  ].filter(Boolean);
  for (const [key, value] of Object.entries(source)) {
    const normalized = slugify(String(key || "")) || slugify(String(value?.slug || value?.program || value?.title || ""));
    if (candidateNames.includes(normalized)) return value;
  }
  return null;
}

function field(object, aliases) {
  if (!object || typeof object !== "object") return "";
  const normalized = new Map(Object.entries(object).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]));
  for (const alias of aliases) {
    const value = normalized.get(alias.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (value !== undefined && value !== null && clean(value)) return Array.isArray(value) ? value.join(", ") : clean(value);
  }
  return "";
}

function programName(program, index = 0) {
  return field(program, ["program", "name", "title", "challenge", "accountType", "model"]) || `Program ${index + 1}`;
}

function metricsFor(firm, program) {
  const savedRules = new Map((programRulesFor(firm, program)?.rules || []).map((rule) => [
    String(rule?.title || "").toLowerCase().replace(/[^a-z0-9]/g, ""), clean(rule?.text),
  ]));
  const saved = (...aliases) => {
    for (const alias of aliases) {
      const normalizedAlias = String(alias).toLowerCase().replace(/[^a-z0-9]/g, "");
      const value = savedRules.get(normalizedAlias);
      if (value) return value;
      for (const [key, candidate] of savedRules.entries()) {
        if (candidate && (key.endsWith(normalizedAlias) || key.includes(normalizedAlias))) return candidate;
      }
    }
    return "";
  };
  return [
    ["Profit target", saved("profit target") || field(program, ["target", "profitTarget", "phase1", "phaseOneTarget"]) || field(firm, ["profitTarget"]), "Evaluation objective"],
    ["Daily loss", saved("daily loss", "daily drawdown") || field(program, ["dailyLoss", "dailyDrawdown", "dailyLossLimit"]) || firm.dailyDrawdown, "Daily breach limit"],
    ["Max drawdown", saved("maximum drawdown", "max drawdown", "maximum overall loss", "overall loss", "maximum loss") || field(program, ["maxDrawdown", "overallDrawdown", "maximumLoss"]) || firm.maxDrawdown, "Overall loss limit"],
    ["Minimum days", saved("minimum trading days", "minimum days", "payout days", "funded payout days") || field(program, ["minimumDays", "minTradingDays", "tradingDays"]) || firm.cardMetrics?.minTradingDays, "Required activity"],
    ["Profit split", saved("profit split") || field(program, ["split", "profitSplit", "payoutSplit"]) || firm.payoutModel, "Trader share"],
    ["Time limit", saved("time limit", "trading period") || field(program, ["timeLimit", "duration", "challengeDuration"]) || firm.cardMetrics?.timeLimit, "Completion window"],
  ];
}

function cardMetric(firm, label) {
  const lower = label.toLowerCase();
  if (lower.includes("daily")) return firm.dailyDrawdown;
  if (lower.includes("max")) return firm.maxDrawdown;
  if (lower.includes("program")) return `${programRows(firm).length} option${programRows(firm).length === 1 ? "" : "s"}`;
  return "";
}

function programRuleRows(firm, program) {
  const rows = [];
  const add = (title, text) => {
    const value = clean(text);
    if (!value || value === "Not published" || value.toLowerCase() === "none") return;
    rows.push({ title: clean(title) || "Rule", text: value });
  };
  const programRuleSet = programRulesFor(firm, program);
  if (programRuleSet) {
    const saved = Array.isArray(programRuleSet.rules) ? programRuleSet.rules : [];
    saved.forEach((rule) => add(field(rule, ["title", "label", "name"]) || "Rule", field(rule, ["text", "value", "description"])));
    // Admin-written rules are authoritative for an account model. Do not mix
    // stale evaluation/default rows into a model that already has its rulebook.
    if (saved.length) return rows;
  }
  add("Profit target", field(program, ["target", "profitTarget", "phase1", "phaseOneTarget"]));
  add("Daily loss", field(program, ["dailyLoss", "dailyDrawdown", "dailyLossLimit"]) || firm.dailyDrawdown);
  add("Maximum drawdown", field(program, ["maxDrawdown", "overallDrawdown", "maximumLoss"]) || firm.maxDrawdown);
  add("Minimum trading days", field(program, ["minimumDays", "minTradingDays", "tradingDays"]) || firm.cardMetrics?.minTradingDays);
  add("Profit split", field(program, ["split", "profitSplit", "payoutSplit"]) || firm.payoutModel);
  add("Time limit", field(program, ["timeLimit", "duration", "challengeDuration"]) || firm.cardMetrics?.timeLimit);
  const features = Array.isArray(program?.features) ? program.features : [];
  features.forEach((feature) => {
    if (feature && typeof feature === "object") add(field(feature, ["title", "label", "name"]), field(feature, ["text", "value", "description"]));
    else {
      const [title, ...rest] = clean(feature).split(":");
      add(rest.length ? title : "Program condition", rest.length ? rest.join(":") : title);
    }
  });
  ruleSectionsFor(firm).forEach((section) => section.rules.forEach((rule) => {
    add(field(rule, ["title", "label", "name"]), field(rule, ["text", "value", "description"]));
  }));
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.title}|${row.text}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function firmRuleCategory(firm) {
  const text = JSON.stringify({
    rules: firm.rulesPanelData || {},
    conditions: firm.tradingConditions || [],
    platforms: firm.platforms || [],
  }).toLowerCase();
  return {
    key: Boolean(firm.dailyDrawdown || firm.maxDrawdown || programRuleRows(firm, programRows(firm)[0]).some((row) => /target|drawdown|loss/i.test(row.title))),
    updated: Boolean(firm.rulesPanelData && Object.keys(firm.rulesPanelData?.sections || {}).length),
    execution: /(expert advisor|\\bea\\b|copy trading|platform|metatrader|ctrader|tradelocker)/i.test(text),
  };
}

function firmCard(firm) {
  const programs = programRows(firm);
  const program = programs[0] || {};
  const preview = programRuleRows(firm, program).slice(0, 3);
  const score = Number(firm.score || 0);
  const encodedSlug = encodeURIComponent(firm.slug);
  return `
    <article class="rule-firm-card">
      <header class="rule-card-brand">
        ${logoMarkup(firm)}
        <div>
          <h3>${escapeHtml(firm.name)}</h3>
          <p>${score ? `${score.toFixed(1)} · ${Number(firm.reviewCount || 0).toLocaleString()} reviews` : "Independent rule profile"}</p>
        </div>
        <span>${programs.length} model${programs.length === 1 ? "" : "s"}</span>
      </header>
      <div class="rule-card-copy">
        <h3>${escapeHtml(firm.name)} rules at a glance</h3>
        <p>${escapeHtml(firm.overviewShort || `Review ${firm.name} challenge limits, execution permissions and account-specific conditions before purchasing.`)}</p>
      </div>
      <div class="rule-program-snapshot">
        <div class="rule-preview-program"><span>Featured model</span><strong>${escapeHtml(programName(program))}</strong></div>
        <small>${preview.length} of ${programRuleRows(firm, program).length || preview.length} published checks</small>
        <ul class="rule-preview-list">
          ${(preview.length ? preview : [{ title: "Published rulebook", text: "Open the dedicated page to review the currently available firm conditions." }]).map((row) => `<li><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.text)}</span></li>`).join("")}
        </ul>
      </div>
      <footer class="rule-preview-actions">
        <a class="read-rules" href="/firm-rules?firm=${encodedSlug}">Explore all models <span>→</span></a>
        ${firm.showReviews !== false ? `<a href="/prop-firms/${encodedSlug}/reviews">Reviews</a>` : ""}
        ${firm.showFirmProfile !== false ? `<a href="/prop-firms/${encodedSlug}">Firm profile</a>` : ""}
      </footer>
    </article>`;
}

function firmCardSkeleton() {
  return `<article class="rule-firm-card is-skeleton" aria-hidden="true">
    <div class="skeleton-brand"><i></i><span></span><b></b></div>
    <div class="skeleton-line is-wide"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-panel"><i></i><i></i><i></i></div>
    <div class="skeleton-actions"><i></i><i></i><i></i></div>
  </article>`;
}

function bindFaqList(list) {
  list?.querySelectorAll(".faq-item").forEach((item) => {
    item.querySelector("button")?.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");
      list.querySelectorAll(".faq-item").forEach((row) => {
        row.classList.remove("is-open");
        row.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        item.querySelector("button")?.setAttribute("aria-expanded", "true");
      }
    });
  });
}

async function initHub() {
  const grid = $("#rulesFirmGrid");
  const count = $("#rulesCount");
  const empty = $("#rulesEmpty");
  const search = $("#rulesSearch");
  const filters = $("#rulesFilters");
  const total = $("#rulesTotal");
  const pagination = $("#rulesPagination");
  const pageSize = 10;
  let page = 1;
  let activeFilter = "all";
  grid.innerHTML = Array.from({ length: pageSize }, firmCardSkeleton).join("");
  bindFaqList($("#hubFaqList"));
  const firms = await loadAllFirms();
  const render = () => {
    const query = clean(search.value).toLowerCase();
    const rows = firms.filter((firm) => {
      const matchesSearch = `${firm.name} ${firm.country} ${(firm.markets || []).join(" ")} ${JSON.stringify(firm.rulesPanelData || {})}`.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (activeFilter === "all") return true;
      return Boolean(firmRuleCategory(firm)[activeFilter]);
    });
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const visibleRows = rows.slice(start, start + pageSize);
    grid.innerHTML = visibleRows.map(firmCard).join("");
    grid.hidden = !rows.length;
    empty.hidden = Boolean(rows.length);
    count.textContent = rows.length
      ? `Showing ${start + 1}–${start + visibleRows.length} of ${rows.length} firm rulebooks`
      : "No firm rulebooks available";
    if (total) total.textContent = String(rows.length);
    if (pagination) {
      pagination.hidden = pages <= 1 || !rows.length;
      pagination.innerHTML = pages > 1 ? `
        <button type="button" data-rule-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Previous rulebook page">←</button>
        ${Array.from({ length: pages }, (_, index) => `<button type="button" data-rule-page="${index + 1}" class="${page === index + 1 ? "is-active" : ""}" aria-current="${page === index + 1 ? "page" : "false"}">${index + 1}</button>`).join("")}
        <button type="button" data-rule-page="${page + 1}" ${page === pages ? "disabled" : ""} aria-label="Next rulebook page">→</button>` : "";
    }
    grid.setAttribute("aria-busy", "false");
  };
  search.addEventListener("input", () => { page = 1; render(); });
  filters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rule-filter]");
    if (!button) return;
    activeFilter = button.dataset.ruleFilter || "all";
    page = 1;
    filters.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
  pagination?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rule-page]");
    if (!button || button.disabled) return;
    page = Number(button.dataset.rulePage) || 1;
    render();
    $(".rules-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#clearRulesSearch")?.addEventListener("click", () => { search.value = ""; page = 1; render(); search.focus(); });
  render();
}

function fallbackRuleSections(firm) {
  const conditions = Array.isArray(firm.tradingConditions) ? firm.tradingConditions : [];
  const leverage = Array.isArray(firm.leverageRows) ? firm.leverageRows : [];
  return [
    {
      title: "Loss limits",
      desc: "The account-level risk boundaries currently recorded for this firm.",
      rules: [
        { title: "Daily loss", text: published(firm.dailyDrawdown) },
        { title: "Maximum drawdown", text: published(firm.maxDrawdown) },
      ],
    },
    {
      title: "Trading conditions",
      desc: "Published operating conditions and platform restrictions.",
      rules: conditions.length
        ? conditions.slice(0, 8).map((row) => ({ title: field(row, ["label", "title", "name"]) || "Condition", text: field(row, ["value", "text", "description"]) || "Not published" }))
        : [{ title: "Conditions", text: "Detailed trading conditions are not present in the current firm record." }],
    },
    {
      title: "Account structure",
      desc: "Funding and evaluation information available in the directory.",
      rules: [
        { title: "Rule model", text: published(firm.ruleModel) },
        { title: "Maximum funding", text: published(firm.maxFundingLimit) },
        { title: "Payout model", text: published(firm.payoutModel) },
      ],
    },
    {
      title: "Markets and leverage",
      desc: "The instruments and leverage rows published for this listing.",
      rules: [
        { title: "Markets", text: published((firm.markets || []).join(", ")) },
        ...leverage.slice(0, 5).map((row) => ({ title: field(row, ["label", "asset", "market"]) || "Leverage", text: field(row, ["value", "leverage"]) || "Not published" })),
      ],
    },
  ];
}

function ruleSectionsFor(firm) {
  const source = firm.rulesPanelData?.sections;
  if (!source || typeof source !== "object") return fallbackRuleSections(firm);
  const sections = Object.entries(source).map(([key, section]) => ({
    key,
    title: clean(section?.title) || humanize(key),
    desc: clean(section?.desc || section?.description),
    rules: Array.isArray(section?.rules) ? section.rules : [],
  })).filter((section) => {
    const name = `${section.key} ${section.title}`.toLowerCase().trim();
    return !/(^|\s)trading(\s|$)/.test(name) && (section.title || section.rules.length);
  });
  return sections.length ? sections : fallbackRuleSections(firm);
}

function renderMetrics(firm, program) {
  $("#ruleMetricGrid").innerHTML = metricsFor(firm, program).map(([label, value, note]) => `
    <article class="rule-metric"><span>${escapeHtml(label)}</span><strong title="${escapeHtml(published(value))}">${escapeHtml(published(value))}</strong><small>${escapeHtml(note)}</small></article>
  `).join("");
}

function renderSections(firm, program) {
  const rows = programRuleRows(firm, program);
  const name = programName(program);
  $("#selectedProgramLabel").textContent = `${name} rule sheet`;
  $("#publishedRulesTitle").textContent = `${firm.name} · ${name}`;
  $("#publishedRulesDescription").textContent = `The published conditions below apply to the selected ${name} account record. Switch models above to compare the differences.`;
  $("#ruleSections").innerHTML = `
    <article class="model-rule-sheet">
      <div class="model-rule-sheet-head">
        <span>${escapeHtml(name.toUpperCase())}</span>
        <strong>${rows.length} published checks</strong>
      </div>
      <ul class="model-rule-list">
        ${(rows.length ? rows : [{ title: "Rule information", text: "Detailed conditions are not present in the current firm record." }]).map((row) => `
          <li><i></i><p><strong>${escapeHtml(row.title)}:</strong> ${escapeHtml(row.text)}</p></li>
        `).join("")}
      </ul>
    </article>`;
}

function renderFaq(firm, selectedProgram) {
  const name = firm.name;
  const program = programName(selectedProgram);
  const ruleRows = programRuleRows(firm, selectedProgram);
  const preferred = ["Profit target", "Daily loss", "Maximum drawdown", "Minimum trading days", "Profit split", "Time limit", "News Trading", "Expert Advisors", "Copy Trading"];
  const selected = preferred
    .map((title) => ruleRows.find((row) => row.title.toLowerCase() === title.toLowerCase()))
    .filter(Boolean);
  const accountLabel = /(challenge|account|program)/i.test(program) ? program : `${program} challenge`;
  ruleRows.forEach((row) => {
    if (selected.length < 6 && !selected.includes(row)) selected.push(row);
  });
  const rows = selected.slice(0, 6).map((row) => {
    const normalizedTitle = row.title.toLowerCase();
    const question = normalizedTitle.includes("profit target")
      ? `What is the profit target for ${name} ${accountLabel}?`
      : normalizedTitle.includes("daily loss")
        ? `How does the daily loss limit work on ${name} ${program}?`
        : normalizedTitle.includes("drawdown")
          ? `What is the maximum drawdown for ${name} ${program}?`
          : `What is the ${row.title} rule for ${name} ${program}?`;
    return [
      question,
      `For the ${program} account, the current published record states: ${row.text}. Confirm the calculation method, account stage and any exception in the official ${name} terms before trading.`,
    ];
  });
  if (!rows.length) {
    rows.push([
      `Which rules apply to the ${name} ${program} account?`,
      `The current record does not contain a complete program breakdown. Confirm the ${program} limits directly in the official ${name} rulebook before checkout.`,
    ]);
  }
  $("#firmFaqLabel").textContent = `${program.toUpperCase()} RULE FAQ`;
  $("#firmFaqTitle").innerHTML = `Questions about ${escapeHtml(name)}<br><em>${escapeHtml(program)} rules.</em>`;
  $("#firmFaqIntro").textContent = `Program-specific answers based on the published ${program} rule record. Switch account models above to update this section.`;
  $("#firmFaqSupportTitle").textContent = `Check the ${program} terms.`;
  $("#firmFaqSupportText").textContent = `${name} can use different limits across its account models. Verify that every value matches the ${program} option selected at checkout.`;
  $("#firmFaqList").innerHTML = rows.map(([question, answer], index) => `
    <article class="faq-item${index === 0 ? " is-open" : ""}">
      <button type="button" aria-expanded="${index === 0}" aria-controls="firmFaqAnswer${index}">
        <span class="faq-number">${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(question)}</strong>
        <span class="faq-toggle" aria-hidden="true"><i></i><i></i></span>
      </button>
      <div class="faq-answer" id="firmFaqAnswer${index}"><div><p>${escapeHtml(answer)}</p></div></div>
    </article>`).join("");
  bindFaqList($("#firmFaqList"));
  return rows;
}

function setMeta(firm, program, faqRows) {
  const model = programName(program);
  const modelSlug = slugify(model);
  const requestedProgramSlug = programSlugFromLocation();
  const hasProgramRoute = Boolean(requestedProgramSlug);
  const title = hasProgramRoute
    ? `${firm.name} ${model} Rules 2026 | Trading Rules & Requirements`
    : `${firm.name} Prop Firm Rules: Drawdown & Restrictions (2026) | Rank My Prop`;
  const description = hasProgramRoute
    ? `Check ${firm.name} ${model} rules for 2026, including profit targets, daily loss, maximum drawdown, minimum trading days, profit split, payouts, news trading and other requirements.`
    : `Check ${firm.name} rules for 2026, including daily loss, maximum drawdown, profit targets, payout terms and trading restrictions.`;
  const canonical = `https://www.rankmyprop.in/prop-firm-rules/${encodeURIComponent(firm.slug)}${hasProgramRoute ? `/${encodeURIComponent(requestedProgramSlug || modelSlug)}` : ""}`;
  document.title = title;
  [
    ["meta[name='description']", description],
    ["meta[property='og:title']", title],
    ["meta[property='og:description']", description],
    ["meta[property='og:url']", canonical],
    ["meta[name='twitter:title']", title],
    ["meta[name='twitter:description']", description],
  ].forEach(([selector, value]) => {
    let node = document.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      const match = selector.match(/\[(name|property)='([^']+)'\]/);
      if (match) node.setAttribute(match[1], match[2]);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
  });
  document.querySelector("link[rel='canonical']")?.setAttribute("href", canonical);
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.dataset.rulesSchema = "true";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: title, description, url: canonical, isPartOf: { "@type": "WebSite", name: "Rank My Prop", url: "https://www.rankmyprop.in/" }, about: { "@type": "Organization", name: firm.name } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.rankmyprop.in/" },
        { "@type": "ListItem", position: 2, name: "Prop Firm Rules", item: "https://www.rankmyprop.in/prop-firm-rules" },
        { "@type": "ListItem", position: 3, name: hasProgramRoute ? `${firm.name} ${model} Rules` : `${firm.name} Rules`, item: canonical },
      ] },
      { "@type": "FAQPage", mainEntity: faqRows.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    ],
  });
  document.head.appendChild(schema);
}

async function initFirm() {
  // The selected program controls this page's hero and metadata after the
  // route-specific SSR bootstrap has hydrated the initial document.
  document.documentElement.dataset.rmpDynamicRouteContent = "true";
  document.body.classList.add("is-rules-loading");
  $("#programTabs").innerHTML = Array.from({ length: 4 }, () => '<i class="program-tab-skeleton"></i>').join("");
  $("#ruleMetricGrid").innerHTML = Array.from({ length: 6 }, () => '<i class="rule-metric-skeleton"></i>').join("");
  $("#ruleSections").innerHTML = '<div class="rule-sheet-skeleton"><i></i><i></i><i></i><i></i></div>';
  const slug = firmSlugFromLocation();
  if (slug) {
    const temporaryName = humanize(slug);
    $("#firmRulesHeading").innerHTML = `${escapeHtml(temporaryName)} <span>Rules Explained</span>`;
    $("#firmRulesIntro").textContent = `Review ${temporaryName} challenge limits and trading conditions by account type.`;
  }
  const directFirm = await loadFirmForRoute(slug);
  const firms = directFirm ? [] : await loadAllFirms();
  const firm = directFirm || firms.find((row) => slugify(row.slug || row.name || row.id) === slug);
  if (!firm) {
    document.body.classList.remove("is-rules-loading");
    $("#firmRulesHeading").innerHTML = `Firm rulebook <span>not found</span>`;
    $("#firmRulesIntro").textContent = "This firm is not present in the current published directory.";
    $("#programWorkspace").innerHTML = `<div class="rules-empty"><h3>Choose another firm from the rules directory.</h3><a class="read-rules" href="/prop-firm-rules">Browse prop firm rules</a></div>`;
    return;
  }

  const logo = $("#firmRulesLogo");
  if (logo) {
    logo.classList.remove("is-loading");
    logo.setAttribute("aria-hidden", "false");
    logo.innerHTML = clean(firm.logo)
      ? `<img src="${escapeHtml(assetUrl(firm.logo))}" alt="${escapeHtml(firm.name)} logo" onerror="this.parentElement.textContent='${escapeHtml(initials(firm.name))}'">`
      : escapeHtml(initials(firm.name));
  }

  const official = $("#officialRulesLink");
  official.href = safeLink(firm.website || firm.buyLink || firm.detailsLink || `/prop-firms/${firm.slug}`);
  $("#firmFaqOfficialLink").href = official.href;

  const programs = programRows(firm);
  const firmDetailLink = $("#firmDetailLink");
  if (firmDetailLink) {
    firmDetailLink.href = `/prop-firms/${encodeURIComponent(firm.slug)}`;
    firmDetailLink.hidden = firm.showFirmProfile === false;
  }
  const routeProgram = programSlugFromLocation();
  const matchedIndex = programs.findIndex((program, index) => slugify(programName(program, index)) === routeProgram);
  let selectedIndex = matchedIndex >= 0 ? matchedIndex : 0;
  const renderProgram = ({ updateUrl = false } = {}) => {
    const selected = programs[selectedIndex];
    const model = programName(selected, selectedIndex);
    const modelSlug = slugify(model);
    if (updateUrl) {
      history.pushState({ program: modelSlug }, "", `/prop-firm-rules/${encodeURIComponent(firm.slug)}/${encodeURIComponent(modelSlug)}`);
    }
    document.querySelectorAll(".program-tab").forEach((button, index) => {
      button.classList.toggle("is-active", index === selectedIndex);
      button.setAttribute("aria-selected", String(index === selectedIndex));
    });
    const hasProgramRoute = Boolean(programSlugFromLocation());
    $("#programTitle").textContent = `${firm.name} ${model} conditions`;
    $("#firmRulesHeading").innerHTML = hasProgramRoute
      ? `${escapeHtml(firm.name)} ${escapeHtml(model)} Rules 2026: <span>Complete Trading Rules</span>`
      : `${escapeHtml(firm.name)} <span>${escapeHtml(model)} Rules</span>`;
    $("#firmRulesIntro").textContent = hasProgramRoute
      ? `Review the ${model} rules for ${firm.name}, including profit targets, daily loss limits, maximum drawdown, minimum trading days, profit split, trading restrictions, and payout conditions.`
      : `Review the ${model} rules for ${firm.name}, including profit targets, drawdown limits, trading permissions and payout conditions for this account model.`;
    renderMetrics(firm, selected);
    renderSections(firm, selected);
    const faqRows = renderFaq(firm, selected);
    document.querySelector("script[data-rules-schema]")?.remove();
    setMeta(firm, selected, faqRows);
  };
  $("#programTabs").innerHTML = programs.map((program, index) => `<button class="program-tab${index === selectedIndex ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === selectedIndex}" data-program-index="${index}">${escapeHtml(programName(program, index))}</button>`).join("");
  $("#programTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-program-index]");
    if (!button) return;
    selectedIndex = Number(button.dataset.programIndex) || 0;
    renderProgram({ updateUrl: true });
  });
  window.addEventListener("popstate", () => {
    const nextProgram = programSlugFromLocation();
    const nextIndex = programs.findIndex((program, index) => slugify(programName(program, index)) === nextProgram);
    selectedIndex = nextIndex >= 0 ? nextIndex : 0;
    renderProgram();
  });
  renderProgram();
  document.body.classList.remove("is-rules-loading");
}

const view = document.body.dataset.rulesView;
if (view === "hub") initHub().catch((error) => {
  console.error(error);
  $("#rulesCount").textContent = "Firm rules could not be loaded.";
  $("#rulesFirmGrid").setAttribute("aria-busy", "false");
});
if (view === "firm") initFirm().catch((error) => {
  console.error(error);
  $("#firmRulesIntro").textContent = "The published rule record could not be loaded. Please try again.";
});
