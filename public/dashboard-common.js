import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { notifyPointsCredited } from "./email-notify-client.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function toDate(ts) {
  if (!ts) return "-";
  if (ts.toDate) return ts.toDate().toLocaleDateString();
  if (typeof ts?.seconds === "number") return new Date(ts.seconds * 1000).toLocaleDateString();
  const d = ts instanceof Date ? ts : new Date(ts);
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  return "-";
}

export function statusClass(status) {
  const s = String(status || "Pending").toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "paid") return "paid";
  if (s === "used") return "paid";
  if (s === "expired") return "rejected";
  return "pending";
}

export function sorted(rows) {
  return rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export function logout() {
  return signOut(auth);
}

function userRef(uid) {
  return doc(db, "users", uid);
}

function userShadowRef(uid) {
  return doc(db, String(uid || "").trim(), "profile");
}

function isPermErr(err) {
  return /permission|insufficient/i.test(String(err?.message || ""));
}

async function getUserProfile(uid) {
  const out = {};
  try {
    const snap = await getDoc(userRef(uid));
    if (snap.exists()) Object.assign(out, snap.data());
  } catch {}
  try {
    const snap = await getDoc(userShadowRef(uid));
    if (snap.exists()) Object.assign(out, snap.data());
  } catch {}
  return out;
}

async function sendPointsCreditEmail(uid, points, reason, newCashpoints, extra = {}) {
  const safeUid = String(uid || "").trim();
  const pts = Number(points || 0);
  if (!safeUid || !Number.isFinite(pts) || pts <= 0) return;
  try {
    const profile = await getUserProfile(safeUid);
    const email = String(profile?.email || "").trim().toLowerCase();
    if (!email) return;
    await notifyPointsCredited({
      uid: safeUid,
      userEmail: email,
      points: pts,
      reason: String(reason || "points_update"),
      newCashpoints: Number(newCashpoints || profile?.cashpoints || profile?.cashpointsDisplay || 0),
      rewardLogId: String(extra?.rewardLogId || "").trim(),
      rewardActionId: String(extra?.rewardActionId || "").trim()
    });
  } catch {}
}

export async function saveUserProfile(uid, payload = {}, opts = { merge: true }) {
  try {
    await setDoc(userRef(uid), payload, opts);
    return { store: "users" };
  } catch (err) {
    if (!isPermErr(err)) throw err;
    await setDoc(userShadowRef(uid), payload, opts);
    return { store: "shadow" };
  }
}

function emailKey(v = "") {
  return String(v || "").trim().toLowerCase();
}

async function isBannedUser(user) {
  const uid = String(user?.uid || "").trim();
  const email = emailKey(user?.email || "");
  if (!uid && !email) return false;
  try {
    if (uid) {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists() && userSnap.data()?.banned) return true;
    }
  } catch {}
  if (!email) return false;
  try {
    const banSnap = await getDoc(doc(db, "bannedEmails", email));
    if (banSnap.exists() && banSnap.data()?.active !== false) return true;
  } catch {}
  return false;
}

export function requireAuth(onUser) {
  let busy = false;
  onAuthStateChanged(auth, async (user) => {
    if (busy) return;
    busy = true;
    if (!user) {
      if (!/login\.html$/i.test(window.location.pathname)) window.location.href = "login.html";
      busy = false;
      return;
    }
    if (await isBannedUser(user)) {
      await signOut(auth);
      if (!/login\.html$/i.test(window.location.pathname)) window.location.href = "login.html";
      busy = false;
      return;
    }
    try {
      await onUser(user);
    } finally {
      busy = false;
    }
  });
}

export async function ensureUser(uid, email) {
  const data = await getUserProfile(uid);
  if (!Object.keys(data).length) {
    const payload = {
      email: email || "",
      firstName: "Trader",
      lastName: "",
      whatsapp: "",
      cashpoints: 0,
      balanceDisplay: "$0.00",
      cashpointsDisplay: "0",
      accountsValueDisplay: "0",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await saveUserProfile(uid, payload, { merge: true });
    return payload;
  }
  return data;
}

export async function loadRows(collectionName, uid) {
  const qRef = query(collection(db, collectionName), where("uid", "==", uid));
  const snap = await getDocs(qRef);
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  return sorted(rows);
}

export async function addRow(collectionName, payload) {
  return addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp()
  });
}

export async function loadCounts(uid) {
  const [cashback, reviews, claims] = await Promise.all([
    loadRows("cashbackRequests", uid),
    loadRows("reviews", uid),
    loadRows("accountClaims", uid)
  ]);

  return {
    cashback: cashback.length,
    reviews: reviews.length,
    claims: claims.length
  };
}

function hasManualValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (text === "0" || text === "0.00" || text === "$0" || text === "$0.00") return false;
  if (text === "$20,520.32" || text === "$15,800.45" || text === "$50,120.78") return false;
  return true;
}

