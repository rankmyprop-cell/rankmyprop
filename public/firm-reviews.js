import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc, collection, getFirestore, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { DEFAULT_LISTED_FIRMS } from "./firms-data.js";
import { listDocuments } from "./cloudflare-data.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const approvedStatuses = ["Approved", "approved", "Published", "published", "Publish", "publish"];
const qs = (id) => document.getElementById(id);
const slugify = (value = "") => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const assetUrl = (value = "") => {
  const source = String(value || "").trim();
  if (!source || /^(?:https?:\/\/|data:|blob:|\/)/i.test(source)) return source;
  return `/${source.replace(/^\.?\//, "")}`;
};

const params = new URLSearchParams(location.search);
const pathParts = location.pathname.split("/").filter(Boolean);
let activeSlug = slugify(params.get("slug") || (pathParts[0] === "prop-firms" ? pathParts[1] : ""));
if (activeSlug.endsWith("-review")) activeSlug = activeSlug.replace(/-review$/, "");
if (params.get("openReview") === "1") {
  const canonicalFirmSlug = activeSlug.replace(/-review$/, "");
  location.replace(`/reviews?openReview=1${canonicalFirmSlug ? `&firm=${encodeURIComponent(canonicalFirmSlug)}` : ""}`);
}
let activeFirm = null;
let firms = [];
let reviews = [];
let user = auth.currentUser;
let selectedRating = 5;
let currentReviewPage = 1;
const reviewsPerPage = 12;

function hydrateFirmIdentityImmediately() {
  const cachedKey = `rmp-firm-review:${activeSlug}`;
  let cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(cachedKey) || "null"); } catch (_) {}
  const fallback = DEFAULT_LISTED_FIRMS.find((firm) => {
    const detailSlug = slugify(String(firm.detailsLink || "").replace(/detail\.html.*$/i, ""));
    return [slugify(firm.name), detailSlug].includes(activeSlug);
  });
  const initial = cached || fallback;
  if (!initial) return;
  activeFirm = initial;
  renderFirm();
  if (initial.logo) {
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    preload.href = assetUrl(initial.logo);
    document.head.appendChild(preload);
  }
}

function timestampMs(value) {
  if (value?.toMillis) return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateLabel(value) {
  const ms = timestampMs(value);
  return ms ? new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Not yet recorded";
}

function relativeDate(value) {
  const ms = timestampMs(value);
  if (!ms) return "Recently";
  const days = Math.max(0, Math.floor((Date.now() - ms) / 86400000));
  if (days === 0) return "Today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 35) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  return dateLabel(value);
}

function stars(value) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

function reviewAspect(row = {}, key = "") {
  const aspects = row.aspectRatings && typeof row.aspectRatings === "object" ? row.aspectRatings : {};
  const values = {
    cs: [aspects.cs, aspects.customerService, row.cs, row.customerService],
    tc: [aspects.tc, aspects.tradingConditions, row.tc, row.tradingConditions],
    pp: [aspects.pp, aspects.payoutProcess, row.pp, row.payoutProcess]
  }[key] || [];
  const found = values.map(Number).find(Number.isFinite);
  return Math.max(0, Math.min(5, found ?? Number(row.rating || 0)));
}

function firstText(row = {}, keys = [], fallback = "Not provided") {
  for (const key of keys) {
    const value = row[key];
    if (Array.isArray(value) && value.length) return value.join(", ");
    if (String(value ?? "").trim()) return String(value).trim();
  }
  return fallback;
}

function setMessage(text = "", type = "") {
  const el = qs("formMessage");
  el.textContent = text;
  el.className = `form-message${type ? ` is-${type}` : ""}`;
}

function openLoginPopup() {
  qs("reviewLoginLink").href = `/login?next=${encodeURIComponent(`/prop-firms/${activeSlug}/reviews`)}`;
  qs("reviewLoginModal").hidden = false;
  document.body.classList.add("has-login-modal");
}

function closeLoginPopup() {
  qs("reviewLoginModal").hidden = true;
  document.body.classList.remove("has-login-modal");
}

function renderRatingPicker() {
  qs("ratingPicker").innerHTML = Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    return `<button type="button" class="${value <= selectedRating ? "is-active" : ""}" data-rating="${value}" aria-label="${value} star${value === 1 ? "" : "s"}">★</button>`;
  }).join("");
}

