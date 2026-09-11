const ALLOWED_EVENT_TYPES = new Set([
  "payout_approved",
  "payout_rejected",
  "login_success",
  "cashback_approved",
  "review_submitted",
  "review_approved",
  "review_live",
  "review_pending",
  "review_deleted",
  "points_credited",
  "signup_success",
  "contact_message"
]);

const LIVE_REVIEW_STATUSES = new Set(["approved", "published", "publish", "live"]);
const PENDING_REVIEW_STATUSES = new Set(["pending", "under_review", "queued"]);
const RUNTIME_ENV_PATH = "/rmp-runtime-env.json";

function readEnv(name, fallback = "") {
  try {
    const value = import.meta?.env?.[name];
    if (value == null) return String(fallback || "");
    const out = String(value).trim();
    return out || String(fallback || "");
  } catch {
    return String(fallback || "");
  }
}

function readWindowValue(name, fallback = "") {
  try {
    if (typeof window === "undefined") return String(fallback || "");
    const value = window[name];
    if (value == null) return String(fallback || "");
    const out = String(value).trim();
    return out || String(fallback || "");
  } catch {
    return String(fallback || "");
  }
}

const SUPABASE_PROJECT_URL = readEnv("VITE_SUPABASE_PROJECT_URL", readWindowValue("RMP_SUPABASE_PROJECT_URL"));
const SUPABASE_ANON_KEY = readEnv("VITE_SUPABASE_ANON_KEY", readWindowValue("RMP_SUPABASE_ANON_KEY"));
const FUNCTION_NAME = readEnv("VITE_SUPABASE_NOTIFY_FUNCTION_NAME", "rmp-email-notifier");
const ENABLED = readEnv("VITE_EMAIL_NOTIFICATIONS_ENABLED", "true").toLowerCase() !== "false";
const DEBUG = readEnv("VITE_EMAIL_NOTIFICATIONS_DEBUG", readWindowValue("RMP_EMAIL_NOTIFICATIONS_DEBUG", "false")).toLowerCase() === "true";
let runtimeEnvCache = null;
let runtimeEnvPromise = null;

function logDebug(type, detail = {}) {
  if (!DEBUG) return;
  try {
    console.info("[email-notify]", type, detail || {});
  } catch {}
}

function logWarn(type, detail = {}) {
  try {
    console.warn("[email-notify]", type, detail || {});
  } catch {}
}

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function normalizeStatus(status = "") {
  return String(status || "").trim().toLowerCase();
}

function envLookup(obj = {}, key = "") {
  const direct = String(obj?.[key] || "").trim();
  if (direct) return direct;
  const prefixed = String(obj?.[`RMP_${key}`] || "").trim();
  if (prefixed) return prefixed;
  return "";
}

function getWindowEnv() {
  try {
    if (typeof window === "undefined") return {};
    return window.__RMP_ENV && typeof window.__RMP_ENV === "object" ? window.__RMP_ENV : {};
  } catch {
    return {};
  }
}

async function loadRuntimeEnv() {
  if (runtimeEnvCache) return runtimeEnvCache;
  if (!runtimeEnvPromise) {
    runtimeEnvPromise = (async () => {
      const winEnv = getWindowEnv();
      let fileEnv = {};
      try {
        const res = await fetch(RUNTIME_ENV_PATH, { cache: "no-store" });
        if (res.ok) {
          const parsed = await res.json();
          if (parsed && typeof parsed === "object") fileEnv = parsed;
        }
      } catch {}
      runtimeEnvCache = { ...fileEnv, ...winEnv };
      return runtimeEnvCache;
    })();
  }
  return runtimeEnvPromise;
}

async function resolveRuntimeConfig() {
  const envObj = await loadRuntimeEnv();
  const projectUrlRaw = String(
    SUPABASE_PROJECT_URL ||
      envLookup(envObj, "VITE_SUPABASE_PROJECT_URL") ||
      envLookup(envObj, "SUPABASE_PROJECT_URL")
  ).trim();
  const anonKey = String(
    SUPABASE_ANON_KEY ||
      envLookup(envObj, "VITE_SUPABASE_ANON_KEY") ||
      envLookup(envObj, "SUPABASE_ANON_KEY")
  ).trim();
  const fnNameRaw = String(
    FUNCTION_NAME ||
      envLookup(envObj, "VITE_SUPABASE_NOTIFY_FUNCTION_NAME") ||
      "rmp-email-notifier"
  ).trim();
  const enabledRaw = String(
    envLookup(envObj, "VITE_EMAIL_NOTIFICATIONS_ENABLED") ||
      envLookup(envObj, "EMAIL_NOTIFICATIONS_ENABLED") ||
      (ENABLED ? "true" : "false")
  ).trim();
  const enabled = !/^(false|0|off|no)$/i.test(enabledRaw || "true");
  const functionUrl = resolveFunctionUrl(projectUrlRaw, fnNameRaw);
  return { projectUrl: projectUrlRaw, anonKey, fnName: fnNameRaw, functionUrl, enabled };
}

