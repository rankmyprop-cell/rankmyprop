import { buildPushPayload } from "@block65/webcrypto-web-push";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import {
  PUBLIC_COLLECTIONS,
  categories,
  corsHeaders,
  extractDocumentFields,
  json,
  safeClickUrl,
  sha256,
} from "./lib.js";
import {
  legacyAdminStats,
  legacyNewsletter,
  legacyPageContent,
  legacyReviews,
  legacyYoutube,
} from "./legacy.js";

const FIREBASE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const ID = () => crypto.randomUUID();

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request, env)).forEach(([key, value]) => headers.set(key, value));
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return new Response(response.body, { status: response.status, headers });
}

async function body(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error("Expected an application/json request.");
  return request.json();
}

async function identity(request, env) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });
    return {
      uid: String(verified.payload.sub || ""),
      email: String(verified.payload.email || "").toLowerCase(),
      emailVerified: verified.payload.email_verified === true,
      displayName: String(verified.payload.name || "").slice(0, 120),
      photoUrl: String(verified.payload.picture || "").slice(0, 1000),
      admin: verified.payload.admin === true || String(verified.payload.email || "").toLowerCase() === String(env.ADMIN_EMAIL || "").toLowerCase(),
    };
  } catch { return null; }
}

async function requireAdmin(request, env) {
  const user = await identity(request, env);
  if (!user) throw Object.assign(new Error("Authentication required."), { status: 401 });
  if (!user.admin) throw Object.assign(new Error("Administrator access required."), { status: 403 });
  return user;
}

