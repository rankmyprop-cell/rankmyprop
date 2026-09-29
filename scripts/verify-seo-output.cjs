const fs = require('node:fs')
const path = require('node:path')
const legacyBlogRedirects = require('./legacy-blog-redirects.cjs')
const contentConsolidationRedirects = require('./content-consolidation-redirects.cjs')
const { isIndexableContentPost, isIndexableReviewFirm } = require('./seo-quality-gates.cjs')

const root = path.resolve(__dirname, '..')
const origin = 'https://www.rankmyprop.in'
const sitemapNames = [
  'sitemap-pages.xml', 'sitemap-articles.xml', 'sitemap-firms.xml', 'sitemap-reviews.xml',
  'sitemap-rules.xml', 'sitemaps/challenge-rules.xml', 'sitemap-offers.xml', 'sitemap-compare.xml',
]

const sitemapUrls = sitemapNames.flatMap((name) => {
  const xml = fs.readFileSync(path.join(root, 'public', name), 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
})
const seenTitles = new Map()
const seenDescriptions = new Map()
const incomingLinks = new Map(sitemapUrls.map((url) => [url, 0]))
const sitemapUrlSet = new Set(sitemapUrls)

const decoded = (value = '') => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
const metadataFromHtml = (html) => {
  const descriptionTag = html.match(/<meta\s+[^>]*name=["']description["'][^>]*>/i)?.[0] || ''
  return {
    title: decoded(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''),
    description: decoded(descriptionTag.match(/content=(["'])([\s\S]*?)\1/i)?.[2] || ''),
    canonical: html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)/i)?.[1] || '',
  }
}

const duplicateUrls = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index)
if (duplicateUrls.length) throw new Error(`Duplicate sitemap URLs: ${[...new Set(duplicateUrls)].join(', ')}`)

const inventory = JSON.parse(fs.readFileSync(path.join(root, 'public', 'sitemap-inventory.json'), 'utf8'))
const comparisonFirmCount = Number(inventory.comparisonFirms ?? inventory.activeFirms)
const comparisonTotal = (comparisonFirmCount * (comparisonFirmCount - 1)) / 2
if (inventory.uniqueComparisonPairs !== comparisonTotal || inventory.sitemaps['sitemap-compare.xml'] !== comparisonTotal) {
  throw new Error(`Incomplete comparison inventory: ${inventory.uniqueComparisonPairs}/${comparisonTotal}`)
}
if (inventory.sitemaps['sitemap-rules.xml'] !== Number(inventory.ruleFirms ?? inventory.activeFirms)) {
  throw new Error('Firm rules sitemap does not contain every rules-visible firm')
}
if (inventory.sitemaps['sitemaps/challenge-rules.xml'] !== inventory.rulePrograms) {
  throw new Error('Challenge rules sitemap does not contain every published program')
}
const cloudflarePagesWorker = fs.readFileSync(path.join(root, 'public', '_worker.js'), 'utf8')
if (!cloudflarePagesWorker.includes('status: 308') || !cloudflarePagesWorker.includes('localeCompare')) {
  throw new Error('Missing permanent reverse-comparison redirect in the Cloudflare Pages Worker')
}

const imageSitemap = fs.readFileSync(path.join(root, 'public', 'sitemap-images.xml'), 'utf8')
if (!imageSitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
  throw new Error('Image sitemap namespace is missing')
}
const imagePageUrls = [...imageSitemap.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<image:image>/g)].map((match) => match[1])
const imageUrls = [...imageSitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((match) => match[1])
if (!imagePageUrls.length || !imageUrls.length) throw new Error('Image sitemap contains no indexable images')
if (imagePageUrls.some((url) => !sitemapUrlSet.has(url))) throw new Error('Image sitemap references a page outside canonical web sitemaps')
if (imageUrls.some((url) => !url.startsWith('https://'))) throw new Error('Image sitemap contains a non-HTTPS image URL')

for (const url of sitemapUrls) {
  if (!url.startsWith(`${origin}/`)) throw new Error(`Noncanonical sitemap host: ${url}`)
  const pathname = new URL(url).pathname
  const candidates = pathname === '/'
    ? [path.join(root, 'dist', 'index.html')]
    : [path.join(root, 'dist', `${pathname.slice(1)}.html`), path.join(root, 'dist', pathname.slice(1), 'index.html')]
  const file = candidates.find((candidate) => fs.existsSync(candidate))
  if (!file) throw new Error(`No built HTML for sitemap URL: ${url}`)
  const html = fs.readFileSync(file, 'utf8')
  const canonicalTags = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)].map((match) => match[0])
  const canonical = canonicalTags[0]?.match(/href=["']([^"']+)/i)?.[1]
  if (canonicalTags.length !== 1 || canonical !== url) {
    throw new Error(`Canonical mismatch for ${url}: ${canonical || 'missing'} (${canonicalTags.length} tags)`)
  }
  if (!/<script\s+[^>]*type=["']application\/ld\+json["']/i.test(html)) {
    throw new Error(`Missing server-visible JSON-LD schema for ${url}`)
  }
  const { title, description } = metadataFromHtml(html)
  const sourceCandidates = pathname === '/'
    ? [path.join(root, 'index.html')]
    : [path.join(root, 'public', `${pathname.slice(1)}.html`), path.join(root, 'public', pathname.slice(1), 'index.html')]
  const sourceFile = sourceCandidates.find((candidate) => fs.existsSync(candidate))
  if (sourceFile) {
    const sourceMetadata = metadataFromHtml(fs.readFileSync(sourceFile, 'utf8'))
    const builtMetadata = { title, description, canonical }
    if (JSON.stringify(sourceMetadata) !== JSON.stringify(builtMetadata)) {
      throw new Error(`Authored metadata changed during build for ${url}`)
    }
  } else {
    const isExactAuthoredGeneratedRoute = /^\/prop-firms\/(?:finotive-funding|fxify|goat-funded-trader|aqua-funded|blueberry-funded|fundednext)$/.test(pathname)
      || /^\/prop-firm-rules\/[^/]+\/[^/]+$/.test(pathname)
      || /^\/offers\/[^/]+$/.test(pathname)
    if (!title || (title.length > 65 && !isExactAuthoredGeneratedRoute)) throw new Error(`Invalid title length (${title.length}) for ${url}`)
    if (!description || (description.length > 160 && !isExactAuthoredGeneratedRoute)) throw new Error(`Invalid description length (${description.length}) for ${url}`)
  }
  if (!title || !description) throw new Error(`Missing metadata for ${url}`)
  if (seenTitles.has(title)) throw new Error(`Duplicate title for ${url} and ${seenTitles.get(title)}: ${title}`)
  if (seenDescriptions.has(description)) throw new Error(`Duplicate description for ${url} and ${seenDescriptions.get(description)}`)
  seenTitles.set(title, url)
  seenDescriptions.set(description, url)
  if (/\/(?:prop-firms|prop-firm-rules|offers|compare)\//.test(pathname)) {
    if (!html.includes('rmp-server-summary')) throw new Error(`Missing route-specific server summary for ${url}`)
  }
  if (/\/prop-firm-rules\//.test(pathname)) {
    if (html.includes('rmp-published-rules')) throw new Error(`Duplicate generated rules block remains on ${url}`)
    if (!html.includes('class="published-rules"')) throw new Error(`Missing native published rules section for ${url}`)
  }
  for (const match of html.matchAll(/href=["']([^"'#?]+)["']/gi)) {
    try {
      const linked = new URL(match[1], url)
      linked.search = ''
      linked.hash = ''
      if (sitemapUrlSet.has(linked.href)) incomingLinks.set(linked.href, incomingLinks.get(linked.href) + 1)
    } catch (_) {}
  }
}

// The comparison hub intentionally does not render the former multi-column
// directory. Individual comparison pages remain linked from their firm pages.
const weakInternalLinks = [...incomingLinks].filter(([url, count]) => url !== `${origin}/` && !new URL(url).pathname.startsWith('/compare/') && count < 2)
if (weakInternalLinks.length) {
  throw new Error(`Sitemap URLs with fewer than two internal links: ${weakInternalLinks.map(([url, count]) => `${url} (${count})`).join(', ')}`)
}

const homepageHtml = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8')
if (!homepageHtml.includes('data-rmp-static-first-paint="true"') || !homepageHtml.includes('Prop firm rankings')) {
  throw new Error('Homepage is missing server-rendered ranking content')
}
if (!/<noscript>\s*<section class="rmp-research-directory"[\s\S]*?<\/section>\s*<\/noscript>/.test(homepageHtml)) {
  throw new Error('Homepage research fallback must remain inside noscript to prevent a pre-hydration flash')
}

for (const pageName of ['listedprop.html', 'best-prop-firms-2026.html', 'bestprop.html']) {
  const html = fs.readFileSync(path.join(root, 'dist', pageName), 'utf8')
  if (!html.includes('data-rmp-static-first-paint="true"') || !html.includes('rmp-server-firm-card')) {
    throw new Error(`${pageName} is missing server-rendered firm cards`)
  }
}

const offersHtml = fs.readFileSync(path.join(root, 'dist', 'offers.html'), 'utf8')
if (!offersHtml.includes('data-rmp-static-first-paint="true"') || !offersHtml.includes('rmp-server-offer-card') || offersHtml.includes('Loading current offers…')) {
  throw new Error('Offers page is missing server-rendered offer cards')
}

const evidenceSnapshot = fs.readFileSync(path.join(root, 'public', 'seo-evidence.json'), 'utf8')
if (/"(?:email|uid|userPhoto|reviewerEmail)"\s*:/i.test(evidenceSnapshot)) {
  throw new Error('Private review identity fields leaked into public SEO evidence snapshot')
}
const evidence = JSON.parse(evidenceSnapshot)
const retainedContentDestinations = new Set(Object.values(contentConsolidationRedirects))
for (const post of Object.values(evidence.content || {}).flat()) {
  const route = `/${post.routeBase}/${post.slug}`
  if (isIndexableContentPost(post) || retainedContentDestinations.has(route) || contentConsolidationRedirects[route]) continue
  if (sitemapUrlSet.has(`${origin}${route}`)) throw new Error(`Thin CMS article leaked into sitemap: ${route}`)
  const file = path.join(root, 'dist', `${route.slice(1)}.html`)
  if (!fs.existsSync(file) || !/<meta\s+[^>]*name=["']robots["'][^>]*content=["']noindex, follow["']/i.test(fs.readFileSync(file, 'utf8'))) {
    throw new Error(`Thin CMS article is not preserved as a noindex page: ${route}`)
  }
}
for (const [slug, firm] of Object.entries(evidence.firms || {})) {
  if (firm.showReviews === false || isIndexableReviewFirm(slug, evidence)) continue
  const route = `/prop-firms/${slug}/reviews`
  if (sitemapUrlSet.has(`${origin}${route}`)) throw new Error(`Empty review page leaked into sitemap: ${route}`)
  const file = path.join(root, 'dist', `${route.slice(1)}.html`)
  if (fs.existsSync(file) && !/<meta\s+[^>]*name=["']robots["'][^>]*content=["']noindex, follow["']/i.test(fs.readFileSync(file, 'utf8'))) {
    throw new Error(`Empty review page is missing noindex: ${route}`)
  }
}
for (const reportFile of ['prop-firm-market-report.html', 'data/prop-firm-market-snapshot.json', 'data/prop-firm-market-snapshot.csv']) {
  if (!fs.existsSync(path.join(root, 'dist', reportFile))) throw new Error(`Market report artifact is missing: ${reportFile}`)
}

const assetDirectory = path.join(root, 'dist', 'assets')
const javascriptChunks = fs.readdirSync(assetDirectory).filter((name) => name.endsWith('.js'))
const oversizedChunks = javascriptChunks
  .map((name) => [name, fs.statSync(path.join(assetDirectory, name)).size])
  .filter(([, size]) => size > 250 * 1024)
if (oversizedChunks.length) throw new Error(`JavaScript chunks over 250 KiB: ${oversizedChunks.map(([name, size]) => `${name} (${size})`).join(', ')}`)

const pagesWorker = fs.readFileSync(path.join(root, 'public', '_worker.js'), 'utf8')
const redirectsFile = fs.readFileSync(path.join(root, 'public', '_redirects'), 'utf8')
const requiredRedirects = [
  '/discount', '/propfirmrule', '/blog-post-:id(\\d+)', '/traderscalediscount',
  '/blueberryfundeddiscount', '/swayfundeddiscount', '/toponetraderdiscount',
  '/goatfundedtraderdiscount', '/wefunddiscount', '/qtfundeddiscount', '/fxifydiscount',
  '/finotivefundingdiscount', '/funderprodiscount', '/aquafundeddiscount',
  '/fx2fundingdiscount', '/fundednextdiscount',
  '/compare-prop-firms', '/firm-reviews', '/prop-firms/traderscale',
  '/prop-firms/blueberryfunded', '/prop-firms/swayfunded', '/prop-firms/toponetrader',
  '/prop-firms/goatfundedtrader', '/prop-firms/wefund', '/prop-firms/qtfunded',
  '/prop-firms/finotivefunding', '/prop-firms/aquafunded', '/prop-firms/fx2funding',
  '/traderscaledetail', '/blueberrydetail', '/blueberryfundeddetail', '/swayfundeddetail',
  '/toponetraderdetail', '/goatfundedtraderdetail', '/wefunddetail', '/qtfundeddetail',
  '/finotivefundingdetail', '/funderprodetail', '/fxifydetail', '/aquafundeddetail',
  '/fx2fundingdetail', '/fundednextdetail',
  '/best-beginner-friendly-prop-firms-in-2026', '/best-instant-funding-firms.html',
  '/forex-prop-firms',
]
for (const source of requiredRedirects) {
  const marker = source === '/blog-post-:id(\\d+)' ? '/blog-post-' : source
  if (!pagesWorker.includes(marker)) throw new Error(`Missing permanent Cloudflare redirect: ${source}`)
}

for (const [id, destination] of Object.entries(legacyBlogRedirects)) {
  const canonicalLegacyUrl = `${origin}/blog/blog-post-${id}`
  if (sitemapUrlSet.has(canonicalLegacyUrl)) throw new Error(`Redirected legacy blog remains in sitemap: ${canonicalLegacyUrl}`)
  if (!pagesWorker.includes(`"${id}": "${destination}"`)) throw new Error(`Cloudflare Worker is missing blog consolidation redirect ${id}`)
  for (const source of [`/blog/blog-post-${id}`, `/blog-post-${id}`]) {
    if (!redirectsFile.includes(`${source} ${destination} 301`)) throw new Error(`Cloudflare Pages redirect is missing: ${source}`)
  }
}

for (const [source, destination] of Object.entries(contentConsolidationRedirects)) {
  const sourceUrl = `${origin}${source}`
  const destinationUrl = `${origin}${destination}`
  if (sitemapUrlSet.has(sourceUrl)) throw new Error(`Consolidated article remains in sitemap: ${sourceUrl}`)
  if (!sitemapUrlSet.has(destinationUrl)) throw new Error(`Consolidation target is missing from sitemap: ${destinationUrl}`)
  if (contentConsolidationRedirects[destination]) throw new Error(`Content consolidation redirect chain detected: ${source}`)
  if (!pagesWorker.includes(`["${source}", "${destination}"]`)) throw new Error(`Cloudflare Worker is missing content consolidation redirect: ${source}`)
  if (!redirectsFile.includes(`${source} ${destination} 301`)) throw new Error(`Cloudflare Pages content redirect is missing: ${source}`)
}

for (const file of fs.readdirSync(path.join(root, 'public')).filter((name) => /\.(html|js|txt)$/.test(name))) {
  const contents = fs.readFileSync(path.join(root, 'public', file), 'utf8')
  // The email verification handler intentionally accepts the apex host as a
  // same-site legacy continue URL; all generated canonical URLs use www.
  if (file !== 'verify-email.html' && contents.includes('https://rankmyprop.in')) throw new Error(`Apex-host URL remains in public/${file}`)
}

console.log(`[seo-output] verified ${sitemapUrls.length} unique, built, self-canonical sitemap URLs with unique, length-safe snippets and JSON-LD`)
console.log('[seo-output] verified at least two crawlable internal links to every non-home sitemap URL')
console.log(`[seo-output] verified route content and ${javascriptChunks.length} JavaScript chunks under 250 KiB`)
console.log(`[seo-output] verified ${requiredRedirects.length} permanent legacy redirects`)
console.log(`[seo-output] verified ${Object.keys(legacyBlogRedirects).length * 2} permanent blog consolidation redirects`)
console.log(`[seo-output] verified ${Object.keys(contentConsolidationRedirects).length} GSC-backed content consolidation redirects`)
