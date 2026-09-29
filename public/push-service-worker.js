/* RankMyProp native Web Push service worker, delivered by Cloudflare Pages. */

function safePath(value) {
  const input = String(value || "/").trim();
  if (input.startsWith("/") && !input.startsWith("//")) return input;
  try {
    const url = new URL(input);
    if (["rankmyprop.in", "www.rankmyprop.in"].includes(url.hostname.toLowerCase())) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {}
  return "/";
}

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json?.() || {}; }
  catch { data = { body: event.data?.text?.() || "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "RankMyProp Live Alert", {
    body: data.body || "A new RankMyProp update is available.",
    icon: data.icon || "/favicon-192x192.png",
    badge: "/favicon-48x48.png",
    tag: `rmp-${data.category || "alert"}-${safePath(data.clickUrl)}`,
    renotify: true,
    data: { clickUrl: safePath(data.clickUrl) },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(safePath(event.notification?.data?.clickUrl), self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("navigate" in client) await client.navigate(destination);
      if ("focus" in client) return client.focus();
    }
    return clients.openWindow(destination);
  })());
});
