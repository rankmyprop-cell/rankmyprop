"use strict";

const { FieldValue } = require("firebase-admin/firestore");
const { audit, firestore, supportIdentity } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { claimSideEffects, reviewSideEffects } = require("./_lib/workflows");

const ACTIONS = Object.freeze({
  reviews: { collection: "reviews", statuses: new Set(["Pending", "Approved", "Rejected", "Hold"]) },
  issues: { collection: "supportTickets", statuses: new Set(["Pending", "Claimed", "Processing", "Resolved", "Rejected"]) },
  issueReports: { collection: "reviewReports", statuses: new Set(["Pending", "Claimed", "Processing", "Resolved", "Rejected"]) },
  accountClaims: { collection: "accountClaims", statuses: new Set(["Pending", "Processing", "Approved", "Rejected"]) },
  claims: { collection: "claims", statuses: new Set(["Pending", "Processing", "Approved", "Rejected"]) },
  claimRequests: { collection: "claimRequests", statuses: new Set(["Pending", "Processing", "Approved", "Rejected"]) }
});

module.exports = handler(async (req, res) => {
  method(req, ["PATCH"]);
  const actor = await supportIdentity(req);
  const key = String(req.body?.collection || "");
  const config = ACTIONS[key];
  const id = String(req.body?.id || "").trim();
  const status = String(req.body?.status || "").trim();
  if (!config) throw new HttpError(403, "This action is not allowed for support.", "action_forbidden");
  if (!id || !config.statuses.has(status)) throw new HttpError(400, "Valid record and status are required.", "invalid_input");

  const ref = firestore().collection(config.collection).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, "Record not found.", "not_found");
  await ref.set({
    status,
    supportHandledByUid: actor.uid,
    supportHandledByName: actor.displayName,
    supportHandledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  if (key === "reviews") await reviewSideEffects(id, status, actor);
  if (["accountClaims", "claims", "claimRequests"].includes(key)) {
    await claimSideEffects(id, config.collection, status);
  }
  await audit(actor, "status_updated", key, id, { status });
  return json(res, 200, { ok: true, status });
});
