import { getAllOffers, getOfferPageContent } from "./offers-service.js";
import { DEFAULT_OFFERS } from "./offers-data.js";

const grid = document.getElementById("offersGrid");
const empty = document.getElementById("offersEmpty");
const search = document.getElementById("offerSearch");
const sort = document.getElementById("offerSort");
const filters = document.getElementById("offerFilters");
const count = document.getElementById("resultsCount");
const toast = document.getElementById("offerToast");
const pagination = document.getElementById("offersPagination");
const pageNumbers = document.getElementById("offerPageNumbers");
const previousPage = document.getElementById("offersPrev");
const nextPage = document.getElementById("offersNext");
const heroHeading = document.getElementById("offersHeading");
const heroParagraph = document.querySelector(".offers-hero-copy > p");
const heroUpdated = document.querySelector(".offers-updated span");

const state = {
  offers: [],
  query: "",
  filter: "all",
  sort: "recommended",
  page: 1,
  pageSize: 10,
  dedicatedSlug: "",
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function initials(name = "RMP") {
  return String(name).split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 3).toUpperCase() || "RMP";
}

function slugify(value = "") {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function dedicatedSlugFromLocation() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "offers" && parts[1]) return slugify(decodeURIComponent(parts[1]));
  const params = new URLSearchParams(window.location.search);
  return slugify(params.get("firm") || params.get("slug") || "");
}

function isPriorityOffer(offer = {}) {
  if (!state.dedicatedSlug) return false;
  return [offer.slug, offer.firmId, offer.id, offer.name].some((value) => slugify(value) === state.dedicatedSlug);
}

function dedicatedOfferUrl(offer = {}) {
  const slug = slugify(offer.slug || offer.firmId || offer.name || offer.id || "");
  return slug ? `/offers/${encodeURIComponent(slug)}` : "/offers";
}

function discountNumber(value = "") {
  const number = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function formatDiscount(value = "") {
  const raw = String(value).trim();
  if (!raw) return "Offer";
  return /^\d+(?:\.\d+)?$/.test(raw) ? `${raw}%` : raw;
}

function destination(offer = {}) {
  const url = String(offer.affiliateLink || offer.link || offer.buyLink || offer.website || "").trim();
  return /^(https?:\/\/|\/)/i.test(url) ? url : "#";
}

function starText(value = 0) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}

function normalizeFallback(offer, index) {
  return {
    ...offer,
    id: offer.id || offer.slug || `fallback-${index}`,
    ranking: Number(offer.ranking || offer.sortOrder || index + 1),
    affiliateLink: offer.affiliateLink || offer.link || "",
    exclusive: Boolean(offer.exclusive),
  };
}

function skeletonCard() {
  return `
    <article class="offer-card offer-card-skeleton" aria-hidden="true">
      <div class="offer-card-top">
        <div class="offer-identity">
          <span class="skeleton-block" style="width:58px;height:58px"></span>
          <div><span class="skeleton-block" style="width:70px;height:8px;margin-bottom:10px"></span><span class="skeleton-block" style="width:150px;height:18px"></span></div>
        </div>
        <span class="skeleton-block" style="width:65px;height:30px"></span>
      </div>
      <div class="offer-card-body">
        <span class="skeleton-block" style="width:130px;height:10px;margin-bottom:18px"></span>
        <span class="skeleton-block" style="height:10px;margin-bottom:8px"></span>
        <span class="skeleton-block" style="width:82%;height:10px;margin-bottom:24px"></span>
        <span class="skeleton-block" style="height:54px"></span>
      </div>
      <div class="offer-card-footer"><span class="skeleton-block" style="width:90px;height:9px"></span><span class="skeleton-block" style="width:112px;height:39px"></span></div>
    </article>`;
}

