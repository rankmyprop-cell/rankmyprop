const fs = require('node:fs')
const path = require('node:path')

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
if (!fs.readFileSync(path.join(root, 'middleware.js'), 'utf8').includes('status: 308')) {
  throw new Error('Missing permanent reverse-comparison redirect middleware')
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
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() || ''
  const descriptionTag = html.match(/<meta\s+[^>]*name=["']description["'][^>]*>/i)?.[0] || ''
  const description = (descriptionTag.match(/content=(["'])([\s\S]*?)\1/i)?.[2] || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  if (!title || title.length > 65) throw new Error(`Invalid title length (${title.length}) for ${url}`)
  if (!description || description.length > 160) throw new Error(`Invalid description length (${description.length}) for ${url}`)
  if (seenTitles.has(title)) throw new Error(`Duplicate title for ${url} and ${seenTitles.get(title)}: ${title}`)
  if (seenDescriptions.has(description)) throw new Error(`Duplicate description for ${url} and ${seenDescriptions.get(description)}`)
  seenTitles.set(title, url)
  seenDescriptions.set(description, url)
  if (/\/(?:prop-firms|prop-firm-rules|offers|compare)\//.test(pathname)) {
    if (!html.includes('rmp-server-summary')) throw new Error(`Missing route-specific server summary for ${url}`)
  }
  if (/\/prop-firm-rules\//.test(pathname) && !html.includes('rmp-published-rules')) {
    throw new Error(`Missing published rules content for ${url}`)
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
if (!/<noscript>\s*<section class="rmp-research-directory"[\s\S]*?<\/section>\s*<\/noscript>/.test(homepageHtml)) {
  throw new Error('Homepage research fallback must remain inside noscript to prevent a pre-hydration flash')
}

const evidenceSnapshot = fs.readFileSync(path.join(root, 'public', 'seo-evidence.json'), 'utf8')
if (/"(?:email|uid|userPhoto|reviewerEmail)"\s*:/i.test(evidenceSnapshot)) {
  throw new Error('Private review identity fields leaked into public SEO evidence snapshot')
}

const assetDirectory = path.join(root, 'dist', 'assets')
const javascriptChunks = fs.readdirSync(assetDirectory).filter((name) => name.endsWith('.js'))
const oversizedChunks = javascriptChunks
  .map((name) => [name, fs.statSync(path.join(assetDirectory, name)).size])
  .filter(([, size]) => size > 250 * 1024)
if (oversizedChunks.length) throw new Error(`JavaScript chunks over 250 KiB: ${oversizedChunks.map(([name, size]) => `${name} (${size})`).join(', ')}`)

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
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
]
for (const source of requiredRedirects) {
  const redirect = vercel.redirects?.find((entry) => entry.source === source)
  if (!redirect?.permanent) throw new Error(`Missing permanent redirect: ${source}`)
}

for (const file of fs.readdirSync(path.join(root, 'public')).filter((name) => /\.(html|js|txt)$/.test(name))) {
  const contents = fs.readFileSync(path.join(root, 'public', file), 'utf8')
  if (contents.includes('https://rankmyprop.in')) throw new Error(`Apex-host URL remains in public/${file}`)
}

console.log(`[seo-output] verified ${sitemapUrls.length} unique, built, self-canonical sitemap URLs with unique, length-safe snippets and JSON-LD`)
console.log('[seo-output] verified at least two crawlable internal links to every non-home sitemap URL')
console.log(`[seo-output] verified route content and ${javascriptChunks.length} JavaScript chunks under 250 KiB`)
console.log(`[seo-output] verified ${requiredRedirects.length} permanent legacy redirects`)
