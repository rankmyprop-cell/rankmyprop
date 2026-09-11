import { collection, doc, getDocs, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const OTHER_FIRM_ID = "__other__";

export function firmIdFrom(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function loadFirmIdentities(db) {
  const snapshot = await getDocs(collection(db, "firms"));
  const rows = [];
  snapshot.forEach((document) => {
    const data = document.data() || {};
    const rawRanking = Number(data.ranking || data.sortOrder || 0);
    rows.push({
      id: document.id,
      firmId: document.id,
      slug: firmIdFrom(data.slug || document.id),
      name: String(data.name || document.id).trim(),
      logo: String(data.logo || "").trim(),
      ranking: Number.isFinite(rawRanking) && rawRanking > 0 ? rawRanking : 0
    });
  });
  return rows.sort((a, b) => a.ranking - b.ranking || a.name.localeCompare(b.name));
}

export function renderFirmIdentityOptions(select, firms = [], selectedId = "", options = {}) {
  if (!select) return;
  const includeOther = options.includeOther !== false;
  select.innerHTML = [
    ...firms.map((firm) => `<option value="${escapeAttribute(firm.id)}">${escapeHtml(firm.name)} · ID: ${escapeHtml(firm.id)}</option>`),
    ...(includeOther ? [`<option value="${OTHER_FIRM_ID}">Other / New Prop Firm</option>`] : [])
  ].join("");
  const requested = String(selectedId || "").trim();
  if (requested && [...select.options].some((option) => option.value === requested)) select.value = requested;
}

export async function createFirmIdentity(db, { name, requestedId = "", logo = "" } = {}) {
  const cleanName = String(name || "").trim();
  const id = firmIdFrom(requestedId || cleanName);
  if (!cleanName || !id) throw new Error("Firm name and a valid unique ID are required.");
  const existing = await loadFirmIdentities(db);
  if (existing.some((firm) => firm.id === id)) throw new Error(`Firm ID “${id}” already exists.`);
  const nextRank = Math.max(0, ...existing.map((firm) => Number.isFinite(firm.ranking) ? firm.ranking : 0)) + 1;
  await setDoc(doc(db, "firms", id), {
    firmId: id,
    name: cleanName,
    slug: id,
    logo: String(logo || "").trim(),
    ranking: nextRank,
    sortOrder: nextRank,
    listingType: "listed",
    showListed: true,
    showBestGlobal: false,
    country: "Global",
    tags: ["Forex"],
    markets: ["Forex"],
    active: true,
    publishState: "published",
    detailsLink: `/prop-firms/${id}`,
    rulesLink: `/prop-firm-rules/${id}`,
    discountPage: `/offers/${id}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: false });
  return { id, firmId: id, slug: id, name: cleanName, logo: String(logo || "").trim(), ranking: nextRank };
}

export async function compressFirmLogo(file) {
  if (!file || !String(file.type || "").startsWith("image/")) throw new Error("Please select a PNG, JPG, WEBP or SVG logo.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Logo file must be smaller than 10 MB.");
  const source = URL.createObjectURL(file);
  try {
    const image = await loadImage(source);
    const maxSide = 256;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Logo could not be processed in this browser.");
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    let quality = 0.88;
    let output = canvas.toDataURL("image/webp", quality);
    while (output.length > 180000 && quality > 0.52) {
      quality -= 0.08;
      output = canvas.toDataURL("image/webp", quality);
    }
    if (output.length > 220000) throw new Error("Logo is still too large after optimization. Please use a simpler image.");
    return output;
  } finally {
    URL.revokeObjectURL(source);
  }
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Logo image could not be read."));
    image.src = source;
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}