function splitFunctionUrl(input = "") {
  const raw = String(input || "").trim();
  if (!raw) return { base: "", fn: "" };
  const marker = "/functions/v1/";
  const idx = raw.indexOf(marker);
  if (idx < 0) return { base: raw.replace(/\/+$/, ""), fn: "" };
  const base = raw.slice(0, idx).replace(/\/+$/, "");
  const fn = raw.slice(idx + marker.length).replace(/^\/+/, "").replace(/\/+$/, "");
  return { base, fn };
}

function normalizeProjectBase(input = "") {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const stripApiSuffix = (v = "") =>
    String(v || "")
      .replace(/\/(rest|auth|storage|graphql|functions)\/v1$/i, "")
      .replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(raw)) {
    return stripApiSuffix(raw);
  }

  try {
    const u = new URL(raw);
    const cleanPath = stripApiSuffix(u.pathname || "");
    return `${u.origin}${cleanPath}`;
  } catch {
    return stripApiSuffix(raw);
  }
}

function resolveFunctionUrl(projectUrlRaw = "", functionNameRaw = "") {
  const marker = "/functions/v1/";
  const rawProject = String(projectUrlRaw || "").trim();
  const rawFn = String(functionNameRaw || "").trim();

  if (/^https?:\/\//i.test(rawFn) && rawFn.includes(marker)) {
    return rawFn.replace(/\/+$/, "");
  }

  const projectSplit = splitFunctionUrl(rawProject);
  const base = normalizeProjectBase(projectSplit.base || rawProject);
  const fn =
    (/^https?:\/\//i.test(rawFn) ? splitFunctionUrl(rawFn).fn : rawFn)
      .replace(/^\/+/, "")
      .replace(/\/+$/, "") ||
    projectSplit.fn ||
    "rmp-email-notifier";

  if (!base) return "";
  return `${base}${marker}${fn}`;
}

function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanPayload(payload = {}) {
  const out = {};
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v == null) return;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return;
      out[k] = trimmed;
      return;
    }
    out[k] = v;
  });
  return out;
}

function withTimeout(ms = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId)
  };
}

function buildDefaultDedupeKey(eventType, payload = {}) {
  const uid = String(payload.uid || "").trim();
  const email = normalizeEmail(payload.userEmail || payload.email || "");
  const reviewId = String(payload.reviewId || "").trim();
  const status = normalizeStatus(payload.status || "");
  const amount = toFiniteNumber(payload.amount, 0);
  const points = toFiniteNumber(payload.points, 0);
  const moderationActionAt = String(payload.moderationActionAt || payload.statusChangedAt || "").trim();
  const rewardLogId = String(payload.rewardLogId || "").trim();
  const rewardActionId = String(payload.rewardActionId || "").trim();
  const newCashpoints = toFiniteNumber(payload.newCashpoints, 0);

  if (eventType === "review_live" || eventType === "review_approved" || eventType === "review_pending" || eventType === "review_submitted") {
    if (uid && reviewId && status && moderationActionAt) return `${eventType}:${uid}:${reviewId}:${status}:${moderationActionAt}`;
    if (uid && reviewId && status) return `${eventType}:${uid}:${reviewId}:${status}`;
  }
  if (eventType === "review_deleted") {
    if (uid && reviewId) return `${eventType}:${uid}:${reviewId}`;
  }
  if (eventType === "payout_approved" || eventType === "cashback_approved" || eventType === "payout_rejected") {
    const requestId = String(payload.requestId || payload.recordId || "").trim();
    if (uid && requestId && status) return `${eventType}:${uid}:${requestId}:${status}`;
    if (uid && amount > 0 && status) return `${eventType}:${uid}:${amount}:${status}`;
  }
  if (eventType === "points_credited") {
    const reason = String(payload.reason || "").trim();
    if (uid && rewardLogId) return `${eventType}:${uid}:${rewardLogId}`;
    if (uid && rewardActionId) return `${eventType}:${uid}:${rewardActionId}`;
    if (uid && reason && points > 0 && newCashpoints > 0) return `${eventType}:${uid}:${reason}:${points}:${newCashpoints}`;
    if (uid && reason && points > 0) return `${eventType}:${uid}:${reason}:${points}`;
  }
  if (eventType === "login_success" || eventType === "signup_success") {
    const source = String(payload.source || payload.signupSource || payload.method || "").trim().toLowerCase();
    if (uid && email) return `${eventType}:${uid}:${email}`;
    if (email && source) return `${eventType}:${email}:${source}`;
    if (email) return `${eventType}:${email}`;
  }
  return "";
}

export function isReviewLiveStatus(status = "") {
  return LIVE_REVIEW_STATUSES.has(normalizeStatus(status));
}

export function isReviewPendingStatus(status = "") {
  return PENDING_REVIEW_STATUSES.has(normalizeStatus(status));
}