function offerCard(offer) {
  const name = String(offer.name || "Prop firm");
  const code = String(offer.code || "RMP").trim() || "RMP";
  const rating = Number(offer.rating || 0);
  const reviews = Math.max(0, Number(offer.reviews || 0));
  const logo = String(offer.logoUrl || offer.logo || "").trim();
  const href = destination(offer);
  const external = /^https?:\/\//i.test(href);
  const badge = offer.exclusive ? "Exclusive rate" : "Active promotion";
  const description = String(offer.description || `Current ${name} promotional pricing for eligible challenge accounts.`).trim();
  const detailsHref = dedicatedOfferUrl(offer);
  const priority = isPriorityOffer(offer);
  const ratingMarkup = rating > 0
    ? `<span class="stars" aria-label="${rating.toFixed(1)} out of 5">${starText(rating)}</span><strong>${rating.toFixed(1)}</strong><span>${reviews ? `${reviews.toLocaleString()} reviews` : "Rank My Prop rating"}</span>`
    : `<span class="stars" aria-hidden="true">☆☆☆☆☆</span><span>New listing</span>`;

  return `
    <article class="offer-card${offer.exclusive ? " is-exclusive" : ""}${priority ? " is-priority" : ""}" data-name="${escapeHtml(name)}">
      <div class="offer-card-top">
        <div class="offer-identity">
          <a class="offer-logo" href="${escapeHtml(detailsHref)}" aria-label="View ${escapeHtml(name)} discount page">
            ${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)} logo" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` : ""}
            <span${logo ? " hidden" : ""}>${escapeHtml(initials(name))}</span>
          </a>
          <div>
            <small><i></i>${escapeHtml(badge)}</small>
            <h3 title="${escapeHtml(name)}"><a class="offer-title-link" href="${escapeHtml(detailsHref)}">${escapeHtml(name)}</a></h3>
          </div>
        </div>
        <div class="offer-discount"><strong>${escapeHtml(formatDiscount(offer.discount))}</strong><span>saving</span></div>
      </div>
      <div class="offer-card-body">
        <div class="offer-rating">${ratingMarkup}</div>
        <p>${escapeHtml(description)}</p>
        <div class="offer-code-row">
          <span>Promo code</span>
          <code>${escapeHtml(code)}</code>
          <button class="copy-offer-code" type="button" data-code="${escapeHtml(code)}" aria-label="Copy promo code ${escapeHtml(code)}">
            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="6.5" y="6.5" width="9" height="9" rx="1.5"></rect><path d="M4 13.5H3.5A1.5 1.5 0 0 1 2 12V3.5A1.5 1.5 0 0 1 3.5 2H12a1.5 1.5 0 0 1 1.5 1.5V4"></path></svg>
            Copy
          </button>
        </div>
      </div>
      <footer class="offer-card-footer">
        <span>Check eligibility and final price on the firm site.</span>
        <a class="unlock-offer" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener sponsored"' : ""}>
          View offer
          <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4"></path></svg>
        </a>
      </footer>
    </article>`;
}

function filteredOffers() {
  const query = state.query.toLowerCase().trim();
  const rows = state.offers.filter((offer) => {
    const matchesQuery = !query || [offer.name, offer.code, offer.discount, offer.description]
      .some((value) => String(value || "").toLowerCase().includes(query));
    if (!matchesQuery) return false;
    if (state.filter === "exclusive") return offer.exclusive;
    if (state.filter === "big") return discountNumber(offer.discount) >= 25;
    if (state.filter === "rated") return Number(offer.rating || 0) >= 4.5;
    return true;
  });

  rows.sort((a, b) => {
    if (state.sort === "discount") return discountNumber(b.discount) - discountNumber(a.discount);
    if (state.sort === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
    if (state.sort === "name") return String(a.name).localeCompare(String(b.name));
    return Number(a.ranking || a.sortOrder || 999999) - Number(b.ranking || b.sortOrder || 999999);
  });
  if (state.dedicatedSlug) {
    rows.sort((a, b) => Number(isPriorityOffer(b)) - Number(isPriorityOffer(a)));
  }
  return rows;
}

function bindRenderedCards() {
  grid.querySelectorAll(".offer-logo img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
      image.nextElementSibling?.removeAttribute("hidden");
    }, { once: true });
  });
  grid.querySelectorAll(".copy-offer-code").forEach((button) => {
    button.addEventListener("click", () => copyCode(button.dataset.code || "RMP", button));
  });
}

function paginationItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const valid = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items = [];
  valid.forEach((page, index) => {
    if (index && page - valid[index - 1] > 1) items.push("…");
    items.push(page);
  });
  return items;
}

function renderPagination(totalPages) {
  pagination.hidden = totalPages <= 1;
  previousPage.disabled = state.page === 1;
  nextPage.disabled = state.page === totalPages;
  pageNumbers.innerHTML = paginationItems(state.page, totalPages).map((item) => {
    if (item === "…") return `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
    const active = item === state.page;
    return `<button type="button" data-page="${item}"${active ? ' class="is-active" aria-current="page"' : ""} aria-label="Offer page ${item}">${item}</button>`;
  }).join("");
}

