import { getFirmsByType, slugify } from "./firms-service.js";

const SLOT_COUNT = 4;
const state = {
  firms: [],
  selected: Array(SLOT_COUNT).fill(""),
  activeSlots: 2,
  defaults: [],
};

const tableHead = document.getElementById("compareTableHead");
const tableBody = document.getElementById("compareTableBody");
const toast = document.getElementById("compareToast");
const colgroup = document.getElementById("compareColgroup");
const addFirmButton = document.getElementById("addFirm");
const activeFirmCount = document.getElementById("activeFirmCount");
const compareTable = document.querySelector(".compare-table");
const pickerDialog = document.getElementById("firmPickerDialog");
const pickerSearch = document.getElementById("firmPickerSearch");
const pickerList = document.getElementById("firmPickerList");
const compareTitle = document.getElementById("compareTitle");
const compareLead = document.getElementById("compareLead");
const compareHero = document.querySelector(".compare-hero");
const profileActions = document.getElementById("compareProfileActions");

const sections = [
  {
    title: "Funding Setup",
    rows: [
      { label: "Challenge Cost", hint: "lowest visible entry", value: (firm) => firstValue(firm, [["cardMetrics", "startingPrice"], ["evaluationPrograms", 0, "price"]], pair(firm.keyMetrics, ["starting price", "price", "challenge fee", "fee"])) },
      { label: "Account Range", hint: "available capital sizes", value: (firm) => firstValue(firm, [["evaluationPrograms", 0, "accountSize"], ["evaluationPrograms", 0, "allocation"]], pair(firm.keyMetrics, ["account size", "allocation", "max allocation"])) },
      { label: "Profit Share", hint: "trader payout split", value: (firm) => firstValue(firm, [["evaluationPrograms", 0, "profitSplit"]], pair(firm.keyMetrics, ["profit split"]), pair(firm.tradingConditions, ["profit split"])) },
      { label: "Growth Ceiling", hint: "maximum capital potential", value: (firm) => firstValue(firm, [["maxFundingLimit"]], pair(firm.keyMetrics, ["max funding", "max allocation", "allocation"]), pair(firm.stats, ["max funding", "allocation"])) },
      { label: "Program Types", hint: "evaluation models", value: programTypes },
      { label: "Market Coverage", hint: "tradable markets", value: (firm) => listValue(firm.markets || firm.tags) },
    ],
  },
  {
    title: "Rule Pressure",
    rows: [
      { label: "Daily Loss Guard", hint: "daily risk limit", value: (firm) => firstValue(firm, [["dailyDrawdown"]], pair(firm.tradingConditions, ["daily drawdown", "daily loss"]), pair(firm.keyMetrics, ["daily drawdown"])) },
      { label: "Overall Loss Guard", hint: "maximum account loss", value: (firm) => firstValue(firm, [["maxDrawdown"]], pair(firm.tradingConditions, ["max drawdown", "overall drawdown", "maximum drawdown"]), pair(firm.keyMetrics, ["max drawdown"])) },
      { label: "Profit Goal", hint: "target required to pass", value: (firm) => firstValue(firm, [["evaluationPrograms", 0, "profitTarget"]], pair(firm.tradingConditions, ["profit target", "target"])) },
      { label: "Minimum Trading Time", hint: "days before review", value: (firm) => firstValue(firm, [["cardMetrics", "minTradingDays"]], pair(firm.tradingConditions, ["minimum trading", "min trading"])) },
      { label: "News Trading", hint: "event rule stance", value: (firm) => firstValue(firm, [["cardMetrics", "newsTrading"]], pair(firm.tradingConditions, ["news trading", "news"])) },
      { label: "EA / Automation", hint: "bot policy", value: (firm) => firstValue(firm, [["cardMetrics", "eaAllowed"]], pair(firm.tradingConditions, ["ea", "bot", "automation"])) },
      { label: "Copy Trading", hint: "copy policy", value: (firm) => pair(firm.tradingConditions, ["copy trading", "copy"]) },
      { label: "Time Cap", hint: "challenge duration", value: (firm) => firstValue(firm, [["cardMetrics", "timeLimit"]], pair(firm.tradingConditions, ["time limit", "duration"])) },
    ],
  },
  {
    title: "Payout & Money Flow",
    rows: [
      { label: "Payout Rhythm", hint: "withdrawal frequency", value: (firm) => firstValue(firm, [["cardMetrics", "payoutCycle"]], pair(firm.keyMetrics, ["payout cycle", "payout frequency"]), pair(firm.tradingConditions, ["payout"])) },
      { label: "First Withdrawal", hint: "first eligible payout", value: (firm) => pair(firm.keyMetrics, ["first payout", "first withdrawal"]) || pair(firm.tradingConditions, ["first payout", "first withdrawal"]) },
      { label: "Refund Status", hint: "fee return rules", value: (firm) => pair(firm.keyMetrics, ["refundable", "refund"]) || pair(firm.tradingConditions, ["refundable", "refund"]) },
      { label: "Scaling Path", hint: "account growth model", value: (firm) => firstValue(firm, [["payoutModel"]], pair(firm.keyMetrics, ["scaling"]), pair(firm.tradingConditions, ["scaling"])) },
      { label: "Payment Rails", hint: "withdrawal methods", value: (firm) => listValue(firm.paymentMethods) },
    ],
  },
  {
    title: "Trust Signals",
    rows: [
      { label: "Rank My Prop Rating", hint: "current firm score", value: ratingValue, decorate: true },
      { label: "Trader Review Count", hint: "approved review volume", value: (firm) => countValue(firm.reviewCount) },
      { label: "Payout Assurance", hint: "verification status", value: (firm) => firm.payoutAssurance || firm.verified ? "Enabled" : "Not enabled", tone: (firm) => firm.payoutAssurance || firm.verified ? "good" : "muted" },
      { label: "Support Snapshot", hint: "service notes", value: (firm) => pair(firm.firmDetails, ["support", "customer"]) || firm.trustText },
      { label: "Rule Clarity", hint: "policy transparency", value: (firm) => firm.ruleModel || pair(firm.firmDetails, ["rules", "rule model"]) },
      { label: "Execution Notes", hint: "slippage and platform context", value: (firm) => pair(firm.tradingConditions, ["slippage", "execution"]) },
    ],
  },
  {
    title: "Firm Snapshot",
    rows: [
      { label: "Operating Base", hint: "registered or public location", value: (firm) => firstValue(firm, [["metaHeadquarters"], ["headquarters"], ["country"]], pair(firm.firmDetails, ["location", "country"])) },
      { label: "Started In", hint: "founded year", value: (firm) => firstValue(firm, [["metaFounded"], ["founded"]], pair(firm.firmDetails, ["founded", "year"])) },
      { label: "Leadership Note", hint: "public CEO or founder", value: (firm) => firstValue(firm, [["metaCeo"], ["ceo"]], pair(firm.firmDetails, ["ceo", "founder"])) },
      { label: "Platforms", hint: "trading terminals", value: (firm) => listValue(firm.platforms) },
      { label: "Restricted Regions", hint: "not available in", value: (firm) => listValue(firm.restrictedCountries) },
      { label: "Best Fit", hint: "trader profile", value: (firm) => firstValue(firm, [["finderPitch"], ["bio"], ["overviewShort"]], listValue(firm.finderStrategies)), profile: true },
    ],
  },
];

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function clean(value = "") {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getPath(object, path = []) {
  return path.reduce((current, key) => current == null ? "" : current[key], object);
}

function firstValue(firm, ...candidates) {
  for (const group of candidates) {
    const list = Array.isArray(group) && Array.isArray(group[0]) ? group : [group];
    for (const candidate of list) {
      const value = Array.isArray(candidate) ? getPath(firm, candidate) : candidate;
      const text = Array.isArray(value) ? listValue(value) : clean(value);
      if (text) return text;
    }
  }
  return "";
}

function pair(rows, aliases = []) {
  const list = Array.isArray(rows) ? rows : [];
  const keys = aliases.map((alias) => String(alias).toLowerCase());
  for (const row of list) {
    const label = String(row?.label || row?.name || row?.title || "").toLowerCase();
    if (!label || !keys.some((key) => label.includes(key))) continue;
    const value = clean(row?.value ?? row?.text ?? row?.description ?? "");
    if (value) return value;
  }
  return "";
}

function listValue(value) {
  if (!Array.isArray(value)) return clean(value);
  return value
    .map((item) => clean(item?.label || item?.name || item?.value || item))
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");
}

function programTypes(firm) {
  const programs = Array.isArray(firm.evaluationPrograms) ? firm.evaluationPrograms : [];
  const names = programs.map((program) => clean(program?.name || program?.type || program?.title)).filter(Boolean);
  if (names.length) return [...new Set(names)].slice(0, 4).join(", ");
  return listValue(firm.tabs) || clean(firm.ruleModel);
}

function ratingValue(firm) {
  const score = Number(firm.score || 0);
  return Number.isFinite(score) && score > 0 ? `${score.toFixed(1)} / 5` : "";
}

function countValue(value) {
  const count = Number(value || 0);
  return Number.isFinite(count) && count > 0 ? count.toLocaleString() : "";
}

function rootAsset(value = "") {
  const source = clean(value);
  if (!source || /^(https?:|data:|\/)/i.test(source)) return source;
  return `/${source.replace(/^\.\//, "")}`;
}

function initials(name = "RMP") {
  return String(name).split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 3).toUpperCase() || "RMP";
}