function sessionKey(env) { return new TextEncoder().encode(String(env.SESSION_SECRET || "")); }
function cookieValue(request, name) {
  const header = request.headers.get("cookie") || "";
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

async function cloudflareIdentity(request, env) {
  const token = cookieValue(request, "rmp_session");
  if (!token || !env.SESSION_SECRET) return null;
  try {
    const verified = await jwtVerify(token, sessionKey(env), { issuer: "rankmyprop-cloudflare", audience: "rankmyprop-web" });
    return { uid: String(verified.payload.sub || ""), email: String(verified.payload.email || ""), role: String(verified.payload.role || "user") };
  } catch { return null; }
}

async function exchangeAuth(request, env) {
  const user = await identity(request, env);
  if (!user) return json({ error: "A valid Firebase transition token is required." }, 401);
  const role = user.admin ? "admin" : "user";
  await env.DB.prepare(`INSERT INTO auth_users (id,email,role,firebase_uid,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET email=excluded.email,role=excluded.role,firebase_uid=excluded.firebase_uid,updated_at=CURRENT_TIMESTAMP`)
    .bind(user.uid, user.email, role, user.uid).run();
  const token = await new SignJWT({ email: user.email, role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.uid).setIssuer("rankmyprop-cloudflare").setAudience("rankmyprop-web").setIssuedAt().setExpirationTime("7d").sign(sessionKey(env));
  const secure = `rmp_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
  return json({ ok: true, user: { uid: user.uid, email: user.email, role } }, 200, { "set-cookie": secure });
}

async function authMe(request, env) {
  const user = await cloudflareIdentity(request, env);
  return user ? json({ authenticated: true, user }) : json({ authenticated: false }, 401);
}

async function requireUser(request, env) {
  const user = await identity(request, env);
  if (!user) throw Object.assign(new Error("Sign in to use Ranko Rewards."), { status: 401 });
  if (!user.emailVerified) throw Object.assign(new Error("Verify your email before using referral rewards."), { status: 403 });
  return user;
}

async function referralDashboard(request, env) {
  const user = await requireUser(request, env);
  const wallet = await env.DB.prepare("SELECT balance_coins AS balance, earned_coins AS earned, spent_coins AS spent FROM referral_wallets WHERE uid=?").bind(user.uid).first();
  const code = await env.DB.prepare("SELECT code, clicks FROM referral_codes WHERE uid=?").bind(user.uid).first();
  const referrals = await env.DB.prepare(`SELECT id, referrer_uid AS uid, referred_uid AS referredUid, referred_name AS name,
    referred_photo_url AS photoUrl, reward_coins AS coins, status, created_at AS joinedAt
    FROM referral_claims WHERE referrer_uid=? ORDER BY created_at DESC LIMIT 500`).bind(user.uid).all();
  const credits = await env.DB.prepare(`SELECT id, coins, amount_inr AS amountInr, code, status, created_at AS createdAt
    FROM referral_purchase_credits WHERE uid=? ORDER BY created_at DESC LIMIT 50`).bind(user.uid).all();
  const withdrawals = await env.DB.prepare(`SELECT id, coins, amount_inr AS amountInr, method, status, created_at AS createdAt
    FROM referral_withdrawals WHERE uid=? ORDER BY created_at DESC LIMIT 50`).bind(user.uid).all();
  const chart = await env.DB.prepare(`SELECT substr(created_at,1,10) AS day, COUNT(*) AS referrals, SUM(reward_coins) AS coins
    FROM referral_claims WHERE referrer_uid=? AND created_at >= date('now','-29 days') GROUP BY day ORDER BY day`).bind(user.uid).all();
  return json({ ok: true, code: code?.code || "", clicks: Number(code?.clicks || 0), wallet: wallet || { balance: 0, earned: 0, spent: 0 },
    referrals: referrals.results, credits: credits.results, withdrawals: withdrawals.results, chart: chart.results,
    exchange: { coins: 5, rupees: 3, minWithdrawCoins: 1000 } });
}

async function registerReferralCode(request, env) {
  const user = await requireUser(request, env);
  const input = await body(request);
  const code = String(input.code || "").trim().toUpperCase();
  if (!/^RMP[A-Z0-9]{6,14}$/.test(code)) return json({ error: "Invalid referral code." }, 400);
  const byUser = await env.DB.prepare("SELECT code FROM referral_codes WHERE uid=?").bind(user.uid).first();
  if (byUser) return json({ ok: true, code: byUser.code });
  const byCode = await env.DB.prepare("SELECT uid FROM referral_codes WHERE code=?").bind(code).first();
  if (byCode) return json({ error: "Referral code already in use." }, 409);
  await env.DB.prepare("INSERT INTO referral_codes(code,uid) VALUES(?,?)").bind(code, user.uid).run();
  return json({ ok: true, code });
}

async function countReferralClick(request, env) {
  const code = String(new URL(request.url).searchParams.get("code") || "").trim().toUpperCase();
  if (!code || code.length > 24) return json({ ok: false }, 400);
  await env.DB.prepare("UPDATE referral_codes SET clicks=clicks+1 WHERE code=?").bind(code).run();
  const row = await env.DB.prepare("SELECT code FROM referral_codes WHERE code=?").bind(code).first();
  return json({ ok: Boolean(row) });
}

async function attributeReferral(request, env) {
  const user = await requireUser(request, env);
  const input = await body(request);
  const code = String(input.code || "").trim().toUpperCase();
  if (!code) return json({ ok: true, attributed: false });
  const referrer = await env.DB.prepare("SELECT uid FROM referral_codes WHERE code=?").bind(code).first();
  if (!referrer) return json({ error: "Referral code was not found. Ask your friend to share their dashboard link again." }, 404);
  if (referrer.uid === user.uid) return json({ error: "You cannot use your own referral code." }, 400);
  const existing = await env.DB.prepare("SELECT referrer_uid FROM referral_claims WHERE referred_uid=?").bind(user.uid).first();
  if (existing) return json({ ok: true, attributed: existing.referrer_uid === referrer.uid, alreadyAttributed: true });
  const id = ID();
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO referral_claims(id,referrer_uid,referred_uid,referral_code,referred_email,referred_name,referred_photo_url,reward_coins,status)
      VALUES(?,?,?,?,?,?,?,5,'credited')`).bind(id, referrer.uid, user.uid, code, user.email, user.displayName, user.photoUrl),
    env.DB.prepare(`INSERT OR IGNORE INTO referral_ledger(id,uid,amount_coins,type,related_uid,related_id,note)
      SELECT ?,?,5,'referral_signup',? ,?,'Verified signup referral reward' WHERE changes()=1`).bind(ID(), referrer.uid, user.uid, id),
    env.DB.prepare(`INSERT INTO referral_wallets(uid,balance_coins,earned_coins,spent_coins) SELECT ?,5,5,0 WHERE changes()=1
      ON CONFLICT(uid) DO UPDATE SET balance_coins=balance_coins+5,earned_coins=earned_coins+5,updated_at=CURRENT_TIMESTAMP`).bind(referrer.uid)
  ]);
  const saved = await env.DB.prepare("SELECT referrer_uid FROM referral_claims WHERE referred_uid=?").bind(user.uid).first();
  return json({ ok: true, attributed: saved?.referrer_uid === referrer.uid, coins: 5 });
}