export async function getDashboardMetrics(uid, profile = {}) {
  const [cashbackRows, purchases] = await Promise.all([
    loadRows("cashbackRequests", uid),
    loadRows("purchases", uid)
  ]);

  const approvedCashback = cashbackRows
    .filter((row) => {
      const status = String(row.status || "Pending").toLowerCase();
      return status === "approved" || status === "paid";
    })
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const rawPoints = profile.cashpoints ?? profile.cashpointsDisplay ?? 0;
  const pointsValue = Number(String(rawPoints).replace(/[^0-9.-]/g, "")) || 0;
  const purchasesCount = purchases.length;

  const autoBalance = formatCurrency(approvedCashback);
  const autoCashpoints = String(pointsValue);
  const autoAccounts = String(purchasesCount);

  function pctFrom(value, divisor, max = 99) {
    const num = Number(value || 0);
    if (num <= 0) return 0;
    return Math.min(max, (num / divisor));
  }

  const trendCashbackPct = pctFrom(approvedCashback, 1000, 48);
  const trendCashpointsPct = pctFrom(pointsValue, 120, 42);
  const trendAccountsPct = pctFrom(purchasesCount, 0.2, 65);

  return {
    balanceDisplay: hasManualValue(profile.balanceDisplay) ? profile.balanceDisplay : autoBalance,
    cashpointsDisplay: hasManualValue(profile.cashpointsDisplay) ? profile.cashpointsDisplay : autoCashpoints,
    accountsValueDisplay: hasManualValue(profile.accountsValueDisplay) ? profile.accountsValueDisplay : autoAccounts,
    trendCashbackHtml: `<span class="metric-up">+${trendCashbackPct.toFixed(1)}%</span> this month`,
    trendCashpointsHtml: `<span class="metric-up">+${trendCashpointsPct.toFixed(1)}%</span> vs last week`,
    trendAccountsHtml: `<span class="metric-up">+${trendAccountsPct.toFixed(1)}%</span> growth trend`,
    purchasesCount,
    approvedCashback
  };
}

export async function syncBonusOffer(uid) {
  const now = Date.now();

  const bonusByUserQ = query(collection(db, "bonusOffers"), where("uid", "==", uid));
  const bonusByUserSnap = await getDocs(bonusByUserQ);

  for (const d of bonusByUserSnap.docs) {
    const data = d.data();
    if (data.status !== "active") continue;
    const exp = data.expiresAt?.toDate?.().getTime?.() || 0;
    if (exp && exp < now) {
      await updateDoc(doc(db, "bonusOffers", d.id), { status: "expired", expiredAt: serverTimestamp() });
    }
  }

  const purchaseQ = query(collection(db, "purchases"), where("uid", "==", uid));
  const purchaseSnap = await getDocs(purchaseQ);
  if (!purchaseSnap.empty) {
    const purchases = purchaseSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    purchases.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const latest = purchases[0];
    const purchaseDoc = purchaseSnap.docs.find((d) => d.id === latest.id);
    const purchase = purchaseDoc.data();
    const purchaseId = purchase.orderId || purchaseDoc.id;

    const existingQ = query(collection(db, "bonusOffers"), where("uid", "==", uid), where("sourcePurchaseId", "==", purchaseId));
    const existingSnap = await getDocs(existingQ);
    let createdBonus = false;

    if (existingSnap.empty) {
      // Only issue a bonus if admin has explicitly assigned an override on this purchase.
      const code = String(purchase.nextBonusCode || "").trim();
      const discountPct = Number(purchase.nextBonusDiscountPct || 0) || 0;
      const cashbackPct = Number(purchase.nextBonusCashbackPct || 0) || 0;
      const buyUrl = String(purchase.nextBonusUrl || "").trim();

      const hasAnyValue = Boolean(code) || discountPct > 0 || cashbackPct > 0;
      if (hasAnyValue) {
        const expiresAt = Timestamp.fromDate(new Date(now + 14 * 24 * 60 * 60 * 1000));
        const firmName = String(purchase.firmName || purchase.firm || "").trim();
        const titleBits = [];
        if (discountPct > 0) titleBits.push(`${discountPct}% off`);
        if (cashbackPct > 0) titleBits.push(`${cashbackPct}% cashback`);
        const title = titleBits.length ? `${titleBits.join(" + ")} on next purchase` : "Next purchase bonus";

        await addDoc(collection(db, "bonusOffers"), {
          uid,
          type: "NEXT_PURCHASE",
          title,
          code,
          discountPct,
          cashbackPct,
          url: buyUrl,
          firmName,
          status: "active",
          sourcePurchaseId: purchaseId,
          expiresAt,
          createdAt: serverTimestamp()
        });
        createdBonus = true;
      }
    } else {
      createdBonus = true;
    }

    if (!purchase.bonusGranted && createdBonus) {
      await updateDoc(doc(db, "purchases", purchaseDoc.id), {
        bonusGranted: true,
        bonusGrantedAt: serverTimestamp()
      });
    }
  }

  const finalQ = query(collection(db, "bonusOffers"), where("uid", "==", uid));
  const finalSnap = await getDocs(finalQ);
  const items = [];
  finalSnap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return sorted(items);
}

