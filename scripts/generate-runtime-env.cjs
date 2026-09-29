const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const output = path.join(root, 'public', 'rmp-runtime-env.json')
const browserKeys = [
  'VITE_FIREBASE_VAPID_KEY',
  'VITE_SUPABASE_PROJECT_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_NOTIFY_FUNCTION_NAME',
  'VITE_EMAIL_NOTIFICATIONS_ENABLED',
  'VITE_EMAIL_NOTIFICATIONS_DEBUG',
]

function parseEnv(file) {
  if (!fs.existsSync(file)) return {}
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).reduce((values, line) => {
    const value = line.trim()
    if (!value || value.startsWith('#')) return values
    const index = value.indexOf('=')
    if (index < 1) return values
    const key = value.slice(0, index).trim()
    let entry = value.slice(index + 1).trim()
    if ((entry.startsWith('"') && entry.endsWith('"')) || (entry.startsWith("'") && entry.endsWith("'"))) {
      entry = entry.slice(1, -1)
    }
    values[key] = entry
    return values
  }, {})
}

const fileEnv = {
  ...parseEnv(path.join(root, '.env')),
  ...parseEnv(path.join(root, '.env.local')),
}

const read = (key, fallback = '') => String(process.env[key] ?? fileEnv[key] ?? fallback).trim()
const runtime = Object.fromEntries(browserKeys.map((key) => [
  key,
  read(
    key,
    key === 'VITE_SUPABASE_NOTIFY_FUNCTION_NAME'
      ? 'rmp-email-notifier'
      : key === 'VITE_EMAIL_NOTIFICATIONS_ENABLED'
        ? 'true'
        : '',
  ),
]))

fs.writeFileSync(output, `${JSON.stringify(runtime, null, 2)}\n`)
console.log(`[runtime-env] generated ${path.relative(root, output)}`)
