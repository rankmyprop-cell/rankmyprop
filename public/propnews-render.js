import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./dashboard-common.js";
import { escapeHtml as esc, stripInline, formatInline } from "./text-format.js";

const featuredEl = document.getElementById("rmpFeatured");
const featuredDotsEl = document.getElementById("rmpFeaturedDots");
const featuredSection = document.querySelector("section.featured");
const gridEl = document.getElementById("rmpArticlesGrid");
const paginationEl = document.getElementById("rmpPagination");
const searchInput = document.getElementById("rmpSearchInput");
const categoryChips = document.getElementById("rmpCategoryChips");
const sortRow = document.getElementById("rmpSortRow");
const PAGE_SIZE = 12;

const HUBS = {
  "prop-news": {
    collection: "propNewsPosts",
    type: "prop-news",
    fallbackCategory: "Industry News",
    heroTitle: 'Latest <span class="grad">Insights</span> &amp; News',
    heroSub: "Stay updated with the latest trends and insights in prop trading"
  },
  "trading-guides": {
    collection: "tradingGuidesPosts",
    type: "trading-guides",
    fallbackCategory: "Trading Tips",
    heroTitle: 'Latest <span class="grad">Trading Guides</span>',
    heroSub: "Practical playbooks and frameworks for better trader execution"
  },
  "funding-strategies": {
    collection: "fundingStrategiesPosts",
    type: "funding-strategies",
    fallbackCategory: "Trading Tips",
    heroTitle: 'Latest <span class="grad">Funding Strategies</span>',
    heroSub: "Explore account growth, scaling, and funding strategy breakdowns"
  },
  "trading-psychology": {
    collection: "tradingPsychologyPosts",
    type: "trading-psychology",
    fallbackCategory: "Trading Tips",
    heroTitle: 'Latest <span class="grad">Trading Psychology</span>',
    heroSub: "Build discipline, consistency, and emotional control in trading"
  },
  "beginner-tutorials": {
    collection: "beginnerTutorialsPosts",
    type: "beginner-tutorials",
    fallbackCategory: "Trading Tips",
    heroTitle: 'Latest <span class="grad">Beginner Tutorials</span>',
    heroSub: "Step-by-step tutorials for new traders to start with clarity"
  }
};

const LEGACY_PROP_NEWS_POSTS = [
  ["blog-post-01", "Best Prop Firms for Beginners in 2026"],
  ["blog-post-02", "How Prop Firm Payout Verification Works"],
  ["blog-post-03", "Understanding Daily Drawdown Limits"],
  ["blog-post-04", "Propfirmrule"],
  ["blog-post-05", "Weekend Holding Rules Explained"],
  ["blog-post-06", "Prop Firm Discount Codes: How to Use Safely"],
  ["blog-post-07", "Best Prop Firms for Scalping Traders"],
  ["blog-post-08", "Best Prop Firms for Swing Traders"],
  ["blog-post-09", "Profit Split Models Compared"],
  ["blog-post-10", "News Trading Rules at Top Prop Firms"],
  ["blog-post-11", "How to Pass a Prop Firm Evaluation Faster"],
  ["blog-post-12", "Soft Breach vs Hard Breach Rules"],
  ["blog-post-13", "How Maximum Loss Rules Impact Position Size"],
  ["blog-post-14", "Top Mistakes That Fail Prop Firm Challenges"],
  ["blog-post-15", "How to Build a Funded Account Risk Plan"],
  ["blog-post-16", "Copy Trading Policies Across Prop Firms"],
  ["blog-post-17", "Do Prop Firms Allow Expert Advisors (EAs)?"],
  ["blog-post-18", "Best Funded Account Scaling Plans"],
  ["blog-post-19", "How to Compare Challenge Fees Properly"],
  ["blog-post-20", "Fastest Payout Prop Firms This Month"],
  ["blog-post-21", "Consistency Rules: What Traders Miss"],
  ["blog-post-22", "Broker Spreads and Their Impact on Challenges"],
  ["blog-post-23", "How Leverage Affects Challenge Success"],
  ["blog-post-24", "Best Prop Firms for Low Drawdown Traders"],
  ["blog-post-25", "Can You Hold Trades Over News Events?"],
  ["blog-post-26", "Payout Denial Red Flags to Avoid"],
  ["blog-post-27", "Regional Restrictions in Prop Trading"],
  ["blog-post-28", "How to Read Prop Firm Terms & Conditions"],
  ["blog-post-29", "Top Trader Habits for Long-Term Funding"],
  ["blog-post-30", "2026 Prop Firm Market Outlook"]
].map(([slug, title], index) => ({
  id: slug,
  slug,
  title,
  category: "Prop Firms",
  excerpt: "A practical Rank My Prop guide covering funded-account rules, payouts, risk limits, and trader-focused execution.",
  author: "Rank My Prop Editorial Team",
  readTime: 6 + (index % 7),
  views: 0,
  publishedAt: `2026-03-${String(index + 1).padStart(2, "0")}`,
  updatedAt: { seconds: 1772323200 + index * 86400 },
  isStaticExport: true
}));

