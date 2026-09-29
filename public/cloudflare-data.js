import { CLOUDFLARE_API_URL } from "./cloudflare-config.js";

export async function listDocuments(collection, maxRows = 500, params = {}) {
  const rows = [];
  let cursor = "";
  do {
    const url = new URL(`${CLOUDFLARE_API_URL}/v1/collections/${encodeURIComponent(collection)}`);
    url.searchParams.set("limit", String(Math.min(100, Math.max(1, maxRows - rows.length))));
    if (cursor) url.searchParams.set("cursor", cursor);
    Object.entries(params).forEach(([key, value]) => { if (value != null && value !== "") url.searchParams.set(key, String(value)); });
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare ${collection} request failed (${response.status})`);
    const payload = await response.json();
    rows.push(...(Array.isArray(payload.data) ? payload.data : []));
    cursor = String(payload.nextCursor || "");
  } while (cursor && rows.length < maxRows);
  return rows.slice(0, maxRows);
}

export async function getDocument(collection, id) {
  const response = await fetch(`${CLOUDFLARE_API_URL}/v1/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, { headers: { accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Cloudflare ${collection}/${id} request failed (${response.status})`);
  return (await response.json()).data || null;
}
