const words = ["ranked", "verified", "trusted"];
const rotateEl = document.getElementById("rotateWord");
let wordIndex = 0;

if (rotateEl) {
  setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    rotateEl.classList.remove("word-animate");
    void rotateEl.offsetWidth;
    rotateEl.textContent = words[wordIndex];
    rotateEl.classList.add("word-animate");
  }, 3000);
}

const offers = [
  { name: "TraderScale", rating: 4.4, discount: "15 OFF", code: "RMP", logo: "assets/traderscale-logo.webp", link: "/traderscaledetail" },
  { name: "QT Funded", rating: 1.0, discount: "50% OFF", code: "BOGO50", logo: "assets/qt-funded-logo.webp", link: "/offers/qt-funded" },
  { name: "FundedFun", rating: 0.0, discount: "35% OFF", code: "RMP", initials: "FF", link: "#" },
  { name: "Aqua funded", rating: 0.0, discount: "10% OFF", code: "RMP", logo: "assets/aqua-funded-logo.webp", link: "#" },
  { name: "Atlas Funded", rating: 4.1, discount: "50% OFF", code: "RMP", initials: "A", link: "#" },
  { name: "Sway Funded", rating: 0.0, discount: "20% OFF", code: "RMP", logo: "assets/sway-funded-logo.webp", link: "#" },
  { name: "ATF", rating: 4.5, discount: "0% OFF", code: "RMP", initials: "ATF", link: "#" },
  { name: "Top One Trader", rating: 0.0, discount: "15% OFF", code: "RMP", logo: "assets/top-one-trader-logo.webp", link: "#" },
  { name: "GFT", rating: 0.0, discount: "10% OFF", code: "RMP", logo: "assets/goat-funded-trader-logo.webp", link: "#" },
  { name: "FundedNext", rating: 4.3, discount: "12% OFF", code: "RMP", initials: "FN", link: "#" },
  { name: "Maven Trading", rating: 4.0, discount: "8% OFF", code: "RMP", initials: "MV", link: "#" },
  { name: "Blueberry Funded", rating: 3.8, discount: "40% OFF", code: "RMP", initials: "BB", link: "#" }
];

const futures = [
  { name: "TraderScale", rating: 4.4, discount: "15 OFF", code: "RMP", logo: "assets/traderscale-logo.webp", isNew: true, link: "/traderscaledetail" },
  { name: "QT Funded", rating: 1.0, discount: "50% OFF", code: "BOGO50", logo: "assets/qt-funded-logo.webp", link: "/offers/qt-funded" },
  { name: "FundedFun", rating: 0.0, discount: "35% OFF", code: "RMP", initials: "FF", link: "#" }
];

const state = { page: 0, pageSize: 9, timer: 0 };
const gridEl = document.getElementById("heroOffersGrid");
const dotsEl = document.getElementById("heroOffersDots");
const prevEl = document.getElementById("heroOffersPrev");
const nextEl = document.getElementById("heroOffersNext");
const futuresEl = document.getElementById("heroFuturesList");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function compactName(name, maxChars = 12) {
  const clean = String(name).trim().replace(/\s+/g, " ");
  if (clean.replace(/\s+/g, "").length <= maxChars) return clean;
  const parts = clean.split(" ");
  return parts.length > 1 ? `${parts.slice(0, -1).join(" ")} ${parts.at(-1).slice(0, 3)}...` : `${clean.slice(0, maxChars)}...`;
}

function logoMarkup(item, className) {
  return item.logo
    ? `<span class="${className}"><img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.name)} logo"></span>`
    : `<span class="${className}">${escapeHtml(item.initials || item.name.slice(0, 2).toUpperCase())}</span>`;
}

function ratingMarkup(rating, className) {
  return `<span class="${className}">${Number(rating).toFixed(1)} <em>★★★★★</em></span>`;
}

function dealMarkup(item, className) {
  return `<span class="${className} hero-copy-code" data-copy="${escapeHtml(item.code)}"><b>${escapeHtml(item.discount)}</b><span class="hero-copy-caption">${escapeHtml(item.code)}</span></span>`;
}

function renderDots(totalPages) {
  dotsEl.innerHTML = Array.from({ length: totalPages }, (_, index) =>
    `<button type="button" data-page="${index}" class="${index === state.page ? "is-on" : ""}" aria-label="Offer page ${index + 1}"></button>`
  ).join("");
}

