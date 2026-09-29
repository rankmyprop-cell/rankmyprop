const API_URL = String(import.meta.env.VITE_CLOUDFLARE_API_URL || 'https://rankmyprop-api.theforexclue.workers.dev').replace(/\/$/, '')

export async function listCloudflareCollection<T extends Record<string, unknown>>(collection: string, limit = 100): Promise<T[]> {
  const rows: T[] = []
  let cursor = ''
  do {
    const url = new URL(`${API_URL}/v1/collections/${encodeURIComponent(collection)}`)
    url.searchParams.set('limit', String(Math.min(100, Math.max(1, limit - rows.length))))
    if (cursor) url.searchParams.set('cursor', cursor)
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`Cloudflare collection ${collection} failed (${response.status})`)
    const payload = await response.json() as { data?: T[]; nextCursor?: string | null }
    rows.push(...(payload.data || []))
    cursor = payload.nextCursor || ''
  } while (cursor && rows.length < limit)
  return rows.slice(0, limit)
}