function render() {
  const filteredRows = filteredOffers();
  const pinnedOffer = state.dedicatedSlug ? state.offers.find(isPriorityOffer) : null;
  const matchedRows = pinnedOffer ? filteredRows.filter((offer) => !isPriorityOffer(offer)) : filteredRows;
  const similarPageSize = pinnedOffer ? Math.max(1, state.pageSize - 1) : state.pageSize;
  const totalPages = Math.max(1, Math.ceil(matchedRows.length / similarPageSize));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const start = (state.page - 1) * similarPageSize;
  const rows = matchedRows.slice(start, start + similarPageSize);
  if (pinnedOffer) {
    grid.innerHTML = [
      offerCard(pinnedOffer),
      ...(rows.length ? [
        `<div class="similar-promotions-heading"><span>More current deals</span><h2>Similar promotions going on</h2></div>`,
        ...rows.map(offerCard),
      ] : []),
    ].join("");
  } else {
    grid.innerHTML = rows.map(offerCard).join("");
  }
  grid.hidden = !pinnedOffer && matchedRows.length === 0;
  empty.hidden = Boolean(pinnedOffer) || matchedRows.length !== 0;
  count.textContent = pinnedOffer
    ? (matchedRows.length
      ? `Featured ${pinnedOffer.name} offer · showing ${start + 1}–${start + rows.length} of ${matchedRows.length} similar offers`
      : `Featured ${pinnedOffer.name} offer`)
    : (matchedRows.length
      ? `Showing ${start + 1}–${start + rows.length} of ${matchedRows.length} offers`
      : "No offers available");
  grid.setAttribute("aria-busy", "false");
  renderPagination(totalPages);
  bindRenderedCards();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
}

async function copyCode(code, button) {
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const field = document.createElement("textarea");
    field.value = code;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
  const original = button.innerHTML;
  button.textContent = "Copied";
  showToast(`${code} copied — confirm it at checkout`);
  window.setTimeout(() => { button.innerHTML = original; }, 1500);
}