function firmLogo(firm, className) {
  const source = rootAsset(firm?.logo);
  const fallback = escapeHtml(initials(firm?.name));
  return `<span class="${className}">${source ? `<img src="${escapeHtml(source)}" alt="${escapeHtml(firm.name)} logo" loading="lazy" decoding="async"><span hidden>${fallback}</span>` : `<span>${fallback}</span>`}</span>`;
}

function firmBySlug(slug = "") {
  return state.firms.find((firm) => String(firm.slug || firm.id) === String(slug)) || null;
}

function selectedFirms() {
  return state.selected.slice(0, state.activeSlots).map(firmBySlug).filter(Boolean);
}

function toneClass(value = "", forced = "") {
  if (forced) return forced;
  const normalized = String(value).toLowerCase();
  if (/^(yes|allowed|enabled|available|verified|weekly|bi-weekly)/i.test(normalized)) return "good";
  if (/^(no|not|restricted|banned|unavailable)/i.test(normalized)) return "bad";
  return "";
}

function firmMeta(firm) {
  return [
    ratingValue(firm),
    countValue(firm.reviewCount) ? `${countValue(firm.reviewCount)} reviews` : "",
    listValue(firm.markets || firm.tags),
  ].filter(Boolean).join(" • ");
}

function bindLogoFallbacks(root = document) {
  root.querySelectorAll(".firm-head-logo img, .picker-logo img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
      image.nextElementSibling?.removeAttribute("hidden");
    }, { once: true });
  });
}

