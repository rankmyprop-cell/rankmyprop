const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const publicRoot = path.join(root, 'dist')
const origin = 'https://www.rankmyprop.in'

const directCodeRecords = {
  '/prop-firms/alpha-trader-firm': {
    heading: 'Alpha Trader Firm Review 2026: Rules, Payouts & Challenges',
    paragraph: 'Explore Alpha Trader Firm in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key information you need before choosing an Alpha Trader Firm account.',
    seoTitle: 'Alpha Trader Firm Review 2026 | Rules, Payouts & Challenges',
    seoDescription: 'Read the Alpha Trader Firm review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.'
  },
  '/prop-firms/alpha-trader-firm/challenges': {
    heading: 'Alpha Trader Firm Challenges 2026: Fees, Account Sizes & Funding Programs',
    paragraph: 'Explore Alpha Trader Firm challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
    seoTitle: 'Alpha Trader Firm Challenges 2026 | Fees, Account Sizes & Programs',
    seoDescription: 'Explore Alpha Trader Firm challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.'
  },
  '/prop-firms/blueberry-funded': {
    heading: 'Blueberry Funded Review 2026: Rules, Payouts & Challenges',
    paragraph: 'Explore Blueberry Funded in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, trading restrictions, and trader reviews. Get the key information you need before choosing a Blueberry Funded account.',
    seoTitle: 'Blueberry Funded Review 2026 | Rules, Payouts & Challenges',
    seoDescription: 'Read the Blueberry Funded review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, restrictions, and trader reviews.'
  },
  '/prop-firms/blueberry-funded/challenges': {
    heading: 'Blueberry Funded Challenges 2026: Fees, Account Sizes & Funding Programs',
    paragraph: 'Explore Blueberry Funded challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
    seoTitle: 'Blueberry Funded Challenges 2026 | Fees, Account Sizes & Programs',
    seoDescription: 'Explore Blueberry Funded challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.'
  },
  '/prop-firms/aqua-funded': {
    heading: 'Aqua Funded Review 2026: Rules, Payouts & Challenges',
    paragraph: 'Explore Aqua Funded in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, news trading policies, and trader reviews. Get the key information you need before choosing an Aqua Funded account.',
    seoTitle: 'Aqua Funded Review 2026 | Rules, Payouts & Challenges',
    seoDescription: 'Read the Aqua Funded review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, news trading and trader reviews.'
  },
  '/prop-firms/aqua-funded/challenges': {
    heading: 'Aqua Funded Challenges 2026: Fees, Account Sizes & Funding Programs',
    paragraph: 'Explore Aqua Funded challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
    seoTitle: 'Aqua Funded Challenges 2026 | Fees, Account Sizes & Programs',
    seoDescription: 'Explore Aqua Funded challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.'
  },
  '/prop-firms/goat-funded-trader': {
    heading: 'Goat Funded Trader Review 2026: Rules, Payouts & Challenges',
    paragraph: 'Explore Goat Funded Trader in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key information you need before choosing a Goat Funded Trader account.',
    seoTitle: 'Goat Funded Trader Review 2026 | Rules, Payouts & Challenges',
    seoDescription: 'Read the Goat Funded Trader review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.'
  },
  '/prop-firms/goat-funded-trader/challenges': {
    heading: 'Goat Funded Trader Challenges 2026: Fees, Account Sizes & Funding Programs',
    paragraph: 'Explore Goat Funded Trader challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, payout conditions, and key trading rules for each funding program.',
    seoTitle: 'Goat Funded Trader Challenges 2026 | Fees, Accounts & Programs',
    seoDescription: 'Explore Goat Funded Trader challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, payouts, and funded trading programs.'
  },
  '/prop-firms/fxify': {
    heading: 'FXIFY Review 2026: Prop Firm Rules, Payouts & Challenges',
    paragraph: 'Explore FXIFY in 2026, including funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key details about FXIFY before choosing a funded trading account.',
    seoTitle: 'FXIFY Review 2026 | Rules, Payouts & Challenges',
    seoDescription: 'Read the FXIFY review for 2026. Explore funded accounts, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.'
  },
  '/prop-firms/fxify/challenges': {
    heading: 'FXIFY Challenges 2026: Fees, Account Sizes & Funding Programs',
    paragraph: 'Explore FXIFY challenges in 2026, including available account sizes, challenge fees, profit targets, profit splits, drawdown requirements, trading rules, and funded account options. Find detailed information on each FXIFY funding program.',
    seoTitle: 'FXIFY Challenges 2026 | Fees, Account Sizes & Programs',
    seoDescription: 'Explore FXIFY challenges in 2026, including challenge fees, account sizes, profit targets, profit splits, drawdown rules, trading conditions, and funded account programs.'
  },
  '/prop-firms/finotive-funding': {
    heading: 'Finotive Funding Review 2026: Rules, Challenges, Payouts & Funding',
    paragraph: 'Explore Finotive Funding in 2026, including its funded trading challenges, account sizes, profit splits, drawdown rules, payout conditions, trading platforms, and trader reviews. Get the key information you need before choosing a Finotive Funding account.',
    seoTitle: 'Finotive Funding Review 2026 | Rules, Payouts & Challenges',
    seoDescription: 'Read our Finotive Funding review for 2026. Explore account sizes, challenge options, profit splits, drawdown rules, payouts, trading platforms, and trader reviews.'
  },
  '/prop-firms/finotive-funding/challenges': {
    heading: 'Finotive Funding Challenges 2026: Fees, Account Sizes & Funding Programs',
    paragraph: 'Explore Finotive Funding challenges in 2026, including account sizes, challenge fees, profit targets, profit splits, drawdown requirements, trading rules, and available funding programs. Find the right Finotive Funding challenge for your trading strategy.',
    seoTitle: 'Finotive Funding Challenges 2026 | Fees, Account Sizes & Programs',
    seoDescription: 'Explore Finotive Funding challenges in 2026, including fees, account sizes, profit targets, profit splits, drawdown rules, and available funded trading programs.'
  },
  '/prop-firm-rules': {
    heading: 'Prop Firm Rules 2026: Trading Rules for Funded Accounts',
    paragraph: 'Explore prop firm rules for funded trading accounts in 2026, including daily drawdown, maximum loss, profit targets, payout rules, trading restrictions, news trading, EA usage, copy trading, and platform requirements.',
    seoTitle: 'Prop Firm Rules 2026 | Funded Account Trading Rules',
    seoDescription: 'Explore prop firm rules for funded accounts in 2026. Check drawdown, maximum loss, profit targets, payouts, news trading, EA, copy trading and platform rules.'
  },
  '/reviews': {
    heading: 'Prop Firm Reviews 2026: Trader Reviews, Ratings & Experiences',
    paragraph: 'Read prop firm reviews from traders and explore ratings across trading conditions, customer support, user experience, and payout processes. Discover what traders are saying about different prop firms before choosing a funded trading account.',
    seoTitle: 'Prop Firm Reviews 2026 | Trader Reviews & Ratings',
    seoDescription: 'Read prop firm reviews from traders in 2026. Explore prop firm ratings, trading conditions, customer support, payout experiences, and trader feedback before choosing a funded account.'
  },
  '/offers': {
    heading: 'Prop Firm Offers, Discount Codes & Deals 2026',
    paragraph: 'Find the latest prop firm offers, discount codes, promo codes, and deals for 2026. Discover active discounts from top prop firms, copy verified promo codes, and save on funded trading challenges and accounts.',
    seoTitle: 'Prop Firm Offers & Discount Codes 2026 | Best Prop Firm Deals',
    seoDescription: 'Find the latest prop firm offers, discount codes, promo codes and deals in 2026. Discover active prop firm discounts and save on funded trading challenges.'
  },
  '/listedprop': {
    heading: 'Best Prop Firms 2026: Compare Funded Trading Firms',
    paragraph: 'Compare the best prop firms in 2026 based on funding options, profit splits, drawdown rules, payout cycles, trading platforms, challenge fees, news trading policies, and trader reviews.',
    seoTitle: 'Best Prop Firms 2026 | Compare Prop Firm Rules & Payouts',
    seoDescription: 'Compare the best prop firms in 2026 by account sizes, profit splits, drawdown rules, payouts, trading platforms, challenge fees, news trading, and trader reviews.'
  },
  '/best-prop-firms-2026': {
    heading: 'Best Forex Prop Firms in 2026: Top-Rated Funded Trading Firms',
    paragraph: 'Discover the best forex prop firms in 2026, featuring top-rated funded trading firms with detailed information on account sizes, profit splits, drawdown rules, payout cycles, trading platforms, challenge fees, news trading policies, and trader reviews.',
    seoTitle: 'Best Forex Prop Firms in 2026 | Top Funded Trading Firms',
    seoDescription: 'Discover the best forex prop firms in 2026. Explore top funded trading firms, account sizes, profit splits, drawdown rules, payouts, platforms, challenge fees, news trading and trader reviews.'
  },
  '/fast-payout-prop-firms': {
    heading: 'Best Fast Payout Prop Firms in 2026: Top Firms for Quick Payouts',
    paragraph: 'Discover the best fast payout prop firms in 2026, featuring funded trading firms known for quick payout cycles, flexible withdrawal options, competitive profit splits, and trader-friendly funding programs.',
    seoTitle: 'Best Fast Payout Prop Firms in 2026 | Quick Payout Firms',
    seoDescription: 'Discover the best fast payout prop firms in 2026. Find prop firms offering quick payouts, flexible withdrawals, high profit splits, funded accounts, and trader-friendly rules.'
  },
  '/best-instant-funding-firms': {
    heading: 'Best Instant Funding Prop Firms in 2026: Top Instant Funded Accounts',
    paragraph: 'Discover the best instant funding prop firms in 2026 offering immediate access to funded trading accounts. Explore account sizes, profit splits, payout rules, drawdown limits, trading platforms, pricing, and key trading conditions before choosing an instant funding program.',
    seoTitle: 'Best Instant Funding Prop Firms in 2026 | Instant Funded Accounts',
    seoDescription: 'Discover the best instant funding prop firms in 2026. Explore instant funded accounts, profit splits, payout rules, drawdown limits, pricing, trading platforms, and funding conditions.'
  },
  '/most-trusted-prop-firms': {
    heading: 'Most Trusted Forex Prop Firms in 2026: Top Trusted Funded Trading Firms',
    paragraph: 'Discover the most trusted forex prop firms in 2026 based on verification, trader reviews, payout information, rule transparency, and overall trading conditions. Explore trusted funded trading firms and their key account features before choosing a prop firm.',
    seoTitle: 'Most Trusted Forex Prop Firms in 2026 | Trusted Prop Firms',
    seoDescription: 'Discover the most trusted forex prop firms in 2026. Explore verified prop firms, trader reviews, payout information, transparent rules, funded accounts, and key trading conditions.'
  },
  '/best-futures-prop-firms': {
    heading: 'Best Futures Prop Firms in 2026: Top Firms for Futures Traders',
    paragraph: 'Discover the best futures prop firms in 2026 for traders looking for funded futures accounts. Explore available account sizes, profit splits, drawdown rules, payout conditions, trading platforms, scaling plans, and other key funding requirements.',
    seoTitle: 'Best Futures Prop Firms in 2026 | Top Futures Funding Firms',
    seoDescription: 'Discover the best futures prop firms in 2026. Explore funded futures accounts, profit splits, drawdown rules, payouts, platforms, scaling plans, and key trading requirements.'
  },
  '/beginner-friendly-firms': {
    heading: 'Best Beginner-Friendly Prop Firms in 2026: Top Firms for New Traders',
    paragraph: 'Discover the best beginner-friendly prop firms in 2026 for new and developing traders. Explore simple trading rules, affordable challenge fees, clear funding conditions, easy-to-use platforms, flexible account options, and trader-friendly requirements.',
    seoTitle: 'Best Beginner-Friendly Prop Firms in 2026 | Top Firms for New Traders',
    seoDescription: 'Discover the best beginner-friendly prop firms in 2026. Explore affordable challenges, simple trading rules, funded accounts, clear drawdown limits, easy platforms, and trader-friendly requirements.'
  }
}

