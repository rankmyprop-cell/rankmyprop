const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ID = "rank-my-prop";
const WORKER_URL = "https://rankmyprop-api.theforexclue.workers.dev";
const APPLY = process.argv.includes("--apply");
const collectionArgIndex = process.argv.findIndex((arg) => arg === "--collection");
const idArgIndex = process.argv.findIndex((arg) => arg === "--id");
const TARGET_COLLECTION = String(process.argv.find((arg) => arg.startsWith("--collection="))?.slice("--collection=".length) || process.argv[collectionArgIndex + 1] || "").trim();
const TARGET_ID = String(process.argv.find((arg) => arg.startsWith("--id="))?.slice("--id=".length) || process.argv[idArgIndex + 1] || "").trim();
const FIREBASE_CONFIG = path.join(process.env.HOME || "", ".config", "configstore", "firebase-tools.json");
const MIGRATION_SECRET_PATH = "/tmp/rmp-migration-secret";
const root = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function credentials({ allowAnonymous = false } = {}) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(FIREBASE_CONFIG, "utf8"));
  } catch (error) {
    if (allowAnonymous) return "";
    throw error;
  }
  const token = String(config?.tokens?.access_token || "");
  const expiry = Number(config?.tokens?.expires_at || 0);
  if (!token || expiry < Date.now() + 60_000) {
    if (allowAnonymous) return "";
    throw new Error("Firebase CLI access token is missing or expired. Run `firebase login` first.");
  }
  return token;
}

async function firebaseJson(url, token, init = {}) {
  const headers = { "content-type": "application/json", ...(init.headers || {}) };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) throw new Error(`Firestore API ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return response.json();
}

function decode(value) {
  if (!value || typeof value !== "object") return null;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) {
    const date = new Date(value.timestampValue);
    return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: date.getMilliseconds() * 1_000_000, iso: date.toISOString() };
  }
  if ("bytesValue" in value) return { __type: "bytes", base64: value.bytesValue };
  if ("referenceValue" in value) return { __type: "reference", path: value.referenceValue };
  if ("geoPointValue" in value) return { __type: "geopoint", ...value.geoPointValue };
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decode);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decode(value)]));
}

async function collectionIds(token) {
  const ids = [];
  let pageToken = "";
  do {
    const payload = await firebaseJson(`${root}:listCollectionIds`, token, { method: "POST", body: JSON.stringify({ pageSize: 1000, pageToken }) });
    ids.push(...(payload.collectionIds || []));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return [...new Set(ids)].sort();
}

async function readCollection(collection, token) {
  const rows = [];
  let pageToken = "";
  do {
    const url = new URL(`${root}/${encodeURIComponent(collection)}`);
    url.searchParams.set("pageSize", "300");
    url.searchParams.set("showMissing", "false");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const payload = await firebaseJson(url, token);
    for (const document of payload.documents || []) {
      rows.push({ collection, id: decodeURIComponent(document.name.split("/").pop()), data: decodeFields(document.fields || {}) });
    }
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return rows;
}

async function readDocument(collection, id, token) {
  const document = await firebaseJson(`${root}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, token);
  return { collection, id, data: decodeFields(document.fields || {}) };
}

async function importBatch(documents, secret) {
  const response = await fetch(`${WORKER_URL}/v1/migration/import`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-rmp-migration-key": secret },
    body: JSON.stringify({ documents }),
  });
  if (!response.ok) throw new Error(`Cloudflare import ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return response.json();
}

async function main() {
  const isSingleDocumentMigration = Boolean(TARGET_COLLECTION && TARGET_ID);
  const token = credentials({ allowAnonymous: isSingleDocumentMigration });
  const collections = TARGET_COLLECTION ? [TARGET_COLLECTION] : await collectionIds(token);
  const counts = {};
  let total = 0;
  const secret = APPLY ? String(process.env.RMP_MIGRATION_SECRET || fs.readFileSync(MIGRATION_SECRET_PATH, "utf8")).trim() : "";
  for (const collection of collections) {
    const rows = TARGET_ID ? [await readDocument(collection, TARGET_ID, token)] : await readCollection(collection, token);
    counts[collection] = rows.length;
    total += rows.length;
    if (APPLY) {
      for (let index = 0; index < rows.length; index += 50) await importBatch(rows.slice(index, index + 50), secret);
    }
    console.log(`${APPLY ? "migrated" : "found"} ${collection}: ${rows.length}`);
  }
  console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", collections: collections.length, documents: total, counts }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