function reviewMatchesFirm(row = {}) {
  const candidates = [row.firmSlug, row.slug, row.firm, row.firmName].map(slugify).filter(Boolean);
  return candidates.includes(activeSlug);
}

async function loadFirms() {
  firms = (await listDocuments("firms", 500))
    .filter((firm) => firm.active !== false && firm.showReviews !== false && String(firm.publishState || "published").toLowerCase() === "published")
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
  if (activeSlug.endsWith("-review")) activeSlug = activeSlug.replace(/-review$/, "");
  const requestedSlug = Boolean(activeSlug);
  if (!activeSlug && firms.length) activeSlug = slugify(firms[0].slug || firms[0].id || firms[0].name);
  activeFirm = firms.find((firm) => [firm.slug || firm.id, firm.name].map(slugify).includes(activeSlug)) || (requestedSlug ? null : firms[0]) || null;
  if (activeFirm) activeSlug = slugify(activeFirm.slug || activeFirm.id || activeFirm.name);
  if (activeFirm) {
    try { sessionStorage.setItem(`rmp-firm-review:${activeSlug}`, JSON.stringify(activeFirm)); } catch (_) {}
  }
}

async function loadApprovedReviews() {
  const rows = await listDocuments("reviews", 2500);

  reviews = rows
    .filter(reviewMatchesFirm)
    .filter((row) => approvedStatuses.includes(String(row.status || "Approved")))
    .sort((a, b) => timestampMs(b.createdAt || b.updatedAt) - timestampMs(a.createdAt || a.updatedAt));
}

function renderFirm() {
  if (!activeFirm) {
    qs("firmName").textContent = "Prop Firm Reviews";
    return;
  }

  const name = String(activeFirm.name || activeFirm.id);
  const profile = activeFirm.teamReviewProfile || {};
  qs("firmName").textContent = name;
  qs("communityHeading").textContent = String(profile.communityHeading || `Trader reviews for ${name}`);
  qs("firmProfileLink").href = `/prop-firms/${encodeURIComponent(activeSlug)}`;
  qs("firmProfileLink").textContent = "View details";
  qs("firmProfileLink").hidden = activeFirm.showFirmProfile === false;
  const buyNowLink = qs("buyNowLink");
  if (activeFirm.buyLink) buyNowLink.href = activeFirm.buyLink;
  else buyNowLink.hidden = true;
  qs("formIntro").textContent = `Your ${name} review will be moderated before it appears publicly.`;
  qs("dedicatedReviewTitle").textContent = `${name} Reviews & Trader Experiences`;
  qs("dedicatedReviewDescription").textContent = `Read detailed, approved ${name} trader feedback covering account experience, challenge rules, customer support, trading conditions and payouts.`;
  qs("firmReviewFaqName").textContent = name;
  qs("firmReviewFaqLead").textContent = `Clear answers about ${name} review scores, trader proof, moderation and how community feedback should be interpreted.`;
  const logo = qs("firmLogo");
  if (activeFirm.logo) logo.innerHTML = `<img src="${escapeHtml(assetUrl(activeFirm.logo))}" alt="${escapeHtml(name)} logo" onerror="this.hidden=true;this.parentElement.textContent='${escapeHtml(name.split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase())}'">`;
  else logo.textContent = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();

  document.title = `${name} Reviews & Trader Ratings | Rank My Prop`;
  document.querySelector('meta[name="description"]').content = `Read approved ${name} reviews and trader ratings, or submit your own verified ${name} experience.`;
  const canonicalUrl = qs("canonicalUrl") || document.querySelector('link[rel="canonical"]');
  if (canonicalUrl) canonicalUrl.href = `https://www.rankmyprop.in/prop-firms/${activeSlug}/reviews`;
  renderFirmFaq(name);
}

