const CFG_URL = "firm-card-fields.json";
const EMPTY = Object.freeze({});
let cfgPromise = null;

const FIELD_META = {
  payoutCycle: {
    target: "keyMetrics",
    label: "Payout Cycle",
    aliases: ["payout cycle", "first payout", "payout frequency"]
  },
  newsTrading: {
    target: "tradingConditions",
    label: "News Trading",
    aliases: ["news trading", "news"]
  },
  minTradingDays: {
    target: "tradingConditions",
    label: "Min Trading Days",
    aliases: ["min trading days", "minimum trading days"]
  },
  timeLimit: {
    target: "tradingConditions",
    label: "Time Limit",
    aliases: ["time limit", "maximum days", "max days"]
  },
  startingPrice: {
    target: "firmDetails",
    label: "Starting Price",
    aliases: ["starting price", "price", "fee", "challenge fee"]
  },
  eaAllowed: {
    target: "tradingConditions",
    label: "EA Allowed",
    aliases: ["ea allowed", "expert advisor", "expert advisors"]
  }
};

function slugify(v = "") {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function norm(v = "") {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
}

function hasValue(v = "") {
  const s = String(v ?? "").trim();
  if (!s) return false;
  const low = s.toLowerCase();
  return low !== "-" && low !== "n/a" && low !== "na" && low !== "null";
}

function ensureRows(rows) {
  return Array.isArray(rows) ? rows.map((x) => ({ ...x })) : [];
}

function upsertPair(rows, aliases, label, value) {
  if (!hasValue(value)) return rows;
  const keys = aliases.map((x) => norm(x)).filter(Boolean);
  const next = ensureRows(rows);
  let found = -1;
  for (let i = 0; i < next.length; i += 1) {
    const k = norm(next[i]?.label || next[i]?.name || "");
    if (k && keys.some((x) => k.includes(x))) {
      found = i;
      break;
    }
  }
  if (found >= 0) {
    next[found] = { ...(next[found] || {}), label: next[found]?.label || label, value: String(value) };
    return next;
  }
  next.push({ label, value: String(value) });
  return next;
}

function baseFromDetailsLink(link = "") {
  const s = String(link || "").trim().toLowerCase();
  if (!s) return "";
  const clean = s.replace(/^\/+/, "").split("?")[0].split("#")[0].replace(/\.html$/i, "");
  if (!clean) return "";
  if (clean.endsWith("detail")) return clean.replace(/detail$/i, "");
  return clean;
}

function firmKeys(row = {}) {
  const keys = new Set();
  const push = (v) => {
    const s = slugify(v);
    if (s) keys.add(s);
    const n = norm(v);
    if (n) keys.add(n);
  };
  push(row.slug);
  push(row.id);
  push(row.name);
  push(row.firmId);
  push(baseFromDetailsLink(row.detailsLink));
  return Array.from(keys);
}

async function loadCfg() {
  if (!cfgPromise) {
    cfgPromise = fetch(CFG_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : EMPTY))
      .catch(() => EMPTY);
  }
  return cfgPromise;
}

function getFirmOverride(cfg = EMPTY, row = {}) {
  const map = cfg && typeof cfg === "object" && cfg.firms && typeof cfg.firms === "object" ? cfg.firms : EMPTY;
  for (const k of firmKeys(row)) {
    if (map[k] && typeof map[k] === "object") return map[k];
  }
  return null;
}

function applyOverride(row = {}, override = null) {
  if (!override || typeof override !== "object") return row;
  const next = { ...row };
  for (const [field, meta] of Object.entries(FIELD_META)) {
    const v = override[field];
    if (!hasValue(v)) continue;
    const listKey = meta.target;
    next[listKey] = upsertPair(next[listKey], meta.aliases, meta.label, v);
  }
  return next;
}

export async function withFirmFieldOverrides(row = {}) {
  const cfg = await loadCfg();
  return applyOverride(row, getFirmOverride(cfg, row));
}

export async function withFirmFieldOverridesList(rows = []) {
  const cfg = await loadCfg();
  return (Array.isArray(rows) ? rows : []).map((row) => applyOverride(row, getFirmOverride(cfg, row)));
}
