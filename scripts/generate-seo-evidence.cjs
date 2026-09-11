const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const outputPath = path.join(root, 'public', 'seo-evidence.json')

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBACBm1Yr4zf-KVy1ejRPJ1rqKFctEumuA',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'rank-my-prop.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'rank-my-prop',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'rank-my-prop.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1094966707382',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:1094966707382:web:c4cd641630588d6adc9217',
}

const slugify = (value = '') => String(value)
  .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const legacyFirmSlugs = {
  gft: 'goat-funded-trader',
  traderscale: 'trader-scale',
  blueberryfunded: 'blueberry-funded',
  swayfunded: 'sway-funded',
  toponetrader: 'top-one-trader',
  goatfundedtrader: 'goat-funded-trader',
  wefund: 'we-fund',
  qtfunded: 'qt-funded',
  finotivefunding: 'finotive-funding',
  aquafunded: 'aqua-funded',
  fx2funding: 'fx2-funding',
}

const firmSlug = (value = '') => {
  const slug = slugify(value)
  return legacyFirmSlugs[slug.replace(/-/g, '')] || slug
}

const text = (value = '', limit = 500) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit)

function isoDate(value) {
  const date = value?.toDate?.() || (value?._seconds ? new Date(value._seconds * 1000) : new Date(value || 0))
  return Number.isFinite(date.getTime()) ? date.toISOString() : ''
}

function publicReviewerName(row) {
  const name = text(row.userName || row.reviewerName || row.authorName || row.displayName || 'Anonymous Trader', 80)
  if (name === 'Anonymous Trader') return name
  const parts = name.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? `${parts[0]} ${parts.at(-1)[0]}.` : parts[0]
}

function sanitizeProgram(program = {}) {
  const allowed = [
    'program', 'name', 'title', 'model', 'target', 'profitTarget', 'phase1', 'phaseOneTarget',
    'dailyLoss', 'dailyDrawdown', 'dailyLossLimit', 'maxDrawdown', 'overallDrawdown', 'maximumLoss',
    'minimumDays', 'minDays', 'profitSplit', 'split', 'payoutCycle', 'firstPayout', 'leverage',
  ]
  return Object.fromEntries(allowed.map((key) => [key, text(program[key], 120)]).filter(([, value]) => value))
}

function sanitizeRuleSections(sections = {}) {
  return Object.entries(sections).slice(0, 8).map(([key, section]) => ({
    key: slugify(key),
    title: text(section?.title || key, 100),
    rules: (Array.isArray(section?.rules) ? section.rules : []).slice(0, 12).map((rule) => ({
      title: text(rule?.title || rule?.label || rule?.name, 120),
      text: text(rule?.text || rule?.value || rule?.description, 260),
    })).filter((rule) => rule.title || rule.text),
  })).filter((section) => section.rules.length)
}

function sanitizeProgramRules(programRules = {}) {
  return Object.entries(programRules).slice(0, 16).reduce((acc, [key, program]) => {
    const slug = slugify(program?.slug || key || program?.program || program?.title || program?.name);
    if (!slug) return acc;
    acc[slug] = {
      slug,
      program: text(program?.program || program?.name || program?.title || program?.model || key, 120),
      title: text(program?.title || `${program?.program || key} Challenge Rules`, 140),
      desc: text(program?.desc || program?.description, 240),
      notice: text(program?.notice, 180),
      rules: (Array.isArray(program?.rules) ? program.rules : []).slice(0, 16).map((rule) => ({
        title: text(rule?.title || rule?.label || rule?.name, 120),
        text: text(rule?.text || rule?.value || rule?.description, 260),
      })).filter((rule) => rule.title || rule.text),
    };
    return acc;
  }, {});
}

const contentSources = [
  ['prop-news', 'propNewsPosts', 'news', 'Prop News'],
  ['trading-guides', 'tradingGuidesPosts', 'trading-guides', 'Trading Guides'],
  ['funding-strategies', 'fundingStrategiesPosts', 'funding-strategies', 'Funding Strategies'],
  ['trading-psychology', 'tradingPsychologyPosts', 'trading-psychology', 'Trading Psychology'],
  ['beginner-tutorials', 'beginnerTutorialsPosts', 'beginner-tutorials', 'Beginner Tutorials'],
]

