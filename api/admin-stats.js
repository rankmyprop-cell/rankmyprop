"use strict";

const { ceoIdentity, firebaseAuth, firestore } = require("./_lib/clients");
const { handler, json, method } = require("./_lib/http");

async function countAuthUsers(auth) {
  let total = 0;
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    total += page.users.length;
    pageToken = page.pageToken;
  } while (pageToken);
  return total;
}

async function countCollection(db, name) {
  const snapshot = await db.collection(name).count().get();
  return Number(snapshot.data().count || 0);
}

async function countPending(db, name) {
  const [titleCase, lowerCase] = await Promise.all([
    db.collection(name).where("status", "==", "Pending").count().get(),
    db.collection(name).where("status", "==", "pending").count().get()
  ]);
  return Number(titleCase.data().count || 0) + Number(lowerCase.data().count || 0);
}

module.exports = handler(async (req, res) => {
  method(req, ["GET"]);
  await ceoIdentity(req);
  const db = firestore();
  const auth = firebaseAuth();

  const [users, cashback, accountClaims, claims, claimRequests, reviews] = await Promise.all([
    countAuthUsers(auth),
    countCollection(db, "cashbackRequests"),
    countPending(db, "accountClaims"),
    countPending(db, "claims"),
    countPending(db, "claimRequests"),
    countPending(db, "reviews")
  ]);

  return json(res, 200, {
    ok: true,
    stats: {
      users,
      cashback,
      pendingClaims: accountClaims + claims + claimRequests,
      pendingReviews: reviews
    }
  });
});
