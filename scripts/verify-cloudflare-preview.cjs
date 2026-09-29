const assert = require('node:assert/strict');

const site = String(process.env.RMP_SITE_URL || 'https://rankmyprop-web.pages.dev').replace(/\/$/, '');
const api = String(process.env.RMP_API_URL || 'https://rankmyprop-api.theforexclue.workers.dev').replace(/\/$/, '');

const routes = [
  ['/', /Rank My Prop/i],
  ['/listedprop', /prop firm/i],
  ['/offers', /offer|discount|promo/i],
  ['/reviews', /review/i],
  ['/prop-news', /prop news/i],
  ['/prop-firms/upcomers', /Upcomers/i],
  ['/prop-firms/upcomers/reviews', /Upcomers/i],
  ['/prop-firm-rules/upcomers', /Upcomers/i],
  ['/offers/trader-scale', /Trader\s*Scale/i],
  ['/announcements', /announcement/i],
  ['/admin-push', /push/i, false],
];

function titleOf(html) {
  return (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
}

async function get(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  return { response, text };
}

(async () => {
  for (const [path, expected, needsCanonical = true] of routes) {
    const { response, text } = await get(`${site}${path}`, { redirect: 'follow' });
    assert.equal(response.status, 200, `${path} returned ${response.status}`);
    const title = titleOf(text);
    assert.match(title, expected, `${path} has unexpected title: ${title}`);
    if (needsCanonical) assert.ok(/<link[^>]+rel=["']canonical["']/i.test(text), `${path} is missing a canonical link`);
    console.log(`PASS route ${path} :: ${title}`);
  }

  const sw = await fetch(`${site}/push-service-worker.js`);
  assert.equal(sw.status, 200);
  assert.match(sw.headers.get('cache-control') || '', /no-cache|no-store/i);
  assert.match(await sw.text(), /addEventListener\(["']push["']/);
  console.log('PASS native Web Push service worker');

  const manifest = await fetch(`${site}/site.webmanifest`);
  assert.equal(manifest.status, 200);
  const manifestJson = await manifest.json();
  assert.equal(manifestJson.display, 'standalone');
  assert.ok(Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 2);
  console.log('PASS installable web manifest');

  const health = await fetch(`${api}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  console.log('PASS Worker health');

  const config = await fetch(`${api}/v1/config`, { headers: { Origin: site } });
  assert.equal(config.status, 200);
  assert.ok((await config.json()).pushPublicKey);
  assert.equal(config.headers.get('access-control-allow-origin'), site);
  console.log('PASS Worker CORS and VAPID public config');

  const firms = await fetch(`${api}/v1/collections/firms?limit=5`, { headers: { Origin: site } });
  assert.equal(firms.status, 200);
  assert.ok((await firms.json()).data.length > 0);
  console.log('PASS D1 public collection read');

  const protectedCollection = await fetch(`${api}/v1/collections/users?limit=1`, { headers: { Origin: site } });
  assert.equal(protectedCollection.status, 401);
  console.log('PASS protected collection rejects anonymous access');

  console.log(`Cloudflare preview verification completed: ${site}`);
})().catch((error) => {
  console.error(`FAIL ${error.stack || error.message}`);
  process.exitCode = 1;
});