function sanitizeContentPost(document, row, type, routeBase, sectionName) {
  const slug = slugify(row.slug || document.id || row.title)
  const paragraphs = Array.from({ length: 6 }, (_, index) => text(row[`paragraph${index + 1}`], 3500))
  const subheadings = Array.from({ length: 6 }, (_, index) => text(row[`subheading${index + 1}`], 180))
  return {
    id: document.id,
    type,
    routeBase,
    sectionName,
    slug,
    title: text(row.title, 180),
    category: text(row.category || sectionName, 100),
    excerpt: text(row.excerpt, 700),
    content: text(row.content, 18000),
    paragraphs,
    subheadings,
    author: text(row.author || 'Rank My Prop Editorial', 100),
    reviewedBy: text(row.reviewedBy || 'auto', 40),
    verifiedBy: text(row.verifiedBy || 'none', 40),
    seoTitle: text(row.seoTitle, 180),
    seoDescription: text(row.seoDescription, 500),
    coverImage: text(row.coverImage || row.thumbUrl || row.thumbnail, 800),
    readTime: Math.max(1, Math.round(Number(row.readTime) || 6)),
    publishedAt: isoDate(row.publishedAt || row.publishDate || row.createdAt),
    updatedAt: isoDate(row.updatedAt || row.createdAt),
  }
}

