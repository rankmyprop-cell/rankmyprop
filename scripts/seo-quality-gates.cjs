const compact = (value = '') => String(value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

function contentWordCount(post = {}) {
  const source = [post.content, ...(Array.isArray(post.paragraphs) ? post.paragraphs : [])]
    .map(compact)
    .filter(Boolean)
    .join(' ')
  return source ? source.split(/\s+/).filter(Boolean).length : 0
}

// Very short CMS placeholders stay available to editors and direct visitors,
// but are not promoted to Google as standalone search results.
function isIndexableContentPost(post = {}) {
  return Boolean(post.slug && post.title && post.routeBase && contentWordCount(post) >= 200)
}

function approvedReviewCount(slug = '', evidence = {}) {
  return Array.isArray(evidence.reviews?.[slug]) ? evidence.reviews[slug].length : 0
}

function isIndexableReviewFirm(slug = '', evidence = {}) {
  return approvedReviewCount(slug, evidence) > 0
}

function researchDataPointCount(firm = {}) {
  return ['keyMetrics', 'tradingConditions', 'firmDetails']
    .reduce((sum, key) => sum + (Array.isArray(firm[key]) ? firm[key].length : 0), 0)
}

// Comparison pages are useful only when both sides have enough published data
// to support a real decision. This prevents a combinatorial set of thin pairs.
function isIndexableComparisonFirm(firm = {}, evidence = {}) {
  const slug = String(firm.slug || '').trim()
  if (!slug || firm.showFirmProfile === false || firm.showListed === false) return false
  const bioLength = compact(firm.bio || firm.overviewShort || firm.overviewLong).length
  return researchDataPointCount(firm) >= 12 && (bioLength >= 40 || approvedReviewCount(slug, evidence) > 0)
}

module.exports = {
  approvedReviewCount,
  contentWordCount,
  isIndexableComparisonFirm,
  isIndexableContentPost,
  isIndexableReviewFirm,
  researchDataPointCount,
}