function renderOffers(direction) {
  const totalPages = Math.max(1, Math.ceil(offers.length / state.pageSize));
  const pageOffers = offers.slice(state.page * state.pageSize, (state.page + 1) * state.pageSize);
  gridEl.dataset.count = String(pageOffers.length);
  gridEl.innerHTML = pageOffers.map((item) => `
    <a href="${escapeHtml(item.link)}" class="hero-offer-card">
      ${logoMarkup(item, "hero-offer-logo")}
      <span class="hero-offer-main">
        <span class="hero-offer-name" title="${escapeHtml(item.name)}">${escapeHtml(compactName(item.name))}</span>
        ${ratingMarkup(item.rating, "hero-offer-rate")}
      </span>
      ${dealMarkup(item, "hero-offer-deal")}
    </a>
  `).join("");

  if (direction) {
    gridEl.classList.remove("is-next", "is-prev");
    void gridEl.offsetWidth;
    gridEl.classList.add(direction === "prev" ? "is-prev" : "is-next");
    setTimeout(() => gridEl.classList.remove("is-next", "is-prev"), 520);
  }

  renderDots(totalPages);
  prevEl.disabled = totalPages <= 1;
  nextEl.disabled = totalPages <= 1;
}

function renderFutures() {
  futuresEl.innerHTML = futures.map((item) => `
    <a href="${escapeHtml(item.link)}" class="hero-future-card">
      ${logoMarkup(item, "hero-future-logo")}
      <span class="hero-future-main">
        <span class="hero-future-top">${item.isNew ? '<span class="hero-future-new">NEW</span>' : ""}<span class="hero-future-name" title="${escapeHtml(item.name)}">${escapeHtml(compactName(item.name))}</span></span>
        ${ratingMarkup(item.rating, "hero-future-rate")}
      </span>
      ${dealMarkup(item, "hero-future-deal")}
    </a>
  `).join("");
}

function changePage(nextPage, direction) {
  const totalPages = Math.max(1, Math.ceil(offers.length / state.pageSize));
  state.page = (nextPage + totalPages) % totalPages;
  renderOffers(direction);
  resetAutoPlay();
}

function resetAutoPlay() {
  clearInterval(state.timer);
  if (offers.length <= state.pageSize) return;
  state.timer = setInterval(() => changePage(state.page + 1, "next"), 20000);
}

async function hydrateCentralFirmLogos() {
  try {
    const { getAllOffers } = await import("/offers-service.js");
    const liveOffers = await getAllOffers();
    if (!Array.isArray(liveOffers) || !liveOffers.length) return;
    const normalized = liveOffers.map((item) => ({
      firmId: item.firmId || item.id || item.slug,
      name: item.name,
      rating: Number(item.rating || 0),
      discount: item.discount || "Offer",
      code: item.code || "RMP",
      logo: item.logoUrl || (/^(?:data:image\/|https?:\/\/|\/?assets\/)/i.test(String(item.logo || "")) ? item.logo : ""),
      initials: String(item.name || "RMP").split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase(),
      link: item.page || (item.slug ? `/offers/${item.slug}` : item.link || "#"),
      category: String(item.category || "forex").toLowerCase()
    })).filter((item) => item.firmId && item.name);
    if (!normalized.length) return;
    offers.splice(0, offers.length, ...normalized);
    const liveFutures = normalized.filter((item) => item.category === "futures").slice(0, 3);
    if (liveFutures.length) futures.splice(0, futures.length, ...liveFutures.map((item, index) => ({ ...item, isNew: index === 0 })));
    state.page = 0;
    renderOffers();
    renderFutures();
    resetAutoPlay();
  } catch (error) {
    console.warn("Central firm logos could not be loaded:", error?.message || error);
  }
}

async function copyCode(event) {
  const badge = event.target.closest(".hero-copy-code");
  if (!badge) return;
  event.preventDefault();
  event.stopPropagation();

  const value = badge.dataset.copy || "";
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  const caption = badge.querySelector(".hero-copy-caption");
  const original = caption.textContent;
  caption.textContent = "COPIED";
  badge.classList.add("is-copied");
  setTimeout(() => {
    caption.textContent = original;
    badge.classList.remove("is-copied");
  }, 1200);
}

prevEl.addEventListener("click", () => changePage(state.page - 1, "prev"));
nextEl.addEventListener("click", () => changePage(state.page + 1, "next"));
dotsEl.addEventListener("click", (event) => {
  const dot = event.target.closest("[data-page]");
  if (!dot) return;
  const page = Number(dot.dataset.page);
  if (page !== state.page) changePage(page, page > state.page ? "next" : "prev");
});
gridEl.addEventListener("click", copyCode);
futuresEl.addEventListener("click", copyCode);

renderOffers();
renderFutures();
resetAutoPlay();
hydrateCentralFirmLogos();
