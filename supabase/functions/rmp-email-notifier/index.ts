const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

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

function readPublishableKeys(): string[] {
  const out = new Set<string>();
  const legacy = String(Deno.env.get("SUPABASE_ANON_KEY") || "").trim();
  if (legacy) out.add(legacy);

  const raw = String(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "").trim();
  if (!raw) return [...out];
  try {
    const parsed = JSON.parse(raw);
    Object.values(parsed || {}).forEach((v) => {
      const key = String(v || "").trim();
      if (key) out.add(key);
    });
  } catch {}
  return [...out];
}

function readServiceRoleKey(): string {
  const legacy = String(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  if (legacy) return legacy;
  const raw = String(Deno.env.get("SUPABASE_SECRET_KEYS") || "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    const defaultKey = String(parsed?.default || "").trim();
    if (defaultKey) return defaultKey;
    const first = Object.values(parsed || {}).find((v) => String(v || "").trim());
    return String(first || "").trim();
  } catch {
    return "";
  }
}

const SUPABASE_URL = String(Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = readServiceRoleKey();
const SUPABASE_PUBLISHABLE_KEYS = readPublishableKeys();
const RESEND_API_KEY = String(Deno.env.get("RESEND_API_KEY") || "").trim();
const RESEND_FROM_EMAIL = String(Deno.env.get("RESEND_FROM_EMAIL") || "Rank My Prop <no-reply@rankmyprop.in>").trim();
const RESEND_FALLBACK_FROM_EMAIL = String(Deno.env.get("RESEND_FALLBACK_FROM_EMAIL") || "Rank My Prop <onboarding@resend.dev>").trim();
const INTERNAL_NOTIFY_TOKEN = String(Deno.env.get("INTERNAL_NOTIFY_TOKEN") || "").trim();
const ALLOWED_ORIGINS = String(Deno.env.get("ALLOWED_ORIGINS") || "https://www.rankmyprop.in,https://www.rankmyprop.in,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = String(req.headers.get("origin") || "").trim();
  if (!origin) {
    return { ...BASE_CORS_HEADERS, "Access-Control-Allow-Origin": "*" };
  }
  const allowed = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin);
  return {
    ...BASE_CORS_HEADERS,
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0] || origin,
    "Vary": "Origin"
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function escHtml(v = "") {
  return String(v).replace(/[&<>"']/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    if (m === "\"") return "&quot;";
    return "&#39;";
  });
}

function norm(v = "") {
  return String(v || "").trim();
}

function normLc(v = "") {
  return norm(v).toLowerCase();
}

function isValidEmail(v = "") {
  const email = norm(v).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isAllowedRequest(req: Request) {
  if (INTERNAL_NOTIFY_TOKEN) {
    const token = String(req.headers.get("x-notify-token") || "").trim();
    if (token && token === INTERNAL_NOTIFY_TOKEN) return true;
  }
  const apiKey = String(req.headers.get("apikey") || "").trim();
  if (!apiKey) return false;
  return SUPABASE_PUBLISHABLE_KEYS.includes(apiKey);
}

function restHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json"
  };
}

async function restGet(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { ok: false, data: null };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "GET", headers: restHeaders() });
  if (!res.ok) return { ok: false, data: null };
  const data = await res.json().catch(() => null);
  return { ok: true, data };
}

async function restInsert(path: string, payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { ok: false, data: null };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      ...restHeaders(),
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = await res.text().catch(() => "");
    return { ok: false, data: null, error };
  }
  const data = await res.json().catch(() => null);
  return { ok: true, data };
}

async function restPatch(path: string, payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { ok: false };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: restHeaders(),
    body: JSON.stringify(payload)
  });
  return { ok: res.ok };
}

type EmailTemplate = { subject: string; html: string; text: string; replyTo?: string };

