import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { DASHBOARD_ROUTES, PUBLIC_ROUTE_REDIRECTS, PUBLIC_STATIC_ROUTES } from './dashboard-routes.js'

function dashboardRoutes(): Plugin {
  const preserved = new Set(DASHBOARD_ROUTES.map((route) => `/${route}`))
  const publicStatic = new Set(PUBLIC_STATIC_ROUTES.map((route) => `/${route}`))
  const rewriteRequest = (req: { url?: string }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: () => void }) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const redirect = PUBLIC_ROUTE_REDIRECTS[url.pathname]
    if (redirect) {
      res.statusCode = 302
      res.setHeader('Location', `${redirect}${url.search}`)
      res.end()
      return true
    }
    if (preserved.has(url.pathname) || publicStatic.has(url.pathname)) {
      req.url = `${url.pathname}.html${url.search}`
      return false
    }
    const comparisonMatch = url.pathname.match(/^\/compare\/([^/]+)\/?$/)
    if (comparisonMatch) {
      req.url = `/compare.html${url.search}`
      return false
    }
    const offerMatch = url.pathname.match(/^\/offers\/([^/]+)\/?$/)
    if (offerMatch) {
      url.searchParams.set('firm', offerMatch[1])
      req.url = `/discount-offer.html?${url.searchParams.toString()}`
      return false
    }
    const firmRulesMatch = url.pathname.match(/^\/prop-firm-rules\/([^/]+)(?:\/([^/]+))?\/?$/)
    if (firmRulesMatch) {
      url.searchParams.set('firm', firmRulesMatch[1])
      if (firmRulesMatch[2]) url.searchParams.set('program', firmRulesMatch[2])
      req.url = `/firm-rules.html?${url.searchParams.toString()}`
      return false
    }
    const legacyArticleMatch = url.pathname.match(/^\/blog-post-(\d{2})\/?$/)
    if (legacyArticleMatch) {
      req.url = `/blog-post-${legacyArticleMatch[1]}.html${url.search}`
      return false
    }
    const learningArticleMatch = url.pathname.match(/^\/(trading-guides|funding-strategies|trading-psychology|beginner-tutorials|news)\/([^/]+)\/?$/)
    if (learningArticleMatch) {
      const type = learningArticleMatch[1] === 'news' ? 'prop-news' : learningArticleMatch[1]
      url.searchParams.set('type', type)
      url.searchParams.set('slug', learningArticleMatch[2])
      req.url = `/content-post.html?${url.searchParams.toString()}`
      return false
    }
    const detailMatch = url.pathname.match(/^\/prop-firms\/([^/]+)(?:\/(challenges|rules|reviews|spreads|announcements))?\/?$/)
    if (detailMatch) {
      url.searchParams.set('slug', detailMatch[1])
      if (detailMatch[2] === 'reviews') {
        req.url = `/firm-reviews.html?${url.searchParams.toString()}`
      } else {
        if (detailMatch[2]) url.searchParams.set('view', detailMatch[2])
        req.url = `/firm-detail.html?${url.searchParams.toString()}`
      }
    }
    return false
  }
  return {
    name: 'rmp-preserved-dashboard-routes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (rewriteRequest(req, res)) return
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (rewriteRequest(req, res)) return
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [dashboardRoutes(), react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/, maxSize: 240000, priority: 20 },
            { name: 'react', test: /node_modules[\\/](react|react-dom)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
})