function resolveHub() {
  const file = (window.location.pathname.split("/").pop() || "blog.html").toLowerCase();
  const byFile = {
    "blog.html": "prop-news",
    "prop-news.html": "prop-news",
    "trading-guides.html": "trading-guides",
    "funding-strategies.html": "funding-strategies",
    "trading-psychology.html": "trading-psychology",
    "beginner-tutorials.html": "beginner-tutorials"
  };
  const fromBody = String(document.body?.dataset?.rmpHub || "").trim().toLowerCase();
  const key = fromBody || byFile[file] || "prop-news";
  return HUBS[key] || HUBS["prop-news"];
}

const hub = resolveHub();

let allPosts = [];
let selectedCat = "all";
let selectedSort = "latest";
let featuredIdx = 0;
let featuredTimer = null;
let isWiping = false;
let currentPage = 1;

function applyHubHead() {
  const h1 = document.getElementById("rmpHubTitle");
  const sub = document.getElementById("rmpHubSub");
  if (h1 && hub.heroTitle) h1.innerHTML = hub.heroTitle;
  if (sub && hub.heroSub) sub.textContent = hub.heroSub;
}

function tsSeconds(p) {
  return p?.updatedAt?.seconds || p?.createdAt?.seconds || 0;
}

function byLatest(a, b) {
  return tsSeconds(b) - tsSeconds(a);
}

function byPopular(a, b) {
  const va = Number(a.views || a.viewCount || 0);
  const vb = Number(b.views || b.viewCount || 0);
  if (vb !== va) return vb - va;
  return byLatest(a, b);
}

function trendingScore(p) {
  const views = Number(p.views || p.viewCount || 0);
  const ageDays = Math.max(1, (Date.now() / 1000 - tsSeconds(p)) / 86400);
  return views / Math.pow(ageDays, 0.75);
}

function byTrending(a, b) {
  const sa = trendingScore(a);
  const sb = trendingScore(b);
  if (sb !== sa) return sb - sa;
  return byLatest(a, b);
}

function normalizeCat(cat) {
  const c = String(cat || "").trim();
  if (!c) return "Industry News";
  const map = {
    "Prop News": "Industry News",
    "News": "Industry News",
    "Industry": "Industry News",
    "Trading": "Trading Tips",
    "Tips": "Trading Tips",
    "Forex": "Trading Tips",
  };
  return map[c] || c;
}

function cleanExcerpt(raw = "") {
  const html = formatInline(String(raw || ""));
  return html.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1");
}

function postHref(p) {
  const slug = encodeURIComponent(String(p.slug || p.id || "").trim());
  if (p?.isStaticExport || /^blog-post-\d+$/i.test(decodeURIComponent(slug))) {
    return `/${slug}`;
  }
  const base = hub.type === "prop-news" ? "/news" : `/${hub.type}`;
  return hub.type === "prop-news"
    ? `/prop-news-post?type=prop-news&slug=${slug}`
    : `${base}/${slug}`;
}

function iconCardSvg() {
  return `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <rect x="10" y="10" width="44" height="44" rx="10" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <path d="M22 38c4-10 16-10 20 0" stroke="rgba(255,255,255,0.32)" stroke-width="2" stroke-linecap="round"/>
    <path d="M24 26h16" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function iconMediaSvg() {
  return `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M14 18h36v28H14V18Z" stroke="rgba(255,255,255,0.32)" stroke-width="2" />
    <path d="M20 40l10-10 6 6 8-8 6 6" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 26h.01" stroke="rgba(255,255,255,0.25)" stroke-width="5" stroke-linecap="round"/>
  </svg>`;
}

function iconClock() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z" stroke="currentColor" stroke-width="2"/><path d="M12 7v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function iconEye() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2"/></svg>`;
}

function iconArrow() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function postImage(post = {}) {
  return String(post.coverImage || post.thumbUrl || post.thumbnailUrl || post.thumbnail || post.cover || post.image || "").trim();
}