function renderFirmFaq(name = "this firm") {
  const questions = [
    [`Are ${name} reviews verified?`, `Only approved community submissions appear on this page. Reviews are connected to user accounts and checked by moderation before publication.`],
    [`What do the ${name} category scores mean?`, `Customer Service, Trading Conditions and Payout Process scores come from the category ratings submitted by approved reviewers.`],
    [`How recent are ${name} reviews?`, `Each card shows its submission date, and this page is refreshed whenever a newly approved review becomes available.`],
    [`Can I submit proof with my ${name} review?`, `Yes. The Write a Review popup accepts screenshots, images and PDF proof files, subject to file-size and moderation rules.`],
    [`When will my ${name} review become public?`, `A submitted review starts as Pending and becomes public only after an administrator approves it.`]
  ];
  qs("firmReviewFaqList").innerHTML = questions.map(([question, answer], index) => `<article class="firm-review-faq-item${index === 0 ? " is-open" : ""}"><button type="button" aria-expanded="${index === 0 ? "true" : "false"}"><span class="firm-review-faq-number">${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(question)}</strong><span class="firm-review-faq-toggle"><i></i><i></i></span></button><div class="firm-review-faq-answer"><p>${escapeHtml(answer)}</p></div></article>`).join("");
}

function renderSummary() {
  const total = reviews.length;
  const average = total ? reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / total : 0;
  const canPublishRating = total >= 5;
  qs("averageRating").textContent = canPublishRating ? average.toFixed(1) : "—";
  qs("averageStars").textContent = canPublishRating ? stars(average) : "";
  qs("reviewCount").textContent = `${total.toLocaleString()} verified review${total === 1 ? "" : "s"}`;
  const newest = reviews[0]?.updatedAt || reviews[0]?.createdAt || activeFirm?.updatedAt || activeFirm?.createdAt;
  qs("dedicatedReviewUpdated").textContent = dateLabel(newest);
}

function renderReviewResearch() {
  const proofBacked = reviews.filter((row) => Array.isArray(row.proofUrls) && row.proofUrls.some(Boolean));
  const positive = reviews.map((row) => firstText(row, ["pros", "prosText", "reviewPros"], "")).find(Boolean);
  const concern = reviews.map((row) => firstText(row, ["cons", "consText", "reviewCons"], "")).find(Boolean);
  const newest = reviews[0]?.updatedAt || reviews[0]?.createdAt || activeFirm?.updatedAt || activeFirm?.createdAt;
  qs("reviewResearchCount").textContent = String(reviews.length);
  qs("reviewResearchProofCount").textContent = String(proofBacked.length);
  qs("reviewResearchUpdated").textContent = dateLabel(newest);
  qs("reviewResearchPositive").textContent = positive || "No approved positive detail yet.";
  qs("reviewResearchConcern").textContent = concern || "No approved concern detail yet.";
  qs("reviewResearchProfile").href = `/prop-firms/${encodeURIComponent(activeSlug)}`;
  qs("reviewResearchRules").href = `/prop-firm-rules/${encodeURIComponent(activeSlug)}`;
  const comparisonPartner = firms.find((firm) => slugify(firm.slug || firm.id || firm.name) !== activeSlug);
  if (comparisonPartner) {
    const partnerSlug = slugify(comparisonPartner.slug || comparisonPartner.id || comparisonPartner.name);
    qs("reviewResearchCompare").href = `/compare/${[activeSlug, partnerSlug].sort().join("-vs-")}`;
    qs("reviewResearchCompare").textContent = `Compare with ${comparisonPartner.name}`;
  }
}