function updateStructuredData(offers) {
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Current prop firm offers",
    numberOfItems: offers.length,
    itemListElement: offers.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${offer.name} ${formatDiscount(offer.discount)} offer`,
      url: destination(offer),
    })),
  });
  document.head.appendChild(schema);
}

function setMeta(selector, content, attribute = "content") {
  const element = document.head.querySelector(selector);
  if (element && content) element.setAttribute(attribute, content);
}

function splitHeading(heading = "", firmName = "") {
  const clean = String(heading || "").trim();
  if (!clean) return { primary: firmName, accent: "Discount Code & Promo Offers" };
  if (firmName && clean.toLowerCase().startsWith(firmName.toLowerCase())) {
    return { primary: clean.slice(0, firmName.length), accent: clean.slice(firmName.length).trim() };
  }
  const words = clean.split(/\s+/);
  const splitAt = Math.max(1, Math.ceil(words.length * 0.42));
  return { primary: words.slice(0, splitAt).join(" "), accent: words.slice(splitAt).join(" ") };
}

function offerFaqItems(offer = {}) {
  const name = String(offer.name || "this prop firm").trim();
  const code = String(offer.code || "RMP").trim() || "RMP";
  const discount = formatDiscount(offer.discount);
  return [
    {
      question: `What is the current ${name} discount code?`,
      answer: `The offer currently listed by Rank My Prop uses code ${code}. Enter it exactly as shown at ${name} checkout and confirm the saving before payment.`,
    },
    {
      question: `How much can I save on ${name}?`,
      answer: `The featured ${name} promotion currently shows ${discount} saving. The final amount can depend on the selected challenge, account size, region and checkout terms.`,
    },
    {
      question: `How do I apply the ${name} promo code?`,
      answer: `Choose the eligible ${name} program, continue to checkout, enter ${code} in the promo-code field and verify that the price changes before completing payment.`,
    },
    {
      question: `Does the ${name} code work on every challenge?`,
      answer: `Not always. A promotion may exclude selected programs, upgrades or account sizes. Match the code to the exact ${name} challenge you intend to purchase.`,
    },
    {
      question: `How does Rank My Prop verify this ${name} offer?`,
      answer: `We publish the latest offer record available to this page, but promotions can change without notice. The live ${name} checkout price and official terms remain the final confirmation.`,
    },
  ];
}

function renderDedicatedFaq(offer = {}) {
  const section = document.getElementById("offerFirmFaq");
  if (!section || !state.dedicatedSlug) return [];
  const name = String(offer.name || state.dedicatedSlug.replace(/-/g, " ")).trim();
  const items = offerFaqItems(offer);
  section.hidden = false;
  section.innerHTML = `
    <div class="faq-ambient" aria-hidden="true"></div>
    <div class="faq-shell">
      <header class="faq-heading">
        <span>${escapeHtml(name.toUpperCase())} OFFER DESK</span>
        <h2 id="offerFirmFaqTitle">Questions to check<br><em>before using the ${escapeHtml(name)} offer.</em></h2>
        <p>Clear answers about the listed code, eligible accounts and checkout checks for the current ${escapeHtml(name)} promotion.</p>
      </header>
      <div class="faq-layout">
        <aside class="faq-support">
          <span class="faq-support-mark" aria-hidden="true"><img src="/assets/rankmyprop-header-logo.png" alt=""></span>
          <div>
            <small>OFFER CHECK</small>
            <h3>Confirm the final price.</h3>
            <p>Codes and eligible programs can change. Make sure the saving appears in the ${escapeHtml(name)} checkout total before paying.</p>
          </div>
          <a href="${escapeHtml(destination(offer))}" target="_blank" rel="noopener sponsored">
            Check ${escapeHtml(name)}
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h11M10.5 5l4 4-4 4"></path></svg>
          </a>
        </aside>
        <div class="faq-list">
          ${items.map((item, index) => {
            const open = index === 0;
            return `
              <article class="faq-item${open ? " is-open" : ""}">
                <button type="button" aria-expanded="${open}" aria-controls="offerFaqAnswer${index}">
                  <span class="faq-number">${String(index + 1).padStart(2, "0")}</span>
                  <strong>${escapeHtml(item.question)}</strong>
                  <span class="faq-toggle" aria-hidden="true"><i></i><i></i></span>
                </button>
                <div class="faq-answer" id="offerFaqAnswer${index}"><div><p>${escapeHtml(item.answer)}</p></div></div>
              </article>`;
          }).join("")}
        </div>
      </div>
    </div>`;
  section.querySelectorAll(".faq-item").forEach((item) => {
    item.querySelector("button")?.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");
      section.querySelectorAll(".faq-item").forEach((row) => {
        row.classList.remove("is-open");
        row.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        item.querySelector("button")?.setAttribute("aria-expanded", "true");
      }
    });
  });
  return items;
}

async function applyDedicatedPageContent(priorityOffer) {
  if (!state.dedicatedSlug || !priorityOffer) return;
  document.body.classList.add("is-dedicated-offer");

  const name = String(priorityOffer.name || state.dedicatedSlug.replace(/-/g, " ")).trim();
  const copy = await getOfferPageContent(state.dedicatedSlug, priorityOffer);
  const fallbackHeading = `${name} Discount Code & Promo Offers`;
  const heading = copy.heading || [copy.headingPrimary, copy.headingAccent].filter(Boolean).join(" ") || fallbackHeading;
  const parts = {
    ...splitHeading(heading, name),
    ...(copy.headingPrimary ? { primary: copy.headingPrimary } : {}),
    ...(copy.headingAccent ? { accent: copy.headingAccent } : {}),
  };
  const paragraph = copy.paragraph || `Get the latest ${name} discount code, current promotional savings and verified offer details. Copy the code, check eligibility and confirm the final price before checkout.`;
  const seoTitle = copy.seoTitle || `${name} Discount Code & Promo Offers 2026 | Rank My Prop`;
  const seoDescription = copy.seoDescription || `Find the latest ${name} discount code and active promo offers. Compare current savings, copy the code and verify the final challenge price before checkout.`;
  const canonical = `https://www.rankmyprop.in/offers/${encodeURIComponent(state.dedicatedSlug)}`;
  const faqItems = renderDedicatedFaq(priorityOffer);

  document.title = seoTitle;
  if (heroHeading) heroHeading.innerHTML = `${escapeHtml(parts.primary)}${parts.accent ? ` <span>${escapeHtml(parts.accent)}</span>` : ""}`;
  if (heroParagraph) heroParagraph.textContent = paragraph;
  if (heroUpdated) heroUpdated.textContent = copy.lastUpdatedLabel || new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  setMeta('meta[name="description"]', seoDescription);
  setMeta('meta[name="keywords"]', copy.seoKeywords);
  setMeta('link[rel="canonical"]', canonical, "href");
  setMeta('meta[property="og:title"]', seoTitle);
  setMeta('meta[property="og:description"]', seoDescription);
  setMeta('meta[property="og:url"]', canonical);
  setMeta('meta[name="twitter:title"]', seoTitle);
  setMeta('meta[name="twitter:description"]', seoDescription);

  const pageSchema = document.getElementById("offersPageSchema");
  if (pageSchema) {
    pageSchema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: heading,
          description: seoDescription,
          url: canonical,
          mainEntity: {
            "@type": "Offer",
            name: `${name} ${formatDiscount(priorityOffer.discount)} discount`,
            category: "Prop firm challenge discount",
            url: destination(priorityOffer),
            seller: { "@type": "Organization", name },
          },
          isPartOf: { "@type": "WebSite", name: "Rank My Prop", url: "https://www.rankmyprop.in/" },
        },
        {
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        },
      ],
    });
  }
}

