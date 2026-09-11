"use strict";

const { FieldValue } = require("firebase-admin/firestore");
const { HttpError } = require("./http");
const { serialize } = require("./pii");

const SUPPORT_SUBMISSIONS_COLLECTION = "supportSubmissions";

function resolveDb(db) {
  return typeof db === "function" ? db() : db;
}

function supportTableMissing(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || error?.details || "");
  return code === "42P01" || code === "PGRST205" || /support_(profiles|submissions|audit_logs)|relation .* does not exist|could not find the table|invalid path specified in request url/i.test(message);
}

function supportUpstreamUnavailable(error) {
  const message = String(error?.message || error?.details || error || "");
  return /fetch failed|failed to fetch|network|enotfound|econn(refused|reset)|etimedout|socket hang up|dns/i.test(message);
}

function profileFromUser(user = {}) {
  const app = user.app_metadata || {};
  const meta = user.user_metadata || {};
  const role = String(app.role || meta.role || "").toLowerCase();
  const status = String(app.support_status || meta.status || "active").toLowerCase();
  return {
    user_id: user.id,
    display_name: String(meta.display_name || meta.name || user.email || "Support Staff"),
    role,
    status: status === "disabled" ? "disabled" : "active",
    created_at: user.created_at || null,
    updated_at: user.updated_at || null,
    email: user.email || "",
    lastSignInAt: user.last_sign_in_at || null
  };
}

async function listAllUsers(supabase) {
  const users = [];
  let page = 1;
  while (page <= 10) {
    let data;
    let error;
    try {
      ({ data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 }));
    } catch (requestError) {
      throw new HttpError(
        503,
        "Support accounts are temporarily unavailable. Check the configured Supabase project URL and service-role key.",
        "support_upstream_unavailable"
      );
    }
    if (error) throw new HttpError(503, `Support accounts could not be loaded: ${error.message || "Supabase Auth admin request failed"}`, "account_read_failed");
    users.push(...(data?.users || []));
    if ((data?.users || []).length < 1000) break;
    page += 1;
  }
  return users;
}

async function getAuthUser(supabase, userId) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user;
}

async function setSupportUserMetadata(supabase, userId, displayName, status) {
  const user = await getAuthUser(supabase, userId);
  const app = user?.app_metadata || {};
  const meta = user?.user_metadata || {};
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { ...app, role: "support", support_status: status },
    user_metadata: { ...meta, display_name: displayName, role: "support", status }
  });
}

async function listSupportProfiles(supabase) {
  const { data: profiles, error } = await supabase
    .from("support_profiles")
    .select("user_id,display_name,role,status,created_at,updated_at")
    .order("created_at", { ascending: false });
  const users = await listAllUsers(supabase);
  const byId = new Map(users.map((user) => [user.id, user]));

  if (!error) {
    return (profiles || []).map((profile) => ({
      ...profile,
      email: byId.get(profile.user_id)?.email || "",
      lastSignInAt: byId.get(profile.user_id)?.last_sign_in_at || null
    }));
  }
  if (!supportTableMissing(error)) {
    throw new HttpError(503, `Support profile storage failed: ${error.message || "unknown Supabase error"}`, "support_profile_read_failed");
  }

  return users
    .map(profileFromUser)
    .filter((profile) => profile.role === "support")
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}

async function getSupportProfile(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("support_profiles")
    .select("user_id,display_name,role,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!error) return profile;
  if (!supportTableMissing(error)) throw new HttpError(503, "Support profile storage is not ready.", "support_schema_not_ready");
  const user = await getAuthUser(supabase, userId);
  if (!user) return null;
  const fallback = profileFromUser(user);
  return fallback.role === "support" ? fallback : null;
}

async function saveSupportProfile(supabase, profile = {}) {
  const payload = {
    user_id: profile.userId,
    display_name: profile.displayName,
    role: "support",
    status: profile.status || "active",
    created_by_uid: profile.createdByUid
  };
  const { error } = await supabase.from("support_profiles").upsert(payload, { onConflict: "user_id" });
  await setSupportUserMetadata(supabase, profile.userId, payload.display_name, payload.status);
  if (!error) return { storage: "table" };
  if (supportTableMissing(error)) return { storage: "auth_metadata" };
  throw new HttpError(503, `Support profile could not be saved: ${error.message || "unknown Supabase error"}`, "support_profile_save_failed");
}

async function updateSupportProfileStatus(supabase, userId, status) {
  const profile = await getSupportProfile(supabase, userId);
  if (profile?.role !== "support") throw new HttpError(404, "Support account not found.", "not_found");
  const { error } = await supabase
    .from("support_profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error && !supportTableMissing(error)) throw new HttpError(503, "Account status could not be updated.", "account_update_failed");
  await supabase.auth.admin.updateUserById(userId, { ban_duration: status === "disabled" ? "876000h" : "none" });
  await setSupportUserMetadata(supabase, userId, profile.display_name || "Support Staff", status);
}

async function insertSubmission({ supabase, db, actor, submission }) {
  const payload = {
    submission_type: submission.type,
    target_collection: submission.targetCollection,
    target_id: submission.targetId,
    status: "pending",
    submitted_by_role: "support",
    created_by_uid: actor.uid,
    created_by_name: actor.displayName,
    proposed_changes: submission.proposedChanges
  };
  if (submission.type === "cms_update") {
    const ref = resolveDb(db).collection(SUPPORT_SUBMISSIONS_COLLECTION).doc();
    await ref.set({
      ...payload,
      created_by_uid: String(actor.uid || ""),
      created_at: FieldValue.serverTimestamp()
    });
    return { id: ref.id, storage: "firestore" };
  }
  const { data, error } = await supabase.from("support_submissions").insert(payload).select("id").single();
  if (!error && data) return { id: data.id, storage: "table" };
  if (!supportTableMissing(error)) throw new HttpError(503, `Submission could not be queued: ${error?.message || "unknown Supabase error"}`, "submission_failed");

  const ref = resolveDb(db).collection(SUPPORT_SUBMISSIONS_COLLECTION).doc();
  await ref.set({
    ...payload,
    created_by_uid: String(actor.uid || ""),
    created_at: FieldValue.serverTimestamp()
  });
  return { id: ref.id, storage: "firestore" };
}

async function listSubmissions({ supabase, db, actor = null, limit = 500 }) {
  let query = supabase
    .from("support_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (actor?.role === "support") query = query.eq("created_by_uid", actor.uid);
  let data = [];
  let error = null;
  try {
    ({ data, error } = await query);
  } catch (queryError) {
    error = queryError;
  }
  if (error && !supportTableMissing(error) && !supportUpstreamUnavailable(error)) {
    throw new HttpError(503, `Approval queue failed: ${error.message || "unknown Supabase error"}`, "approval_queue_failed");
  }

  const fsQuery = resolveDb(db).collection(SUPPORT_SUBMISSIONS_COLLECTION).orderBy("created_at", "desc").limit(limit);
  const snapshot = await fsQuery.get();
  const fsRows = snapshot.docs.map((doc) => ({ id: doc.id, ...serialize(doc.data()) }));
  const tableRows = !error ? (data || []) : [];
  const byId = new Map([...tableRows, ...fsRows].map((row) => [row.id, row]));
  const rows = Array.from(byId.values()).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))).slice(0, limit);
  return actor?.role === "support" ? rows.filter((row) => row.created_by_uid === actor.uid) : rows;
}