function slugify(value = '') { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
function idForRoute(route) {
  const parts = route.split('/').filter(Boolean)
  if (!parts.length) return 'home-hero'
  if (route === '/offers') return 'offers-page'
  if (route === '/compare') return 'compare-page'
  if (route === '/reviews') return 'firm-reviews-page'
  if (route === '/prop-firm-rules') return 'prop-firm-rules-page'
  if (parts[0] === 'prop-firms' && parts[1]) return `firm-review-${slugify(parts[1])}`
  if (parts[0] === 'prop-firm-rules' && parts[1]) return parts[2] ? `challenge-model-${slugify(parts[1])}-${slugify(parts[2])}` : `firm-rules-${slugify(parts[1])}`
  if (parts[0] === 'offers' && parts[1]) return `offer-${slugify(parts[1])}`
  if (parts.length >= 2 && ['blog', 'news', 'trading-guides', 'funding-strategies', 'trading-psychology', 'beginner-tutorials'].includes(parts[0])) return `article-${slugify(parts[0])}-${slugify(parts[1])}`
  return `page-${slugify(parts.join('-'))}`
}
function routeForFile(file) {
  const relative = path.relative(publicRoot, file).replace(/\\/g, '/')
  if (relative === 'index.html') return '/'
  return `/${relative.replace(/\.html$/i, '')}`
}
function text(html, regex) { return (html.match(regex)?.[1] || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim() }
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]) }

