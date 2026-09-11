"use strict";

const { firestore, getSupabaseAdmin, staffOrCeoIdentity } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { countPendingSubmissions } = require("./_lib/support-store");

async function countCollection(db, name) {
  const snapshot = await db.collection(name).count().get();
  return Number(snapshot.data().count || 0);
}

module.exports = handler(async (req, res) => {
  method(req, ["GET"]);
  const actor = await staffOrCeoIdentity(req);
  const db = firestore();
  const [
    firms,
    offers,
    supportTickets,
    reviewReports,
    accountClaims,
    claims,
    claimRequests,
    reviews
  ] = await Promise.all([
    countCollection(db, "firms"),
    countCollection(db, "offers"),
    countCollection(db, "supportTickets"),
    countCollection(db, "reviewReports"),
    countCollection(db, "accountClaims"),
    countCollection(db, "claims"),
    countCollection(db, "claimRequests"),
    countCollection(db, "reviews")
  ]);
  const pendingSubmissions = await countPendingSubmissions({ supabase: getSupabaseAdmin(), db: firestore, actor });

  return json(res, 200, {
    ok: true,
    counts: {
      firms,
      offers,
      issues: supportTickets + reviewReports,
      accountClaims: accountClaims + claims + claimRequests,
      reviews,
      pendingSubmissions
    },
    loadedAt: new Date().toISOString()
  });
});
