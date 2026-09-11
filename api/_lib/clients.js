"use strict";

const { createClient } = require("@supabase/supabase-js");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { HttpError, bearer } = require("./http");
const { getSupportProfile } = require("./support-store");

let supabaseAdmin;
let firebaseApp;

function env(name, fallback = "") {
  return String(process.env[name] ?? fallback).trim();
}

function firstEnv(names, fallback = "") {
  for (const name of names) {
    const value = env(name);
    if (value) return value;
  }
  return String(fallback || "").trim();
}

function normalizeSupabaseProjectUrl(value = "") {
  let raw = String(value || "").trim();
  if (!raw) return "";
  raw = raw.replace(/^["']|["']$/g, "").trim();
  if (/^(postgres|postgresql):\/\//i.test(raw)) return "";

  const bareRef = raw.match(/^([a-z0-9-]{15,})$/i);
  if (bareRef) return `https://${bareRef[1]}.supabase.co`;

  if (/^[a-z0-9-]+\.supabase\.co\/?$/i.test(raw)) return `https://${raw.replace(/\/+$/, "")}`;

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/i.test(url.protocol)) return "";
    return url.origin.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function supabaseUrl() {
  for (const name of ["SUPABASE_PROJECT_URL", "VITE_SUPABASE_PROJECT_URL", "SUPABASE_URL"]) {
    const url = normalizeSupabaseProjectUrl(env(name));
    if (url) return url;
  }
  return "";
}

function supabaseServiceRoleKey() {
  const raw = firstEnv([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SECRET_KEYS"
  ]);
  return raw.split(",").map((key) => key.trim()).find(Boolean) || "";
}

function getSupabaseAdmin() {
  const url = supabaseUrl();
  const key = supabaseServiceRoleKey();
  if (!url || !key) {
    throw new HttpError(503, "Support authentication is not configured.", "support_auth_not_configured");
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });
  }
  return supabaseAdmin;
}

function parseServiceAccount() {
  const raw = env("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new HttpError(503, "Secure workspace data access is not configured.", "workspace_not_configured");
  try {
    const decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const value = JSON.parse(decoded);
    if (value.private_key) value.private_key = String(value.private_key).replace(/\\n/g, "\n");
    return value;
  } catch {
    throw new HttpError(503, "Secure workspace data access is misconfigured.", "workspace_misconfigured");
  }
}

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  firebaseApp = getApps()[0] || initializeApp({ credential: cert(parseServiceAccount()) });
  return firebaseApp;
}

function firestore() {
  return getFirestore(getFirebaseApp());
}

function firebaseAuth() {
  return getAuth(getFirebaseApp());
}

async function verifyFirebaseWebToken(token) {
  const apiKey = env(
    "FIREBASE_WEB_API_KEY",
    env("VITE_FIREBASE_API_KEY", "AIzaSyBACBm1Yr4zf-KVy1ejRPJ1rqKFctEumuA")
  );
  if (!apiKey) {
    throw new HttpError(503, "CEO authentication is not configured.", "ceo_auth_not_configured");
  }
  let response;
  try {
    response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });
  } catch {
    throw new HttpError(503, "CEO authentication service is temporarily unavailable.", "ceo_auth_unavailable");
  }
  if (!response.ok) throw new HttpError(401, "Invalid or expired CEO session.", "invalid_token");
  const payload = await response.json().catch(() => ({}));
  const user = Array.isArray(payload?.users) ? payload.users[0] : null;
  if (!user?.localId || user.disabled) throw new HttpError(401, "Invalid or expired CEO session.", "invalid_token");
  return { uid: user.localId, email: user.email || "", name: user.displayName || "" };
}

async function supportIdentity(req) {
  const token = bearer(req);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Invalid or expired support session.", "invalid_token");

  const profile = await getSupportProfile(supabase, data.user.id);
  if (!profile || profile.role !== "support" || profile.status !== "active") {
    throw new HttpError(403, "Active support access is required.", "forbidden");
  }
  return {
    uid: data.user.id,
    displayName: String(profile.display_name || "Support Staff"),
    role: "support",
    status: "active"
  };
}

async function ceoIdentity(req) {
  const token = bearer(req);
  let decoded;
  if (env("FIREBASE_SERVICE_ACCOUNT_JSON")) {
    try {
      decoded = await firebaseAuth().verifyIdToken(token, true);
    } catch {
      throw new HttpError(401, "Invalid or expired CEO session.", "invalid_token");
    }
  } else {
    decoded = await verifyFirebaseWebToken(token);
  }
  const expected = env("CEO_ADMIN_EMAIL", "rankmyprop@gmail.com").toLowerCase();
  if (String(decoded.email || "").toLowerCase() !== expected) {
    throw new HttpError(403, "CEO access is required.", "forbidden");
  }
  return { uid: decoded.uid, displayName: decoded.name || "CEO Admin", email: expected, role: "ceo", status: "active" };
}

async function staffOrCeoIdentity(req) {
  let ceoError;
  try {
    return await ceoIdentity(req);
  } catch (error) {
    ceoError = error;
    if (![401, 403].includes(error?.status)) throw error;
  }
  try {
    return await supportIdentity(req);
  } catch (supportError) {
    if (ceoError?.status === 403 && supportError?.status === 503) throw ceoError;
    throw supportError;
  }
}

async function audit(actor, action, targetType, targetId = "", metadata = {}) {
  try {
    await getSupabaseAdmin().from("support_audit_logs").insert({
      actor_uid: actor.uid,
      actor_role: actor.role,
      actor_name: actor.displayName || "",
      action,
      target_type: targetType,
      target_id: String(targetId || ""),
      metadata
    });
  } catch {
    // Audit failure must not leak secrets or mutate the main result.
  }
}

module.exports = {
  audit,
  ceoIdentity,
  env,
  firebaseAuth,
  firestore,
  getSupabaseAdmin,
  staffOrCeoIdentity,
  supportIdentity,
  supabaseServiceRoleKey,
  supabaseUrl
};