function renderReviews() {
  const rating = Number(qs("ratingFilter").value || 0);
  const sort = qs("sortFilter").value;
  let rows = reviews.filter((row) => !rating || Math.round(Number(row.rating)) === rating);
  if (sort === "highest") rows = [...rows].sort((a, b) => Number(b.rating) - Number(a.rating));
  if (sort === "lowest") rows = [...rows].sort((a, b) => Number(a.rating) - Number(b.rating));
  const host = qs("reviewsList");
  const pagination = qs("reviewPagination");
  if (!rows.length) {
    host.innerHTML = `<div class="empty-state">${reviews.length ? "No reviews match this filter." : "No approved reviews yet. Be the first trader to share an experience."}</div>`;
    pagination.hidden = true;
    pagination.innerHTML = "";
    return;
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / reviewsPerPage));
  currentReviewPage = Math.min(currentReviewPage, pageCount);
  const start = (currentReviewPage - 1) * reviewsPerPage;
  const visibleRows = rows.slice(start, start + reviewsPerPage);
  host.innerHTML = visibleRows.map((row) => {
    const name = String(row.userName || row.reviewerName || row.authorName || row.displayName || "Anonymous Trader");
    const text = String(row.reviewText || row.review || row.text || "");
    const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const userPhoto = firstText(row, ["userPhoto", "profilePhoto", "profileImageData", "photoURL", "avatar"], "");
    const accountSize = firstText(row, ["accountSize", "accountBalance"]);
    const challenge = firstText(row, ["challengeType", "program"]);
    const payoutCount = Math.max(0, Number(row.payoutCount || 0));
    const fundingPeriod = firstText(row, ["fundingPeriod", "fundedPeriod", "timeToFund"]);
    const fundedWith = firstText(row, ["firmsFundedWith", "fundedFirmsCount"], "1");
    const pros = firstText(row, ["pros", "prosText", "reviewPros"]);
    const cons = firstText(row, ["cons", "consText", "reviewCons"]);
    const proofUrls = Array.isArray(row.proofUrls) ? row.proofUrls.filter(Boolean) : [];
    const cs = reviewAspect(row, "cs");
    const tc = reviewAspect(row, "tc");
    const pp = reviewAspect(row, "pp");
    const detailsId = `review-details-${escapeHtml(String(row.id || Math.random()).replace(/[^a-z0-9_-]/gi, ""))}`;
    return `<article class="review-card">
      <div class="review-card-head">
        <span class="review-avatar">${userPhoto ? `<img src="${escapeHtml(userPhoto)}" alt="${escapeHtml(name)} profile photo" loading="lazy" decoding="async" />` : escapeHtml(initials || "AT")}</span>
        <div class="review-author"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(row.country || "Trader")} &nbsp;•&nbsp; ${escapeHtml(dateLabel(row.createdAt || row.updatedAt))}</span></div>
        <div class="review-rating-badge"><strong>${Number(row.rating || 0).toFixed(1)}</strong><span class="review-rating" aria-label="${Number(row.rating || 0)} out of 5">${stars(row.rating)}</span></div>
      </div>
      <div class="review-overview-grid">
        <div class="review-facts">
          <div class="review-fact"><span>Account Balance</span><strong>${escapeHtml(accountSize)}</strong></div>
          <div class="review-fact"><span>Challenge Type</span><strong>${escapeHtml(challenge)}</strong></div>
          <div class="review-fact"><span>Got Payout</span><strong class="${payoutCount > 0 ? "yes" : ""}">${payoutCount > 0 ? "Yes" : "No"}</strong></div>
        </div>
        <div class="review-aspect-breakdown">
          ${[["Customer Service",cs],["Trading Conditions",tc],["Payout Process",pp]].map(([label,value]) => `<div class="aspect-score-row"><div><span>${label}</span><strong>${Number(value).toFixed(1)}</strong></div><span class="aspect-score-track"><i style="width:${Number(value) * 20}%"></i></span></div>`).join("")}
        </div>
      </div>
      <div class="review-card-actions"><button class="review-action" type="button" data-review-helpful>♡ Helpful <span>0</span></button><button class="review-action" type="button">⚑ Report</button><button class="review-action toggle" type="button" data-review-toggle="${detailsId}">Hide details</button></div>
      <div class="review-details" id="${detailsId}">
        <div class="review-detail-stat"><span>Funding Period</span><strong>${escapeHtml(fundingPeriod)}</strong></div>
        <div class="review-detail-stat"><span>Payout Count</span><strong>${payoutCount}</strong></div>
        <div class="review-detail-stat"><span>Firms Funded With</span><strong>${escapeHtml(fundedWith)}</strong></div>
        <div class="review-sentiments"><div class="review-sentiment"><span>What I Liked</span><p>${escapeHtml(pros)}</p></div><div class="review-sentiment"><span>Could Be Better</span><p>${escapeHtml(cons)}</p></div></div>
        ${proofUrls.length ? `<a class="review-proof-link" href="${escapeHtml(proofUrls[0])}" target="_blank" rel="noopener">View Proof</a>` : ""}
        <p class="review-body">${escapeHtml(text || "No written review was provided.")}</p>
      </div>
    </article>`;
  }).join("");
  pagination.hidden = pageCount <= 1;
  pagination.innerHTML = pageCount <= 1 ? "" : [
    `<button type="button" data-review-page="${currentReviewPage - 1}" ${currentReviewPage === 1 ? "disabled" : ""} aria-label="Previous review page">←</button>`,
    ...Array.from({ length: pageCount }, (_, index) => `<button type="button" class="${currentReviewPage === index + 1 ? "is-active" : ""}" data-review-page="${index + 1}" aria-label="Review page ${index + 1}">${index + 1}</button>`),
    `<button type="button" data-review-page="${currentReviewPage + 1}" ${currentReviewPage === pageCount ? "disabled" : ""} aria-label="Next review page">→</button>`
  ].join("");
}

