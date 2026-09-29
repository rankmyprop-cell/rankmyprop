import { auth } from "./dashboard-common.js";
import { CLOUDFLARE_API_URL } from "./cloudflare-config.js";

const CATEGORIES = new Set(["announcements", "offers", "firms"]);

export async function sendCloudflarePush({ title, body, clickUrl, category }) {
  const payload = {
    title: String(title || "").trim(),
    body: String(body || "").trim(),
    clickUrl: String(clickUrl || "").trim(),
    category: String(category || "").trim(),
  };

  if (!payload.title || !payload.body || !payload.clickUrl || !CATEGORIES.has(payload.category)) {
    throw new Error("Push title, body, click URL and category are required.");
  }

  const token = await auth.currentUser?.getIdToken(true);
  if (!token) throw new Error("Admin session expired. Please sign in again.");

  const response = await fetch(`${CLOUDFLARE_API_URL}/v1/admin/push/send`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Cloudflare push could not be queued.");
  return data;
}

export function wirePushButton({ button, fields, category, notice, showNotice, defaults }) {
  const target = typeof button === "string" ? document.getElementById(button) : button;
  if (!target) return;
  target.addEventListener("click", async () => {
    const initial = typeof defaults === "function" ? defaults() : {};
    const payload = {
      category,
      title: fields.title.value.trim() || initial.title || "",
      body: fields.body.value.trim() || initial.body || "",
      clickUrl: fields.clickUrl.value.trim() || initial.clickUrl || "",
    };
    fields.title.value = payload.title;
    fields.body.value = payload.body;
    fields.clickUrl.value = payload.clickUrl;
    if (!payload.title || !payload.body || !payload.clickUrl) {
      showNotice(notice, "Complete the push title, body and click URL first.", "error");
      return;
    }
    if (!confirm(`Send “${payload.title}” to enabled ${category} subscribers?`)) return;
    target.disabled = true;
    const previous = target.textContent;
    target.textContent = "Queueing…";
    try {
      await sendCloudflarePush(payload);
      showNotice(notice, "Push queued on Cloudflare. Delivery totals will appear in Push Notifications logs.");
    } catch (error) {
      showNotice(notice, error?.message || "Push send failed.", "error");
    } finally {
      target.disabled = false;
      target.textContent = previous;
    }
  });
}