let count = 0
for (const file of walk(publicRoot).filter((file) => file.endsWith('.html') && !/\/(?:admin|dashboard|login|404)\b/i.test(file))) {
  let html = fs.readFileSync(file, 'utf8')
  const fileRoute = routeForFile(file)
  const canonical = text(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i) || `${origin}${fileRoute}`
  // Generated pages often share a file template.  Their canonical URL, not the
  // template filename, is the only safe CMS identity for a direct reload.
  let route = fileRoute
  try { route = new URL(canonical, origin).pathname } catch (_) {}
  const heading = text(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const description = text(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)
  const title = text(html, /<title>([\s\S]*?)<\/title>/i)
  const directRecord = directCodeRecords[route]
  const isDirectOfferRoute = /^\/offers\/[^/]+$/.test(route)
  const record = directRecord
    ? { id: idForRoute(route), ...directRecord, canonical, robots: 'index, follow, max-image-preview:large, max-snippet:-1', __stableSsrHero: true, __directCode: true }
    : { id: idForRoute(route), heading, paragraph: description, seoTitle: title, seoDescription: description, canonical, robots: 'index, follow, max-image-preview:large, max-snippet:-1', __stableSsrHero: true, ...(isDirectOfferRoute ? { __directCode: true } : {}) }
  const tag = `<script id="rmp-ssr-bootstrap">window.__RMP_SSR_BOOTSTRAP=${JSON.stringify(record).replace(/</g, '\\u003c')};</script>`
  html = html.replace(/\s*<script id=["']rmp-ssr-bootstrap["']>[\s\S]*?<\/script>/i, '')
  html = html.replace(/\s*<script[^>]+src=["'][^"']*route-content-runtime\.js[^"']*["'][^>]*><\/script>/i, '')
  html = html.replace(/<\/head>/i, `${tag}\n<script defer src="/route-content-runtime.js"></script>\n</head>`)
  fs.writeFileSync(file, html)
  count += 1
}
console.log(`[route-bootstrap] injected stable route bootstrap into ${count} public pages`)
