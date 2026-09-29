const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const requiredDashboardPages = [
  'login.html', 'dashboard.html', 'onboarding.html', 'my-profile.html', 'edit-profile.html',
  'bonus.html', 'giveaways.html', 'tradejournal.html', 'review-panel.html',
  'challenges-panel.html', 'announcements-panel.html', 'rules-panel.html',
  'dashboard-admin.html', 'support-dashboard.html',
  'admin-activity.html', 'admin-announcements.html', 'admin-beginner-tutorials.html',
  'admin-clients.html', 'admin-community.html', 'admin-content-cms.html', 'admin-events.html',
  'admin-faqs.html', 'admin-filters.html', 'admin-firm-details.html', 'admin-firms.html',
  'admin-funding-strategies.html', 'admin-giveaways.html', 'admin-moderation.html',
  'admin-newsletter.html', 'admin-offers.html', 'admin-propnews.html', 'admin-purchases.html',
  'admin-reviews.html', 'admin-support-access.html', 'admin-trading-guides.html',
  'admin-trading-psychology.html',
]
const excludedLegacyPublicPages = [
  'discount.html', 'faq.html',
]
const supportEndpoints = [
  'support-login', 'support-session', 'support-overview',
  'support-workspace', 'support-actions', 'support-accounts',
  'support-submissions', 'support-approvals',
]

const failures = []
const requireFile = (file) => {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`)
}

requiredDashboardPages.forEach((file) => requireFile(path.join('public', file)))
excludedLegacyPublicPages.forEach((file) => {
  if (fs.existsSync(path.join(root, 'public', file))) failures.push(`Legacy public page must not be imported: public/${file}`)
})
supportEndpoints.forEach((endpoint) => {
  const file = path.join(root, 'api', `${endpoint}.js`)
  requireFile(path.relative(root, file))
  if (fs.existsSync(file) && typeof require(file) !== 'function') failures.push(`${endpoint} does not export a serverless handler`)
})

const runtimeFile = path.join(root, 'public', 'rmp-runtime-env.json')
requireFile('public/rmp-runtime-env.json')
if (fs.existsSync(runtimeFile)) {
  const runtime = JSON.parse(fs.readFileSync(runtimeFile, 'utf8'))
  const unsafe = Object.keys(runtime).filter((key) => !key.startsWith('VITE_'))
  if (unsafe.length) failures.push(`Runtime env exposes non-public keys: ${unsafe.join(', ')}`)
}

requireFile('public/_worker.js')
requireFile('cloudflare/wrangler.jsonc')
if (fs.existsSync(path.join(root, 'public', '_worker.js'))) {
  const pagesWorker = fs.readFileSync(path.join(root, 'public', '_worker.js'), 'utf8')
  if (!pagesWorker.includes('env.ASSETS.fetch(request)')) failures.push('Cloudflare Pages asset fallback is missing')
  if (!pagesWorker.includes('rankmyprop-api.theforexclue.workers.dev')) failures.push('Cloudflare API proxy is missing')
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`[integration] ${requiredDashboardPages.length} dashboard pages verified`)
console.log(`[integration] ${supportEndpoints.length} local compatibility APIs verified`)
console.log('[integration] Cloudflare Pages routing, legacy page exclusions and browser-safe runtime env verified')
