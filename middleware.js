import { next } from '@vercel/functions'
import routeContent from './api/_lib/route-content.js'

export const config = {
  matcher: '/:path*',
}

const SSR_BYPASS_HEADER = 'x-rmp-route-ssr-bypass'
const PRIVATE_OR_ASSET_RE = /^\/(?:api(?:\/|$)|admin(?:-|\/|$)|dashboard(?:-|\/|$)|login(?:\/|$)|onboarding(?:\/|$)|my-profile(?:\/|$)|edit-profile(?:\/|$)|assets(?:\/|$)|_vercel(?:\/|$)|.*\.[a-z0-9]+$)/i

function isPublicDocumentRequest(request, url) {
  if (request.method !== 'GET' || request.headers.get(SSR_BYPASS_HEADER) === '1') return false
  if (PRIVATE_OR_ASSET_RE.test(url.pathname)) return false
  const accept = request.headers.get('accept') || ''
  return !accept || accept.includes('text/html') || accept.includes('*/*')
}

export default async function canonicalComparisonOrder(request) {
  const url = new URL(request.url)
  const comparison = decodeURIComponent(url.pathname.replace(/^\/compare\//, '').replace(/\/+$/, ''))
  const separator = comparison.indexOf('-vs-')
  if (separator >= 1) {
    const first = comparison.slice(0, separator)
    const second = comparison.slice(separator + 4)
    if (first && second && first.localeCompare(second) > 0) {
      url.pathname = `/compare/${second}-vs-${first}`
      url.search = ''
      return new Response(null, {
        status: 308,
        headers: {
          Location: url.toString(),
          'Cache-Control': 'public, max-age=0, s-maxage=86400',
        },
      })
    }
  }

  if (!isPublicDocumentRequest(request, url)) return next()

  const context = {
    id: routeContent.pageContentIdForRoute(url.pathname, url.search),
    pathname: url.pathname,
    search: url.search,
  }
  try {
    const contentUrl = new URL('/api/public-page-content', url)
    contentUrl.searchParams.set('pathname', context.pathname)
    contentUrl.searchParams.set('search', context.search)
    const contentResponse = await fetch(contentUrl, { headers: { 'Cache-Control': 'no-store' } })
    if (!contentResponse.ok) return next()
    const payload = await contentResponse.json()
    if (!payload?.record || payload.id !== context.id || payload.record.id !== context.id) return next()

    const pageHeaders = new Headers(request.headers)
    pageHeaders.set(SSR_BYPASS_HEADER, '1')
    const pageResponse = await fetch(new Request(request, { headers: pageHeaders }))
    const contentType = pageResponse.headers.get('content-type') || ''
    if (!pageResponse.ok || !contentType.includes('text/html')) return pageResponse

    const html = routeContent.injectRouteBootstrap(await pageResponse.text(), payload.record, context, payload.version)
    const responseHeaders = new Headers(pageResponse.headers)
    responseHeaders.delete('content-length')
    responseHeaders.delete('content-encoding')
    responseHeaders.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
    responseHeaders.set('X-RMP-Route-Content-ID', context.id)
    return new Response(html, { status: pageResponse.status, statusText: pageResponse.statusText, headers: responseHeaders })
  } catch (_) {
    return next()
  }
}