async function refreshPage() {
  qs("reviewsList").setAttribute("aria-busy", "true");
  qs("reviewsList").innerHTML = Array.from({ length: 2 }, () => `<div class="review-skeleton-card" aria-hidden="true"><div class="review-skeleton-head"><span class="review-skeleton-avatar"></span><div class="review-skeleton-copy"><span class="review-skeleton-line"></span><span class="review-skeleton-line"></span></div></div><div class="review-skeleton-grid"><span class="review-skeleton-box"></span><span class="review-skeleton-box"></span></div></div>`).join("");
  await Promise.all([loadFirms(), loadApprovedReviews()]);
  if (activeSlug && !activeFirm) {
    location.replace("/404.html");
    return;
  }
  renderFirm();
  currentReviewPage = 1;
  renderSummary();
  renderReviewResearch();
  renderReviews();
  qs("reviewsList").removeAttribute("aria-busy");
}

async function submitReview(event) {
  event.preventDefault();
  if (!user) return openLoginPopup();
  if (!activeFirm) return setMessage("Please choose a firm first.", "error");
  const title = qs("reviewTitle").value.trim();
  const text = qs("reviewText").value.trim();
  if (title.length < 4 || text.length < 30) return setMessage("Please add a clear title and at least 30 characters in your review.", "error");
  const button = qs("submitReviewButton");
  button.disabled = true;
  button.textContent = "Submitting...";
  setMessage("");
  try {
    const displayName = String(user.displayName || user.email?.split("@")[0] || "Anonymous Trader").trim();
    const payload = {
      uid: user.uid, email: user.email || "", userName: displayName, userPhoto: user.photoURL || "",
      firm: String(activeFirm.name || activeFirm.id), firmName: String(activeFirm.name || activeFirm.id), firmSlug: activeSlug,
      reviewTitle: title, program: qs("reviewProgram").value, accountSize: qs("accountSize").value.trim(),
      rating: selectedRating, reviewText: text, recommend: qs("recommendFirm").checked,
      status: "Pending", source: "dedicated-firm-reviews", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db, "reviews"), payload);
    try {
      const { notifyReviewPending } = await import("./email-notify-client.js");
      await notifyReviewPending({ uid: user.uid, userEmail: user.email || "", reviewId: ref.id, status: "Pending", firm: payload.firm, rating: payload.rating, displayName });
    } catch (_) {}
    qs("reviewForm").reset();
    selectedRating = 5;
    renderRatingPicker();
    setMessage("Review submitted. It will appear here after admin approval.", "success");
  } catch (error) {
    setMessage(error?.message || "Review could not be submitted. Please try again.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Submit for Review";
  }
}