function optionsMarkup(currentSlug = "") {
  const selected = new Set(state.selected.slice(0, state.activeSlots).filter(Boolean));
  const orderedOptions = [...state.firms].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return orderedOptions.map((option) => {
    const value = String(option.slug || option.id);
    const disabled = selected.has(value) && value !== currentSlug ? " disabled" : "";
    return `<option value="${escapeHtml(value)}"${value === currentSlug ? " selected" : ""}${disabled}>${escapeHtml(option.name)}</option>`;
  }).join("");
}

function removeFirmAt(slot) {
  state.selected.splice(slot, 1);
  state.selected.push("");
  state.activeSlots = Math.max(2, state.activeSlots - 1);
  render();
  updateUrl();
}

function bindTableHeadControls() {
  tableHead.querySelectorAll("select[data-table-slot]").forEach((select) => {
    select.addEventListener("change", () => {
      const slot = Number(select.dataset.slot);
      state.selected[slot] = select.value;
      render();
      updateUrl();
    });
  });
  tableHead.querySelectorAll("[data-remove-slot]").forEach((button) => {
    button.addEventListener("click", () => removeFirmAt(Number(button.dataset.removeSlot)));
  });
}

function renderPickerList(query = "") {
  const selected = new Set(state.selected.slice(0, state.activeSlots).filter(Boolean));
  const searchText = String(query).trim().toLowerCase();
  const available = state.firms
    .filter((firm) => !selected.has(String(firm.slug || firm.id)))
    .filter((firm) => !searchText || [firm.name, firm.country, ...(firm.markets || []), ...(firm.tags || [])]
      .some((value) => String(value || "").toLowerCase().includes(searchText)))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  pickerList.innerHTML = available.length
    ? available.map((firm) => `
        <button class="picker-firm" type="button" data-firm-choice="${escapeHtml(firm.slug || firm.id)}">
          ${firmLogo(firm, "picker-logo")}
          <span><strong>${escapeHtml(firm.name)}</strong><small>${escapeHtml(firmMeta(firm) || firm.country || "Listed prop firm")}</small></span>
          <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10m-4-4 4 4-4 4"></path></svg>
        </button>`).join("")
    : `<p class="picker-empty">No available firm matched that search.</p>`;
  pickerList.querySelectorAll("[data-firm-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected[state.activeSlots] = button.dataset.firmChoice;
      state.activeSlots += 1;
      pickerDialog.close();
      render();
      updateUrl();
    });
  });
  bindLogoFallbacks(pickerList);
}

