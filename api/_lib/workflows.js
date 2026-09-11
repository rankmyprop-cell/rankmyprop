"use strict";

const { FieldValue } = require("firebase-admin/firestore");
const { env, firestore, supabaseUrl } = require("./clients");

function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function pickEmail(row = {}) {
  return String(row.email || row.userEmail || row.reviewerEmail || row.authorEmail || "").trim().toLowerCase();
}

async function resolveUserEmail(uid = "", fallback = "") {
  const db = firestore();
  const safeUid = String(uid || "").trim();
  if (safeUid) {
    const user = await db.collection("users").doc(safeUid).get().catch(() => null);
    if (user?.exists && user.data()?.email) return String(user.data().email).trim().toLowerCase();
    const shadow = await db.collection(safeUid).doc("profile").get().catch(() => null);
    if (shadow?.exists && shadow.data()?.email) return String(shadow.data().email).trim().toLowerCase();
  }
  return String(fallback || "").trim().toLowerCase();
}

async function notify(eventType, payload = {}) {
  const base = supabaseUrl();
  const anonKey = env("SUPABASE_ANON_KEY", env("VITE_SUPABASE_ANON_KEY"));
  const internalToken = env("INTERNAL_NOTIFY_TOKEN");
  if (!base || (!anonKey && !internalToken)) return { skipped: true };
  const headers = { "Content-Type": "application/json" };
  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }
  if (internalToken) headers["x-notify-token"] = internalToken;
  try {
    const response = await fetch(`${base}/functions/v1/${env("SUPABASE_NOTIFY_FUNCTION_NAME", "rmp-email-notifier")}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ eventType, ...payload })
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

async function awardReviewPoints(reviewId, review) {
  const uid = String(review.uid || "").trim();
  if (!uid || review.reviewPointsAwarded) return null;
  const db = firestore();
  const reviewRef = db.collection("reviews").doc(reviewId);
  const userRef = db.collection("users").doc(uid);
  const actionRef = db.collection("rewardActions").doc(`${uid}_REVIEW_FIRST_APPROVED_50`);
  const rewardRef = db.collection("rewardLogs").doc();
  let result = null;

  await db.runTransaction(async (transaction) => {
    const [liveReviewSnap, userSnap, actionSnap] = await Promise.all([
      transaction.get(reviewRef),
      transaction.get(userRef),
      transaction.get(actionRef)
    ]);
    if (!liveReviewSnap.exists || liveReviewSnap.data()?.reviewPointsAwarded) return;
    const points = actionSnap.exists ? 20 : 50;
    const user = userSnap.exists ? userSnap.data() : {};
    const current = Number(user.cashpoints || user.cashpointsDisplay || 0);
    const next = current + points;
    if (!actionSnap.exists) {
      transaction.set(actionRef, {
        uid,
        type: "REVIEW_FIRST_APPROVED",
        points: 50,
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    transaction.set(userRef, {
      cashpoints: next,
      cashpointsDisplay: String(next),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    transaction.set(rewardRef, {
      uid,
      points,
      reason: points === 50 ? "review_first_approved_50" : "review_approved_20",
      createdAt: FieldValue.serverTimestamp()
    });
    transaction.update(reviewRef, {
      reviewPointsAwarded: true,
      reviewPointsAdded: points,
      reviewPointsAwardedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    result = { uid, points, next, rewardLogId: rewardRef.id, fallbackEmail: user.email || pickEmail(review) };
  });

  if (result) {
    const userEmail = await resolveUserEmail(result.uid, result.fallbackEmail);
    if (userEmail) {
      await notify("points_credited", {
        uid: result.uid,
        userEmail,
        points: result.points,
        reason: result.points === 50 ? "review_first_approved_50" : "review_approved_20",
        newCashpoints: result.next,
        rewardLogId: result.rewardLogId
      });
    }
  }
  return result;
}

async function recomputeFirmRating(review = {}) {
  const db = firestore();
  const firmName = String(review.firm || review.firmName || "").trim();
  const firmSlug = slugify(review.firmSlug || review.slug || firmName);
  if (!firmSlug && !firmName) return;
  const rows = new Map();

  if (firmSlug) {
    const bySlug = await db.collection("reviews").where("firmSlug", "==", firmSlug).limit(1200).get().catch(() => null);
    bySlug?.docs?.forEach((doc) => rows.set(doc.id, doc.data()));
  }
  if (firmName) {
    for (const field of ["firm", "firmName"]) {
      const byName = await db.collection("reviews").where(field, "==", firmName).limit(1200).get().catch(() => null);
      byName?.docs?.forEach((doc) => rows.set(doc.id, doc.data()));
    }
  }
  const approved = [...rows.values()].filter((row) => ["approved", "published", "publish"].includes(String(row.status || "").toLowerCase()));
  const autoReviewCount = approved.length;
  const autoAverageRating = autoReviewCount
    ? Number((approved.reduce((sum, row) => sum + Number(row.rating || 0), 0) / autoReviewCount).toFixed(2))
    : 0;
  const statsRef = db.collection("firmRatingStats").doc(firmSlug || slugify(firmName));
  const statsSnap = await statsRef.get();
  const stats = statsSnap.exists ? statsSnap.data() : {};
  const useManualOverride = Boolean(stats.useManualOverride);
  const averageRating = useManualOverride ? Number(stats.manualAverageRating || 0) : autoAverageRating;
  const reviewCount = useManualOverride ? Number(stats.manualReviewCount || 0) : autoReviewCount;
  await statsRef.set({
    firmSlug: firmSlug || slugify(firmName),
    firmName: firmName || String(stats.firmName || ""),
    useManualOverride,
    manualAverageRating: Number(stats.manualAverageRating || 0),
    manualReviewCount: Number(stats.manualReviewCount || 0),
    autoAverageRating,
    autoReviewCount,
    averageRating,
    reviewCount,
    updatedAt: FieldValue.serverTimestamp(),
    ...(statsSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() })
  }, { merge: true });

  let firmRef = null;
  const directRef = firmSlug ? db.collection("firms").doc(firmSlug) : null;
  const firmSnap = directRef ? await directRef.get() : null;
  if (firmSnap?.exists) firmRef = directRef;
  if (!firmRef && firmSlug) {
    const match = await db.collection("firms").where("slug", "==", firmSlug).limit(1).get().catch(() => null);
    if (match && !match.empty) firmRef = match.docs[0].ref;
  }
  if (!firmRef && firmName) {
    const match = await db.collection("firms").where("name", "==", firmName).limit(1).get().catch(() => null);
    if (match && !match.empty) firmRef = match.docs[0].ref;
  }
  if (firmRef) await firmRef.set({ score: averageRating, reviewCount, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

async function reviewSideEffects(reviewId, status, actor) {
  const db = firestore();
  const snap = await db.collection("reviews").doc(reviewId).get();
  if (!snap.exists) return;
  const review = snap.data() || {};
  if (String(status).toLowerCase() === "approved") await awardReviewPoints(reviewId, review);
  await recomputeFirmRating({ ...review, status });
  const userEmail = await resolveUserEmail(review.uid, pickEmail(review));
  if (userEmail) {
    const statusLc = String(status).toLowerCase();
    const eventType = ["approved", "published", "publish"].includes(statusLc)
      ? "review_live"
      : ["pending", "hold", "under_review", "queued"].includes(statusLc) ? "review_pending" : "";
    if (!eventType) return;
    await notify(eventType, {
      uid: String(review.uid || ""),
      userEmail,
      reviewId,
      status,
      firm: String(review.firm || review.firmName || "Unknown Firm"),
      rating: Number(review.rating || 0),
      displayName: String(review.userName || review.reviewerName || review.authorName || review.displayName || review.name || ""),
      moderatedBy: actor.displayName || "Support",
      moderationActionAt: new Date().toISOString()
    });
  }
}

async function ensurePurchaseFromClaim(claimId, collectionName) {
  const db = firestore();
  const claimRef = db.collection(collectionName).doc(claimId);
  const claimSnap = await claimRef.get();
  if (!claimSnap.exists) return;
  const claim = claimSnap.data() || {};
  const uid = String(claim.uid || "").trim();
  if (!uid) return;
  const purchaseRef = db.collection("purchases").doc(claimId);
  if ((await purchaseRef.get()).exists) return;
  const firmName = String(claim.firm || claim.firmName || "").trim();
  const slug = slugify(firmName);
  let firm = null;
  const direct = slug ? await db.collection("firms").doc(slug).get().catch(() => null) : null;
  if (direct?.exists) firm = { id: direct.id, ...direct.data() };
  if (!firm && firmName) {
    const match = await db.collection("firms").where("name", "==", firmName).limit(1).get().catch(() => null);
    if (match && !match.empty) firm = { id: match.docs[0].id, ...match.docs[0].data() };
  }
  await purchaseRef.set({
    uid,
    userEmail: String(claim.userEmail || ""),
    firm: firmName,
    firmName: firm?.name || firmName,
    firmId: firm?.id || "",
    firmSlug: firm?.slug || slug,
    orderId: String(claim.orderId || claimId),
    amount: Number(claim.paymentAmount || 0),
    paymentMode: String(claim.paymentMode || ""),
    cryptoNetwork: String(claim.cryptoNetwork || ""),
    transactionId: String(claim.transactionId || ""),
    purchaseDate: String(claim.purchaseDate || ""),
    status: "Approved",
    sourceClaimId: claimId,
    firmBuyUrl: String(firm?.buyLink || firm?.website || ""),
    bonusGranted: false,
    createdAt: claim.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  await claimRef.set({
    purchaseId: claimId,
    purchaseCreatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

async function applyReferralReward(claimId, collectionName) {
  const db = firestore();
  const claimSnap = await db.collection(collectionName).doc(claimId).get();
  if (!claimSnap.exists) return;
  const claim = claimSnap.data() || {};
  const email = String(claim.userEmail || "").trim().toLowerCase();
  const amount = Number(claim.paymentAmount || 0);
  if (!email || amount <= 0) return;
  const referrals = await db.collection("referralClaims")
    .where("referredEmail", "==", email)
    .where("status", "==", "Approved")
    .where("cashbackRewardPaid", "==", false)
    .get();
  for (const doc of referrals.docs) {
    const row = doc.data() || {};
    let pct = Number(row.referralCommissionPct || 0);
    if (!(pct > 0) && row.uid) {
      const user = await db.collection("users").doc(String(row.uid)).get().catch(() => null);
      pct = Number(user?.data()?.referralCommissionPct || 0);
    }
    if (!(pct > 0)) pct = 5;
    const rewardAmount = Number((amount * (pct / 100)).toFixed(2));
    await db.collection("cashbackRequests").add({
      uid: row.uid || "",
      amount: rewardAmount,
      method: "Referral Reward",
      paymentDetails: "Auto from approved referred claim",
      note: `${pct}% referral cashback from claim ${claimId}`,
      status: "Approved",
      createdAt: FieldValue.serverTimestamp(),
      referralReward: true,
      referralCommissionPct: pct
    });
    await doc.ref.set({
      cashbackRewardPaid: true,
      cashbackRewardAmount: rewardAmount,
      referralCommissionPct: pct,
      sourceClaimId: claimId,
      cashbackRewardPaidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

async function claimSideEffects(claimId, collectionName, status) {
  if (String(status).toLowerCase() !== "approved") return;
  await applyReferralReward(claimId, collectionName);
  await ensurePurchaseFromClaim(claimId, collectionName);
}

module.exports = { claimSideEffects, notify, reviewSideEffects };
