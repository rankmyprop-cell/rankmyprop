const assert = require('node:assert/strict')
const { handlePublicReviews, publicReview, summarize } = require('../api/_lib/public-reviews')

function reviewDocument(id, overrides = {}) {
  const row = {
    status: 'Approved',
    uid: 'private-user-id',
    email: 'private@example.com',
    userName: 'Test Trader',
    firm: 'Finotive Funding',
    firmSlug: 'finotive-funding',
    rating: 5,
    reviewTitle: 'Fast and clear',
    reviewText: 'A detailed approved review that can be published through the API.',
    payoutCount: 2,
    proofUrls: ['https://res.cloudinary.com/example/proof.png'],
    createdAt: { seconds: 1700000000 },
    updatedAt: { seconds: 1700000100 },
    ...overrides,
  }
  return { id, data: () => row }
}

function mockDatabase(documents) {
  return {
    collection(name) {
      if (name === 'reviews') {
        return {
          where: () => ({ limit: () => ({ get: async () => ({ docs: documents }) }) }),
        }
      }
      if (name === 'firms') {
        return {
          doc: () => ({ get: async () => ({ exists: true, data: () => ({ name: 'Finotive Funding', slug: 'finotive-funding', logo: '/assets/finotive funding logo.webp' }) }) }),
          where: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }),
        }
      }
      throw new Error(`Unexpected collection: ${name}`)
    },
  }
}

function mockResponse() {
  return {
    headers: {},
    statusCode: 0,
    body: null,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value },
    status(code) { this.statusCode = code; return this },
    json(value) { this.body = value; return this },
    end() { return this },
  }
}

async function main() {
  const safe = publicReview(reviewDocument('review-1'))
  assert.equal(safe.reviewer.name, 'Test Trader')
  assert.equal(safe.firm.slug, 'finotive-funding')
  assert.equal(safe.proof.available, true)
  assert.equal(Object.hasOwn(safe, 'uid'), false)
  assert.equal(Object.hasOwn(safe, 'email'), false)
  assert.equal(JSON.stringify(safe).includes('private@example.com'), false)

  const summary = summarize([safe, { ...safe, id: 'review-2', rating: 3, payoutCount: 0, proof: { available: false, urls: [] } }])
  assert.equal(summary.totalApproved, 2)
  assert.equal(summary.averageRating, 4)
  assert.equal(summary.ratingDistribution[5], 1)

  const documents = [
    reviewDocument('approved-1'),
    reviewDocument('pending-1', { status: 'Pending', reviewText: 'Must remain private.' }),
    reviewDocument('other-firm', { firm: 'Another Firm', firmSlug: 'another-firm' }),
  ]
  const response = mockResponse()
  await handlePublicReviews({ method: 'GET', query: { limit: '10' }, params: { firm: 'finotive-funding' }, headers: {} }, response, mockDatabase(documents))
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.ok, true)
  assert.equal(response.body.summary.totalApproved, 1)
  assert.equal(response.body.reviews.length, 1)
  assert.equal(response.body.reviews[0].id, 'approved-1')
  assert.equal(JSON.stringify(response.body).includes('Must remain private.'), false)
  assert.equal(response.headers['access-control-allow-origin'], '*')

  const preflight = mockResponse()
  await handlePublicReviews({ method: 'OPTIONS', query: {}, params: {}, headers: {} }, preflight, mockDatabase([]))
  assert.equal(preflight.statusCode, 204)
  assert.equal(preflight.headers['access-control-allow-methods'], 'GET, OPTIONS')

  console.log('[reviews-api] approved-only filtering, privacy, summaries, pagination and CORS verified')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