function resetFilters() {
  state.query = "";
  state.filter = "all";
  state.sort = "recommended";
  state.page = 1;
  search.value = "";
  sort.value = "recommended";
  filters.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === "all"));
  render();
}

search.addEventListener("input", () => {
  state.query = search.value;
  state.page = 1;
  render();
});
sort.addEventListener("change", () => {
  state.sort = sort.value;
  state.page = 1;
  render();
});
filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  state.page = 1;
  filters.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
  render();
});
pagination.addEventListener("click", (event) => {
  const pageButton = event.target.closest("button[data-page]");
  if (pageButton) state.page = Number(pageButton.dataset.page);
  else if (event.target.closest("#offersPrev") && !previousPage.disabled) state.page -= 1;
  else if (event.target.closest("#offersNext") && !nextPage.disabled) state.page += 1;
  else return;
  render();
  document.querySelector(".offer-controls")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
});
document.getElementById("clearOfferFilters").addEventListener("click", resetFilters);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
});

grid.innerHTML = new Array(4).fill(0).map(skeletonCard).join("");

async function init() {
  state.dedicatedSlug = dedicatedSlugFromLocation();
  const liveOffers = await getAllOffers();
  state.offers = (liveOffers.length ? liveOffers : DEFAULT_OFFERS.map(normalizeFallback))
    .filter((offer) => offer.active !== false && offer.name && destination(offer) !== "#");
  const priorityOffer = state.offers.find(isPriorityOffer);
  if (state.dedicatedSlug && !priorityOffer) {
    document.body.classList.add("is-dedicated-offer", "has-missing-offer");
    if (heroHeading) heroHeading.innerHTML = `Offer <span>Not Found</span>`;
    if (heroParagraph) heroParagraph.textContent = "This firm does not currently have an active discount. Browse the available offers below.";
  } else {
    await applyDedicatedPageContent(priorityOffer);
  }
  updateStructuredData(state.offers);
  render();
}

init();