function renderTableHead() {
  const firms = selectedFirms();
  colgroup.innerHTML = `<col class="metric-width">${firms.map(() => `<col class="firm-width">`).join("")}`;
  tableHead.innerHTML = `
    <tr>
      <th class="metric-column"><div class="metric-head"><small>Comparison table</small><strong>What to compare</strong></div></th>
      ${firms.map((firm, index) => `
        <th>
          <div class="firm-column-head">
            <div class="firm-column-top">
              <span>Firm ${index + 1}</span>
              ${index >= 2 ? `<button type="button" data-remove-slot="${index}" aria-label="Remove ${escapeHtml(firm.name)}">Remove</button>` : ""}
            </div>
            <div class="firm-table-head">${firmLogo(firm, "firm-head-logo")}<div><strong>${escapeHtml(firm.name)}</strong><span>${escapeHtml(firmMeta(firm) || `Firm ${index + 1}`)}</span></div></div>
            <label class="table-firm-select">
              <span class="sr-only">Change firm ${index + 1}</span>
              <select data-table-slot="${index}" data-slot="${index}">${optionsMarkup(firm.slug || firm.id)}</select>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"></path></svg>
            </label>
          </div>
        </th>`).join("")}
    </tr>`;
  bindLogoFallbacks(tableHead);
  bindTableHeadControls();
}

function renderTableBody() {
  const firms = selectedFirms();
  if (!firms.length) {
    tableBody.innerHTML = `<tr><td colspan="2" class="compare-empty">Choose two prop firms above to start comparing.</td></tr>`;
    return;
  }

  tableBody.innerHTML = sections.map((section) => {
    const rows = section.rows.map((row) => {
      const cells = firms.map((firm) => {
        if (!firm) return `<td class="comparison-value"><span class="muted">—</span></td>`;
        const raw = clean(row.value(firm));
        const value = raw || "—";
        const forcedTone = typeof row.tone === "function" ? row.tone(firm) : "";
        const tone = raw ? toneClass(raw, forcedTone) : "muted";
        const valueMarkup = row.decorate && raw
          ? `<span class="rating-pill">${escapeHtml(value)}</span>`
          : `<span class="${tone}">${escapeHtml(value)}</span>`;
        return `<td class="comparison-value">${valueMarkup}</td>`;
      }).join("");
      return `<tr><th class="metric-column metric-label">${escapeHtml(row.label)}<small>${escapeHtml(row.hint)}</small></th>${cells}</tr>`;
    }).join("");
    return `<tr class="comparison-section"><th colspan="${firms.length + 1}">${escapeHtml(section.title)}</th></tr>${rows}`;
  }).join("");
}

function firmProfilePath(firm = {}) {
  const slug = slugify(firm.slug || firm.name || firm.id || "");
  return slug ? `/prop-firms/${encodeURIComponent(slug)}` : "/listedprop";
}

function renderProfileActions() {
  if (!profileActions) return;
  const firms = selectedFirms().filter(Boolean);
  profileActions.innerHTML = firms.map((firm) => `
    <a class="profile-link" href="${escapeHtml(firmProfilePath(firm))}">
      <span>View ${escapeHtml(firm.name)}</span>
      <strong>Firm profile <span aria-hidden="true">→</span></strong>
    </a>`).join("");
  profileActions.hidden = firms.length === 0;
}

function render() {
  const visibleFirms = selectedFirms().length;
  compareTable.style.setProperty("--visible-firms", String(Math.max(visibleFirms, 1)));
  profileActions?.style.setProperty("--visible-firms", String(Math.max(visibleFirms, 1)));
  activeFirmCount.textContent = String(visibleFirms);
  addFirmButton.hidden = state.activeSlots === SLOT_COUNT;
  addFirmButton.lastChild.textContent = state.activeSlots === 2 ? " Add third firm" : " Add fourth firm";
  renderTableHead();
  renderTableBody();
  renderProfileActions();
}

