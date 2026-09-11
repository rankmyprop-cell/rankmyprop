import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export type RankingFilter = 'Best Overall' | 'Fast Payout' | 'Instant Funding' | 'Lowest Fee'

export type RankedFirm = {
  id: string
  name: string
  logo: string
  initials: string
  score: number
  rating: number
  reviewCount: number
  followers: number
  verified: boolean
  platforms: string[]
  fee: string
  accountSize: string
  payout: string
  profitSplit: string
  maxDrawdown: string
  offer: string
  filters: RankingFilter[]
  href: string
}

type BackendFirm = Record<string, unknown> & {
  id?: string
  slug?: string
  name?: string
  logo?: string
  score?: number
  reviewCount?: number
  followers?: number
  verified?: boolean
  payoutAssurance?: boolean
  platforms?: string[]
  promoText?: string
  detailsLink?: string
  cardMetrics?: Record<string, unknown>
  keyMetrics?: Array<Record<string, unknown>>
  firmDetails?: Array<Record<string, unknown>>
  tradingConditions?: Array<Record<string, unknown>>
  evaluationPrograms?: Array<Record<string, unknown>>
  bestCategories?: Record<string, boolean>
  active?: boolean
  publishState?: string
  status?: string
  publishAt?: string
  unpublishUntil?: string
  showListed?: boolean
  showHomeTable?: boolean
  listingType?: string
  ranking?: number
  sortOrder?: number
}

type BackendOffer = Record<string, unknown> & {
  firmId?: string
  slug?: string
  name?: string
  discount?: string
  code?: string
}

const text = (value: unknown) => String(value ?? '').trim()
const key = (value: unknown) => text(value).toLowerCase().replace(/[^a-z0-9]/g, '')

function metric(rows: Array<Record<string, unknown>> | undefined, labels: string[]) {
  if (!Array.isArray(rows)) return ''
  const wanted = labels.map(key)
  const row = rows.find((item) => wanted.some((label) => key(item.label ?? item.title ?? item.name).includes(label)))
  return text(row?.value ?? row?.amount ?? row?.text)
}

function firstProgramValue(rows: Array<Record<string, unknown>> | undefined, fields: string[]) {
  if (!Array.isArray(rows)) return ''
  for (const row of rows) {
    for (const field of fields) {
      const value = text(row[field])
      if (value) return value
    }
  }
  return ''
}

