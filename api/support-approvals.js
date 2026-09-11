"use strict";

const { FieldValue } = require("firebase-admin/firestore");
const { audit, ceoIdentity, firestore, getSupabaseAdmin } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { getSubmission, listSubmissions, updateSubmissionStatus } = require("./_lib/support-store");

function safeSlug(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const APPROVABLE_COLLECTIONS = Object.freeze(new Set([
  "firms",
  "offers",
  "reviews",
  "firmReviews",
  "firmReviewProfiles",
  "firmRatingStats",
  "giveaways",
  "upcomingEvents",
  "purchases",
  "bonusOffers",
  "propNewsPosts",
  "propNewsVideos",
  "tradingGuidesPosts",
  "tradingGuidesVideos",
  "fundingStrategiesPosts",
  "fundingStrategiesVideos",
  "tradingPsychologyPosts",
  "tradingPsychologyVideos",
  "beginnerTutorialsPosts",
  "beginnerTutorialsVideos",
  "pageHeadingsParagraphs",
  "pageCopy",
  "pageSeoContent",
  "pageFaqs"
]));

module.exports = handler(async (req, res) => {
  method(req, ["GET", "PATCH"]);
  const ceo = await ceoIdentity(req);
  const supabase = getSupabaseAdmin();

  if (req.method === "GET") {
    return json(res, 200, { ok: true, rows: await listSubmissions({ supabase, db: firestore, limit: 500 }) });
  }

  const id = String(req.body?.id || "");
  const decision = String(req.body?.decision || "").toLowerCase();
  const rejectionReason = String(req.body?.rejectionReason || "").trim();
  if (!id || !["approve", "reject"].includes(decision)) throw new HttpError(400, "Valid approval decision is required.", "invalid_input");
  const { row } = await getSubmission({ supabase, db: firestore, id });
  if (!row) throw new HttpError(404, "Submission not found.", "not_found");
  if (row.status !== "pending") throw new HttpError(409, "This submission has already been reviewed.", "already_reviewed");

  if (decision === "reject") {
    await updateSubmissionStatus({ supabase, db: firestore, id, fromStatus: "pending", values: {
      status: "rejected",
      rejection_reason: rejectionReason,
      reviewed_by_uid: ceo.uid,
      reviewed_by_name: ceo.displayName,
      reviewed_at: new Date().toISOString()
    } });
    await audit(ceo, "submission_rejected", row.submission_type, id);
    return json(res, 200, { ok: true, status: "rejected" });
  }

  const changes = row.proposed_changes && typeof row.proposed_changes === "object" ? row.proposed_changes : {};
  const targetId = String(row.target_id || changes.slug || "");
  if (!targetId) throw new HttpError(400, "Submission target is missing.", "invalid_submission");
  const db = firestore();
  const now = FieldValue.serverTimestamp();
  await updateSubmissionStatus({ supabase, db: firestore, id, fromStatus: "pending", values: { status: "processing" } });

  try {
    if (row.submission_type === "firm_create") {
      const slug = safeSlug(changes.slug || targetId);
      const ref = db.collection("firms").doc(slug);
      if ((await ref.get()).exists) throw new HttpError(409, "A firm with this slug already exists.", "target_exists");
      await ref.set({
        ...changes,
        slug,
        detailsLink: changes.detailsLink || `/prop-firms/${slug}`,
        rulesLink: changes.rulesLink || `/prop-firms/${slug}/rules`,
        discountPage: changes.discountPage || `/offers/${slug}`,
        publishState: "published",
        active: true,
        status: "approved",
        approvedSubmissionId: id,
        createdAt: now,
        updatedAt: now
      });
    } else {
      const collection = String(row.target_collection || "");
      if (!APPROVABLE_COLLECTIONS.has(collection)) {
        throw new HttpError(403, "Submission collection is not allowed.", "collection_forbidden");
      }
      await db.collection(collection).doc(targetId).set({
        ...changes,
        approvedSubmissionId: id,
        updatedAt: now
      }, { merge: true });
    }
  } catch (error) {
    await updateSubmissionStatus({ supabase, db: firestore, id, fromStatus: "processing", values: { status: "pending" } }).catch(() => {});
    throw error;
  }

  await updateSubmissionStatus({ supabase, db: firestore, id, fromStatus: "processing", values: {
    status: "approved",
    reviewed_by_uid: ceo.uid,
    reviewed_by_name: ceo.displayName,
    reviewed_at: new Date().toISOString()
  } });
  await audit(ceo, "submission_approved", row.submission_type, id, { targetId });
  return json(res, 200, { ok: true, status: "approved" });
});
