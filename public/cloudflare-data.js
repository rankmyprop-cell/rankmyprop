import { CLOUDFLARE_API_URL } from "./cloudflare-config.js";

const cache = new Map();
const isLocal = typeof window !== "undefined" && (location.hostname === "localhost" || location.hostname === "127.0.0.1");
const CACHE_TTL_MS = isLocal ? 60 * 1000 : 5 * 60 * 1000; // 60s on localhost, 5m in prod
const STALE_TTL_MS = 15 * 60 * 1000; // serve stale immediately while revalidating in background

export async function listDocuments(collection, maxRows = 500, params = {}) {
  const cacheKey = `${collection}:${maxRows}:${JSON.stringify(params)}`;
  const now = Date.now();
  let cached = cache.get(cacheKey);
  if (!cached) {
    try {
      if (typeof sessionStorage !== "undefined") {
        const stored = sessionStorage.getItem(`rmp_cache_${cacheKey}`);
        if (stored) {
          cached = JSON.parse(stored);
          if (cached) cache.set(cacheKey, cached);
        }
      }
    } catch (_) {}
  }

  if (cached && (now - cached.time < CACHE_TTL_MS)) {
    return cached.data;
  }

  const fetchFresh = async () => {
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
    const cacheItem = { time: Date.now(), data: finalRows };
    cache.set(cacheKey, cacheItem);
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(`rmp_cache_${cacheKey}`, JSON.stringify(cacheItem));
      }
    } catch (_) {}
    return finalRows;
  };

  if (cached && (now - cached.time < STALE_TTL_MS)) {
    fetchFresh().catch(() => {});
    return cached.data;
  }

  return fetchFresh();
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
