import { getFirmsByType, slugify } from "./firms-service.js";
import { auth, db } from "./dashboard-common.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, limit, query, runTransaction, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (selector) => document.querySelector(selector);
const clean = (value) => String(value ?? "").trim();
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
const approvedStatuses = new Set(["approved", "published", "publish"]);
const pageSize = 10;
const cloudinaryCloudName = "do04yawk7";
const cloudinaryUploadPreset = "RANKMYPROP";
const aspectDefinitions = [
  { key: "cs", icon: "CS", label: "Customer Service" },
  { key: "tc", icon: "TC", label: "Trading Conditions" },
  { key: "pp", icon: "PP", label: "Payout Process" },
  { key: "oe", icon: "OE", label: "Overall Experience" }
];

let listedFirms = [];
let approvedReviews = [];
let tableRows = [];
let currentPage = 1;
let activeScope = "all";
let currentUser = auth.currentUser;
let authResolved = false;
let resolveAuthReady;
const authReady = new Promise((resolve) => { resolveAuthReady = resolve; });
let overallRating = 5;
let aspectRatings = { cs: 5, tc: 5, pp: 5, oe: 5 };
let proofFiles = [];
let ownReviews = [];
let likedFirmIds = new Set();

const assetUrl = (value = "") => {
  const source = clean(value);
  if (!source) return "";
  return /^(https?:\/\/|\/|data:|blob:)/i.test(source) ? source : `/${source.replace(/^\.?\//, "")}`;
};
const initials = (name = "") => clean(name).split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase() || "RMP";
const clampRating = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(5, number)) : fallback;
};
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const aspectValue = (review, key) => {
  const aspects = review.aspectRatings && typeof review.aspectRatings === "object" ? review.aspectRatings : {};
  const aliases = {
    cs: [aspects.cs, aspects.customerService, review.cs, review.customerService],
    tc: [aspects.tc, aspects.tradingConditions, review.tc, review.tradingConditions],
    pp: [aspects.pp, aspects.payoutProcess, review.pp, review.payoutProcess],
    oe: [aspects.oe, aspects.overallExperience, aspects.userFriendliness, review.oe, review.userFriendliness]
  };
  const found = aliases[key].map(Number).find(Number.isFinite);
  return clampRating(found, clampRating(review.rating));
};
const stars = (rating) => `${"★".repeat(Math.round(clampRating(rating)))}${"☆".repeat(5 - Math.round(clampRating(rating)))}`;
const scoreClass = (rating) => rating >= 4 ? "excellent" : rating >= 3.5 ? "average" : "low";
const logoMarkup = (firm) => {
  const logo = assetUrl(firm.logo);
  const name = escapeHtml(firm.name);
  return `<span class="table-logo">${logo ? `<img src="${escapeHtml(logo)}" alt="${name} logo" loading="lazy" onerror="this.parentElement.textContent='${escapeHtml(initials(firm.name))}'">` : escapeHtml(initials(firm.name))}</span>`;
};

async function loadApprovedReviews() {
  const rows = [];
  const seen = new Set();
  for (const status of ["Approved", "approved", "Published", "published", "Publish", "publish"]) {
    try {
      const snapshot = await getDocs(query(collection(db, "reviews"), where("status", "==", status), limit(2500)));
      snapshot.forEach((item) => {
        if (seen.has(item.id)) return;
        seen.add(item.id);
        rows.push({ id: item.id, ...item.data() });
      });
    } catch (_) {}
  }
  return rows.filter((review) => approvedStatuses.has(clean(review.status).toLowerCase()));
}