qs("ratingFilter").addEventListener("change", () => { currentReviewPage = 1; renderReviews(); });
qs("sortFilter").addEventListener("change", () => { currentReviewPage = 1; renderReviews(); });
qs("reviewPagination").addEventListener("click", (event) => {
  const button = event.target.closest("[data-review-page]");
  if (!button || button.disabled) return;
  currentReviewPage = Number(button.dataset.reviewPage || 1);
  renderReviews();
  qs("communityHeading").scrollIntoView({ behavior: "smooth", block: "start" });
});
qs("openDedicatedReview").addEventListener("click", () => {
  const modal = qs("dedicatedReviewModal");
  const frame = qs("dedicatedReviewFrame");
  frame.src = `/reviews?openReview=1&embeddedReview=1&firm=${encodeURIComponent(activeSlug)}`;
  modal.hidden = false;
  document.body.classList.add("has-dedicated-review-modal");
});
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.data?.type !== "rmp-review-modal-close") return;
  qs("dedicatedReviewModal").hidden = true;
  qs("dedicatedReviewFrame").removeAttribute("src");
  document.body.classList.remove("has-dedicated-review-modal");
});
qs("reviewsList").addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-review-toggle]");
  if (toggle) {
    const details = qs(toggle.dataset.reviewToggle);
    if (!details) return;
    details.hidden = !details.hidden;
    toggle.textContent = details.hidden ? "Show details" : "Hide details";
    return;
  }
  const helpful = event.target.closest("[data-review-helpful]");
  if (helpful && helpful.dataset.voted !== "1") {
    helpful.dataset.voted = "1";
    helpful.classList.add("is-active");
    helpful.querySelector("span").textContent = "1";
  }
});
qs("firmReviewFaqList").addEventListener("click", (event) => {
  const button = event.target.closest(".firm-review-faq-item > button");
  if (!button) return;
  const item = button.closest(".firm-review-faq-item");
  const open = !item.classList.contains("is-open");
  qs("firmReviewFaqList").querySelectorAll(".firm-review-faq-item").forEach((row) => {
    row.classList.remove("is-open");
    row.querySelector("button")?.setAttribute("aria-expanded", "false");
  });
  if (open) {
    item.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }
});
qs("ratingPicker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-rating]");
  if (!button) return;
  selectedRating = Number(button.dataset.rating || 5);
  renderRatingPicker();
});
qs("reviewForm").addEventListener("submit", submitReview);
document.querySelectorAll("[data-close-login-modal]").forEach((button) => button.addEventListener("click", closeLoginPopup));
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !qs("reviewLoginModal").hidden) closeLoginPopup(); });
onAuthStateChanged(auth, (nextUser) => {
  user = nextUser;
  qs("submitReviewButton").textContent = user ? "Submit for Review" : "Login to Write a Review";
});

renderRatingPicker();
hydrateFirmIdentityImmediately();
refreshPage().catch((error) => {
  qs("reviewsList").innerHTML = `<div class="empty-state">${escapeHtml(error?.message || "Reviews could not be loaded.")}</div>`;
});