function renderFeatured(post) {
  if (!featuredEl) return;
  if (!post) {
    featuredEl.innerHTML = `<div style="grid-column:1/-1;padding:18px;color:#a0a7c2">No featured articles yet.</div>`;
    if (featuredDotsEl) featuredDotsEl.innerHTML = "";
    return;
  }

  const img = postImage(post);
  const cat = esc(normalizeCat(post.category));
  const title = esc(stripInline(post.title || "Untitled"));
  const excerptRaw = String(post.excerpt || post.summary || "");
  const excerpt = cleanExcerpt(excerptRaw) || esc("Stay updated with trader-first insights and the latest prop firm developments.");
  const minutes = Math.max(1, Number(post.readTime || 7));
  const views = Number(post.views || post.viewCount || 0);
  const author = esc(stripInline(post.author || post.byline || "Rank My Prop"));
  const date = esc(String(post.publishedAt || post.date || "").slice(0, 10));
  const initial = esc((author || "R").trim().slice(0, 1).toUpperCase());

  featuredEl.innerHTML = `
    <div class="featured-media">
      ${img ? `<img fetchpriority="low" src="${esc(img)}" alt="${title}" loading="lazy" decoding="async" width="1600" height="900">` : `<div class="ph">${iconMediaSvg()}</div>`}
    </div>
    <div class="featured-body">
      <div class="badge">${iconCardSvg().replace('aria-hidden="true"', 'aria-hidden="true" style="width:14px;height:14px"')}<span>${cat}</span></div>
      <div class="meta">
        <span>${iconClock()}<span>${minutes} min</span></span>
        <span>${iconEye()}<span>${views}</span></span>
      </div>
      <h3>${title}</h3>
      <p>${excerpt}</p>
      <div class="author-row">
        <div class="author">
          <div class="avatar">${initial}</div>
          <div>
            <div style="font-weight:800;font-size:12px">${author}</div>
            <small>${date || "Updated"}</small>
          </div>
        </div>
        <a class="cta" href="${postHref(post)}">Read Full Article ${iconArrow()}</a>
      </div>
    </div>
  `;
}

function showLoader() {
  const legacyLoader = document.getElementById("rmpLoader");
  if (legacyLoader) legacyLoader.style.display = "none";

  const line = (className = "") => `<span class="rmp-news-skeleton-line ${className}" aria-hidden="true"></span>`;
  if (featuredEl) {
    featuredEl.setAttribute("aria-busy", "true");
    featuredEl.innerHTML = `
      <div class="featured-media rmp-news-skeleton-media" aria-hidden="true"></div>
      <div class="featured-body rmp-news-skeleton-feature-copy" aria-hidden="true">
        ${line("is-badge")}
        <div class="rmp-news-skeleton-meta">${line("is-meta-short")}${line("is-meta")}</div>
        ${line("is-feature-title")}${line("is-feature-title-short")}
        ${line("is-copy")}${line("is-copy")}${line("is-copy-short")}
        <div class="rmp-news-skeleton-author">${line("is-avatar")}${line("is-author")}${line("is-button")}</div>
      </div>`;
  }
  if (featuredDotsEl) {
    featuredDotsEl.innerHTML = `<span class="rmp-news-skeleton-dot is-active"></span><span class="rmp-news-skeleton-dot"></span><span class="rmp-news-skeleton-dot"></span>`;
  }
  if (gridEl) {
    gridEl.setAttribute("aria-busy", "true");
    gridEl.innerHTML = Array.from({ length: 6 }, (_, index) => `
      <article class="card rmp-news-skeleton-card" aria-hidden="true" style="--rmp-skeleton-delay:${index * 65}ms">
        <div class="card-media rmp-news-skeleton-media"><span class="rmp-news-skeleton-pill"></span></div>
        <div class="card-body">
          <div class="rmp-news-skeleton-meta">${line("is-meta-short")}${line("is-meta")}</div>
          ${line("is-card-title")}${line("is-card-title-short")}
          ${line("is-copy")}${line("is-copy")}${line("is-copy-short")}
          <div class="rmp-news-skeleton-author">${line("is-avatar")}${line("is-author")}${line("is-more")}</div>
        </div>
      </article>`).join("");
  }
  if (paginationEl) paginationEl.innerHTML = "";
}

function hideLoader() {
  featuredEl?.removeAttribute("aria-busy");
  gridEl?.removeAttribute("aria-busy");
  const legacyLoader = document.getElementById("rmpLoader");
  if (legacyLoader) legacyLoader.style.display = "none";
}

