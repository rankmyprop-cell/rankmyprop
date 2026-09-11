import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./dashboard-common.js";
const ALT_COLLECTION = "pageCopy";
const ALT_PREFIX = "giveaway__";
const ALT_ACTIVE_DOC = `${ALT_PREFIX}active`;

const FALLBACK = {
  id: "gw_001",
  title: "Prop Firm Giveaways & Trading Rewards",
  subtitle: "Join active Rank My Prop giveaways, funded account rewards, and trader community offers.",
  badgeLabel: "Giveaway",
  status: "active",
  prize: {
    count: 3,
    amount: 10000,
    currency: "USD",
    provider: "Rank My Prop",
    description: "Three lucky traders will each receive a fully funded $10,000 evaluation account from Rank My Prop.",
    iconText: "GW"
  },
  dates: {
    startDate: "2026-05-01T00:00:00Z",
    endDate: "2026-05-20T23:59:00Z",
    announcementDate: "2026-05-22T00:00:00Z"
  },
  totalWinners: 3,
  cta: {
    label: "Join Now and Get a Chance to Win",
    url: "https://instagram.com/rankmyprop.hq"
  },
  rules: [
    { id: "r1", text: "Follow @rankmyprop.hq on Instagram", required: true, link: "https://instagram.com/rankmyprop.hq" },
    { id: "r2", text: "Like this post", required: true, link: "https://instagram.com/rankmyprop.hq" },
    { id: "r3", text: "Tag 2 trading buddies in the comments", required: true, link: "https://instagram.com/rankmyprop.hq" },
    { id: "r4", text: "Share this post to your story and mention us", required: true, link: "https://instagram.com/rankmyprop.hq" },
    { id: "r5", text: "Make sure your profile is public", required: true }
  ],
  entrySteps: [
    { id: "s1", label: "Follow on Instagram", completed: true, link: "https://instagram.com/rankmyprop.hq" },
    { id: "s2", label: "Like this post", completed: true, link: "https://instagram.com/rankmyprop.hq" },
    { id: "s3", label: "Tag 2 friends", completed: true, link: "https://instagram.com/rankmyprop.hq" },
    { id: "s4", label: "Share to your story", completed: false, link: "https://instagram.com/rankmyprop.hq" },
    { id: "s5", label: "Profile must be public", completed: false }
  ],
  notices: {
    fairPlay: {
      title: "Fair and Transparent",
      description: "Winners will be picked randomly and announced publicly."
    },
    important: {
      title: "Important",
      description: "Fake accounts, spam, and incomplete entries will be disqualified."
    }
  },
  winners: [
    { id: "w1", username: "@trader_aman", amount: 10000, date: "2026-04-01" },
    { id: "w2", username: "@market_maverick", amount: 10000, date: "2026-04-01" },
    { id: "w3", username: "@pips_hunter", amount: 10000, date: "2026-04-01" }
  ],
  sectionTitles: {
    whatYouCanWin: "What You Can Win",
    howToEnter: "How to Enter",
    details: "Giveaway Details",
    entryProgress: "Entry Progress",
    previousWinners: "Previous Winners",
    previousWinnersNote: "Congrats to our recent winners.",
    viewAllWinners: "View All Winners"
  }
};

const STATUS_RANK = { active: 0, scheduled: 1, draft: 2, ended: 3, inactive: 4 };

