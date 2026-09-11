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
  'support-login', 'support-session', 'support-refresh', 'support-overview',
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

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
if (vercel.cleanUrls !== true) failures.push('Vercel cleanUrls must remain enabled')
if (!vercel.rewrites?.some((rule) => rule.destination === '/index')) failures.push('React SPA fallback is missing')

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`[integration] ${requiredDashboardPages.length} dashboard pages verified`)
console.log(`[integration] ${supportEndpoints.length} support APIs verified`)
console.log('[integration] legacy public pages excluded and runtime env is browser-safe')
