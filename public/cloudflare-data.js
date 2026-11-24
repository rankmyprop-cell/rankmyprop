import { CLOUDFLARE_API_URL } from "./cloudflare-config.js";

const cache = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

export async function listDocuments(collection, maxRows = 500, params = {}) {
  const cacheKey = `${collection}:${maxRows}:${JSON.stringify(params)}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.time < CACHE_TTL_MS)) {
    return cached.data;
  }
  try {
    if (typeof sessionStorage !== "undefined") {
      const stored = sessionStorage.getItem(`rmp_cache_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (now - parsed.time < CACHE_TTL_MS)) {
          cache.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    }
  } catch (_) {}

  const rows = [];
  let cursor = "";
  do {
    const url = new URL(`${CLOUDFLARE_API_URL}/v1/collections/${encodeURIComponent(collection)}`);
    url.searchParams.set("limit", String(Math.min(100, Math.max(1, maxRows - rows.length))));
    if (cursor) url.searchParams.set("cursor", cursor);
    Object.entries(params).forEach(([key, value]) => { if (value != null && value !== "") url.searchParams.set(key, String(value)); });
    
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 4000) : null;
    try {
      const response = await fetch(url, { 
        headers: { accept: "application/json" },
        signal: controller?.signal
      });
      if (timeout) clearTimeout(timeout);
      if (!response.ok) throw new Error(`Cloudflare ${collection} request failed (${response.status})`);
      const payload = await response.json();
      rows.push(...(Array.isArray(payload.data) ? payload.data : []));
      cursor = String(payload.nextCursor || "");
    } catch (err) {
      if (timeout) clearTimeout(timeout);
      throw err;
    }
  } while (cursor && rows.length < maxRows);

  const finalRows = rows.slice(0, maxRows);
  const cacheItem = { time: now, data: finalRows };
  cache.set(cacheKey, cacheItem);
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(`rmp_cache_${cacheKey}`, JSON.stringify(cacheItem));
    }
  } catch (_) {}

  return finalRows;
}

export async function getDocument(collection, id) {
  const cacheKey = `doc:${collection}:${id}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.time < CACHE_TTL_MS)) {
    return cached.data;
  }

  const response = await fetch(`${CLOUDFLARE_API_URL}/v1/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, { headers: { accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Cloudflare ${collection}/${id} request failed (${response.status})`);
  const data = (await response.json()).data || null;
  cache.set(cacheKey, { time: now, data });
  return data;
}

export function clearCache() {
  cache.clear();
  try {
    if (typeof sessionStorage !== "undefined") {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("rmp_cache_")) sessionStorage.removeItem(key);
      });
    }
  } catch (_) {}
}