function esc(v = "") {
  return String(v).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function toDateIso(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  return "";
}

function toTs(v) {
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  const iso = toDateIso(v);
  const d = Date.parse(iso);
  return Number.isFinite(d) ? d : 0;
}

function statusOf(v = "") {
  const s = String(v || "active").trim().toLowerCase();
  return STATUS_RANK[s] == null ? "active" : s;
}

function safeUrl(url = "") {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
  return "";
}

function fmtDate(iso) {
  const v = Date.parse(String(iso || ""));
  if (!Number.isFinite(v)) return "-";
  return new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(iso) {
  const v = Date.parse(String(iso || ""));
  if (!Number.isFinite(v)) return "-";
  const d = new Date(v);
  return `${d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC`;
}

function fmtMoney(amount, currency = "USD") {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return "$0";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: String(currency || "USD").toUpperCase(), maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${n.toLocaleString("en-US")}`;
  }
}

function parseMarkdownLinks(raw = "", cls = "step-link") {
  const input = String(raw || "");
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(input))) {
    out += esc(input.slice(last, m.index));
    const label = esc(m[1]);
    const url = safeUrl(m[2]);
    out += url ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : esc(m[0]);
    last = m.index + m[0].length;
  }
  out += esc(input.slice(last));
  return out;
}

function richText(item = {}, cls = "step-link") {
  const inline = String(item.html || "").trim();
  if (inline) {
    const clean = inline.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
    return clean;
  }
  const text = String(item.text || item.label || "").trim();
  if (!text) return "-";
  const withMd = parseMarkdownLinks(text, cls);
  if (/href=/i.test(withMd)) return withMd;
  const url = safeUrl(item.link || item.url || "");
  if (!url) return withMd;
  return `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${withMd}</a>`;
}

function setLoading(on) {
  document.body.classList.toggle("gw-loading", Boolean(on));
}

function normalizeList(arr) {
  return Array.isArray(arr) ? arr.filter(Boolean) : [];
}

function normalizeGiveaway(row = {}, id = "", isFallback = false) {
  const data = { ...row };
  const dates = data.dates || {};
  const prize = data.prize || {};
  const notices = data.notices || {};
  const sectionTitles = data.sectionTitles || {};

  const winners = normalizeList(data.winners?.length ? data.winners : data.previousWinners);
  const rules = normalizeList(data.rules);
  const entrySteps = normalizeList(data.entrySteps);
  const status = statusOf(data.status || (isFallback ? "ended" : "active"));
  const updatedTs = toTs(data.updatedAt) || toTs(data.createdAt);
  const endTs = Date.parse(String(toDateIso(dates.endDate) || ""));

  return {
    id: String(data.id || id || `gw-${Math.random().toString(36).slice(2)}`),
    title: String(data.title || "Giveaway"),
    subtitle: String(data.subtitle || ""),
    badgeLabel: String(data.badgeLabel || "Giveaway"),
    status,
    prize: {
      count: Number(prize.count || 1) || 1,
      amount: Number(prize.amount || 0) || 0,
      currency: String(prize.currency || "USD"),
      provider: String(prize.provider || "Rank My Prop"),
      description: String(prize.description || ""),
      iconText: String(prize.iconText || "GW"),
      iconUrl: String(prize.iconUrl || "")
    },
    dates: {
      startDate: toDateIso(dates.startDate),
      endDate: toDateIso(dates.endDate),
      announcementDate: toDateIso(dates.announcementDate)
    },
    totalWinners: Number(data.totalWinners || winners.length || prize.count || 0) || 0,
    cta: {
      label: String((data.cta || {}).label || data.ctaLabel || "Join Now and Get a Chance to Win"),
      url: String((data.cta || {}).url || data.ctaUrl || "")
    },
    rules,
    entrySteps,
    winners,
    notices: {
      fairPlay: {
        title: String((notices.fairPlay || {}).title || "Fair and Transparent"),
        description: String((notices.fairPlay || {}).description || "Winners will be picked randomly and announced publicly.")
      },
      important: {
        title: String((notices.important || {}).title || "Important"),
        description: String((notices.important || {}).description || "Fake accounts, spam, and incomplete entries will be disqualified.")
      }
    },
    sectionTitles: {
      whatYouCanWin: String(sectionTitles.whatYouCanWin || "What You Can Win"),
      howToEnter: String(sectionTitles.howToEnter || "How to Enter"),
      details: String(sectionTitles.details || "Giveaway Details"),
      entryProgress: String(sectionTitles.entryProgress || "Entry Progress"),
      previousWinners: String(sectionTitles.previousWinners || "Previous Winners"),
      previousWinnersNote: String(sectionTitles.previousWinnersNote || "Congrats to our recent winners."),
      viewAllWinners: String(sectionTitles.viewAllWinners || "View All Winners")
    },
    sortTs: Number.isFinite(endTs) ? endTs : updatedTs
  };
}

function rowWinner(w = {}) {
  const avatar = String(w.avatarUrl || "").trim();
  const username = String(w.username || "Anonymous");
  const amount = fmtMoney(w.amount || 0);
  const profile = safeUrl(w.profileUrl || w.profile || "");
  const nameHtml = profile
    ? `<a class="progress-link" href="${esc(profile)}" target="_blank" rel="noopener noreferrer">${esc(username)}</a>`
    : esc(username);
  return `<div class="winner-row"><div class="winner-info"><div class="winner-avatar">${avatar ? `<img fetchpriority="high" loading="eager" decoding="async" src="${esc(avatar)}" alt="${esc(username)}">` : esc(username.slice(0, 2).toUpperCase())}</div><div>${nameHtml}</div></div><div class="winner-amount">${esc(amount)}</div></div>`;
}

function pickCurrent(all = [], forcedId = "") {
  const q = new URLSearchParams(window.location.search);
  const requested = String(q.get("id") || "").trim();
  if (requested) {
    const found = all.find((g) => g.id === requested);
    if (found) return found;
  }
  if (forcedId) {
    const forced = all.find((g) => String(g.id) === String(forcedId));
    if (forced) return forced;
  }
  return all.find((g) => g.status === "active") || all[0] || null;
}

function renderPast(all = [], currentId = "") {
  const el = document.getElementById("pastGiveaways");
  if (!el) return;
  const past = all.filter((g) => g.id !== currentId);
  if (!past.length) {
    el.innerHTML = `<div class="congrats-text">No past giveaways yet.</div>`;
    return;
  }
  el.innerHTML = past.map((g) => `<a class="past-link" href="giveaways.html?id=${encodeURIComponent(g.id)}"><div>${esc(g.title)}</div><small>${esc(fmtDate(g.dates.endDate))} · ${esc(g.status)}</small></a>`).join("");
}

function render(g = {}) {
  document.getElementById("gwBadge").innerHTML = `<span class="badge-dot"></span> ${esc(g.badgeLabel || "Giveaway")}`;
  document.getElementById("gwTitle").textContent = g.title || "Giveaway";
  document.getElementById("gwSub").textContent = g.subtitle || "";

  document.getElementById("headingWin").textContent = g.sectionTitles.whatYouCanWin;
  document.getElementById("headingEnter").textContent = g.sectionTitles.howToEnter;
  document.getElementById("headingDetails").textContent = g.sectionTitles.details;
  document.getElementById("headingProgress").textContent = g.sectionTitles.entryProgress;
  document.getElementById("headingWinners").textContent = g.sectionTitles.previousWinners;
  document.getElementById("winnersText").textContent = g.sectionTitles.previousWinnersNote;

  document.getElementById("prizeAmount").textContent = `${g.prize.count} x ${fmtMoney(g.prize.amount, g.prize.currency)}`;
  document.getElementById("prizeLabel").textContent = `${g.prize.provider} Accounts`;
  document.getElementById("prizeDesc").textContent = g.prize.description || "";

  const iconEl = document.getElementById("prizeIcon");
  const iconUrl = safeUrl(g.prize.iconUrl);
  iconEl.innerHTML = iconUrl ? `<img fetchpriority="low" loading="lazy" decoding="async" src="${esc(iconUrl)}" alt="${esc(g.prize.provider)}">` : esc(g.prize.iconText || "GW");

  document.getElementById("endDate").textContent = fmtDateTime(g.dates.endDate);
  document.getElementById("fairTitle").textContent = g.notices.fairPlay.title;
  document.getElementById("fairDesc").textContent = g.notices.fairPlay.description;
  document.getElementById("impTitle").textContent = g.notices.important.title;
  document.getElementById("impDesc").textContent = g.notices.important.description;

  document.getElementById("steps").innerHTML = g.rules.map((r) => `
    <div class="step">
      <div class="step-check">${r.required === false ? "-" : "OK"}</div>
      <div>${richText(r, "step-link")}</div>
    </div>
  `).join("");

  document.getElementById("dPrize").textContent = `${g.prize.count} x ${fmtMoney(g.prize.amount, g.prize.currency)} Accounts`;
  document.getElementById("dProvider").textContent = g.prize.provider;
  document.getElementById("dWinners").textContent = String(g.totalWinners || 0);
  document.getElementById("dEnd").textContent = fmtDate(g.dates.endDate);
  document.getElementById("dAnn").textContent = fmtDate(g.dates.announcementDate);

  document.getElementById("progressItems").innerHTML = g.entrySteps.map((s) => `
    <div class="progress-item">
      <div class="p-check ${s.completed ? "done" : "todo"}">${s.completed ? "OK" : ""}</div>
      <div>${richText(s, "progress-link")}</div>
    </div>
  `).join("");

  const done = g.entrySteps.filter((s) => Boolean(s.completed)).length;
  const pct = g.entrySteps.length ? Math.round((done / g.entrySteps.length) * 100) : 0;
  document.getElementById("progressFill").style.width = `${pct}%`;
  document.getElementById("progressLabel").textContent = `${pct}%`;

  const winners = g.winners || [];
  document.getElementById("winnerRows").innerHTML = winners.slice(0, 3).map(rowWinner).join("") || `<div class="congrats-text">No winners announced yet.</div>`;

  const modalList = document.getElementById("allWinnersList");
  modalList.innerHTML = winners.length
    ? winners.map((w) => `${rowWinner(w)}<div class="congrats-text" style="margin:0 0 8px 38px;">${esc(fmtDate(w.date))}</div>`).join("")
    : `<div class="congrats-text">No winners announced yet.</div>`;

  const viewAllBtn = document.getElementById("viewAllWinnersBtn");
  viewAllBtn.innerHTML = `${esc(g.sectionTitles.viewAllWinners)} <span>&gt;</span>`;

  const ctaBtn = document.getElementById("gwCta");
  ctaBtn.textContent = g.cta.label || "Join Now and Get a Chance to Win";
  const ctaUrl = safeUrl(g.cta.url);
  ctaBtn.disabled = !ctaUrl;
  ctaBtn.style.opacity = ctaUrl ? "1" : ".55";
  ctaBtn.onclick = () => {
    if (!ctaUrl) return;
    window.open(ctaUrl, "_blank", "noopener,noreferrer");
  };

  const modal = document.getElementById("winnersModal");
  const closeBtn = document.getElementById("winnersModalClose");
  const close = () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); };
  viewAllBtn.onclick = () => { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); };
  closeBtn.onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  setLoading(false);
}

async function loadGiveaways() {
  setLoading(true);
  let rows = [];
  let primaryErr = null;
  let altErr = null;
  let forcedActiveId = "";
  const primaryRows = [];
  const altRows = [];
  try {
    const snap = await getDocs(collection(db, "giveaways"));
    snap.forEach((d) => primaryRows.push(normalizeGiveaway({ id: d.id, ...d.data() }, d.id, false)));
  } catch (err) {
    primaryErr = err;
  }

  try {
    const altSnap = await getDocs(collection(db, ALT_COLLECTION));
    altSnap.forEach((d) => {
      const raw = d.data() || {};
      if (d.id === ALT_ACTIVE_DOC || String(raw.type || "").toLowerCase() === "giveaway_active") {
        forcedActiveId = String(raw.activeId || "").trim();
        return;
      }
      const marked = String(raw.type || "").toLowerCase() === "giveaway";
      const hasPrefix = String(d.id || "").startsWith(ALT_PREFIX);
      if (!marked && !hasPrefix) return;
      const data = raw?.giveaway && typeof raw.giveaway === "object" ? raw.giveaway : raw;
      const gwId = String(data.id || String(d.id || "").replace(ALT_PREFIX, "") || "").trim();
      altRows.push(normalizeGiveaway({ id: gwId, ...data }, gwId, false));
    });
  } catch (err) {
    altErr = err;
  }

  if (primaryRows.length || altRows.length) {
    const byId = new Map();
    primaryRows.forEach((r) => byId.set(String(r.id), r));
    altRows.forEach((r) => {
      const key = String(r.id);
      const cur = byId.get(key);
      if (!cur) {
        byId.set(key, r);
        return;
      }
      byId.set(key, {
        ...cur,
        ...r,
        prize: { ...(cur.prize || {}), ...(r.prize || {}) },
        dates: { ...(cur.dates || {}), ...(r.dates || {}) },
        cta: { ...(cur.cta || {}), ...(r.cta || {}) },
        notices: {
          fairPlay: { ...((cur.notices || {}).fairPlay || {}), ...((r.notices || {}).fairPlay || {}) },
          important: { ...((cur.notices || {}).important || {}), ...((r.notices || {}).important || {}) }
        },
        sectionTitles: { ...(cur.sectionTitles || {}), ...(r.sectionTitles || {}) },
        rules: Array.isArray(r.rules) && r.rules.length ? r.rules : cur.rules,
        entrySteps: Array.isArray(r.entrySteps) && r.entrySteps.length ? r.entrySteps : cur.entrySteps,
        winners: Array.isArray(r.winners) && r.winners.length ? r.winners : cur.winners
      });
    });
    rows = [...byId.values()];
  }

  if (!rows.some((r) => r.id === FALLBACK.id)) {
    const fallbackData = rows.length ? { ...FALLBACK, status: "ended" } : FALLBACK;
    rows.push(normalizeGiveaway(fallbackData, FALLBACK.id, true));
  }

  rows.sort((a, b) => {
    const ar = STATUS_RANK[a.status] ?? 9;
    const br = STATUS_RANK[b.status] ?? 9;
    if (ar !== br) return ar - br;
    return (b.sortTs || 0) - (a.sortTs || 0);
  });

  const current = pickCurrent(rows, forcedActiveId);
  if (!current) {
    setLoading(false);
    return;
  }
  if ((primaryErr || altErr) && rows.length) {
    console.warn("Loaded giveaways from fallback storage because primary collection was denied.");
  }
  render(current);
  renderPast(rows, current.id);
}

document.addEventListener("DOMContentLoaded", loadGiveaways);
