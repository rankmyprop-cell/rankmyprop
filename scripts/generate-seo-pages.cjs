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
const distRoot = path.join(root, 'dist')
const origin = 'https://www.rankmyprop.in'

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const canonicalSlug = (value = '') => {
  const slug = slugify(value)
  return slug === 'qtfunded' ? 'qt-funded' : slug
}

const htmlEscape = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

const htmlUnescape = (value = '') => String(value)
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')

const compact = (value = '') => String(value).replace(/\s+/g, ' ').trim()

function legacyLongFormBodies() {
  const bodies = new Map()
  for (const id of Object.keys(legacyBlogRedirects)) {
    if (id === '04') continue
    const file = path.join(distRoot, `blog-post-${id}.html`)
    if (!fs.existsSync(file)) continue
    const html = fs.readFileSync(file, 'utf8')
    const title = htmlUnescape(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, ' ')
    let body = html.match(/<article\s+class=["']content["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] || ''
    body = body
      .replace(/<div\s+class=["']rmp-seo-links-block["'][\s\S]*?<\/div>/gi, '')
      .replace(/<p>\s*From an SEO perspective,[\s\S]*?<\/p>/gi, '')
      .replace(/href=(["'])\/blog\/blog-post-(\d+)\1/gi, (match, quote, rawId) => {
        const target = legacyBlogRedirects[String(Number(rawId)).padStart(2, '0')]
        return target ? `href=${quote}${target}${quote}` : match
      })
      .trim()
    if (compact(title) && compact(body)) bodies.set(compact(title).toLowerCase(), body)
  }
  return bodies
}

function metaContent(html, attribute, value) {
  const tag = html.match(new RegExp(`<meta\\s+[^>]*${attribute}=["']${value}["'][^>]*>`, 'i'))?.[0]
  return tag?.match(/content=(["'])([\s\S]*?)\1/i)?.[2] || ''
}

function titleWithBrand(core) {
  const branded = `${compact(core)} | Rank My Prop`
  if (branded.length <= 65) return branded
  const unbranded = compact(core)
  return unbranded.length <= 65 ? unbranded : `${unbranded.slice(0, 62).trim()}...`
}

function descriptionWithinLimit(value) {
  const description = compact(value)
  if (description.length <= 160) return description
  const shortened = description.slice(0, 157).replace(/\s+\S*$/, '')
  return `${shortened}...`
}

function offerDiscountPercent(value = '') {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)\s*%?/)
  if (!match) return '0'
  const amount = Number(match[1])
  return Number.isFinite(amount) ? String(amount) : match[1]
}

function evidenceReviewCards(firmName, reviews = []) {
  if (!reviews.length) {
    return `<p>No approved ${htmlEscape(firmName)} community review is published yet. Ratings and payout claims are not inferred from promotional data.</p>`
  }
  return reviews.slice(0, 4).map((review) => {
    const proof = review.proofUrl ? `<a href="${htmlEscape(review.proofUrl)}" target="_blank" rel="noopener nofollow">View attached proof</a>` : '<span>No public proof attachment</span>'
    const details = [review.program, review.accountSize, review.fundingPeriod].filter(Boolean).map(htmlEscape).join(' · ')
    return `<article style="padding:18px;border:1px solid rgba(122,116,255,.2);border-radius:12px"><header><strong>${htmlEscape(review.title || `${firmName} trader review`)}</strong><span style="display:block">${htmlEscape(review.rating.toFixed(1))}/5 · ${htmlEscape(review.reviewer)}${review.datePublished ? ` · ${htmlEscape(review.datePublished.slice(0, 10))}` : ''}</span></header>${details ? `<p>${details}</p>` : ''}<p>${htmlEscape(review.body || 'Approved rating submitted without a written review.')}</p><p><strong>Reported payouts:</strong> ${htmlEscape(review.payoutCount)} · ${proof}</p>${review.pros ? `<p><strong>Positive:</strong> ${htmlEscape(review.pros)}</p>` : ''}${review.cons ? `<p><strong>Could improve:</strong> ${htmlEscape(review.cons)}</p>` : ''}</article>`
  }).join('')
}

function reviewEvidenceSection(firmName, reviews = [], cmsFirm = {}) {
  // Community reviews remain in their normal review feeds. Do not append a
  // duplicate evidence/status panel to firm, review, offer, rules, or compare pages.
  return ''
}

function publishedRulesSection(firmName, cmsFirm = {}, selectedProgram = '') {
  // Rules already render in the dedicated CMS-driven rule UI. Repeating the
  // same dataset as a generated block made it appear below the shared footer.
  return ''
}

function insertBeforePageFooter(html, content) {
  if (!content) return html
  const lower = html.toLowerCase()
  const mainClose = lower.lastIndexOf('</main>')
  const footerStart = lower.lastIndexOf('<footer')
  const footerEnd = footerStart >= 0 ? lower.indexOf('>', footerStart) : -1
  const footerTag = footerStart >= 0 && footerEnd >= 0 ? lower.slice(footerStart, footerEnd + 1) : ''
  const isPageFooter = footerStart >= 0 && (
    mainClose < 0
    || footerStart > mainClose
    || /(?:site-footer|rmp-global-footer|rmp-shared-home-footer)/.test(footerTag)
  )
  if (isPageFooter) return `${html.slice(0, footerStart)}${content}\n${html.slice(footerStart)}`
  if (mainClose >= 0) return `${html.slice(0, mainClose)}${content}\n${html.slice(mainClose)}`
  const bodyClose = lower.lastIndexOf('</body>')
  if (bodyClose >= 0) return `${html.slice(0, bodyClose)}${content}\n${html.slice(bodyClose)}`
  return `${html}${content}`
}

function reviewSchemas(firmName, canonical, reviews = []) {
  return reviews.slice(0, 4).map((review) => ({
    '@type': 'Review',
    '@id': `${canonical}#review-${review.id}`,
    itemReviewed: { '@type': 'Organization', name: firmName },
    author: { '@type': 'Person', name: review.reviewer },
    reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 },
    reviewBody: review.body || review.title,
    datePublished: review.datePublished || undefined,
  }))
}

function reviewFirstPaintCards(firmName, reviews = []) {
  if (!reviews.length) return '<div class="empty-state rmp-server-review-empty">No approved reviews yet. Be the first trader to share an experience.</div>'
  return reviews.slice(0, 12).map((review) => {
    const initials = String(review.reviewer || 'Anonymous Trader').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0))
    const stars = `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}`
    return `<article class="review-card rmp-server-review-card"><div class="review-card-head"><span class="review-avatar">${htmlEscape(initials || 'AT')}</span><div class="review-author"><strong>${htmlEscape(review.reviewer || 'Anonymous Trader')}</strong><span>${htmlEscape(review.datePublished ? review.datePublished.slice(0, 10) : 'Approved review')}</span></div><div class="review-rating-badge"><strong>${rating.toFixed(1)}</strong><span class="review-rating" aria-label="${rating} out of 5">${stars}</span></div></div><h3>${htmlEscape(review.title || `${firmName} trader review`)}</h3><p class="review-body">${htmlEscape(review.body || 'Approved rating submitted without a written review.')}</p><div class="review-meta">${review.program ? `<span>${htmlEscape(review.program)}</span>` : ''}${review.accountSize ? `<span>${htmlEscape(review.accountSize)}</span>` : ''}${review.payoutCount > 0 ? `<span class="verified">${htmlEscape(review.payoutCount)} reported payout${review.payoutCount === 1 ? '' : 's'}</span>` : ''}</div></article>`
  }).join('')
}

function publicAssetUrl(value = '') {
  const source = String(value || '').trim()
  if (!source) return ''
  if (/^(?:https?:\/\/|data:|\/)/i.test(source)) return source
  return `/${source.replace(/^\.?\//, '')}`
}

function replaceOrInsert(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html.replace('</head>', `  ${replacement}\n</head>`)
}

function applySeo(html, seo) {
  let output = html
  output = replaceOrInsert(output, /<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(seo.title)}</title>`)
  output = replaceOrInsert(output, /<meta\s+[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${htmlEscape(seo.description)}">`)
  output = replaceOrInsert(output, /<meta\s+[^>]*name=["']robots["'][^>]*>/i, `<meta name="robots" content="${htmlEscape(seo.robots || 'index, follow, max-image-preview:large, max-snippet:-1')}">`)
  output = replaceOrInsert(output, /<link\s+[^>]*rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${htmlEscape(seo.canonical)}">`)
  output = replaceOrInsert(output, /<meta\s+[^>]*property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${htmlEscape(seo.title)}">`)
  output = replaceOrInsert(output, /<meta\s+[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${htmlEscape(seo.description)}">`)
  output = replaceOrInsert(output, /<meta\s+[^>]*property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${htmlEscape(seo.canonical)}">`)
  output = replaceOrInsert(output, /<meta\s+[^>]*name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${htmlEscape(seo.title)}">`)
  output = replaceOrInsert(output, /<meta\s+[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${htmlEscape(seo.description)}">`)
  if (seo.image) {
    output = replaceOrInsert(output, /<meta\s+[^>]*property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${htmlEscape(seo.image)}">`)
    output = replaceOrInsert(output, /<meta\s+[^>]*name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${htmlEscape(seo.image)}">`)
  }
  output = output.replace(/\s*<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, (block) => {
    if (/id=["']serverSeoSchema["']/i.test(block)) return block
    if (seo.isArticle && /["']@type["']\s*:\s*["']Article["']/i.test(block)) return ''
    return /["']@type["']\s*:\s*["'](?:WebPage|BreadcrumbList)["']/i.test(block) ? '' : block
  })
  output = output.replace(/\s*<script\s+type=["']application\/ld\+json["']\s+id=["']serverSeoSchema["']>[\s\S]*?<\/script>/i, '')
  output = output.replace('</head>', `  <script type="application/ld+json" id="serverSeoSchema">${jsonForHtml(seo.schema)}</script>\n</head>`)
  for (const replacement of seo.replacements || []) {
    const escapedId = String(replacement.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(<([a-z0-9:-]+)[^>]*\\bid=["']${escapedId}["'][^>]*>)[\\s\\S]*?(<\\/\\2>)`, 'i')
    output = output.replace(pattern, (match, opening, currentTag) => {
      if (!replacement.tagName) return `${opening}${replacement.html}</${currentTag}>`
      const tagName = String(replacement.tagName).toLowerCase()
      return `${opening.replace(new RegExp(`^<${currentTag}`, 'i'), `<${tagName}`)}${replacement.html}</${tagName}>`
    })
  }
  for (const [from, to] of seo.literalReplacements || []) {
    output = output.split(String(from)).join(String(to))
  }
  if (seo.summary) {
    const facts = (seo.summary.facts || []).map(([label, value]) => `<li><strong>${htmlEscape(label)}:</strong> ${htmlEscape(value)}</li>`).join('')
    const paragraphs = (seo.summary.paragraphs || []).map((text) => `<p>${htmlEscape(text)}</p>`).join('')
    const visible = seo.summaryVisible === true
    const summary = `<section class="rmp-server-summary${visible ? ' rmp-compare-insight' : ''}"${visible ? '' : ' hidden aria-hidden="true"'} aria-labelledby="rmpServerSummaryTitle" style="${visible ? '' : 'display:none!important;'}max-width:1120px;margin:28px auto;padding:24px;border:1px solid rgba(122,116,255,.24);border-radius:16px;background:rgba(11,11,18,.82);color:#f4f2ff"><span class="rmp-summary-kicker" style="font-size:.75rem;letter-spacing:.12em;color:#a7a0ff">${htmlEscape(seo.summary.eyebrow || 'RANK MY PROP RESEARCH')}</span><h2 id="rmpServerSummaryTitle" style="margin:.5rem 0 1rem;font-size:clamp(1.45rem,3vw,2rem)">${htmlEscape(seo.summary.heading)}</h2><div class="rmp-summary-copy">${paragraphs}</div>${facts ? `<ul class="rmp-summary-facts" style="display:grid;gap:.5rem;margin:1rem 0 0;padding-left:1.25rem">${facts}</ul>` : ''}</section>`
    if (visible && output.includes('<div id="comparisonResearchSlot"></div>')) output = output.replace('<div id="comparisonResearchSlot"></div>', summary)
    else output = /<main\b[^>]*>/i.test(output) ? output.replace(/(<main\b[^>]*>)/i, `$1\n${summary}`) : output.replace(/(<body\b[^>]*>)/i, `$1\n${summary}`)
  }
  if (seo.evidenceHtml) {
    output = insertBeforePageFooter(output, seo.evidenceHtml)
  }
  if (Array.isArray(seo.links) && seo.links.length) {
    const links = seo.links.map(([label, href]) => `<a href="${htmlEscape(href)}">${htmlEscape(label)}</a>`).join(' · ')
    const nav = `<nav class="rmp-seo-context-links" aria-label="Related prop firm research" style="max-width:1120px;margin:32px auto;padding:20px;border:1px solid rgba(122,116,255,.22);border-radius:14px;background:rgba(122,116,255,.06)"><strong>Continue your research:</strong> ${links}</nav>`
    output = insertBeforePageFooter(output, nav)
  }
  return output
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item,
    })),
  }
}

function graph(page, crumbs, extras = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'Rank My Prop',
        url: `${origin}/`,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'Rank My Prop',
        url: `${origin}/`,
        publisher: { '@id': `${origin}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${page.url}#webpage`,
        name: page.name,
        url: page.url,
        description: page.description,
        isPartOf: { '@id': `${origin}/#website` },
        about: page.about,
      },
      crumbs,
      ...extras,
    ],
  }
}

function writePage(relativeUrl, templateName, seo) {
  const templatePath = path.join(distRoot, templateName)
  if (!fs.existsSync(templatePath)) throw new Error(`Missing built template: ${templateName}`)
  const targetPath = path.join(distRoot, `${relativeUrl.replace(/^\/+|\/+$/g, '')}.html`)
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, applySeo(fs.readFileSync(templatePath, 'utf8'), seo))
}

function addComparisonDirectory(comparisons) {
  const file = path.join(distRoot, 'compare.html')
  if (!fs.existsSync(file)) throw new Error('Missing built comparison hub')
  let html = fs.readFileSync(file, 'utf8')
  const links = comparisons.map(({ left, right, route }) => `<li><a href="${route}">${htmlEscape(left.name)} vs ${htmlEscape(right.name)}</a></li>`).join('')
  const directory = `<section class="rmp-comparison-directory" aria-labelledby="comparisonDirectoryTitle" style="max-width:1120px;margin:32px auto;padding:24px"><h2 id="comparisonDirectoryTitle">Browse every prop firm comparison</h2><p>Open an indexable, firm-specific comparison covering rules, offers, profiles and trader research.</p><ul style="columns:3 260px;gap:28px;padding-left:1.25rem">${links}</ul></section>`
  html = html.includes('</main>') ? html.replace('</main>', `${directory}\n</main>`) : html.replace('</body>', `${directory}\n</body>`)
  fs.writeFileSync(file, html)
}

function addContentDirectories(posts) {
  const grouped = new Map()
  posts.forEach((post) => {
    if (!grouped.has(post.type)) grouped.set(post.type, [])
    grouped.get(post.type).push(post)
  })
  grouped.forEach((rows, type) => {
    const hub = rows[0]?.routeBase === 'news' ? 'prop-news' : rows[0]?.routeBase
    const file = path.join(distRoot, `${hub}.html`)
    if (!hub || !fs.existsSync(file)) return
    const links = rows.map((post) => `<li><a href="/${post.routeBase}/${post.slug}">${htmlEscape(post.title)}</a></li>`).join('')
    const directory = `<section class="rmp-article-directory" aria-labelledby="articleDirectory-${htmlEscape(type)}" style="max-width:1120px;margin:32px auto;padding:24px"><h2 id="articleDirectory-${htmlEscape(type)}">All published ${htmlEscape(rows[0].sectionName)} articles</h2><p>Browse every published Rank My Prop article in this section.</p><ul style="columns:2 300px;gap:28px;padding-left:1.25rem">${links}</ul></section>`
    let html = fs.readFileSync(file, 'utf8')
    html = html.includes('</main>') ? html.replace('</main>', `${directory}\n</main>`) : html.replace('</body>', `${directory}\n</body>`)
    fs.writeFileSync(file, html)
  })
}

function addStaticResourceDirectory() {
  const file = path.join(distRoot, 'index.html')
  if (!fs.existsSync(file)) throw new Error('Missing built homepage')
  const resources = [
    ['/best-prop-firms-2026', 'Best Prop Firms 2026'], ['/highest-rated-firms', 'Highest-Rated Firms'],
    ['/fast-payout-prop-firms', 'Fast-Payout Firms'], ['/best-instant-funding-firms', 'Instant Funding Firms'],
    ['/best-futures-prop-firms', 'Futures Prop Firms'], ['/best-hft-prop-firms', 'HFT Prop Firms'],
    ['/cheapest-prop-firms', 'Cheapest Prop Firms'], ['/most-trusted-prop-firms', 'Most Trusted Firms'],
    ['/beginner-friendly-firms', 'Beginner-Friendly Firms'], ['/reviews', 'Prop Firm Reviews'],
    ['/prop-firm-rules', 'Prop Firm Rules'], ['/trading-guides', 'Trading Guides'],
    ['/funding-strategies', 'Funding Strategies'], ['/trading-psychology', 'Trading Psychology'],
    ['/beginner-tutorials', 'Beginner Tutorials'], ['/calculators', 'Trading Calculators'],
    ['/blog/blog-post-30', '2026 Prop Firm Market Outlook'], ['/prop-firm-market-report', 'Prop Firm Market Report'],
    ['/risk-to-reward-calculator', 'Risk-to-Reward Calculator'], ['/profit-split-calculator', 'Profit Split Calculator'],
    ['/consistency-rule-calculator', 'Consistency Rule Calculator'],
  ]
  const links = resources.map(([href, label]) => `<li><a href="${href}">${htmlEscape(label)}</a></li>`).join('')
  const section = `<section class="rmp-research-directory" aria-labelledby="rmpResearchDirectoryTitle" style="max-width:1120px;margin:32px auto;padding:24px"><h2 id="rmpResearchDirectoryTitle">Prop firm research and trader tools</h2><p>Explore ranking categories, rule research, approved trader reviews, funding education and risk calculators.</p><ul style="columns:3 240px;gap:28px;padding-left:1.25rem">${links}</ul></section>`
  let html = fs.readFileSync(file, 'utf8')
  // This directory is a useful fallback when the React homepage cannot run.
  // Keep it out of the initial JS-enabled paint so it cannot flash before hydration.
  html = html.replace('<div id="root"></div>', `<div id="root"></div><noscript>${section}</noscript>`)
  fs.writeFileSync(file, html)
}

function ensureStaticSitemapSchemas() {
  const sitemapNames = [
    'sitemap-pages.xml', 'sitemap-articles.xml', 'sitemap-firms.xml', 'sitemap-reviews.xml',
    'sitemap-rules.xml', 'sitemaps/challenge-rules.xml', 'sitemap-offers.xml', 'sitemap-compare.xml',
  ]
  const urls = sitemapNames.flatMap((name) => {
    const xml = fs.readFileSync(path.join(root, 'public', name), 'utf8')
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  })
  let injected = 0
  let normalizedMetadata = 0

  for (const url of urls) {
    const pathname = new URL(url).pathname
    const candidates = pathname === '/'
      ? [path.join(distRoot, 'index.html')]
      : [path.join(distRoot, `${pathname.slice(1)}.html`), path.join(distRoot, pathname.slice(1), 'index.html')]
    const file = candidates.find((candidate) => fs.existsSync(candidate))
    if (!file) throw new Error(`Missing built sitemap page while adding schema: ${url}`)

    let html = fs.readFileSync(file, 'utf8')
    const originalTitle = htmlUnescape(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || 'Rank My Prop')
    const originalDescription = htmlUnescape(metaContent(html, 'name', 'description'))
    // Metadata authored in source HTML is intentionally preserved byte-for-byte.
    // Generated CMS pages can still be normalized to the search snippet limits.
    const sourceCandidates = pathname === '/'
      ? [path.join(root, 'index.html')]
      : [path.join(root, 'public', `${pathname.slice(1)}.html`), path.join(root, 'public', pathname.slice(1), 'index.html')]
    const hasAuthoredSource = sourceCandidates.some((candidate) => fs.existsSync(candidate))
      || /^\/prop-firms\/(?:finotive-funding|fxify|goat-funded-trader|aqua-funded|blueberry-funded|fundednext)$/.test(pathname)
      || /^\/prop-firm-rules\/[^/]+\/[^/]+$/.test(pathname)
    const titleCore = originalTitle.replace(/\s*\|\s*Rank My Prop\s*$/i, '')
    const title = hasAuthoredSource ? originalTitle : (originalTitle.length > 65 ? titleWithBrand(titleCore) : originalTitle)
    const description = hasAuthoredSource ? originalDescription : descriptionWithinLimit(originalDescription)
    if (title !== originalTitle || description !== originalDescription) {
      html = replaceOrInsert(html, /<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(title)}</title>`)
      html = replaceOrInsert(html, /<meta\s+[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${htmlEscape(description)}">`)
      html = replaceOrInsert(html, /<meta\s+[^>]*property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${htmlEscape(title)}">`)
      html = replaceOrInsert(html, /<meta\s+[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${htmlEscape(description)}">`)
      html = replaceOrInsert(html, /<meta\s+[^>]*name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${htmlEscape(title)}">`)
      html = replaceOrInsert(html, /<meta\s+[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${htmlEscape(description)}">`)
      normalizedMetadata += 1
    }
    if (/type=["']application\/ld\+json["']/i.test(html)) {
      fs.writeFileSync(file, html)
      continue
    }

    const pageName = title.replace(/\s*\|\s*Rank My Prop\s*$/i, '')
    const schema = graph({ name: pageName, url, description }, breadcrumb([
      ['Home', `${origin}/`],
      ...(pathname === '/' ? [] : [[pageName, url]]),
    ]))
    html = html.replace('</head>', `  <script type="application/ld+json" id="serverSeoSchema">${jsonForHtml(schema)}</script>\n</head>`)
    fs.writeFileSync(file, html)
    injected += 1
  }

  return { injected, normalizedMetadata }
}

async function main() {
  if (!fs.existsSync(distRoot)) throw new Error('Run Vite build before generating SEO pages')

  const firmsModule = await import(path.join(root, 'public', 'firms-data.js'))
  const offersModule = await import(path.join(root, 'public', 'offers-data.js'))
  const editorialModule = await import(path.join(root, 'public', 'editorial-contributors.js'))
  const evidence = JSON.parse(fs.readFileSync(path.join(root, 'public', 'seo-evidence.json'), 'utf8'))
  const contentPosts = Object.values(evidence.content || {}).flat().filter((post) => {
    if (!post.slug || !post.title || !post.routeBase) return false
    return !contentConsolidationRedirects[`/${post.routeBase}/${post.slug}`]
  })
  const retainedContentDestinations = new Set(Object.values(contentConsolidationRedirects))
  const indexableContentPosts = contentPosts.filter((post) => isIndexableContentPost(post) || retainedContentDestinations.has(`/${post.routeBase}/${post.slug}`))
  const legacyBodies = legacyLongFormBodies()
  const firmRows = [...firmsModule.DEFAULT_LISTED_FIRMS, ...firmsModule.DEFAULT_BEST_FIRMS]
  const firmMap = new Map(Object.entries(evidence.firms || {}).map(([key, firm]) => {
    const slug = canonicalSlug(firm.slug || key || firm.name || firm.id)
    return [slug, { ...firm, slug }]
  }))
  for (const firm of firmRows) {
    const slug = canonicalSlug(firm.slug || firm.name || firm.id)
    if (!slug) continue
    firmMap.set(slug, { ...firm, ...(firmMap.get(slug) || {}), slug })
  }
  const firms = [...firmMap.values()].filter((firm) => firm.slug).sort((a, b) => a.slug.localeCompare(b.slug))

  const offerMap = new Map(offersModule.DEFAULT_OFFERS.map((offer) => {
    const slug = canonicalSlug(offer.slug || offer.name || offer.id)
    return [slug, { ...offer, slug }]
  }))
  for (const [key, offer] of Object.entries(evidence.offers || {})) {
    const slug = canonicalSlug(offer.slug || key || offer.name || offer.id)
    if (!slug) continue
    const local = offerMap.get(slug) || {}
    const matchingFirm = firmMap.get(slug) || {}
    offerMap.set(slug, { ...local, ...offer, slug, name: offer.name || local.name || matchingFirm.name })
  }
  const offers = [...offerMap.values()].filter((offer) => offer.slug && firmMap.get(offer.slug)?.showOffers !== false).sort((a, b) => a.slug.localeCompare(b.slug))
  const firmBySlug = new Map(firms.map((firm) => [firm.slug, firm]))
  const offerBySlug = new Map(offers.map((offer) => [offer.slug, offer]))
  const comparisonFirms = firms.filter((firm) => firm.showFirmProfile !== false && firm.showListed !== false)
  const indexableComparisonSlugs = new Set(comparisonFirms.filter((firm) => isIndexableComparisonFirm(firm, evidence)).map((firm) => firm.slug))
  const comparisons = []
  for (let first = 0; first < comparisonFirms.length; first += 1) {
    for (let second = first + 1; second < comparisonFirms.length; second += 1) {
      comparisons.push({
        left: comparisonFirms[first],
        right: comparisonFirms[second],
        route: `/compare/${comparisonFirms[first].slug}-vs-${comparisonFirms[second].slug}`,
        indexable: indexableComparisonSlugs.has(comparisonFirms[first].slug) && indexableComparisonSlugs.has(comparisonFirms[second].slug),
      })
    }
  }

  let generated = 0
  for (const firm of firms) {
    const approvedReviews = evidence.reviews?.[firm.slug] || []
    const cmsFirm = evidence.firms?.[firm.slug] || {}
    const about = { '@type': 'Organization', name: firm.name, url: firm.website ? `https://${String(firm.website).replace(/^https?:\/\//, '')}` : undefined }
    const comparisonPartner = comparisonFirms.find((candidate) => indexableComparisonSlugs.has(candidate.slug) && candidate.slug === (firm.slug === 'trader-scale' ? 'fundednext' : 'trader-scale')) || comparisonFirms.find((candidate) => indexableComparisonSlugs.has(candidate.slug) && candidate.slug !== firm.slug)
    const comparisonSlugs = comparisonPartner ? [firm.slug, comparisonPartner.slug].sort() : []
    const comparisonRoute = comparisonSlugs.length === 2 ? `/compare/${comparisonSlugs[0]}-vs-${comparisonSlugs[1]}` : '/compare'
    const programs = (Array.isArray(cmsFirm.programs) ? cmsFirm.programs : [])
      .map((program) => ({ program, model: compact(program.program || program.name || program.title || program.model), slug: slugify(program.program || program.name || program.title || program.model) }))
      .filter((program, index, rows) => program.slug && rows.findIndex((candidate) => candidate.slug === program.slug) === index)
    const offer = offerBySlug.get(firm.slug)
    const offerSlug = offer?.slug || firm.slug
    const programLinks = firm.showRules !== false
      ? programs.map((program) => [`${firm.name} ${program.model} rules`, `/prop-firm-rules/${firm.slug}/${program.slug}`])
      : []
    const firmLinks = [
      ...(firm.showFirmProfile !== false ? [[`${firm.name} profile`, `/prop-firms/${firm.slug}`]] : []),
      ...(firm.showRules !== false ? [[`${firm.name} rules`, `/prop-firm-rules/${firm.slug}`]] : []),
      ...(firm.showReviews !== false ? [[`${firm.name} reviews`, `/prop-firms/${firm.slug}/reviews`]] : []),
      ...(offer && firm.showOffers !== false ? [[`${firm.name} discount`, `/offers/${offerSlug}`]] : []),
      ...(firm.showFirmProfile !== false && firm.showListed !== false ? [[`Compare ${firm.name}`, comparisonRoute]] : []),
    ]

    if (firm.showFirmProfile !== false) {
      const route = `/prop-firms/${firm.slug}`
      const canonical = `${origin}${route}`
      const authoredProfile = {
        'finotive-funding': {
          title: 'Finotive Funding Review 2026 | Rules, Payouts & Challenges',
          description: 'Read our Finotive Funding review for 2026. Explore account sizes, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.',
          heading: 'Finotive Funding Review 2026: Rules, Challenges, Payouts & Funding',
          paragraph: 'Explore Finotive Funding in 2026, including its funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key information you need before choosing a Finotive Funding account.',
        },
        fxify: {
          title: 'FXIFY Review 2026 | Rules, Payouts & Challenges',
          description: 'Read the FXIFY review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.',
          heading: 'FXIFY Review 2026: Prop Firm Rules, Payouts & Challenges',
          paragraph: 'Explore FXIFY in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key details about FXIFY before choosing a funded trading account.',
        },
        'goat-funded-trader': {
          title: 'Goat Funded Trader Review 2026 | Rules, Payouts & Challenges',
          description: 'Read the Goat Funded Trader review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.',
          heading: 'Goat Funded Trader Review 2026: Rules, Payouts & Challenges',
          paragraph: 'Explore Goat Funded Trader in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key information you need before choosing a Goat Funded Trader account.',
          h2: 'Goat Funded Trader Review & Funded Trading Details',
          h2Description: "Explore Goat Funded Trader's funding programs, account options, trading rules, payout conditions, platforms, and trader feedback. Review important requirements and key features before choosing a funded trading account.",
        },
        'aqua-funded': {
          title: 'Aqua Funded Review 2026 | Rules, Payouts & Challenges',
          description: 'Read the Aqua Funded review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, news trading and trader reviews.',
          heading: 'Aqua Funded Review 2026: Rules, Payouts & Challenges',
          paragraph: 'Explore Aqua Funded in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, news trading policies, and trader reviews. Get the key information you need before choosing an Aqua Funded account.',
          h2: 'Aqua Funded Review & Funded Trading Details',
          h2Description: "Explore Aqua Funded's funding programs, account options, trading rules, payout conditions, platforms, and trader feedback. Review account sizes, profit splits, drawdown limits, payout cycles, news trading rules, and other key requirements.",
        },
        'blueberry-funded': {
          title: 'Blueberry Funded Review 2026 | Rules, Payouts & Challenges',
          description: 'Read the Blueberry Funded review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, restrictions, and trader reviews.',
          heading: 'Blueberry Funded Review 2026: Rules, Payouts & Challenges',
          paragraph: 'Explore Blueberry Funded in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, trading restrictions, and trader reviews. Get the key information you need before choosing a Blueberry Funded account.',
        },
        'alpha-trader-firm': {
          title: 'Alpha Trader Firm Review 2026 | Rules, Payouts & Challenges',
          description: 'Read the Alpha Trader Firm review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.',
          heading: 'Alpha Trader Firm Review 2026: Rules, Payouts & Challenges',
          paragraph: 'Explore Alpha Trader Firm in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key information you need before choosing an Alpha Trader Firm account.',
        },
      }[firm.slug]
      const title = authoredProfile
        ? authoredProfile.title
        : titleWithBrand(`${firm.name} Review 2026: Rules & Payouts`)
      const description = authoredProfile
        ? authoredProfile.description
        : descriptionWithinLimit(firm.slug === 'trader-scale'
        ? 'Read our 2026 Trader Scale review covering challenge fees, drawdown rules, payout terms, trader ratings and the latest verified discount.'
        : `Review ${firm.name} challenge fees, drawdown rules, payout terms, trading conditions and trader feedback before choosing a funded account.`)
      const profileHeading = authoredProfile
        ? authoredProfile.heading
        : `${firm.name} Review 2026: Fees, Rules, Payouts & Offers`
      const profileParagraph = authoredProfile
        ? authoredProfile.paragraph
        : description
      writePage(route, 'firm-detail.html', {
        title, description, canonical, links: firmLinks.slice(1),
        literalReplacements: [
          ['/prop-firms/aqua-funded', `/prop-firms/${firm.slug}`],
          ['Aqua Funded', firm.name],
          ['AquaFunded', firm.name],
        ],
        replacements: [
          { id: 'detailSeoHeading', html: htmlEscape(profileHeading) },
          { id: 'detailSeoParagraph', html: htmlEscape(profileParagraph) },
          { id: 'firmNameHeading', html: htmlEscape(firm.name) },
          { id: 'firmLogoInitials', html: htmlEscape(firm.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase()) },
          { id: 'firmScoreValue', html: approvedReviews.length >= 5 ? (approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / approvedReviews.length).toFixed(1) : '—' },
          { id: 'firmTrustedText', html: approvedReviews.length >= 5 ? `${approvedReviews.length} verified trader reviews` : 'Not enough verified reviews yet' },
          { id: 'firmReviewSnippet', html: approvedReviews.length ? htmlEscape(approvedReviews[0].body || approvedReviews[0].title || 'Read the latest approved trader review.') : 'No approved trader reviews yet.' },
          { id: 'firmOverviewTitle', html: htmlEscape(authoredProfile?.h2 || `${firm.name} Overview`), tagName: authoredProfile?.h2 ? 'h2' : undefined },
          { id: 'firmOverviewShort', html: htmlEscape(authoredProfile?.h2Description || firm.overviewShort || firm.bio || `Review the published ${firm.name} account conditions and firm details.`) },
          { id: 'firmOverviewLongContent', html: `<p style="margin:0 0 14px 0;">${htmlEscape(firm.overviewLong || firm.overview || firm.overviewShort || firm.bio || `Confirm current ${firm.name} terms on the official firm website before purchasing an account.`)}</p>` },
          { id: 'firmWhyChooseTitle', html: `Why Choose ${htmlEscape(firm.name)}?` },
        ],
        summary: {
          heading: `${firm.name} prop firm overview`,
          paragraphs: [
            `${firm.name} is listed for ${firm.country || 'global'} traders. ${firm.bio || `Use this profile to review ${firm.name} before selecting a funded account.`}`,
            `This research page connects the ${firm.name} profile with its trading rules, approved trader reviews, current offer and direct comparison pages. Confirm final program terms on the official firm website before checkout.`,
          ],
          facts: [
            ['Market', (firm.tags || ['Prop trading']).join(', ')],
            ['Website', firm.website || 'See official firm link'],
            ['Current offer', offer ? `${offer.discount || 'Active'} with code ${offer.code || 'shown on offer page'}` : 'Check the linked offer page'],
          ],
        },
        evidenceHtml: `${reviewEvidenceSection(firm.name, approvedReviews, cmsFirm)}${publishedRulesSection(firm.name, cmsFirm)}`,
        schema: graph({ name: title.replace(' | Rank My Prop', ''), url: canonical, description, about }, breadcrumb([
          ['Home', `${origin}/`], ['Prop Firms', `${origin}/listedprop`], [firm.name, canonical],
        ]), reviewSchemas(firm.name, canonical, approvedReviews)),
      })
      generated += 1

      const authoredChallenges = {
        'finotive-funding': {
          title: 'Finotive Funding Challenges 2026 | Fees, Account Sizes & Programs',
          description: 'Explore Finotive Funding challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, and available funded trading programs.',
          heading: 'Finotive Funding Challenges 2026: Fees, Account Sizes & Funding Programs',
          paragraph: 'Explore Finotive Funding challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, trading rules, and available funding programs. Find the right Finotive Funding challenge for your trading strategy.',
        },
        fxify: {
          title: 'FXIFY Challenges 2026 | Fees, Account Sizes & Programs',
          description: 'Explore FXIFY challenges in 2026, including challenge fees, account sizes, profit targets, profit splits, drawdown rules, trading conditions, and funded account programs.',
          heading: 'FXIFY Challenges 2026: Fees, Account Sizes & Funding Programs',
          paragraph: 'Explore FXIFY challenges in 2026, including available account sizes, challenge fees, profit targets, profit splits, drawdown requirements, trading rules, and funded account options. Find detailed information on each FXIFY funding program.',
        },
        'goat-funded-trader': {
          title: 'Goat Funded Trader Challenges 2026 | Fees, Accounts & Programs',
          description: 'Explore Goat Funded Trader challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.',
          heading: 'Goat Funded Trader Challenges 2026: Fees, Account Sizes & Funding Programs',
          paragraph: 'Explore Goat Funded Trader challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
        },
        'aqua-funded': {
          title: 'Aqua Funded Challenges 2026 | Fees, Account Sizes & Programs',
          description: 'Explore Aqua Funded challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.',
          heading: 'Aqua Funded Challenges 2026: Fees, Account Sizes & Funding Programs',
          paragraph: 'Explore Aqua Funded challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
        },
        'blueberry-funded': {
          title: 'Blueberry Funded Challenges 2026 | Fees, Account Sizes & Programs',
          description: 'Explore Blueberry Funded challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.',
          heading: 'Blueberry Funded Challenges 2026: Fees, Account Sizes & Funding Programs',
          paragraph: 'Explore Blueberry Funded challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
        },
        'alpha-trader-firm': {
          title: 'Alpha Trader Firm Challenges 2026 | Fees, Account Sizes & Programs',
          description: 'Explore Alpha Trader Firm challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.',
          heading: 'Alpha Trader Firm Challenges 2026: Fees, Account Sizes & Funding Programs',
          paragraph: 'Explore Alpha Trader Firm challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
        },
      }[firm.slug]
      if (authoredChallenges) {
        const challengesRoute = `/prop-firms/${firm.slug}/challenges`
        const challengesCanonical = `${origin}${challengesRoute}`
        writePage(challengesRoute, `prop-firms/${firm.slug}.html`, {
          title: authoredChallenges.title,
          description: authoredChallenges.description,
          canonical: challengesCanonical,
          replacements: [
            { id: 'detailSeoHeading', html: htmlEscape(authoredChallenges.heading) },
            { id: 'detailSeoParagraph', html: htmlEscape(authoredChallenges.paragraph) },
          ],
          schema: graph({ name: authoredChallenges.title, url: challengesCanonical, description: authoredChallenges.description, about }, breadcrumb([
            ['Home', `${origin}/`], ['Prop Firms', `${origin}/listedprop`], [firm.name, `${origin}/prop-firms/${firm.slug}`], ['Challenges', challengesCanonical],
          ])),
        })
        generated += 1
      }
    }

    if (firm.showReviews !== false) {
      const route = `/prop-firms/${firm.slug}/reviews`
      const canonical = `${origin}${route}`
      const title = titleWithBrand(`${firm.name} Reviews & Ratings 2026`)
      const description = descriptionWithinLimit(`Read verified ${firm.name} trader reviews, ratings and payout feedback before choosing a challenge or funded account.`)
      const approvedAverage = approvedReviews.length ? approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / approvedReviews.length : 0
      const firmLogo = publicAssetUrl(firm.logo || cmsFirm.logo)
      const proofBackedReviews = approvedReviews.filter((review) => review.proofUrl)
      const reportedPositive = approvedReviews.map((review) => compact(review.pros)).find(Boolean) || 'No approved positive detail yet.'
      const reportedConcern = approvedReviews.map((review) => compact(review.cons)).find(Boolean) || 'No approved concern detail yet.'
      const materialDate = approvedReviews.map((review) => review.datePublished).filter(Boolean).sort().at(-1) || cmsFirm.updatedAt || ''
      writePage(route, 'firm-reviews.html', {
        title, description, canonical,
        robots: isIndexableReviewFirm(firm.slug, evidence) ? undefined : 'noindex, follow',
        links: [...firmLinks.filter(([, href]) => href !== route), ...programLinks],
        replacements: [
          { id: 'dedicatedReviewTitle', html: `${htmlEscape(firm.name)} Reviews &amp; Trader Experiences` },
          { id: 'dedicatedReviewDescription', html: htmlEscape(description) },
          { id: 'firmName', html: htmlEscape(firm.name) },
          { id: 'firmLogo', html: firmLogo ? `<img src="${htmlEscape(firmLogo)}" alt="${htmlEscape(firm.name)} logo" width="58" height="58" fetchpriority="high">` : htmlEscape(firm.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase()) },
          { id: 'averageRating', html: approvedReviews.length >= 5 ? approvedAverage.toFixed(1) : '—' },
          { id: 'averageStars', html: approvedReviews.length >= 5 ? `${'★'.repeat(Math.round(approvedAverage))}${'☆'.repeat(5 - Math.round(approvedAverage))}` : 'Not enough verified reviews yet' },
          { id: 'reviewCount', html: `${approvedReviews.length} approved review${approvedReviews.length === 1 ? '' : 's'}` },
          { id: 'reviewsList', html: reviewFirstPaintCards(firm.name, approvedReviews) },
          { id: 'communityHeading', html: `What traders say about ${htmlEscape(firm.name)}` },
          { id: 'firmReviewFaqName', html: htmlEscape(firm.name) },
          { id: 'reviewResearchTitle', html: `How Rank My Prop evaluates ${htmlEscape(firm.name)}` },
          { id: 'reviewResearchCount', html: String(approvedReviews.length) },
          { id: 'reviewResearchProofCount', html: String(proofBackedReviews.length) },
          { id: 'reviewResearchUpdated', html: htmlEscape(materialDate ? materialDate.slice(0, 10) : 'Not yet recorded') },
          { id: 'reviewResearchPositive', html: htmlEscape(reportedPositive) },
          { id: 'reviewResearchConcern', html: htmlEscape(reportedConcern) },
        ],
        summary: {
          heading: `How to assess ${firm.name} reviews`,
          paragraphs: [
            `Use this page to evaluate ${firm.name} feedback about challenge conditions, customer support, platform stability and payout experience. Approved community reviews appear in the interactive feed when available.`,
            `Cross-check review claims against the linked ${firm.name} rules and profile. Recent, program-specific feedback is generally more useful than a rating without account details or payout context.`,
          ],
          facts: [['Firm', firm.name], ['Trader region', firm.country || 'Global'], ['Research status', 'Profile, rules and offer linked']],
        },
        evidenceHtml: reviewEvidenceSection(firm.name, approvedReviews, cmsFirm),
        schema: graph({ name: title.replace(' | Rank My Prop', ''), url: canonical, description, about }, breadcrumb([
          ['Home', `${origin}/`], ['Reviews', `${origin}/reviews`], [`${firm.name} Reviews`, canonical],
        ]), reviewSchemas(firm.name, canonical, approvedReviews)),
      })
      generated += 1
    }

    if (firm.showRules !== false) {
      const route = `/prop-firm-rules/${firm.slug}`
      const canonical = `${origin}${route}`
      const title = titleWithBrand(`${firm.name} Rules 2026: Drawdown & Payouts`)
      const description = descriptionWithinLimit(firm.slug === 'aqua-funded'
        ? 'Check Aqua Funded rules for 2026, including daily drawdown, maximum loss, payout conditions, restricted countries and allowed trading strategies.'
        : `Check ${firm.name} rules for 2026, including daily loss, maximum drawdown, profit targets, payout terms and trading restrictions.`)
      writePage(route, 'firm-rules.html', {
        title, description, canonical, links: [...firmLinks.filter(([, href]) => href !== route), ...programLinks],
        replacements: [
          { id: 'firmRulesHeading', html: `${htmlEscape(firm.name)} <span>Trading Rules</span>` },
          { id: 'firmRulesIntro', html: htmlEscape(description) },
          { id: 'programTitle', html: `Compare ${htmlEscape(firm.name)} rules by program` },
          { id: 'publishedRulesTitle', html: `${htmlEscape(firm.name)} conditions to verify before trading` },
          { id: 'publishedRulesDescription', html: `Review loss limits, targets, permissions and payout conditions for the selected ${htmlEscape(firm.name)} program.` },
          { id: 'firmFaqIntro', html: `Answers based on the selected ${htmlEscape(firm.name)} rule record.` },
        ],
        summary: {
          heading: `${firm.name} rulebook overview`,
          paragraphs: [
            `Review ${firm.name} evaluation and funded-account conditions before purchasing a challenge. Pay particular attention to how daily loss and maximum drawdown are calculated, because reset time and equity-versus-balance definitions can change the effective limit.`,
            `Also verify profit targets, minimum trading days, news and weekend permissions, consistency requirements and payout eligibility for the exact program selected at checkout. Official terms take priority if a rule changes.`,
          ],
          facts: [['Firm', firm.name], ['Market focus', (firm.tags || ['Prop trading']).join(', ')], ['Rule verification', firm.website || 'Official firm website']],
        },
        evidenceHtml: `${publishedRulesSection(firm.name, cmsFirm)}${reviewEvidenceSection(firm.name, approvedReviews, cmsFirm)}`,
        schema: graph({ name: title.replace(' | Rank My Prop', ''), url: canonical, description, about }, breadcrumb([
          ['Home', `${origin}/`], ['Prop Firm Rules', `${origin}/prop-firm-rules`], [`${firm.name} Rules`, canonical],
        ])),
      })
      generated += 1
    }

    if (firm.showRules !== false) for (const { slug: programSlug, model } of programs) {
      const route = `/prop-firm-rules/${firm.slug}/${programSlug}`
      const canonical = `${origin}${route}`
      const title = `${firm.name} ${model} Rules 2026 | Trading Rules & Requirements`
      const description = `Check ${firm.name} ${model} rules for 2026, including profit targets, daily loss, maximum drawdown, minimum trading days, profit split, payouts, news trading and other requirements.`
      const heroDescription = `Review the ${model} rules for ${firm.name}, including profit targets, daily loss limits, maximum drawdown, minimum trading days, profit split, trading restrictions, and payout conditions.`
      writePage(route, 'firm-rules.html', {
        title, description, canonical, links: [...firmLinks, ...programLinks.filter(([, href]) => href !== route)],
        replacements: [
          { id: 'firmRulesHeading', html: `${htmlEscape(firm.name)} ${htmlEscape(model)} Rules 2026: <span>Complete Trading Rules</span>` },
          { id: 'firmRulesIntro', html: htmlEscape(heroDescription) },
          { id: 'programTitle', html: `${htmlEscape(firm.name)} ${htmlEscape(model)} conditions` },
          { id: 'selectedProgramLabel', html: `${htmlEscape(model)} rulebook` },
          { id: 'publishedRulesTitle', html: `Verify ${htmlEscape(model)} limits before the first trade` },
        ],
        summary: {
          heading: `${firm.name} ${model} rules at a glance`,
          paragraphs: [
            `This page focuses on the ${firm.name} ${model} account model. Check its profit objective, daily loss calculation, overall drawdown method and any minimum-day requirement before starting the evaluation.`,
            `Confirm trading permissions, prohibited strategies, news and weekend rules, consistency conditions and payout eligibility against the current official terms for this exact program.`,
          ],
          facts: [['Firm', firm.name], ['Account model', model], ['Market focus', (firm.tags || ['Prop trading']).join(', ')]],
        },
        evidenceHtml: `${publishedRulesSection(firm.name, cmsFirm, programSlug)}${reviewEvidenceSection(firm.name, approvedReviews, cmsFirm)}`,
        schema: graph({ name: title.replace(' | Rank My Prop', ''), url: canonical, description, about }, breadcrumb([
          ['Home', `${origin}/`], ['Prop Firm Rules', `${origin}/prop-firm-rules`], [`${firm.name} Rules`, `${origin}/prop-firm-rules/${firm.slug}`], [`${model} Rules`, canonical],
        ]), [{
          '@type': 'Service',
          '@id': `${canonical}#challenge-model`,
          name: `${firm.name} ${model}`,
          serviceType: 'Prop firm challenge account',
          url: canonical,
          description,
          provider: { '@type': 'Organization', name: firm.name },
        }]),
      })
      generated += 1
    }
  }

  for (const offer of offers) {
    const approvedReviews = evidence.reviews?.[offer.slug] || []
    const cmsFirm = evidence.firms?.[offer.slug] || {}
    const route = `/offers/${offer.slug}`
    const canonical = `${origin}${route}`
    const discountPercent = offerDiscountPercent(offer.discount)
    const heading = `${offer.name} Discount Code 2026: Latest Offer & Save Up to ${discountPercent}%`
    const heroDescription = `Get the latest ${offer.name} discount code for 2026 and save up to ${discountPercent}% on eligible trading accounts. Find the current offer, discount details, and code information before purchasing your ${offer.name} account.`
    const title = `${offer.name} Discount Code 2026 | Latest Offer & ${discountPercent}% Off`
    const description = `Looking for a ${offer.name} discount code? Get the latest 2026 offer and save up to ${discountPercent}% on eligible trading accounts. Check the current discount and code details.`
    const about = { '@type': 'Organization', name: offer.name, url: offer.link || undefined }
    const offerSchema = {
      '@type': 'Offer',
      name: `${offer.name} ${offer.discount || ''} discount`.trim(),
      url: canonical,
      description,
      category: 'Prop firm challenge discount',
      offeredBy: about,
    }
    const comparisonPartner = firms.find((candidate) => indexableComparisonSlugs.has(candidate.slug) && candidate.slug === (offer.slug === 'trader-scale' ? 'fundednext' : 'trader-scale')) || firms.find((candidate) => indexableComparisonSlugs.has(candidate.slug) && candidate.slug !== offer.slug)
    const comparisonSlugs = comparisonPartner ? [offer.slug, comparisonPartner.slug].sort() : []
    writePage(route, 'discount-offer.html', {
      title, description, canonical,
      replacements: [
        { id: 'offersHeading', html: `${htmlEscape(offer.name)} <span>Discount Code 2026: Latest Offer &amp; Save Up to ${htmlEscape(discountPercent)}%</span>` },
        { id: 'offersHeroDescription', html: htmlEscape(heroDescription) },
        { id: 'resultsCount', html: `${htmlEscape(offer.name)} offer: ${htmlEscape(offer.discount || 'active saving')} with code ${htmlEscape(offer.code || 'RMP')}` },
        { id: 'offersGrid', html: `<article><h2>${htmlEscape(offer.name)} ${htmlEscape(offer.discount || '')} discount</h2><p>${htmlEscape(offer.description)}</p><p><strong>Code:</strong> ${htmlEscape(offer.code || 'RMP')} · <strong>Rating:</strong> ${htmlEscape(offer.rating ?? 'Check firm page')}</p><a href="${htmlEscape(offer.link || '#')}" rel="sponsored nofollow">Verify offer at checkout</a></article>` },
      ],
      summary: {
        heading: `${offer.name} offer details`,
        paragraphs: [
          `${offer.description} The current published code is ${offer.code || 'RMP'} and the listed saving is ${offer.discount || 'shown at checkout'}.`,
          `Promotions can expire or exclude particular account sizes. Open the checkout link, confirm that the saving appears before payment, and review the connected ${offer.name} rules and trader feedback.`,
        ],
        facts: [['Discount', offer.discount || 'Verify at checkout'], ['Promo code', offer.code || 'RMP'], ['Listed rating', String(offer.rating ?? 'See profile')]],
      },
      evidenceHtml: reviewEvidenceSection(offer.name, approvedReviews, cmsFirm),
      links: [
        [`${offer.name} profile`, `/prop-firms/${offer.slug}`],
        [`${offer.name} rules`, `/prop-firm-rules/${offer.slug}`],
        [`${offer.name} reviews`, `/prop-firms/${offer.slug}/reviews`],
        ...(comparisonSlugs.length === 2 ? [[`Compare ${offer.name}`, `/compare/${comparisonSlugs[0]}-vs-${comparisonSlugs[1]}`]] : []),
      ],
      schema: graph({ name: title.replace(' | Rank My Prop', ''), url: canonical, description, about }, breadcrumb([
        ['Home', `${origin}/`], ['Offers', `${origin}/offers`], [`${offer.name} Discount`, canonical],
      ]), [offerSchema]),
    })
    generated += 1
  }

  const usedArticleTitles = new Set()
  for (const [postIndex, post] of contentPosts.entries()) {
    const route = `/${post.routeBase}/${post.slug}`
    const canonical = `${origin}${route}`
    const bodyRows = (post.paragraphs?.some(Boolean) ? post.paragraphs : String(post.content || '').split(/\n{2,}/))
      .map((paragraph) => String(paragraph || '').trim())
      .filter((paragraph) => paragraph && !/This post was migrated from the legacy article page|You can fully edit this content from Prop News CMS/i.test(paragraph))
    const generatedArticleBodyHtml = bodyRows.map((paragraph, index) => {
      if (!compact(paragraph)) return ''
      const heading = compact(post.subheadings?.[index] || '')
      return `${heading ? `<h2>${htmlEscape(heading)}</h2>` : ''}<p>${htmlEscape(paragraph)}</p>`
    }).join('')
    const articleBodyHtml = legacyBodies.get(compact(post.title).toLowerCase()) || generatedArticleBodyHtml
    const assignments = editorialModule.resolveEditorialAssignments(post, post.type)
    const editorialEntries = []
    if (assignments.reviewed) editorialEntries.push({ role: 'Reviewed By', contributor: assignments.reviewed })
    if (assignments.verified) editorialEntries.push({ role: 'Verified By', contributor: assignments.verified })
    const editorialPeople = new Map()
    editorialEntries.forEach(({ role, contributor }) => {
      const current = editorialPeople.get(contributor.id)
      if (current) current.roles.push(role)
      else editorialPeople.set(contributor.id, { contributor, roles: [role] })
    })
    const editorialProfileHtml = Array.from(editorialPeople.values()).map(({ contributor, roles }) => `<section class="editorial-profile-card" aria-label="${htmlEscape(contributor.name)} editorial profile"><div class="editorial-profile-image"><img loading="lazy" decoding="async" src="${htmlEscape(contributor.image)}" alt="${htmlEscape(`${contributor.name}, ${contributor.role}`)}" width="600" height="750"></div><div class="editorial-profile-copy"><div class="editorial-profile-kicker">${htmlEscape(roles.join(' · '))}</div><h2 class="editorial-profile-name">${htmlEscape(contributor.name)}</h2><div class="editorial-profile-role">${htmlEscape(contributor.role)}</div><div class="editorial-profile-expertise">${contributor.expertise.map((area) => `<span>${htmlEscape(area)}</span>`).join('')}</div><p class="editorial-profile-bio">${htmlEscape(contributor.bio)}</p></div></section>`).join('')
    const bodyHtml = `${articleBodyHtml}${editorialProfileHtml ? `<div class="editorial-profile-list" aria-label="Editorial contributors">${editorialProfileHtml}</div>` : ''}`
    const editorialTrustHtml = editorialEntries.map(({ role, contributor }) => `<div class="editorial-trust-item"><span>${htmlEscape(role)}</span><strong>${htmlEscape(contributor.name)}</strong></div>`).join('')
    const description = descriptionWithinLimit(post.seoDescription || post.excerpt || bodyRows.find(Boolean) || `Read ${post.title} on Rank My Prop.`)
    let title = titleWithBrand(`${post.title} – ${post.sectionName}`)
    if (usedArticleTitles.has(title)) {
      const qualifier = post.slug.split('-').slice(-5).map((word) => word.replace(/^./, (letter) => letter.toUpperCase())).join(' ')
      const room = Math.max(18, 65 - qualifier.length - 3)
      title = `${compact(post.title).slice(0, room).trim()} – ${qualifier}`.slice(0, 65).trim()
    }
    if (usedArticleTitles.has(title)) {
      const marker = ` ${postIndex + 1}`
      title = `${title.slice(0, 65 - marker.length).trim()}${marker}`
    }
    usedArticleTitles.add(title)
    const relatedPool = indexableContentPosts.filter((candidate) => candidate !== post)
    const related = Array.from({ length: Math.min(4, relatedPool.length) }, (_, offset) => relatedPool[(postIndex + offset) % relatedPool.length]).filter(Boolean)
    const image = /^https:\/\//i.test(post.coverImage || '') ? post.coverImage : `${origin}/assets/og-default-1200x630.webp`
    const articleSchema = {
      '@type': 'Article', '@id': `${canonical}#article`, headline: post.title, description,
      mainEntityOfPage: canonical, image, datePublished: post.publishedAt || undefined,
      dateModified: post.updatedAt || post.publishedAt || undefined,
      author: { '@type': 'Person', name: post.author || 'Rank My Prop Editorial' },
      contributor: editorialEntries.map(({ role, contributor }) => ({ '@type': 'Person', name: contributor.name, jobTitle: contributor.role, description: contributor.bio, image: `${origin}${contributor.image}`, roleName: role })),
      publisher: { '@id': `${origin}/#organization` }, articleSection: post.sectionName,
    }
    writePage(route, 'content-post.html', {
      title, description, canonical, image, isArticle: true,
      robots: isIndexableContentPost(post) || retainedContentDestinations.has(route) ? undefined : 'noindex, follow',
      replacements: [
        { id: 'postTitle', html: htmlEscape(post.title) },
        { id: 'postMin', html: `${htmlEscape(post.readTime)} min read` },
        { id: 'authorMeta', html: `Published by ${htmlEscape(post.author || 'Rank My Prop Editorial')}` },
        { id: 'editorialTrust', html: editorialTrustHtml },
        { id: 'postContent', html: bodyHtml || `<p>${htmlEscape(post.excerpt || description)}</p>` },
        { id: 'postCoverPh', html: `<img src="${htmlEscape(image)}" alt="${htmlEscape(post.title)}" width="1200" height="630" loading="eager">` },
      ],
      links: [
        [post.sectionName, `/${post.routeBase === 'news' ? 'prop-news' : post.routeBase}`],
        ...related.map((candidate) => [candidate.title, `/${candidate.routeBase}/${candidate.slug}`]),
      ],
      schema: graph({ name: post.title, url: canonical, description, about: { '@type': 'Thing', name: post.category || post.sectionName } }, breadcrumb([
        ['Home', `${origin}/`], [post.sectionName, `${origin}/${post.routeBase === 'news' ? 'prop-news' : post.routeBase}`], [post.title, canonical],
      ]), [articleSchema]),
    })
    generated += 1
  }

  for (const [comparisonIndex, comparison] of comparisons.entries()) {
      const { left, right, route } = comparison
      const leftReviews = evidence.reviews?.[left.slug] || []
      const rightReviews = evidence.reviews?.[right.slug] || []
      const leftCms = evidence.firms?.[left.slug] || {}
      const rightCms = evidence.firms?.[right.slug] || {}
      const leftOfferSlug = offerBySlug.get(left.slug)?.slug || left.slug
      const rightOfferSlug = offerBySlug.get(right.slug)?.slug || right.slug
      const canonical = `${origin}${route}`
      const title = titleWithBrand(`${left.name} vs ${right.name} 2026`)
      const description = descriptionWithinLimit(`Compare ${left.name} vs ${right.name}: challenge fees, account sizes, drawdown rules, payouts, platforms and trader reviews.`)
      const about = [left, right].map((firm) => ({ '@type': 'Organization', name: firm.name }))
      const relatedComparisons = comparisons
        .filter((candidate) => candidate.indexable && candidate.route !== route && [candidate.left.slug, candidate.right.slug].some((slug) => slug === left.slug || slug === right.slug))
        .slice(comparisonIndex % 3, (comparisonIndex % 3) + 3)
      writePage(route, 'compare.html', {
        title, description, canonical,
        robots: comparison.indexable ? undefined : 'noindex, follow',
        replacements: [
          { id: 'compareTitle', html: `${htmlEscape(left.name)} vs ${htmlEscape(right.name)} <span>2026 Comparison</span>` },
          { id: 'compareLead', html: htmlEscape(description) },
          { id: 'resultsTitle', html: `${htmlEscape(left.name)} and ${htmlEscape(right.name)} side by side` },
          { id: 'compareTableBody', html: `<tr><th scope="row">Firm</th><td>${htmlEscape(left.name)}</td><td>${htmlEscape(right.name)}</td></tr><tr><th scope="row">Trader region</th><td>${htmlEscape(left.country || 'Global')}</td><td>${htmlEscape(right.country || 'Global')}</td></tr><tr><th scope="row">Market</th><td>${htmlEscape((left.tags || ['Prop trading']).join(', '))}</td><td>${htmlEscape((right.tags || ['Prop trading']).join(', '))}</td></tr>` },
        ],
        summaryVisible: true,
        summary: {
          heading: `${left.name} or ${right.name}?`,
          paragraphs: [
            `${left.name} and ${right.name} are compared here across challenge structure, drawdown rules, account conditions, payout considerations and available trader research. Use the interactive table for the latest published records.`,
            `Before choosing, open both rulebooks and review pages. Compare the exact program and account size you intend to buy rather than relying on a firm-wide headline or promotional discount alone.`,
          ],
          facts: [['First firm', `${left.name} — ${left.bio || left.country || 'profile available'}`], ['Second firm', `${right.name} — ${right.bio || right.country || 'profile available'}`], ['Comparison year', '2026']],
        },
        evidenceHtml: `${reviewEvidenceSection(left.name, leftReviews, leftCms)}${reviewEvidenceSection(right.name, rightReviews, rightCms)}`,
        links: [
          [`${left.name} profile`, `/prop-firms/${left.slug}`],
          [`${left.name} rules`, `/prop-firm-rules/${left.slug}`],
          [`${left.name} offer`, `/offers/${leftOfferSlug}`],
          [`${right.name} profile`, `/prop-firms/${right.slug}`],
          [`${right.name} reviews`, `/prop-firms/${right.slug}/reviews`],
          [`${right.name} offer`, `/offers/${rightOfferSlug}`],
          ...relatedComparisons.map((candidate) => [`${candidate.left.name} vs ${candidate.right.name}`, candidate.route]),
        ],
        schema: graph({ name: title.replace(' | Rank My Prop', ''), url: canonical, description, about }, breadcrumb([
          ['Home', `${origin}/`], ['Compare Prop Firms', `${origin}/compare`], [`${left.name} vs ${right.name}`, canonical],
        ])),
      })
      generated += 1
  }

  addContentDirectories(indexableContentPosts)
  addComparisonDirectory(comparisons.filter((comparison) => comparison.indexable))
  addStaticResourceDirectory()

  for (let index = 1; index <= 30; index += 1) {
    const id = String(index).padStart(2, '0')
    if (legacyBlogRedirects[id]) continue
    const source = path.join(distRoot, `blog-post-${id}.html`)
    const target = path.join(distRoot, 'blog', `blog-post-${id}.html`)
    if (!fs.existsSync(source)) throw new Error(`Missing built blog article: blog-post-${id}.html`)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(source, target)
  }

  const staticOutput = ensureStaticSitemapSchemas()

  const programCount = firms.reduce((total, firm) => total + (firm.showRules !== false && Array.isArray(evidence.firms?.[firm.slug]?.programs)
    ? new Set(evidence.firms[firm.slug].programs.map((program) => slugify(program.program || program.name || program.title || program.model)).filter(Boolean)).size
    : 0), 0)
  const firmSurfaceCount = firms.reduce((total, firm) => total
    + (firm.showFirmProfile !== false ? 1 : 0)
    + (firm.showReviews !== false ? 1 : 0)
    + (firm.showRules !== false ? 1 : 0), 0)
  const authoredFirmSubpageCount = firms.filter((firm) => ['finotive-funding', 'fxify', 'goat-funded-trader', 'aqua-funded', 'blueberry-funded', 'fundednext'].includes(firm.slug) && firm.showFirmProfile !== false).length
  const expected = firmSurfaceCount + programCount + offers.length + comparisons.length + contentPosts.length + authoredFirmSubpageCount
  if (generated !== expected) throw new Error(`Generated ${generated} SEO pages; expected ${expected}`)
  console.log(`[seo-pages] generated ${generated} dynamic SEO pages for ${firms.length} firms, ${programCount} rule programs, ${offers.length} offers, ${comparisons.length} canonical comparisons and ${contentPosts.length} CMS articles; plus 1 standalone legacy blog route, ${staticOutput.injected} fallback schemas and ${staticOutput.normalizedMetadata} normalized snippets on ${origin}`)
}

main().catch((error) => {
  console.error('[seo-pages] generation failed', error)
  process.exitCode = 1
})
