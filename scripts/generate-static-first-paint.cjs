const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const distRoot = path.join(root, 'dist')
const evidencePath = path.join(root, 'public', 'seo-evidence.json')
const EXCLUDED_LISTING_SLUGS = new Set(['blue-guardian'])

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const slugify = (value = '') => String(value).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const compact = (value = '') => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

function truncateWords(value = '', limit = 14) {
  const words = compact(value).split(' ').filter(Boolean)
  return words.length > limit ? `${words.slice(0, limit).join(' ')}…` : words.join(' ')
}

function rankValue(firm = {}) {
  const value = Number(firm.ranking || firm.sortOrder)
  return Number.isFinite(value) && value > 0 ? value : 999999
}

function normalizedRows(rows = []) {
  return Array.isArray(rows) ? rows : []
}

function pairValue(rows, labels) {
  const targets = labels.map((value) => slugify(value).replace(/-/g, ''))
  const match = normalizedRows(rows).find((row) => {
    const label = slugify(row?.label || row?.title || row?.name).replace(/-/g, '')
    return targets.some((target) => label.includes(target))
  })
  return compact(match?.value || match?.amount || match?.text)
}

function firstProgramValue(firm, fields) {
  for (const program of normalizedRows(firm.evaluationPrograms)) {
    for (const field of fields) {
      const value = compact(program?.[field])
      if (value) return value
    }
  }
  return ''
}

function firmSlug(firm = {}) {
  return slugify(firm.slug || firm.id || firm.name)
}

function detailHref(firm = {}) {
  const raw = compact(firm.detailsLink)
  if (raw) return raw.startsWith('/') || /^https?:\/\//i.test(raw) ? raw : `/${raw.replace(/^\.\//, '')}`
  const slug = firmSlug(firm)
  return slug ? `/prop-firms/${encodeURIComponent(slug)}` : '/listedprop'
}

function logoHref(firm = {}) {
  const logo = compact(firm.logo)
  if (!logo) return ''
  return /^(?:https?:\/\/|data:|\/)/i.test(logo) ? logo : `/${logo.replace(/^\.\//, '')}`
}

function statValues(firm = {}) {
  return {
    allocation: pairValue(firm.keyMetrics, ['allocation', 'account size', 'max allocation']) || firstProgramValue(firm, ['allocation', 'accountSize', 'maxAllocation']) || 'Not mentioned',
    leverage: pairValue(firm.tradingConditions, ['leverage']) || pairValue(firm.firmDetails, ['leverage']) || firstProgramValue(firm, ['leverage']) || 'Not mentioned',
    profitSplit: pairValue(firm.keyMetrics, ['profit split', 'split']) || pairValue(firm.firmDetails, ['profit split', 'split']) || firstProgramValue(firm, ['profitSplit', 'split']) || 'Not mentioned',
  }
}

function detailValues(firm = {}) {
  const card = firm.cardMetrics || {}
  return [
    ['Payout Cycle', compact(card.payoutCycle || firm.payoutCycle) || 'Not mentioned'],
    ['News Trading', compact(card.newsTrading) || pairValue(firm.tradingConditions, ['news trading']) || 'Not mentioned'],
    ['Min Trading Days', compact(card.minTradingDays) || firstProgramValue(firm, ['minimumDays', 'minDays']) || 'Not mentioned'],
    ['Time Limit', compact(card.timeLimit) || firstProgramValue(firm, ['timeLimit']) || 'Not mentioned'],
    ['Starting Price', compact(card.startingPrice) || pairValue(firm.keyMetrics, ['starting price', 'price', 'fee']) || firstProgramValue(firm, ['startingPrice', 'challengeFee', 'price', 'fee']) || 'Not mentioned'],
    ['EA Allowed', compact(card.eaAllowed) || pairValue(firm.tradingConditions, ['ea allowed', 'expert advisor']) || 'Not mentioned'],
  ]
}