function validUrlSelection() {
  const params = new URLSearchParams(window.location.search);
  const parts = String(window.location.pathname || "").split("/").filter(Boolean);
  const pathSelection = parts[0] === "compare" && parts[1]
    ? decodeURIComponent(parts[1]).split("-vs-")
    : [];
  const redirectedSelection = String(params.get("comparison") || "")
    .split("-vs-")
    .filter(Boolean);
  const requested = (pathSelection.length
    ? pathSelection
    : redirectedSelection.length
      ? redirectedSelection
      : String(params.get("firms") || "").split(","))
    .map(slugify)
    .filter(Boolean);
  const unique = [...new Set(requested)];
  return unique.filter((slug) => state.firms.some((firm) => String(firm.slug || firm.id) === slug)).slice(0, SLOT_COUNT);
}

function setMeta(selector, value, attribute = "content") {
  document.querySelector(selector)?.setAttribute(attribute, value);
}

function publishedFactList(firms, getter, fallback = "not published") {
  return firms
    .map((firm) => `${firm.name}: ${clean(getter(firm)) || fallback}`)
    .join("; ");
}

function updateComparisonFaq(firms) {
  if (firms.length < 2) {
    window.__rmpCompareFaq = null;
    window.dispatchEvent(new CustomEvent("rmp:compare-updated"));
    return;
  }
  const names = firms.map((firm) => firm.name);
  const joined = names.join(" vs ");
  const ratings = publishedFactList(firms, (firm) => {
    const rating = ratingValue(firm);
    const reviews = countValue(firm.reviewCount);
    return [rating, reviews ? `${reviews} approved reviews` : ""].filter(Boolean).join(" from ");
  }, "rating not published");
  const prices = publishedFactList(firms, (firm) =>
    firstValue(firm, [["cardMetrics", "startingPrice"], ["evaluationPrograms", 0, "price"]], pair(firm.keyMetrics, ["starting price", "price", "challenge fee", "fee"]))
  );
  const payouts = publishedFactList(firms, (firm) =>
    firstValue(firm, [["cardMetrics", "payoutCycle"]], pair(firm.keyMetrics, ["payout cycle", "payout frequency"]), pair(firm.tradingConditions, ["payout"]))
  );
  const drawdowns = publishedFactList(firms, (firm) => {
    const daily = firstValue(firm, [["dailyDrawdown"]], pair(firm.tradingConditions, ["daily drawdown", "daily loss"]), pair(firm.keyMetrics, ["daily drawdown"]));
    const maximum = firstValue(firm, [["maxDrawdown"]], pair(firm.tradingConditions, ["max drawdown", "overall drawdown", "maximum drawdown"]), pair(firm.keyMetrics, ["max drawdown"]));
    return [daily ? `daily ${daily}` : "", maximum ? `maximum ${maximum}` : ""].filter(Boolean).join(", ");
  });
  const platforms = publishedFactList(firms, (firm) => listValue(firm.platforms));
  const markets = publishedFactList(firms, (firm) => listValue(firm.markets || firm.tags));

  window.__rmpCompareFaq = {
    label: "SELECTED FIRM COMPARISON",
    lead: "Questions about",
    trail: `${joined}.`,
    description: `Firm-specific answers using the currently published Rank My Prop records for ${names.join(", ")}.`,
    supportTitle: `Need help choosing between ${names[0]} and the alternatives?`,
    supportText: `Share the exact account sizes or programs you are considering at ${names.join(", ")} and we’ll help you check the differences.`,
    subject: `Help me compare ${joined}`,
    items: [
      { question: `How do ${joined} compare on Rank My Prop ratings?`, answer: ratings },
      { question: `What starting challenge prices are published for ${names.join(", ")}?`, answer: prices },
      { question: `How do the payout schedules compare?`, answer: payouts },
      { question: `What drawdown limits are currently shown?`, answer: drawdowns },
      { question: `Which trading platforms do these firms support?`, answer: platforms },
      { question: `Which markets are listed for these firms?`, answer: markets }
    ]
  };
  window.dispatchEvent(new CustomEvent("rmp:compare-updated"));
}