const BRAND_NAME = "Rank My Prop";
const BRAND_URL = "https://www.rankmyprop.in";
const BRAND_DASHBOARD_URL = "https://www.rankmyprop.in/dashboard";
const BRAND_REVIEWS_DASHBOARD_URL = "https://www.rankmyprop.in/dashboard?page=reviews";
const BRAND_CONTACT_URL = "https://www.rankmyprop.in/contact";
const CONTACT_RECIPIENTS: Record<string, string> = {
  "account support": "support@rankmyprop.in",
  "research correction": "listing@rankmyprop.in",
  "prop firm listing": "office@rankmyprop.in",
  "partnership inquiry": "marketing@rankmyprop.in",
  "general inquiry": "support@rankmyprop.in",
  "legal or privacy request": "legal@rankmyprop.in"
};
const SOCIAL_LINKS = {
  x: "https://x.com/rankmyprop",
  youtube: "https://youtube.com/@RankMyProp",
  instagram: "https://instagram.com/rankmyprop.hq",
  discord: "https://discord.gg/xrP4qN3y3p"
} as const;
const EMAIL_IMAGE_BASE = `${BRAND_URL}/assets/email`;
const BRAND_LOGO_URL = `${EMAIL_IMAGE_BASE}/brand-mark.png`;
const EMAIL_HERO_URLS = {
  login_success: `${EMAIL_IMAGE_BASE}/login-successful.png`,
  payout_approved: `${EMAIL_IMAGE_BASE}/payout-approved.png`,
  payout_rejected: `${EMAIL_IMAGE_BASE}/payout-rejected.png`,
  review_submitted: `${EMAIL_IMAGE_BASE}/review-submitted.png`,
  review_live: `${EMAIL_IMAGE_BASE}/review-got-approved.png`
} as const;