function renderFeaturedDots(items) {
  if (!featuredDotsEl) return;
  featuredDotsEl.innerHTML = items
    .map((_, i) => `<button class="dot ${i === featuredIdx ? "active" : ""}" type="button" data-dot="${i}" aria-label="Featured ${i + 1}"></button>`)
    .join("");
  featuredDotsEl.querySelectorAll(".dot[data-dot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      featuredIdx = Number(btn.dataset.dot || 0);
      updateUI();
    });
  });
}

function cardHtml(post) {
  const img = postImage(post);
  const cat = esc(normalizeCat(post.category));
  const title = esc(stripInline(post.title || "Untitled"));
  const excerptRaw = String(post.excerpt || post.summary || "");
  const excerpt = cleanExcerpt(excerptRaw) || esc("Read the full article for a trader-first breakdown and actionable insights.");
  const minutes = Math.max(1, Number(post.readTime || 6));
  const views = Number(post.views || post.viewCount || 0);
  const author = esc(stripInline(post.author || post.byline || "Rank My Prop"));
  const date = esc(String(post.publishedAt || post.date || "").slice(0, 10));
  const initial = esc((author || "R").trim().slice(0, 1).toUpperCase());

  return `
    <a class="card" href="${postHref(post)}" data-cat="${esc(cat)}" data-title="${title}">
      <div class="card-media">
        ${img ? `<img fetchpriority="low" src="${esc(img)}" alt="${title}" loading="lazy" decoding="async" width="1600" height="900">` : `<div class="ph">${iconMediaSvg()}</div>`}
        <div class="card-top">
          <div class="pill">${iconCardSvg().replace('aria-hidden="true"', 'aria-hidden="true" style="width:14px;height:14px"')}<span>${cat}</span></div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span>${iconClock()}<span>${minutes} min</span></span>
          <span>${iconEye()}<span>${views}</span></span>
        </div>
        <div class="card-title">${title}</div>
        <p class="card-excerpt">${excerpt}</p>
        <div class="card-foot">
          <div class="by">
            <div class="avatar">${initial}</div>
            <div>
              <b>${author}</b>
              <small>${date || "Updated"}</small>
            </div>
          </div>
          <span class="more">Read More ${iconArrow()}</span>
        </div>
      </div>
    </a>
  `;
}

function activeTerm() {
  return String(searchInput?.value || "").trim().toLowerCase();
}

function filteredPosts() {
  const term = activeTerm();
  return allPosts.filter((p) => {
    const cat = normalizeCat(p.category);
    const okCat = selectedCat === "all" || cat === selectedCat;
    if (!okCat) return false;
    if (!term) return true;
    const hay = `${stripInline(p.title || "")} ${stripInline(p.excerpt || "")} ${stripInline(p.author || "")}`.toLowerCase();
    return hay.includes(term);
  });
}

function sortedPosts(items) {
  const rows = [...items];
  if (selectedSort === "popular") rows.sort(byPopular);
  else if (selectedSort === "trending") rows.sort(byTrending);
  else rows.sort(byLatest);
  return rows;
}

function getRequestedPage() {
  try {
    const raw = Number(new URLSearchParams(window.location.search).get("page") || 1);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  } catch (e) {
    return 1;
  }
}

function setPageInUrl(page) {
  try {
    const url = new URL(window.location.href);
    if (page <= 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(page));
    window.history.replaceState({}, "", url.toString());
  } catch (e) {
  }
}

function renderPagination(totalPages) {
  if (!paginationEl) return;
  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let html = `<button class="page-btn" type="button" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>Prev</button>`;
  for (let page = 1; page <= totalPages; page += 1) {
    html += `<button class="page-btn ${page === currentPage ? "active" : ""}" type="button" data-page="${page}">${page}</button>`;
  }
  html += `<button class="page-btn" type="button" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>Next</button>`;

  paginationEl.innerHTML = html;
}

function updateUI() {
  const items = sortedPosts(filteredPosts());
  const featuredTagged = items.filter((p) => p.featured === true);
  const featuredPool = (featuredTagged.length ? featuredTagged : items).slice(0, 5);
  if (featuredIdx >= featuredPool.length) featuredIdx = 0;

  renderFeatured(featuredPool[featuredIdx]);
  renderFeaturedDots(featuredPool);

  if (!gridEl) return;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const gridItems = items.slice(start, start + PAGE_SIZE);
  gridEl.innerHTML = gridItems.length
    ? gridItems.map((p) => cardHtml(p)).join("")
    : `<div style="grid-column:1/-1;padding:18px;color:#a0a7c2">No articles found.</div>`;
  renderPagination(totalPages);
  setPageInUrl(currentPage);
}

function stopFeaturedAutoplay() {
  if (featuredTimer) {
    clearInterval(featuredTimer);
    featuredTimer = null;
  }
}