function stars(rating) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`
}

function firmCard(firm = {}) {
  const name = compact(firm.name) || 'Prop firm'
  const slug = firmSlug(firm)
  const href = detailHref(firm)
  const logo = logoHref(firm)
  const rating = Math.max(0, Math.min(5, Number(firm.score) || 0))
  const reviews = Math.max(0, Math.round(Number(firm.reviewCount) || 0))
  const hasVerifiedRating = reviews >= 5
  const bio = truncateWords(firm.bio || firm.overviewShort || '', 14)
  const market = compact(normalizedRows(firm.markets)[0] || normalizedRows(firm.tags)[0] || 'CFDs').toUpperCase()
  const stats = statValues(firm)
  const details = detailValues(firm)
  const initials = name.split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase()
  return `<article class="pf-card rmp-server-firm-card" data-firm-slug="${escapeHtml(slug)}">
    <div class="pf-card-header"><div class="pf-header-left"><div class="pf-logo">${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)} logo" loading="lazy" decoding="async" width="120" height="120">` : `<span>${escapeHtml(initials)}</span>`}</div><div class="pf-title-wrap"><div class="pf-firm-name-row"><a class="pf-firm-name pf-firm-link" href="${escapeHtml(href)}">${escapeHtml(name)}</a></div><div class="pf-rating-row"><span class="pf-rating-num">${hasVerifiedRating ? rating.toFixed(1) : '—'}</span><span class="pf-stars" aria-label="${hasVerifiedRating ? `${rating.toFixed(1)} out of 5` : 'Not enough verified reviews yet'}">${hasVerifiedRating ? stars(rating) : ''}</span><a class="pf-reviews pf-reviews-link" href="/prop-firms/${encodeURIComponent(slug)}/reviews">${reviews} reviews</a></div></div></div></div>
    <div class="pf-badges"><span class="pf-badge pf-badge-verified">VERIFIED</span><span class="pf-badge pf-badge-market">${escapeHtml(market)}</span></div>
    <p class="pf-tagline" title="${escapeHtml(compact(firm.bio || firm.overviewShort))}">${escapeHtml(bio || `${name} prop firm profile and account details.`)}</p>
    <div class="pf-divider"></div>
    <div class="pf-stats-row"><div class="pf-stat-item"><div><div class="pf-stat-val">${escapeHtml(stats.allocation)}</div><div class="pf-stat-label">Allocation</div></div></div><div class="pf-stat-item"><div><div class="pf-stat-val">${escapeHtml(stats.leverage)}</div><div class="pf-stat-label">Leverage</div></div></div><div class="pf-stat-item"><div><div class="pf-stat-val">${escapeHtml(stats.profitSplit)}</div><div class="pf-stat-label">Profit Split</div></div></div></div>
    <div class="pf-divider"></div>
    <div class="pf-details-grid">${details.map(([label, value]) => `<div class="pf-detail-row"><span class="pf-detail-label">${escapeHtml(label)}</span><span class="pf-detail-val" title="${escapeHtml(value)}">${escapeHtml(value)}</span></div>`).join('')}</div>
    <div class="pf-divider"></div>
    <div class="pf-btn-row"><a class="pf-btn pf-btn-outline" href="${escapeHtml(firm.buyLink || firm.website || href)}">View Firm</a><a class="pf-btn pf-btn-primary" href="${escapeHtml(href)}">View Details</a></div>
  </article>`
}

function firmLoadingCard() {
  return `<div class="pf-card pf-loading-card" aria-hidden="true">
    <div class="pf-load-top"><div class="pf-load-logo"></div><div class="pf-load-identity"><div class="pf-load-line pf-load-line--title"></div><div class="pf-load-line pf-load-line--rating"></div></div></div>
    <div class="pf-load-pills"><div class="pf-load-pill"></div><div class="pf-load-pill"></div></div>
    <div class="pf-load-copy"><div class="pf-load-line"></div><div class="pf-load-line"></div></div>
    <div class="pf-load-stats"><div class="pf-load-stat"></div><div class="pf-load-stat"></div><div class="pf-load-stat"></div></div>
    <div class="pf-load-details"><div class="pf-load-detail"></div><div class="pf-load-detail"></div><div class="pf-load-detail"></div><div class="pf-load-detail"></div></div>
    <div class="pf-load-actions"><div class="pf-load-btn"></div><div class="pf-load-btn"></div></div>
  </div>`
}

const listingLoaderStyle = `<style id="rmpFirstPaintLoader">
@keyframes rmpFirmShimmer{0%{transform:translateX(-115%)}100%{transform:translateX(230%)}}
@keyframes rmpFirmBreathe{0%,100%{border-color:rgba(139,124,255,.14);box-shadow:0 18px 42px rgba(0,0,0,.22)}50%{border-color:rgba(139,124,255,.28);box-shadow:0 22px 52px rgba(72,54,190,.12)}}
#grid.rmp-loading-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:24px!important;align-items:stretch!important}
.rmp-loading-grid .pf-loading-card{position:relative;isolation:isolate;display:flex;flex-direction:column;min-width:0;min-height:336px;padding:20px!important;background:linear-gradient(145deg,rgba(20,19,34,.96),rgba(11,10,20,.98))!important;border:1px solid rgba(139,124,255,.15)!important;border-radius:18px!important;overflow:hidden!important;animation:rmpFirmBreathe 2.8s ease-in-out infinite}
.rmp-loading-grid .pf-loading-card:before{content:'';position:absolute;z-index:-1;inset:-40% 42% 35% -20%;background:radial-gradient(circle,rgba(105,83,255,.17),transparent 68%)}
.rmp-loading-grid .pf-loading-card:after{content:'';position:absolute;z-index:3;top:0;bottom:0;left:0;width:46%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);transform:translateX(-115%);animation:rmpFirmShimmer 1.65s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}
.rmp-loading-grid .pf-loading-card:nth-child(2):after{animation-delay:.18s}.rmp-loading-grid .pf-loading-card:nth-child(3):after{animation-delay:.34s}
.rmp-loading-grid .pf-load-top{display:flex;align-items:center;gap:13px;padding-bottom:17px;border-bottom:1px solid rgba(255,255,255,.065)}
.rmp-loading-grid .pf-load-logo{width:54px;height:54px;flex:0 0 54px;border-radius:14px;background:linear-gradient(145deg,rgba(151,132,255,.24),rgba(83,65,194,.09));box-shadow:inset 0 0 0 1px rgba(177,164,255,.12)}
.rmp-loading-grid .pf-load-identity{flex:1;display:grid;gap:8px}.rmp-loading-grid .pf-load-line,.rmp-loading-grid .pf-load-pill,.rmp-loading-grid .pf-load-stat,.rmp-loading-grid .pf-load-detail,.rmp-loading-grid .pf-load-btn{background:rgba(255,255,255,.075)}
.rmp-loading-grid .pf-load-line{height:10px;border-radius:999px}.rmp-loading-grid .pf-load-line--title{width:61%;height:15px;background:rgba(255,255,255,.14)}.rmp-loading-grid .pf-load-line--rating{width:43%}
.rmp-loading-grid .pf-load-pills{display:flex;gap:7px;margin:15px 0}.rmp-loading-grid .pf-load-pill{width:66px;height:22px;border-radius:7px}.rmp-loading-grid .pf-load-pill:last-child{width:48px;background:rgba(129,103,255,.13)}
.rmp-loading-grid .pf-load-copy{display:grid;gap:8px;margin-bottom:17px}.rmp-loading-grid .pf-load-copy .pf-load-line:first-child{width:92%}.rmp-loading-grid .pf-load-copy .pf-load-line:last-child{width:68%}
.rmp-loading-grid .pf-load-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:17px}.rmp-loading-grid .pf-load-stat{height:58px;border-radius:11px;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)}
.rmp-loading-grid .pf-load-details{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:18px}.rmp-loading-grid .pf-load-detail{height:29px;border-radius:8px;background:rgba(255,255,255,.045)}
.rmp-loading-grid .pf-load-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto}.rmp-loading-grid .pf-load-btn{height:42px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.045)}.rmp-loading-grid .pf-load-btn:last-child{background:linear-gradient(135deg,rgba(114,86,255,.3),rgba(88,64,221,.17))}
@media(max-width:980px){#grid.rmp-loading-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important}.rmp-loading-grid .pf-loading-card:nth-child(3){display:none}}
@media(max-width:640px){#grid.rmp-loading-grid{grid-template-columns:minmax(0,1fr)!important;gap:16px!important}.rmp-loading-grid .pf-loading-card:nth-child(n+2){display:none}.rmp-loading-grid .pf-loading-card{min-height:328px;padding:18px!important}.rmp-loading-grid .pf-load-details{grid-template-columns:1fr}.rmp-loading-grid .pf-load-detail:nth-child(n+3){display:none}.rmp-loading-grid .pf-load-actions{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.rmp-loading-grid .pf-loading-card,.rmp-loading-grid .pf-loading-card:after{animation:none!important}}
</style>`

function offerCard(offer = {}) {
  const name = compact(offer.name) || 'Prop firm'
  const slug = slugify(offer.slug || offer.firmId || name)
  const logo = compact(offer.logoUrl || offer.logo)
  const code = compact(offer.code) || 'RMP'
  const discount = compact(offer.discount) || 'Offer'
  const rating = Math.max(0, Math.min(5, Number(offer.rating) || 0))
  const reviews = Math.max(0, Math.round(Number(offer.reviews) || 0))
  const href = compact(offer.affiliateLink || offer.link || offer.buyLink || offer.website) || '#'
  const initials = name.split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase()
  return `<article class="offer-card rmp-server-offer-card" data-name="${escapeHtml(name)}">
    <div class="offer-card-top"><div class="offer-identity"><a class="offer-logo" href="/offers/${encodeURIComponent(slug)}" aria-label="View ${escapeHtml(name)} discount page">${logo ? `<img src="${escapeHtml(/^(?:https?:\/\/|data:|\/)/i.test(logo) ? logo : `/${logo.replace(/^\.\//, '')}`)}" alt="${escapeHtml(name)} logo" loading="lazy" decoding="async">` : `<span>${escapeHtml(initials)}</span>`}</a><div><small><i></i>Active promotion</small><h3><a class="offer-title-link" href="/offers/${encodeURIComponent(slug)}">${escapeHtml(name)}</a></h3></div></div><div class="offer-discount"><strong>${escapeHtml(/^\d+(?:\.\d+)?$/.test(discount) ? `${discount}%` : discount)}</strong><span>saving</span></div></div>
    <div class="offer-card-body"><div class="offer-rating"><span class="stars" aria-label="${rating.toFixed(1)} out of 5">${stars(rating)}</span>${rating ? `<strong>${rating.toFixed(1)}</strong><span>${reviews ? `${reviews} reviews` : 'Rank My Prop rating'}</span>` : '<span>New listing</span>'}</div><p>${escapeHtml(compact(offer.description) || `Current ${name} promotional pricing for eligible challenge accounts.`)}</p><div class="offer-code-row"><span>Promo code</span><code>${escapeHtml(code)}</code><button class="copy-offer-code" type="button" data-code="${escapeHtml(code)}">Copy</button></div></div>
    <footer class="offer-card-footer"><span>Check eligibility and final price on the firm site.</span><a class="unlock-offer" href="${escapeHtml(href)}">View offer</a></footer>
  </article>`
}

function headMetadata(html) {
  return [
    html.match(/<title>[\s\S]*?<\/title>/i)?.[0] || '',
    html.match(/<meta\s+[^>]*name=["']description["'][^>]*>/i)?.[0] || '',
    html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || '',
  ].join('\n')
}

function writeWithoutMetadataChanges(file, transform) {
  const before = fs.readFileSync(file, 'utf8')
  const beforeMeta = headMetadata(before)
  const after = transform(before)
  if (headMetadata(after) !== beforeMeta) throw new Error(`Static first paint changed protected metadata in ${path.relative(distRoot, file)}`)
  fs.writeFileSync(file, after)
}

function mergeFirmRows(listedDefaults, bestDefaults, evidenceFirms) {
  const map = new Map()
  const add = (firm, surface) => {
    const slug = firmSlug(firm)
    if (!slug) return
    const previous = map.get(slug) || {}
    map.set(slug, {
      ...previous,
      ...firm,
      slug,
      showListed: surface === 'listed' || previous.showListed === true || firm.showListed === true,
      showBestGlobal: surface === 'best' || previous.showBestGlobal === true || firm.showBestGlobal === true,
    })
  }
  listedDefaults.forEach((firm) => add(firm, 'listed'))
  bestDefaults.forEach((firm) => add(firm, 'best'))
  Object.entries(evidenceFirms || {}).forEach(([key, firm]) => add({ ...(map.get(slugify(firm.slug || key)) || {}), ...firm, slug: firm.slug || key }, 'evidence'))
  return [...map.values()].filter((firm) => firm.name && !EXCLUDED_LISTING_SLUGS.has(firmSlug(firm))).sort((a, b) => rankValue(a) - rankValue(b))
}

function mergeOffers(defaults, evidenceOffers) {
  const map = new Map(defaults.map((offer) => [slugify(offer.slug || offer.name || offer.id), offer]))
  Object.entries(evidenceOffers || {}).forEach(([key, offer]) => {
    const slug = slugify(offer.slug || key || offer.name)
    map.set(slug, { ...(map.get(slug) || {}), ...offer, slug })
  })
  return [...map.values()].filter((offer) => offer.active !== false && offer.name).sort((a, b) => rankValue(a) - rankValue(b))
}

const listingCategoryByFile = {
  'fast-payout-prop-firms.html': 'fast_payout',
  'best-instant-funding-firms.html': 'instant_funding',
  'best-hft-prop-firms.html': 'hft',
  'best-futures-prop-firms.html': 'futures',
  'cheapest-prop-firms.html': 'cheapest',
  'most-trusted-prop-firms.html': 'trusted',
  'beginner-friendly-firms.html': 'beginner',
  'highest-rated-firms.html': 'highest_rated',
}

function listingRowsFor(fileName, firms) {
  if (fileName === 'listedprop.html') return firms.filter((firm) => firm.showListed !== false)
  const best = firms.filter((firm) => firm.showBestGlobal === true || String(firm.listingType).toLowerCase() === 'best' || Object.values(firm.bestRegions || {}).some(Boolean))
  const category = listingCategoryByFile[fileName]
  if (!category) return best
  const categorized = best.filter((firm) => firm.bestCategories?.[category] === true)
  return categorized.length ? categorized : best
}

function injectListingPages(firms) {
  const candidates = fs.readdirSync(distRoot).filter((fileName) => fileName.endsWith('.html') && fs.readFileSync(path.join(distRoot, fileName), 'utf8').includes('firms-view.js'))
  let count = 0
  candidates.forEach((fileName) => {
    const file = path.join(distRoot, fileName)
    const cards = listingRowsFor(fileName, firms).slice(0, 9).map(firmCard).join('')
    if (!cards) return
    const skeletons = new Array(3).fill(0).map(firmLoadingCard).join('')
    writeWithoutMetadataChanges(file, (html) => {
      let output = html.replace(/<div\s+id=["']grid["']\s+class=["']grid["'][^>]*>[\s\S]*?<\/div>/i, `<div id="grid" class="grid rmp-loading-grid" data-rmp-static-first-paint="true" aria-busy="true">${skeletons}</div><noscript><div class="rmp-server-firm-directory">${cards}</div></noscript>`)
      if (!output.includes('id="rmpFirstPaintLoader"')) output = output.replace('</head>', `${listingLoaderStyle}\n</head>`)
      return output
    })
    count += 1
  })
  return count
}

function injectOfferPages(offers) {
  const files = [path.join(distRoot, 'offers.html')]
  const dedicatedDirectory = path.join(distRoot, 'offers')
  if (fs.existsSync(dedicatedDirectory)) {
    fs.readdirSync(dedicatedDirectory).filter((name) => name.endsWith('.html')).forEach((name) => files.push(path.join(dedicatedDirectory, name)))
  }
  let count = 0
  files.filter((file) => fs.existsSync(file)).forEach((file) => {
    const slug = path.basename(file, '.html') === 'offers' ? '' : path.basename(file, '.html')
    const ordered = slug ? [...offers].sort((a, b) => Number(slugify(b.slug || b.name) === slug) - Number(slugify(a.slug || a.name) === slug)) : offers
    const visible = ordered.slice(0, 10)
    writeWithoutMetadataChanges(file, (html) => {
      let output = html.replace(/(<p\s+id=["']resultsCount["'][^>]*>)[\s\S]*?(<\/p>)/i, `$1Showing 1–${visible.length} of ${offers.length} offers$2`)
      output = output.replace(/<div\s+class=["']offers-grid["']\s+id=["']offersGrid["'][^>]*>[\s\S]*?<\/div>/i, `<div class="offers-grid" id="offersGrid" data-rmp-static-first-paint="true" aria-live="polite" aria-busy="false">${visible.map(offerCard).join('')}</div>`)
      return output
    })
    count += 1
  })
  return count
}

function homeSnapshot(firms, offers) {
  const rankingRows = firms.filter((firm) => firm.showHomeTable !== false).slice(0, 10).map((firm, index) => {
    const stats = statValues(firm)
    const rating = Math.max(0, Math.min(5, Number(firm.score) || 0))
    const reviewCount = Math.max(0, Number(firm.reviewCount) || 0)
    const ratingLabel = reviewCount >= 5 ? `★ ${rating.toFixed(1)} · ${reviewCount} reviews` : `${reviewCount} verified reviews · rating pending`
    return `<article class="ranking-row"><div class="firm-identity"><span class="ranking-name"><strong>${index + 1}. <a href="${escapeHtml(detailHref(firm))}">${escapeHtml(firm.name)}</a></strong><small>${ratingLabel}</small></span></div><div class="metric-cell"><strong>${escapeHtml(stats.allocation)}</strong><span>Account size</span></div><div class="metric-cell"><strong>${escapeHtml(stats.profitSplit)}</strong><span>Profit split</span></div><div class="metric-cell"><strong>${escapeHtml(compact(firm.cardMetrics?.payoutCycle || firm.payoutCycle) || 'See profile')}</strong><span>Payout</span></div><div class="ranking-actions"><a href="${escapeHtml(detailHref(firm))}">View firm</a></div></article>`
  }).join('')
  const offerLinks = offers.slice(0, 6).map((offer) => `<li><a href="/offers/${encodeURIComponent(slugify(offer.slug || offer.name))}"><strong>${escapeHtml(offer.name)}</strong><span>${escapeHtml(offer.discount || 'Current offer')} · code ${escapeHtml(offer.code || 'RMP')}</span></a></li>`).join('')
  return `<div class="site rmp-server-home" data-rmp-static-first-paint="true">
    <header class="site-header"><div class="header-shell"><a class="brand" href="/"><img src="/assets/rankmyprop-header-logo.png" alt=""><span>Rank My Prop</span></a><nav class="main-nav" aria-label="Primary navigation"><a class="nav-link" href="/listedprop">Listed Props</a><a class="nav-link" href="/bestprop">Best Prop Firms</a><a class="nav-link" href="/offers">Offers</a><a class="nav-link" href="/reviews">Reviews</a><a class="nav-link" href="/compare">Compare</a><a class="nav-link" href="/calculators">Calculators</a><a class="nav-link" href="/prop-news">Prop News</a></nav></div></header>
    <main><section class="hero-stage"><div class="home-hero-bg"><div class="hero-shell"><p class="hero-badge">Trusted by traders worldwide</p><h1 class="hero-title">Compare top <span class="gradient-text">ranked</span> prop firms.<br>Built for serious traders.</h1><p class="hero-copy">Find the best prop firms, exclusive discount codes, verified payout proofs, and trading tools — all in one place.</p><div class="hero-actions"><a class="outline-btn" href="/reviews">Explore Prop Firm Reviews</a><a class="glow-btn" href="/bestprop">See Top Ranked Firms</a></div></div></div></section>
    <section class="rankings-section" aria-labelledby="rmpStaticRankings"><div class="rankings-shell"><div class="rankings-heading"><div><span class="rankings-kicker">PROP FIRM DIRECTORY</span><h2 id="rmpStaticRankings">Prop firm rankings</h2></div><p>Compare published account sizes, profit splits, payouts and approved trader ratings.</p></div><div class="ranking-table"><div class="ranking-table-title"><div><strong>Current overall ranking</strong><span>Showing ${Math.min(10, firms.length)} firms</span></div></div><div class="ranking-list">${rankingRows}</div></div><div class="rankings-footer"><a href="/bestprop">View complete rankings →</a></div></div></section>
    <section class="rmp-offer-banner-section rmp-offer-banner-section--home" aria-labelledby="rmpStaticOffers"><div class="rmp-offer-banner"><div><h2 id="rmpStaticOffers">Current prop firm offers</h2><p>Browse active promotional savings and confirm final eligibility at checkout.</p><ul>${offerLinks}</ul></div><a href="/offers">Explore all offers →</a></div></section></main>
  </div>`
}

function injectHomepage(firms, offers) {
  const file = path.join(distRoot, 'index.html')
  // Keep the crawlable homepage snapshot available to no-JavaScript clients,
  // while leaving React's root empty so the interactive homepage can render
  // immediately after hydration. Rendering the snapshot inside the root
  // caused the first-paint shell to remain visible when the client bundle was
  // delayed, which made the homepage differ from the deployed Cloudflare UI.
  writeWithoutMetadataChanges(file, (html) => html.replace('<div id="root"></div>', `<div id="root"></div><noscript>${homeSnapshot(firms, offers)}</noscript>`))
}

async function main() {
  if (!fs.existsSync(distRoot)) throw new Error('Run Vite build before static first-paint generation')
  const evidence = fs.existsSync(evidencePath) ? JSON.parse(fs.readFileSync(evidencePath, 'utf8')) : {}
  const firmsModule = await import(path.join(root, 'public', 'firms-data.js'))
  const offersModule = await import(path.join(root, 'public', 'offers-data.js'))
  const firms = mergeFirmRows(firmsModule.DEFAULT_LISTED_FIRMS || [], firmsModule.DEFAULT_BEST_FIRMS || [], evidence.firms || {})
  const offers = mergeOffers(offersModule.DEFAULT_OFFERS || [], evidence.offers || {})
  const listingPages = injectListingPages(firms)
  const offerPages = injectOfferPages(offers)
  injectHomepage(firms, offers)
  console.log(`[static-first-paint] generated homepage content, ${listingPages} listing pages and ${offerPages} offer pages from ${firms.length} firms and ${offers.length} offers`)
}

main().catch((error) => {
  console.error('[static-first-paint] generation failed', error)
  process.exit(1)
})
