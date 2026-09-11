import cors from 'cors'
import express from 'express'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DASHBOARD_ROUTES, PUBLIC_ROUTE_REDIRECTS } from '../dashboard-routes.js'
import { firms } from './data.js'

const app = express()
try {
  process.loadEnvFile?.('.env.local')
} catch {
  try {
    process.loadEnvFile?.('.env')
  } catch {
    // Hosting providers inject environment variables directly.
  }
}
const port = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json({ limit: '100kb' }))

const require = createRequire(import.meta.url)
const supportHandlers = [
  'support-login',
  'support-session',
  'support-overview',
  'support-workspace',
  'support-actions',
  'support-accounts',
  'support-submissions',
  'support-approvals',
  'youtube-latest',
] as const

for (const endpoint of supportHandlers) {
  const handler = require(`../api/${endpoint}.js`)
  app.all(`/api/${endpoint}`, handler)
}
app.all('/api/support-refresh', require('../api/support-session.js'))

// Keep local development on the same route-content contract as production
// Vercel functions. This is deliberately registered before static assets.
const publicPageHandler = require('../api/public-page-content.js')
app.all('/api/public-page-content', publicPageHandler)
app.all('/api/reviews', publicPageHandler)
app.all('/api/reviews/:firm', publicPageHandler)

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'rank-my-prop-api' }))

app.get('/api/firms', (req, res) => {
  const query = String(req.query.q ?? '').toLowerCase()
  const filtered = query ? firms.filter((firm) => firm.name.toLowerCase().includes(query) || firm.tags.some((tag) => tag.toLowerCase().includes(query))) : firms
  res.json(filtered)
})

app.get('/api/firms/:id', (req, res) => {
  const firm = firms.find((item) => item.id === req.params.id)
  if (!firm) return res.status(404).json({ message: 'Firm not found' })
  res.json(firm)
})

if (process.env.NODE_ENV === 'production') {
  const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
  app.use(express.static(directory))
  for (const [from, to] of Object.entries(PUBLIC_ROUTE_REDIRECTS)) {
    app.get(from, (req, res) => res.redirect(302, `${to}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`))
  }
  for (const route of DASHBOARD_ROUTES) {
    app.get(`/${route}`, (_req, res) => res.sendFile(path.join(directory, `${route}.html`)))
  }
  app.use((_req, res) => res.sendFile(path.join(directory, 'index.html')))
}

app.listen(port, () => console.log(`RMP API running on http://localhost:${port}`))