export async function sendEmailNotification(eventType, payload = {}) {
  const safeEventType = String(eventType || "").trim().toLowerCase();
  if (!ALLOWED_EVENT_TYPES.has(safeEventType)) {
    logDebug("skip_invalid_event_type", { eventType: safeEventType });
    logWarn("skip_invalid_event_type", { eventType: safeEventType });
    return { ok: false, skipped: "invalid_event_type" };
  }

  const cfg = await resolveRuntimeConfig();
  if (!cfg.enabled) {
    logDebug("skip_disabled");
    logWarn("skip_disabled");
    return { ok: false, skipped: "disabled" };
  }
  const url = String(cfg.functionUrl || "").trim();
  if (!url || !cfg.anonKey || !url.includes("/functions/v1/")) {
    logDebug("skip_missing_config", {
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(cfg.anonKey),
      projectUrl: cfg.projectUrl || "",
      functionName: cfg.fnName || ""
    });
    logWarn("skip_missing_config", {
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(cfg.anonKey),
      projectUrl: cfg.projectUrl || "",
      functionName: cfg.fnName || ""
    });
    return { ok: false, skipped: "missing_config" };
  }

  const clean = cleanPayload(payload);
  if (!clean.userEmail) {
    const fromAlt = normalizeEmail(clean.email || clean.to || "");
    if (fromAlt) clean.userEmail = fromAlt;
  } else {
    clean.userEmail = normalizeEmail(clean.userEmail);
  }
  if (!clean.userEmail) {
    logDebug("skip_missing_user_email", { eventType: safeEventType });
    logWarn("skip_missing_user_email", { eventType: safeEventType });
    return { ok: false, skipped: "missing_user_email" };
  }

  clean.eventType = safeEventType;
  clean.sentAt = new Date().toISOString();
  if (!clean.dedupeKey) {
    const dedupeKey = buildDefaultDedupeKey(safeEventType, clean);
    if (dedupeKey) clean.dedupeKey = dedupeKey;
  }

  const timer = withTimeout(10000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`
      },
      body: JSON.stringify(clean),
      signal: timer.signal
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      logDebug("request_failed", { status: res.status, error: body?.error || "request_failed" });
      logWarn("request_failed", { status: res.status, error: body?.error || "request_failed", details: body?.details || "" });
      return { ok: false, status: res.status, error: body?.error || "request_failed" };
    }
    logDebug("request_success", { status: res.status, eventType: safeEventType });
    return { ok: true, data: body || {} };
  } catch (err) {
    logDebug("request_exception", { error: String(err?.message || err || "request_failed") });
    logWarn("request_exception", { error: String(err?.message || err || "request_failed") });
    return { ok: false, error: String(err?.message || err || "request_failed") };
  } finally {
    timer.clear();
  }
}

export async function notifyPayoutApproved(payload = {}) {
  const next = { ...payload };
  next.status = String(next.status || "Approved");
  next.amount = toFiniteNumber(next.amount, 0);
  return sendEmailNotification("payout_approved", next);
}

export async function notifyReviewLive(payload = {}) {
  const next = { ...payload, status: String(payload.status || "Approved") };
  return sendEmailNotification("review_live", next);
}

export async function notifyReviewPending(payload = {}) {
  const next = { ...payload, status: String(payload.status || "Pending") };
  return sendEmailNotification("review_pending", next);
}

export async function notifyReviewSubmitted(payload = {}) {
  const next = { ...payload, status: String(payload.status || "Pending") };
  return sendEmailNotification("review_submitted", next);
}

export async function notifyReviewDeleted(payload = {}) {
  return sendEmailNotification("review_deleted", { ...payload, status: "Deleted" });
}

export async function notifyPointsCredited(payload = {}) {
  const next = { ...payload };
  next.points = toFiniteNumber(next.points, 0);
  return sendEmailNotification("points_credited", next);
}

export async function notifyPayoutRejected(payload = {}) {
  const next = { ...payload };
  next.status = String(next.status || "Rejected");
  next.amount = toFiniteNumber(next.amount, 0);
  return sendEmailNotification("payout_rejected", next);
}

export async function notifyCashbackApproved(payload = {}) {
  const next = { ...payload };
  next.status = String(next.status || "Approved");
  next.amount = toFiniteNumber(next.amount, 0);
  return sendEmailNotification("cashback_approved", next);
}

export async function notifyReviewApproved(payload = {}) {
  const next = { ...payload, status: String(payload.status || "Approved") };
  return sendEmailNotification("review_approved", next);
}

export async function notifyLoginSuccess(payload = {}) {
  const next = { ...payload };
  next.userEmail = normalizeEmail(next.userEmail || next.email || "");
  next.displayName = String(next.displayName || next.fullName || next.name || "").trim();
  next.source = String(next.source || next.signupSource || "").trim();
  return sendEmailNotification("login_success", next);
}

export async function notifySignupSuccess(payload = {}) {
  return notifyLoginSuccess(payload);
}
