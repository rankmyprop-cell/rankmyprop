import { auth, db } from "./journal-firebase.js";
import { tradeJournalConfig } from "./trade-journal-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { addDoc, collection, deleteDoc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where, doc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = tradeJournalConfig.cloudinaryCloudName;
const CLOUDINARY_UPLOAD_PRESET = tradeJournalConfig.cloudinaryUploadPreset;
const TRADE_JOURNAL_COLLECTION = tradeJournalConfig.collectionName;
const USER_JOURNAL_FIELD = tradeJournalConfig.userMapField;
const EMBED_MODE = new URL(window.location.href).searchParams.get("embed") === "1";

const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];
const state = {
  user: null,
  entries: [],
  busy: false,
  chartRange: "day",
  filters: { search: "", result: "all", period: "all" }
};

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function tsMs(v) {
  if (!v) return 0;
  if (typeof v?.toDate === "function") return v.toDate().getTime();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function esc(v = "") {
  return String(v || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function nextUrl() {
  return `${window.location.pathname}${window.location.search}`;
}

function postEmbedHeight() {
  if (!EMBED_MODE || window.parent === window) return;
  const h = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight
  );
  window.parent.postMessage({ type: "rmp-tradejournal-height", height: h }, "*");
}

function setSyncStatus(text, ok = true) {
  const el = qs("#tradeJournalSyncStatus");
  if (!el) return;
  el.innerHTML = `<span aria-hidden="true"></span>${esc(text)}`;
  el.style.color = ok ? "#22c55e" : "#fbbf24";
  el.classList.toggle("is-warning", !ok);
}

function signedAmount(entry = {}) {
  const value = num(entry.amount, 0);
  const result = String(entry.result || "").toLowerCase();
  if (result === "loss") return -Math.abs(value);
  if (result === "win") return Math.abs(value);
  if (result === "be") return 0;
  return value;
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(num(value, 0));
}

function entryDate(entry = {}) {
  const raw = String(entry.date || "").trim();
  if (!raw) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(value = new Date()) {
  const date = startOfDay(value);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

function startOfMonth(value = new Date()) {
  const date = startOfDay(value);
  date.setDate(1);
  return date;
}

function endOfToday(value = new Date()) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + 1);
  return date;
}

function isBetween(date, start, end) {
  return Boolean(date && date >= start && date < end);
}

function periodStart(period, now = new Date()) {
  if (period === "day") return startOfDay(now);
  if (period === "week") return startOfWeek(now);
  if (period === "month") return startOfMonth(now);
  return null;
}

function filteredEntries() {
  const search = String(state.filters.search || "").trim().toLowerCase();
  const result = String(state.filters.result || "all").toLowerCase();
  const period = String(state.filters.period || "all").toLowerCase();
  const start = periodStart(period);
  const end = endOfToday();

  return state.entries.filter((entry) => {
    const haystack = [
      entry.pair, entry.session, entry.direction, entry.market,
      entry.reasonExit, entry.notes, entry.mistakes
    ].join(" ").toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if (result !== "all" && String(entry.result || "").toLowerCase() !== result) return false;
    if (start && !isBetween(entryDate(entry), start, end)) return false;
    return true;
  });
}

function buildChartBuckets(range = "day") {
  const now = new Date();
  const buckets = [];

  if (range === "month") {
    const current = startOfMonth(now);
    for (let offset = 5; offset >= 0; offset -= 1) {
      const start = new Date(current.getFullYear(), current.getMonth() - offset, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({
        start, end,
        label: start.toLocaleDateString("en-US", { month: "short" })
      });
    }
  } else if (range === "week") {
    const current = startOfWeek(now);
    for (let offset = 7; offset >= 0; offset -= 1) {
      const start = new Date(current);
      start.setDate(start.getDate() - (offset * 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      buckets.push({
        start, end,
        label: start.toLocaleDateString("en-US", { day: "numeric", month: "short" })
      });
    }
  } else {
    const current = startOfDay(now);
    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = new Date(current);
      start.setDate(start.getDate() - offset);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      buckets.push({
        start, end,
        label: start.toLocaleDateString("en-US", { weekday: "short" })
      });
    }
  }

  return buckets.map((bucket) => {
    const rows = state.entries.filter((entry) => isBetween(entryDate(entry), bucket.start, bucket.end));
    return {
      ...bucket,
      wins: rows.filter((entry) => String(entry.result || "").toLowerCase() === "win").length,
      losses: rows.filter((entry) => String(entry.result || "").toLowerCase() === "loss").length,
      pnl: rows.reduce((total, entry) => total + signedAmount(entry), 0)
    };
  });
}

function renderAnalytics() {
  const chart = qs("#profitabilityChart");
  if (!chart) return;
  const buckets = buildChartBuckets(state.chartRange);
  chart.style.setProperty("--chart-columns", String(buckets.length));
  const maxTrades = Math.max(1, ...buckets.flatMap((bucket) => [bucket.wins, bucket.losses]));
  const profitable = buckets.reduce((total, bucket) => total + bucket.wins, 0);
  const periodPnl = buckets.reduce((total, bucket) => total + bucket.pnl, 0);

  if (!state.entries.length) {
    chart.innerHTML = '<div class="chart-empty">Your profitability chart will appear here after you save your first completed trade.</div>';
  } else {
    chart.innerHTML = buckets.map((bucket) => {
      const winHeight = bucket.wins ? Math.max(12, Math.round((bucket.wins / maxTrades) * 158)) : 4;
      const lossHeight = bucket.losses ? Math.max(12, Math.round((bucket.losses / maxTrades) * 158)) : 4;
      const title = `${bucket.label}: ${bucket.wins} profitable, ${bucket.losses} losing, ${formatCurrency(bucket.pnl)}`;
      return `
        <div class="chart-column" title="${esc(title)}">
          <div class="chart-bars">
            <span class="chart-bar win" style="height:${winHeight}px"></span>
            <span class="chart-bar loss" style="height:${lossHeight}px"></span>
          </div>
          <span class="chart-label">${esc(bucket.label)}</span>
        </div>`;
    }).join("");
  }

  const profitableEl = qs("#chartProfitableTrades");
  const periodPnlEl = qs("#chartPeriodPnl");
  if (profitableEl) profitableEl.textContent = String(profitable);
  if (periodPnlEl) {
    periodPnlEl.textContent = formatCurrency(periodPnl);
    periodPnlEl.classList.toggle("is-positive", periodPnl > 0);
    periodPnlEl.classList.toggle("is-negative", periodPnl < 0);
  }

  const now = new Date();
  const winsSince = (start) => state.entries.filter((entry) =>
    String(entry.result || "").toLowerCase() === "win" &&
    isBetween(entryDate(entry), start, endOfToday(now))
  ).length;
  const snapshots = [
    ["#profitableToday", winsSince(startOfDay(now))],
    ["#profitableWeek", winsSince(startOfWeek(now))],
    ["#profitableMonth", winsSince(startOfMonth(now))]
  ];
  snapshots.forEach(([selector, count]) => {
    const el = qs(selector);
    if (el) el.textContent = `${count} win${count === 1 ? "" : "s"}`;
  });

  const sessionTotals = new Map();
  state.entries.forEach((entry) => {
    const session = String(entry.session || "Other");
    sessionTotals.set(session, (sessionTotals.get(session) || 0) + signedAmount(entry));
  });
  const bestSession = [...sessionTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const grossProfit = state.entries.reduce((total, entry) => total + Math.max(0, signedAmount(entry)), 0);
  const grossLoss = Math.abs(state.entries.reduce((total, entry) => total + Math.min(0, signedAmount(entry)), 0));
  const winners = state.entries.filter((entry) => String(entry.result || "").toLowerCase() === "win");
  const mistakes = state.entries.filter((entry) => !/^no$/i.test(String(entry.mistakes || "No"))).length;

  const bestSessionEl = qs("#journalBestSession");
  const profitFactorEl = qs("#journalProfitFactor");
  const averageWinEl = qs("#journalAverageWin");
  const mistakeRateEl = qs("#journalMistakeRate");
  if (bestSessionEl) bestSessionEl.textContent = bestSession ? `${bestSession[0]} · ${formatCurrency(bestSession[1])}` : "—";
  if (profitFactorEl) profitFactorEl.textContent = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "—";
  if (averageWinEl) averageWinEl.textContent = winners.length
    ? formatCurrency(winners.reduce((total, entry) => total + Math.abs(signedAmount(entry)), 0) / winners.length)
    : "$0";
  if (mistakeRateEl) mistakeRateEl.textContent = state.entries.length
    ? `${Math.round((mistakes / state.entries.length) * 100)}%`
    : "—";
}

function updateDashboardStats() {
  const entries = state.entries || [];
  const outcomes = entries.filter((entry) => ["win", "loss", "be"].includes(String(entry.result || "").toLowerCase()));
  const wins = outcomes.filter((entry) => String(entry.result || "").toLowerCase() === "win").length;
  const confidenceRows = entries
    .map((entry) => num(entry.confidence, NaN))
    .filter(Number.isFinite);
  const net = entries.reduce((total, entry) => total + signedAmount(entry), 0);
  const averageConfidence = confidenceRows.length
    ? confidenceRows.reduce((total, value) => total + value, 0) / confidenceRows.length
    : null;

  const totalEl = qs("#journalTotalTrades");
  const winRateEl = qs("#journalWinRate");
  const netEl = qs("#journalNetPnl");
  const confidenceEl = qs("#journalAvgConfidence");

  if (totalEl) totalEl.textContent = String(entries.length);
  if (winRateEl) winRateEl.textContent = outcomes.length ? `${Math.round((wins / outcomes.length) * 100)}%` : "—";
  if (netEl) {
    netEl.textContent = formatCurrency(net);
    netEl.classList.toggle("is-positive", net > 0);
    netEl.classList.toggle("is-negative", net < 0);
  }
  if (confidenceEl) confidenceEl.textContent = averageConfidence === null ? "—" : `${Math.round(averageConfidence)}%`;
  renderAnalytics();
}

function openLoginPrompt() {
  const ov = qs("#loginPromptOverlay");
  if (!ov) return;
  ov.classList.add("open");
  document.body.style.overflow = "hidden";
  postEmbedHeight();
}

function closeLoginPrompt() {
  const ov = qs("#loginPromptOverlay");
  if (!ov) return;
  ov.classList.remove("open");
  document.body.style.overflow = "";
  postEmbedHeight();
}

function setJournalAccess(user) {
  const locked = !user;
  const root = document.documentElement;
  const workspace = qs(".wrap");
  const skeleton = qs("#journalLoadingSkeleton");
  root.classList.remove("tj-auth-pending");
  root.classList.toggle("tj-auth-required", locked);
  skeleton?.setAttribute("aria-hidden", "true");
  if (workspace) {
    if (locked) workspace.setAttribute("inert", "");
    else workspace.removeAttribute("inert");
  }
  if (locked) openLoginPrompt();
  else closeLoginPrompt();
}

function goLogin() {
  const win = window.top && window.top !== window ? window.top : window;
  win.location.href = `/login?next=${encodeURIComponent(nextUrl())}`;
}

function sortEntries(rows = []) {
  return [...rows].sort((a, b) => {
    const byCreated = tsMs(b.createdAt) - tsMs(a.createdAt);
    if (byCreated) return byCreated;
    const da = `${a.date || ""} ${a.time || ""}`.trim();
    const dbb = `${b.date || ""} ${b.time || ""}`.trim();
    return tsMs(dbb) - tsMs(da);
  });
}

function normalizeEntry(id, row = {}) {
  return {
    id,
    storage: String(row.storage || "collection"),
    uid: String(row.uid || "").trim(),
    email: String(row.email || "").trim(),
    date: String(row.date || "").trim(),
    session: String(row.session || "London").trim(),
    time: String(row.time || "").trim(),
    pair: String(row.pair || "").trim(),
    direction: String(row.direction || "Long").trim(),
    lots: String(row.lots || "1").trim(),
    tp: String(row.tp || "").trim(),
    sl: String(row.sl || "").trim(),
    entry: String(row.entry || "").trim(),
    confidence: String(row.confidence || "50").trim(),
    result: String(row.result || "Win").trim(),
    amount: String(row.amount || "").trim(),
    market: String(row.market || "").trim(),
    reasonExit: String(row.reasonExit || "").trim(),
    mistakes: String(row.mistakes || "No").trim(),
    notes: String(row.notes || "").trim(),
    imageUrl: String(row.imageUrl || "").trim(),
    imageName: String(row.imageName || "").trim(),
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null
  };
}

function journalRef(uid = "") {
  return doc(db, "users", String(uid || "").trim());
}

function journalId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `tj_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readUserJournalMap(uid = "") {
  if (!uid) return {};
  const snap = await getDoc(journalRef(uid));
  const data = snap.exists() ? (snap.data() || {}) : {};
  const map = data[USER_JOURNAL_FIELD];
  return map && typeof map === "object" ? { ...map } : {};
}

async function loadUserJournalEntries(uid = "") {
  const map = await readUserJournalMap(uid);
  return Object.entries(map).map(([id, row]) => normalizeEntry(id, { ...(row || {}), storage: "userDoc" }));
}

async function saveUserJournalEntry(uid, entry) {
  const map = await readUserJournalMap(uid);
  const id = journalId();
  map[id] = {
    ...entry,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(journalRef(uid), {
    [USER_JOURNAL_FIELD]: map,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return id;
}

async function removeUserJournalEntry(uid, id) {
  const map = await readUserJournalMap(uid);
  if (!map[id]) return;
  delete map[id];
  await setDoc(journalRef(uid), {
    [USER_JOURNAL_FIELD]: map,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function readForm() {
  return {
    date: qs("#date")?.value || "",
    session: qs("#session")?.value || "London",
    time: qs("#time")?.value || "",
    pair: qs("#pair")?.value || "",
    direction: qs("#direction")?.value || "Long",
    lots: qs("#lots")?.value || "1",
    tp: qs("#tp")?.value || "",
    sl: qs("#sl")?.value || "",
    entry: qs("#entry")?.value || "",
    confidence: qs("#confidence")?.value || "50",
    result: qs("#result")?.value || "Win",
    amount: qs("#amount")?.value || "",
    market: qs("#market")?.value || "",
    reasonExit: qs("#reasonExit")?.value || "",
    mistakes: qs("#mistakes")?.value || "No",
    notes: qs("#notes")?.value || ""
  };
}

function resetForm() {
  qsa("#journalForm input, #journalForm select, #journalForm textarea").forEach((el) => {
    if (el.type === "file") el.value = "";
    else if (el.tagName === "SELECT") el.selectedIndex = 0;
    else if (el.id === "lots") el.value = "1";
    else if (el.id === "confidence") el.value = "50";
    else el.value = "";
  });
  setDefaultDateTime();
}

function setDefaultDateTime() {
  const now = new Date();
  const date = qs("#date");
  const time = qs("#time");
  if (date && !date.value) {
    const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    date.value = local.toISOString().slice(0, 10);
  }
  if (time && !time.value) {
    time.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
}

function setTableMessage(msg) {
  const tbody = qs("#tradesTable tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="15" style="padding:16px 12px;color:#9ca3af">${esc(msg)}</td></tr>`;
  postEmbedHeight();
}

function renderTrades() {
  const tbody = qs("#tradesTable tbody");
  if (!tbody) return;
  updateDashboardStats();
  if (!state.user) {
    setTableMessage("Login to load and sync your trade journal.");
    return;
  }
  if (!state.entries.length) {
    setTableMessage("No trades yet. Add your first trade.");
    return;
  }
  const visibleEntries = filteredEntries();
  if (!visibleEntries.length) {
    setTableMessage("No trades match the selected search and filters.");
    return;
  }
  tbody.innerHTML = visibleEntries.map((t) => `
    <tr>
      <td>${esc(t.date || "-")}</td>
      <td>${esc(t.session || "-")}</td>
      <td>${esc(t.time || "-")}</td>
      <td>${esc(t.pair || "-")}</td>
      <td>${esc(t.direction || "-")}</td>
      <td>${esc(t.lots || "-")}</td>
      <td>${esc(t.tp || "-")}</td>
      <td>${esc(t.sl || "-")}</td>
      <td>${esc(t.entry || "-")}</td>
      <td>${esc(t.confidence || "-")}</td>
      <td><span class="result-pill result-${esc(String(t.result || "").toLowerCase())}">${esc(t.result || "-")}</span></td>
      <td class="amount-cell ${signedAmount(t) > 0 ? "is-positive" : signedAmount(t) < 0 ? "is-negative" : ""}">${formatCurrency(signedAmount(t))}</td>
      <td>${esc(t.notes || "-")}</td>
      <td>${t.imageUrl ? `<a href="${esc(t.imageUrl)}" target="_blank" rel="noopener"><img fetchpriority="low" decoding="async" class="img-thumb" src="${esc(t.imageUrl)}" alt="${esc(t.imageName || "setup")}" loading="lazy"></a>` : "-"}</td>
      <td>
        <div class="row-actions">
          <button class="row-pdf" data-pdf="${esc(t.id)}" aria-label="Download this trade as PDF">PDF</button>
          <button class="download-small" data-delete="${esc(t.id)}" aria-label="Delete this trade">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
  qsa("[data-pdf]").forEach((btn) => {
    btn.onclick = async () => {
      const id = String(btn.getAttribute("data-pdf") || "").trim();
      const row = state.entries.find((entry) => entry.id === id);
      if (!row) return;
      await exportTradesPdf([row], {
        filename: `trade-${String(row.pair || "journal").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${row.date || "report"}.pdf`,
        button: btn
      });
    };
  });
  qsa("[data-delete]").forEach((btn) => {
    btn.onclick = async () => {
      if (!state.user) {
        openLoginPrompt();
        return;
      }
      const id = String(btn.getAttribute("data-delete") || "").trim();
      if (!id || !window.confirm("Delete this trade?")) return;
      try {
        const row = state.entries.find((x) => x.id === id);
        if (row?.storage === "userDoc") await removeUserJournalEntry(state.user.uid, id);
        else await deleteDoc(doc(db, TRADE_JOURNAL_COLLECTION, id));
        state.entries = state.entries.filter((x) => x.id !== id);
        renderTrades();
        setSyncStatus(`Synced ${state.entries.length} trade${state.entries.length === 1 ? "" : "s"}`);
      } catch (e) {
        alert(e?.message || "Delete failed.");
      }
    };
  });
  postEmbedHeight();
}

async function uploadImage(file) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Image uploads are not configured. Add Cloudinary values in trade-journal-config.js.");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  fd.append("folder", "rmp/trade-journal");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: fd
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || "Image upload failed.");
  return String(j.secure_url || "");
}

async function loadEntries() {
  if (!state.user?.uid) {
    state.entries = [];
    renderTrades();
    setSyncStatus("Login required", false);
    return;
  }
  setTableMessage("Loading trades...");
  try {
    let rows = [];
    try {
      const snap = await getDocs(query(collection(db, TRADE_JOURNAL_COLLECTION), where("uid", "==", state.user.uid), limit(1000)));
      snap.forEach((d) => rows.push(normalizeEntry(d.id, { ...(d.data() || {}), storage: "collection" })));
    } catch (_) {}
    try {
      const userRows = await loadUserJournalEntries(state.user.uid);
      const seen = new Set(rows.map((row) => row.id));
      userRows.forEach((row) => {
        if (!seen.has(row.id)) rows.push(row);
      });
    } catch (_) {}
    state.entries = sortEntries(rows);
    renderTrades();
    setSyncStatus(`Synced ${state.entries.length} trade${state.entries.length === 1 ? "" : "s"}`);
  } catch (e) {
    setTableMessage("Failed to load trades.");
    setSyncStatus("Sync failed", false);
  }
}

function toCSV(items = []) {
  const head = ["Date", "Session", "Time", "Pair", "Direction", "Lots", "TP", "SL", "Entry", "Confidence", "Result", "Amount", "Market", "ReasonExit", "Mistakes", "Notes"];
  const rows = items.map((t) => [
    t.date, t.session, t.time, t.pair, t.direction, t.lots, t.tp, t.sl, t.entry,
    t.confidence, t.result, t.amount, t.market, t.reasonExit, t.mistakes, t.notes
  ]);
  return [head, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

function download(name, data, type) {
  const blob = new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function pdfSafe(value = "") {
  return String(value ?? "")
    .replace(/[–—−]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function drawPdfPageHeader(pdf, eyebrow, title) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, width, height, "F");
  pdf.setFillColor(21, 17, 42);
  pdf.rect(0, 0, width, 78, "F");
  pdf.setFillColor(124, 104, 255);
  pdf.rect(0, 0, 8, 78, "F");
  pdf.setTextColor(170, 158, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(pdfSafe(eyebrow).toUpperCase(), 42, 28);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text(pdfSafe(title), 42, 53);
}

function drawPdfSummaryCell(pdf, x, y, width, label, value) {
  pdf.setFillColor(248, 247, 252);
  pdf.setDrawColor(231, 228, 240);
  pdf.roundedRect(x, y, width, 45, 6, 6, "FD");
  pdf.setTextColor(117, 111, 132);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.text(pdfSafe(label).toUpperCase(), x + 10, y + 15);
  pdf.setTextColor(31, 27, 43);
  pdf.setFontSize(10);
  const valueLines = pdf.splitTextToSize(pdfSafe(value || "-"), width - 20);
  pdf.text(valueLines.slice(0, 2), x + 10, y + 31);
}

function writePdfTextSection(pdf, title, value, y, continuedTitle) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const width = pdf.internal.pageSize.getWidth();
  const margin = 42;
  const textWidth = width - (margin * 2);
  let lines = pdf.splitTextToSize(pdfSafe(value || "Not recorded"), textWidth - 20);
  let firstChunk = true;

  while (lines.length) {
    if (y > pageHeight - 90) {
      pdf.addPage();
      drawPdfPageHeader(pdf, "TRADE REVIEW CONTINUED", continuedTitle);
      y = 104;
    }
    pdf.setTextColor(105, 96, 128);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(pdfSafe(firstChunk ? title : `${title} - continued`).toUpperCase(), margin, y);
    y += 13;

    const availableLines = Math.max(1, Math.floor((pageHeight - 58 - y) / 13));
    const chunk = lines.splice(0, availableLines);
    pdf.setTextColor(49, 44, 61);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(chunk, margin, y, { lineHeightFactor: 1.42 });
    y += (chunk.length * 13) + 15;
    firstChunk = false;
  }
  return y;
}

async function imageUrlToJpeg(url) {
  if (!url) return null;
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error("Screenshot download failed.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error("Screenshot could not be decoded."));
      node.src = objectUrl;
    });
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.9),
      width: canvas.width,
      height: canvas.height
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function coverMetricData(entries = []) {
  const outcomes = entries.filter((entry) => ["win", "loss", "be"].includes(String(entry.result || "").toLowerCase()));
  const wins = outcomes.filter((entry) => String(entry.result || "").toLowerCase() === "win").length;
  const net = entries.reduce((total, entry) => total + signedAmount(entry), 0);
  const confidence = entries.map((entry) => num(entry.confidence, NaN)).filter(Number.isFinite);
  return [
    ["TOTAL TRADES", String(entries.length)],
    ["WIN RATE", outcomes.length ? `${Math.round((wins / outcomes.length) * 100)}%` : "-"],
    ["NET P&L", formatCurrency(net)],
    ["AVG. CONFIDENCE", confidence.length ? `${Math.round(confidence.reduce((a, b) => a + b, 0) / confidence.length)}%` : "-"]
  ];
}

function drawPdfCover(pdf, entries = []) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(249, 248, 252);
  pdf.rect(0, 0, width, height, "F");
  pdf.setFillColor(22, 18, 44);
  pdf.rect(0, 0, width, 246, "F");
  pdf.setFillColor(126, 104, 255);
  pdf.circle(width - 70, 42, 94, "F");
  pdf.setFillColor(22, 18, 44);
  pdf.circle(width - 43, 28, 83, "F");

  pdf.setTextColor(169, 157, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("RANK MY PROP - PERFORMANCE REPORT", 42, 54);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(31);
  pdf.text("Trade Journal", 42, 103);
  pdf.setFontSize(31);
  pdf.text("Performance Report", 42, 141);
  pdf.setTextColor(190, 185, 207);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("A complete record of execution, risk, psychology and setup screenshots.", 42, 172);
  pdf.setFontSize(8);
  pdf.text(`Generated ${new Date().toLocaleString("en-US")}  |  ${pdfSafe(state.user?.email || "Rank My Prop trader")}`, 42, 202);

  const metrics = coverMetricData(entries);
  const gap = 10;
  const cardWidth = (width - 84 - (gap * 3)) / 4;
  metrics.forEach(([label, value], index) => {
    const x = 42 + (index * (cardWidth + gap));
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(231, 228, 240);
    pdf.roundedRect(x, 280, cardWidth, 74, 7, 7, "FD");
    pdf.setTextColor(117, 111, 132);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text(label, x + 12, 302);
    pdf.setTextColor(34, 29, 48);
    pdf.setFontSize(16);
    pdf.text(pdfSafe(value), x + 12, 332);
  });

  pdf.setTextColor(38, 33, 51);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("What is included", 42, 407);
  const inclusions = [
    "Complete execution and risk details for every saved trade",
    "Entry thesis, exit reasoning, mistakes and journal notes",
    "Original setup screenshots embedded with their trade",
    "Clean page breaks, report date and page numbering"
  ];
  inclusions.forEach((item, index) => {
    const y = 442 + (index * 34);
    pdf.setFillColor(126, 104, 255);
    pdf.circle(48, y - 3, 3, "F");
    pdf.setTextColor(76, 69, 91);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(item, 60, y);
  });

  pdf.setFillColor(243, 241, 249);
  pdf.roundedRect(42, 610, width - 84, 104, 8, 8, "F");
  pdf.setTextColor(105, 96, 128);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("REPORT NOTE", 58, 638);
  pdf.setTextColor(62, 56, 75);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const note = entries.length
    ? `This report contains ${entries.length} saved trade${entries.length === 1 ? "" : "s"}. Each trade begins on a fresh page so screenshots and notes remain easy to review.`
    : "No saved trades were available when this report was generated.";
  pdf.text(pdf.splitTextToSize(note, width - 116), 58, 661, { lineHeightFactor: 1.5 });
}

async function drawTradePdfPages(pdf, trade, index, total) {
  pdf.addPage();
  const title = `${trade.pair || "Trade"} - ${trade.date || "Undated"}`;
  drawPdfPageHeader(pdf, `TRADE ${index + 1} OF ${total}`, title);
  const width = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 42;
  let y = 104;

  const fields = [
    ["Date", trade.date], ["Time", trade.time], ["Session", trade.session],
    ["Market / pair", trade.pair], ["Direction", trade.direction], ["Position size", trade.lots],
    ["Entry", trade.entry], ["Stop loss", trade.sl], ["Take profit", trade.tp],
    ["Result", trade.result], ["P&L amount", formatCurrency(signedAmount(trade))], ["Confidence", `${trade.confidence || "-"}%`]
  ];
  const gap = 9;
  const columnWidth = (width - (margin * 2) - (gap * 2)) / 3;
  fields.forEach(([label, value], fieldIndex) => {
    const column = fieldIndex % 3;
    const row = Math.floor(fieldIndex / 3);
    drawPdfSummaryCell(pdf, margin + (column * (columnWidth + gap)), y + (row * 54), columnWidth, label, value);
  });
  y += 230;

  y = writePdfTextSection(pdf, "Market condition / entry reason", trade.market, y, title);
  y = writePdfTextSection(pdf, "Reason for exit", trade.reasonExit, y, title);
  y = writePdfTextSection(pdf, "Execution review / mistake", trade.mistakes, y, title);
  y = writePdfTextSection(pdf, "Journal notes", trade.notes, y, title);

  if (trade.imageUrl) {
    let screenshot = null;
    try {
      screenshot = await imageUrlToJpeg(trade.imageUrl);
    } catch (_) {}
    if (screenshot) {
      const maxImageWidth = width - (margin * 2);
      const maxImageHeight = 320;
      const imageScale = Math.min(
        maxImageWidth / screenshot.width,
        maxImageHeight / screenshot.height
      );
      const imageWidth = screenshot.width * imageScale;
      const imageHeight = screenshot.height * imageScale;
      const imageX = margin + ((maxImageWidth - imageWidth) / 2);
      let screenshotPage = false;
      if (y + imageHeight + 42 > pageHeight - 46) {
        pdf.addPage();
        drawPdfPageHeader(pdf, `TRADE ${index + 1} OF ${total}`, `${trade.pair || "Trade"} setup screenshot`);
        y = 108;
        screenshotPage = true;
      }
      if (!screenshotPage) {
        pdf.setTextColor(105, 96, 128);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text("SETUP SCREENSHOT", margin, y);
        y += 15;
      }
      pdf.setDrawColor(226, 222, 237);
      pdf.roundedRect(imageX - 1, y - 1, imageWidth + 2, imageHeight + 2, 5, 5, "S");
      pdf.addImage(screenshot.dataUrl, "JPEG", imageX, y, imageWidth, imageHeight, undefined, "FAST");
    } else {
      y = writePdfTextSection(pdf, "Setup screenshot", "The saved screenshot could not be embedded in this export.", y, title);
    }
  } else {
    y = writePdfTextSection(pdf, "Setup screenshot", "No screenshot was attached to this trade.", y, title);
  }
}

function addPdfFooters(pdf) {
  const pages = pdf.getNumberOfPages();
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(230, 227, 238);
    pdf.line(42, height - 34, width - 42, height - 34);
    pdf.setTextColor(130, 124, 143);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text("Rank My Prop Trade Journal", 42, height - 18);
    pdf.text(`Page ${page} of ${pages}`, width - 42, height - 18, { align: "right" });
  }
}

async function exportTradesPdf(entries = [], options = {}) {
  if (!state.user) {
    openLoginPrompt();
    return;
  }
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    alert("PDF export is unavailable right now. Please refresh and try again.");
    return;
  }

  const buttons = options.button
    ? [options.button]
    : [qs("#exportPdfAllBtn"), qs("#exportPdfAllBtn_bottom")].filter(Boolean);
  const labels = new Map(buttons.map((button) => [button, button.textContent]));
  buttons.forEach((button) => {
    button.disabled = true;
    button.textContent = "Preparing PDF...";
  });

  try {
    const pdf = await buildTradesPdfDocument(entries, jsPDF);
    const filename = options.filename || `rank-my-prop-trade-journal-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } catch (error) {
    alert(error?.message || "The PDF could not be created. Please try again.");
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
      button.textContent = labels.get(button) || "Download PDF";
    });
  }
}

async function buildTradesPdfDocument(entries, JsPdfConstructor) {
  const pdf = new JsPdfConstructor({ unit: "pt", format: "a4", compress: true });
  drawPdfCover(pdf, entries);
  for (let index = 0; index < entries.length; index += 1) {
    await drawTradePdfPages(pdf, entries[index], index, entries.length);
  }
  addPdfFooters(pdf);
  return pdf;
}

async function exportAllPdf() {
  await exportTradesPdf(state.entries);
}

async function addTrade(e) {
  e?.preventDefault?.();
  if (state.busy) return;
  if (!state.user) {
    openLoginPrompt();
    return;
  }
  state.busy = true;
  const btn = qs("#addTradeBtn");
  const old = btn?.textContent || "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Saving...";
  }
  setSyncStatus("Saving...", false);
  try {
    const payload = readForm();
    if (!payload.date || !payload.pair.trim()) {
      throw new Error("Add the trade date and market / pair before saving.");
    }
    const file = qs("#setupImage")?.files?.[0] || null;
    let imageUrl = "";
    let imageName = "";
    if (file) {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");
      imageUrl = await uploadImage(file);
      imageName = String(file.name || "").trim();
    }
    const entry = {
      ...payload,
      imageUrl,
      imageName,
      uid: state.user.uid,
      email: state.user.email || ""
    };
    try {
      await addDoc(collection(db, TRADE_JOURNAL_COLLECTION), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      await saveUserJournalEntry(state.user.uid, entry);
    }
    resetForm();
    await loadEntries();
  } catch (e2) {
    alert(e2?.message || "Trade save failed.");
    setSyncStatus("Save failed", false);
  } finally {
    state.busy = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = old || "+ Add Trade";
    }
  }
}

function bind() {
  if (EMBED_MODE) document.body.classList.add("embed-mode");
  setDefaultDateTime();

  qs("#heroAddTradeBtn")?.addEventListener("click", (e) => {
    if (state.user) return;
    e.preventDefault();
    openLoginPrompt();
  });
  qs("#addTradeBtn")?.addEventListener("click", addTrade);
  qs("#resetBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    resetForm();
  });
  qs("#exportCsvBtn")?.addEventListener("click", () => {
    if (!state.user) {
      openLoginPrompt();
      return;
    }
    download("trade-journal.csv", toCSV(state.entries), "text/csv;charset=utf-8");
  });
  qs("#exportExcelBtn")?.addEventListener("click", () => {
    if (!state.user) {
      openLoginPrompt();
      return;
    }
    download("trade-journal.xls", toCSV(state.entries), "application/vnd.ms-excel");
  });
  qs("#exportPdfAllBtn")?.addEventListener("click", exportAllPdf);
  qs("#exportPdfAllBtn_bottom")?.addEventListener("click", exportAllPdf);
  qs("#tradeSearch")?.addEventListener("input", (event) => {
    state.filters.search = event.target?.value || "";
    renderTrades();
  });
  qs("#tradeResultFilter")?.addEventListener("change", (event) => {
    state.filters.result = event.target?.value || "all";
    renderTrades();
  });
  qs("#tradePeriodFilter")?.addEventListener("change", (event) => {
    state.filters.period = event.target?.value || "all";
    renderTrades();
  });
  qsa("[data-chart-range]").forEach((button) => {
    button.addEventListener("click", () => {
      state.chartRange = button.getAttribute("data-chart-range") || "day";
      qsa("[data-chart-range]").forEach((item) => item.classList.toggle("active", item === button));
      renderAnalytics();
    });
  });

  qs("#loginPromptClose")?.addEventListener("click", closeLoginPrompt);
  qs("#loginPromptGo")?.addEventListener("click", goLogin);
  qs("#loginPromptOverlay")?.addEventListener("click", (e) => {
    if (state.user && e.target?.id === "loginPromptOverlay") closeLoginPrompt();
  });

  window.addEventListener("resize", postEmbedHeight);
}

async function initAuth() {
  onAuthStateChanged(auth, async (u) => {
    state.user = u || null;
    setJournalAccess(state.user);
    if (!state.user) {
      state.entries = [];
      renderTrades();
      setSyncStatus("Login required", false);
      return;
    }
    await loadEntries();
  });
}

bind();
initAuth();
setTimeout(postEmbedHeight, 150);