function updatePageContext(pathname) {
  const firms = selectedFirms();
  if (firms.length < 2) {
    compareHero?.classList.remove("is-loading");
    compareHero?.setAttribute("aria-busy", "false");
    return;
  }
  const names = firms.map((firm) => clean(firm.name));
  const comparisonName = names.join(" vs ");
  const title = `${comparisonName} Comparison | Rank My Prop`;
  const description = `Compare ${names.join(", ")} side by side across challenge costs, account sizes, drawdown rules, payout terms, platforms, trader reviews and trust signals.`;
  const canonical = `https://www.rankmyprop.in${pathname}`;

  compareTitle.classList.add("is-specific");
  compareTitle.innerHTML = `${escapeHtml(names[0])} <span>vs ${escapeHtml(names.slice(1).join(" vs "))}</span>`;
  compareLead.textContent = description;
  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:url"]', canonical);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);

  let schema = document.getElementById("dynamicCompareSchema");
  if (!schema) {
    schema = document.createElement("script");
    schema.id = "dynamicCompareSchema";
    schema.type = "application/ld+json";
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title.replace(" | Rank My Prop", ""),
    url: canonical,
    description,
    about: firms.map((firm) => ({ "@type": "Organization", name: firm.name, url: firm.website || undefined }))
  });
  updateComparisonFaq(firms);
  compareHero?.classList.remove("is-loading");
  compareHero?.setAttribute("aria-busy", "false");
}

function updateUrl() {
  const url = new URL(window.location.href);
  const selected = state.selected.slice(0, state.activeSlots).filter(Boolean);
  url.pathname = selected.length >= 2 ? `/compare/${selected.join("-vs-")}` : "/compare";
  url.searchParams.delete("firms");
  url.searchParams.delete("comparison");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  updatePageContext(url.pathname);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

document.getElementById("clearComparison").addEventListener("click", () => {
  state.selected = Array(SLOT_COUNT).fill("").map((_, index) => state.defaults[index] || "");
  state.activeSlots = 2;
  render();
  updateUrl();
  showToast("Comparison cleared");
});

addFirmButton.addEventListener("click", () => {
  if (state.activeSlots >= SLOT_COUNT) return;
  pickerSearch.value = "";
  renderPickerList();
  pickerDialog.showModal();
  window.requestAnimationFrame(() => pickerSearch.focus());
});

document.getElementById("closeFirmPicker").addEventListener("click", () => pickerDialog.close());
pickerSearch.addEventListener("input", () => renderPickerList(pickerSearch.value));
pickerDialog.addEventListener("click", (event) => {
  if (event.target === pickerDialog) pickerDialog.close();
});

document.getElementById("shareComparison").addEventListener("click", async () => {
  updateUrl();
  const shareData = {
    title: "Rank My Prop firm comparison",
    text: "Compare these prop firms side by side.",
    url: window.location.href,
  };
  try {
    if (navigator.share && window.matchMedia("(max-width: 760px)").matches) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    showToast("Comparison link copied");
  } catch (error) {
    if (error?.name !== "AbortError") showToast("Copy the current page URL to share");
  }
});

async function init() {
  try {
    const firms = await getFirmsByType("listed");
    state.firms = firms
      .filter((firm) => firm?.name)
      .map((firm) => ({ ...firm, slug: String(firm.slug || firm.id || slugify(firm.name)) }));
    const requested = validUrlSelection();
    const defaultSelection = state.firms.slice(0, 2).map((firm) => String(firm.slug || firm.id));
    state.defaults = defaultSelection;
    const initialSelection = requested.length ? [...requested] : [...defaultSelection];
    while (initialSelection.length < 2) {
      const fallback = defaultSelection.find((slug) => !initialSelection.includes(slug));
      if (!fallback) break;
      initialSelection.push(fallback);
    }
    state.activeSlots = Math.min(SLOT_COUNT, Math.max(2, initialSelection.length));
    state.selected = Array(SLOT_COUNT).fill("").map((_, index) => initialSelection[index] || "");
    render();
    updateUrl();
  } catch (error) {
    console.warn("Compare firm load failed", error);
    tableHead.innerHTML = "";
    tableBody.innerHTML = `<tr><td colspan="2" class="compare-empty">Firm data could not be loaded. Please refresh the page.</td></tr>`;
    compareHero?.classList.remove("is-loading");
    compareHero?.setAttribute("aria-busy", "false");
  }
}

init();
