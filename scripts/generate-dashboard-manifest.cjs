const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const publicRoot = path.join(root, 'public')
const apiRoot = path.join(root, 'api')
const supabaseRoot = path.join(root, 'supabase')
const output = path.join(root, 'docs', 'dashboard-preservation.sha256')

const dashboardHtml = new Set([
  'login.html', 'dashboard.html', 'onboarding.html', 'my-profile.html', 'edit-profile.html',
  'bonus.html', 'giveaways.html', 'tradejournal.html', 'review-panel.html',
  'challenges-panel.html', 'announcements-panel.html', 'rules-panel.html',
  'dashboard-admin.html', 'support-dashboard.html',
])

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return []
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}

const publicFiles = walk(publicRoot).filter((file) => {
  const relative = path.relative(publicRoot, file).replaceAll(path.sep, '/')
  if (relative.startsWith('assets/')) return true
  if (path.basename(file).startsWith('admin-') && file.endsWith('.html')) return true
  if (dashboardHtml.has(path.basename(file))) return true
  return /\.(js|css|png|webmanifest|json)$/.test(file) && !['rmp-runtime-env.json', 'sitemap-inventory.json', 'seo-evidence.json'].includes(path.basename(file))
})

const files = [...publicFiles, ...walk(apiRoot), ...walk(supabaseRoot), path.join(root, 'firestore.rules')]
  .filter((file) => fs.existsSync(file) && path.basename(file) !== 'package.json')
  .sort()

const lines = files.map((file) => {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  return `${digest}  ${path.relative(root, file).replaceAll(path.sep, '/')}`
})

fs.writeFileSync(output, `${lines.join('\n')}\n`)
console.log(`[dashboard-manifest] recorded ${lines.length} preserved files`)
