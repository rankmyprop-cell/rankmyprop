const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const source = path.resolve(process.argv[2] || '')
const manifest = path.join(root, 'docs', 'dashboard-preservation.sha256')
const intentionalDeltas = new Set([
  // Fixes a pre-existing temporal-dead-zone error during initial dashboard navigation.
  'public/dashboard.html',
])

if (!process.argv[2] || !fs.existsSync(source)) {
  console.error('Usage: node scripts/verify-dashboard-source.cjs <preservation-bundle-directory>')
  process.exit(2)
}

const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const lines = fs.readFileSync(manifest, 'utf8').trim().split(/\r?\n/)
let verified = 0
const mismatches = []
const acceptedDeltas = []

for (const line of lines) {
  const match = line.match(/^([a-f0-9]{64})  (.+)$/)
  if (!match) continue
  const integratedPath = match[2]
  const sourceRelative = integratedPath.startsWith('public/') ? integratedPath.slice('public/'.length) : integratedPath
  const sourceFile = path.join(source, sourceRelative)
  if (!fs.existsSync(sourceFile)) continue
  verified += 1
  if (hash(sourceFile) !== match[1]) {
    if (intentionalDeltas.has(integratedPath)) acceptedDeltas.push(integratedPath)
    else mismatches.push(integratedPath)
  }
}

if (mismatches.length) {
  console.error(`Preservation mismatch in ${mismatches.length} file(s):`)
  mismatches.forEach((file) => console.error(`- ${file}`))
  process.exit(1)
}

console.log(`[dashboard-source] ${verified} imported files match the canonical bundle`)
if (acceptedDeltas.length) {
  console.log(`[dashboard-source] ${acceptedDeltas.length} documented integration fix accepted: ${acceptedDeltas.join(', ')}`)
}
