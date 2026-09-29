const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const publicRoot = path.join(root, 'public')
const evidence = JSON.parse(fs.readFileSync(path.join(publicRoot, 'seo-evidence.json'), 'utf8'))
const firms = Object.values(evidence.firms || {})
const offers = Object.values(evidence.offers || {})
const reviews = Object.values(evidence.reviews || {}).flat()
const programs = firms.reduce((sum, firm) => sum + (Array.isArray(firm.programs) ? firm.programs.length : 0), 0)
const rulebooks = firms.reduce((sum, firm) => sum + Object.keys(firm.programRules || {}).length, 0)
const dataComplete = firms.filter((firm) => ['keyMetrics', 'tradingConditions', 'firmDetails']
  .reduce((sum, key) => sum + (Array.isArray(firm[key]) ? firm[key].length : 0), 0) >= 12).length
const proofBackedReviews = reviews.filter((review) => review.proofUrl).length
const materialDates = [
  ...firms.map((firm) => firm.updatedAt),
  ...offers.map((offer) => offer.updatedAt),
  ...reviews.map((review) => review.datePublished),
].filter(Boolean).sort()
const reportIso = materialDates.at(-1)?.slice(0, 10) || evidence.generatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)
const reportLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${reportIso}T00:00:00Z`))

const platformCounts = new Map()
const canonicalPlatform = (value = '') => {
  const key = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
  const names = {
    mt4: 'MetaTrader 4', metatrader4: 'MetaTrader 4',
    mt5: 'MetaTrader 5', metatrader5: 'MetaTrader 5', metatrader5mt5: 'MetaTrader 5',
    ctrader: 'cTrader', matchtrader: 'Match-Trader', tradelocker: 'TradeLocker',
    dxtrade: 'DXtrade', tradovate: 'Tradovate', volumetrica: 'Volumetrica',
  }
  return names[key] || ''
}
firms.forEach((firm) => (firm.platforms || []).forEach((platform) => {
  const name = canonicalPlatform(platform)
  if (name) platformCounts.set(name, (platformCounts.get(name) || 0) + 1)
}))
const platforms = [...platformCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

const snapshot = {
  title: 'Rank My Prop Market Snapshot 2026',
  lastMaterialUpdate: reportIso,
  methodology: 'Counts are calculated from published Rank My Prop CMS records. Draft, inactive and rejected records are excluded where applicable.',
  firms: firms.length,
  firmsWithAtLeast12CoreDataPoints: dataComplete,
  activeOffers: offers.length,
  approvedCommunityReviews: reviews.length,
  proofBackedApprovedReviews: proofBackedReviews,
  publishedAccountPrograms: programs,
  detailedProgramRulebooks: rulebooks,
  platformCoverage: Object.fromEntries(platforms),
}

fs.mkdirSync(path.join(publicRoot, 'data'), { recursive: true })
fs.writeFileSync(path.join(publicRoot, 'data', 'prop-firm-market-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`)
const csvRows = [
  ['metric', 'value'],
  ['published_firms', firms.length],
  ['firms_with_12_plus_core_data_points', dataComplete],
  ['active_offers', offers.length],
  ['approved_community_reviews', reviews.length],
  ['proof_backed_approved_reviews', proofBackedReviews],
  ['published_account_programs', programs],
  ['detailed_program_rulebooks', rulebooks],
  ...platforms.map(([platform, count]) => [`platform_${platform.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, count]),
]
fs.writeFileSync(path.join(publicRoot, 'data', 'prop-firm-market-snapshot.csv'), `${csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')}\n`)

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const metricCards = [
  [firms.length, 'Published firm records'],
  [offers.length, 'Active offer records'],
  [programs, 'Account programs'],
  [reviews.length, 'Approved reviews'],
].map(([value, label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('')
const platformRows = platforms.slice(0, 10).map(([name, count]) => `<tr><th scope="row">${escapeHtml(name)}</th><td>${count}</td><td>${firms.length ? Math.round((count / firms.length) * 100) : 0}% of published firm records</td></tr>`).join('') || '<tr><th scope="row">No platform data</th><td>0</td><td>Not supplied in CMS records</td></tr>'
const schema = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Article', headline: snapshot.title, dateModified: reportIso, datePublished: reportIso, author: { '@type': 'Organization', name: 'Rank My Prop' }, mainEntityOfPage: 'https://www.rankmyprop.in/prop-firm-market-report' },
    { '@type': 'Dataset', name: snapshot.title, description: snapshot.methodology, dateModified: reportIso, creator: { '@type': 'Organization', name: 'Rank My Prop' }, distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://www.rankmyprop.in/data/prop-firm-market-snapshot.json' },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://www.rankmyprop.in/data/prop-firm-market-snapshot.csv' },
    ] },
  ],
}).replace(/</g, '\\u003c')

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prop Firm Market Report 2026: Data & Methodology | Rank My Prop</title>
<meta name="description" content="Explore Rank My Prop's 2026 prop firm market snapshot covering published firms, account programs, offers, approved reviews and platform availability.">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"><link rel="canonical" href="https://www.rankmyprop.in/prop-firm-market-report">
<meta property="og:title" content="Rank My Prop Market Snapshot 2026"><meta property="og:description" content="A transparent, downloadable snapshot of published prop firm research records."><meta property="og:url" content="https://www.rankmyprop.in/prop-firm-market-report"><meta property="og:type" content="article">
<link rel="stylesheet" href="/site-shell.css"><link rel="stylesheet" href="/global-footer.css"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json" id="serverSeoSchema">${schema}</script>
<style>*{box-sizing:border-box}body{margin:0;background:#06050c;color:#f4f1fa;font-family:'Plus Jakarta Sans',sans-serif}.report{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:150px 0 90px}.report-hero{padding:64px;border:1px solid #2d2350;border-radius:28px;background:radial-gradient(circle at 82% 8%,rgba(122,84,242,.24),transparent 32%),linear-gradient(145deg,#171126,#090810)}.eyebrow{color:#ad92ff;font-size:12px;font-weight:800;letter-spacing:.16em}.report h1{max-width:880px;margin:16px 0;font-size:clamp(42px,7vw,76px);line-height:1.02;letter-spacing:-.06em}.lead{max-width:780px;color:#b9b0c6;font-size:17px;line-height:1.75}.updated{margin-top:20px;color:#91889e;font-size:12px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:28px}.metrics article,.panel{border:1px solid rgba(155,126,235,.17);border-radius:18px;background:rgba(255,255,255,.025)}.metrics article{padding:22px}.metrics strong{display:block;color:#b79dff;font-size:34px}.metrics span{display:block;margin-top:6px;color:#aaa1b5;font-size:12px}.panel{margin-top:24px;padding:34px}.panel h2{margin:0;font-size:30px}.panel p,.panel li{color:#b8afc4;line-height:1.8}.panel a{color:#c6b4ff}.downloads{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.downloads a{padding:12px 16px;border-radius:999px;background:#704cff;color:#fff;text-decoration:none;font-size:13px;font-weight:800}table{width:100%;margin-top:20px;border-collapse:collapse}th,td{padding:13px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px}th{color:#eee8f6}td{color:#aaa1b5}@media(max-width:760px){.report{padding-top:110px}.report-hero,.panel{padding:24px}.metrics{grid-template-columns:1fr 1fr}.report h1{font-size:42px}table{display:block;overflow-x:auto}}</style></head>
<body><main class="report"><section class="report-hero"><span class="eyebrow">ORIGINAL RANK MY PROP DATA</span><h1>Prop Firm Market Snapshot 2026</h1><p class="lead">A transparent view of the firm, offer, rulebook and approved-review records currently published through Rank My Prop. This report is designed for traders, researchers and journalists who need citable data with clear limitations.</p><p class="updated">Last material dataset update: <time datetime="${reportIso}">${reportLabel}</time></p><div class="metrics">${metricCards}</div></section>
<section class="panel"><h2>What the dataset shows</h2><p>Rank My Prop currently contains ${firms.length} published firm records, ${offers.length} active offer records, ${programs} published account programs and ${rulebooks} detailed program rulebooks. ${dataComplete} firms currently have at least twelve structured data points across key metrics, trading conditions and firm details. Coverage is not treated as proof that a firm is safe, profitable or suitable for every trader.</p><p>The approved community-review dataset contains ${reviews.length} records. ${proofBackedReviews} currently include a public proof attachment. A missing attachment does not automatically make a review false, and an attachment does not independently prove every claim in a submission.</p></section>
<section class="panel"><h2>Trading platform coverage</h2><p>Platform counts below reflect names supplied in published CMS firm records. One firm can support multiple platforms, so counts do not add up to the number of firms.</p><table><thead><tr><th>Platform</th><th>Firm records</th><th>Coverage</th></tr></thead><tbody>${platformRows}</tbody></table></section>
<section class="panel"><h2>Methodology</h2><ol><li>Only active, published CMS firm and offer records are counted.</li><li>Community reviews must have an approved status before inclusion.</li><li>Program and rulebook counts come from structured records, not promotional headline claims.</li><li>Missing values remain missing; Rank My Prop does not infer them from unrelated firms.</li><li>The report date changes only when a source record receives a material update.</li></ol><div class="downloads"><a href="/data/prop-firm-market-snapshot.json" download>Download JSON</a><a href="/data/prop-firm-market-snapshot.csv" download>Download CSV</a></div></section>
<section class="panel"><h2>Limitations and citation</h2><p>Prop firm rules, offers and platform availability can change. This snapshot documents Rank My Prop's published records at the stated update date and is not financial advice or a guarantee of payouts. Verify material terms with the relevant firm.</p><p>Suggested citation: <em>Rank My Prop, “Prop Firm Market Snapshot 2026,” updated ${reportLabel}.</em> When citing the data online, link to <a href="https://www.rankmyprop.in/prop-firm-market-report">this report page</a>.</p></section></main>
<script type="module" src="/rmp-nav.js"></script><script src="/global-footer.js"></script><script type="module" src="/site-performance.js"></script></body></html>`

fs.writeFileSync(path.join(publicRoot, 'prop-firm-market-report.html'), html)
console.log(`[market-report] generated report from ${firms.length} firms, ${offers.length} offers, ${reviews.length} approved reviews and ${programs} programs`)