function buildTableRows() {
  tableRows = listedFirms.map((firm) => {
    const firmSlug = slugify(firm.slug || firm.name || firm.id);
    const firmNameSlug = slugify(firm.name);
    const reviews = approvedReviews.filter((review) => {
      const reviewSlug = slugify(review.firmSlug || review.firmName || review.firm || "");
      return reviewSlug === firmSlug || reviewSlug === firmNameSlug;
    });
    const rating = average(reviews.map((review) => clampRating(review.rating)).filter((value) => value > 0));
    return {
      ...firm,
      slug: firmSlug,
      reviews,
      reviewCount: reviews.length,
      rating,
      tc: average(reviews.map((review) => aspectValue(review, "tc"))),
      cs: average(reviews.map((review) => aspectValue(review, "cs"))),
      oe: average(reviews.map((review) => aspectValue(review, "oe"))),
      pp: average(reviews.map((review) => aspectValue(review, "pp"))),
      hasFunded: reviews.some((review) => /funded/i.test(`${review.program || ""} ${review.challengeType || ""}`) || Boolean(review.fundingPeriod)),
      hasPayout: reviews.some((review) => Number(review.payoutCount || 0) > 0)
    };
  });
  const maximum = Math.max(100, ...tableRows.map((row) => row.reviewCount));
  $("#minimumReviews").max = String(maximum);
}

function metricMarkup(value) {
  return `<span class="metric-badge ${scoreClass(value)}">${value.toFixed(1)}</span>`;
}

function rowMarkup(row, maximumReviews) {
  const countWidth = maximumReviews ? Math.max(0, Math.min(100, (row.reviewCount / maximumReviews) * 100)) : 0;
  const followers = Math.max(0, Number(row.followers || 0));
  const dedicatedSlug = encodeURIComponent(slugify(row.slug || row.name || row.id));
  const reviewHref = `/prop-firms/${dedicatedSlug}/reviews`;
  const detailHref = `/prop-firms/${dedicatedSlug}`;
  const liked = likedFirmIds.has(String(row.id));
  return `<tr>
    <td><div class="firm-cell">${logoMarkup(row)}<div class="firm-cell-copy"><strong>${escapeHtml(row.name)}${row.verified ? '<span class="verified-mark" title="Verified firm">✓</span>' : ""}</strong><button class="firm-followers${liked ? " is-liked" : ""}" type="button" data-like-firm="${escapeHtml(String(row.id))}" data-like-slug="${escapeHtml(row.slug)}" aria-label="${liked ? "You liked" : "Like"} ${escapeHtml(row.name)}">♥ <span>${followers.toLocaleString()}</span></button></div></div></td>
    <td><div class="reviews-number"><strong>${row.reviewCount.toLocaleString()}</strong><span class="review-meter"><i style="width:${countWidth}%"></i></span></div></td>
    <td>${metricMarkup(row.tc)}</td><td>${metricMarkup(row.cs)}</td><td>${metricMarkup(row.oe)}</td><td>${metricMarkup(row.pp)}</td>
    <td><span class="rank-score">${row.rating.toFixed(1)}</span><span class="rank-stars">${stars(row.rating)}</span></td>
    <td><div class="table-actions"><a class="view-reviews" href="${reviewHref}">View</a>${row.showFirmProfile !== false ? `<a href="${detailHref}">View Detail</a>` : ""}</div></td>
  </tr>`;
}

function skeletonRows(count = 8) {
  return Array.from({ length: count }, () => `<tr class="review-skeleton" aria-hidden="true"><td><span class="skeleton-logo"></span><span class="skeleton-line"></span></td><td><span class="skeleton-line"></span></td><td><span class="skeleton-line"></span></td><td><span class="skeleton-line"></span></td><td><span class="skeleton-line"></span></td><td><span class="skeleton-line"></span></td><td><span class="skeleton-line"></span></td><td><span class="skeleton-button"></span></td></tr>`).join("");
}

function showTableSkeleton() {
  $("#reviewTableBody").innerHTML = skeletonRows();
  $("#reviewsCount").textContent = "Loading live firm reviews…";
  $("#reviewsPagination").hidden = true;
}