async function getSubmission({ supabase, db, id }) {
  let data = null;
  let error = null;
  try {
    ({ data, error } = await supabase.from("support_submissions").select("*").eq("id", id).maybeSingle());
  } catch (queryError) {
    error = queryError;
  }
  if (!error && data) return { row: data, storage: "table" };
  if (error && !supportTableMissing(error) && !supportUpstreamUnavailable(error)) {
    throw new HttpError(404, "Submission not found.", "not_found");
  }
  const snapshot = await resolveDb(db).collection(SUPPORT_SUBMISSIONS_COLLECTION).doc(id).get();
  return { row: snapshot.exists ? { id: snapshot.id, ...serialize(snapshot.data()) } : null, storage: "firestore" };
}

async function updateSubmissionStatus({ supabase, db, id, values, fromStatus = "" }) {
  let query = supabase.from("support_submissions").update(values).eq("id", id);
  if (fromStatus) query = query.eq("status", fromStatus);
  let data = null;
  let error = null;
  try {
    ({ data, error } = await query.select("id"));
  } catch (queryError) {
    error = queryError;
  }
  if (!error) {
    if (!fromStatus || data?.length) return { storage: "table" };
    const ref = resolveDb(db).collection(SUPPORT_SUBMISSIONS_COLLECTION).doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new HttpError(409, "This submission has already been reviewed.", "already_reviewed");
    if (snapshot.data()?.status !== fromStatus) {
      throw new HttpError(409, "This submission has already been reviewed.", "already_reviewed");
    }
    await ref.set(values, { merge: true });
    return { storage: "firestore" };
  }
  if (!supportTableMissing(error) && !supportUpstreamUnavailable(error)) throw error;

  const ref = resolveDb(db).collection(SUPPORT_SUBMISSIONS_COLLECTION).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, "Submission not found.", "not_found");
  if (fromStatus && snapshot.data()?.status !== fromStatus) {
    throw new HttpError(409, "This submission has already been reviewed.", "already_reviewed");
  }
  await ref.set(values, { merge: true });
  return { storage: "firestore" };
}

async function countPendingSubmissions({ supabase, db, actor }) {
  let query = supabase.from("support_submissions").select("*", { count: "exact", head: true }).eq("status", "pending");
  if (actor.role === "support") query = query.eq("created_by_uid", actor.uid);
  let count = 0;
  let error = null;
  try {
    ({ count, error } = await query);
  } catch (queryError) {
    error = queryError;
  }
  if (error && !supportTableMissing(error) && !supportUpstreamUnavailable(error)) {
    throw new HttpError(503, "Approval queue is not ready.", "support_schema_not_ready");
  }
  let fsQuery = resolveDb(db).collection(SUPPORT_SUBMISSIONS_COLLECTION).where("status", "==", "pending");
  if (actor.role === "support") fsQuery = fsQuery.where("created_by_uid", "==", actor.uid);
  const snapshot = await fsQuery.count().get();
  return Number(!error ? count || 0 : 0) + Number(snapshot.data().count || 0);
}

module.exports = {
  SUPPORT_SUBMISSIONS_COLLECTION,
  countPendingSubmissions,
  getSubmission,
  getSupportProfile,
  insertSubmission,
  listAllUsers,
  listSubmissions,
  listSupportProfiles,
  profileFromUser,
  saveSupportProfile,
  supportTableMissing,
  supportUpstreamUnavailable,
  updateSubmissionStatus,
  updateSupportProfileStatus
};