async function loadEvidence() {
  const { initializeApp } = await import('firebase/app')
  const { collection, getDocs, getFirestore, limit, query, where } = await import('firebase/firestore')
  const db = getFirestore(initializeApp(firebaseConfig, `rmp-seo-build-${Date.now()}`))

  const [approvedReviews, firmsSnapshot, offersSnapshot, ...contentSnapshots] = await Promise.all([
    getDocs(query(collection(db, 'reviews'), where('status', '==', 'Approved'), limit(1200))),
    getDocs(query(collection(db, 'firms'), limit(500))),
    getDocs(query(collection(db, 'offers'), limit(500))),
    ...contentSources.map(([, collectionName]) => getDocs(query(collection(db, collectionName), limit(1000)))),
  ])

  const reviews = {}
  approvedReviews.docs.forEach((document) => {
    const row = document.data()
    const slug = firmSlug(row.firmSlug || row.firmName || row.firm)
    if (!slug) return
    reviews[slug] ||= []
    const proofUrls = Array.isArray(row.proofUrls) ? row.proofUrls.filter((url) => /^https:\/\//i.test(String(url))) : []
    reviews[slug].push({
      id: document.id,
      reviewer: publicReviewerName(row),
      title: text(row.reviewTitle || row.title, 120),
      body: text(row.reviewText || row.review || row.text, 700),
      rating: Math.max(0, Math.min(5, Number(row.rating) || 0)),
      program: text(row.program || row.challengeType, 100),
      accountSize: text(row.accountSize || row.accountBalance, 80),
      payoutCount: Math.max(0, Math.round(Number(row.payoutCount) || 0)),
      fundingPeriod: text(row.fundingPeriod || row.fundedPeriod || row.timeToFund, 80),
      pros: text(row.pros || row.prosText || row.reviewPros, 240),
      cons: text(row.cons || row.consText || row.reviewCons, 240),
      proofUrl: proofUrls[0] || '',
      datePublished: isoDate(row.createdAt || row.updatedAt),
    })
  })
  Object.values(reviews).forEach((rows) => rows.sort((a, b) => b.datePublished.localeCompare(a.datePublished)))

  const firms = {}
  firmsSnapshot.docs.forEach((document) => {
    const row = document.data()
    const slug = firmSlug(row.slug || document.id || row.name)
    if (!slug || row.active === false) return
    firms[slug] = {
      slug,
      name: text(row.name || document.id, 120),
      website: text(row.website, 240),
      buyLink: text(row.buyLink || row.website, 400),
      country: text(row.country || 'Global', 100),
      tags: (Array.isArray(row.tags) ? row.tags : Array.isArray(row.markets) ? row.markets : []).map((value) => text(value, 80)).filter(Boolean).slice(0, 12),
      bio: text(row.bio || row.overviewShort || row.overviewLong, 400),
      logo: text(row.logo, 500),
      verified: Boolean(row.verified || row.payoutAssurance),
      showFirmProfile: row.showFirmProfile !== false,
      showHomeTable: row.showHomeTable !== false,
      showListed: row.showListed !== false,
      showRules: row.showRules !== false,
      showReviews: row.showReviews !== false,
      showOffers: row.showOffers !== false,
      payoutCycle: text(row.cardMetrics?.payoutCycle || row.payoutCycle, 100),
      programs: (Array.isArray(row.challengesPanelData?.programs) ? row.challengesPanelData.programs : []).map(sanitizeProgram).filter((program) => Object.keys(program).length),
      ruleSections: sanitizeRuleSections(row.rulesPanelData?.sections),
      programRules: sanitizeProgramRules(row.rulesPanelData?.programRules),
      updatedAt: isoDate(row.updatedAt),
    }
  })

  const slugAliases = { qtfunded: 'qt-funded', 'funded-fun': 'funded-fun' }
  const offers = {}
  offersSnapshot.docs.forEach((document) => {
    const row = document.data()
    if (row.active === false) return
    const rawSlug = firmSlug(row.slug || row.firmSlug || row.firmId || row.name || document.id)
    const slug = slugAliases[rawSlug] || rawSlug
    if (!slug) return
    const firm = firms[slug] || {}
    if (firm.showOffers === false) return
    offers[slug] = {
      slug,
      name: text(row.name || row.firmName || firm.name || slug, 120),
      discount: text(row.discount || row.promoText, 80),
      code: text(row.code || row.couponCode || 'RMP', 80),
      description: text(row.description || `Check the current ${row.name || firm.name || slug} promotion and final checkout terms.`, 400),
      link: text(row.link || row.buyLink || firm.buyLink || firm.website, 500),
      rating: Math.max(0, Math.min(5, Number(row.rating) || 0)),
      reviews: Math.max(0, Math.round(Number(row.reviews || row.reviewCount) || 0)),
    }
  })

  const content = {}
  contentSources.forEach(([type, , routeBase, sectionName], index) => {
    const rows = contentSnapshots[index].docs
      .map((document) => ({ document, row: document.data() }))
      .filter(({ row }) => String(row.status || 'draft').toLowerCase() === 'published' && row.active !== false)
      .map(({ document, row }) => sanitizeContentPost(document, row, type, routeBase, sectionName))
      .filter((post) => post.slug && post.slug.length <= 140 && post.title && post.title.length <= 160 && !post.title.includes('||'))
      .sort((a, b) => (b.updatedAt || b.publishedAt).localeCompare(a.updatedAt || a.publishedAt))
    const seenSlugs = new Set()
    const seenTitles = new Set()
    content[type] = rows.filter((post) => {
      const titleKey = post.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (seenSlugs.has(post.slug) || seenTitles.has(titleKey)) return false
      seenSlugs.add(post.slug)
      seenTitles.add(titleKey)
      return true
    })
  })

  return {
    generatedAt: new Date().toISOString(),
    source: 'Approved Rank My Prop community reviews and published firm CMS records',
    reviews,
    firms,
    offers,
    content,
  }
}

async function main() {
  try {
    const evidence = await loadEvidence()
    fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
    const reviews = Object.values(evidence.reviews).flat()
    const articles = Object.values(evidence.content || {}).flat()
    console.log(`[seo-evidence] captured ${reviews.length} approved reviews, ${reviews.filter((row) => row.proofUrl).length} proof attachments, ${reviews.filter((row) => row.payoutCount > 0).length} payout-confirming reviews, ${Object.keys(evidence.firms).length} firms, ${Object.keys(evidence.offers).length} active offers and ${articles.length} published CMS articles`)
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      console.warn(`[seo-evidence] live refresh failed; using existing sanitized snapshot: ${error.message}`)
      return
    }
    throw error
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error('[seo-evidence] generation failed', error)
  process.exit(1)
})