export async function markBonusUsed(bonusId) {
  await updateDoc(doc(db, "bonusOffers", bonusId), {
    status: "used",
    usedAt: serverTimestamp()
  });
}

export function formatCurrency(value) {
  const num = Number(value || 0);
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function awardDailySharePoints(uid, points = 50) {
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rewardActionId = `${uid}_CERT_SHARE_${dateKey}`;
  const actionRef = doc(db, "rewardActions", rewardActionId);
  const actionSnap = await getDoc(actionRef);

  if (actionSnap.exists()) {
    return { awarded: false, pointsAdded: 0 };
  }

  await setDoc(actionRef, {
    uid,
    type: "CERT_SHARE",
    points,
    dateKey,
    createdAt: serverTimestamp()
  });

  const userSnapData = await getUserProfile(uid);
  const userData = userSnapData || {};
  const currentPoints = Number(userData.cashpoints || userData.cashpointsDisplay || 0);
  const nextPoints = currentPoints + points;

  await saveUserProfile(uid, {
    cashpoints: nextPoints,
    cashpointsDisplay: String(nextPoints),
    updatedAt: serverTimestamp()
  }, { merge: true });

  await sendPointsCreditEmail(uid, points, "cert_share", nextPoints, { rewardActionId });

  return { awarded: true, pointsAdded: points, newCashpoints: nextPoints };
}

function localDateKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export async function canSubmitReviewToday(uid) {
  const dateKey = localDateKey();
  const actionRef = doc(db, "rewardActions", `${uid}_REVIEW_${dateKey}`);
  const actionSnap = await getDoc(actionRef);
  return !actionSnap.exists();
}

export async function awardDailyReviewPoints(uid, points = 25) {
  const dateKey = localDateKey();
  const actionRef = doc(db, "rewardActions", `${uid}_REVIEW_${dateKey}`);
  const actionSnap = await getDoc(actionRef);

  if (actionSnap.exists()) {
    return { awarded: false, pointsAdded: 0 };
  }

  await setDoc(actionRef, {
    uid,
    type: "REVIEW_DAILY",
    points,
    dateKey,
    createdAt: serverTimestamp()
  });

  const userData = await getUserProfile(uid);
  const currentPoints = Number(userData.cashpoints || userData.cashpointsDisplay || 0);
  const nextPoints = currentPoints + points;

  await saveUserProfile(uid, {
    cashpoints: nextPoints,
    cashpointsDisplay: String(nextPoints),
    updatedAt: serverTimestamp()
  }, { merge: true });

  await sendPointsCreditEmail(uid, points, "review_daily", nextPoints, { rewardActionId: `${uid}_REVIEW_${dateKey}` });

  return { awarded: true, pointsAdded: points, newCashpoints: nextPoints };
}

export async function addCashpoints(uid, points = 0, reason = "manual") {
  const val = Number(points || 0);
  if (val <= 0) return { awarded: false, pointsAdded: 0 };

  const userData = await getUserProfile(uid);
  const currentPoints = Number(userData.cashpoints || userData.cashpointsDisplay || 0);
  const nextPoints = currentPoints + val;

  await saveUserProfile(uid, {
    cashpoints: nextPoints,
    cashpointsDisplay: String(nextPoints),
    updatedAt: serverTimestamp()
  }, { merge: true });

  const rewardRef = await addDoc(collection(db, "rewardLogs"), {
    uid,
    points: val,
    reason,
    createdAt: serverTimestamp()
  });

  await sendPointsCreditEmail(uid, val, reason, nextPoints, { rewardLogId: String(rewardRef?.id || "").trim() });

  return { awarded: true, pointsAdded: val, newCashpoints: nextPoints };
}

export async function isOnboardingComplete(uid) {
  const data = await getUserProfile(uid);
  return Boolean(data.onboardingCompleted);
}

export async function saveOnboarding(uid, payload = {}) {
  const actionRef = doc(db, "rewardActions", `${uid}_ONBOARDING_COMPLETE`);
  const actionSnap = await getDoc(actionRef);
  const alreadyAwarded = actionSnap.exists();

  await saveUserProfile(uid, {
    ...payload,
    onboardingCompleted: true,
    onboardingCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  if (alreadyAwarded) return { awarded: false, pointsAdded: 0 };

  await setDoc(actionRef, {
    uid,
    type: "ONBOARDING_COMPLETE",
    points: 40,
    createdAt: serverTimestamp()
  });

  return addCashpoints(uid, 40, "onboarding_complete");
}