function logoPath(value: unknown) {
  const logo = text(value)
  if (!logo || /^https?:\/\//i.test(logo) || logo.startsWith('/') || logo.startsWith('data:')) return logo
  return `/${logo.replace(/^\.?\//, '')}`
}

function feeText(value: unknown) {
  const fee = text(value)
  if (!fee) return ''
  return /^from\b/i.test(fee) ? fee : `From ${fee}`
}

function offerText(offer: BackendOffer | undefined, firm: BackendFirm) {
  return text(offer?.discount || firm.promoText)
}

function filtersFor(firm: BackendFirm): RankingFilter[] {
  const categories = firm.bestCategories ?? {}
  const filters: RankingFilter[] = ['Best Overall']
  if (categories.fast_payout) filters.push('Fast Payout')
  if (categories.instant_funding) filters.push('Instant Funding')
  if (categories.cheapest) filters.push('Lowest Fee')
  return filters
}

function isVisibleFirm(firm: BackendFirm) {
  if (firm.active === false) return false
  if (firm.showHomeTable === false) return false
  if (!(firm.showListed || text(firm.listingType).toLowerCase() === 'listed')) return false
  const state = text(firm.publishState || firm.status || 'published').toLowerCase()
  if (state === 'draft') return false
  const publishAt = Date.parse(text(firm.publishAt))
  if (Number.isFinite(publishAt) && Date.now() < publishAt) return false
  if (state === 'unpublished') {
    const unpublishUntil = Date.parse(text(firm.unpublishUntil))
    return Number.isFinite(unpublishUntil) && Date.now() >= unpublishUntil
  }
  return true
}

function rankingValue(firm: BackendFirm) {
  const ranking = Number(firm.ranking)
  if (Number.isFinite(ranking) && ranking > 0) return ranking
  const sortOrder = Number(firm.sortOrder)
  return Number.isFinite(sortOrder) && sortOrder > 0 ? sortOrder : Number.MAX_SAFE_INTEGER
}

function normalizeFirm(firm: BackendFirm, offer?: BackendOffer): RankedFirm {
  const card = firm.cardMetrics ?? {}
  const rating = Math.max(0, Math.min(5, Number(firm.score) || 0))
  const name = text(firm.name)
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase()

  return {
    id: text(firm.id || firm.slug || name),
    name,
    logo: logoPath(firm.logo),
    initials,
    score: Number((rating * 2).toFixed(1)),
    rating,
    reviewCount: Math.max(0, Math.round(Number(firm.reviewCount) || 0)),
    followers: Math.max(0, Math.round(Number(firm.followers) || 0)),
    verified: Boolean(firm.verified || firm.payoutAssurance),
    platforms: Array.isArray(firm.platforms) ? firm.platforms.map(text).filter(Boolean) : [],
    fee: feeText(
      card.startingPrice ||
      metric(firm.keyMetrics, ['startingprice', 'price', 'fee']) ||
      metric(firm.firmDetails, ['startingprice', 'price', 'fee', 'challengefee']) ||
      firstProgramValue(firm.evaluationPrograms, ['startingPrice', 'challengeFee', 'price', 'fee']),
    ),
    accountSize:
      metric(firm.keyMetrics, ['maxallocation', 'accountsize', 'allocation']) ||
      metric(firm.firmDetails, ['maxallocation', 'accountsize', 'allocation']) ||
      firstProgramValue(firm.evaluationPrograms, ['allocation', 'accountSize', 'maxAllocation']),
    payout:
      text(card.payoutCycle) ||
      metric(firm.keyMetrics, ['payoutcycle', 'firstpayout', 'payout']) ||
      metric(firm.firmDetails, ['payoutfrequency', 'payoutcycle', 'firstpayout']),
    profitSplit:
      metric(firm.keyMetrics, ['profitsplit', 'split']) ||
      metric(firm.firmDetails, ['profitsplit', 'split']) ||
      firstProgramValue(firm.evaluationPrograms, ['split', 'profitSplit']),
    maxDrawdown:
      metric(firm.tradingConditions, ['maximumdrawdown', 'maxdrawdown', 'overalldrawdown']) ||
      metric(firm.keyMetrics, ['maximumdrawdown', 'maxdrawdown']) ||
      metric(firm.firmDetails, ['maximumdrawdown', 'maxdrawdown']),
    offer: offerText(offer, firm),
    filters: filtersFor(firm),
    href: text(firm.detailsLink) || `/prop-firms/${encodeURIComponent(text(firm.slug || firm.id))}`,
  }
}

export async function loadRankedFirms(): Promise<RankedFirm[]> {
  const [firmsSnapshot, ratingsSnapshot, offersSnapshot] = await Promise.all([
    getDocs(collection(db, 'firms')),
    getDocs(collection(db, 'firmRatingStats')),
    getDocs(collection(db, 'offers')),
  ])

  const ratings = new Map<string, { rating: number; reviewCount: number }>()
  ratingsSnapshot.forEach((document) => {
    const row = document.data()
    const rating = Math.max(0, Math.min(5, Number(row.averageRating ?? row.autoAverageRating) || 0))
    const reviewCount = Math.max(0, Math.round(Number(row.reviewCount ?? row.autoReviewCount) || 0))
    const value = { rating, reviewCount }
    ;[document.id, row.firmSlug, row.firmName].map(key).filter(Boolean).forEach((ratingKey) => ratings.set(ratingKey, value))
  })

  const backendFirms: BackendFirm[] = []
  firmsSnapshot.forEach((document) => {
    const row = { id: document.id, ...document.data() } as BackendFirm
    const stats = ratings.get(key(row.id)) || ratings.get(key(row.slug)) || ratings.get(key(row.name))
    backendFirms.push(stats ? { ...row, score: stats.rating, reviewCount: stats.reviewCount } : row)
  })

  const offers: BackendOffer[] = []
  offersSnapshot.forEach((document) => {
    const row = { id: document.id, ...document.data() } as BackendOffer & { active?: boolean }
    if (row.active !== false) offers.push(row)
  })

  const offersByFirm = new Map<string, BackendOffer>()
  offers.forEach((offer) => {
    ;[offer.firmId, offer.slug, offer.name].map(key).filter(Boolean).forEach((offerKey) => offersByFirm.set(offerKey, offer))
  })

  return backendFirms
    .filter(isVisibleFirm)
    .sort((a, b) => rankingValue(a) - rankingValue(b))
    .map((firm) => normalizeFirm(
      firm,
      offersByFirm.get(key(firm.id)) || offersByFirm.get(key(firm.slug)) || offersByFirm.get(key(firm.name)),
    ))
    .filter((firm) => firm.id && firm.name)
}