function escAttr(v = "") {
  return escHtml(v).replace(/"/g, "&quot;");
}

type EmailBullet = { tone?: "success" | "danger"; text: string };
type EmailFeature = { icon: string; title: string; description: string; href?: string };

function renderBulletRows(items: EmailBullet[] = []) {
  if (!items.length) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;border-collapse:separate;border-spacing:0;">
      ${items.map((item) => {
        const danger = item.tone === "danger";
        const badgeBg = danger
          ? "linear-gradient(180deg,#ff6d7c 0%,#ff445d 100%)"
          : "linear-gradient(180deg,#754dff 0%,#5a3fff 100%)";
        return `
          <tr>
            <td style="padding:0 0 14px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:16px;">
                    <div style="width:32px;height:32px;border-radius:999px;background:${badgeBg};color:#ffffff;font-size:18px;line-height:32px;text-align:center;font-weight:900;box-shadow:0 10px 24px rgba(${danger ? "255,74,96" : "118,86,255"},0.25);">${danger ? "✕" : "✓"}</div>
                  </td>
                  <td valign="middle" style="font-size:18px;line-height:1.4;color:#f6f5ff;font-weight:500;">${escHtml(item.text)}</td>
                </tr>
              </table>
            </td>
          </tr>`;
      }).join("")}
    </table>`;
}

function renderFeatureGrid(features: EmailFeature[] = []) {
  if (!features.length) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="rmp-email-grid" style="border-collapse:separate;border-spacing:0;">
      <tr>
        ${features.map((feature, index) => `
          <td valign="top" width="25%" style="padding:${index === 0 ? "0 12px 0 0" : "0 12px"};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="top" style="padding-top:2px;padding-right:12px;">
                  <div style="width:46px;height:46px;border-radius:12px;background:rgba(98,67,255,0.10);border:1px solid rgba(126,92,255,0.24);color:#8d6cff;font-size:22px;line-height:46px;text-align:center;font-weight:900;">${escHtml(feature.icon)}</div>
                </td>
                <td valign="top">
                  <div style="font-size:14px;line-height:1.2;font-weight:800;color:#f5f4ff;">${escHtml(feature.title)}</div>
                  <div style="margin-top:5px;font-size:12px;line-height:1.5;color:#aeb5d4;">${escHtml(feature.description)}</div>
                </td>
              </tr>
            </table>
          </td>
        `).join("")}
      </tr>
    </table>`;
}

function renderSocialLink(label: string, href: string) {
  return `
    <a href="${escAttr(href)}" style="display:inline-block;width:42px;height:42px;border-radius:999px;background:linear-gradient(180deg,#6d53ff 0%,#5a3fff 100%);color:#ffffff;text-decoration:none;font-size:12px;line-height:42px;text-align:center;font-weight:900;margin:0 8px 10px 0;box-shadow:0 10px 24px rgba(109,83,255,0.25);">${escHtml(label)}</a>`;
}

function renderEmailShell(params: {
  preheader: string;
  statusLabel: string;
  statusTone?: "purple" | "red";
  heroImageUrl: string;
  heroImageAlt: string;
  bodyHtml: string;
  ctaText?: string;
  ctaHref?: string;
  footerNote?: string;
}) {
  const {
    preheader,
    statusLabel,
    statusTone = "purple",
    heroImageUrl,
    heroImageAlt,
    bodyHtml,
    ctaText = "",
    ctaHref = BRAND_DASHBOARD_URL,
    footerNote = ""
  } = params;

  const heroHtml = heroImageUrl ? `
              <tr>
                <td class="rmp-email-pad" align="center" style="padding:0 0 26px;">
                  <img class="rmp-email-hero" src="${escAttr(heroImageUrl)}" alt="${escAttr(heroImageAlt)}" style="display:block;width:100%;max-width:680px;height:auto;border-radius:22px;border:1px solid rgba(132,92,255,0.48);box-shadow:0 18px 52px rgba(0,0,0,0.46);" />
                </td>
              </tr>` : "";
  const ctaHtml = ctaText
    ? `
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin-top:34px;">
        <tr>
          <td align="center">
            <a href="${escAttr(ctaHref || BRAND_DASHBOARD_URL)}" style="display:inline-block;background:linear-gradient(180deg,#7657ff 0%,#5d41ff 100%);color:#ffffff;text-decoration:none;font-size:18px;line-height:1;font-weight:800;padding:17px 34px;border-radius:14px;box-shadow:0 16px 34px rgba(93,65,255,0.32), inset 0 1px 0 rgba(255,255,255,0.15);">${escHtml(ctaText)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const featureTiles = renderFeatureGrid([
    { icon: "★", title: "Compare Top Firms", description: "Find and compare the best prop firms in the industry." },
    { icon: "%", title: "Exclusive Offers", description: "Access verified discount codes & special offers." },
    { icon: "▣", title: "Payout Proofs", description: "View verified payout proofs from real traders." },
    { icon: "↗", title: "Trading Resources", description: "Explore tools, guides & resources to grow." }
  ]);

  const socials = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" class="rmp-email-social-table">
      <tr>
        <td valign="middle">${renderSocialLink("X", SOCIAL_LINKS.x)}</td>
        <td valign="middle">${renderSocialLink("YT", SOCIAL_LINKS.youtube)}</td>
        <td valign="middle">${renderSocialLink("IG", SOCIAL_LINKS.instagram)}</td>
        <td valign="middle">${renderSocialLink("DC", SOCIAL_LINKS.discord)}</td>
      </tr>
    </table>`;

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escHtml(statusLabel)} | ${escHtml(BRAND_NAME)}</title>
      <style>
        @media only screen and (max-width: 720px) {
          .rmp-email-shell { width: 100% !important; max-width: 100% !important; }
          .rmp-email-pad { padding-left: 14px !important; padding-right: 14px !important; }
          .rmp-email-hero { max-width: 100% !important; border-radius: 16px !important; }
          .rmp-email-grid td { display: block !important; width: 100% !important; padding: 0 0 16px !important; }
          .rmp-email-header td { display: block !important; width: 100% !important; text-align: left !important; }
          .rmp-email-footer td { display: block !important; width: 100% !important; text-align: center !important; padding: 0 0 14px !important; }
          .rmp-email-socials { text-align: center !important; }
          .rmp-email-social-table { margin: 0 auto !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background:#05040b;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escHtml(preheader)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#05040b;margin:0;padding:0;width:100%;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center" style="padding:28px 16px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="rmp-email-shell" style="max-width:860px;border-collapse:separate;border-spacing:0;">
              <tr>
                <td class="rmp-email-header" style="padding:0 0 30px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="rmp-email-header" style="border-collapse:collapse;">
                    <tr>
                      <td valign="middle" style="width:100%;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td valign="middle" style="padding-right:18px;">
                              <img src="${escAttr(BRAND_LOGO_URL)}" width="86" height="86" alt="${escAttr(BRAND_NAME)}" style="display:block;border:0;outline:none;text-decoration:none;width:86px;height:86px;object-fit:contain;" />
                            </td>
                            <td valign="middle">
                              <div style="font-size:27px;line-height:1.05;font-weight:900;letter-spacing:-0.03em;color:#f4f5ff;text-transform:uppercase;">${escHtml(BRAND_NAME)}</div>
                              <div style="margin-top:4px;font-size:12px;line-height:1.2;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#b9bed9;">Compare. Verify. Trade Smart.</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${heroHtml}
              <tr>
                <td class="rmp-email-pad" style="padding:0 12px 0;color:#ffffff;">
                  ${bodyHtml}
                  ${ctaHtml}
                </td>
              </tr>
              <tr>
                <td style="padding-top:30px;">
                  <div style="height:1px;background:rgba(255,255,255,0.12);"></div>
                </td>
              </tr>
              <tr>
                <td style="padding-top:22px;">
                  ${featureTiles}
                </td>
              </tr>
              <tr>
                <td style="padding-top:26px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="rmp-email-footer">
                    <tr>
                      <td valign="middle" class="rmp-email-socials" style="width:40%;padding-right:16px;">
                        ${socials}
                      </td>
                      <td valign="middle" align="right" style="width:60%;font-size:14px;line-height:1.55;color:#9da4be;text-align:right;">
                        Need help? <a href="${escAttr(BRAND_CONTACT_URL)}" style="color:#7d55ff;text-decoration:none;font-weight:800;">Contact</a> our support team.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:16px;">
                  <div style="font-size:13px;line-height:1.5;color:#8b91ac;text-align:center;">© ${new Date().getFullYear()} ${escHtml(BRAND_NAME)}. All rights reserved.</div>
                </td>
              </tr>
              ${footerNote ? `
              <tr>
                <td style="padding-top:12px;">
                  <div style="font-size:12px;line-height:1.65;color:#c2c7df;text-align:center;">${escHtml(footerNote)}</div>
                </td>
              </tr>` : ""}
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function notificationTemplate(eventType: string, payload: Record<string, unknown>): EmailTemplate {
  const firm = norm(String(payload.firm || payload.firmName || "your selected prop firm"));
  const reason = norm(String(payload.reason || "account activity"));
  const status = norm(String(payload.status || ""));
  const points = toNumber(payload.points, 0);
  const amount = toNumber(payload.amount, 0);
  const method = norm(String(payload.method || payload.paymentMode || "Payout"));
  const reviewId = norm(String(payload.reviewId || ""));
  const displayName = norm(String(payload.displayName || payload.fullName || payload.name || ""));
  const source = norm(String(payload.source || payload.signupSource || ""));
  const greetingName = displayName ? `Trader ${displayName}` : "Trader";
  const loginHero = EMAIL_HERO_URLS.login_success;
  const payoutApprovedHero = EMAIL_HERO_URLS.payout_approved;
  const payoutRejectedHero = EMAIL_HERO_URLS.payout_rejected;
  const reviewSubmittedHero = EMAIL_HERO_URLS.review_submitted;
  const reviewLiveHero = EMAIL_HERO_URLS.review_live;

  if (eventType === "contact_message") {
    const senderName = norm(String(payload.senderName || payload.name || "Website visitor"));
    const senderEmail = normLc(String(payload.userEmail || ""));
    const topic = norm(String(payload.topic || "General inquiry"));
    const message = norm(String(payload.message || ""));
    const safeMessage = escHtml(message).replace(/\r?\n/g, "<br>");
    const bodyHtml = `
      <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">New ${escHtml(topic)} message</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-collapse:separate;border-spacing:0;">
        <tr><td style="padding:12px 14px;border:1px solid #2a2540;border-radius:12px 12px 0 0;color:#a9a3bb;font-size:14px;">From</td><td style="padding:12px 14px;border:1px solid #2a2540;border-left:0;border-radius:0 12px 0 0;color:#ffffff;font-size:14px;font-weight:700;">${escHtml(senderName)}</td></tr>
        <tr><td style="padding:12px 14px;border:1px solid #2a2540;border-top:0;border-radius:0 0 0 12px;color:#a9a3bb;font-size:14px;">Email</td><td style="padding:12px 14px;border:1px solid #2a2540;border-top:0;border-left:0;border-radius:0 0 12px 0;color:#b8abff;font-size:14px;font-weight:700;">${escHtml(senderEmail)}</td></tr>
      </table>
      <div style="padding:20px;border:1px solid #2f2850;border-radius:14px;background:#0c0a16;color:#e5e1f1;font-size:17px;line-height:1.7;">${safeMessage}</div>`;
    return {
      subject: `[${topic}] Website message from ${senderName}`,
      html: renderEmailShell({
        preheader: `${topic} message from ${senderName}.`,
        statusLabel: "New contact request",
        statusTone: "purple",
        heroImageUrl: "",
        heroImageAlt: "",
        bodyHtml,
        ctaText: "",
        ctaHref: BRAND_CONTACT_URL,
        footerNote: "Replying to this email will respond directly to the sender."
      }),
      text: `Topic: ${topic}\nFrom: ${senderName}\nEmail: ${senderEmail}\n\n${message}`,
      replyTo: senderEmail
    };
  }

  if (eventType === "login_success" || eventType === "signup_success") {
    const bodyHtml = `
      <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">Dear ${escHtml(greetingName)},</div>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">Great to see you back! You’ve successfully logged in to your Rank My Prop account.</p>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#7d55ff;font-weight:800;">Congratulations on taking another step toward becoming a consistently profitable trader! 🎉</p>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">You can now continue exploring top prop firm reviews, exclusive discount codes, verified payout proofs, and the best trading resources — all in one place.</p>
      <p style="margin:0;font-size:18px;line-height:1.65;color:#dce0ef;">Thank you for being a part of the Rank My Prop community.</p>
      ${renderBulletRows([
        { text: "Login Verified", tone: "success" },
        { text: "Account Secure", tone: "success" }
      ])}`;
    const welcomeText = `You’ve successfully logged in to your Rank My Prop account.`;
    return {
      subject: "Login Successful | Rank My Prop",
      html: renderEmailShell({
        preheader: "You’ve successfully logged in to your Rank My Prop account.",
        statusLabel: "Successful Login",
        statusTone: "purple",
        heroImageUrl: loginHero,
        heroImageAlt: "Login Successful",
        bodyHtml,
        ctaText: "Go To Dashboard",
        ctaHref: BRAND_DASHBOARD_URL
      }),
      text: `${welcomeText} Open the dashboard at ${BRAND_DASHBOARD_URL}.`
    };
  }

  if (eventType === "payout_approved" || eventType === "cashback_approved") {
    const isCashback = eventType === "cashback_approved";
    const amountText = amount > 0 ? `$${amount.toFixed(2)}` : "the requested amount";
    const requestLabel = isCashback ? "cashback request" : "payout request";
    const bodyHtml = `
      <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">Dear ${escHtml(greetingName)},</div>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">Great news! Your ${requestLabel} has been approved and will be credited soon.</p>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#7d55ff;font-weight:800;">Your approved amount is ${escHtml(amountText)}.</p>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">Please allow normal processing time for your payment provider if needed.</p>
      ${renderBulletRows([
        { text: `${isCashback ? "Cashback" : "Payout"} Approved`, tone: "success" },
        { text: "Amount Will Be Credited Soon", tone: "success" }
      ])}`;
    return {
      subject: `${isCashback ? "Cashback" : "Payout"} Approved | Rank My Prop`,
      html: renderEmailShell({
        preheader: `Your ${requestLabel} has been marked as ${status || "Approved"}.`,
        statusLabel: `${isCashback ? "Cashback" : "Payout"} Approved`,
        statusTone: "purple",
        heroImageUrl: payoutApprovedHero,
        heroImageAlt: "Payout Approved",
        bodyHtml,
        ctaText: "Go To Dashboard",
        ctaHref: BRAND_DASHBOARD_URL
      }),
      text: `Your ${requestLabel} is now ${status || "Approved"}. Amount: ${amountText}. Method: ${method}.`
    };
  }

  if (eventType === "payout_rejected") {
    const bodyHtml = `
      <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">Dear ${escHtml(greetingName)},</div>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">Unfortunately, your payout request has been rejected.</p>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#ff6678;font-weight:800;">Please review the reason below and try again.</p>
      ${reason ? `<p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;"><strong style="color:#ffffff;">Reason:</strong> ${escHtml(reason)}</p>` : ""}
      ${renderBulletRows([
        { text: "Payout Rejected", tone: "danger" },
        { text: "Action Required", tone: "danger" }
      ])}`;
    return {
      subject: "Payout Rejected | Rank My Prop",
      html: renderEmailShell({
        preheader: `Your payout request has been rejected.`,
        statusLabel: "Payout Rejected",
        statusTone: "red",
        heroImageUrl: payoutRejectedHero,
        heroImageAlt: "Payout Rejected",
        bodyHtml,
        ctaText: "Go To Dashboard",
        ctaHref: BRAND_DASHBOARD_URL,
        footerNote: "If you need help, contact our support team."
      }),
      text: `Your payout request was rejected.${reason ? ` Reason: ${reason}.` : ""}`
    };
  }

  if (eventType === "review_submitted" || eventType === "review_pending") {
    const bodyHtml = `
      <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">Dear ${escHtml(greetingName)},</div>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">Your review has been submitted successfully and is now awaiting moderation.</p>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#7d55ff;font-weight:800;">Thank you for sharing your experience with the Rank My Prop community.</p>
      <p style="margin:0;font-size:18px;line-height:1.65;color:#dce0ef;">Our team will review your submission and publish it once approved. You’ll be notified when your review goes live.</p>
      ${renderBulletRows([
        { text: "Review Submitted Successfully", tone: "success" },
        { text: "Pending Admin Approval", tone: "success" }
      ])}`;
    return {
      subject: "Review Submitted | Rank My Prop",
      html: renderEmailShell({
        preheader: `Your review for ${firm} has been submitted and is waiting for moderation.`,
        statusLabel: "Review Submitted",
        statusTone: "purple",
        heroImageUrl: reviewSubmittedHero,
        heroImageAlt: "Review Submitted",
        bodyHtml,
        ctaText: "",
        ctaHref: BRAND_DASHBOARD_URL
      }),
      text: `Your review for ${firm} has been submitted and is waiting for moderation.${reviewId ? ` Review ID: ${reviewId}.` : ""}`
    };
  }

  if (eventType === "review_live" || eventType === "review_approved") {
    const bodyHtml = `
      <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">Dear ${escHtml(greetingName)},</div>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">Great news! Your review has been approved and is now live.</p>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#7d55ff;font-weight:800;">Thanks for helping other traders make better decisions.</p>
      <p style="margin:0;font-size:18px;line-height:1.65;color:#dce0ef;">Your review for ${escHtml(firm)} is now visible on Rank My Prop.</p>
      ${renderBulletRows([
        { text: "Review Approved Successfully", tone: "success" },
        { text: "Now Live for Everyone", tone: "success" }
      ])}`;
    return {
      subject: "Review Got Approved | Rank My Prop",
      html: renderEmailShell({
        preheader: `Your review for ${firm} is now live on Rank My Prop.`,
        statusLabel: "Review Got Approved",
        statusTone: "purple",
        heroImageUrl: reviewLiveHero,
        heroImageAlt: "Review Got Approved",
        bodyHtml,
        ctaText: "View Reviews",
        ctaHref: BRAND_REVIEWS_DASHBOARD_URL
      }),
      text: `Your review for ${firm} is now live on Rank My Prop.${reviewId ? ` Review ID: ${reviewId}.` : ""}`
    };
  }

  if (eventType === "review_deleted") {
    const bodyHtml = `
      <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">Dear ${escHtml(greetingName)},</div>
      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">Your review for ${escHtml(firm)} has been removed from public view.</p>
      <p style="margin:0;font-size:18px;line-height:1.65;color:#dce0ef;">If you believe this was a mistake, please contact support.</p>`;
    return {
      subject: "Review Removed | Rank My Prop",
      html: renderEmailShell({
        preheader: `Your review for ${firm} has been removed from public view.`,
        statusLabel: "Review Removed",
        statusTone: "red",
        heroImageUrl: reviewSubmittedHero,
        heroImageAlt: "Review Removed",
        bodyHtml,
        ctaText: "Open Dashboard",
        ctaHref: BRAND_DASHBOARD_URL,
        footerNote: "If you believe this was a mistake, please contact support."
      }),
      text: `Your review for ${firm} has been removed from public view.${reviewId ? ` Review ID: ${reviewId}.` : ""}`
    };
  }

  const cashpointsValue = payload.newCashpoints || payload.cashpoints || "Updated";
  const bodyHtml = `
    <div style="font-size:22px;line-height:1.45;font-weight:800;color:#f8f7ff;margin:0 0 24px;">Dear ${escHtml(greetingName)},</div>
    <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#dce0ef;">You received ${points} points on Rank My Prop.</p>
    <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#7d55ff;font-weight:800;">Reason: ${escHtml(reason || "points credit")}.</p>
    <p style="margin:0;font-size:18px;line-height:1.65;color:#dce0ef;">Your balance is now ${escHtml(String(cashpointsValue))}.</p>`;
  return {
    subject: "Points Credited | Rank My Prop",
    html: renderEmailShell({
      preheader: `You received ${points} points on Rank My Prop.`,
      statusLabel: "Points Credited",
      statusTone: "purple",
      heroImageUrl: "",
      heroImageAlt: "",
      bodyHtml,
      ctaText: "Open Dashboard",
      ctaHref: BRAND_DASHBOARD_URL,
      footerNote: "Rewards are tracked in your Rank My Prop account."
    }),
    text: `You received ${points} points on Rank My Prop. Reason: ${reason || "points credit"}.`
  };
}

async function sendEmailWithFrom(toEmail: string, template: EmailTemplate, fromEmail: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: template.subject,
      html: template.html,
      text: template.text,
      ...(template.replyTo && isValidEmail(template.replyTo) ? { reply_to: template.replyTo } : {})
    })
  });
  const body = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    resendId: String(body?.id || "").trim(),
    error: body?.message || body?.error || "",
    fromEmail
  };
}

function shouldRetryWithFallback(sendRes: { ok: boolean; error: string; fromEmail: string }) {
  if (sendRes.ok) return false;
  const msg = String(sendRes.error || "").toLowerCase();
  if (!msg.includes("domain") || !msg.includes("not verified")) return false;
  if (!RESEND_FALLBACK_FROM_EMAIL) return false;
  return sendRes.fromEmail.trim().toLowerCase() !== RESEND_FALLBACK_FROM_EMAIL.trim().toLowerCase();
}

async function sendEmail(toEmail: string, template: EmailTemplate) {
  const primary = await sendEmailWithFrom(toEmail, template, RESEND_FROM_EMAIL);
  if (!shouldRetryWithFallback(primary)) return { ...primary, fallbackUsed: false };
  const fallback = await sendEmailWithFrom(toEmail, template, RESEND_FALLBACK_FROM_EMAIL);
  if (fallback.ok) return { ...fallback, fallbackUsed: true };
  return {
    ...fallback,
    fallbackUsed: true,
    error: `${primary.error || "primary_failed"} | fallback_failed: ${fallback.error || "unknown"}`
  };
}

function makeNotificationRow(payload: Record<string, unknown>) {
  return {
    event_type: String(payload.eventType || ""),
    uid: norm(String(payload.uid || "")) || null,
    user_email: normLc(String(payload.userEmail || "")),
    status: norm(String(payload.status || "")) || null,
    amount: toNumber(payload.amount, 0) || null,
    points: toNumber(payload.points, 0) || null,
    reason: norm(String(payload.reason || "")) || null,
    review_id: norm(String(payload.reviewId || "")) || null,
    firm: norm(String(payload.firm || payload.firmName || "")) || null,
    method: norm(String(payload.method || payload.paymentMode || "")) || null,
    dedupe_key: norm(String(payload.dedupeKey || "")) || null,
    source_collection: norm(String(payload.sourceCollection || "")) || null,
    raw_payload: payload,
    state: "queued",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  if (!isAllowedRequest(req)) {
    return json(req, { error: "forbidden" }, 403);
  }
  if (!RESEND_API_KEY) return json(req, { error: "missing_resend_api_key" }, 500);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: "invalid_json" }, 400);
  }

  const eventType = normLc(String(payload?.eventType || ""));
  const userEmail = normLc(String(payload?.userEmail || ""));

  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return json(req, { error: "unsupported_event_type" }, 400);
  }
  if (!isValidEmail(userEmail)) {
    return json(req, { error: "invalid_user_email" }, 400);
  }

  if (eventType === "contact_message") {
    const website = norm(String(payload.website || ""));
    if (website) return json(req, { ok: true }, 200);
    const senderName = norm(String(payload.senderName || payload.name || ""));
    const message = norm(String(payload.message || ""));
    const topicKey = normLc(String(payload.topic || "general inquiry"));
    if (!senderName || senderName.length > 120) return json(req, { error: "invalid_sender_name" }, 400);
    if (!message || message.length > 5000) return json(req, { error: "invalid_message" }, 400);
    if (!CONTACT_RECIPIENTS[topicKey]) return json(req, { error: "invalid_contact_topic" }, 400);
    payload.senderName = senderName;
    payload.message = message;
    payload.topic = norm(String(payload.topic || "General inquiry"));
  }

  payload.eventType = eventType;
  payload.userEmail = userEmail;
  payload.status = norm(String(payload.status || ""));
  payload.sentAt = payload.sentAt || new Date().toISOString();

  let duplicateId = "";
  const dedupeKey = norm(String(payload.dedupeKey || ""));
  if (dedupeKey) {
    const dupQuery = `email_notifications?select=id,state,resend_id&dedupe_key=eq.${encodeURIComponent(dedupeKey)}&limit=1`;
    const dupRes = await restGet(dupQuery);
    const hit = Array.isArray(dupRes.data) ? dupRes.data[0] : null;
    if (hit?.id) {
      duplicateId = String(hit.id);
      return json(req, { ok: true, duplicate: true, notificationId: duplicateId, resendId: hit?.resend_id || null }, 200);
    }
  }

  const row = makeNotificationRow(payload);
  let notificationId = "";
  const insRes = await restInsert("email_notifications", row);
  if (insRes.ok && Array.isArray(insRes.data) && insRes.data[0]?.id) {
    notificationId = String(insRes.data[0].id);
  }

  const template = notificationTemplate(eventType, payload);
  const targetEmail = eventType === "contact_message"
    ? CONTACT_RECIPIENTS[normLc(String(payload.topic || ""))] || "support@rankmyprop.in"
    : userEmail;
  const sendRes = await sendEmail(targetEmail, template);

  if (notificationId) {
    await restPatch(`email_notifications?id=eq.${encodeURIComponent(notificationId)}`, {
      state: sendRes.ok ? "sent" : "failed",
      resend_id: sendRes.resendId || null,
      error_message: sendRes.ok ? null : String(sendRes.error || `resend_${sendRes.status}`),
      updated_at: new Date().toISOString()
    });
  }

  if (!sendRes.ok) {
    return json(
      req,
      {
        error: "email_send_failed",
        details: sendRes.error || "unknown",
        fromEmail: sendRes.fromEmail || null,
        fallbackUsed: !!sendRes.fallbackUsed
      },
      502
    );
  }

  return json(req, {
    ok: true,
    notificationId: notificationId || null,
    resendId: sendRes.resendId || null,
    fromEmail: sendRes.fromEmail || null,
    fallbackUsed: !!sendRes.fallbackUsed,
    duplicate: false,
    fallbackNoLog: !notificationId && !!SUPABASE_URL
  });
});