function renderTable() {
  const search = clean($("#reviewsSearch").value).toLowerCase();
  const filter = $("#reviewFilter").value;
  const sort = $("#reviewSort").value;
  const minimum = Number($("#minimumReviews").value || 0);
  $("#minimumReviewsValue").textContent = minimum ? `${minimum}+` : "0";
  let rows = tableRows.filter((row) => {
    if (!`${row.name} ${row.country || ""}`.toLowerCase().includes(search)) return false;
    if (row.reviewCount < minimum) return false;
    if (filter === "rated" && !row.reviewCount) return false;
    if (filter === "excellent" && row.rating < 4) return false;
    if (filter === "new" && row.reviewCount) return false;
    if (activeScope === "funded" && !row.hasFunded) return false;
    if (activeScope === "paid" && !row.hasPayout) return false;
    return true;
  });
  if (sort === "reviews") rows.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating || a.name.localeCompare(b.name));
  if (sort === "rating") rows.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name));
  if (sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  currentPage = Math.min(currentPage, pages);
  const start = (currentPage - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);
  const maximumReviews = Math.max(1, ...tableRows.map((row) => row.reviewCount));
  $("#reviewTableBody").innerHTML = visible.map((row) => rowMarkup(row, maximumReviews)).join("");
  $("#reviewTableEmpty").hidden = Boolean(rows.length);
  $("#reviewsCount").textContent = rows.length ? `Showing ${start + 1}–${start + visible.length} of ${rows.length} reviewable prop firms` : "No reviewable firms found";
  const pagination = $("#reviewsPagination");
  pagination.hidden = pages <= 1;
  pagination.innerHTML = pages <= 1 ? "" : [
    `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>←</button>`,
    ...Array.from({ length: pages }, (_, index) => `<button type="button" class="${currentPage === index + 1 ? "is-active" : ""}" data-page="${index + 1}">${index + 1}</button>`),
    `<button type="button" data-page="${currentPage + 1}" ${currentPage === pages ? "disabled" : ""}>→</button>`
  ].join("");
}

function renderStarButtons(host, rating, aspectKey = "") {
  host.innerHTML = Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    const data = aspectKey ? `data-aspect-star="${value}" data-aspect="${aspectKey}"` : `data-overall-star="${value}"`;
    return `<button type="button" class="${value <= rating ? "is-active" : ""}" ${data} aria-label="${value} star${value === 1 ? "" : "s"}">★</button>`;
  }).join("");
}

function setOverallRating(value) {
  overallRating = Math.max(1, Math.min(5, Number(value) || 5));
  $("#reviewOverallRating").value = String(overallRating);
  renderStarButtons($("#overallRatingStars"), overallRating);
  $("#overallRatingLabel").textContent = ["", "Terrible", "Poor", "Average", "Good", "Excellent"][overallRating] + ` ${overallRating}/5`;
}

function renderAspectRatings() {
  const selected = selectedFirmDetails();
  const firm = listedFirms.find((row) => slugify(row.slug || row.name || row.id) === selected.slug);
  const selectedLogo = clean(firm?.logo || firm?.logoUrl);
  $("#aspectRatings").innerHTML = aspectDefinitions.map((aspect) => {
    const icon = selectedLogo
      ? `<img src="${escapeHtml(assetUrl(selectedLogo))}" alt="${escapeHtml(selected.name)} logo" />`
      : escapeHtml(initials(selected.name || "RM"));
    return `<article class="aspect-card"><span class="aspect-icon selected-firm-aspect" id="aspectIcon-${aspect.key}">${icon}</span><span>${aspect.label}</span><div class="aspect-stars" data-aspect-group="${aspect.key}"></div><small id="aspectValue-${aspect.key}">${aspectRatings[aspect.key]}/5</small></article>`;
  }).join("");
  aspectDefinitions.forEach((aspect) => renderStarButtons($(`[data-aspect-group="${aspect.key}"]`), aspectRatings[aspect.key], aspect.key));
}

function populateFirmOptions() {
  renderFirmPickerOptions();
}

function firmPickerLogoMarkup(firm = {}) {
  const name = clean(firm.name || "Other");
  const logo = clean(firm.logo || firm.logoUrl);
  return logo ? `<img src="${escapeHtml(assetUrl(logo))}" alt="" />` : escapeHtml(initials(name));
}