async function redeemReferralCoins(request, env) {
  const user = await requireUser(request, env);
  const input = await body(request);
  const coins = Math.floor(Number(input.coins));
  if (!Number.isInteger(coins) || coins < 5 || coins % 5 !== 0 || coins > 1000000) return json({ error: "Enter a valid coin amount in multiples of 5." }, 400);
  const id = ID();
  const voucher = `RMP-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const amountInr = Math.round((coins * 3 / 5) * 100) / 100;
  const results = await env.DB.batch([
    env.DB.prepare("UPDATE referral_wallets SET balance_coins=balance_coins-?,spent_coins=spent_coins+?,updated_at=CURRENT_TIMESTAMP WHERE uid=? AND balance_coins>=?").bind(coins, coins, user.uid, coins),
    env.DB.prepare("INSERT INTO referral_purchase_credits(id,uid,coins,amount_inr,code) SELECT ?,?,?,?,? WHERE changes()=1").bind(id, user.uid, coins, amountInr, voucher),
    env.DB.prepare("INSERT INTO referral_ledger(id,uid,amount_coins,type,related_id,note) SELECT ?,?,?,'purchase_credit',?,'Reserved as Rank My Prop purchase credit' WHERE changes()=1").bind(ID(), user.uid, -coins, id)
  ]);
  if (!Number(results?.[0]?.meta?.changes || 0)) return json({ error: "Not enough Ranko Coins." }, 400);
  return json({ ok: true, credit: { id, code: voucher, coins, amountInr, status: "Ready" } }, 201);
}

async function requestReferralWithdrawal(request, env) {
  const user = await requireUser(request, env);
  const input = await body(request);
  const coins = Math.floor(Number(input.coins));
  const method = String(input.method || "").trim();
  const details = String(input.details || "").trim().slice(0, 1000);
  if (!Number.isInteger(coins) || coins < 1000 || coins % 5 !== 0 || coins > 1000000) return json({ error: "Withdrawals require at least 1,000 Ranko Coins." }, 400);
  if (!["UPI", "Bank Transfer", "Crypto"].includes(method) || details.length < 4) return json({ error: "Choose a payout method and enter its payout details." }, 400);
  const id = ID();
  const inr = Math.round((coins * 3 / 5) * 100) / 100;
  const result = await env.DB.batch([
    env.DB.prepare("UPDATE referral_wallets SET balance_coins=balance_coins-?,spent_coins=spent_coins+?,updated_at=CURRENT_TIMESTAMP WHERE uid=? AND balance_coins>=?").bind(coins, coins, user.uid, coins),
    env.DB.prepare("INSERT INTO referral_withdrawals(id,uid,coins,amount_inr,method,payout_details) SELECT ?,?,?,?,?,? WHERE changes()=1").bind(id, user.uid, coins, inr, method, details),
    env.DB.prepare("INSERT INTO referral_ledger(id,uid,amount_coins,type,related_id,note) SELECT ?,?,?,'withdrawal_hold',?,'Reserved for withdrawal request' WHERE changes()=1").bind(ID(), user.uid, -coins, id)
  ]);
  if (!Number(result?.[0]?.meta?.changes || 0)) return json({ error: "Not enough Ranko Coins." }, 400);
  return json({ ok: true, withdrawal: { id, coins, amountInr: inr, method, status: "Pending" } }, 201);
}

async function adminReferralWithdrawals(request, env) {
  const admin = await requireAdmin(request, env);
  if (request.method === "GET") {
    const rows = await env.DB.prepare(`SELECT id,uid,coins,amount_inr AS amountInr,method,payout_details AS details,status,created_at AS createdAt
      FROM referral_withdrawals ORDER BY created_at DESC LIMIT 200`).all();
    return json({ ok: true, data: rows.results });
  }
  if (request.method !== "PATCH") return json({ error: "Method not allowed." }, 405);
  const input = await body(request);
  const id = String(input.id || "").trim();
  const status = String(input.status || "").trim();
  if (!id || !["Approved", "Paid", "Rejected"].includes(status)) return json({ error: "Invalid withdrawal update." }, 400);
  const row = await env.DB.prepare("SELECT * FROM referral_withdrawals WHERE id=?").bind(id).first();
  if (!row) return json({ error: "Withdrawal not found." }, 404);
  if (row.status === "Rejected" || row.status === "Paid") return json({ error: "This withdrawal is already finalized." }, 409);
  if (status === "Rejected" && row.status !== "Rejected") {
    await env.DB.batch([
      env.DB.prepare("UPDATE referral_withdrawals SET status='Rejected',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(admin.email, id),
      env.DB.prepare(`INSERT OR IGNORE INTO referral_ledger(id,uid,amount_coins,type,related_id,note) VALUES(?,?,?,'withdrawal_refund',?,'Rejected withdrawal refund')`).bind(ID(), row.uid, row.coins, id),
      env.DB.prepare(`UPDATE referral_wallets SET balance_coins=balance_coins+?,spent_coins=MAX(0,spent_coins-?),updated_at=CURRENT_TIMESTAMP WHERE uid=? AND changes()=1`).bind(row.coins, row.coins, row.uid)
    ]);
  } else await env.DB.prepare("UPDATE referral_withdrawals SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status, admin.email, id).run();
  return json({ ok: true, id, status });
}

async function adminReferralCredits(request, env) {
  const admin = await requireAdmin(request, env);
  if (request.method === "GET") {
    const rows = await env.DB.prepare(`SELECT id,uid,coins,amount_inr AS amountInr,code,status,created_at AS createdAt
      FROM referral_purchase_credits ORDER BY created_at DESC LIMIT 200`).all();
    return json({ ok: true, data: rows.results });
  }
  if (request.method !== "PATCH") return json({ error: "Method not allowed." }, 405);
  const input = await body(request);
  const id = String(input.id || "").trim();
  const status = String(input.status || "").trim();
  if (!id || !["Applied", "Cancelled"].includes(status)) return json({ error: "Invalid purchase credit update." }, 400);
  const row = await env.DB.prepare("SELECT * FROM referral_purchase_credits WHERE id=?").bind(id).first();
  if (!row) return json({ error: "Purchase credit not found." }, 404);
  if (row.status !== "Ready") return json({ error: "This purchase credit is already finalized." }, 409);
  if (status === "Cancelled") {
    await env.DB.batch([
      env.DB.prepare("UPDATE referral_purchase_credits SET status='Cancelled' WHERE id=? AND status='Ready'").bind(id),
      env.DB.prepare(`INSERT OR IGNORE INTO referral_ledger(id,uid,amount_coins,type,related_id,note)
        SELECT ?,?,?,'purchase_credit_refund',?,'Cancelled purchase credit refund' WHERE changes()=1`).bind(ID(), row.uid, row.coins, id),
      env.DB.prepare(`UPDATE referral_wallets SET balance_coins=balance_coins+?,spent_coins=MAX(0,spent_coins-?),updated_at=CURRENT_TIMESTAMP WHERE uid=? AND changes()=1`).bind(row.coins, row.coins, row.uid)
    ]);
  } else await env.DB.prepare("UPDATE referral_purchase_credits SET status='Applied',redeemed_at=CURRENT_TIMESTAMP WHERE id=? AND status='Ready'").bind(id).run();
  return json({ ok: true, id, status, reviewedBy: admin.email });
}

function documentRow(data) {
  if (!data) return null;
  let value;
  try { value = JSON.parse(data.data); } catch { value = {}; }
  return { id: data.id, ...value };
}

async function listDocuments(request, env, collection) {
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const cursor = String(url.searchParams.get("cursor") || "");
  const status = String(url.searchParams.get("status") || "");
  if (!PUBLIC_COLLECTIONS.has(collection)) await requireAdmin(request, env);
  const clauses = ["collection = ?"];
  const values = [collection];
  if (collection === "reviews" && !status) { clauses.push("LOWER(COALESCE(status, '')) = 'approved'"); }
  else if (status) { clauses.push("status = ?"); values.push(status); }
  if (cursor) { clauses.push("id > ?"); values.push(cursor); }
  values.push(limit + 1);
  const result = await env.DB.prepare(`SELECT id, data FROM documents WHERE ${clauses.join(" AND ")} ORDER BY id ASC LIMIT ?`).bind(...values).all();
  const hasMore = result.results.length > limit;
  const rows = result.results.slice(0, limit).map(documentRow);
  return json({ data: rows, nextCursor: hasMore ? rows.at(-1)?.id || null : null });
}

async function getDocument(request, env, collection, id) {
  if (!PUBLIC_COLLECTIONS.has(collection)) await requireAdmin(request, env);
  const row = await env.DB.prepare("SELECT id, data, status FROM documents WHERE collection = ? AND id = ?").bind(collection, id).first();
  if (!row || (collection === "reviews" && String(row.status || "").toLowerCase() !== "approved" && !(await identity(request, env))?.admin)) return json({ error: "Not found" }, 404);
  return json({ data: documentRow(row) });
}

async function saveDocument(request, env, collection, id) {
  const migrationKey = request.headers.get("x-rmp-migration-key") || "";
  let actor = { email: "migration" };
  if (!env.MIGRATION_SECRET || migrationKey !== env.MIGRATION_SECRET) actor = await requireAdmin(request, env);
  const input = await body(request);
  const data = input?.data && typeof input.data === "object" ? input.data : input;
  const fields = extractDocumentFields(data);
  await env.DB.prepare(`INSERT INTO documents (collection,id,data,uid,email,slug,status,created_at,updated_at,migrated_at)
    VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(collection,id) DO UPDATE SET data=excluded.data,uid=excluded.uid,email=excluded.email,slug=excluded.slug,status=excluded.status,created_at=excluded.created_at,updated_at=excluded.updated_at,migrated_at=CURRENT_TIMESTAMP`)
    .bind(collection, id, JSON.stringify(data), fields.uid, fields.email, fields.slug, fields.status, fields.createdAt, fields.updatedAt).run();
  await env.DB.prepare("INSERT INTO admin_audit_logs (id,admin_email,action,target,metadata) VALUES (?,?,?,?,?)")
    .bind(ID(), actor.email, "document.upsert", `${collection}/${id}`, JSON.stringify({ source: actor.email === "migration" ? "firebase-migration" : "admin" })).run();
  return json({ ok: true, id });
}

async function importDocuments(request, env) {
  const migrationKey = request.headers.get("x-rmp-migration-key") || "";
  if (!env.MIGRATION_SECRET || migrationKey !== env.MIGRATION_SECRET) return json({ error: "Migration authorization failed." }, 403);
  const input = await body(request);
  const documents = Array.isArray(input.documents) ? input.documents.slice(0, 100) : [];
  if (!documents.length) return json({ error: "No migration documents supplied." }, 400);
  const statements = [];
  for (const item of documents) {
    const collection = String(item.collection || "").trim().slice(0, 300);
    const id = String(item.id || "").trim().slice(0, 500);
    const data = item.data && typeof item.data === "object" ? item.data : null;
    if (!collection || !id || !data) continue;
    const fields = extractDocumentFields(data);
    statements.push(env.DB.prepare(`INSERT INTO documents (collection,id,data,uid,email,slug,status,created_at,updated_at,migrated_at)
      VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(collection,id) DO UPDATE SET data=excluded.data,uid=excluded.uid,email=excluded.email,slug=excluded.slug,status=excluded.status,created_at=excluded.created_at,updated_at=excluded.updated_at,migrated_at=CURRENT_TIMESTAMP`)
      .bind(collection, id, JSON.stringify(data), fields.uid, fields.email, fields.slug, fields.status, fields.createdAt, fields.updatedAt));
  }
  if (!statements.length) return json({ error: "No valid migration documents supplied." }, 400);
  await env.DB.batch(statements);
  return json({ ok: true, imported: statements.length });
}

async function importAuthUsers(request, env) {
  const migrationKey = request.headers.get("x-rmp-migration-key") || "";
  if (!env.MIGRATION_SECRET || migrationKey !== env.MIGRATION_SECRET) return json({ error: "Migration authorization failed." }, 403);
  const input = await body(request);
  const users = Array.isArray(input.users) ? input.users.slice(0, 100) : [];
  const statements = users.map((user) => env.DB.prepare(`INSERT INTO auth_users (id,email,display_name,role,disabled,firebase_uid,password_hash,password_salt,password_algorithm,email_verified,photo_url,provider_data,last_signed_in_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,disabled=excluded.disabled,firebase_uid=excluded.firebase_uid,password_hash=excluded.password_hash,password_salt=excluded.password_salt,password_algorithm=excluded.password_algorithm,email_verified=excluded.email_verified,photo_url=excluded.photo_url,provider_data=excluded.provider_data,last_signed_in_at=excluded.last_signed_in_at,updated_at=CURRENT_TIMESTAMP`)
    .bind(String(user.id), String(user.email || "").toLowerCase(), user.displayName || null, String(user.email || "").toLowerCase() === String(env.ADMIN_EMAIL || "").toLowerCase() ? "admin" : "user", user.disabled ? 1 : 0, String(user.id), user.passwordHash || null, user.passwordSalt || null, user.passwordHash ? "firebase-scrypt" : null, user.emailVerified ? 1 : 0, user.photoUrl || null, JSON.stringify(user.providers || []), user.lastSignedInAt || null, user.createdAt || new Date().toISOString()));
  if (statements.length) await env.DB.batch(statements);
  return json({ ok: true, imported: statements.length });
}

async function deleteDocument(request, env, collection, id) {
  const actor = await requireAdmin(request, env);
  await env.DB.prepare("DELETE FROM documents WHERE collection = ? AND id = ?").bind(collection, id).run();
  await env.DB.prepare("INSERT INTO admin_audit_logs (id,admin_email,action,target) VALUES (?,?,?,?)").bind(ID(), actor.email, "document.delete", `${collection}/${id}`).run();
  return json({ ok: true });
}

async function registerPush(request, env) {
  const input = await body(request);
  const endpoint = String(input?.subscription?.endpoint || "").trim();
  const p256dh = String(input?.subscription?.keys?.p256dh || "").trim();
  const auth = String(input?.subscription?.keys?.auth || "").trim();
  const selected = categories(input?.categories);
  if (!endpoint.startsWith("https://") || !p256dh || !auth || !selected.length) return json({ error: "A valid push subscription and category selection are required." }, 400);
  const id = await sha256(endpoint);
  const user = await identity(request, env);
  await env.DB.prepare(`INSERT INTO push_subscriptions (id,endpoint,p256dh,auth,enabled,categories,platform,browser,user_id,created_at,updated_at)
    VALUES (?,?,?,?,1,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth,enabled=1,categories=excluded.categories,platform=excluded.platform,browser=excluded.browser,user_id=COALESCE(excluded.user_id,push_subscriptions.user_id),disabled_reason=NULL,updated_at=CURRENT_TIMESTAMP`)
    .bind(id, endpoint, p256dh, auth, JSON.stringify(selected), String(input.platform || "unknown").slice(0, 80), String(input.browser || "unknown").slice(0, 80), user?.uid || null).run();
  return json({ ok: true, categories: selected });
}

async function queuePush(request, env) {
  const admin = await requireAdmin(request, env);
  const input = await body(request);
  const title = String(input.title || "").trim().slice(0, 120);
  const pushBody = String(input.body || "").trim().slice(0, 300);
  const category = categories([input.category])[0];
  let clickUrl;
  try { clickUrl = safeClickUrl(input.clickUrl); } catch (error) { return json({ error: error.message }, 400); }
  if (!title || !pushBody || !category) return json({ error: "Title, body and category are required." }, 400);
  const id = ID();
  await env.DB.prepare("INSERT INTO push_send_logs (id,title,body,category,click_url,admin_email,status) VALUES (?,?,?,?,?,?,?)")
    .bind(id, title, pushBody, category, clickUrl, admin.email, "queued").run();
  await env.JOBS.send({ type: "push.broadcast", id, title, body: pushBody, category, clickUrl, adminEmail: admin.email });
  return json({ ok: true, queued: true, logId: id }, 202);
}

async function pushLogs(request, env) {
  await requireAdmin(request, env);
  const result = await env.DB.prepare(`SELECT id,title,body,category,click_url AS clickUrl,total_recipients AS totalRecipients,successful,failed,invalid_tokens AS invalidToken,status,error,created_at AS createdAt,finished_at AS finishedAt
    FROM push_send_logs ORDER BY created_at DESC LIMIT 50`).all();
  return json({ data: result.results });
}

async function uploadMedia(request, env, key) {
  await requireAdmin(request, env);
  const safeKey = key.replace(/^\/+/, "");
  if (!safeKey || safeKey.includes("..")) return json({ error: "Invalid media key." }, 400);
  await env.MEDIA.put(safeKey, request.body, { httpMetadata: { contentType: request.headers.get("content-type") || "application/octet-stream" } });
  return json({ ok: true, key: safeKey, url: `/media/${encodeURI(safeKey)}` }, 201);
}

async function readMedia(env, key) {
  const object = await env.MEDIA.get(key);
  if (!object) return json({ error: "Not found" }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

async function router(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (path === "/" || path === "/health") return json({ ok: true, service: "rankmyprop-api", environment: env.ENVIRONMENT, timestamp: new Date().toISOString() });
  if (path === "/v1/config" && request.method === "GET") return json({ pushPublicKey: env.VAPID_PUBLIC_KEY || "", apiVersion: "v1" });
  if (path === "/api/newsletter-subscribe") return legacyNewsletter(request, env, requireAdmin);
  if (path === "/api/youtube-latest") return legacyYoutube(request);
  if (path === "/api/public-page-content") return legacyPageContent(request, env);
  if (path === "/api/admin-stats" && request.method === "GET") return legacyAdminStats(request, env, requireAdmin);
  if (path === "/api/reviews") return legacyReviews(request, env);
  const legacyReview = path.match(/^\/api\/reviews\/([^/]+)$/);
  if (legacyReview) return legacyReviews(request, env, decodeURIComponent(legacyReview[1]));
  const referralApi = path.match(/^\/api\/referrals\/(me|register|click|attribute|purchase-credit|withdrawals)$/);
  if (referralApi) {
    const [, action] = referralApi;
    if (action === "me" && request.method === "GET") return referralDashboard(request, env);
    if (action === "register" && request.method === "POST") return registerReferralCode(request, env);
    if (action === "click" && request.method === "GET") return countReferralClick(request, env);
    if (action === "attribute" && request.method === "POST") return attributeReferral(request, env);
    if (action === "purchase-credit" && request.method === "POST") return redeemReferralCoins(request, env);
    if (action === "withdrawals" && request.method === "POST") return requestReferralWithdrawal(request, env);
    return json({ error: "Method not allowed." }, 405);
  }
  if (path === "/api/referral-withdrawals") return adminReferralWithdrawals(request, env);
  if (path === "/api/referral-credits") return adminReferralCredits(request, env);
  if (path === "/v1/migration/import" && request.method === "POST") return importDocuments(request, env);
  if (path === "/v1/migration/auth" && request.method === "POST") return importAuthUsers(request, env);
  if (path === "/v1/auth/exchange" && request.method === "POST") return exchangeAuth(request, env);
  if (path === "/v1/auth/me" && request.method === "GET") return authMe(request, env);
  if (path === "/v1/referrals/me" && request.method === "GET") return referralDashboard(request, env);
  if (path === "/v1/referrals/register" && request.method === "POST") return registerReferralCode(request, env);
  if (path === "/v1/referrals/click" && request.method === "GET") return countReferralClick(request, env);
  if (path === "/v1/referrals/attribute" && request.method === "POST") return attributeReferral(request, env);
  if (path === "/v1/referrals/purchase-credit" && request.method === "POST") return redeemReferralCoins(request, env);
  if (path === "/v1/referrals/withdrawals" && request.method === "POST") return requestReferralWithdrawal(request, env);
  if (path === "/v1/admin/referral-withdrawals") return adminReferralWithdrawals(request, env);
  if (path === "/v1/admin/referral-credits") return adminReferralCredits(request, env);
  if (path === "/v1/push/subscriptions" && request.method === "POST") return registerPush(request, env);
  if (path === "/v1/admin/push/send" && request.method === "POST") return queuePush(request, env);
  if (path === "/v1/admin/push/logs" && request.method === "GET") return pushLogs(request, env);
  const media = path.match(/^\/media\/(.+)$/);
  if (media && request.method === "GET") return readMedia(env, decodeURIComponent(media[1]));
  const mediaUpload = path.match(/^\/v1\/admin\/media\/(.+)$/);
  if (mediaUpload && request.method === "PUT") return uploadMedia(request, env, decodeURIComponent(mediaUpload[1]));
  const document = path.match(/^\/v1\/collections\/([A-Za-z0-9_-]+)(?:\/([A-Za-z0-9_-]+))?$/);
  if (document) {
    const [, collection, id] = document;
    if (!id && request.method === "GET") return listDocuments(request, env, collection);
    if (id && request.method === "GET") return getDocument(request, env, collection, id);
    if (id && ["POST", "PUT", "PATCH"].includes(request.method)) return saveDocument(request, env, collection, id);
    if (id && request.method === "DELETE") return deleteDocument(request, env, collection, id);
  }
  return json({ error: "Not found" }, 404);
}

async function broadcastPush(message, env) {
  const existing = await env.DB.prepare("SELECT status FROM push_send_logs WHERE id = ?").bind(message.id).first();
  if (!existing || existing.status === "complete") return;
  const result = await env.DB.prepare("SELECT id,endpoint,p256dh,auth,categories FROM push_subscriptions WHERE enabled = 1").all();
  const recipients = result.results.filter((row) => {
    try { return JSON.parse(row.categories).includes(message.category); } catch { return false; }
  });
  let successful = 0;
  let failed = 0;
  let invalid = 0;
  const payload = JSON.stringify({ title: message.title, body: message.body, clickUrl: message.clickUrl, category: message.category, icon: "/favicon-192x192.png" });
  for (let index = 0; index < recipients.length; index += 25) {
    const batch = recipients.slice(index, index + 25);
    await Promise.all(batch.map(async (row) => {
      try {
        const request = await buildPushPayload({ data: payload, options: { ttl: 86400 } }, { endpoint: row.endpoint, expirationTime: null, keys: { p256dh: row.p256dh, auth: row.auth } }, {
          subject: env.VAPID_SUBJECT || "mailto:rankmyprop@gmail.com",
          publicKey: env.VAPID_PUBLIC_KEY,
          privateKey: env.VAPID_PRIVATE_KEY,
        });
        const response = await fetch(row.endpoint, request);
        if (response.ok) successful += 1;
        else {
          failed += 1;
          if (response.status === 404 || response.status === 410) {
            invalid += 1;
            await env.DB.prepare("UPDATE push_subscriptions SET enabled=0,disabled_reason=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(`push_${response.status}`, row.id).run();
          } else await env.DB.prepare("UPDATE push_subscriptions SET failure_count=failure_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run();
        }
      } catch {
        failed += 1;
        await env.DB.prepare("UPDATE push_subscriptions SET failure_count=failure_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run();
      }
    }));
  }
  await env.DB.prepare(`UPDATE push_send_logs SET total_recipients=?,successful=?,failed=?,invalid_tokens=?,status='complete',finished_at=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(recipients.length, successful, failed, invalid, message.id).run();
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    if (incoming.hostname === "rankmyprop.in") {
      incoming.hostname = "www.rankmyprop.in";
      return new Response(null, {
        status: 308,
        headers: {
          location: incoming.toString(),
          "cache-control": "public, max-age=3600",
        },
      });
    }
    let response;
    try { response = await router(request, env); }
    catch (error) { response = json({ error: error.message || "Unexpected server error." }, error.status || 500); }
    return withCors(response, request, env);
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        if (message.body?.type === "push.broadcast") await broadcastPush(message.body, env);
        message.ack();
      } catch (error) {
        await env.DB.prepare("UPDATE push_send_logs SET status='failed',error=?,finished_at=CURRENT_TIMESTAMP WHERE id=?").bind(String(error?.message || error).slice(0, 500), message.body?.id || "").run();
        message.retry();
      }
    }
  },
};