function startFeaturedAutoplay() {
  stopFeaturedAutoplay();
  featuredTimer = setInterval(() => {
    if (document.hidden) return;
    const items = sortedPosts(filteredPosts());
    const featuredTagged = items.filter((p) => p.featured === true);
    const featuredPool = (featuredTagged.length ? featuredTagged : items).slice(0, 5);
    if (featuredPool.length <= 1) return;
    goToFeatured((featuredIdx + 1) % featuredPool.length);
    }, 5000);
  }

  function goToFeatured(nextIdx) {
  if (!featuredEl) return;
  if (isWiping) return;
  isWiping = true;
  featuredEl.classList.add("is-wiping");
  setTimeout(() => {
    featuredIdx = Number(nextIdx || 0);
    updateUI();
  }, 260);
  setTimeout(() => {
    featuredEl.classList.remove("is-wiping");
    isWiping = false;
  }, 720);
}

function wireControls() {
  categoryChips?.querySelectorAll(".chip[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCat = String(btn.dataset.cat || "all");
      categoryChips.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      featuredIdx = 0;
      currentPage = 1;
      updateUI();
      startFeaturedAutoplay();
    });
  });

  sortRow?.querySelectorAll(".sort-btn[data-sort]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSort = String(btn.dataset.sort || "latest");
      sortRow.querySelectorAll(".sort-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      featuredIdx = 0;
      currentPage = 1;
      updateUI();
      startFeaturedAutoplay();
    });
  });

  searchInput?.addEventListener("input", () => {
    featuredIdx = 0;
    currentPage = 1;
    updateUI();
    startFeaturedAutoplay();
  });

  paginationEl?.addEventListener("click", (event) => {
    const btn = event.target?.closest?.(".page-btn[data-page]");
    if (!btn || btn.disabled) return;
    const nextPage = Number(btn.dataset.page || 1);
    if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage === currentPage) return;
    currentPage = nextPage;
    updateUI();
    gridEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  featuredDotsEl?.addEventListener("click", () => startFeaturedAutoplay());

  if (featuredSection) {
    featuredSection.addEventListener("mouseenter", stopFeaturedAutoplay);
    featuredSection.addEventListener("mouseleave", startFeaturedAutoplay);
    featuredSection.addEventListener("focusin", stopFeaturedAutoplay);
    featuredSection.addEventListener("focusout", startFeaturedAutoplay);
  }
}

async function loadPublicNews() {
  try {
    applyHubHead();
    showLoader();
    currentPage = getRequestedPage();
    const readCollection = async (name) => {
      const snap = await getDocs(collection(db, name));
      const rows = [];
      snap.forEach((d) => {
        const v = d.data() || {};
        if (String(v.status || "draft") !== "published") return;
        if (v.active === false) return;
        rows.push({ id: d.id, ...v, slug: String(v.slug || d.id), category: normalizeCat(v.category) });
      });
      return rows;
    };

    let posts = [];
    let primaryError = null;

    try {
      posts = await readCollection(hub.collection);
    } catch (err) {
      primaryError = err;
      posts = [];
    }

    if (!posts.length && hub.collection !== "propNewsPosts") {
      try {
        const fallback = await readCollection("propNewsPosts");
        posts = fallback.map((p, idx) => ({
          ...p,
          id: `${hub.type}-${p.id || idx + 1}`,
          slug: String(p.slug || p.id || `legacy-${idx + 1}`).trim().toLowerCase(),
          category: normalizeCat(p.category || hub.fallbackCategory || "Trading Tips")
        }));
      } catch (err) {
        if (!primaryError) primaryError = err;
      }
    }

    if (!posts.length && primaryError) {
      console.warn("hub posts load fallback failed:", primaryError?.message || primaryError);
    }

    if (hub.type === "prop-news") {
      const existing = new Set(posts.map((post) => String(post.slug || post.id || "").trim().toLowerCase()));
      LEGACY_PROP_NEWS_POSTS.forEach((post) => {
        if (!existing.has(post.slug)) posts.push(post);
      });
    }

    allPosts = posts;
    wireControls();
    updateUI();
    startFeaturedAutoplay();
    hideLoader();
  } catch (err) {
    hideLoader();
    if (featuredEl) featuredEl.innerHTML = `<div style="grid-column:1/-1;padding:18px;color:#a0a7c2">Failed to load articles.</div>`;
    if (gridEl) gridEl.innerHTML = `<div style="grid-column:1/-1;padding:18px;color:#a0a7c2">Failed to load articles.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadPublicNews);
