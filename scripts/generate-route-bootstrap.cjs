const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const publicRoot = path.join(root, 'public')
const origin = 'https://www.rankmyprop.in'

function slugify(value = '') { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
function idForRoute(route) {
  const parts = route.split('/').filter(Boolean)
  if (!parts.length) return 'home-hero'
  if (route === '/offers') return 'offers-page'
  if (route === '/compare') return 'compare-page'
  if (route === '/reviews') return 'firm-reviews-page'
  if (route === '/prop-firm-rules') return 'prop-firm-rules-page'
  if (parts[0] === 'prop-firms' && parts[1]) return `firm-review-${slugify(parts[1])}`
  if (parts[0] === 'prop-firm-rules' && parts[1]) return parts[2] ? `challenge-model-${slugify(parts[1])}-${slugify(parts[2])}` : `firm-rules-${slugify(parts[1])}`
  if (parts[0] === 'offers' && parts[1]) return `offer-${slugify(parts[1])}`
  if (parts.length >= 2 && ['blog', 'news', 'trading-guides', 'funding-strategies', 'trading-psychology', 'beginner-tutorials'].includes(parts[0])) return `article-${slugify(parts[0])}-${slugify(parts[1])}`
  return `page-${slugify(parts.join('-'))}`
}
function routeForFile(file) {
  const relative = path.relative(publicRoot, file).replace(/\\/g, '/')
  if (relative === 'index.html') return '/'
  return `/${relative.replace(/\.html$/i, '')}`
}
function text(html, regex) { return (html.match(regex)?.[1] || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim() }
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]) }

let count = 0
for (const file of walk(publicRoot).filter((file) => file.endsWith('.html') && !/\/(?:admin|dashboard|login|404)\b/i.test(file))) {
  let html = fs.readFileSync(file, 'utf8')
  const fileRoute = routeForFile(file)
  const canonical = text(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i) || `${origin}${fileRoute}`
  // Generated pages often share a file template.  Their canonical URL, not the
  // template filename, is the only safe CMS identity for a direct reload.
  let route = fileRoute
  try { route = new URL(canonical, origin).pathname } catch (_) {}
  const heading = text(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const description = text(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)
  const title = text(html, /<title>([\s\S]*?)<\/title>/i)
  const record = { id: idForRoute(route), heading, paragraph: description, seoTitle: title, seoDescription: description, canonical, robots: 'index, follow, max-image-preview:large, max-snippet:-1', __stableSsrHero: true }
  const tag = `<script id="rmp-ssr-bootstrap">window.__RMP_SSR_BOOTSTRAP=${JSON.stringify(record).replace(/</g, '\\u003c')};</script>`
  html = html.replace(/\s*<script id=["']rmp-ssr-bootstrap["']>[\s\S]*?<\/script>/i, '')
  html = html.replace(/\s*<script[^>]+src=["'][^"']*route-content-runtime\.js[^"']*["'][^>]*><\/script>/i, '')
  html = html.replace(/<\/head>/i, `${tag}\n<script defer src="/route-content-runtime.js"></script>\n</head>`)
  fs.writeFileSync(file, html)
  count += 1
}
console.log(`[route-bootstrap] injected stable route bootstrap into ${count} public pages`)
