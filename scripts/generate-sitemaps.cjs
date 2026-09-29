const fs = require('node:fs')
const path = require('node:path')
const legacyBlogRedirects = require('./legacy-blog-redirects.cjs')
const contentConsolidationRedirects = require('./content-consolidation-redirects.cjs')
const {
  isIndexableComparisonFirm,
  isIndexableContentPost,
  isIndexableReviewFirm,
} = require('./seo-quality-gates.cjs')

const root = path.resolve(__dirname, '..')
const publicRoot = path.join(root, 'public')
// Keep every sitemap URL on the same canonical host submitted in Search Console.
// Mixing the apex host here with the www property forces Googlebot through a
// redirect for the index and every discovered URL.
const origin = 'https://www.rankmyprop.in'
const buildDate = new Date().toISOString().slice(0, 10)

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const xmlEscape = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const unique = (values) => [...new Set(values.filter(Boolean))]
const absolute = (route) => `${origin}${route === '/' ? '/' : `/${String(route).replace(/^\/+|\/+$/g, '')}`}`
const slugAliases = { qtfunded: 'qt-funded' }
const canonicalSlug = (value) => slugAliases[slugify(value)] || slugify(value)

function validDate(value = '') {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : ''
}

function urlset(routes, options = {}) {
  const changefreq = options.changefreq || 'weekly'
  const priority = options.priority || '0.7'
  const lastmodByRoute = options.lastmodByRoute || new Map()
  const rows = unique(routes).map((route) => `  <url>\n    <loc>${xmlEscape(absolute(route))}</loc>\n    <lastmod>${lastmodByRoute.get(route) || buildDate}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`
}

function imageUrlset(entries) {
  const rows = entries.map(({ route, images }) => `  <url>\n    <loc>${xmlEscape(absolute(route))}</loc>\n${images.map((image) => `    <image:image>\n      <image:loc>${xmlEscape(image.loc)}</image:loc>${image.title ? `\n      <image:title>${xmlEscape(image.title)}</image:title>` : ''}${image.caption ? `\n      <image:caption>${xmlEscape(image.caption)}</image:caption>` : ''}\n    </image:image>`).join('\n')}\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows}\n</urlset>\n`
}

function write(name, contents) {
  const target = path.join(publicRoot, name)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, contents)
}

async function main() {
  const firmsModule = await import(path.join(publicRoot, 'firms-data.js'))
  const offersModule = await import(path.join(publicRoot, 'offers-data.js'))
  const evidence = JSON.parse(fs.readFileSync(path.join(publicRoot, 'seo-evidence.json'), 'utf8'))
  const lastmodByRoute = new Map()
  const firms = [...firmsModule.DEFAULT_LISTED_FIRMS, ...firmsModule.DEFAULT_BEST_FIRMS]
  const firmSlugs = unique([
    ...firms.map((firm) => canonicalSlug(firm.slug || firm.name || firm.id)),
    ...Object.keys(evidence.firms || {}).map(canonicalSlug),
  ]).sort()
  const surfaceSlugs = (field) => firmSlugs.filter((slug) => evidence.firms?.[slug]?.[field] !== false)
  const profileSlugs = surfaceSlugs('showFirmProfile')
  const reviewSlugs = surfaceSlugs('showReviews').filter((slug) => isIndexableReviewFirm(slug, evidence))
  const ruleSlugs = surfaceSlugs('showRules')
  const compareSlugs = profileSlugs.filter((slug) => isIndexableComparisonFirm({ ...evidence.firms?.[slug], slug }, evidence))
  const offerSlugs = unique([
    ...offersModule.DEFAULT_OFFERS.map((offer) => canonicalSlug(offer.slug || offer.name || offer.id)),
    ...Object.keys(evidence.offers || {}).map(canonicalSlug),
  ]).filter((slug) => evidence.firms?.[slug]?.showOffers !== false).sort()

  const primaryPages = [
    '/', '/listedprop', '/bestprop', '/best-prop-firms-2026', '/highest-rated-firms',
    '/fast-payout-prop-firms', '/best-instant-funding-firms', '/best-futures-prop-firms',
    '/best-hft-prop-firms', '/cheapest-prop-firms', '/most-trusted-prop-firms',
    '/beginner-friendly-firms', '/offers', '/reviews', '/compare', '/prop-firm-rules',
    '/prop-news', '/trading-guides', '/funding-strategies', '/trading-psychology',
    '/beginner-tutorials', '/calculators', '/lotsizecalculator', '/risk-to-reward-calculator',
    '/drawdown-calculator', '/profit-split-calculator', '/consistency-rule-calculator',
    '/lossrecoveryplanner', '/ruletranslator', '/about', '/contact', '/legal', '/disclaimer',
    '/privacy-policy', '/terms', '/cookies-policy', '/prop-firm-market-report'
  ]
  const legacyArticles = Array.from({ length: 30 }, (_, index) => String(index + 1).padStart(2, '0'))
    .filter((id) => !legacyBlogRedirects[id])
    .map((id) => `/blog/blog-post-${id}`)
  const retainedContentDestinations = new Set(Object.values(contentConsolidationRedirects))
  const cmsArticles = Object.values(evidence.content || {}).flat()
    .filter((post) => isIndexableContentPost(post) || retainedContentDestinations.has(`/${post.routeBase}/${post.slug}`))
    .map((post) => `/${post.routeBase}/${post.slug}`)
    .filter((route) => !contentConsolidationRedirects[route])
  const articlePages = unique([...legacyArticles, ...cmsArticles]).sort()
  const pages = primaryPages
  const firmPages = profileSlugs.map((slug) => `/prop-firms/${slug}`)
  const reviewPages = reviewSlugs.map((slug) => `/prop-firms/${slug}/reviews`)
  const baseRulePages = ruleSlugs.map((slug) => `/prop-firm-rules/${slug}`)
  const programRulePages = ruleSlugs.flatMap((slug) => (evidence.firms?.[slug]?.programs || []).map((program) => {
    const programSlug = slugify(program.program || program.name || program.title || program.model)
    return programSlug ? `/prop-firm-rules/${slug}/${programSlug}` : ''
  })).filter(Boolean)
  const offerPages = offerSlugs.map((slug) => `/offers/${slug}`)
  const comparePages = []
  for (let first = 0; first < compareSlugs.length; first += 1) {
    for (let second = first + 1; second < compareSlugs.length; second += 1) {
      comparePages.push(`/compare/${compareSlugs[first]}-vs-${compareSlugs[second]}`)
    }
  }

  const sourceDate = (route) => {
    const candidates = route === '/'
      ? [path.join(root, 'src', 'HomeHero.tsx'), path.join(root, 'src', 'App.tsx'), path.join(root, 'index.html')]
      : [path.join(publicRoot, `${route.replace(/^\//, '')}.html`)]
    const dates = candidates.filter(fs.existsSync).map((file) => fs.statSync(file).mtime.toISOString().slice(0, 10))
    return dates.sort().at(-1) || buildDate
  }
  primaryPages.forEach((route) => lastmodByRoute.set(route, sourceDate(route)))
  Object.values(evidence.content || {}).flat().forEach((post) => lastmodByRoute.set(`/${post.routeBase}/${post.slug}`, validDate(post.updatedAt || post.publishedAt) || buildDate))
  legacyArticles.forEach((route) => lastmodByRoute.set(route, sourceDate(`/${route.split('/').at(-1)}`)))
  profileSlugs.forEach((slug) => lastmodByRoute.set(`/prop-firms/${slug}`, validDate(evidence.firms?.[slug]?.updatedAt) || buildDate))
  reviewSlugs.forEach((slug) => {
    const newestReview = (evidence.reviews?.[slug] || []).map((review) => review.datePublished).filter(Boolean).sort().at(-1)
    lastmodByRoute.set(`/prop-firms/${slug}/reviews`, validDate(newestReview || evidence.firms?.[slug]?.updatedAt) || buildDate)
  })
  ruleSlugs.forEach((slug) => lastmodByRoute.set(`/prop-firm-rules/${slug}`, validDate(evidence.firms?.[slug]?.updatedAt) || buildDate))
  programRulePages.forEach((route) => {
    const slug = route.split('/')[2]
    lastmodByRoute.set(route, validDate(evidence.firms?.[slug]?.updatedAt) || buildDate)
  })
  offerSlugs.forEach((slug) => lastmodByRoute.set(`/offers/${slug}`, validDate(evidence.offers?.[slug]?.updatedAt || evidence.firms?.[slug]?.updatedAt) || buildDate))
  comparePages.forEach((route) => {
    const [left, right] = route.replace('/compare/', '').split('-vs-')
    const latest = [evidence.firms?.[left]?.updatedAt, evidence.firms?.[right]?.updatedAt].filter(Boolean).sort().at(-1)
    lastmodByRoute.set(route, validDate(latest) || buildDate)
  })

  const maps = [
    ['sitemap-pages.xml', pages, { changefreq: 'weekly', priority: '0.8', lastmodByRoute }],
    ['sitemap-articles.xml', articlePages, { changefreq: 'weekly', priority: '0.8', lastmodByRoute }],
    ['sitemap-firms.xml', firmPages, { changefreq: 'daily', priority: '0.9', lastmodByRoute }],
    ['sitemap-reviews.xml', reviewPages, { changefreq: 'daily', priority: '0.8', lastmodByRoute }],
    ['sitemap-rules.xml', baseRulePages, { changefreq: 'weekly', priority: '0.8', lastmodByRoute }],
    ['sitemaps/challenge-rules.xml', programRulePages, { changefreq: 'weekly', priority: '0.9', lastmodByRoute }],
    ['sitemap-offers.xml', offerPages, { changefreq: 'daily', priority: '0.9', lastmodByRoute }],
    ['sitemap-compare.xml', comparePages, { changefreq: 'weekly', priority: '0.7', lastmodByRoute }],
  ]
  maps.forEach(([name, routes, options]) => write(name, urlset(routes, options)))

  const imageEntries = []
  const addImage = (route, rawUrl, title, caption = '') => {
    const value = String(rawUrl || '').trim()
    const loc = value.startsWith('https://') ? value : value.startsWith('/') ? `${origin}${value}` : value.startsWith('assets/') ? `${origin}/${value}` : ''
    if (!loc) return
    let entry = imageEntries.find((candidate) => candidate.route === route)
    if (!entry) {
      entry = { route, images: [] }
      imageEntries.push(entry)
    }
    if (!entry.images.some((image) => image.loc === loc)) entry.images.push({ loc, title, caption })
  }
  Object.values(evidence.firms || {}).filter((firm) => firm.showFirmProfile !== false).forEach((firm) => addImage(`/prop-firms/${canonicalSlug(firm.slug || firm.name)}`, firm.logo, `${firm.name} logo`, `${firm.name} prop firm profile`))
  Object.values(evidence.content || {}).flat().forEach((post) => addImage(`/${post.routeBase}/${post.slug}`, post.coverImage, post.title, post.excerpt))
  legacyArticles.forEach((route) => {
    const id = route.match(/blog-post-(\d+)/)?.[1]
    const file = path.join(publicRoot, `blog-post-${id}.html`)
    const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1] || ''
    const title = html.match(/<title>([^<]+)/i)?.[1]?.replace(/\s*\|\s*Rank My Prop\s*$/i, '') || `Rank My Prop article ${index + 1}`
    addImage(route, image, title, title)
  })
  write('sitemap-images.xml', imageUrlset(imageEntries))

  const indexRows = [...maps.map(([name]) => name), 'sitemap-images.xml'].map((name) => `  <sitemap>\n    <loc>${origin}/${name}</loc>\n    <lastmod>${buildDate}</lastmod>\n  </sitemap>`).join('\n')
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexRows}\n</sitemapindex>\n`)

  const inventory = Object.fromEntries(maps.map(([name, routes]) => [name, unique(routes).length]))
  write('sitemap-inventory.json', `${JSON.stringify({
    generatedAt: new Date().toISOString(), origin,
    totalUrls: Object.values(inventory).reduce((sum, value) => sum + value, 0),
    activeFirms: firmSlugs.length,
    profileFirms: profileSlugs.length,
    reviewFirms: reviewSlugs.length,
    ruleFirms: ruleSlugs.length,
    comparisonFirms: compareSlugs.length,
    activeOffers: offerSlugs.length,
    publishedArticles: articlePages.length,
    cmsArticles: cmsArticles.length,
    imagePages: imageEntries.length,
    images: imageEntries.reduce((sum, entry) => sum + entry.images.length, 0),
    rulePrograms: programRulePages.length,
    uniqueComparisonPairs: comparePages.length,
    reverseComparisonAliases: comparePages.length,
    sitemaps: { ...inventory, 'sitemap-images.xml': imageEntries.length },
  }, null, 2)}\n`)
  console.log(`[sitemaps] generated ${Object.values(inventory).reduce((sum, value) => sum + value, 0)} public URLs`, inventory)
}

main().catch((error) => {
  console.error('[sitemaps] generation failed', error)
  process.exitCode = 1
})