function renderFirmPickerOptions(search = "") {
  const queryText = clean(search).toLowerCase();
  const rows = listedFirms.filter((firm) => !queryText || clean(firm.name).toLowerCase().includes(queryText)).slice(0, 80);
  $("#reviewFirmMenu").innerHTML = [
    ...rows.map((firm) => {
      const value = slugify(firm.slug || firm.name || firm.id);
      return `<button type="button" class="firm-picker-option" data-firm-value="${escapeHtml(value)}" role="option"><span>${firmPickerLogoMarkup(firm)}</span><strong>${escapeHtml(firm.name)}</strong></button>`;
    }),
    ...(queryText ? [] : [`<button type="button" class="firm-picker-option" data-firm-value="__other__" role="option"><span>＋</span><strong>Other firm</strong></button>`])
  ].join("") || `<div class="firm-picker-empty">No matching firm found</div>`;
}

function syncFirmPicker(value = "") {
  const firm = listedFirms.find((row) => slugify(row.slug || row.name || row.id) === value);
  $("#reviewFirm").value = value;
  $("#reviewFirmSearch").value = value === "__other__" ? "Other firm" : clean(firm?.name);
  $("#reviewFirmLogo").innerHTML = value === "__other__" ? "＋" : firmPickerLogoMarkup(firm || { name: "RM" });
  const other = value === "__other__";
  $("#otherFirmField").hidden = !other;
  $("#otherFirmName").required = other;
  const selected = selectedFirmDetails();
  $("#recommendationTitle").textContent = `Would you recommend ${selected.name || "this firm"} to other traders?`;
  renderAspectRatings();
  updateMonthlyLimit();
}

function selectedFirmDetails() {
  const selected = $("#reviewFirm").value;
  if (selected === "__other__") {
    const name = clean($("#otherFirmName").value);
    return { name, slug: slugify(name), listed: false };
  }
  const firm = listedFirms.find((row) => slugify(row.slug || row.name || row.id) === selected);
  return firm ? { name: firm.name, slug: selected, listed: true } : { name: "", slug: "", listed: false };
}

async function loadOwnReviews() {
  ownReviews = [];
  if (!currentUser) return;
  try {
    const snapshot = await getDocs(query(collection(db, "reviews"), where("uid", "==", currentUser.uid), limit(500)));
    snapshot.forEach((item) => ownReviews.push({ id: item.id, ...item.data() }));
  } catch (_) {}
}

function reviewDateMs(value) {
  if (value?.toMillis) return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return Date.parse(String(value || "")) || 0;
}

function updateMonthlyLimit() {
  const firm = selectedFirmDetails();
  if (!firm.slug) return $("#monthlyReviewLimit").textContent = "Select a firm to see your monthly limit.";
  const now = new Date();
  const count = ownReviews.filter((review) => {
    const created = new Date(reviewDateMs(review.createdAt || review.updatedAt));
    return slugify(review.firmSlug || review.firmName || review.firm) === firm.slug && created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;
  $("#monthlyReviewLimit").textContent = `${count}/4 reviews this month for selected firm`;
}

function resetReviewForm() {
  $("#directoryReviewForm").reset();
  overallRating = 5;
  aspectRatings = { cs: 5, tc: 5, pp: 5, oe: 5 };
  proofFiles = [];
  setOverallRating(5);
  renderAspectRatings();
  syncFirmPicker("");
  $("#otherFirmField").hidden = true;
  $("#reviewRecommend").value = "yes";
  document.querySelectorAll("[data-recommend]").forEach((button) => button.classList.toggle("is-selected", button.dataset.recommend === "yes"));
  $("#reviewTitleCount").textContent = "0";
  $("#reviewTextCount").textContent = "0";
  $("#proofFileList").textContent = "No proof files added.";
  $("#directoryReviewMessage").textContent = "";
  $("#directoryReviewMessage").className = "directory-review-message";
  $("#monthlyReviewLimit").textContent = "Select a firm to see your monthly limit.";
}

async function openReviewModal(preselectedSlug = "") {
  if (!authResolved) await authReady;
  if (!currentUser) {
    const next = `reviews.html?openReview=1${preselectedSlug ? `&firm=${encodeURIComponent(preselectedSlug)}` : ""}`;
    location.assign(`/login?next=${encodeURIComponent(next)}`);
    return;
  }
  resetReviewForm();
  if (preselectedSlug && listedFirms.some((firm) => slugify(firm.slug || firm.name || firm.id) === preselectedSlug)) syncFirmPicker(preselectedSlug);
  $("#reviewModal").hidden = false;
  document.body.classList.add("review-modal-open");
  await loadOwnReviews();
  updateMonthlyLimit();
}

function closeReviewModal() {
  $("#reviewModal").hidden = true;
  document.body.classList.remove("review-modal-open");
  if (new URLSearchParams(location.search).get("embeddedReview") === "1" && window.parent !== window) {
    window.parent.postMessage({ type: "rmp-review-modal-close" }, location.origin);
  }
}

async function loadLikedFirms() {
  likedFirmIds = new Set();
  if (!currentUser) return;
  try {
    const snapshot = await getDocs(query(collection(db, "firmLikes"), where("uid", "==", currentUser.uid), limit(500)));
    snapshot.forEach((item) => likedFirmIds.add(String(item.data()?.firmId || "")));
  } catch (_) {}
}

async function likeFirm(firmId, firmSlug, button = null) {
  if (!authResolved) await authReady;
  if (!currentUser) {
    location.assign(`/login?next=${encodeURIComponent(`reviews.html?likeFirm=${firmSlug}`)}`);
    return;
  }
  if (likedFirmIds.has(firmId)) return;
  const row = tableRows.find((firm) => String(firm.id) === String(firmId));
  if (!row) return;
  if (button) button.disabled = true;
  try {
    const firmRef = doc(db, "firms", firmId);
    const likeRef = doc(db, "firmLikes", `${firmId}_${currentUser.uid}`);
    await runTransaction(db, async (transaction) => {
      const firmSnapshot = await transaction.get(firmRef);
      if (!firmSnapshot.exists()) return;
      const currentFollowers = Math.max(0, Math.round(Number(firmSnapshot.data()?.followers || 0)));
      transaction.set(likeRef, { uid: currentUser.uid, email: currentUser.email || "", firmSlug, firmId, createdAt: serverTimestamp() });
      transaction.update(firmRef, { followers: currentFollowers + 1 });
    });
    likedFirmIds.add(firmId);
    row.followers = Math.max(0, Math.round(Number(row.followers || 0))) + 1;
    renderTable();
  } catch (error) {
    if (button) {
      button.disabled = false;
      button.title = error?.message || "Like could not be saved.";
    }
  }
}

async function uploadProofFiles(files) {
  const urls = [];
  for (let index = 0; index < files.length; index += 1) {
    const data = new FormData();
    data.append("file", files[index]);
    data.append("upload_preset", cloudinaryUploadPreset);
    data.append("folder", "rmp/reviews");
    $("#directoryReviewMessage").textContent = `Uploading proof ${index + 1}/${files.length}…`;
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/auto/upload`, { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error?.message || "Proof upload failed.");
    urls.push(result.secure_url);
  }
  return urls;
}

async function submitReview(event) {
  event.preventDefault();
  const message = $("#directoryReviewMessage");
  const button = $("#submitDirectoryReview");
  const firm = selectedFirmDetails();
  const title = clean($("#reviewTitle").value);
  const text = clean($("#reviewText").value);
  const challengeType = clean($("#reviewChallengeType").value);
  if (!firm.name || !firm.slug) return showFormError("Please choose a firm or enter the Other firm name.");
  if (!challengeType || title.length < 4 || text.length < 30) return showFormError("Firm, challenge type, a clear title and at least 30 review characters are required.");
  const now = new Date();
  const monthlyCount = ownReviews.filter((review) => {
    const created = new Date(reviewDateMs(review.createdAt || review.updatedAt));
    return slugify(review.firmSlug || review.firmName || review.firm) === firm.slug && created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;
  if (monthlyCount >= 4) return showFormError("You have reached the limit of 4 reviews for this firm this month.");
  button.disabled = true;
  button.textContent = "Submitting…";
  message.className = "directory-review-message";
  try {
    const proofUrls = proofFiles.length ? await uploadProofFiles(proofFiles) : [];
    let userPhoto = clean(currentUser.photoURL);
    try {
      const profileSnapshot = await getDoc(doc(db, "users", currentUser.uid));
      const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
      userPhoto = clean(profile.profileImageData || profile.userPhoto || profile.photoURL || userPhoto);
    } catch (_) {}
    const reviewRef = await addDoc(collection(db, "reviews"), {
      uid: currentUser.uid,
      email: currentUser.email || "",
      userName: clean(currentUser.displayName) || clean(currentUser.email).split("@")[0] || "Anonymous Trader",
      userPhoto,
      firm: firm.name,
      firmName: firm.name,
      firmSlug: firm.slug,
      isListedFirm: firm.listed,
      rating: overallRating,
      fundingPeriod: $("#reviewFundingPeriod").value,
      program: challengeType,
      challengeType,
      accountSize: $("#reviewAccountSize").value,
      payoutCount: Math.max(0, Number($("#reviewPayoutCount").value || 0)),
      reviewTitle: title,
      reviewText: text,
      pros: clean($("#reviewPros").value).split(",").map(clean).filter(Boolean),
      cons: clean($("#reviewCons").value).split(",").map(clean).filter(Boolean),
      aspectRatings: { ...aspectRatings, customerService: aspectRatings.cs, tradingConditions: aspectRatings.tc, payoutProcess: aspectRatings.pp, overallExperience: aspectRatings.oe, userFriendliness: aspectRatings.oe },
      recommend: $("#reviewRecommend").value === "yes",
      proofUrls,
      status: "Pending",
      source: "reviews-directory-modal",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    try {
      const { notifyReviewPending } = await import("./email-notify-client.js");
      await notifyReviewPending({ uid: currentUser.uid, userEmail: currentUser.email || "", reviewId: reviewRef.id, status: "Pending", firm: firm.name, rating: overallRating, displayName: currentUser.displayName || "Trader" });
    } catch (_) {}
    message.textContent = "Review submitted successfully. It will go live after admin approval.";
    message.className = "directory-review-message is-success";
    button.textContent = "Submitted";
  } catch (error) {
    showFormError(error?.message || "Review could not be submitted. Please try again.");
    button.disabled = false;
    button.textContent = "Submit Review";
  }
}

function showFormError(text) {
  $("#directoryReviewMessage").textContent = text;
  $("#directoryReviewMessage").className = "directory-review-message is-error";
}

function bindEvents() {
  ["#reviewsSearch", "#reviewFilter", "#reviewSort", "#minimumReviews"].forEach((selector) => $(selector).addEventListener(selector === "#reviewsSearch" || selector === "#minimumReviews" ? "input" : "change", () => { currentPage = 1; renderTable(); }));
  $("#reviewPills").addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-scope]");
    if (!button) return;
    activeScope = button.dataset.reviewScope;
    currentPage = 1;
    document.querySelectorAll("[data-review-scope]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderTable();
  });
  $("#reviewsPagination").addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page || 1);
    renderTable();
    $(".review-directory").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#reviewTableBody").addEventListener("click", (event) => {
    const button = event.target.closest("[data-like-firm]");
    if (!button) return;
    likeFirm(String(button.dataset.likeFirm || ""), String(button.dataset.likeSlug || ""), button);
  });
  $("#openReviewModal").addEventListener("click", () => openReviewModal());
  $("#reviewsStaticFaqList")?.addEventListener("click", (event) => {
    const button = event.target.closest(".faq-item > button");
    if (!button) return;
    const list = $("#reviewsStaticFaqList");
    const selectedItem = button.closest(".faq-item");
    const shouldOpen = !selectedItem.classList.contains("is-open");
    list.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.remove("is-open");
      item.querySelector(":scope > button")?.setAttribute("aria-expanded", "false");
    });
    if (shouldOpen) {
      selectedItem.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
  document.querySelectorAll("[data-close-review]").forEach((button) => button.addEventListener("click", closeReviewModal));
  $("#reviewFirmSearch").addEventListener("focus", () => {
    renderFirmPickerOptions($("#reviewFirmSearch").value);
    $("#reviewFirmPicker").classList.add("is-open");
  });
  $("#reviewFirmSearch").addEventListener("input", (event) => {
    $("#reviewFirm").value = "";
    $("#reviewFirmLogo").textContent = "RM";
    $("#otherFirmField").hidden = true;
    $("#otherFirmName").required = false;
    $("#recommendationTitle").textContent = "Would you recommend this firm to other traders?";
    renderAspectRatings();
    updateMonthlyLimit();
    renderFirmPickerOptions(event.target.value);
    $("#reviewFirmPicker").classList.add("is-open");
  });
  $("#reviewFirmSearch").addEventListener("blur", () => setTimeout(() => $("#reviewFirmPicker").classList.remove("is-open"), 120));
  $("#reviewFirmMenu").addEventListener("mousedown", (event) => event.preventDefault());
  $("#reviewFirmMenu").addEventListener("click", (event) => {
    const option = event.target.closest("[data-firm-value]");
    if (!option) return;
    syncFirmPicker(clean(option.dataset.firmValue));
    $("#reviewFirmPicker").classList.remove("is-open");
  });
  $("#otherFirmName").addEventListener("input", () => { const firm = selectedFirmDetails(); $("#recommendationTitle").textContent = `Would you recommend ${firm.name || "this firm"} to other traders?`; renderAspectRatings(); updateMonthlyLimit(); });
  $("#overallRatingStars").addEventListener("click", (event) => { const button = event.target.closest("[data-overall-star]"); if (button) setOverallRating(button.dataset.overallStar); });
  $("#aspectRatings").addEventListener("click", (event) => {
    const button = event.target.closest("[data-aspect-star]");
    if (!button) return;
    const key = button.dataset.aspect;
    aspectRatings[key] = Math.max(1, Math.min(5, Number(button.dataset.aspectStar) || 5));
    renderStarButtons($(`[data-aspect-group="${key}"]`), aspectRatings[key], key);
    $(`#aspectValue-${key}`).textContent = `${aspectRatings[key]}/5`;
  });
  document.querySelectorAll("[data-recommend]").forEach((button) => button.addEventListener("click", () => {
    $("#reviewRecommend").value = button.dataset.recommend;
    document.querySelectorAll("[data-recommend]").forEach((item) => item.classList.toggle("is-selected", item === button));
  }));
  $("#reviewTitle").addEventListener("input", (event) => $("#reviewTitleCount").textContent = String(event.target.value.length));
  $("#reviewText").addEventListener("input", (event) => $("#reviewTextCount").textContent = String(event.target.value.length));
  $("#reviewProofFiles").addEventListener("change", (event) => {
    const incoming = Array.from(event.target.files || []);
    if (incoming.some((file) => file.size > 5 * 1024 * 1024)) { event.target.value = ""; return showFormError("Each proof file must be 5MB or smaller."); }
    proofFiles = incoming;
    $("#proofFileList").innerHTML = proofFiles.length ? proofFiles.map((file) => `<div>• ${escapeHtml(file.name)} (${(file.size / 1024 / 1024).toFixed(2)} MB)</div>`).join("") : "No proof files added.";
  });
  $("#directoryReviewForm").addEventListener("submit", submitReview);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("#reviewModal").hidden) closeReviewModal(); });
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!authResolved) { authResolved = true; resolveAuthReady(); }
  if (user && tableRows.length) loadLikedFirms().then(renderTable);
});

async function init() {
  bindEvents();
  showTableSkeleton();
  setOverallRating(5);
  renderAspectRatings();
  const firmsPromise = getFirmsByType("listed", { surface: "reviews" });
  const approvedReviewsPromise = loadApprovedReviews();
  listedFirms = await firmsPromise;
  populateFirmOptions();
  if (!authResolved) await authReady;
  const params = new URLSearchParams(location.search);
  if (params.get("openReview") === "1") await openReviewModal(slugify(params.get("firm") || ""));
  approvedReviews = await approvedReviewsPromise;
  buildTableRows();
  await loadLikedFirms();
  renderTable();
  if (params.get("likeFirm")) {
    const firm = tableRows.find((row) => row.slug === slugify(params.get("likeFirm")));
    if (firm) await likeFirm(String(firm.id), firm.slug);
  }
}

init().catch((error) => {
  $("#reviewTableBody").innerHTML = `<tr><td colspan="8" class="table-message">${escapeHtml(error?.message || "Review directory could not be loaded.")}</td></tr>`;
});
